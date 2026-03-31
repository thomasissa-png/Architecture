import OpenAI from "openai";

// Timeout for GPT-4.1-mini calls (classify, preprocess).
// These are lightweight chat completions — 15s is generous.
// Without this, a slow GPT-4.1-mini could block the entire iteration indefinitely.
const MINI_TIMEOUT_MS = 15_000;

function withMiniTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timeout after ${MINI_TIMEOUT_MS / 1000}s`)),
      MINI_TIMEOUT_MS
    );
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

/**
 * Pre-processes a custom user prompt:
 * 1. Translates to English
 * 2. Splits into surfacePrompt + furniturePrompt
 * 3. Enriches with dimensions/materials
 * 4. Filters incompatible elements (wall-mounted items)
 */
export async function preprocessCustomPrompt(
  userPrompt: string
): Promise<{ surfacePrompt: string; furniturePrompt: string; warnings: string[] }> {
  // If no API key, return the raw prompt as-is (backward compatible)
  if (!process.env.OPENAI_API_KEY) {
    return { surfacePrompt: userPrompt, furniturePrompt: userPrompt, warnings: [] };
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await withMiniTimeout(openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content: `You are a professional interior designer assistant. Given a user's room styling request (which may be in any language), you must:

1. TRANSLATE everything to English
2. SPLIT into two separate prompts:
   - surfacePrompt: wall color/finish, floor material, ceiling finish, ceiling light fixture ONLY
   - furniturePrompt: freestanding furniture, rugs, plants, decorative objects ONLY
3. ENRICH with specific materials, dimensions (cm), textures, and colors
4. FILTER OUT incompatible elements and list them as warnings:
   - Wall-mounted art, shelving, or decoration → cannot be attached to walls
   - Built-in furniture (kitchen cabinets, bathroom vanities, wardrobes) → not supported in current pipeline
   - Curtains, drapes, blinds → risk of window hallucination
   - Structural modifications (remove wall, add window) → not supported

Rules for surfacePrompt:
- Always name specific floor material (e.g., "light oak wide-plank flooring" not "nice floor")
- Always prescribe a ceiling light fixture by style
- Add "keeping the same overall brightness as the input photo"
- Add "white ceiling finish applied over existing ceiling geometry preserving any vault beams or structural ribs"
- Keep it under 60 words

Rules for furniturePrompt:
- Name specific furniture pieces with dimensions (e.g., "230cm wide sofa")
- Include textures (boucle, linen, velvet, leather) and colors
- Include at least one signature piece unique to the style
- Add "intentional negative space" if the style is minimalist
- Keep it under 80 words

Respond in JSON format ONLY:
{
  "surfacePrompt": "...",
  "furniturePrompt": "...",
  "warnings": ["warning 1", "warning 2"]
}

warnings should be in French (the user's language). Each warning explains what was filtered out and why.`
      },
      {
        role: "user",
        content: userPrompt
      }
    ],
    response_format: { type: "json_object" },
  }), "preprocessCustomPrompt");

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return { surfacePrompt: userPrompt, furniturePrompt: userPrompt, warnings: [] };
  }

  try {
    const parsed = JSON.parse(content);
    return {
      surfacePrompt: parsed.surfacePrompt || userPrompt,
      furniturePrompt: parsed.furniturePrompt || userPrompt,
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
    };
  } catch {
    return { surfacePrompt: userPrompt, furniturePrompt: userPrompt, warnings: [] };
  }
}

// ─── Iteration intent classification ──────────────────────────────────
// Classifies a user comment as "adjust" (add/remove/modify individual items)
// or "restyle" (change entire style / redo everything).

export type IterationIntent = "adjust" | "restyle";

export async function classifyIterationIntent(
  comment: string
): Promise<IterationIntent> {
  if (!process.env.OPENAI_API_KEY) {
    return "adjust"; // Safe default: preserve existing furniture
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await withMiniTimeout(openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0,
      max_tokens: 10,
      messages: [
        {
          role: "system",
          content: `You classify user comments about an AI-generated furnished room image.
Return ONLY "adjust" or "restyle".

"adjust" = the user wants to ADD, REMOVE, or MODIFY specific items while keeping everything else.
Examples: "add a shelf", "remove the lamp", "replace the sofa with a bigger one", "add plants", "change the rug color"

"restyle" = the user wants to completely change the style or redo everything from scratch.
Examples: "change to scandinavian style", "redo everything", "try a different look", "make it more modern", "start over"

If unsure, default to "adjust" (safer — preserves existing furniture).`,
        },
        {
          role: "user",
          content: comment,
        },
      ],
    }), "classifyIterationIntent");

    const content = response.choices[0]?.message?.content?.trim().toLowerCase();
    if (content === "restyle") return "restyle";
    return "adjust"; // Default to adjust for safety
  } catch (err) {
    console.error("classifyIterationIntent failed:", err);
    return "adjust"; // Safe fallback
  }
}

// ─── Iteration comment pre-processing ─────────────────────────────────
// Separate from preprocessCustomPrompt: NO split surface/furniture,
// returns a single enriched modification string.

export interface IterationPreprocessResult {
  enrichedComment: string;
  warnings: string[];
  isExclusive: boolean;
  allowWallMounted: boolean;
}

export async function preprocessIterationComment(
  comment: string,
  styleId: string,
  furniturePrompt: string
): Promise<IterationPreprocessResult> {
  // Fallback: if no API key, return raw comment
  if (!process.env.OPENAI_API_KEY) {
    return { enrichedComment: comment, warnings: [], isExclusive: false, allowWallMounted: false };
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await withMiniTimeout(openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `You are a professional interior designer assistant helping refine a room staging result. The user wants to ADJUST the furniture and decoration — NOT change the room surfaces (walls, floor, ceiling, paint).

Context: the current style is "${styleId}" with this furniture description:
"${furniturePrompt}"

Your job:
1. TRANSLATE the user's comment to English (it may be in French or any language)
2. DETECT EXCLUSIVE INTENT: If the user clearly wants ONLY the mentioned items (e.g., "just add a sofa", "only a coffee table", "juste un canapé", "seulement une table"), set isExclusive to true. The enriched comment should then start with "ONLY:" prefix.
   Keywords indicating exclusive intent — FR: "juste", "seulement", "uniquement", "rien d'autre", "que le/la/les" — EN: "just", "only", "nothing else", "exclusively"
   Also exclusive: user asks for 1-2 specific items without mentioning the rest of the furniture.
   NOT exclusive: "remplacer X par Y", "moins de X", "plus de Y", "tout changer", "ajouter plus de plantes" — these imply modifying an existing set.
3. ENRICH with specific materials, dimensions (cm), textures, and concrete colors that are coherent with the "${styleId}" style
   - Example: if user says "canapé gris" and style is Scandinave → "light grey linen 230cm wide sofa with tapered oak legs"
   - Example: if user says "plus de plantes" → "add a tall fiddle-leaf fig in a white ribbed ceramic pot and a trailing pothos on a side table"
4. FILTER OUT and warn about:
   - Structural changes (add/remove windows, doors, walls) → not possible in refinement mode
   - Surface changes (repaint walls, change floor) → surfaces are locked
   - Radical changes requesting removal of ALL furniture → not supported in refinement
   - Sanitary/plumbing equipment (WC, toilet, bathtub, shower, sink, bidet) → not supported in home staging mode, warn "Versimo est conçu pour le home staging mobilier. Les équipements sanitaires ne sont pas supportés dans ce mode."
   - Curtains, drapes, blinds → risk of window hallucination, always filter these out
   IMPORTANT: If the user explicitly asks for wall-mounted items (shelves, étagères, mirrors, frames, hooks, wall lamps, sconces, wall art), do NOT filter them out. Instead, set allowWallMounted to true and include them in the enrichedComment. Only filter wall-mounted items when the user did NOT ask for them.
5. Keep the enriched comment under 50 words — it will be prepended to the existing furniture prompt
6. Do NOT repeat what's already in the base style furniture prompt — only describe CHANGES

Respond in JSON format ONLY:
{
  "enrichedComment": "...",
  "isExclusive": true/false,
  "allowWallMounted": true/false,
  "warnings": ["warning in French", ...]
}

Set allowWallMounted to true ONLY when the user explicitly requests wall-mounted items (shelves, mirrors, frames, hooks, wall lamps). Otherwise false.
Warnings must be in French. Each warning explains what was filtered and why.`
        },
        {
          role: "user",
          content: comment
        }
      ],
      response_format: { type: "json_object" },
    }), "preprocessIterationComment");

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { enrichedComment: comment, warnings: [], isExclusive: false, allowWallMounted: false };
    }

    const parsed = JSON.parse(content);
    return {
      enrichedComment: parsed.enrichedComment || comment,
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
      isExclusive: parsed.isExclusive === true,
      allowWallMounted: parsed.allowWallMounted === true,
    };
  } catch (err) {
    console.error("preprocessIterationComment failed:", err);
    // Fallback: return raw comment, no blocking
    return { enrichedComment: comment, warnings: [], isExclusive: false, allowWallMounted: false };
  }
}
