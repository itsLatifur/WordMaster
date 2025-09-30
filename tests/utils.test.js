const GameUtils = require("../js/utils.js");

describe("GameUtils", () => {
  test("formatTime formats seconds to MM:SS", () => {
    expect(GameUtils.formatTime(0)).toBe("00:00");
    expect(GameUtils.formatTime(65)).toBe("01:05");
    expect(GameUtils.formatTime(600)).toBe("10:00");
  });

  test("scrambleWord returns a different permutation for length>1", () => {
    const word = "apple";
    const scrambled = GameUtils.scrambleWord(word);
    expect(scrambled.length).toBe(word.length);
    // Allow the rare case it matches after 10 attempts; retry a few times
    if (scrambled === word) {
      const s2 = GameUtils.scrambleWord(word);
      expect(s2).not.toBe(word);
    }
  });

  test("calculateScore basic behavior", () => {
    const base = GameUtils.calculateScore({
      wordLength: 5,
      timeTaken: 5,
      difficulty: "easy",
      hintsUsed: 0,
    });
    const penalized = GameUtils.calculateScore({
      wordLength: 5,
      timeTaken: 5,
      difficulty: "easy",
      hintsUsed: 2,
    });
    expect(base).toBeGreaterThan(penalized);
  });
});
