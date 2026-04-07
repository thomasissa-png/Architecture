/**
 * Schéma Zod pour le body de POST /api/generate.
 *
 * Objectif : valider strictement les inputs du client AVANT toute logique
 * métier. Un client malveillant ne peut plus envoyer un surfacePrompt de
 * 100KB, un styleId vide, ou un width négatif.
 *
 * Ce schéma est une SPEC EXÉCUTABLE — il documente le contrat d'entrée de
 * l'API, testable en isolation. Le câblage dans route.ts sera fait dans une
 * passe ultérieure : parser le body avec `generateBodySchema.safeParse(body)`
 * et retourner 400 si invalide.
 *
 * Règles métier encodées :
 * - `image` : data URI base64 (jpeg/png/webp), max 20MB encodé (~15MB réel)
 * - `surfacePrompt` et `furniturePrompt` : entre 1 et 5000 caractères
 *   (les prompts construits serveur font ~2000-4000 chars — 5000 donne marge)
 * - `styleId` : string non vide, pas de regex stricte car les IDs custom
 *   et outdoor ont des formats variables (cf STYLES dans StylePicker.tsx)
 * - `width`/`height` : entiers positifs, max 8192 (limite raisonnable 8K)
 * - `iterationComment` : max 1000 caractères (l'utilisateur ne doit pas
 *   coller un roman — la UI limite à 200 chars, 1000 est une marge serveur)
 * - `pass2Only` / `splitMode` : mutuellement partiellement compatibles
 *   (pass2Only nécessite pass1_key, validé par .refine)
 */

import { z } from "zod";

// Limite base64 : ~20MB encodé (1.33x le binaire)
const MAX_IMAGE_BASE64_SIZE = 20 * 1024 * 1024;

const dataUriRegex = /^data:image\/(jpeg|jpg|png|webp);base64,/i;

export const generateBodySchema = z
  .object({
    image: z
      .string()
      .max(MAX_IMAGE_BASE64_SIZE, "Image trop volumineuse (max ~15MB)")
      .refine(
        (val) => dataUriRegex.test(val),
        "Format image invalide — data URI base64 jpeg/png/webp attendu",
      )
      .optional(),

    surfacePrompt: z
      .string()
      .min(1, "surfacePrompt ne peut pas être vide")
      .max(5000, "surfacePrompt trop long (max 5000 caractères)")
      .optional(),

    furniturePrompt: z
      .string()
      .min(1, "furniturePrompt ne peut pas être vide")
      .max(5000, "furniturePrompt trop long (max 5000 caractères)")
      .optional(),

    customPrompt: z
      .string()
      .max(2000, "customPrompt trop long (max 2000 caractères)")
      .optional(),

    styleId: z
      .string()
      .min(1, "styleId requis")
      .max(100, "styleId trop long")
      .default("custom"),

    withFurniture: z.boolean().default(true),

    width: z
      .number()
      .int("width doit être entier")
      .positive("width doit être > 0")
      .max(8192, "width max 8192")
      .optional(),

    height: z
      .number()
      .int("height doit être entier")
      .positive("height doit être > 0")
      .max(8192, "height max 8192")
      .optional(),

    // F1 iteration params
    pass1_key: z.string().min(1).max(500).optional(),
    iterationComment: z
      .string()
      .max(1000, "iterationComment trop long (max 1000 caractères)")
      .optional(),
    previousModifications: z
      .array(z.string().max(1000))
      .max(20, "Trop de modifications précédentes (max 20)")
      .default([]),

    sessionId: z.string().max(200).optional(),

    // F2 room type
    roomType: z.string().max(100).nullable().optional(),

    // F3 outdoor
    isOutdoor: z.boolean().default(false),
    outdoorSubtype: z.string().max(100).nullable().optional(),

    // Split-mode / background pass
    splitMode: z.boolean().default(false),
    pass2Only: z.boolean().default(false),

    userId: z.string().max(200).optional(),

    outputFormat: z
      .enum(["original", "landscape", "portrait"])
      .optional(),
  })
  .refine(
    (data) => {
      // pass2Only nécessite pass1_key
      if (data.pass2Only && !data.pass1_key) return false;
      return true;
    },
    {
      message: "pass2Only=true nécessite pass1_key",
      path: ["pass1_key"],
    },
  )
  .refine(
    (data) => {
      // Une génération normale (pas pass2Only, pas iteration) doit avoir une image
      if (data.pass2Only) return true;
      if (data.iterationComment) return true; // iteration sur pass1_key existante
      return !!data.image;
    },
    {
      message: "image requise pour une nouvelle génération",
      path: ["image"],
    },
  );

export type GenerateBody = z.infer<typeof generateBodySchema>;

/**
 * Parse et valide le body d'une requête POST /api/generate.
 * Retourne un discriminated union { ok: true, data } | { ok: false, errors }
 * pour permettre au handler de répondre 400 sans throw.
 */
export function parseGenerateBody(
  raw: unknown,
):
  | { ok: true; data: GenerateBody }
  | { ok: false; errors: Array<{ path: string; message: string }> } {
  const result = generateBodySchema.safeParse(raw);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  const errors = result.error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
  return { ok: false, errors };
}
