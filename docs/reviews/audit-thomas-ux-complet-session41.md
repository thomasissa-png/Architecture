# Audit UX Thomas Berger -- Parcours Marchand Versimo (Session 41)

> Auditeur : Thomas Berger, 35 ans, marchand de biens a Bordeaux, iPhone 15 Pro + laptop Windows.
> Methode : lecture exhaustive du code source de chaque page + route API, simulation mentale etape par etape.
> Date : 2026-04-10
> Seuil : 9.5/10 minimum (preference fondateur)

---

## Note globale : 6.4 / 10

## Verdict en une phrase

"Le parcours est structure et l'interface est propre, mais le PDF n'existe pas, le paiement n'est pas cable, et il manque tellement de pieces au puzzle que je ne peux pas envoyer un seul dossier a un acquereur aujourd'hui."

---

## Notes par etape

| Etape | Note /10 | Commentaire Thomas |
|---|---|---|
| 1. Nouveau bien | 7.5/10 | Formulaire clair, drag & drop OK, prix visible. Mais le paiement n'est pas cable -- le bouton dit "Payer 99 EUR" mais le code ne fait rien cote Stripe. |
| 2. Extraction IA | 7.0/10 | Animation de chargement sympa, timer present, messages d'erreur corrects. Mais je ne vois pas d'apercu du plan que j'ai uploade. |
| 3. Validation | 8.0/10 | La meilleure etape. Je peux renommer, changer le type, ajouter une piece, associer une photo. Upload sequentiel par piece avec progress. Solide. |
| 4. Qualification | 7.5/10 | Choix cible/style clairs, recap des pieces avec photos. Mais le feedback "Qualification enregistree" disparait en 800ms avant redirect -- trop rapide pour confirmer visuellement. |
| 5. Recommandations | 6.5/10 | Les recommandations se generent en parallele, les cartes sont belles. Mais les decisions accepter/refuser sont fire-and-forget -- si le reseau coupe, la decision est perdue sans que je le sache. |
| 6. Generation | 7.0/10 | Barre de progression, timer, grille de visuels avec statut par piece. Mais pas de retry par piece individuelle -- si 1 piece echoue sur 6, je dois tout relancer. |
| 7. Dossier | 4.0/10 | C'est ici que tout s'ecroule. Le PDF n'est pas un vrai PDF -- la route retourne du JSON brut. Le partage WhatsApp pointe vers /dossier/[projectId] qui est une AUTRE page (l'ancien systeme). Zero coherence. |

---

## Problemes critiques (P0)

### P0-1 -- Le PDF n'est PAS un PDF

**Fichier** : `app/api/pro/projects/[id]/dossier/pdf/route.ts`

L'API `/dossier/pdf` retourne du JSON, pas un fichier PDF. Le commentaire dit "V1 = JSON summary ; le rendu PDF sera ajoute en Phase 5." Thomas appuie sur "Telecharger PDF" et recoit... un fichier JSON. Pour un marchand qui veut envoyer une plaquette a un acquereur, c'est eliminatoire.

Le code cote client (`dossier/page.tsx` l.254-278) fait un POST, recoit `data.pdf_url`, et tente un download. Mais `data.pdf_url` ne contient rien puisque la route ne retourne jamais de `pdf_url`. Le bouton ne fait donc rien.

**Impact** : Thomas ne peut pas generer de dossier. L'etape 7 est une impasse. Le parcours complet (99 EUR) se termine sur un mur.

### P0-2 -- Le paiement n'est pas cable

**Fichier** : `app/projet/nouveau/page.tsx` l.158-185, `app/api/pro/projects/route.ts`

Le bouton dit "Payer 99 EUR et commencer" mais le code fait un simple `POST /api/pro/projects` qui cree le projet sans aucune verification de paiement. Pas d'appel Stripe, pas de checkout, pas de debit credit Pro. Le client `useProStatus()` regarde `session.user.credits_remaining` mais ne les debite jamais.

L'API cote serveur ne verifie meme pas si l'utilisateur a paye : elle insere en base et retourne 201.

**Impact** : N'importe qui peut creer un projet gratuitement. Soit c'est du "tout gratuit pendant la beta" (auquel cas il ne faut PAS afficher 99 EUR), soit c'est un bug de cablage. Dans les deux cas, Thomas est perdu.

### P0-3 -- Le lien de partage pointe vers l'ancien systeme

**Fichier** : `app/projet/[id]/dossier/page.tsx` l.284-286

```typescript
function getShareUrl(): string {
  return `${window.location.origin}/dossier/${projectId}`;
}
```

Cette URL pointe vers `/dossier/[uuid]` qui est la page de l'ANCIEN systeme de dossiers (celui avec `getDossierByIdentifier`, `DossierPublicView`, etc.). Le `projectId` du nouveau systeme (table `pro_projects`) n'est pas un UUID de dossier de l'ancien systeme (table `dossiers`). Le lien partage 404.

**Impact** : Thomas envoie un lien WhatsApp a son acquereur. L'acquereur ouvre le lien. Page introuvable. Credibilite zero.

### P0-4 -- La route validate bloque si status != extraction_done

**Fichier** : `app/api/pro/projects/[id]/validate/route.ts` l.63-71

```typescript
if (project.status !== "extraction_done") {
  return NextResponse.json({ error: "INVALID_STATUS" }, { status: 409 });
}
```

Si Thomas saute l'extraction (plan illisible) et va directement a la validation (via "Saisir les pieces manuellement"), le statut du projet est `plan_uploaded` ou `extraction_failed`. La validation retourne 409. Thomas est bloque.

Le bouton "Saisir les pieces manuellement" redirige bien vers `/projet/[id]/validation` mais l'API refuse la sauvegarde.

**Impact** : En cas d'echec d'extraction, Thomas ne peut pas continuer. Le parcours est casse.

---

## Problemes importants (P1)

### P1-1 -- Pas de retour possible vers le stepper

**Fichier** : `components/marchand/ProStepper.tsx`

Le stepper est purement visuel -- aucune etape n'est cliquable. Si Thomas est a l'etape 5 et veut revenir a l'etape 3 pour modifier une piece, il doit utiliser le bouton "Retour" en bas de chaque page. Pas de navigation directe. Sur un flux en 7 etapes, c'est penible.

Le stepper affiche les numeros, les etats (completed/active/locked/error), mais `<li>` n'a aucun `onClick`, aucun `<a>`, aucun lien. C'est un composant de presentation pure.

### P1-2 -- Vocabulaire "credit" residuel

**Fichier** : `app/projet/nouveau/page.tsx` l.452-458

Le bouton affiche "1 credit" et "inclus dans votre abonnement" quand l'utilisateur est Pro. Le lessons-learned documente explicitement : "le terme commercial est 'visuel' (pas 'credit')". Ici, le code utilise encore "credit Pro" ce qui contredit la decision fondateur.

### P1-3 -- Aucune sauvegarde intermediaire en validation (etape 3)

**Fichier** : `app/projet/[id]/validation/page.tsx`

Thomas a 8 pieces, il modifie les noms, les types, les surfaces, il associe 6 photos. Mais tout est en memoire locale. S'il ferme l'onglet, quitte Safari pour repondre a un appel sur son iPhone, ou si le reseau coupe : tout est perdu.

Le code a un `isDirty.current` qui affiche "Modifications non sauvegardees" mais ne fait AUCUN auto-save. Tout est envoye d'un coup au clic "Valider". Un formulaire de 8 pieces avec 6 uploads photos sans sauvegarde intermediaire, c'est risque.

### P1-4 -- Aucune confirmation avant de quitter avec modifications non sauvegardees

**Fichier** : `app/projet/[id]/validation/page.tsx`

Le composant n'a pas de `beforeunload` handler. Thomas peut fermer l'onglet apres 10 minutes de travail sans aucune alerte. Le `isDirty.current` existe mais n'est jamais utilise pour empecher la navigation.

### P1-5 -- Les recommandations accepter/refuser sont fire-and-forget

**Fichier** : `app/projet/[id]/recommandations/page.tsx` l.204-226

```typescript
fetch(...).catch(() => {
  // Non-critical -- decision is in UI state
});
```

Si le PATCH echoue (reseau, 500), la decision est "acceptee" visuellement mais jamais persistee. Thomas pense avoir applique une recommandation, mais quand il revient 3 semaines plus tard, la recommandation est de nouveau "en attente".

### P1-6 -- Pas de lien "Mon projet" ou "Mes projets" dans le header

**Fichier** : `components/Header.tsx` (via variant="internal")

Quand Thomas est dans le parcours (etapes 1-7), le header n'a aucun lien vers une liste de projets. Il n'y a pas de page `/mes-projets` ou equivalent. Si Thomas a 3 projets en cours, il n'a aucun moyen de passer de l'un a l'autre.

### P1-7 -- Le bouton delete piece n'a pas de min-h-[44px]

**Fichier** : `app/projet/[id]/validation/page.tsx` l.505-526

Le bouton supprimer est un `p-1.5` avec une icone 14x14. Le target tactile est d'environ 24px, bien en dessous des 44px minimum Apple. Sur iPhone, Thomas risque de taper a cote et de ne pas comprendre pourquoi ca ne marche pas.

### P1-8 -- Le "Retour" de l'etape 1 n'existe pas

**Fichier** : `app/projet/nouveau/page.tsx`

Il n'y a aucun bouton "Retour" ou "Annuler" sur la page de creation de projet. Si Thomas a clique par erreur, il doit utiliser le bouton retour du navigateur. Toutes les autres etapes ont un bouton "Retour" sauf la premiere.

### P1-9 -- La page generation relance tout si on la recharge

**Fichier** : `app/projet/[id]/generation/page.tsx` l.86-118

La generation est declenchee au mount via `useEffect`. Si Thomas quitte et revient, ou si le navigateur recharge la page, le POST `/generate` est relance. La route serveur (l.90-95) a une protection 409 si "deja en cours" mais pas si la generation est deja TERMINEE. Thomas risque de relancer une generation qui avait deja reussi, consommant ses credits/son paiement.

---

## Problemes moyens (P2)

### P2-1 -- Le type "autre" est le defaut pour toutes les pieces extraites

**Fichier** : `app/api/pro/projects/[id]/extract/route.ts` l.146

```typescript
"autre", // Default -- user corrects in step 3
```

L'IA extrait les pieces mais le type est toujours "autre". L'extraction IA devrait detecter "salon", "cuisine", etc. a partir du plan. Obliger Thomas a retyper 8 pieces manuellement apres une "extraction IA" annule l'interet de l'extraction.

### P2-2 -- Le stepper mobile masque les sublabels

**Fichier** : `components/marchand/ProStepper.tsx` l.188

Les sublabels ("Upload", "Detection des pieces", "Cible", etc.) sont masques sur mobile. Thomas voit juste "Projet", "Analyse", "Validation", etc. Sans sublabel, "Qualification" ne veut rien dire pour un marchand de biens.

### P2-3 -- Pas de preview du plan uploade

**Fichier** : `app/projet/[id]/extraction/page.tsx`

Pendant l'extraction, Thomas voit une animation de scan generique mais pas son propre plan. Il ne sait pas si le bon fichier a ete uploade. Un apercu du plan a cote de l'animation serait rassurant.

### P2-4 -- Le bouton "Retour aux visuels" sur le dossier est confus

**Fichier** : `app/projet/[id]/dossier/page.tsx` l.778-785

Apres l'etape 7 (dossier), les 2 boutons sont "Voir tous mes biens" et "Retour aux visuels". "Retour aux visuels" ramene a l'etape 6 (generation). Pourquoi Thomas voudrait-il retourner a la generation ? Le bouton devrait etre "Modifier le dossier" ou "Regenerer les visuels" si c'est l'intention.

---

## Ce qui marche bien

1. **Le stepper visuel** (ProStepper) est propre et informatif. Les etats completed/active/locked/error sont clairs. Le check vert fonctionne bien visuellement. L'adaptation mobile vertical est correcte.

2. **La page validation (etape 3)** est la meilleure du parcours. Le layout photo/champs est compact et lisible. L'upload par piece avec apercu immediat fonctionne. Le warning "Pas de photo -- cette piece ne sera pas generee" est utile.

3. **La page qualification (etape 4)** est bien pensee. Le recap des pieces avec photos dans une grille responsive est rassurant -- Thomas voit ce qui va etre genere. Les champs obligatoires sont marques avec un asterisque rouge.

4. **La page generation (etape 6)** a un bon feedback. La barre de progression, le timer, le statut par piece ("Preparation de la piece", "Ajout du mobilier"), les indicateurs visuels (pulse bleu, check vert, ! rouge) sont professionnels.

5. **Les cartes de recommandation** (RecommendationCard) sont elegantes. L'icone par type, le cout estime, le niveau d'impact, les boutons accepter/refuser avec changement d'etat visuel -- c'est du travail soigne.

6. **Le partage** sur la page dossier est bien pense : copier lien, WhatsApp (avec navigator.share sur mobile), email. Le toast "Lien copie" est correct.

7. **La validation Zod** cote serveur est rigoureuse. Chaque route valide les inputs, verifie l'ownership du projet, applique un rate limit.

8. **Le drag & drop** sur l'upload plan fonctionne avec feedback visuel (bordure verte, fond vert pale).

---

## Grille 10 criteres Thomas

| # | Critere | Note /10 | Detail |
|---|---------|----------|--------|
| 1 | Retrouvabilite | 4/10 | Pas de page "Mes projets". Pas de lien de navigation entre projets. Un fois sorti du parcours, je ne retrouve pas mon projet. |
| 2 | Prix/valeur | 5/10 | Le prix est affiche (99 EUR) mais le paiement n'est pas cable. Je ne sais pas si je paie vraiment ou si c'est gratuit. Confusion totale. |
| 3 | Qualite pro | 7/10 | Les visuels generes utilisent le pipeline 2 passes, prompts v57. La qualite de l'outil de base est la. Mais le dossier final n'existe pas. |
| 4 | Partage acquereurs | 3/10 | Le lien de partage pointe vers l'ancien systeme (404). Le PDF n'existe pas. Je ne peux rien envoyer a un acquereur. |
| 5 | Gestion d'erreur | 7/10 | Les messages d'erreur sont clairs et en francais. Les etats d'erreur ont des boutons "Reessayer". Mais les decisions fire-and-forget peuvent silencieusement echouer. |
| 6 | Simplicite | 7/10 | Le parcours en 7 etapes est guide, lineaire, comprehensible. Le stepper aide a se reperer. Mais 7 etapes c'est beaucoup -- la qualification et les recommandations pourraient etre optionnelles. |
| 7 | Confiance | 6/10 | Le branding est propre (Header/Footer Versimo). Mais le "V1 = JSON summary" dans les commentaires et le lien de partage casse detruisent la confiance si on les decouvre. |
| 8 | Completude | 5/10 | DPE absent, prix du bien absent du formulaire initial, nombre de pieces absent. Surface optionnelle. Le dossier final est un JSON brut. Les infos du bien sont incompletes. |
| 9 | Mobile-first | 7/10 | Le stepper s'adapte (vertical mobile). Les formulaires sont en pleine largeur. Mais le bouton supprimer piece est trop petit (24px), et la barre d'actions du dossier wrap mal sur petit ecran. |
| 10 | Rapidite | 7/10 | L'extraction IA prend ~30s, la generation ~1.5min/piece. Les timers sont affiches. Mais le parcours complet en 7 etapes oblige Thomas a passer par des etapes qui pourraient etre auto-completees. |

**Moyenne ponderee : 5.8/10**

---

## Le mot de la fin

Le parcours marchand Versimo a une bonne structure -- les 7 etapes sont logiques, l'interface est propre, le design system est coherent. Mais c'est un prototype, pas un produit. Le PDF n'existe pas, le paiement n'est pas cable, le lien de partage pointe dans le vide, et je ne peux pas retrouver mon projet si je quitte. Pour un marchand qui paie 99 EUR par bien, c'est inacceptable. Je ne paie pas 99 EUR pour un JSON brut et un lien 404. Quand le PDF et le paiement seront cables, et quand le lien de partage marchera, on pourra parler de produit. Aujourd'hui, c'est un parcours de demo.

Note : 6.4/10 -- bien en dessous du seuil de 9.5/10.

---

## Corrections requises -- Plan d'action

### Bloc 1 -- Indispensables (P0, sans ca le produit ne sert a rien)

| # | Probleme | Fichier(s) | Correction |
|---|----------|-----------|------------|
| P0-1 | Le PDF est du JSON | `app/api/pro/projects/[id]/dossier/pdf/route.ts` | Implementer la generation PDF reelle (pdf-lib ou equivalent). Le dossier doit contenir : logo marchand, adresse, visuels avant/apres par piece, description commerciale, infos du bien. Retourner un `application/pdf` avec Content-Disposition. |
| P0-2 | Paiement non cable | `app/projet/nouveau/page.tsx`, `app/api/pro/projects/route.ts` | Soit integrer Stripe Checkout avant la creation du projet, soit debiter 1 credit Pro via l'API existante, soit retirer le prix de l'interface si c'est gratuit en beta. |
| P0-3 | Lien partage 404 | `app/projet/[id]/dossier/page.tsx` | Creer une page publique `/projet/public/[token]` dediee au nouveau systeme, ou generer un share_token dans la table `pro_projects` et utiliser `/dossier/[share_token]` avec un adaptateur. |
| P0-4 | Validate bloque si status != extraction_done | `app/api/pro/projects/[id]/validate/route.ts` l.63 | Ajouter `extraction_failed` et `plan_uploaded` aux statuts autorises pour la validation. Un plan illisible ne doit pas bloquer le parcours. |

### Bloc 2 -- Importants (P1, le produit fonctionne mais l'experience est fragile)

| # | Probleme | Fichier(s) | Correction |
|---|----------|-----------|------------|
| P1-1 | Stepper non cliquable | `components/marchand/ProStepper.tsx` | Rendre les etapes completed cliquables avec un `<Link>` vers `/projet/[id]/[etape]`. Les etapes locked restent non-cliquables. |
| P1-2 | "credit" au lieu de "visuel" | `app/projet/nouveau/page.tsx` l.452-458 | Remplacer "1 credit" par "1 visuel" et "Credit Pro" par "Inclus dans votre abonnement Pro". |
| P1-3 | Pas de sauvegarde intermediaire | `app/projet/[id]/validation/page.tsx` | Ajouter un debounced auto-save (2s apres derniere modification) via PATCH sur les champs texte. Pour les photos, upload immediat au lieu d'attendre la validation. |
| P1-4 | Pas de beforeunload | `app/projet/[id]/validation/page.tsx` | Ajouter `window.addEventListener("beforeunload", handler)` quand `isDirty.current === true`. |
| P1-5 | Decisions fire-and-forget | `app/projet/[id]/recommandations/page.tsx` | Ajouter un retry avec feedback visuel (toast rouge "Erreur de sauvegarde -- Reessayez") en cas d'echec du PATCH. |
| P1-6 | Pas de "Mes projets" | Header + nouvelle page | Creer `/mes-projets/page.tsx` avec la liste des projets de l'utilisateur (statut, adresse, date). Ajouter un lien dans le header variant="internal". |
| P1-7 | Bouton supprimer trop petit | `app/projet/[id]/validation/page.tsx` l.505 | Ajouter `min-h-[44px] min-w-[44px]` au bouton supprimer. |
| P1-8 | Pas de bouton Retour etape 1 | `app/projet/nouveau/page.tsx` | Ajouter un lien "Annuler" sous le formulaire ou dans le header, qui redirige vers `/mes-projets` ou `/`. |
| P1-9 | Generation relancee au reload | `app/projet/[id]/generation/page.tsx` | Verifier le statut du projet AVANT de lancer le POST. Si `status === "generated"` ou si des visuels existent deja, afficher directement les resultats sans relancer. |

### Bloc 3 -- Ameliorations (P2)

| # | Probleme | Correction |
|---|----------|------------|
| P2-1 | Type "autre" par defaut | L'extracteur IA devrait retourner le type detecte. Mapper les labels du plan vers les types de la liste. |
| P2-2 | Sublabels masques sur mobile | Afficher le sublabel de l'etape ACTIVE uniquement (pas toutes). Ca ne prend pas plus de place. |
| P2-3 | Pas d'apercu du plan | Afficher une miniature du plan uploade a cote de l'animation de scan. |
| P2-4 | "Retour aux visuels" confus | Renommer en "Regenerer des visuels" si c'est l'intention, ou supprimer si inutile.
