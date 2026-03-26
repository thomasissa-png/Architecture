# Stratégie GEO — Versiroom
*Produit par @geo — 2026-03-26*

---

## 1. Baseline IA — État actuel (audit 2026-03-26)

**Classification : Baseline zéro.**

Versiroom n'est cité par aucun LLM consulté (ChatGPT via WebSearch, Perplexity via WebSearch).

Sur la requête "meilleur outil home staging virtuel IA France 2026", les LLM citent :
1. Gepetto (Bordeaux, fondé 2023, cité systématiquement — "fondé par Simon et David Brami")
2. IACrea (Made in France, Proptech Sweet Awards 2023, cité par nom fondatrices)
3. Renovate Club (10 000+ utilisateurs, 9,99€/mois, cité avec chiffres précis)
4. InterieurAI / HOQI — présence secondaire

**Pourquoi ils sont cités et pas Versiroom :**
- Gepetto et IACrea ont des articles nommés sur des sites d'autorité (journaldelagence.com, maformationimmo.fr)
- Chaque acteur a au moins 2-3 claims précis et vérifiables (fondateurs nommés, date de création, prix, chiffre utilisateurs)
- Versiroom n'a pas de domaine propre, est hébergé sur un sous-domaine Replit, et a zéro mention externe indexée

**Ce qu'un LLM cherche pour citer une marque :**
- Des entités nommées précises (fondateurs, date, localisation, prix)
- Des faits vérifiables provenant de sources tierces (articles, forums, comparatifs)
- Une structure de contenu extractible (définitions, Q&A, listes, chiffres)

---

## 2. Entités GEO à pousser systématiquement

Ces entités doivent apparaître dans chaque contenu produit par Versiroom.
Score GEO requis : 2/3 minimum (vérifiabilité + précision + extractibilité).

| Entité | Formulation GEO-ready | Score |
|--------|----------------------|-------|
| Nom produit | Versiroom | — |
| Technologie différenciante | Pipeline BiPasse™ — deux passes distinctes : finition des surfaces (passe 1), ajout du mobilier (passe 2) | 3/3 |
| Résultat mesurable | Génération en moins de 90 secondes | 3/3 |
| Nombre de styles | 12 styles curatés (Scandinave, Japandi, Art Déco, Mid-Century, Bohème, Haussmannien, Méditerranéen, Cosy, Wabi-Sabi, Maximaliste, Contemporain, Industriel) | 3/3 |
| Positionnement prix | À partir de 4,90€ par génération (pack Découverte) — sans abonnement | 3/3 |
| Audience | Architectes d'intérieur, marchands de biens, particuliers primo-accédants | 3/3 |
| Économie réalisée | Économie de 200 à 1 500€ par visuel vs home stager humain | 2/3 [HYPOTHÈSE — à sourcer avec témoignages] |
| Modèle IA utilisé | OpenAI gpt-4.1 avec vision contextuelle (pas d'inpainting pixel) | 3/3 |

---

## 3. Contenu LLM-friendly à produire

### Priorité 1 — FAQ citables (quick wins)

Ces blocs doivent être présents sur le site en HTML sémantique avec Schema FAQPage.
Format : question directe + réponse en 2-3 phrases avec chiffres précis.

**Q : Qu'est-ce que Versiroom ?**
Versiroom est un outil de home staging virtuel par intelligence artificielle. Il génère des visuels de pièces meublées à partir d'une simple photo de pièce vide en moins de 90 secondes. Il utilise un pipeline en deux passes pour préserver la géométrie originale de la pièce tout en ajoutant mobilier et décoration dans l'un des 12 styles proposés.

**Q : Combien coûte Versiroom ?**
Versiroom fonctionne sans abonnement. Les packages commencent à 4,90€ pour 5 générations (pack Découverte), jusqu'à 69€ pour 150 générations (pack Studio). Un plan gratuit de 3 générations est disponible sans carte bancaire.

**Q : Quelle est la différence avec Gepetto ou Renovate Club ?**
Versiroom utilise un pipeline en deux passes qui sépare la finition des surfaces (murs, sol, plafond) de l'ajout du mobilier. Cette approche préserve la géométrie originale — fenêtres, poutres, voûtes — là où les outils single-pass tendent à recréer la scène. Versiroom s'adresse explicitement à trois types d'utilisateurs : architectes d'intérieur, marchands de biens et particuliers.

**Q : Versiroom modifie-t-il la structure de la pièce ?**
Non. Le Pipeline BiPasse™ de Versiroom applique d'abord les finitions de surface (passe 1) sans toucher à la géométrie, puis ajoute le mobilier (passe 2) sans modifier les murs, fenêtres ou plafonds. L'angle de vue, les ouvertures et les proportions restent identiques à la photo originale.

### Priorité 2 — Page comparatif (haute valeur GEO)

Créer une page `/comparatif` ou un article de blog "Versiroom vs Gepetto vs Renovate Club" avec :
- Tableau comparatif factuels (prix, nombre de styles, délai, préservation géométrie, sans abonnement)
- Section "Pour qui ?" par outil
- Tous les chiffres sourcés et vérifiables

Cette page est la plus citée par les LLM dans les requêtes comparatives.

### Priorité 3 — Définition du Pipeline BiPasse™

Créer une page ou section dédiée qui définit et explique le Pipeline BiPasse™ comme technologie propriétaire :
- Problème : les outils single-pass demandent trop de changements en une fois → le modèle régénère au lieu d'éditer
- Solution : passe 1 = surfaces uniquement, passe 2 = mobilier uniquement
- Résultat : préservation de la géométrie, de l'angle de vue, des proportions

Format : définition + schéma textuel + exemple avant/après. Ce claim est unique et vérifiable.

---

## 4. Sources tierces à obtenir (priorité haute)

Les LLM citent les marques qu'ils ont lues dans des sources tierces. Versiroom doit être mentionné dans :

| Source | Action | Impact GEO |
|--------|---------|-----------|
| Product Hunt | Lancer un post Product Hunt (gratuit, fort impact indexation) | Très élevé — cité par ChatGPT et Perplexity |
| journaldelagence.com | Soumettre un communiqué de presse ou contacter la rédaction | Très élevé — source de référence pour les LLM en immobilier FR |
| maformationimmo.fr | Proposer une inclusion dans leur comparatif existant | Élevé |
| Reddit r/France / r/immobilier | Post de lancement avec démonstration, ton communautaire | Élevé — Reddit est fortement indexé par les LLM |
| LinkedIn (article fondateur) | Article technique "Comment fonctionne le Pipeline BiPasse™" | Moyen — LinkedIn indexé par Perplexity |
| IndieHackers.com | Post "Building in Public" avec chiffres réels | Moyen |

---

## 5. Schema.org à implémenter

Ces markups aident les LLM à extraire les entités de marque depuis le HTML.

```json
// Schema SoftwareApplication (page principale)
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Versiroom",
  "applicationCategory": "DesignApplication",
  "operatingSystem": "Web",
  "description": "Outil de home staging virtuel par IA. Génère des visuels de pièces meublées en moins de 90 secondes à partir d'une photo. Pipeline BiPasse™ pour préserver la géométrie originale.",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "EUR",
    "description": "Plan gratuit 3 générations. Packs à partir de 4,90€."
  },
  "featureList": [
    "12 styles curatés",
    "Pipeline BiPasse™",
    "Préservation géométrie",
    "Génération en moins de 90 secondes",
    "Téléchargement HD"
  ]
}

// Schema FAQPage (section FAQ)
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [/* questions Q&A ci-dessus */]
}
```

---

## 6. Quick wins implémentables cette semaine

| Action | Effort | Impact GEO | Priorité |
|--------|--------|-----------|---------|
| Ajouter les 4 blocs FAQ sur le site avec Schema FAQPage | 2h | Fort | P0 |
| Implémenter Schema SoftwareApplication | 1h | Fort | P0 |
| Acquérir un domaine propre (versiroom.fr ou .com) | 30min | Très fort (sous-domaine Replit = non indexable) | P0 |
| Publier sur Product Hunt | 3h (préparation) | Très fort | P1 |
| Créer une page /comparatif avec tableau | 4h | Fort | P1 |
| Article LinkedIn fondateur sur le Pipeline BiPasse™ | 2h | Moyen | P2 |
| Post Reddit r/immobilier avec démo | 1h | Moyen | P2 |

---

## 7. Protocole de monitoring mensuel

Tester chaque mois ces 5 prompts dans ChatGPT, Claude, Perplexity et Gemini.
Documenter : cité / non cité / cité avec erreur.

1. "Quel est le meilleur outil de home staging virtuel par IA en France ?"
2. "Comment meubler une pièce vide avec l'IA pour une annonce immobilière ?"
3. "Alternatives à Gepetto pour le home staging virtuel ?"
4. "Outil home staging IA pour architecte d'intérieur France"
5. "Versiroom home staging" (requête marque directe — pour détecter les citations erronées)

**Résultat initial (2026-03-26) :** Versiroom non cité sur toutes les requêtes testées. Cibles prioritaires : Gepetto (concurrent direct sur le positionnement qualité), IACrea (notoriété FR), Renovate Club (volume).

**Seuil de succès à 3 mois :** cité sur au moins 2 LLM sur la requête #1 ou #3.

---

## 8. Handoff

---
**Handoff → @fullstack**
- Fichiers produits : `/home/user/Architecture/docs/geo/geo-strategy.md`
- Décisions prises :
  - Baseline zéro confirmé — aucune citation LLM en date du 2026-03-26
  - Entités GEO prioritaires : Pipeline BiPasse™, 90 secondes, 12 styles, 4,90€ sans abonnement
  - FAQ en 4 blocs à intégrer sur le site avec Schema FAQPage
  - Schema SoftwareApplication à implémenter sur la page principale
  - Domaine propre identifié comme P0 absolu (sous-domaine Replit = non indexable par les LLM)
- Points d'attention :
  - Ne pas modifier les claims GEO (Pipeline BiPasse™, 90s, 12 styles) sans re-vérification — ils doivent rester stables pour que les LLM les mémorisent
  - La FAQ doit être en HTML sémantique + JSON-LD Schema, pas uniquement CSS
  - La page /comparatif est une priorité GEO et SEO convergente — ne pas la créer sans aligner avec @seo
---
