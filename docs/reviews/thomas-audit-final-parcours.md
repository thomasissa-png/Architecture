# Audit FINAL parcours marchand -- Thomas Berger
**Date :** 2026-03-27 | **Seuil :** 9.5/10 | **Methode :** lecture code source integrale

---

## Grille de notation

| # | Critere | Note | Justification |
|---|---------|------|---------------|
| 1 | Retrouvabilite | 9.5 | /mes-biens liste tous les biens avec compteurs photos/dossiers. /mes-dossiers avec statuts (brouillon/termine/partiel). /ma-galerie avec 3 filtres (style, piece, association). Navigation coherente dans les headers. |
| 2 | Prix/valeur | 9.5 | Pricing page affiche prix/photo (0.58 EUR Pro), ROI explicite "29 EUR au lieu de 200-500 EUR chez un home stager". 3 generations offertes sans CB. Teaser Mode Marchand sur homepage renvoie vers #pricing. |
| 3 | Qualite pro | 9.0 | Pipeline 2 passes (surfaces + mobilier) avec prompts audites par 2 agents experts. PDF brande A4 paysage avec logo, QR code, DPE, disclaimer EU AI Act. Annonce publique avec hero photo, prix/m2, DVF quartier. MAIS : 3 PLACEHOLDERS images sur homepage (cards Architecte/Marchand/Particulier = icones SVG generiques). |
| 4 | Partage acquereurs | 9.5 | Slug lisible sur annonces (/annonce/t3-60m2-bordeaux). OG metadata avec image, titre, description. ShareButtons avec copie lien + navigator.share + fallback WhatsApp. ContactSticky avec tel cliquable. |
| 5 | Gestion d'erreur | 9.0 | Erreurs en francais clair ("Connexion perdue pendant la generation. Verifiez votre reseau"). Retry auto sur fetch. Toast inline 4s. MAIS : 2 toasts dans /mes-biens/[id] sans accents ("Description generee avec succes" au lieu de "generee"). |
| 6 | Simplicite | 9.5 | 3 etapes (Upload > Style > Resultat) avec StepIndicator. Mode Marchand toggle Standard/Marchand. ProGate protege les features pro avec message clair. AuthModal focus trap + Escape. |
| 7 | Confiance | 9.5 | Branding Versimo coherent. Logo marchand visible sur annonce + PDF. Couleurs marchand appliquees sur PDF cover. AI disclaimer sur chaque page PDF (EU AI Act). Domain propre sur annonces. |
| 8 | Completude | 9.5 | DPE/GES affiches sur annonce avec badges couleur. Surface, pieces, prix, prix/m2, DVF quartier. Description generee par IA editable. Infos complementaires (etage, parking, cave, charges copro, expo, taxe fonciere). ExportPortail LeBonCoin/SeLoger/Bienici avec compteurs caracteres. |
| 9 | Mobile-first | 9.5 | Touch targets min-h-[44px] sur CTA, 48px sur ContactSticky. AuthModal bottom sheet pattern. Responsive grid partout (grid-cols-2 sm:grid-cols-3). Pas de scroll horizontal detecte. |
| 10 | Rapidite | 9.5 | Pipeline generation ~90s avec timer visible. Resilient fetch 180s timeout + 1 retry auto. Batch parallele max 2. Pre-processing custom prompt ~0.5s. PDF genere a la volee. |

---

## Synthese

| Metrique | Valeur |
|----------|--------|
| **Moyenne** | **9.40 / 10** |
| **Seuil** | 9.5 / 10 |
| **Delta** | -0.10 |

---

## Verdict : CONDITIONNEL

Le parcours est solide, professionnel, et couvre 100% du workflow marchand (upload > generation > bien > dossier PDF > annonce > partage > retrouvabilite). Deux frictions empechent le 9.5.

---

## Corrections restantes (2 items)

### P0 -- Placeholders images homepage (qualite pro 9.0 > 9.5)

**Fichier :** `/home/user/Architecture/app/page.tsx` lignes 905, 926, 947

Les 3 cards personas (Architecte, Marchand, Particulier) affichent des icones SVG generiques au lieu d'images avant/apres reelles. Un acquereur qui arrive sur la homepage voit des placeholders -- ca tue la credibilite.

**Correction :** remplacer chaque `{/* [PLACEHOLDER ...] */}` par une image statique commitee dans `public/demo/`. Exemple pour la card Marchand (ligne 926) :

```diff
-                {/* [PLACEHOLDER — image avant/après marchand, à remplacer par ImageComparator ou fichier statique public/demo/] */}
-                <div className="text-center p-6">
-                  <div className="w-full h-full flex items-center justify-center text-muted/40">
-                    <svg className="w-12 h-12" ...>...</svg>
-                  </div>
-                </div>
+                <img src="/demo/marchand-contemporain.jpg" alt="Avant/après contemporain" className="w-full h-full object-cover" loading="lazy" />
```

Idem pour les cards Architecte (l.905) et Particulier (l.947). Necessite 3 images de demo dans `public/demo/`.

### P1 -- Accents manquants dans toasts (gestion erreur 9.0 > 9.5)

**Fichier :** `/home/user/Architecture/app/mes-biens/[id]/page.tsx`

```diff
- setToastMsg("Description generee avec succes.");
+ setToastMsg("Description générée avec succès.");
```

```diff
- setToastMsg("Erreur reseau. Verifiez votre connexion.");
+ setToastMsg("Erreur réseau. Vérifiez votre connexion.");
```

```diff
- setToastMsg("La description n\u2019a pas pu etre generee. Reessayez.");
+ setToastMsg("La description n\u2019a pas pu être générée. Réessayez.");
```

---

## Ce qui fonctionne parfaitement

- Slug lisible + OG preview pour WhatsApp = les acquereurs recoivent un lien propre
- PDF brande avec logo, QR code, DPE, tel cliquable = plaquette pro
- ExportPortail copie formatee LeBonCoin/SeLoger = gain de temps reel
- /ma-galerie avec filtre type de piece = retrouvabilite corrigee (F2 de V5 resolu)
- ProGate + AuthModal = onboarding fluide sans friction technique
- ContactSticky tel cliquable = l'acquereur appelle direct depuis l'annonce
