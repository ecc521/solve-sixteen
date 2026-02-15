import * as admin from 'firebase-admin';

// Initialize with emulator settings
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
admin.initializeApp({ projectId: 'solve-sixteen' });

const db = admin.firestore();

async function populateGames(count: number) {
  console.log(`Populating ${count} games...`);
  const batchSize = 500;
  let batch = db.batch();
  let added = 0;

  for (let i = 0; i < count; i++) {
    const date = new Date(2023, 0, 1 + i);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const dateString = `${yyyy}-${mm}-${dd}`;

    const ref = db.collection('games').doc(dateString);
    batch.set(ref, { date: dateString, words: [] });
    added++;

    if (added % batchSize === 0) {
      await batch.commit();
      batch = db.batch();
      console.log(`Added ${added} games.`);
    }
  }
  if (added % batchSize !== 0) {
    await batch.commit();
  }
  console.log('Population complete.');
}

async function measureBaseline() {
  console.log('Measuring baseline (query all games)...');
  const start = process.hrtime();

  const snapshot = await db.collection('games').select().get();
  const dates = snapshot.docs.map(doc => doc.id).sort().reverse();

  const end = process.hrtime(start);
  const timeMs = (end[0] * 1000 + end[1] / 1e6).toFixed(2);
  console.log(`Baseline: Fetched ${dates.length} dates in ${timeMs}ms`);
  return parseFloat(timeMs);
}

async function measureOptimized() {
  console.log('Measuring optimized (read aggregation)...');

  // First, populate the aggregation document
  const snapshot = await db.collection('games').select().get();
  const dates = snapshot.docs.map(doc => doc.id).sort().reverse();
  await db.collection('aggregations').doc('available_dates').set({ dates });

  const start = process.hrtime();

  const doc = await db.collection('aggregations').doc('available_dates').get();
  const fetchedDates = doc.data()?.dates || [];
  // Simulate sorting cost if needed, but array is likely sorted.
  // Code assumes stored sorted.
  fetchedDates.sort().reverse();

  const end = process.hrtime(start);
  const timeMs = (end[0] * 1000 + end[1] / 1e6).toFixed(2);
  console.log(`Optimized: Fetched ${fetchedDates.length} dates in ${timeMs}ms`);
  return parseFloat(timeMs);
}

async function run() {
  // Check if already populated to save time?
  // But for benchmark consistency, maybe clear DB first?
  // Emulator starts fresh usually unless import data.
  // I'll assume fresh.

  await populateGames(1000);

  // Warm up
  await measureBaseline();

  const baseline = await measureBaseline();
  const optimized = await measureOptimized();

  console.log('--- Results ---');
  console.log(`Baseline: ${baseline}ms`);
  console.log(`Optimized: ${optimized}ms`);
  console.log(`Improvement: ${(baseline / optimized).toFixed(2)}x faster`);
}

run().catch(console.error);
