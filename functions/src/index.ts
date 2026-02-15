import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import axios from "axios";
import cors from "cors";

const allowedOrigins = [
  "https://ecc521.github.io",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const corsHandler = cors({
  origin: allowedOrigins,
});

admin.initializeApp();

// Create a reference to the Firestore database
const db = admin.firestore();

interface Word {
    id: string;
    text: string;
    category: string;
    difficulty: string;
}

interface GameData {
    date: string;
    words: Word[];
    originalData: any;
}

interface NYTCategory {
    title: string;
    cards: { content: string }[];
}

interface NYTResponse {
    status: string;
    categories: NYTCategory[];
}

// Helper function to scrape and store game data
async function scrapeAndStoreGame(dateString: string): Promise<GameData | null> {
    const url = `https://www.nytimes.com/svc/connections/v2/${dateString}.json`;
    console.log(`Scraping game for ${dateString} from ${url}`);

    try {
        const response = await axios.get<NYTResponse>(url);
        const data = response.data;

        if (data.status === 'OK') {
            const categories = data.categories;
            const transformedWords: Word[] = [];
            const diffMap: { [key: number]: string } = { 0: 'easy', 1: 'medium', 2: 'hard', 3: 'tricky' };

            categories.forEach((cat, index) => {
                const difficulty = diffMap[index] || 'unknown';
                const categoryName = cat.title;

                cat.cards.forEach((card, cardIndex) => {
                    transformedWords.push({
                        id: `${index}-${cardIndex}`, // Simple ID logic
                        text: card.content,
                        category: categoryName,
                        difficulty: difficulty
                    });
                });
            });

            const gameData: GameData = {
                date: dateString,
                words: transformedWords,
                originalData: data
            };

            // Store in Firestore
            const gameRef = db.collection('games').doc(dateString);
            const aggRef = db.collection('aggregations').doc('available_dates');

            await db.runTransaction(async (transaction) => {
                const aggDoc = await transaction.get(aggRef);

                transaction.set(gameRef, gameData);

                if (aggDoc.exists) {
                    transaction.update(aggRef, {
                        dates: admin.firestore.FieldValue.arrayUnion(dateString)
                    });
                }
            });
            console.log(`Successfully stored game for ${dateString}`);
            return gameData;
        } else {
            console.error('NYT response status not OK:', data);
            return null;
        }
    } catch (error) {
        console.error(`Error scraping game for ${dateString}:`, error);
        return null;
    }
}

export const scrapeDaily = onSchedule({
    schedule: "5 0 * * *",
    timeZone: "America/Chicago",
    region: "us-central1",
    timeoutSeconds: 30,
}, async (event) => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateString = `${yyyy}-${mm}-${dd}`;

    await scrapeAndStoreGame(dateString);
});

export const getWords = onRequest({ region: "us-central1", timeoutSeconds: 10 }, (req, res) => {
    corsHandler(req, res, async () => {
        try {
            let date = req.query.date as string | undefined;
            let gameData: GameData | null | undefined = null;

            if (date) {
                // Validate date format
                if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                    res.status(400).send('Invalid date format. Expected YYYY-MM-DD');
                    return;
                }

                // If a specific date is requested, try to fetch it
                const doc = await db.collection('games').doc(date).get();
                if (doc.exists) {
                    gameData = doc.data() as GameData;
                }
            } else {
                // If no date requested, get the most recent game
                const snapshot = await db.collection('games')
                    .orderBy('date', 'desc') // Assuming 'date' field exists and is sortable, or sort by ID if IDs are dates
                    .limit(1)
                    .get();

                if (!snapshot.empty) {
                    gameData = snapshot.docs[0].data() as GameData;
                    // Update date for logging/reference - though not strictly used further down
                    date = snapshot.docs[0].id;
                }
            }

            if (gameData) {
                res.json(gameData.words);
            } else {
                res.status(404).send('Game not found');
            }
        } catch (error) {
            console.error('Error getting game:', error);
            res.status(500).send('Internal Server Error');
        }
    });
});

export const getAvailableDates = onRequest({ region: "us-central1", timeoutSeconds: 10 }, (req, res) => {
    corsHandler(req, res, async () => {
        try {
            const aggRef = db.collection('aggregations').doc('available_dates');
            const aggDoc = await aggRef.get();

            let dates: string[] = [];

            if (aggDoc.exists) {
                dates = aggDoc.data()?.dates || [];
            } else {
                // Fallback: Fetch all document IDs from 'games' collection
                const snapshot = await db.collection('games').select().get();
                dates = snapshot.docs.map(doc => doc.id).sort().reverse();

                // Rebuild cache
                await aggRef.set({ dates });
            }

            // Explicitly sort to guarantee reverse chronological order, as arrayUnion order is implementation-dependent
            dates.sort().reverse();

            res.json(dates);
        } catch (error) {
            console.error('Error getting available dates:', error);
            res.status(500).send('Internal Server Error');
        }
    });
});
