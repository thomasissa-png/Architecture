# Audit v53 — Compatibilite style en passe 1, impact passe 2

Date : 2026-04-05 | Version : v53 | Agent : @ia

## Question 1 : Le style est-il preserve en passe 1 v53 ?

**OUI — le surfacePrompt est correctement injecte et suffisamment haut.**

Structure du prompt assemble (generic fallback, ~220 mots) :
1. PASS1_PREAMBLE_V53 (~85 mots) — structure lock, camera, change-only
2. roomInventory (variable, 0-15 mots)
3. PRESERVATION_V53 (~50 mots) — plafond, poteaux, dalles, lumiere
4. **`Surface style: ${surfacePrompt}.`** (~position mot 135 sur ~220)
5. Accent wall conditional (1 phrase)
6. CLEANUP_V53 (~45 mots)
7. DSLR_LINE (~15 mots)

**Position ~mot 135** : dans la zone de focus de gpt-image-1.5 (le modele perd le fil apres ~200 mots). Le surfacePrompt est lu AVANT les directives de nettoyage, ce qui est correct.

**Contenu des 12 surfacePrompts** : chacun contient les 4 elements requis :
- Couleur murs (ex: "soft white walls", "very light neutral grey walls")
- Materiau sol nomme (ex: "whitewashed ash flooring", "herringbone parquet")
- Plafond avec geometrie preservee (formule identique dans les 12)
- Luminaire specifique au style (ex: "PH5-style layered shade", "washi paper pendant")

**Room-specific overrides** : ils COMPLETENT, ils n'ecrasent pas. Exemple cuisine : le sol bois est remplace par `ceramic or stone tiles (kitchen)` via regex sur le surfacePrompt, puis la ligne "Floor: ceramic or stone tiles" renforce. Le luminaire et les murs restent intacts.

**Verdict passe 1 : AUCUN risque de perte de style.** Le surfacePrompt est complet, bien positionne, et les overrides sont chirurgicaux (sol uniquement).

## Question 2 : Consequences sur la passe 2

**AUCUN impact negatif si la passe 1 produit des surfaces correctes.**

PASS2_PREAMBLE (v45, non condense) dit : "wall colors, floor material, and ceiling finish are final — keep them unchanged." La passe 2 ne touche pas aux surfaces — elle ajoute du mobilier sur la base produite par la passe 1.

**Risque theorique** : si le surfacePrompt en position ~135 etait ignore par le modele et qu'un sol generique apparaissait, la passe 2 travaillerait sur une base degradee. MAIS ce risque existait deja en v45/v52 — la position du surfacePrompt n'a pas change entre versions, seules les constantes autour ont ete condensees.

**Faut-il condenser les builders passe 2 ?** Les builders passe 2 utilisent les anciennes constantes (~600 mots : CAMERA_PRESERVATION, LIGHT_PRESERVATION, COLUMN_PRESERVATION, WALL_PRESERVATION, ANTI_FENETRE, ANTI_INVENTION). Total prompt passe 2 : ~700-800 mots.

**Recommandation : OUI, condenser la passe 2 en v54.** Meme logique que v53 :
- gpt-image-1.5 perd le fil apres ~200 mots
- Le furniturePrompt arrive en position ~mot 400+ dans le prompt passe 2 actuel
- C'est TROP LOIN — le modele risque de sous-ponderer les details mobilier
- Priorite P1 (pas P0 car la passe 2 fonctionne "suffisamment" — le mobilier apparait, mais les details fins des furniturePrompts sont dilues)

---
**Handoff -> @orchestrator**
- Fichier produit : `docs/ia/audit-v53-style-compat.md`
- Decision : passe 1 v53 OK, style preserve, aucun impact passe 2
- Action P1 : condenser les constantes passe 2 en v54 (meme approche que v53)
