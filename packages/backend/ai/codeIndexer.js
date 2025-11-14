// packages/backend/ai/codeIndexer.js
// Simple in-memory code indexer: scans the repo, chunks files, and allows basic term matching
// This is a minimal TF-like scorer without external dependencies.

import fs from "fs";
import path from "path";

const DEFAULT_MAX_FILE_BYTES = 200 * 1024; // 200KB per file cap
const DEFAULT_MAX_CHUNK_CHARS = 1500; // target chunk size
const DEFAULT_EXTS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
]);

const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "coverage",
  "uploads",
  "public",
  "assets",
]);

function* walk(dir) {
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch (_) {
      continue;
    }
    for (const e of entries) {
      const full = path.join(current, e.name);
      if (e.isDirectory()) {
        if (!IGNORE_DIRS.has(e.name)) stack.push(full);
      } else if (e.isFile()) {
        yield full;
      }
    }
  }
}

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[\u0000-\u001f]/g, " ")
    .replace(/[^a-z0-9_\-\.\/#]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function extOf(file) {
  return path.extname(file || "").toLowerCase();
}

function chunkText(text, maxChars = DEFAULT_MAX_CHUNK_CHARS) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(text.length, start + maxChars);
    chunks.push(text.slice(start, end));
    start = end;
  }
  return chunks;
}

export class CodeIndexer {
  constructor({ rootDir, maxFileBytes = DEFAULT_MAX_FILE_BYTES, maxChunkChars = DEFAULT_MAX_CHUNK_CHARS, includeExts = DEFAULT_EXTS } = {}) {
    this.rootDir = rootDir;
    this.maxFileBytes = maxFileBytes;
    this.maxChunkChars = maxChunkChars;
    this.includeExts = includeExts;
    this.chunks = []; // { id, path, startChar, text, tokens, tokenFreq }
    this.docFreq = new Map(); // token -> doc count
    this.ready = false;
    this.error = null;
  }

  build() {
    try {
      const chunks = [];
      for (const file of walk(this.rootDir)) {
        if (!this.includeExts.has(extOf(file))) continue;
        let stat;
        try {
          stat = fs.statSync(file);
        } catch (_) {
          continue;
        }
        if (!stat || stat.size <= 0) continue;
        let content;
        try {
          const fd = fs.openSync(file, "r");
          const size = Math.min(this.maxFileBytes, stat.size);
          const buf = Buffer.alloc(size);
          fs.readSync(fd, buf, 0, size, 0);
          fs.closeSync(fd);
          content = buf.toString("utf8");
        } catch (_) {
          continue;
        }
        const fileChunks = chunkText(content, this.maxChunkChars);
        for (let i = 0; i < fileChunks.length; i++) {
          const text = fileChunks[i];
          const tokens = tokenize(text);
          if (!tokens.length) continue;
          const tokenFreq = new Map();
          for (const t of tokens) tokenFreq.set(t, (tokenFreq.get(t) || 0) + 1);
          chunks.push({ id: `${file}:${i}`, path: file, startChar: i * this.maxChunkChars, text, tokens, tokenFreq });
        }
      }
      // Build doc frequency
      const df = new Map();
      for (const ch of chunks) {
        const uniq = new Set(ch.tokens);
        for (const t of uniq) df.set(t, (df.get(t) || 0) + 1);
      }
      this.chunks = chunks;
      this.docFreq = df;
      this.ready = true;
      this.error = null;
    } catch (err) {
      this.error = err;
      this.ready = false;
    }
  }

  isReady() {
    return this.ready;
  }

  getStatus() {
    return {
      ready: this.ready,
      error: this.error ? String(this.error) : null,
      chunks: this.chunks.length,
    };
  }

  search(query, topK = 8) {
    if (!this.ready) return [];
    const qTokens = tokenize(String(query || ""));
    if (!qTokens.length) return [];
    const qFreq = new Map();
    for (const t of qTokens) qFreq.set(t, (qFreq.get(t) || 0) + 1);

    const N = Math.max(1, this.chunks.length);
    function idf(df) {
      return Math.log((N + 1) / (1 + df)) + 1;
    }

    const scores = [];
    for (const ch of this.chunks) {
      let s = 0;
      for (const [t, qf] of qFreq) {
        const tf = ch.tokenFreq.get(t) || 0;
        if (!tf) continue;
        const df = (this.docFreq.get(t) || 0);
        s += (qf * tf) * idf(df);
      }
      if (s > 0) scores.push([s, ch]);
    }
    scores.sort((a, b) => b[0] - a[0]);
    return scores.slice(0, topK).map(([, ch]) => ch);
  }
}

