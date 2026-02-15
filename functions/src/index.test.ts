
import axios from 'axios';
import functionsTest from 'firebase-functions-test';

// Initialize test environment
const testEnv = functionsTest();

// Mock Firestore
const firestoreMock: any = {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    get: jest.fn(),
    set: jest.fn(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
};

// Mock firebase-admin
jest.mock('firebase-admin', () => ({
    initializeApp: jest.fn(),
    firestore: jest.fn(() => firestoreMock),
}));

// Mock axios
jest.mock('axios');

// Mock cors
jest.mock('cors', () => {
    return () => (req: any, res: any, next: any) => {
        next();
    };
});

import { getWords } from './index';

describe('getWords', () => {
    let req: any;
    let res: any;

    beforeEach(() => {
        jest.clearAllMocks();
        req = { query: {} };
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            set: jest.fn(),
            getHeader: jest.fn(),
        };
    });

    afterAll(() => {
        testEnv.cleanup();
    });

    test('should NOT scrape even if date is today and missing in DB (new behavior)', async () => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;

        req.query.date = todayStr;

        // Mock DB to return empty for the specific date
        firestoreMock.doc.mockReturnValue({
            get: jest.fn().mockResolvedValue({ exists: false, data: () => null }),
        });

        // Invoke the function
        (getWords as any)(req, res);

        // Wait for response
        await waitForResponse(res);

        // Verify scraping did NOT happen
        expect(axios.get).not.toHaveBeenCalled();
        // The implementation calls 404
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith('Game not found');
    });

    test('should return 404 and NOT scrape if date is NOT today and missing in DB', async () => {
        req.query.date = '2000-01-01'; // Definitely not today

        firestoreMock.doc.mockReturnValue({
            get: jest.fn().mockResolvedValue({ exists: false, data: () => null }),
        });

        (getWords as any)(req, res);

        await waitForResponse(res);

        expect(axios.get).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith('Game not found');
    });

    test('should return 400 for invalid date format', async () => {
        req.query.date = 'invalid-date';

        (getWords as any)(req, res);

        await waitForResponse(res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith('Invalid date format. Expected YYYY-MM-DD');
    });
});

async function waitForResponse(res: any) {
    return new Promise<void>((resolve, reject) => {
        let retries = 0;
        const interval = setInterval(() => {
            if (res.json.mock.calls.length > 0 || res.send.mock.calls.length > 0) {
                clearInterval(interval);
                resolve();
            }
            retries++;
            if (retries > 50) {
                clearInterval(interval);
                reject(new Error('Response not sent in time'));
            }
        }, 10);
    });
}
