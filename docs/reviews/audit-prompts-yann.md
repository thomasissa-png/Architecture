# Audit Prompts — Yann Duval, Architecte d'Intérieur

**Date** : 2026-03-31  
**Version prompts** : post-Sprint 22 (builders room-type-specific + stylePrompts split surface/furniture)  
**Fichiers audités** : `components/StylePicker.tsx` (12 styles), `app/api/generate/route.ts` (builders)

---

## Verdict global : 7.8/10

Les prompts sont matures — 22 sprints d'itération se voient. Les surfacePrompts sont bien séparés des furniturePrompts. Les builders par room type (cuisine, salle de bain, chambre, etc.) sont un excellent ajout. Quelques faiblesses persistent.

---

## Évaluation par style

| Style | Surface /10 | Furniture /10 | Différenciation | Points forts | Risques |
|---|---|---|---|---|---|
| **Scandinave** | 8.5 | 8.0 | Forte | PH5 pendant, AJ floor lamp, Wegner chair — pièces iconiques identifiables | "whitewashed ash" pourrait virer trop blanc sur certains rendus |
| **Contemporain** | 7.5 | 7.5 | Moyenne | Sculptural lamp, smoked glass — différencié du Scandinave | Risque de ressembler au Japandi (minimalisme similaire) |
| **Industriel** | 8.0 | 8.0 | Forte | Edison bulb, metal shade, raw concrete — vocabulaire distinctif | OK |
| **Japandi** | 8.5 | 8.5 | Forte | Washi paper pendant, ash + cord seat — fusion Japon/Scandi bien marquée | "balanced asymmetry" est la bonne directive (corrigé Sprint 17) |
| **Art Deco** | 8.0 | 8.0 | Forte | Herringbone parquet, brass geometric pendant, sunburst mirror | Le sol "dark stained" peut être trop sombre sur pièces claires |
| **Mid-Century** | 7.5 | 8.0 | Bonne | Sputnik pendant (déplacé au surfacePrompt), tripod lamp 60s | Le credenza "as background anchor" est bien formulé |
| **Bohème** | 7.0 | 7.5 | Moyenne | Rattan pendant, kilim cushions — mais manque de pièce signature forte | Risque de confusion avec Cosy (textiles similaires) |
| **Méditerranéen** | 8.0 | 7.5 | Forte | Wrought iron lantern, terracotta floor — ancrage géographique clair | "whitewash beams if visible" — bonne directive conditionnelle |
| **Cosy** | 7.5 | 7.5 | Moyenne | String of pearls plant, pleated drum shade — différencié du Bohème | "generously proportioned" mieux que "oversized" (Sprint 17) |
| **Wabi-Sabi** | 8.0 | 8.0 | Forte | Ceramic pendant unglazed, aged concrete floor — esthétique de l'imperfection | Le ratio 30% meublé est bien respecté dans le furniturePrompt |
| **Maximaliste** | 7.0 | 7.5 | Bonne | Dramatic sculptural pendant, polished dark wood | Risque de surcharge visuelle — le "80% fill" peut causer du cramming |
| **Haussmannien** | 7.5 | 7.5 | Forte | Moulures, cheminée, parquet point de Hongrie — ADN français | Pas de luminaire spécifique — utilise le builder générique |

**Moyenne** : 7.8/10

---

## Recommandations

### P1 — Différenciation Bohème vs Cosy
Les deux styles partagent des textiles chaleureux et des plantes. Le Bohème manque d'une pièce mobilier iconique (le Cosy a le string of pearls + pleated drum shade). Ajouter un élément distinctif fort au Bohème : un pouf kilim au sol, un miroir rotin, ou une étagère basse en cannage.

### P1 — Haussmannien sans luminaire dédié
Contrairement aux 11 autres styles, le Haussmannien n'a pas de luminaire spécifique dans son surfacePrompt. Recommandation : "classic French chandelier with crystal drops and gilt bronze arms, 60cm diameter" — le lustre est LA pièce iconique haussmannienne.

### P2 — Maximaliste : risque de cramming
Le ratio 80% fill peut produire des pièces surchargées sur les espaces petits. La directive conditionnelle du builder ("if room appears small, reduce accent pieces") devrait suffire, mais surveiller en production.

### P2 — Contemporain vs Japandi
Les deux styles sont minimalistes avec du bois clair. Le Contemporain devrait affirmer davantage son côté "éditorial" — ajouter une référence à du béton ciré ou un meuble statement en acier noir pour le distinguer du Japandi.

---

**Handoff → @fullstack**
- Fichier produit : `docs/reviews/audit-prompts-yann.md`
- 2 corrections P1 recommandées (Bohème + Haussmannien luminaire)
- 2 observations P2 à surveiller en production
