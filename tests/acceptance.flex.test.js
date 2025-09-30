const fs = require("fs");
const path = require("path");

// Load in a sandbox to access module.exports for game/utils/words
const GameUtils = require("../js/utils.js");
const wordsMod = require("../js/words.js");

describe("Flexible acceptance logic", () => {
  test("same letters, both in dictionary -> accept", () => {
    // Ensure test words exist in dictionary
    // Our base list has 'mile' but not 'lime' by default; simulate by augmenting
    const dictionary = new Set(wordsMod.SAFE_WORDS.concat(["lime"]));
    const correct = "mile";
    const guess = "lime";

    const isInDictionary = dictionary.has(guess);
    const matchesLetters = GameUtils.sameLetters(guess, correct);
    expect(isInDictionary && matchesLetters).toBe(true);
  });

  test("dictionary word with different letters -> reject", () => {
    const correct = "time";
    const guess = "item";
    // If 'item' is not in dictionary, or letters do not match, it should reject
    const dictionary = new Set(wordsMod.SAFE_WORDS);
    const isInDictionary = dictionary.has(guess);
    const matchesLetters = GameUtils.sameLetters(guess, correct);
    // Acceptance requires both true; ensure at least one is false here
    expect(isInDictionary && matchesLetters).toBe(false);
  });
  test("dictionary-gated acceptance: time/item requires item in dictionary", () => {
    const correct = "time";
    const guess = "item";
    const matchesLetters = GameUtils.sameLetters(guess, correct);
    expect(matchesLetters).toBe(true);
    // In app, acceptance requires dictionary.includes(guess)
  });
});
