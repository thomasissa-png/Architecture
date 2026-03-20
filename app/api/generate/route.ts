import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import Replicate from "replicate";

const SYSTEM_PROMPT_PREFIX =
  "Keep the exact architecture, walls, floors, windows and lighting of the original photo unchanged. Only add furniture, soft furnishings and decorative items consistent with";
const SYSTEM_PROMPT_SUFFIX =
  "Do not alter proportions, perspective or structural elements. The result should look like a professionally staged real estate photo.";

function buildPrompt(stylePrompt: string): string {
  return `${SYSTEM_PROMPT_PREFIX} the following style: ${stylePrompt}. ${SYSTEM_PROMPT_SUFFIX}`;
}

async function tryOpenAI(
  imageBase64: string,
  prompt: string
): Promise<{ image: string; model: string }> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Convert base64 to a Buffer for the OpenAI API
  const imageBuffer = Buffer.from(imageBase64, "base64");
  const imageFile = new File([imageBuffer], "input.png", {
    type: "image/png",
  });

  const response = await openai.images.edit({
    model: "gpt-image-1",
    image: imageFile,
    prompt,
    n: 1,
    size: "1024x1024",
  });

  const outputBase64 = response.data?.[0]?.b64_json;
  if (!outputBase64) {
    throw new Error("No image returned from OpenAI");
  }

  return {
    image: `data:image/png;base64,${outputBase64}`,
    model: "OpenAI GPT-image-1",
  };
}

async function tryReplicate(
  imageBase64: string,
  prompt: string
): Promise<{ image: string; model: string }> {
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

  const dataUri = `data:image/png;base64,${imageBase64}`;

  const output = await replicate.run(
    "stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc",
    {
      input: {
        image: dataUri,
        prompt: prompt,
        negative_prompt:
          "blurry, distorted, different room, changed architecture, different perspective, unrealistic, cartoon, painting, modified walls, modified windows, modified floor plan",
        prompt_strength: 0.4,
        num_outputs: 1,
        guidance_scale: 7.5,
        num_inference_steps: 30,
      },
    }
  );

  // Replicate returns an array of URLs or ReadableStream
  const outputArray = output as string[];
  if (!outputArray || outputArray.length === 0) {
    throw new Error("No image returned from Replicate");
  }

  // Fetch the image and convert to base64
  const imageUrl = outputArray[0];
  const imageResponse = await fetch(imageUrl);
  const arrayBuffer = await imageResponse.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  return {
    image: `data:image/png;base64,${base64}`,
    model: "Replicate SDXL",
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, stylePrompt } = body as {
      image: string;
      stylePrompt: string;
    };

    if (!image || !stylePrompt) {
      return NextResponse.json(
        { error: "Image et style requis" },
        { status: 400 }
      );
    }

    // Strip data URI prefix if present
    const base64Image = image.replace(/^data:image\/\w+;base64,/, "");

    // Check rough size (base64 is ~33% larger than binary)
    const estimatedSize = (base64Image.length * 3) / 4;
    if (estimatedSize > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "L'image dépasse la taille maximale de 10 Mo" },
        { status: 413 }
      );
    }

    const prompt = buildPrompt(stylePrompt);

    // Try OpenAI first, then Replicate as fallback
    if (process.env.OPENAI_API_KEY) {
      try {
        const result = await tryOpenAI(base64Image, prompt);
        return NextResponse.json(result);
      } catch (openaiError) {
        console.error("OpenAI failed, trying Replicate fallback:", openaiError);
      }
    }

    if (process.env.REPLICATE_API_TOKEN) {
      try {
        const result = await tryReplicate(base64Image, prompt);
        return NextResponse.json(result);
      } catch (replicateError) {
        console.error("Replicate also failed:", replicateError);
        return NextResponse.json(
          {
            error:
              "Les deux services de génération sont indisponibles. Veuillez réessayer plus tard.",
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      {
        error:
          "Aucune clé API configurée. Veuillez configurer OPENAI_API_KEY ou REPLICATE_API_TOKEN.",
      },
      { status: 500 }
    );
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
