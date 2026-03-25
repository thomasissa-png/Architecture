# Re-audit V4 — Persona Thomas Berger (Marchand de biens)
**Date :** 25 mars 2026
**Auditeur :** Agent UX — incarnation Thomas Berger, 35 ans, marchand de biens Bordeaux
**Version auditée :** V4 (refonte architecture — galerie persistante, gestion des biens, dossiers)
**Progression :** V1 6.1 → V2 7.2 → V3 8.3 → V4 ?

---

## 1. Note globale V4

**8.7 / 10** — seuil 9 non atteint, 4 corrections ciblées restantes

---

## 2. Tableau de progression V1 → V4

| # | Critere | V1 | V2 | V3 | V4 | Delta V3→V4 | Observations |
|---|---------|----|----|----|----|------------|--------------|
| 1 | Simplicite du parcours | 5.5 | 7.0 | 8.5 | 8.5 | = | Flux solide — pas de regression |
| 2 | Rapidite percue | 6.0 | 7.5 | 8.0 | 8.5 | +0.5 | Timer elapsed + MerchantMode poll asynchrone |
| 3 | Qualite pro des visuels | 6.5 | 7.5 | 8.5 | 8.5 | = | Indépendant V4 (moteur inchangé) |
| 4 | Telechargement HD | 4.0 | 6.5 | 8.0 | 9.0 | +1.0 | Download HD par photo dans DossierResult — fix livré |
| 5 | Partage (WhatsApp / lien) | 5.0 | 7.0 | 8.5 | 9.0 | +0.5 | ShareLink copier lien + WhatsApp natif mobile |
| 6 | Prix / valeur percue | 7.0 | 7.5 | 8.5 | 8.5 | = | Pas de changement pricing V4 |
| 7 | Gestion d'erreur | 5.5 | 7.0 | 8.0 | 8.5 | +0.5 | Photos failed + credit restitue + erreur réseau |
| 8 | Mobile (iPhone 15 Pro) | 5.0 | 6.5 | 8.0 | 8.0 | = | Retrouvabilite galerie mobile reste un point faible |
| 9 | Retrouvabilite des visuels | 2.0 | 4.5 | 7.0 | 9.5 | +2.5 | Galerie persistante + biens + filtres = transformation |
| 10 | Confiance / credibilite pro | 5.5 | 7.5 | 8.0 | 8.5 | +0.5 | Fiche bien DVF + carte + description GPT = signal pro fort |

**Moyenne V4 : 8.65 → arrondi 8.7/10**

---

## 3. Analyse critique par critere

### Critere 9 — Retrouvabilite (2.0 → 9.5) : la transformation majeure

C'est ici que V4 gagne son pari. En V1-V2, Thomas perdait ses visuels entre deux sessions. En V3 l'Object Storage réglait la persistance technique mais sans interface. V4 livre :

- **Galerie /ma-galerie** avec filtre style, filtre associé/non-classé, modal avant/après
- **Mes biens /mes-biens** avec compteur photos + dossiers par bien
- **Fiche bien /mes-biens/[id]** avec grille photos associées, modal association, création dossier inline
- **PhotoAssociator** : popover discret post-génération "Associer à un bien ?"

Pour Thomas qui gère 8-12 opérations/an, retrouver en 10 secondes "les 4 visuels Art Deco du T3 Bordeaux centre" est un changement de paradigme. Note 9.5 et non 10 : le filtre "type de pièce" absent dans /ma-galerie (présent dans le schéma DB mais non exposé en UI).

### Critere 4 — Telechargement HD (4.0 → 9.0) : correction livrée

DossierResult implémente le lien `Télécharger HD` par photo avec attribut `download` correct. Thomas peut envoyer la photo individuelle à un agent immobilier sans avoir à télécharger tout le PDF. Point encore perfectible : pas de téléchargement groupé (ZIP) depuis /ma-galerie pour exporter toutes les photos d'un bien en une fois.

### Critere 5 — Partage (5.0 → 9.0)

DossierResult.tsx : bouton WhatsApp avec `navigator.share` natif mobile + fallback `wa.me`, bouton "Partager avec un acquéreur" qui copie le lien `/dossier/{uuid}`. Le lien est permanent (UUID en DB) — Thomas peut l'envoyer par email/SMS et l'acquéreur voit le dossier sans compte. C'est exactement son usage.

### Critere 1 — Simplicite : seuil atteint mais un point d'attention

MerchantMode démarre à l'étape `photos` (ligne 63 : `useState<MerchantStep>("photos")`), pas à `info`. Correct selon la logique Thomas (il a ses photos sur son iPhone, il les dépose d'abord). Mais le flux info bien intervient *après* les photos, *avant* le style — ce n'est pas l'ordre naturel si Thomas veut générer rapidement sans remplir une fiche. La gestion de la fiche bien (adresse, surface, type, prix) comme étape bloquante avant la génération crée une friction pour les utilisateurs pressés.

### Critere 8 — Mobile : note stable, friction identifiée

Le bouton "Associer" dans /ma-galerie est `opacity-0 group-hover:opacity-100` (ligne 246 de ma-galerie/page.tsx). Sur mobile il n'y a pas de hover — le bouton est invisible. Thomas ne peut pas associer une photo depuis sa galerie sur son iPhone 15 Pro sans passer par la modale de détail (deux taps supplémentaires).

---

## 4. Frictions residuelles (corrections pour atteindre 9/10)

### F1 — CRITIQUE : Bouton "Associer" invisible sur mobile (critere 8)

**Fichier :** `app/ma-galerie/page.tsx` ligne 246
**Constat :** `opacity-0 group-hover:opacity-100` — sur mobile, le hover ne se déclenche jamais.
**Impact Thomas :** il photographie le bien sur site avec son iPhone, rentre, génère, veut associer immédiatement. Il ne voit pas le bouton.
**Correction :** rendre le bouton visible en permanence sur mobile — utiliser `sm:opacity-0 sm:group-hover:opacity-100` pour le cacher uniquement sur desktop où hover fonctionne. Sur mobile la badge "Non classée" en overlay peut elle-même devenir un bouton d'association tapable.

### F2 — HAUTE : Filtre "type de pièce" absent dans /ma-galerie (critere 9)

**Fichier :** `app/ma-galerie/page.tsx` — filtres ligne 165-186
**Constat :** le schéma `UserPhoto` inclut `room_type` et `room_label` mais ils ne sont pas exposés comme filtre dans la galerie. Seuls les filtres "style" et "associé/non" sont présents.
**Impact Thomas :** sur une opération de 10 photos (salon x3, chambre x2, cuisine x2, extérieur x3), il veut retrouver "toutes les photos de salon" pour comparer les rendus de styles. Impossible aujourd'hui.
**Correction :** ajouter un `<select>` filtre "Type de pièce" avec les valeurs de `room_type` présentes en base. Charge serveur négligeable (filtre côté API déjà structuré).

### F3 — HAUTE : Etape info bien non bypassable (critere 1)

**Fichier :** `components/MerchantMode.tsx`
**Constat :** l'étape `info` (nom du bien, adresse, surface, prix) est présente dans le flux mais son caractère obligatoire ou optionnel n'est pas clairement signalé. Le `bienNom` est utilisé dans DossierResult comme titre — si vide, `getDossierTitle` a un fallback "Dossier de présentation" (OK). Mais l'absence de message "Ces infos sont optionnelles, vous pourrez les compléter plus tard" crée de l'anxiété.
**Impact Thomas :** sur un bien qu'il vient juste d'acheter, il n'a pas encore toutes les infos (pas le prix de vente, pas la surface exacte). Il hésite à avancer.
**Correction :** ajouter sous le formulaire info : `"Vous pouvez passer cette étape et compléter les informations plus tard dans votre fiche bien."` avec un lien/bouton "Passer pour l'instant" explicite.

### F4 — MOYENNE : Pas de ZIP export depuis /mes-biens/[id] (critere 4)

**Fichier :** `app/mes-biens/[id]/page.tsx` — section Photos du bien
**Constat :** sur la fiche bien, Thomas voit toutes ses photos associées mais il ne peut télécharger que photo par photo (via la modale dossier → PDF). Pour envoyer 8 visuels HD à une agence immobilière par email, il doit les télécharger un à un ou passer par le PDF.
**Impact Thomas :** friction directe sur son usage "plaquette commerciale". Il veut les JPG bruts HD pour les uploader sur SeLoger/Bien'ici.
**Correction :** bouton "Télécharger tout (ZIP)" sur la fiche bien, qui récupère tous les `output_image_key` associés et les package côté serveur ou via une lib client (JSZip). Priorité : ZIP côté client pour éviter la charge serveur.

---

## 5. Points forts V4 (a conserver)

- **PhotoAssociator.tsx** : le popover post-génération est discret, non bloquant, avec "Ignorer" — jamais intrusif. Thomas peut l'utiliser ou l'ignorer selon sa situation. Parfait.
- **DVF prix/m² dans la fiche bien** : signal de confiance pro fort. Thomas peut comparer son prix de vente au marché directement dans l'outil. Différenciant vs concurrents.
- **Carte OSM dans la fiche bien** : visuel immédiat de localisation — Thomas voit si le bien est proche du centre, des transports. Utilisable dans les pitchs acquéreurs.
- **Description GPT-4.1-mini éditable** : génération automatique + override manuel. Thomas peut partir du texte généré, le corriger en 30 secondes. Gain de temps réel vs écriture from scratch.
- **DossierResult avec statut partial** : les photos en échec sont listées avec message "crédit restitué automatiquement" — message de confiance critique pour Thomas qui paie à l'usage.
- **Breadcrumb dans /mes-biens/[id]** : navigation claire Mes biens → fiche bien. Sur mobile, Thomas peut revenir facilement à la liste.
- **Focus-visible sur tous les éléments interactifs** : navigation clavier fonctionnelle, ring sage/50 cohérent.

---

## 6. Verdict

**8.7/10 — seuil 9/10 non atteint. 4 corrections pour franchir le cap.**

Le saut qualitatif V3→V4 est réel et concentré sur le critère 9 (retrouvabilité). Versiroom n'est plus un outil de génération one-shot : c'est un outil de gestion de portefeuille immobilier. Pour Thomas qui a 8-12 opérations simultanées, c'est la différence entre "un gadget fun" et "un outil de travail quotidien".

Les 4 corrections restantes sont toutes techniquement simples (CSS, filtre API, message UX, ZIP). Aucune ne nécessite de refonte architecturale. La correction F1 (mobile hover) est la seule bloquante pour l'usage terrain iPhone.

**Priorité d'implémentation :**
1. F1 — Bouton "Associer" visible mobile (30 min CSS)
2. F2 — Filtre type de pièce dans /ma-galerie (2h — filtre UI + param API)
3. F3 — Message "étape optionnelle" dans MerchantMode info (15 min copywriting + UI)
4. F4 — ZIP export depuis fiche bien (4h — JSZip client-side)

---

## Hypotheses a valider

Aucune hypothèse posée — audit basé exclusivement sur le code source lu.

---

---
**Handoff → @design**
- Fichiers produits : `/home/user/Architecture/docs/reviews/f4-reaudit-v4-thomas.md`
- Decisions prises : note globale 8.7/10, 4 frictions identifiées avec localisation fichier exacte et correction proposée
- Points d'attention :
  - F1 (critique) : le pattern `opacity-0 group-hover` est systématiquement problématique sur mobile — vérifier si ce pattern est utilisé ailleurs dans la codebase (UploadZone, fiche bien) et corriger de façon cohérente
  - F2 : le filtre type de pièce nécessite d'exposer les valeurs `room_type` distinctes depuis l'API `/api/user/photos` — à coordonner avec @fullstack
  - F3 : le copywriting "Ces infos sont optionnelles" est à valider avec @product-manager (impact sur la complétude des données en DB)
  - F4 : ZIP export — JSZip côté client recommandé pour éviter la charge serveur sur Replit, mais vérifier les limites de taille mémoire browser pour les lots de 15 photos HD
---
