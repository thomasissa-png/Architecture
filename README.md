# Versimo — Home Staging IA pour Marchands de Biens

Outil de home staging virtuel permettant aux professionnels de l'immobilier de transformer des photos de biens bruts en visuels meublés et décorés grâce à l'intelligence artificielle.

## Stack technique

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** pour le style
- **OpenAI** (gpt-image-1) pour la génération d'images
- **Replicate** (SDXL) comme fallback
- **react-dropzone** pour l'upload
- **react-compare-slider** pour le comparateur avant/après

## Installation

```bash
# Cloner le projet
git clone <url-du-repo>
cd versimo

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.local.example .env.local
# Éditer .env.local avec vos clés API

# Lancer en développement
npm run dev
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).

## Variables d'environnement

| Variable | Description | Requis |
|---|---|---|
| `OPENAI_API_KEY` | Clé API OpenAI (prioritaire) | Au moins une des deux |
| `REPLICATE_API_TOKEN` | Token API Replicate (fallback) | Au moins une des deux |

## Fonctionnement

1. **Upload** — Glissez-déposez jusqu'à 5 photos (JPG, PNG, WEBP, max 10 Mo)
2. **Style** — Choisissez parmi 3 styles prédéfinis ou décrivez un style personnalisé
3. **Génération** — L'IA ajoute une couche décorative en préservant l'architecture du bien
4. **Comparaison** — Visualisez le résultat avec un slider avant/après et téléchargez en HD

## Architecture des fichiers

```
app/
  page.tsx              # Landing page complète
  layout.tsx            # Layout avec métadonnées
  globals.css           # Styles globaux + Inter font
  api/generate/route.ts # API avec logique OpenAI + Replicate
components/
  UploadZone.tsx        # Zone de drop avec react-dropzone
  StylePicker.tsx       # Sélecteur de style (cards)
  ImageComparator.tsx   # Slider avant/après
  StepIndicator.tsx     # Indicateur d'étapes
```
