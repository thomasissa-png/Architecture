/**
 * Benchmark comparison — compares two benchmark runs pixel-by-pixel
 *
 * Usage:
 *   npx tsx benchmarks/compare.ts --current v26 --previous v25
 *
 * Dependencies: pixelmatch, pngjs
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { PNG } from "pngjs";
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const pixelmatch = require("pixelmatch");
import { BENCHMARK_CONFIG } from "./config";

// ── CLI args ────────────────────────────────────────────────────────

function parseArgs(): { current: string; previous: string } {
  const args = process.argv.slice(2);
  const currentIdx = args.indexOf("--current");
  const previousIdx = args.indexOf("--previous");

  if (currentIdx === -1 || !args[currentIdx + 1]) {
    console.error(
      "Usage: npx tsx benchmarks/compare.ts --current v26 --previous v25"
    );
    process.exit(1);
  }
  if (previousIdx === -1 || !args[previousIdx + 1]) {
    console.error(
      "Usage: npx tsx benchmarks/compare.ts --current v26 --previous v25"
    );
    process.exit(1);
  }

  return {
    current: args[currentIdx + 1],
    previous: args[previousIdx + 1],
  };
}

// ── Image loading ───────────────────────────────────────────────────

/**
 * Load an image file (JPEG or PNG) and decode it to raw RGBA pixels via pngjs.
 * For JPEG inputs, we re-encode to PNG in memory using a minimal approach:
 * sharp is already in the project deps so we use it for JPEG→PNG conversion.
 */
async function loadImageAsRGBA(
  filePath: string
): Promise<{ data: Buffer; width: number; height: number } | null> {
  if (!fs.existsSync(filePath)) return null;

  const ext = path.extname(filePath).toLowerCase();
  let pngBuffer: Buffer;

  if (ext === ".png") {
    pngBuffer = fs.readFileSync(filePath);
  } else {
    // JPEG/WEBP: convert to PNG via sharp (already in project deps)
    const sharpModule = await import("sharp");
    const sharpFn = (sharpModule as { default: typeof import("sharp") }).default;
    pngBuffer = await sharpFn(filePath).png().toBuffer();
  }

  const png = PNG.sync.read(pngBuffer);
  return { data: png.data as unknown as Buffer, width: png.width, height: png.height };
}

/**
 * Resize image B to match dimensions of image A using sharp.
 * Required because pixelmatch needs same-size images.
 */
async function resizeToMatch(
  sourcePath: string,
  targetWidth: number,
  targetHeight: number
): Promise<{ data: Buffer; width: number; height: number }> {
  const sharpModule = await import("sharp");
  const sharpFn = (sharpModule as { default: typeof import("sharp") }).default;
  const resized = await sharpFn(sourcePath)
    .resize(targetWidth, targetHeight, { fit: "fill" })
    .png()
    .toBuffer();
  const png = PNG.sync.read(resized);
  return { data: png.data as unknown as Buffer, width: png.width, height: png.height };
}

// ── Pixel diff calculation ──────────────────────────────────────────

interface DiffResult {
  totalPixels: number;
  differentPixels: number;
  percentDifferent: number;
}

function calculatePixelDiff(
  img1: { data: Buffer; width: number; height: number },
  img2: { data: Buffer; width: number; height: number },
  threshold: number = 0.1
): DiffResult {
  const { width, height } = img1;
  const totalPixels = width * height;

  const differentPixels = pixelmatch(
    img1.data,
    img2.data,
    undefined, // no diff output image
    width,
    height,
    { threshold }
  );

  return {
    totalPixels,
    differentPixels,
    percentDifferent: (differentPixels / totalPixels) * 100,
  };
}

// ── Types ───────────────────────────────────────────────────────────

interface ComparisonImageResult {
  id: string;
  style: string;
  change_vs_input_pct: number | null;
  stability_vs_previous_pct: number | null;
  alerts: string[];
}

interface ComparisonReport {
  current_version: string;
  previous_version: string;
  date: string;
  results: ComparisonImageResult[];
  summary: {
    total: number;
    compared: number;
    skipped: number;
    avg_change_pct: number;
    avg_stability_pct: number;
    regression_alerts: number;
    performance_alerts: number;
    alerts: string[];
  };
}

// ── Thresholds ──────────────────────────────────────────────────────

const REGRESSION_THRESHOLD_PCT = 15; // pixel_diff(run_N, run_N-1) > 15% = ALERTE
const PERFORMANCE_THRESHOLD_MS = 150_000; // 150s

// ── Main ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const { current, previous } = parseArgs();

  const inputsDir = path.resolve(__dirname, "inputs");
  const currentDir = path.resolve(__dirname, "baseline", current);
  const previousDir = path.resolve(__dirname, "baseline", previous);
  const historyDir = path.resolve(__dirname, "history");

  // Validate directories exist
  if (!fs.existsSync(currentDir)) {
    console.error(`Dossier baseline introuvable: ${currentDir}`);
    console.error(
      `Lancez d'abord: npx tsx benchmarks/run.ts --version ${current}`
    );
    process.exit(1);
  }

  if (!fs.existsSync(previousDir)) {
    console.error(`Dossier baseline introuvable: ${previousDir}`);
    console.error(
      `Lancez d'abord: npx tsx benchmarks/run.ts --version ${previous}`
    );
    process.exit(1);
  }

  // Load history reports for performance comparison
  const currentReport = loadHistoryReport(historyDir, current);
  const previousReport = loadHistoryReport(historyDir, previous);

  console.log(`\n=== Versimo Benchmark Comparison ===`);
  console.log(`Current:  ${current} (${currentDir})`);
  console.log(`Previous: ${previous} (${previousDir})`);
  console.log(`Images:   ${BENCHMARK_CONFIG.length}\n`);

  const results: ComparisonImageResult[] = [];
  const globalAlerts: string[] = [];
  let regressionAlerts = 0;
  let performanceAlerts = 0;

  for (const config of BENCHMARK_CONFIG) {
    const inputPath = path.join(inputsDir, config.input);
    const currentOutputPath = path.join(currentDir, `${config.id}_output.png`);
    const previousOutputPath = path.join(
      previousDir,
      `${config.id}_output.png`
    );

    console.log(`[${config.id}] ${config.styleId}...`);

    const imageAlerts: string[] = [];
    let changeVsInputPct: number | null = null;
    let stabilityVsPreviousPct: number | null = null;

    // Load current output
    const currentImg = await loadImageAsRGBA(currentOutputPath);
    if (!currentImg) {
      console.log(`  SKIP: output ${current} introuvable`);
      results.push({
        id: config.id,
        style: config.styleId,
        change_vs_input_pct: null,
        stability_vs_previous_pct: null,
        alerts: ["output manquant"],
      });
      continue;
    }

    // 1. Change vs input (how much did the AI change the original?)
    const inputImg = await loadImageAsRGBA(inputPath);
    if (inputImg) {
      let inputToCompare = inputImg;
      // Resize input to match output if dimensions differ
      if (
        inputImg.width !== currentImg.width ||
        inputImg.height !== currentImg.height
      ) {
        inputToCompare = await resizeToMatch(
          inputPath,
          currentImg.width,
          currentImg.height
        );
      }
      const diff = calculatePixelDiff(inputToCompare, currentImg);
      changeVsInputPct = Math.round(diff.percentDifferent * 100) / 100;
      console.log(`  Changement vs input: ${changeVsInputPct}%`);
    }

    // 2. Stability vs previous run
    const previousImg = await loadImageAsRGBA(previousOutputPath);
    if (previousImg) {
      let prevToCompare = previousImg;
      // Resize previous to match current if dimensions differ
      if (
        previousImg.width !== currentImg.width ||
        previousImg.height !== currentImg.height
      ) {
        prevToCompare = await resizeToMatch(
          previousOutputPath,
          currentImg.width,
          currentImg.height
        );
      }
      const diff = calculatePixelDiff(prevToCompare, currentImg);
      stabilityVsPreviousPct =
        Math.round(diff.percentDifferent * 100) / 100;
      console.log(
        `  Différence vs ${previous}: ${stabilityVsPreviousPct}%`
      );

      if (stabilityVsPreviousPct > REGRESSION_THRESHOLD_PCT) {
        const alert = `RÉGRESSION ${config.id}: ${stabilityVsPreviousPct}% de pixels différents vs ${previous} (seuil: ${REGRESSION_THRESHOLD_PCT}%)`;
        imageAlerts.push(alert);
        globalAlerts.push(alert);
        regressionAlerts++;
        console.log(`  ALERTE: ${alert}`);
      }
    } else {
      console.log(`  SKIP stabilité: output ${previous} introuvable`);
    }

    // 3. Performance check from history reports
    if (currentReport && previousReport) {
      const currentResult = currentReport.results.find(
        (r: { id: string }) => r.id === config.id
      );
      const previousResult = previousReport.results.find(
        (r: { id: string }) => r.id === config.id
      );

      if (currentResult?.duration_ms > PERFORMANCE_THRESHOLD_MS) {
        const alert = `PERF ${config.id}: ${Math.round(currentResult.duration_ms / 1000)}s > ${PERFORMANCE_THRESHOLD_MS / 1000}s`;
        imageAlerts.push(alert);
        globalAlerts.push(alert);
        performanceAlerts++;
      }

      if (currentResult && previousResult) {
        const durationDelta =
          currentResult.duration_ms - previousResult.duration_ms;
        if (Math.abs(durationDelta) > 5000) {
          console.log(
            `  Durée: ${Math.round(currentResult.duration_ms / 1000)}s (${durationDelta > 0 ? "+" : ""}${Math.round(durationDelta / 1000)}s vs ${previous})`
          );
        }
      }
    }

    results.push({
      id: config.id,
      style: config.styleId,
      change_vs_input_pct: changeVsInputPct,
      stability_vs_previous_pct: stabilityVsPreviousPct,
      alerts: imageAlerts,
    });
  }

  // ── Build comparison report ─────────────────────────────────────

  const comparedResults = results.filter(
    (r) => r.change_vs_input_pct !== null
  );
  const stabilityResults = results.filter(
    (r) => r.stability_vs_previous_pct !== null
  );

  const avgChangePct =
    comparedResults.length > 0
      ? Math.round(
          (comparedResults.reduce(
            (sum, r) => sum + (r.change_vs_input_pct ?? 0),
            0
          ) /
            comparedResults.length) *
            100
        ) / 100
      : 0;

  const avgStabilityPct =
    stabilityResults.length > 0
      ? Math.round(
          (stabilityResults.reduce(
            (sum, r) => sum + (r.stability_vs_previous_pct ?? 0),
            0
          ) /
            stabilityResults.length) *
            100
        ) / 100
      : 0;

  const report: ComparisonReport = {
    current_version: current,
    previous_version: previous,
    date: new Date().toISOString(),
    results,
    summary: {
      total: results.length,
      compared: comparedResults.length,
      skipped: results.length - comparedResults.length,
      avg_change_pct: avgChangePct,
      avg_stability_pct: avgStabilityPct,
      regression_alerts: regressionAlerts,
      performance_alerts: performanceAlerts,
      alerts: globalAlerts,
    },
  };

  // Save comparison report
  fs.mkdirSync(historyDir, { recursive: true });
  const today = new Date().toISOString().split("T")[0];
  const reportPath = path.join(
    historyDir,
    `${today}_compare_${current}_vs_${previous}.json`
  );
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");

  // ── Summary ─────────────────────────────────────────────────────

  console.log("\n=== Résumé comparaison ===");
  console.log(`Comparés:            ${report.summary.compared}/${report.summary.total}`);
  console.log(`Changement moy:      ${avgChangePct}% (input → output)`);
  console.log(`Stabilité moy:       ${avgStabilityPct}% de pixels diff (${current} vs ${previous})`);
  console.log(`Alertes régression:  ${regressionAlerts}`);
  console.log(`Alertes performance: ${performanceAlerts}`);

  if (globalAlerts.length > 0) {
    console.log(`\nALERTES (${globalAlerts.length}):`);
    for (const alert of globalAlerts) {
      console.log(`  - ${alert}`);
    }
  } else {
    console.log("\nAucune alerte. GO.");
  }

  const verdict =
    regressionAlerts > 0
      ? "RÉGRESSION DÉTECTÉE"
      : performanceAlerts > 0
        ? "GO AVEC ALERTES PERFORMANCE"
        : "GO";

  console.log(`\nVerdict: ${verdict}`);
  console.log(`Rapport: ${reportPath}`);

  if (regressionAlerts > 0) {
    process.exit(1);
  }
}

// ── Helpers ─────────────────────────────────────────────────────────

function loadHistoryReport(
  historyDir: string,
  version: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, any> | null {
  if (!fs.existsSync(historyDir)) return null;

  const files = fs.readdirSync(historyDir);
  // Find the most recent report for this version
  const matching = files
    .filter((f) => f.endsWith(`_${version}.json`) && !f.includes("compare"))
    .sort()
    .reverse();

  if (matching.length === 0) return null;

  const content = fs.readFileSync(
    path.join(historyDir, matching[0]),
    "utf-8"
  );
  return JSON.parse(content);
}

main().catch((err) => {
  console.error("Erreur fatale:", err);
  process.exit(2);
});
