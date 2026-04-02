import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Reuse singleton across requests
let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

/**
 * POST /api/validate-image
 * Vision pre-check: verifies that an uploaded photo depicts a room or interior/exterior space.
 * Non-blocking — fail-open on any error (returns isRoom: true).
 * Cost: ~$0.001 per call (GPT-4.1-mini vision).
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === "..." || apiKey.startsWith("sk_test_")) {
      // No valid API key — fail open
      return NextResponse.json({ isRoom: true });
    }

    const body = await request.json();
    const { image } = body as { image?: string };

    if (!image || !image.startsWith("data:image/")) {
      return NextResponse.json({ isRoom: true });
    }

    const client = getClient();

    // 3s timeout via AbortController
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
      const response = await client.chat.completions.create(
        {
          model: "gpt-4.1-mini",
          max_tokens: 3,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: { url: image, detail: "low" },
                },
                {
                  type: "text",
                  text: "Is this a photo of a room, interior space, or exterior space (garden, terrace, balcony, facade)? Answer ONLY 'yes' or 'no'.",
                },
              ],
            },
          ],
        },
        { signal: controller.signal }
      );

      clearTimeout(timeout);

      const answer = response.choices?.[0]?.message?.content?.trim().toLowerCase() ?? "";
      const isRoom = answer.startsWith("yes");

      return NextResponse.json({ isRoom });
    } catch {
      clearTimeout(timeout);
      // Timeout or API error — fail open
      return NextResponse.json({ isRoom: true });
    }
  } catch {
    // Parse error or unexpected — fail open
    return NextResponse.json({ isRoom: true });
  }
}
