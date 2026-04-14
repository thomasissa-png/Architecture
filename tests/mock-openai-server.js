/**
 * Mock OpenAI API server for local testing.
 * Returns realistic responses for plan extraction, lot detection, etc.
 *
 * Start: node tests/mock-openai-server.js
 * Then set OPENAI_BASE_URL=http://localhost:4100/v1 in .env.local
 */
const http = require("http");

const PORT = 4100;

// Realistic extraction result for our test plans
function makeRoom(name, surface, lm, wm, floor, shape, conf, win, doors, bbox) {
  return {
    name_raw: name,
    temp_id: "room_" + name.toLowerCase().replace(/[^a-z0-9]/g, "_"),
    surface_m2: surface,
    dimensions: { length_m: lm, width_m: wm },
    floor: floor,
    shape: shape,
    confidence: conf,
    windows_count: win,
    doors_count: doors,
    ceiling_height_m: 2.5,
    bounding_box: bbox,
    notes: "",
  };
}

const MOCK_EXTRACTION_RDC = {
  building_outline: { x_percent: 12, y_percent: 15, width_percent: 78, height_percent: 70 },
  floors_count: 1,
  total_surface_m2: 41.6,
  scale_reference: "dimensions_on_plan",
  extraction_warnings: [],
  rooms: [
    makeRoom("SdB", 3.6, 2.0, 1.8, 0, "rectangular", 0.9, 0, 1, { x_percent: 25, y_percent: 25, width_percent: 12, height_percent: 18 }),
    makeRoom("Entrée", 2.2, 2.0, 1.1, 0, "rectangular", 0.85, 0, 2, { x_percent: 30, y_percent: 60, width_percent: 10, height_percent: 15 }),
    makeRoom("Chambre", 12.0, 4.0, 3.0, 0, "rectangular", 0.95, 1, 1, { x_percent: 35, y_percent: 20, width_percent: 25, height_percent: 35 }),
    makeRoom("Couloir", 2.0, 2.5, 0.8, 0, "narrow_corridor", 0.8, 0, 2, { x_percent: 38, y_percent: 58, width_percent: 15, height_percent: 10 }),
    makeRoom("Séjour / Cuisine", 21.8, 5.5, 4.0, 0, "rectangular", 0.95, 2, 1, { x_percent: 58, y_percent: 20, width_percent: 30, height_percent: 55 }),
  ],
};

const MOCK_EXTRACTION_R1 = {
  total_surface_m2: 76.0,
  building_outline: { x_percent: 12, y_percent: 15, width_percent: 78, height_percent: 70 },
  floors_count: 1,
  scale_reference: "dimensions_on_plan",
  extraction_warnings: [],
  rooms: [
    makeRoom("Chambre 01", 14.7, 4.2, 3.5, 0, "rectangular", 0.9, 1, 1, { x_percent: 22, y_percent: 18, width_percent: 22, height_percent: 30 }),
    makeRoom("WC", 1.3, 1.3, 1.0, 0, "square", 0.85, 0, 1, { x_percent: 25, y_percent: 48, width_percent: 8, height_percent: 10 }),
    makeRoom("Cellier", 2.2, 1.5, 1.5, 0, "square", 0.8, 0, 1, { x_percent: 33, y_percent: 48, width_percent: 10, height_percent: 10 }),
    makeRoom("SDB", 4.0, 2.0, 2.0, 0, "square", 0.9, 0, 1, { x_percent: 44, y_percent: 18, width_percent: 12, height_percent: 15 }),
    makeRoom("Chambre 02", 6.0, 3.0, 2.0, 0, "rectangular", 0.85, 1, 1, { x_percent: 44, y_percent: 33, width_percent: 14, height_percent: 18 }),
    makeRoom("Séjour / Cuisine", 41.5, 8.3, 5.0, 0, "L-shaped", 0.95, 3, 1, { x_percent: 58, y_percent: 18, width_percent: 30, height_percent: 55 }),
    makeRoom("Entrée", 7.3, 3.5, 2.1, 0, "rectangular", 0.85, 0, 2, { x_percent: 35, y_percent: 60, width_percent: 20, height_percent: 15 }),
  ],
};

// Mock lot detection
const MOCK_LOT_DETECTION = {
  lots: [
    { lot_name: "Bien principal", lot_type: "appartement", plan_index: 0, zone: { x_percent: 15, y_percent: 15, width_percent: 73, height_percent: 70 } },
  ],
  reasoning: "Single residential unit detected on the plan. One lot covering the entire building footprint.",
};

// Simple 1x1 white JPEG as mock generated image (base64)
const MOCK_IMAGE_BASE64 = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYI4Q/SFhSRFJiZHZGclQ0RldDRl2IRwcjNCQpQ0ljcnFBVGRxcnI3EJBTdHp+cHiQkaMzR0RVZnN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+gD/2Q==";

// Mock recommendation
const MOCK_RECOMMENDATION = {
  recommendations: [
    { type: "optimization", title: "Optimisation de l'entrée", description: "L'entrée pourrait être agrandie en déplaçant la cloison vers le couloir, créant un espace d'accueil plus généreux.", impact: "medium", estimated_cost_range: "2000-5000€" },
    { type: "conversion", title: "Aménagement du cellier", description: "Le cellier pourrait être converti en buanderie fonctionnelle avec lave-linge et sèche-linge empilés.", impact: "low", estimated_cost_range: "1000-3000€" },
  ],
  summary: "Ce bien présente un bon potentiel. Les espaces sont bien dimensionnés. Deux optimisations mineures pourraient améliorer la fonctionnalité.",
};

function handleRequest(req, res) {
  let body = "";
  req.on("data", (chunk) => { body += chunk; });
  req.on("end", () => {
    const url = req.url;
    console.log(`[MOCK] ${req.method} ${url}`);

    // CORS
    res.setHeader("Content-Type", "application/json");

    // Chat completions (extraction, lot detection, recommendations, preprocessing)
    if (url.includes("/chat/completions")) {
      let parsed;
      try { parsed = JSON.parse(body); } catch { parsed = {}; }

      const systemContent = JSON.stringify(parsed.messages?.[0]?.content || "").toLowerCase();
      const userContent = JSON.stringify(parsed.messages?.[1]?.content || "").toLowerCase();

      let responseContent;

      if (systemContent.includes("real estate analyst") || systemContent.includes("lot")) {
        // Lot detection
        responseContent = JSON.stringify(MOCK_LOT_DETECTION);
        console.log("[MOCK] → Lot detection response");
      } else if (systemContent.includes("architect") || systemContent.includes("recommendation")) {
        // Architect recommendations
        responseContent = JSON.stringify(MOCK_RECOMMENDATION);
        console.log("[MOCK] → Recommendation response");
      } else if (systemContent.includes("extract") || systemContent.includes("floor plan") || systemContent.includes("bounding_box")) {
        // Room extraction
        responseContent = JSON.stringify(MOCK_EXTRACTION_RDC);
        console.log("[MOCK] → Room extraction response");
      } else if (systemContent.includes("translate") || systemContent.includes("surface") || systemContent.includes("furniture")) {
        // Custom prompt preprocessing
        responseContent = JSON.stringify({ surfacePrompt: "warm white walls", furniturePrompt: "modern sofa" });
        console.log("[MOCK] → Preprocessing response");
      } else if (systemContent.includes("classify") || systemContent.includes("adjust")) {
        // Iteration classification
        responseContent = JSON.stringify({ intent: "adjust", enriched_comment: "Add a grey sofa" });
        console.log("[MOCK] → Iteration classification");
      } else {
        responseContent = JSON.stringify({ result: "ok" });
        console.log("[MOCK] → Generic response");
      }

      res.writeHead(200);
      res.end(JSON.stringify({
        id: "mock-" + Date.now(),
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: parsed.model || "gpt-4.1-mini",
        choices: [{
          index: 0,
          message: { role: "assistant", content: responseContent },
          finish_reason: "stop",
        }],
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
      }));
      return;
    }

    // Responses API (extraction + image generation)
    if (url.includes("/responses")) {
      let parsed;
      try { parsed = JSON.parse(body); } catch { parsed = {}; }

      const inputStr = JSON.stringify(parsed.input || "").toLowerCase();

      // Check if it's an extraction request (has system prompt with "extract" or "floor plan")
      if (inputStr.includes("floor plan") || inputStr.includes("extract") || inputStr.includes("bounding_box")) {
        console.log("[MOCK] → Room extraction (responses API)");
        res.writeHead(200);
        res.end(JSON.stringify({
          id: "mock-resp-" + Date.now(),
          output: [{
            type: "message",
            content: [{ type: "output_text", text: JSON.stringify(MOCK_EXTRACTION_RDC) }],
          }],
        }));
        return;
      }

      // Image generation (home staging)
      console.log("[MOCK] → Image generation (responses API)");
      res.writeHead(200);
      res.end(JSON.stringify({
        id: "mock-resp-" + Date.now(),
        output: [{
          type: "image_generation_call",
          result: MOCK_IMAGE_BASE64,
        }],
      }));
      return;
    }

    // Models list
    if (url.includes("/models")) {
      res.writeHead(200);
      res.end(JSON.stringify({ data: [{ id: "gpt-4.1", object: "model" }] }));
      return;
    }

    // Default 404
    console.log("[MOCK] → 404 Not found:", url);
    res.writeHead(404);
    res.end(JSON.stringify({ error: "Not found" }));
  });
}

const server = http.createServer(handleRequest);
server.listen(PORT, () => {
  console.log(`\n🤖 Mock OpenAI server running on http://localhost:${PORT}`);
  console.log(`   Set OPENAI_BASE_URL=http://localhost:${PORT}/v1 in .env.local\n`);
});
