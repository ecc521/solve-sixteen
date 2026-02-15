
const { performance } = require('perf_hooks');

// Setup
const ARRAY_SIZE = 1000;
const ITERATIONS = 10000;
const ids = Array.from({ length: ARRAY_SIZE }, (_, i) => i);

// Method 1: Current Implementation (Sort with Math.random)
function benchmarkCurrent() {
  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    const shuffled = [...ids].sort(() => Math.random() - 0.5);
  }
  const end = performance.now();
  return end - start;
}

// Method 2: Fisher-Yates Shuffle
function fisherYatesShuffle(array) {
  let currentIndex = array.length, randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

function benchmarkFisherYates() {
  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    // Note: To be fair, we should clone the array each time like the sort method does
    const copy = [...ids];
    fisherYatesShuffle(copy);
  }
  const end = performance.now();
  return end - start;
}

console.log(`Benchmarking Shuffle (Array Size: ${ARRAY_SIZE}, Iterations: ${ITERATIONS})`);

const durationCurrent = benchmarkCurrent();
console.log(`Current Method (sort): ${durationCurrent.toFixed(2)} ms`);

const durationFY = benchmarkFisherYates();
console.log(`Fisher-Yates Method: ${durationFY.toFixed(2)} ms`);

const speedup = durationCurrent / durationFY;
console.log(`Speedup: ${speedup.toFixed(2)}x`);
