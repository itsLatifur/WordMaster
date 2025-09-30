#!/usr/bin/env node
/**
 * Generate alternates: for each word in WORDS, find other words in a reference
 * list that share the same letter signature and are not blacklisted.
 * Outputs a JSON array suitable for ALTERNATE_WORDS.
 */
const path = require("path");
const fs = require("fs");

function loadWordsModule() {
  const file = path.join(__dirname, "..", "js", "words.js");
  const code = fs.readFileSync(file, "utf-8");
  const moduleObj = { exports: {} };
  const func = new Function(
    "module",
    "exports",
    code + "\nreturn module.exports;"
  );
  return func(moduleObj, moduleObj.exports) || moduleObj.exports;
}

function signature(w) {
  return w.split("").sort().join("");
}

function main() {
  const {
    WORDS = [],
    AMBIGUOUS_WORDS = [],
    ALTERNATE_WORDS = [],
  } = loadWordsModule() || {};
  const blacklist = new Set(AMBIGUOUS_WORDS.map(String));
  const base = Array.from(new Set(WORDS.map(String)));

  // Use the base list as both source and reference (self-anagrams) for simplicity.
  const bySig = new Map();
  for (const w of base) {
    const sig = signature(w.toLowerCase());
    if (!bySig.has(sig)) bySig.set(sig, new Set());
    bySig.get(sig).add(w.toLowerCase());
  }

  const alternates = new Set(ALTERNATE_WORDS.map(String));
  for (const w of base) {
    const sig = signature(w.toLowerCase());
    const group = bySig.get(sig) || new Set();
    for (const alt of group) {
      if (alt !== w.toLowerCase() && !blacklist.has(alt)) {
        alternates.add(alt);
      }
    }
  }

  const out = Array.from(alternates).sort();
  process.stdout.write(JSON.stringify(out, null, 2) + "\n");
}

if (require.main === module) main();
