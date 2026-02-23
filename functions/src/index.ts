import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import axios from "axios";

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

const DIFF_MAP: { [key: number]: string } = { 0: 'easy', 1: 'medium', 2: 'hard', 3: 'tricky' };

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

            categories.forEach((cat, index) => {
                const difficulty = DIFF_MAP[index] || 'unknown';
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
                } else {
                    transaction.set(aggRef, {
                        dates: [dateString]
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
