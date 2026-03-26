# Verification des 5 bugs marchand — 2026-03-26

## Bug 1 — PDF resilient (`app/api/dossier/[uuid]/pdf/route.ts`)

| Point de controle | Statut |
|---|---|
| Catch block retourne le message specifique | **OK** — L540-546 : `Erreur lors de la generation du PDF : ${errMsg}` |
| Chaque embedImageFromStorage a son propre try/catch | **OK** — Hero (L237-252), Map (L352-367), Before (L418-433), After (L446-462) : chacun dans un try/catch individuel |
| PDF se genere si TOUTES les images manquent | **OK** — embedImageFromStorage retourne null si image absente, chaque appelant teste `if (img)` avant drawImage. Le PDF contient au minimum les pages texte (titre, infos, footer). |

**Verdict : OK**

## Bug 2 — Photos dossier/annonce (`components/DossierPublicView.tsx`)

| Point de controle | Statut |
|---|---|
| Images avec output_image_key vide gerees | **OK** — StorageImage (L69) retourne un fallback SVG si `!imageKey`. Le parent passe `outputImageKey: p.output_image_key \|\| ""` (dossier page L269). |
| Lightbox skip les images avec cles vides | **OK** — L35-46 : `if (photo.inputImageKey)` et `if (photo.outputImageKey)` avant push dans allImages. |
| Index lightbox recalcules | **OK** — L51-57 : lightboxIndexMap construit avec compteur incremente uniquement pour les cles presentes. Les clics (L82, L102) verifient `idx >= 0` avant d'ouvrir. |

**Verdict : OK**

## Bug 3 — Labels FR (`lib/constants.ts` + 3 fichiers)

| Point de controle | Statut |
|---|---|
| translateRoomLabel() existe dans constants.ts | **OK** — L44-49 |
| Contient entryway, wc, laundry, cellar, other | **OK** — ROOM_TYPE_LABELS L30-37 : entryway->Entree, wc->WC, laundry->Buanderie, cellar->Cave, other->Autre |
| Utilisee dans dossier/[uuid]/page.tsx | **OK** — Import L26, usage L248, L268 |
| Utilisee dans DossierResult.tsx | **OK** — Import L5, usage L146, L167, L183, L222 |
| Utilisee dans PDF route.ts | **OK** — Import L26, usage L401 |

**Verdict : OK**

## Bug 4 — URLs (skip confirme)

| Point de controle | Statut |
|---|---|
| Routes existantes intactes | **OK** — `/api/dossier/[uuid]/pdf/route.ts` et `/dossier/[uuid]/page.tsx` presents et fonctionnels. |

**Verdict : OK**

## Bug 5 — Description regenerable (`app/mes-biens/[id]/page.tsx`)

| Point de controle | Statut |
|---|---|
| Bouton visible quand description null | **OK** — L617 : ternaire `description ? (afficher) : (bouton generer)`. Affiche "Aucune description disponible." + bouton. |
| Handler appelle POST /api/merchant/enrich-property | **OK** — L285 : `fetch("/api/merchant/enrich-property", { method: "POST" ... })` |
| Fiche rechargee apres succes | **OK** — L299-306 : PATCH vers `/api/properties/${propertyId}`, puis `setProperty(patchData.property)` met a jour l'etat local. |
| PATCH accepte descriptionGenerated | **OK** — `app/api/properties/[id]/route.ts` L66 : "descriptionGenerated" dans la liste des champs autorises. |

**Verdict : OK**

## Resume

| Bug | Statut |
|---|---|
| 1 — PDF resilient | **OK** |
| 2 — Photos dossier/annonce | **OK** |
| 3 — Labels FR | **OK** |
| 4 — URLs (skip) | **OK** |
| 5 — Description regenerable | **OK** |

5/5 corrections validees. Aucun probleme residuel detecte.
