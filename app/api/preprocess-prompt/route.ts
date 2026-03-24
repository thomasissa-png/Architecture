import { NextRequest, NextResponse } from "next/server";
import { preprocessCustomPrompt } from "@/lib/custom-prompt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const prompt = body?.prompt;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json({ error: "Prompt requis" }, { status: 400 });
    }

    const result = await preprocessCustomPrompt(prompt.trim());
    return NextResponse.json(result);
  } catch (error) {
    console.error("Preprocess error:", error);
    // Fallback: return the raw prompt
    return NextResponse.json({
      surfacePrompt: "",
      furniturePrompt: "",
      warnings: [],
    });
  }
}
