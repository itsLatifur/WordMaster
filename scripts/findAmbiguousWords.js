#!/usr/bin/env node
/**
 * Find ambiguous words whose letters can form other valid words in the list.
 * Prints a JSON array of suggested ambiguous words, sorted.
 */

const path = require("path");
const fs = require("fs");

// Load words from js/words.js by evaluating the file in a sandbox-ish way
function loadWords() {
  const file = path.join(__dirname, "..", "js", "words.js");
  const code = fs.readFileSync(file, "utf-8");
  const moduleObj = { exports: {} };
  const exportsObj = moduleObj.exports;
  // Execute a small wrapper to populate module.exports from words.js
  const func = new Function(
    "module",
    "exports",
    code + "\nreturn module.exports;"
  );
  const exported = func(moduleObj, exportsObj) || moduleObj.exports;
  // Use the full WORDS list; we want to discover collisions even if they are already excluded
  const words = exported.WORDS || [];
  return words
    .map(String)
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean);
}

function signature(word) {
  return word.split("").sort().join("");
}

function findAmbiguous(words) {
  const map = new Map();
  for (const w of words) {
    const sig = signature(w);
    if (!map.has(sig)) map.set(sig, new Set());
    map.get(sig).add(w);
  }
  const result = new Set();
  for (const [, set] of map) {
    if (set.size >= 2) {
      // All words in this set share letters; mark all as ambiguous
      for (const w of set) result.add(w);
    }
  }
  return Array.from(result).sort();
}

function main() {
  const words = loadWords();
  const ambiguous = findAmbiguous(words);
  // Pretty print as JSON array for easy copy/paste into AMBIGUOUS_WORDS
  process.stdout.write(JSON.stringify(ambiguous, null, 2) + "\n");
}

if (require.main === module) {
  main();
}
