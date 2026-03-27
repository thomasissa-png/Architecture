# Benchmark fixe — Specs techniques

> Date : 2026-03-27 | Objectif : progression mesurable + détection régression automatique
> Référence : docs/ia/prompt-improvement-protocol.md §5

---

## 1. Composition du set (15 images)

### Indoor — Pièces standard (5)

| # | Type | Conditions | Style à appliquer | Ce qu'on mesure |
|---|---|---|---|---|
| B01 | Salon vide | Murs blancs, sol béton, 1 fenêtre | Scandinave | Baseline qualité, fenêtre préservée |
| B02 | Chambre vide | Parquet existant, 2 fenêtres, radiateur | Haussmannien | Radiateur préservé, 2 fenêtres comptées |
| B03 | Cuisine vide | Carrelage, pas de plan de travail | Contemporain | Built-in exception (kitchen), échelle |
| B04 | SDB vide | Carrelage mural partiel, miroir | Méditerranéen | Built-in exception (bathroom), fidélité |
| B05 | Entrée/couloir | Petite pièce, porte visible | Cosy | Scaling petit espace, porte préservée |

### Indoor — Contraintes spécifiques (3)

| # | Type | Conditions | Style à appliquer | Ce qu'on mesure |
|---|---|---|---|---|
| B06 | Salon voûté | Plafond voûte ou poutres apparentes | Industriel | Voûte/poutres NON lissées (G9) |
| B07 | Pièce double hauteur | Verrière, mezzanine, structure métal | Maximaliste | Géométrie complexe préservée |
| B08 | Pièce mur accent | Mur coloré ou papier peint existant | Bohème | Mur accent NON écrasé par le style |

### Indoor — Conditions difficiles (3)

| # | Type | Conditions | Style à appliquer | Ce qu'on mesure |
|---|---|---|---|---|
| B09 | Chantier brut | Placo, câbles, sol béton, prises | Wabi-Sabi | Nettoyage chantier, prises masquées |
| B10 | Pièce sombre | Peu/pas de fenêtres, éclairage artificiel | Japandi | Pas de brightening artificiel |
| B11 | Fenêtres cramées | Contre-jour, highlights brûlées | Mid-Century | Highlights préservées, pas de HDR |

### Outdoor (4)

| # | Type | Conditions | Style à appliquer | Ce qu'on mesure |
|---|---|---|---|---|
| B12 | Terrasse grande | Sol béton, garde-corps, vue | Contemporain Outdoor | Garde-corps préservé, ciel intact |
| B13 | Balcon petit | Étroit, garde-corps métal | Cosy Balcon | Scaling compact, passage 60cm |
| B14 | Jardin | Pelouse, clôture, arbres existants | Bohème Garden | Arbres préservés, plantes outdoor |
| B15 | Rooftop | Parapet, vue ville, sol existant | Rooftop | Skyline préservée, mobilier bas |

---

## 2. Provenance des images

**Sources prioritaires** (par ordre) :
1. **Générations existantes en DB** — les inputs des #37-44 sont de vraies photos de chantier
2. **Photos fondateur** — Thomas peut photographier des biens en cours
3. **Unsplash/Pexels** — pièces VIDES uniquement (pas meublées)

**Critères de sélection** :
- JPEG ou PNG, 1024-2048px côté long
- Pièce réellement VIDE (pas de meubles, pas de cartons)
- Conditions variées (lumière, taille, éléments structurels)
- Au moins 3 images avec des contraintes (voûte, convecteur, mur accent)

---

## 3. Architecture fichiers

```
benchmarks/
├── inputs/           # 15 images fixes (JAMAIS modifiées)
│   ├── B01_salon_vide.jpg
│   ├── B02_chambre_radiateur.jpg
│   └── ...
├── baseline/         # Meilleurs outputs connus par version
│   ├── v26/
│   │   ├── B01_salon_vide_output.jpg
│   │   └── ...
│   └── v27/
├── history/          # JSON par run
│   ├── 2026-03-27_v26.json
│   └── ...
├── run.ts            # Script : appelle /api/generate pour chaque image
├── compare.ts        # Script : calcule métriques SSIM entre runs
└── README.md         # Ce qu'est le benchmark, comment l'utiliser
```

---

## 4. Script run.ts (specs)

```typescript
// Pour chaque image B01-B15 :
// 1. Lire l'image input depuis benchmarks/inputs/
// 2. Déterminer le style et les paramètres (indoor/outdoor, roomType)
// 3. Appeler POST /api/generate avec l'image + le style
// 4. Sauvegarder l'output dans benchmarks/baseline/vNN/
// 5. Logger : durée, modèle utilisé, succès/erreur
// 6. Écrire le rapport JSON dans benchmarks/history/

// Config par image :
const BENCHMARK_CONFIG = [
  { id: "B01", input: "B01_salon_vide.jpg", styleId: "scandinavian", roomType: null, isOutdoor: false },
  { id: "B02", input: "B02_chambre_radiateur.jpg", styleId: "haussmannian", roomType: "bedroom_adults", isOutdoor: false },
  { id: "B03", input: "B03_cuisine_vide.jpg", styleId: "contemporary", roomType: "kitchen", isOutdoor: false },
  // ... etc pour les 15
];
```

---

## 5. Script compare.ts (specs)

```typescript
// Pour chaque image du run :
// 1. Charger l'input (benchmarks/inputs/BNN.jpg)
// 2. Charger l'output du run courant
// 3. Charger l'output du run précédent (baseline)
// 4. Calculer :
//    - SSIM(input, output) → préservation structure
//    - SSIM(output_current, output_previous) → stabilité entre versions
// 5. Générer rapport avec alertes si seuils franchis

// Seuils :
// SSIM(input, output) < 0.60 → ALERTE géométrie
// SSIM(run_N, run_N-1) < 0.85 → ALERTE régression
// Durée > 150s → ALERTE performance
```

---

## 6. Quand exécuter le benchmark

| Événement | Images à tester | Qui décide |
|---|---|---|
| Bump PROMPT_VERSION | 15/15 (run complet) | Automatique |
| Migration de modèle | 15/15 + audit agents | @ia + fondateur |
| Cron hebdo | 3/15 (B01, B06, B12) | Automatique |
| Feedback utilisateur négatif | Image similaire au cas rapporté | @ia |

---

## 7. Format rapport JSON

```json
{
  "version": "v26",
  "date": "2026-03-27T16:00:00Z",
  "model": "gpt-image-1.5",
  "results": [
    {
      "id": "B01",
      "style": "scandinavian",
      "duration_ms": 25000,
      "success": true,
      "ssim_input_output": 0.72,
      "ssim_vs_previous": null,
      "alerts": []
    }
  ],
  "summary": {
    "avg_ssim": 0.71,
    "avg_duration_ms": 28000,
    "alerts_count": 0,
    "verdict": "GO"
  }
}
```

---

## Handoff → @fullstack

1. Créer le dossier `benchmarks/` avec la structure ci-dessus
2. Implémenter `run.ts` (appel API production pour chaque image)
3. Implémenter `compare.ts` (SSIM via sharp ou pixelmatch)
4. Les images input seront fournies par le fondateur ou récupérées en DB
5. Le premier run sera la baseline v26 (post-migration GPT Image 1.5)
