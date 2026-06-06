/**
 * build.ts — Programmatic build script using Bun's bundler API
 *
 * Usage:
 *   bun run build.ts           → development build (sourcemaps, no minification)
 *   bun run build.ts --prod    → production build  (minified, external sourcemaps)
 *
 * This file demonstrates the full Bun.build() API surface:
 *
 *   entrypoints  — which files to start the dependency graph from
 *   outdir       — where to write output files
 *   target       — compilation target: "browser" | "bun" | "node"
 *   format       — module format: "esm" | "cjs" | "iife"
 *   sourcemap    — "none" | "inline" | "linked" | "external"
 *   minify       — boolean OR { whitespace, identifiers, syntax }
 *   splitting    — enable code-splitting into shared chunks
 *   define       — compile-time constant replacement
 *   naming       — control output filenames (supports [name], [hash], [ext])
 *   result       — Bun.build() returns { success, outputs[], logs[] }
 */

// ── Mode detection ─────────────────────────────────────────────────────────────
// We use a --prod CLI argument instead of NODE_ENV= prefix so it works
// natively on Windows PowerShell without cross-env.
const isProd = process.argv.includes("--prod");
const mode = isProd ? "production" : "development";

console.log(`\n🔨  Bun bundler — ${mode} build\n`);

// ── Bun.build() ────────────────────────────────────────────────────────────────
const result = await Bun.build({
  // ── entrypoints ─────────────────────────────────────────────────────────────
  // The root of the dependency graph. Bun will recursively resolve every import
  // from this file and include it in the bundle. You can pass multiple files here
  // for multi-page apps — each gets its own output chunk.
  entrypoints: ["./src/main.ts"],

  // ── outdir ──────────────────────────────────────────────────────────────────
  // All output files land in this directory. Bun creates it if it doesn't exist.
  // Note: use outdir (not outfile) when you have multiple entrypoints or splitting.
  outdir: "./dist",

  // ── target ──────────────────────────────────────────────────────────────────
  // "browser" → bundle for the browser:
  //   - No Node.js built-ins (fs, path, etc.)
  //   - Polyfills browser globals (window, document…)
  //   - Treeshakes dead code aggressively
  // Other options: "bun" (Bun runtime), "node" (Node.js)
  target: "browser",

  // ── format ──────────────────────────────────────────────────────────────────
  // "esm"  → ES Modules (import/export)   ← default for browser target
  // "cjs"  → CommonJS (require/module.exports)
  // "iife" → Immediately Invoked Function Expression (self-contained script)
  //
  // For a plain <script src="bundle.js"> in a browser, "iife" is the safest
  // choice because it doesn't rely on a module loader. We use it here.
  format: "iife",

  // ── sourcemap ───────────────────────────────────────────────────────────────
  // "none"     → no source maps (smallest output)
  // "inline"   → sourcemap embedded as base64 at the bottom of the JS file
  // "linked"   → separate .js.map file, with a //# sourceMappingURL comment
  // "external" → separate .js.map file, NO comment in the JS file
  //
  // Dev: "linked"   → DevTools auto-loads the map via the comment
  // Prod: "external" → map file exists for error tracking (Sentry etc.) but
  //                    doesn't add any weight to the JS served to users
  sourcemap: isProd ? "external" : "linked",

  // ── minify ──────────────────────────────────────────────────────────────────
  // Passing `true` enables all three sub-options.
  // Passing an object gives fine-grained control:
  //   whitespace  → remove spaces, newlines, comments
  //   identifiers → shorten variable/function names (a, b, c…)
  //   syntax      → fold constants, simplify expressions, remove dead branches
  minify: isProd
    ? { whitespace: true, identifiers: true, syntax: true }
    : false,

  // ── splitting ───────────────────────────────────────────────────────────────
  // When true, Bun extracts shared code between multiple entrypoints into
  // separate "chunk" files that browsers can cache independently.
  // With a single entrypoint this has no visible effect, but it's good practice
  // to enable it so the setup is ready when you add more pages.
  splitting: false,

  // ── define ──────────────────────────────────────────────────────────────────
  // Compile-time constant replacement — happens before any code runs.
  // Every occurrence of the key is replaced with the value string (verbatim).
  // This lets tree-shaking eliminate dead branches like:
  //   if (process.env.NODE_ENV === "development") { ... }
  define: {
    "process.env.NODE_ENV": JSON.stringify(mode),
  },

  // ── naming ──────────────────────────────────────────────────────────────────
  // Control the output filename pattern.
  // Tokens: [name] (input name), [hash] (content hash), [ext] (extension)
  //
  // In production we add a content hash for long-lived browser caching:
  //   main.abc123.js → browser re-fetches only when the content actually changes
  // In development we keep the plain name so the HTML doesn't need to change.
  naming: {
    entry: isProd ? "[name].[hash].[ext]" : "[name].[ext]",
    chunk: isProd ? "[name].[hash].[ext]" : "[name].[ext]",
    asset: isProd ? "[name].[hash].[ext]" : "[name].[ext]",
  },
});

// ── Build result / manifest ────────────────────────────────────────────────────
// Bun.build() returns a BuildOutput object:
//   result.success  → boolean
//   result.outputs  → BuildArtifact[] — one entry per generated file
//   result.logs     → BuildMessage[] — warnings and errors
//
// Each BuildArtifact has:
//   .path    → absolute path of the output file
//   .size    → byte size of the file
//   .kind    → "entry-point" | "chunk" | "sourcemap" | "asset"
//   .hash    → content hash (if naming used [hash])
//   .loader  → the loader Bun used ("tsx", "ts", "css", …)

if (!result.success) {
  console.error("❌  Build failed:\n");
  for (const log of result.logs) {
    console.error(` • [${log.level}] ${log.message}`);
  }
  process.exit(1);
}

// ── Print manifest ─────────────────────────────────────────────────────────────
console.log("✅  Build succeeded!\n");
console.log("📦  Output manifest:\n");

const KB = (bytes: number) => (bytes / 1024).toFixed(2) + " KB";

for (const output of result.outputs) {
  const kind = output.kind.padEnd(12);
  const size = KB(output.size).padStart(10);
  // output.path is an absolute path — make it relative for readability
  const relPath = output.path.replace(process.cwd() + "/", "").replace(process.cwd() + "\\", "");
  console.log(`  ${kind}  ${size}   ${relPath}`);
}

// ── Warnings ──────────────────────────────────────────────────────────────────
const warnings = result.logs.filter((l) => l.level === "warning");
if (warnings.length > 0) {
  console.log(`\n⚠️   ${warnings.length} warning(s):`);
  for (const w of warnings) console.warn(`  • ${w.message}`);
}

console.log(`\n🏁  Done.\n`);
