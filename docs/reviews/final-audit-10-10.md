# Audit final — Annonce + Dossier — Cibles 10/10

Auditeurs : Thomas Berger (marchand de biens, 35 ans) + Marc Leroy (acquereur, iPhone, 30s).
Code lu : `app/annonce/[uuid]/page.tsx`, `app/dossier/[uuid]/page.tsx`, `app/api/annonce/route.ts`, `lib/dossier.ts`, `app/api/merchant/enrich-property/route.ts`, `app/api/properties/route.ts`.

---

## Score Thomas /10

| Critere | Note | Probleme identifie |
|---|---|---|
| Titre vendeur et pro | 7/10 | Format "T3 60 m² — Rue Henri Barbusse, Le Mans" est fonctionnel mais generique. Pas de type de bien (Appartement, Maison) dans le titre public. |
| Description complete | 8/10 | DESCRIPTION_SYSTEM_PROMPT bien structure (quartier, transports, ecoles, potentiel). Gap : le prix de vente n'est PAS passe au LLM → la description ne peut pas contextualiser le rapport qualite/prix. |
| Infos financieres claires | 7/10 | Annonce : prix present + prix/m2 quartier. MANQUE : prix au m2 DU BIEN calcule (disponible = `sale_price / surface_m2`). Dossier : prix au m2 du bien present via bloc "Analyse du marche". |
| Dossier "plaquette pro" | 8/10 | PDF telechargeable present. Carte OSM + analyse marche + caracteristiques = pro. Gap : pas de mention de la date de validite du dossier sur l'annonce (90 jours). |
| Thomas peut tout modifier avant envoi | 6/10 | Bouton "Modifier" visible pour l'owner (annonce + dossier). MAIS : le titre de l'annonce est auto-genere et non editable apres creation (aucun endpoint PATCH /api/annonce). Titre fige. |

**Score Thomas : 7.2/10**

---

## Score Marc /10

| Critere | Note | Probleme identifie |
|---|---|---|
| Comprend le bien en 30s sur iPhone | 8/10 | Hero photo full-width + pills prix/surface/ville above the fold. Gap annonce : le prix au m2 DU BIEN est absent (uniquement le prix quartier). Marc ne peut pas juger si c'est cher. |
| Appeler en 1 tap | 9/10 | Bouton "Appeler" present au-dessus des photos (ligne 287-299). ContactSticky en bas. Double securite. Gap : visible UNIQUEMENT si `merchant.telephone` rempli. Si vide, aucun CTA. |
| Photos aident a se projeter | 8/10 | Galerie par pieces avec lightbox (AnnonceGallery). Navigation par pieces (RoomNav). Gap : si 0 photos completees, message "Aucune photo disponible" sans CTA alternatif. |
| Quartier decrit (transports, ecoles) | 7/10 | Description generee par GPT-4.1-mini couvre transports + commerces + ecoles. Gap : c'est dans la description texte, pas dans des elements visuels scannables. Marc ne lit pas, Marc scanne. |
| Envie d'appeler apres lecture | 7/10 | Annonce : pas de prix au m2 du bien, pas de section "Atouts" visuellement separee, pas de badge "Bien rare" ou signal de tension. Dossier : mieux structure avec analyse marche. |

**Score Marc : 7.8/10**

---

## Corrections P0 — Bloquantes pour la credibilite pro

### P0.1 — Prix au m2 du bien manquant dans l'annonce
**Fichier** : `app/annonce/[uuid]/page.tsx`, ligne 248-276 (pills section)
**Probleme** : `dvf_median_price_m2` (prix quartier) est affiche mais pas `sale_price / surface_m2` (prix du bien).
**Fix** : Ajouter un pill calcule entre le pill prix et le pill prix quartier.
```tsx
// Apres la pill sale_price (ligne 265-275), avant dvf_median_price_m2
{property.sale_price && property.surface_m2 && (
  <span className="text-xs bg-foreground/5 text-foreground px-3 py-1.5 rounded-xl font-light">
    {Math.round(property.sale_price / property.surface_m2).toLocaleString("fr-FR")} €/m²
  </span>
)}
```

### P0.2 — Titre annonce non editable apres creation
**Fichier** : `app/api/annonce/route.ts` — aucun endpoint PATCH.
**Probleme** : Le titre est auto-genere (ligne 77-104) et fige. Thomas ne peut pas le corriger avant de partager.
**Fix** : Creer `PATCH /api/annonce/[uuid]/route.ts` avec body `{ title }` + mettre a jour `lib/annonce` avec `updateAnnonceTitle()`. Ajouter un champ editable inline dans la page `/mes-biens/[id]` a cote du lien de partage.

### P0.3 — Prix de vente absent du contexte LLM
**Fichier** : `app/api/properties/route.ts` ligne 198-205 + `app/api/merchant/enrich-property/route.ts` ligne 188-196.
**Probleme** : `salePrice` n'est pas passe a `generateDescription()`. La description ne peut pas ecrire "Propose a X€, soit X€/m², dans la moyenne du quartier (Y€/m²)".
**Fix** : Passer `salePrice` aux deux fonctions `generateDescription()` et ajouter dans le prompt utilisateur : `if (salePrice && surface) parts.push(\`Prix de vente : ${salePrice} EUR (${Math.round(salePrice/surface)} EUR/m²)\`);`

---

## Corrections P1 — Impact fort sur conversion Marc

### P1.1 — Pas de CTA si telephone absent
**Fichier** : `app/annonce/[uuid]/page.tsx` ligne 287-299
**Probleme** : Si `merchant.telephone` est null, aucun bouton d'action above-the-fold. Marc est bloque.
**Fix** : Afficher un bouton email si telephone absent : `href={`mailto:${merchant.email_pro}`}` avec label "Envoyer un message".

### P1.2 — Atouts non scannable sur mobile
**Fichier** : `app/annonce/[uuid]/page.tsx` — section description (ligne 341-357)
**Probleme** : La description GPT est un bloc texte. Marc scanne, ne lit pas. Les atouts (parking, cave, exposition Sud) sont noyes dans les pills de caracteristiques, pas dans un bloc visuellement distinct.
**Fix** : Extraire les 3 atouts principaux en une liste a puces courtes au-dessus de la description complete. Exemple structure :
```tsx
<ul className="mb-4 space-y-1">
  {[property.parking && "Parking", property.cave && "Cave", property.exposition && `Exposition ${property.exposition}`]
    .filter(Boolean).slice(0,3).map((item) => (
    <li key={item} className="text-sm text-foreground flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-sage inline-block" />
      {item}
    </li>
  ))}
</ul>
```

### P1.3 — Etat vide annonce sans photos sans CTA
**Fichier** : `app/annonce/[uuid]/page.tsx` ligne 313-318
**Probleme** : "Aucune photo disponible" sans direction. Marc quitte.
**Fix** : Remplacer par un message avec CTA de contact : "Photos en cours de preparation — contactez-nous pour les recevoir en avant-premiere" + bouton appel/email.

### P1.4 — Dossier : description_commerciale absente = page vide
**Fichier** : `app/dossier/[uuid]/page.tsx` ligne 192-200
**Probleme** : Si `dossier.description_commerciale` est null, le bloc est silencieusement omis. Aucun fallback. Page desequilibree.
**Fix** : Afficher un placeholder sobre si description absente : "Description en cours de redaction." — ou mieux, relancer la generation automatique si le dossier vient d'etre cree.

---

## Score global post-corrections estimees

| Critere | Avant | Apres P0+P1 |
|---|---|---|
| Thomas — Titre vendeur | 7 | 8 (editable) |
| Thomas — Description complete | 8 | 9 (prix vente dans LLM) |
| Thomas — Infos financieres | 7 | 9 (prix/m2 bien present) |
| Thomas — Dossier pro | 8 | 9 |
| Thomas — Modifiable avant envoi | 6 | 9 (PATCH endpoint) |
| **Score Thomas** | **7.2** | **8.8** |
| Marc — Comprend en 30s | 8 | 9 |
| Marc — Appeler 1 tap | 9 | 9 |
| Marc — Photos projection | 8 | 8 |
| Marc — Quartier | 7 | 8 (atouts scannable) |
| Marc — Envie d'appeler | 7 | 8 |
| **Score Marc** | **7.8** | **8.4** |

**Pour atteindre 10/10** : il faudrait en plus (P2, hors scope immediat) — video walkthrough des pieces, badge tension marche ("3 visites cette semaine"), estimation loyer potentiel pour les investisseurs, et notification SMS/email a Thomas quand Marc clique sur "Appeler".

---

**Handoff → @fullstack**
- Fichier produit : `/docs/reviews/final-audit-10-10.md`
- Corrections P0 prioritaires : P0.1 (pill prix/m2 bien, 1h), P0.2 (PATCH titre annonce, 2h), P0.3 (prix vente dans LLM, 30min)
- Corrections P1 : P1.1 (CTA email fallback, 30min), P1.2 (atouts scannable, 1h), P1.3 (etat vide avec CTA, 30min), P1.4 (fallback description dossier, 30min)
- Points d'attention : P0.2 necessite un endpoint PATCH + mise a jour lib/annonce + UI inline edit. Ne pas toucher a la logique de generation de titre existante, juste permettre l'ecrasement post-creation.
