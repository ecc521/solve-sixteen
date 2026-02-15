const express = require('express');
const cors = require('cors');
let { words } = require('./data');
const { getLatestConnections } = require('./dist/scraper');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// API endpoint to get words
app.get('/api/words', (req, res) => {
    // Shuffle the words before sending them? 
    // Usually the game starts shuffled.
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    res.json(shuffled);
});

// API endpoint to validate a guess (optional, but good for security/logic separation)
// For this MVP, we can handle validation on client or server. 
// Let's do a simple validation endpoint.
app.post('/api/validate', (req, res) => {
    const { selectedWords } = req.body; // Array of word strings or IDs
    if (!selectedWords || selectedWords.length !== 4) {
        return res.status(400).json({ valid: false, message: 'Must select exactly 4 words' });
    }

    // Check if they all belong to the same category
    const categories = selectedWords.map(w => w.category);
    const allSame = categories.every(c => c === categories[0]);

    // In a real app we'd look up by ID to prevent cheating, but here we trust the client sends full objects or we look them up.
    // Let's assume the client sends valid word objects or we re-fetch them. 
    // Actually, simpler to just return the category if it's a match.

    if (allSame) {
        return res.json({ valid: true, category: categories[0], items: selectedWords });
    } else {
        // check for "one away" logic could go here too
        return res.json({ valid: false });
    }
});

app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);

    try {
        console.log('Fetching latest NYT Connections data...');
        const latestWords = await getLatestConnections();
        if (latestWords && latestWords.length > 0) {
            words = latestWords;
            console.log('Successfully updated game data from NYT!');
        } else {
            console.log('Using default game data.');
        }
    } catch (error) {
        console.error('Error updating game data:', error);
    }
});


