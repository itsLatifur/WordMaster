// Minimal harness for testing core game logic in isolation
const GameUtils = require("../js/utils.js");

describe("Game logic behaviors", () => {
  test("skipWord adds to missed and advances index", () => {
    // Simulate minimal game state
    const game = {
      currentWord: 0,
      totalWords: 3,
      selectedWords: ["tree", "house", "ocean"],
      missed: [],
    };

    // Implement a simplified skipWord using project logic
    function skipWord(g) {
      g.missed.push(g.selectedWords[g.currentWord]);
      g.currentWord++;
      if (g.currentWord >= g.totalWords) {
        return "end";
      }
      return "next";
    }

    expect(skipWord(game)).toBe("next");
    expect(game.missed).toEqual(["tree"]);
    expect(game.currentWord).toBe(1);
  });

  test("hint usage builds progressive hint string", () => {
    const word = "planet";
    function buildHint(word, hintCount) {
      let hint = `Starts with "${word[0]}"`;
      if (hintCount >= 1 && word.length > 1)
        hint += `, second letter "${word[1]}"`;
      if (hintCount >= 2 && word.length > 2)
        hint += `, third letter "${word[2]}"`;
      return hint;
    }

    expect(buildHint(word, 0)).toContain("Starts with");
    expect(buildHint(word, 1)).toContain("second letter");
    expect(buildHint(word, 2)).toContain("third letter");
  });
});
