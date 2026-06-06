/**
 * build.analyze.ts — Bundle analysis using Bun.build() result.outputs
 *
 * Usage:
 *   bun run build.analyze.ts
 *
 * What this demonstrates:
 *   - Running Bun.build() programmatically and inspecting the result object
 *   - Iterating result.outputs (the build manifest)
 *   - Reading BuildArtifact metadata: .path, .size, .kind, .hash, .loader
 */

// ── Run a production build ────────────────────────────────────────────────────
console.log("\n📊  Bun Bundle Analyzer\n");
console.log("   Building…\n");

const result = await Bun.build({
  entrypoints: ["./src/main.ts"],
  outdir:      "./dist",
  target:      "browser",
  format:      "iife",
  sourcemap:   "external",
  minify:      { whitespace: true, identifiers: true, syntax: true },
  naming: {
    entry: "[name].[hash].[ext]",
    chunk: "[name].[hash].[ext]",
    asset: "[name].[hash].[ext]",
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
});

if (!result.success) {
  console.error("❌  Build failed:");
  for (const log of result.logs) console.error(`  • [${log.level}] ${log.message}`);
  process.exit(1);
}

// ── Output manifest table ─────────────────────────────────────────────────────
// result.outputs is a BuildArtifact[] — one entry per generated file.
// Each BuildArtifact exposes the following properties:
//
//   .path    → absolute path of the written file
//   .size    → byte size
//   .kind    → "entry-point" | "chunk" | "sourcemap" | "asset"
//   .hash    → content hash (present when naming pattern uses [hash])
//   .loader  → the Bun loader used for this file: "ts" | "tsx" | "css" | …

const KB = (n: number) => `${(n / 1024).toFixed(2)} KB`;
const cwd = process.cwd();
const rel = (p: string) => p.replace(cwd + "\\", "").replace(cwd + "/", "");

const COL_FILE = 32;
const COL_KIND = 14;
const COL_SIZE = 12;
const RULE = "─".repeat(COL_FILE + COL_KIND + COL_SIZE);

console.log(RULE);
console.log(
  "File".padEnd(COL_FILE) +
  "Kind".padEnd(COL_KIND) +
  "Size".padStart(COL_SIZE),
);
console.log(RULE);

for (const output of result.outputs) {
  const name = rel(output.path);
  const kind = output.kind.replace(/-/g, " ");
  const size = KB(output.size);

  const truncName = name.length > COL_FILE - 1
    ? "…" + name.slice(-(COL_FILE - 2))
    : name;

  console.log(
    truncName.padEnd(COL_FILE) +
    kind.padEnd(COL_KIND) +
    size.padStart(COL_SIZE),
  );
}

console.log(RULE);

// ── Full BuildArtifact metadata ───────────────────────────────────────────────
console.log("\n🔍  BuildArtifact details:\n");

for (const output of result.outputs) {
  console.log(`  📄 ${rel(output.path)}`);
  console.log(`       .kind    = "${output.kind}"`);
  console.log(`       .size    = ${output.size} bytes (${KB(output.size)})`);
  console.log(`       .loader  = "${output.loader}"`);
  console.log(`       .hash    = ${output.hash ? `"${output.hash}"` : "(none)"}`);
  console.log();
}

console.log("✅  Analysis complete.\n");
