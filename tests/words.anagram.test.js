const { SAFE_WORDS } = require("../js/words.js");

describe("SAFE_WORDS integrity", () => {
  test("no anagram collisions exist within SAFE_WORDS", () => {
    const bySig = new Map();
    for (const w of SAFE_WORDS) {
      const sig = w.split("").sort().join("");
      if (!bySig.has(sig)) bySig.set(sig, []);
      bySig.get(sig).push(w);
    }
    const collisions = Array.from(bySig.values()).filter(
      (arr) => arr.length > 1
    );
    if (collisions.length) {
      const formatted = collisions.map((arr) => arr.join(", ")).join(" | ");
      throw new Error(`Anagram collisions detected: ${formatted}`);
    }
  });
});
