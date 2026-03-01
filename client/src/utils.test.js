import { expect, test, describe } from "bun:test";
import { shuffleArray } from "./utils.js";

describe("shuffleArray", () => {
  test("returns a new array with the same elements", () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffleArray(input);
    expect(result).not.toBe(input);
    expect([...result].sort()).toEqual([...input].sort());
  });

  test("maintains the same length", () => {
    const input = [1, 2, 3];
    const result = shuffleArray(input);
    expect(result.length).toBe(input.length);
  });
});
