import { NextRequest, NextResponse } from "next/server";
import { createBlogPost } from "@/lib/blog";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

// ─── Auth check ───────────────────────────────────────────────────────────────

function isAuthorized(req: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;

  const headerPassword = req.headers.get("x-admin-password");
  if (headerPassword === adminPassword) return true;

  const url = new URL(req.url);
  const queryPassword = url.searchParams.get("password");
  if (queryPassword === adminPassword) return true;

  return false;
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Tu es un rédacteur expert en home staging virtuel et immobilier IA pour le marché français. Tu rédiges pour le blog de Versiroom, un outil de home staging virtuel par IA.

Ton style : expert, factuel, engageant. Tu mélanges expertise technique et cas d'usage concrets. Tu cites des chiffres quand disponibles. Tu n'inventes jamais de statistiques.

Format de sortie STRICT (JSON) :
{
  "title": "Titre H1 incluant le mot-clé principal",
  "meta_description": "140-160 caractères, mot-clé inclus",
  "content": "Contenu en Markdown avec H2, H3, listes, gras. 800-1500 mots selon le type. Conclure par un CTA vers Versiroom. Inclure 2-3 liens internes vers /marchand, /architecte, /particulier quand pertinent."
}

Le contenu DOIT être original et apporter de la valeur. Pas de remplissage.`;

// ─── Build user prompt by article type ────────────────────────────────────────

function buildUserPrompt(params: {
  type: string;
  keyword: string;
  persona?: string;
  styleId?: string;
  title?: string;
  instructions?: string;
}): string {
  const parts: string[] = [];

  parts.push(`Type d'article : ${params.type}`);
  parts.push(`Mot-clé principal : ${params.keyword}`);
  if (params.title) parts.push(`Titre suggéré : ${params.title}`);
  if (params.persona) parts.push(`Persona cible : ${params.persona}`);
  if (params.styleId) parts.push(`Style de décoration : ${params.styleId}`);
  if (params.instructions) parts.push(`Instructions supplémentaires : ${params.instructions}`);

  switch (params.type) {
    case "pilier":
      parts.push("Rédige un article pilier complet (1200-1500 mots) qui fait référence sur le sujet. Structure claire avec H2/H3, exemples concrets, chiffres factuels.");
      break;
    case "cluster":
      parts.push("Rédige un article cluster ciblé (800-1000 mots) pour une audience spécifique. Cas d'usage concrets, ROI chiffré, parcours utilisateur.");
      break;
    case "comparatif":
      parts.push("Rédige un article comparatif factuel (1000-1200 mots) avec tableau comparatif. Être honnête et factuel, pas de bashing. Mettre en avant les forces de chaque outil.");
      break;
    default:
      parts.push("Rédige un article de blog engageant (800-1200 mots).");
  }

  return parts.join("\n");
}

// ─── Slug generation ──────────────────────────────────────────────────────────

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 190);
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY non configurée" },
      { status: 500 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Body JSON invalide" },
      { status: 400 }
    );
  }

  const type = body.type as string;
  const keyword = body.keyword as string;
  const persona = body.persona as string | undefined;
  const styleId = body.styleId as string | undefined;
  const title = body.title as string | undefined;
  const instructions = body.instructions as string | undefined;

  if (!type || !keyword) {
    return NextResponse.json(
      { error: "Champs requis : type, keyword" },
      { status: 400 }
    );
  }

  const validTypes = ["pilier", "cluster", "comparatif"];
  if (!validTypes.includes(type)) {
    return NextResponse.json(
      { error: `Type invalide. Valeurs acceptées : ${validTypes.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const openai = new OpenAI({ apiKey, timeout: 30_000 });

    const userPrompt = buildUserPrompt({
      type,
      keyword,
      persona,
      styleId,
      title,
      instructions,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      max_tokens: 2000,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      return NextResponse.json(
        { error: "Réponse vide du modèle" },
        { status: 500 }
      );
    }

    let parsed: { title: string; meta_description: string; content: string };
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      return NextResponse.json(
        { error: "Réponse non-JSON du modèle", raw: rawContent },
        { status: 500 }
      );
    }

    const finalTitle = parsed.title || title || keyword;
    const slug = generateSlug(finalTitle);

    const post = await createBlogPost({
      slug,
      title: finalTitle,
      content: parsed.content,
      meta_description: parsed.meta_description || null,
      keyword,
      persona: persona || "tous",
      style_id: styleId || null,
      published: true,
    });

    return NextResponse.json({
      success: true,
      slug: post.slug,
      title: post.title,
      id: post.id,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("[blog/generate] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
