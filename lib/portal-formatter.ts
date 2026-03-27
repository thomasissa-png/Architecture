/**
 * F6-V2a — Portal formatter: configs + formatting functions for LeBonCoin, SeLoger, Bien'ici.
 *
 * All formatting is deterministic client-side string manipulation.
 * No API calls, no GPT — just truncation + disclaimer injection.
 */

// ─── Types ───────────────────────────────────────────────────────────

export type PortalId = "leboncoin" | "seloger" | "bienici";

export interface PortalConfig {
  id: PortalId;
  label: string;
  titleMaxChars: number;
  descriptionMaxChars: number;
  photosMaxCount: number | null; // null = no known limit
  hasStructuredFields: boolean;
  notes?: string;
}

export interface FormattedTitle {
  text: string;
  truncated: boolean;
  charCount: number;
  maxChars: number;
}

export interface FormattedDescription {
  text: string;
  truncated: boolean;
  charCount: number;
  maxChars: number;
}

export interface StructuredField {
  label: string;
  value: string;
  warning?: boolean; // orange highlight for missing mandatory data
  tooltip?: string;
}

export interface PortalExport {
  portal: PortalConfig;
  title: FormattedTitle;
  description: FormattedDescription;
  structuredFields: StructuredField[];
  photosIncluded: number;
  photosCapped: boolean;
  /** Full copyable text block (title + description + fields if applicable) */
  copyText: string;
}

export interface AnnonceData {
  title: string;
  description: string;
  surface: number | null;
  roomCount: number | null;
  price: number | null;
  city: string;
  propertyType: string;
  isCopro: boolean;
  coproLots?: number | null;
  coproChargesAnnuelles?: number | null;
  dpeClasse?: string | null;
  gesClasse?: string | null;
  totalPhotos: number;
  /** Merchant business name (optional, for contact block in copyText) */
  merchantName?: string | null;
  /** Merchant phone (optional, for contact block in copyText) */
  merchantPhone?: string | null;
}

// ─── Constants ───────────────────────────────────────────────────────

export const AI_DISCLAIMER =
  "— Photos d'intérieur générées par IA, à titre indicatif, non contractuelles.";
// 87 chars

export const PORTAL_CONFIGS: Record<PortalId, PortalConfig> = {
  leboncoin: {
    id: "leboncoin",
    label: "LeBonCoin",
    titleMaxChars: 100,
    descriptionMaxChars: 4000,
    photosMaxCount: 20,
    hasStructuredFields: false,
  },
  seloger: {
    id: "seloger",
    label: "SeLoger",
    titleMaxChars: 100,
    descriptionMaxChars: 2000, // [HYPOTHESE]
    photosMaxCount: null,
    hasStructuredFields: true,
    notes:
      "Limites indicatives — à confirmer dans votre espace SeLoger Pro",
  },
  bienici: {
    id: "bienici",
    label: "Bien'ici",
    titleMaxChars: 100,
    descriptionMaxChars: 3000, // [HYPOTHESE]
    photosMaxCount: null,
    hasStructuredFields: true,
    notes:
      "Limites indicatives — à confirmer dans votre espace Bien'ici Pro",
  },
};

export const PORTAL_IDS: PortalId[] = ["leboncoin", "seloger", "bienici"];

// ─── Text sanitization ──────────────────────────────────────────────

/** Replace typographic characters with ASCII equivalents for portal compatibility. */
function sanitizeText(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'") // curly single quotes -> straight
    .replace(/[\u00AB\u00BB\u201C\u201D]/g, '"') // guillemets + curly double quotes -> straight
    .replace(/<[^>]*>/g, ""); // strip HTML tags
}

/** Remove emojis from text (for SeLoger / Bien'ici professional portals). */
function stripEmojis(text: string): string {
  // Process character by character — remove code points above U+FFFF (surrogate pairs = emoji)
  // plus common symbol ranges (dingbats, misc symbols, arrows)
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // Skip high surrogates (emoji and extended chars above U+FFFF)
    if (code >= 0xd800 && code <= 0xdbff) {
      i++; // skip the low surrogate too
      continue;
    }
    // Skip common symbol/emoji ranges in BMP
    if (
      (code >= 0x2600 && code <= 0x26ff) || // misc symbols
      (code >= 0x2700 && code <= 0x27bf) || // dingbats
      (code >= 0xfe00 && code <= 0xfe0f) || // variation selectors
      code === 0x200d || // zero-width joiner
      code === 0x20e3 // combining enclosing keycap
    ) {
      continue;
    }
    result += text[i];
  }
  return result.replace(/\s{2,}/g, " ").trim();
}

// ─── Formatting functions ────────────────────────────────────────────

/**
 * Truncate title to maxChars, cutting at last whole word.
 * Adds ellipsis character if truncated.
 */
export function formatTitle(
  rawTitle: string,
  maxChars: number
): FormattedTitle {
  const cleaned = sanitizeText(rawTitle.trim());

  if (cleaned.length <= maxChars) {
    return {
      text: cleaned,
      truncated: false,
      charCount: cleaned.length,
      maxChars,
    };
  }

  // Reserve 1 char for ellipsis
  const cutLimit = maxChars - 1;
  const lastSpace = cleaned.lastIndexOf(" ", cutLimit);
  const safeIndex = lastSpace > 0 ? lastSpace : cutLimit;
  const truncated = cleaned.slice(0, safeIndex) + "…";

  return {
    text: truncated,
    truncated: true,
    charCount: truncated.length,
    maxChars,
  };
}

/**
 * Truncate description to fit within portal limit, including the AI disclaimer.
 * Cuts at last paragraph break (\n\n), then sentence boundary (". "), then word boundary.
 */
export function formatDescription(
  rawDescription: string,
  config: PortalConfig,
  options?: { stripEmoji?: boolean }
): FormattedDescription {
  let cleaned = sanitizeText(rawDescription.trim());
  if (options?.stripEmoji) {
    cleaned = stripEmojis(cleaned);
  }

  const disclaimerBlock = "\n\n" + AI_DISCLAIMER;
  const reservedForDisclaimer = disclaimerBlock.length;
  const bodyLimit = config.descriptionMaxChars - reservedForDisclaimer;
  const maxChars = config.descriptionMaxChars;

  // No description — return disclaimer only with placeholder
  if (!cleaned) {
    const text = "Description à rédiger.\n\n" + AI_DISCLAIMER;
    return { text, truncated: false, charCount: text.length, maxChars };
  }

  // Fits without truncation
  if (cleaned.length <= bodyLimit) {
    const text = cleaned + disclaimerBlock;
    return { text, truncated: false, charCount: text.length, maxChars };
  }

  // Need to truncate — try paragraph break first, then sentence, then word
  let cutAt = -1;

  // 1. Last paragraph break before limit
  const lastParagraph = cleaned.lastIndexOf("\n\n", bodyLimit);
  if (lastParagraph > 0) {
    cutAt = lastParagraph;
  }

  // 2. Last sentence boundary before limit
  if (cutAt <= 0) {
    const lastSentence = cleaned.lastIndexOf(". ", bodyLimit);
    if (lastSentence > 0) {
      cutAt = lastSentence + 1; // include the period
    }
  }

  // 3. Last space before limit
  if (cutAt <= 0) {
    const lastSpace = cleaned.lastIndexOf(" ", bodyLimit);
    if (lastSpace > 0) {
      cutAt = lastSpace;
    } else {
      cutAt = bodyLimit; // hard cut as last resort
    }
  }

  const body = cleaned.slice(0, cutAt).trimEnd();
  const text = body + disclaimerBlock;

  return { text, truncated: true, charCount: text.length, maxChars };
}

// ─── Structured fields ───────────────────────────────────────────────

function formatPrice(price: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function buildStructuredFields(
  annonce: AnnonceData
): StructuredField[] {
  const fields: StructuredField[] = [];

  // Property type
  if (annonce.propertyType) {
    fields.push({ label: "Type de bien", value: annonce.propertyType });
  }

  // Surface
  if (annonce.surface != null && annonce.surface > 0) {
    fields.push({ label: "Surface", value: `${annonce.surface} m²` });
  }

  // Room count
  if (annonce.roomCount != null && annonce.roomCount > 0) {
    fields.push({
      label: "Nombre de pièces",
      value: String(annonce.roomCount),
    });
  }

  // Price
  fields.push({
    label: "Prix",
    value:
      annonce.price != null && annonce.price > 0
        ? formatPrice(annonce.price)
        : "Sur demande",
  });

  // City
  if (annonce.city) {
    fields.push({ label: "Ville", value: annonce.city });
  }

  // DPE
  if (annonce.dpeClasse) {
    fields.push({ label: "DPE", value: annonce.dpeClasse });
  } else {
    fields.push({
      label: "DPE",
      value: "À renseigner dans le formulaire",
      warning: true,
      tooltip: "Obligatoire depuis 2022 pour les annonces de vente",
    });
  }

  // GES (if available)
  if (annonce.gesClasse) {
    fields.push({ label: "GES", value: annonce.gesClasse });
  }

  // Copro fields — Bien'ici and SeLoger
  if (annonce.isCopro) {
    if (
      annonce.coproLots != null &&
      annonce.coproChargesAnnuelles != null
    ) {
      fields.push({
        label: "Copropriété",
        value: `${annonce.coproLots} lots — charges : ${annonce.coproChargesAnnuelles.toLocaleString("fr-FR")} €/an`,
      });
    } else if (annonce.coproLots != null) {
      fields.push({
        label: "Copropriété",
        value: `${annonce.coproLots} lots`,
      });
    } else {
      fields.push({
        label: "Copropriété",
        value: "Informations copropriété à renseigner",
        warning: true,
      });
    }
  }

  return fields;
}

// ─── Photo ordering ──────────────────────────────────────────────────

/** Room type priority for photo ordering in portal ZIPs (salon first). */
const ROOM_PRIORITY: Record<string, number> = {
  living_room: 0,
  bedroom: 1,
  kitchen: 2,
  bathroom: 3,
  office: 4,
  dining_room: 5,
  hallway: 6,
  terrace: 7,
  balcony: 8,
  garden: 9,
  other: 10,
};

export function getPhotoSortPriority(roomType: string): number {
  return ROOM_PRIORITY[roomType] ?? 10;
}

// ─── Main export function ────────────────────────────────────────────

export function formatForPortal(
  portalId: PortalId,
  annonce: AnnonceData
): PortalExport {
  const config = PORTAL_CONFIGS[portalId];
  const shouldStripEmoji = portalId === "seloger" || portalId === "bienici";

  const title = formatTitle(annonce.title || "", config.titleMaxChars);

  const description = formatDescription(
    annonce.description || "",
    config,
    { stripEmoji: shouldStripEmoji }
  );

  const structuredFields = config.hasStructuredFields
    ? buildStructuredFields(annonce)
    : [];

  // Photo count cap
  const photosIncluded =
    config.photosMaxCount != null
      ? Math.min(annonce.totalPhotos, config.photosMaxCount)
      : annonce.totalPhotos;
  const photosCapped =
    config.photosMaxCount != null &&
    annonce.totalPhotos > config.photosMaxCount;

  // Build copyable text block
  let copyText = "";

  // Merchant contact line (inserted after description, before structured fields or DPE)
  const merchantParts: string[] = [];
  if (annonce.merchantName) merchantParts.push(annonce.merchantName);
  if (annonce.merchantPhone) merchantParts.push(annonce.merchantPhone);
  const merchantLine = merchantParts.length > 0
    ? `\n\nContact : ${merchantParts.join(" — ")}`
    : "";

  if (config.hasStructuredFields) {
    // SeLoger / Bien'ici format: separated sections
    copyText += title.text + "\n\n";
    copyText += "---\n\n";
    copyText += "Description :\n\n";
    copyText += description.text + merchantLine + "\n\n";
    copyText += "---\n\n";
    copyText += "Champs à saisir dans le formulaire :\n\n";
    for (const field of structuredFields) {
      copyText += `• ${field.label} : ${field.value}\n`;
    }
  } else {
    // LeBonCoin format: continuous text
    copyText += title.text + "\n\n";
    copyText += description.text + merchantLine;
    if (annonce.dpeClasse) {
      copyText += "\n\nDPE : " + annonce.dpeClasse;
    }
  }

  return {
    portal: config,
    title,
    description,
    structuredFields,
    photosIncluded,
    photosCapped,
    copyText: copyText.trim(),
  };
}
