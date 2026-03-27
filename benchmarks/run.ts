/**
 * Benchmark runner — calls the Versiroom production API for each benchmark image
 *
 * Usage:
 *   npx tsx benchmarks/run.ts --version v26
 *
 * Environment:
 *   BENCHMARK_API_URL  (default: https://architecture-toum92.replit.app/api/generate)
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { BENCHMARK_CONFIG } from "./config";

// ── CLI args ────────────────────────────────────────────────────────

function parseArgs(): { version: string } {
  const args = process.argv.slice(2);
  const versionIdx = args.indexOf("--version");
  if (versionIdx === -1 || !args[versionIdx + 1]) {
    console.error("Usage: npx tsx benchmarks/run.ts --version v26");
    process.exit(1);
  }
  return { version: args[versionIdx + 1] };
}

// ── Style prompt lookup ─────────────────────────────────────────────
// We dynamically import the style lists to get surfacePrompt/furniturePrompt
// for each styleId without duplicating prompts here.

interface StylePrompts {
  surfacePrompt: string;
  furniturePrompt: string;
}

async function loadStylePrompts(
  styleId: string,
  isOutdoor: boolean
): Promise<StylePrompts | null> {
  if (isOutdoor) {
    // Outdoor styles are in lib/outdoor-styles.ts
    const outdoorModule = await import("../lib/outdoor-styles");
    const styles = outdoorModule.OUTDOOR_STYLES as Record<
      string,
      { surfacePrompt?: string; furniturePrompt?: string }
    >;
    const style = styles[styleId];
    if (!style) return null;
    return {
      surfacePrompt: style.surfacePrompt ?? "",
      furniturePrompt: style.furniturePrompt ?? "",
    };
  }

  // Indoor styles from components/StylePicker.tsx
  const pickerModule = await import("../components/StylePicker");
  const styles = pickerModule.STYLES as Array<{
    id: string;
    surfacePrompt: string;
    furniturePrompt: string;
  }>;
  const style = styles.find((s) => s.id === styleId);
  if (!style) return null;
  return {
    surfacePrompt: style.surfacePrompt,
    furniturePrompt: style.furniturePrompt,
  };
}

// ── Image helpers ───────────────────────────────────────────────────

function readImageAsBase64(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mime =
    ext === ".png"
      ? "image/png"
      : ext === ".webp"
        ? "image/webp"
        : "image/jpeg";
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

function getImageDimensions(filePath: string): {
  width: number;
  height: number;
} {
  // Read JPEG/PNG dimensions from header bytes without sharp dependency
  const buffer = fs.readFileSync(filePath);

  // JPEG: search for SOF0 marker (0xFF 0xC0)
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset < buffer.length - 9) {
      if (buffer[offset] !== 0xff) {
        offset++;
        continue;
      }
      const marker = buffer[offset + 1];
      // SOF markers: 0xC0-0xCF except 0xC4 (DHT) and 0xCC (DAC)
      if (
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xcc
      ) {
        const height = buffer.readUInt16BE(offset + 5);
        const width = buffer.readUInt16BE(offset + 7);
        return { width, height };
      }
      // Skip to next marker
      const segmentLength = buffer.readUInt16BE(offset + 2);
      offset += 2 + segmentLength;
    }
  }

  // PNG: width/height at offset 16/20 in IHDR
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { width, height };
  }

  // Fallback — assume landscape standard
  console.warn(
    `[warn] Could not read dimensions from ${filePath}, defaulting to 1536x1024`
  );
  return { width: 1536, height: 1024 };
}

// ── Rate limit delay ────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Types ───────────────────────────────────────────────────────────

interface BenchmarkImageResult {
  id: string;
  style: string;
  roomType: string | null;
  isOutdoor: boolean;
  duration_ms: number;
  success: boolean;
  error?: string;
  model?: string;
  output_path?: string;
  pass1_path?: string;
  pass2_failed?: boolean;
}

interface BenchmarkReport {
  version: string;
  date: string;
  api_url: string;
  results: BenchmarkImageResult[];
  summary: {
    total: number;
    succeeded: number;
    failed: number;
    avg_duration_ms: number;
    alerts: string[];
  };
}

// ── Main ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const { version } = parseArgs();
  const apiUrl =
    process.env.BENCHMARK_API_URL ??
    "https://architecture-toum92.replit.app/api/generate";

  const inputsDir = path.resolve(__dirname, "inputs");
  const baselineDir = path.resolve(__dirname, "baseline", version);
  const historyDir = path.resolve(__dirname, "history");

  // Create output directories
  fs.mkdirSync(baselineDir, { recursive: true });
  fs.mkdirSync(historyDir, { recursive: true });

  console.log(`\n=== Versiroom Benchmark Run ===`);
  console.log(`Version:  ${version}`);
  console.log(`API:      ${apiUrl}`);
  console.log(`Images:   ${BENCHMARK_CONFIG.length}`);
  console.log(`Output:   ${baselineDir}\n`);

  const results: BenchmarkImageResult[] = [];
  const alerts: string[] = [];

  for (let i = 0; i < BENCHMARK_CONFIG.length; i++) {
    const config = BENCHMARK_CONFIG[i];
    const inputPath = path.join(inputsDir, config.input);

    console.log(
      `[${i + 1}/${BENCHMARK_CONFIG.length}] ${config.id} — ${config.styleId}...`
    );

    // Check input file exists
    if (!fs.existsSync(inputPath)) {
      const msg = `Image introuvable: ${inputPath}`;
      console.error(`  ERREUR: ${msg}`);
      results.push({
        id: config.id,
        style: config.styleId,
        roomType: config.roomType,
        isOutdoor: config.isOutdoor,
        duration_ms: 0,
        success: false,
        error: msg,
      });
      continue;
    }

    // Load style prompts
    const stylePrompts = await loadStylePrompts(
      config.styleId,
      config.isOutdoor
    );
    if (!stylePrompts) {
      const msg = `Style inconnu: ${config.styleId}`;
      console.error(`  ERREUR: ${msg}`);
      results.push({
        id: config.id,
        style: config.styleId,
        roomType: config.roomType,
        isOutdoor: config.isOutdoor,
        duration_ms: 0,
        success: false,
        error: msg,
      });
      continue;
    }

    // Read image + dimensions
    const imageBase64 = readImageAsBase64(inputPath);
    const { width, height } = getImageDimensions(inputPath);

    // Build API request body
    const body = {
      image: imageBase64,
      surfacePrompt: stylePrompts.surfacePrompt,
      furniturePrompt: stylePrompts.furniturePrompt,
      styleId: config.styleId,
      withFurniture: true,
      width,
      height,
      roomType: config.roomType,
      isOutdoor: config.isOutdoor,
    };

    const startTime = Date.now();

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(180_000), // 3 min timeout
      });

      const durationMs = Date.now() - startTime;

      if (!response.ok) {
        const errorBody = await response.text();
        const msg = `API ${response.status}: ${errorBody.slice(0, 200)}`;
        console.error(`  ERREUR (${durationMs}ms): ${msg}`);
        results.push({
          id: config.id,
          style: config.styleId,
          roomType: config.roomType,
          isOutdoor: config.isOutdoor,
          duration_ms: durationMs,
          success: false,
          error: msg,
        });

        if (durationMs > 150_000) {
          alerts.push(`${config.id}: durée ${Math.round(durationMs / 1000)}s > 150s`);
        }

        // Wait before next call to respect rate limit
        if (i < BENCHMARK_CONFIG.length - 1) {
          console.log("  Attente 5s (rate limit)...");
          await sleep(5000);
        }
        continue;
      }

      const data = (await response.json()) as {
        image?: string;
        model?: string;
        pass1_key?: string;
        pass2Failed?: boolean;
      };

      // Save output image
      let outputPath: string | undefined;
      if (data.image) {
        outputPath = path.join(baselineDir, `${config.id}_output.png`);
        const outputBuffer = Buffer.from(
          data.image.replace(/^data:image\/\w+;base64,/, ""),
          "base64"
        );
        fs.writeFileSync(outputPath, outputBuffer);
      }

      // Performance alert
      if (durationMs > 150_000) {
        alerts.push(`${config.id}: durée ${Math.round(durationMs / 1000)}s > 150s`);
      }

      const result: BenchmarkImageResult = {
        id: config.id,
        style: config.styleId,
        roomType: config.roomType,
        isOutdoor: config.isOutdoor,
        duration_ms: durationMs,
        success: true,
        model: data.model,
        output_path: outputPath
          ? path.relative(path.resolve(__dirname, ".."), outputPath)
          : undefined,
        pass2_failed: data.pass2Failed,
      };

      results.push(result);

      console.log(
        `  OK (${Math.round(durationMs / 1000)}s) — modèle: ${data.model ?? "inconnu"}${data.pass2Failed ? " [PASSE 2 ÉCHOUÉE]" : ""}`
      );
    } catch (err) {
      const durationMs = Date.now() - startTime;
      const msg =
        err instanceof Error ? err.message : "Erreur inconnue";
      console.error(`  ERREUR (${durationMs}ms): ${msg}`);
      results.push({
        id: config.id,
        style: config.styleId,
        roomType: config.roomType,
        isOutdoor: config.isOutdoor,
        duration_ms: durationMs,
        success: false,
        error: msg,
      });
    }

    // Rate limit: wait 5s between calls
    if (i < BENCHMARK_CONFIG.length - 1) {
      console.log("  Attente 5s (rate limit)...");
      await sleep(5000);
    }
  }

  // ── Build report ────────────────────────────────────────────────

  const succeededResults = results.filter((r) => r.success);
  const avgDuration =
    succeededResults.length > 0
      ? Math.round(
          succeededResults.reduce((sum, r) => sum + r.duration_ms, 0) /
            succeededResults.length
        )
      : 0;

  const report: BenchmarkReport = {
    version,
    date: new Date().toISOString(),
    api_url: apiUrl,
    results,
    summary: {
      total: results.length,
      succeeded: succeededResults.length,
      failed: results.length - succeededResults.length,
      avg_duration_ms: avgDuration,
      alerts,
    },
  };

  // Save report
  const today = new Date().toISOString().split("T")[0];
  const reportPath = path.join(historyDir, `${today}_${version}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");

  // ── Summary ─────────────────────────────────────────────────────

  console.log("\n=== Résumé ===");
  console.log(`Total:     ${report.summary.total}`);
  console.log(`Succès:    ${report.summary.succeeded}`);
  console.log(`Échecs:    ${report.summary.failed}`);
  console.log(`Durée moy: ${Math.round(avgDuration / 1000)}s`);

  if (alerts.length > 0) {
    console.log(`\nALERTES (${alerts.length}):`);
    for (const alert of alerts) {
      console.log(`  - ${alert}`);
    }
  }

  console.log(`\nRapport: ${reportPath}`);
  console.log(`Images:  ${baselineDir}/`);

  // Exit with error code if any failure
  if (report.summary.failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Erreur fatale:", err);
  process.exit(2);
});
