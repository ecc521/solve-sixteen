/**
 * Shuffles the elements of an array using the Fisher-Yates (aka Knuth) algorithm.
 * 
 * This function creates a shallow copy of the input array and shuffles the copy in-place,
 * ensuring that the original array remains unmodified.
 * It provides a uniform distribution of permutations.
 *
 * @template T
 * @param {T[]} array - The input array to be shuffled. Can contain elements of any type.
 * @returns {T[]} A new array containing the exact same elements as the input array, but in a randomized order.
 */
export function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}
