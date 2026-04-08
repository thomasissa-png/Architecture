# react-image-crop (vendored)

**Version vendorée** : `11.0.10`
**Source upstream** : https://github.com/sekoyo/react-image-crop
**Licence** : ISC (voir `LICENSE.md`)
**Auteur original** : Dominic Tobias

## Pourquoi ce vendoring

BR-6 (session 38) — la migration vers `react-image-crop` v11 dans `components/CropModal.tsx` a déclenché un échec de build Replit irrécupérable :

```
Module not found: Can't resolve 'react-image-crop'
./components/CropModal.tsx:19:1
```

Diagnostics tentés sans succès :
1. `rm -rf node_modules && npm install` sur Replit shell — échec
2. `npm ci` strict (Replit deploy mode) en local — **passe** (donc ce n'est pas le code)
3. `transpilePackages: ['react-image-crop']` dans `next.config.mjs` (commit `125e699`) — échec sur Replit
4. Cache bust Replit deploy — échec

Hypothèse : Replit Deployments utilise un node_modules cachéé séparé du shell, ou la résolution ESM via le `exports` map du package échoue dans leur worker de build. Aucun fix configuration ne résout le problème.

**Vendoring = solution bulletproof** : les fichiers sont sur le disque, dans le repo, importés par chemin relatif. Aucune résolution npm impliquée.

## Fichiers vendorés

| Fichier | Taille | Origine |
|---|---|---|
| `index.js` | 21 KB | `node_modules/react-image-crop/dist/index.js` (ESM build, identique) |
| `index.d.ts` | 8 KB | `node_modules/react-image-crop/dist/index.d.ts` (TypeScript types) |
| `ReactCrop.css` | 5 KB | `node_modules/react-image-crop/dist/ReactCrop.css` (styles) |
| `LICENSE.md` | — | Licence ISC originale (obligation légale) |

## Procédure de mise à jour

Quand une nouvelle version de `react-image-crop` est publiée et qu'on veut l'adopter :

```bash
npm install react-image-crop@<new-version>
cp node_modules/react-image-crop/dist/index.js     components/vendor/react-image-crop/
cp node_modules/react-image-crop/dist/index.d.ts   components/vendor/react-image-crop/
cp node_modules/react-image-crop/dist/ReactCrop.css components/vendor/react-image-crop/
cp node_modules/react-image-crop/LICENSE.md         components/vendor/react-image-crop/
# Mettre à jour le numéro de version dans ce README
# Tester localement : npm run build
# Tester en preview Replit avant prod
git add components/vendor/react-image-crop/ package.json package-lock.json
git commit -m "chore(vendor): update react-image-crop to vX.Y.Z"
```

## Import

```typescript
// Avant (cassé sur Replit)
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

// Après (vendoré)
import ReactCrop from "@/components/vendor/react-image-crop/index.js";
import "@/components/vendor/react-image-crop/ReactCrop.css";
```

Le `package.json` garde `react-image-crop` dans `dependencies` pour fournir les types TypeScript via `node_modules/react-image-crop/dist/index.d.ts` (que TS résout via `types` dans le `package.json` upstream). Le runtime utilise uniquement les fichiers vendorés.

## Quand supprimer le vendoring

Quand Replit a corrigé son resolver ESM (ou quand on migre hors Replit), revenir à l'import npm standard et supprimer ce dossier.
