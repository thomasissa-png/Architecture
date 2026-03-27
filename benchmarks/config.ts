/**
 * Benchmark configuration — 7 real input images from production
 *
 * Each entry defines: which image, which style, what to measure.
 * Run with: npx tsx benchmarks/run.ts
 */

export const BENCHMARK_CONFIG = [
  {
    id: "B01",
    input: "B01_murs_violets_convecteur.jpg",
    description: "Pièce vide murs violets, fenêtre haute, convecteur, parquet usé",
    styleId: "scandinavian",
    roomType: null,
    isOutdoor: false,
    gates: ["fenêtre préservée", "convecteur visible", "mur accent respecté", "parquet transformé"],
  },
  {
    id: "B02",
    input: "B02_chantier_placo_cables.jpg",
    description: "Chantier brut: placo blanc, câbles pendants, sol béton, prises rondes",
    styleId: "wabi_sabi",
    roomType: null,
    isOutdoor: false,
    gates: ["câbles nettoyés", "prises masquées", "angle identique", "proportions pièce"],
  },
  {
    id: "B03",
    input: "B03_chantier_brut_prises.jpg",
    description: "Chantier brut angle différent: placo, boîtiers électriques, sol béton",
    styleId: "industrial",
    roomType: null,
    isOutdoor: false,
    gates: ["nettoyage chantier", "géométrie coin murs", "caissons plafond préservés"],
  },
  {
    id: "B04",
    input: "B04_loft_voute_beton.jpg",
    description: "Loft avec voûte béton brut, baies vitrées noires, double volume",
    styleId: "contemporary",
    roomType: null,
    isOutdoor: false,
    gates: ["voûte NON aplatie", "baies vitrées même position", "angle identique", "radiateur visible"],
  },
  {
    id: "B05",
    input: "B05_double_hauteur_verriere.jpg",
    description: "Espace verrière double hauteur, structure métal, baies vitrées, colonne",
    styleId: "cosy",
    roomType: "bedroom_adults",
    isOutdoor: false,
    gates: ["voûte préservée", "baies vitrées identiques", "colonne visible", "structure métal intacte"],
  },
  {
    id: "B06",
    input: "B06_terrasse_outdoor.jpg",
    description: "Terrasse extérieure maison moderne, sol existant, végétation",
    styleId: "contemporain_outdoor",
    roomType: null,
    isOutdoor: true,
    gates: ["architecture maison préservée", "ciel intact", "garde-corps", "arbre existant"],
  },
  {
    id: "B07",
    input: "B07_balcon_outdoor.jpg",
    description: "Balcon étroit, garde-corps métal, boiseries, vue",
    styleId: "cosy_balcon",
    roomType: null,
    isOutdoor: true,
    gates: ["garde-corps préservé", "échelle compact", "passage 60cm", "vue préservée"],
  },
];
