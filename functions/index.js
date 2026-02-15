const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors")({origin: true});

admin.initializeApp();

// Create a reference to the Firestore database
const db = admin.firestore();

// Helper function to scrape and store game data
async function scrapeAndStoreGame(dateString) {
    const url = `https://www.nytimes.com/svc/connections/v2/${dateString}.json`;
    console.log(`Scraping game for ${dateString} from ${url}`);

    try {
        const response = await axios.get(url);
        const data = response.data;

        if (data.status === 'OK') {
            const categories = data.categories;
            const transformedWords = [];
            const diffMap = { 0: 'easy', 1: 'medium', 2: 'hard', 3: 'tricky' };

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

            const gameData = {
                date: dateString,
                words: transformedWords,
                originalData: data
            };

            // Store in Firestore
            await db.collection('games').doc(dateString).set(gameData);
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

exports.scrapeDaily = functions.pubsub.schedule('0 0 * * *')
    .timeZone('America/New_York') // Eastern Time
    .onRun(async (context) => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const dateString = `${yyyy}-${mm}-${dd}`;

        await scrapeAndStoreGame(dateString);
    });

exports.getWords = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            let date = req.query.date;
            let gameData = null;

            if (date) {
                // If a specific date is requested, try to fetch it
                const doc = await db.collection('games').doc(date).get();
                if (doc.exists) {
                    gameData = doc.data();
                } else {
                    // Try to scrape on demand if it's today (fallback)
                    const today = new Date();
                    const yyyy = today.getFullYear();
                    const mm = String(today.getMonth() + 1).padStart(2, '0');
                    const dd = String(today.getDate()).padStart(2, '0');
                    const todayStr = `${yyyy}-${mm}-${dd}`;

                    if (date === todayStr) {
                         gameData = await scrapeAndStoreGame(date);
                    }
                }
            } else {
                // If no date requested, get the most recent game
                const snapshot = await db.collection('games')
                    .orderBy('date', 'desc') // Assuming 'date' field exists and is sortable, or sort by ID if IDs are dates
                    .limit(1)
                    .get();

                if (!snapshot.empty) {
                    gameData = snapshot.docs[0].data();
                    date = snapshot.docs[0].id; // Update date for logging/reference
                } else {
                    // Database empty? Fallback to scraping today
                    const today = new Date();
                    const yyyy = today.getFullYear();
                    const mm = String(today.getMonth() + 1).padStart(2, '0');
                    const dd = String(today.getDate()).padStart(2, '0');
                    const todayStr = `${yyyy}-${mm}-${dd}`;
                    gameData = await scrapeAndStoreGame(todayStr);
                }
            }

            if (gameData) {
                const shuffled = [...gameData.words].sort(() => Math.random() - 0.5);
                res.json(shuffled);
            } else {
                res.status(404).send('Game not found');
            }
        } catch (error) {
            console.error('Error getting game:', error);
            res.status(500).send('Internal Server Error');
        }
    });
});

exports.getAvailableDates = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            // Fetch all document IDs from 'games' collection
            const snapshot = await db.collection('games').select().get();
            const dates = snapshot.docs.map(doc => doc.id).sort().reverse();

            res.json(dates);
        } catch (error) {
            console.error('Error getting available dates:', error);
            res.status(500).send('Internal Server Error');
        }
    });
});
