# Review F3 — Extérieur

**Reviewer** : @reviewer (direct)
**Date** : 2026-03-24
**Verdict** : VALIDE AVEC RÉSERVES

---

## Résumé

F3 est bien implémenté : 6 styles outdoor, 5 sous-types, builders dédiés sans directives plafond/luminaire, toggle intérieur/extérieur, itérations outdoor, logging DB. Quelques issues mineures corrigées dans cette review.

## Points OK

- 6 styles outdoor conformes aux specs F3 et aux recommandations prompts
- 5 sous-types avec overrides additifs (pas de remplacement, correct pour l'outdoor)
- Builders outdoor : pas de plafond, pas de luminaire, "open-air space — no ceiling, sky preserved as-is"
- OUTDOOR_NEGATIVE_PROMPT complet (indoor furniture, ceiling, curtains, etc.)
- Itérations outdoor : détection isOutdoor depuis Pass1Meta, builders dédiés
- Exclusion mutuelle F2/F3 : roomType null quand isOutdoor true
- Pass1Meta stocke isOutdoor et outdoorSubtype
- generation_logs : colonnes is_outdoor et outdoor_subtype ajoutées
- Toggle UI segmented-pill dans StylePicker
- OutdoorSubtypePicker et OutdoorStylePicker avec ARIA, focus-visible, min-h-[44px]

## Problèmes trouvés

### MOYENNE (3)

**M-01** — Accents manquants dans les labels outdoor
- Fichier : `lib/outdoor-styles.ts`
- "Mediterraneen" → "Méditerranéen", "Boheme" → "Bohème", descriptions sans accents
- **CORRIGÉ** dans cette review

**M-02** — US-F3-04 non implémentée (alerte photo intérieure en mode outdoor)
- La détection GPT-4.1-mini en background après upload n'est pas implémentée
- C'est un appel API non bloquant — effort supplémentaire
- **Acceptable MVP** : feature "nice to have", pas bloquante pour le lancement

**M-03** — Pre-processing custom prompt ne reçoit pas isOutdoor
- Le system prompt de GPT-4.1-mini ne sait pas qu'on est en mode outdoor
- Impact : un prompt custom avec "canapé" ne sera pas filtré en "canapé d'extérieur"
- **Acceptable MVP** : le mode custom est peu utilisé

### BASSE (1)

**B-01** — Descriptions outdoor-subtypes sans accents dans le code
- Les descriptions utilisateur dans `outdoor-subtypes.ts` n'ont pas d'accents
- Mais les labels sont corrects (Terrasse, Balcon, Patio, Jardin, Rooftop — pas d'accent nécessaire)
- Impact nul

## Recommandations

1. Implémenter US-F3-04 (alerte photo intérieure) dans un sprint futur — nécessite un endpoint dédié
2. Ajouter `isOutdoor: true` au system prompt du pre-processing custom quand pertinent
3. Les builders outdoor sont inline dans route.ts — si le fichier grossit trop, envisager un `lib/outdoor-builders.ts`
