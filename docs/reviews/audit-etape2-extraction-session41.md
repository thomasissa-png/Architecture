# Audit UX Thomas Berger -- Etape 2 : Extraction IA (Detection des pieces)

> Auditeur : Thomas Berger, 35 ans, marchand de biens a Bordeaux, iPhone 15 Pro + laptop Windows.
> Methode : lecture code source exhaustive (page.tsx + route.ts + ProStepper.tsx + RoomCard.tsx + plan-extractor.ts)
> Date : 2026-04-10
> Session : 41
> Seuil : 9.5/10 minimum (preference fondateur)

---

## Note : 7.0 / 10

## Verdict en une phrase

"L'extraction se lance toute seule, le loader est joli avec un timer, les erreurs sont claires -- mais je ne vois pas le plan que j'ai uploade, l'IA jette le type de piece qu'elle detecte, et si je reviens sur cette page apres l'avoir passee il y a un flash de loading inutile avant redirection."

---

## Grille 10 criteres

| # | Critere | Note /10 | Observation |
|---|---------|----------|-------------|
| 1 | Retrouvabilite | 7/10 | Le stepper montre l'etape 2 active et l'etape 1 terminee. Mais pas de breadcrumb ni de lien "Retour au projet" nomme. Le bouton "Retour" dans l'etat succes fait `router.back()` -- si Thomas a fait un detour (onglet ferme, lien direct), il ne retourne pas forcement au bon endroit. |
| 2 | Prix/valeur | N/A | Pas de tarification sur cette etape (l'extraction est incluse dans le projet). |
| 3 | Qualite pro | 7/10 | L'animation de scan est propre (ligne bleue qui descend/monte sur un fond plan). Mais pas d'apercu du plan uploade pendant l'analyse -- Thomas ne sait pas SI c'est le bon plan qui est en cours d'analyse. |
| 4 | Partage acquereurs | N/A | Pas de partage a cette etape. |
| 5 | Gestion d'erreur | 8.5/10 | Tres bien : message specifique si "aucune piece detectee" (NO_ROOMS_DETECTED), message reseau ("Verifiez votre connexion"), rate limit ("Maximum 3 extractions"), projet deja extrait (redirect 409). Deux boutons en cas d'erreur : "Reessayer" et "Saisir manuellement". Le seul manque : pas d'indication du nombre de tentatives restantes (3 max par projet). |
| 6 | Simplicite | 8/10 | L'extraction se lance automatiquement au mount -- zero clic. Le timer avec estimation "~30 secondes" est bien. Les etapes du loader sont adaptees (0-10s, 10-30s, >30s). Le message d'erreur est en francais clair, pas technique. |
| 7 | Confiance | 7/10 | Le branding est coherent (Header Versimo, palette sage/foreground). Mais pendant le chargement, pas de miniature du plan -- Thomas pourrait douter que le bon fichier est en cours d'analyse. |
| 8 | Completude | 6/10 | La page affiche la liste des pieces avec nom et type mais : (a) le room_type est force a "autre" pour TOUTES les pieces -- l'IA connait pourtant le nom "Salon", "Cuisine" etc. via name_raw, (b) pas de surface affichee sur les RoomCards, (c) pas de nombre de fenetres/portes, (d) pas de score de confiance. L'IA extrait tout ca mais l'utilisateur ne voit que le nom. |
| 9 | Mobile-first | 6.5/10 | Le layout px-4 max-w-2xl est bon. MAIS les dots du stepper mobile font w-6 h-6 (24x24px) -- en dessous du seuil Apple 44x44px. Les boutons d'action ("Reessayer", "Saisir manuellement", "Valider et continuer") sont bien dimensionnes (py-2.5 px-4). La zone d'animation (w-48 h-48) est fixe et pourrait deborder sur petit ecran (non, 192px < 375px, OK). |
| 10 | Rapidite | 7.5/10 | L'extraction se lance au mount sans clic -- bien. Estimation "~30 secondes" affichee -- bien. Mais apres succes, pas de redirection automatique vers l'etape 3 : Thomas doit cliquer "Valider et continuer". C'est un choix acceptable (il veut peut-etre verifier les pieces) mais un auto-scroll vers les resultats serait bienvenu. |

---

## Points positifs

1. **Lancement automatique** -- Au mount, `useEffect` appelle `runExtraction()`. Zero friction, zero clic. Thomas ouvre la page et c'est parti.
2. **Timer avec estimation** -- Le chrono en secondes avec 3 paliers ("~30 secondes", "Extraction en cours...", "Presque termine...") donne de la visibilite.
3. **Animation de scan** -- La ligne bleue qui descend/monte sur l'icone de plan est un bon feedback visuel, plus professionnel qu'un simple spinner.
4. **Gestion d'erreur complete** -- 5 cas d'erreur geres distinctement : (a) aucune piece detectee, (b) rate limit 429, (c) projet deja extrait 409 -> redirection auto, (d) erreur serveur 500, (e) erreur reseau (catch). Messages en francais clair.
5. **Double issue en erreur** -- "Reessayer l'extraction" ET "Saisir les pieces manuellement" : Thomas n'est jamais bloque.
6. **Auto-lot pour non-immeuble** -- La route API assigne automatiquement les pieces extraites au lot existant si le bien n'est pas un immeuble. Thomas n'a pas a gerer les lots pour un simple appartement.
7. **Resilience IA** -- Le plan-extractor fait un retry automatique apres 5s + une self-correction Zod si le JSON est invalide. Robuste.
8. **Stepper coherent** -- L'etape 2 est active, l'etape 1 cochee en vert, les etapes futures verrouillees. Le visuel est clair.

---

## Problemes et recommandations

### P0 -- room_type force a "autre" (gaspillage de l'extraction IA)

**Fichier** : `app/api/pro/projects/[id]/extract/route.ts` l.145

```typescript
"autre", // Default -- user corrects in step 3
```

L'IA via GPT-4.1 analyse le plan et retourne `name_raw` qui contient des noms francais comme "Salon", "Chambre 1", "Cuisine", "SDB". Mais le code ignore cette information et met `room_type = "autre"` pour TOUTES les pieces. Thomas voit 6 pieces toutes marquees "Autre" et doit les corriger une par une a l'etape 3.

**Correction** : Ajouter un mapping `nameRawToRoomType()` qui deduit le room_type de name_raw. Exemples : "Salon" -> "salon", "Cuisine" -> "cuisine", "Chambre" -> "chambre", "Salle de bain"/"SDB" -> "sdb", "WC"/"Toilettes" -> "wc", "Bureau" -> "bureau", "Couloir"/"Hall"/"Entree" -> "couloir". Fallback "autre" seulement si aucun pattern ne matche.

```typescript
function inferRoomType(nameRaw: string): string {
  const n = nameRaw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (/salon|sejour|living|salle.*manger/.test(n)) return "salon";
  if (/cuisine|kitchen/.test(n)) return "cuisine";
  if (/chambre|bedroom/.test(n)) return "chambre";
  if (/salle.*bain|sdb|bathroom/.test(n)) return "sdb";
  if (/wc|toilet/.test(n)) return "wc";
  if (/bureau|office/.test(n)) return "bureau";
  if (/couloir|hall|entree|degagement/.test(n)) return "couloir";
  if (/cave|cellier|rangement/.test(n)) return "cave";
  return "autre";
}
```

**Impact** : Elimine 80%+ des corrections manuelles a l'etape 3. Gain de temps enorme pour Thomas.

---

### P1-1 -- Pas d'apercu du plan pendant l'extraction

**Fichier** : `app/projet/[id]/extraction/page.tsx`

Pendant le chargement (state === "loading"), Thomas voit une icone SVG generique de grille. Il ne voit PAS le plan qu'il a uploade. Il ne peut pas verifier qu'il analyse le bon fichier. Sur un chantier ou Thomas uploade 3 plans dans la meme matinee (RDC, etage 1, etage 2), c'est un vrai risque d'erreur.

**Correction** : Charger le plan en miniature via `/api/pro/projects/${projectId}` (qui retourne deja plan_file_path) et l'afficher sous la ligne de scan. L'animation de scan passerait PAR DESSUS la miniature du plan au lieu du placeholder SVG.

---

### P1-2 -- Completude des RoomCards en etat success

**Fichier** : `app/projet/[id]/extraction/page.tsx` l.270-280

Les RoomCards en etat success n'affichent que le `name` et le `room_type`. Mais l'API retourne aussi potentiellement `surface_m2`, et l'extracteur IA remplit `windows_count`, `doors_count`, `confidence`, `shape`. Ces infos ne sont pas transmises au client.

La route API l.131-159 ne retourne que `id`, `name`, `room_type` via `RETURNING id, name, room_type`. Donc le client n'a pas access a la surface.

**Correction** : Modifier le `RETURNING` en `RETURNING id, name, room_type, surface_m2` et passer `surface_m2` dans le response JSON. Le RoomCard accepte deja `surface_m2` dans son interface.

---

### P1-3 -- Flash de loading au retour navigateur

**Fichier** : `app/projet/[id]/extraction/page.tsx` l.96-99

L'`useEffect` appelle `runExtraction()` au mount sans verifier le statut du projet. Si Thomas est deja a l'etape 3 et appuie sur "Retour" dans le navigateur, il revient sur cette page. Le useEffect se declenche, la page affiche le loader pendant 200-500ms, l'API retourne 409, et la page redirige vers /validation.

Ce flash (etat loading -> redirection) est desagreable et peu professionnel. Thomas pourrait croire que l'extraction est relancee.

**Correction** : Avant de lancer l'extraction, verifier le statut du projet via un GET. Si status === "extraction_done" ou superieur, rediriger immediatement sans passer par l'etat loading. Alternative : passer le status du projet en query param ou via un state de la navigation.

---

### P1-4 -- Tentatives restantes non affichees

**Fichier** : `app/api/pro/projects/[id]/extract/route.ts` l.54

La rate limit est de 3 extractions par projet par heure. Mais ni l'API ni la page n'indiquent combien de tentatives restent. Si Thomas echoue 2 fois et reessaye, il pourrait etre bloque sans comprendre pourquoi.

**Correction** : Retourner `remaining_attempts` dans la reponse API (succes et erreur). L'afficher dans l'etat erreur : "Reessayer l'extraction (2 tentatives restantes)" au lieu de juste "Reessayer l'extraction".

---

### P2-1 -- Dots stepper mobile trop petits (24px)

**Fichier** : `components/marchand/ProStepper.tsx` l.240

Les dots du stepper mobile font `w-6 h-6` = 24x24px. Le minimum Apple pour les touch targets est 44x44px. Un doigt sur iPhone 15 Pro pourrait rater la cible.

**Correction** : Garder le visuel a 24px (circle) mais ajouter un padding invisible autour pour atteindre 44px de zone cliquable : `min-w-[44px] min-h-[44px]` sur le bouton qui wrap le dot, avec le dot centre dedans.

---

### P2-2 -- Pas de redirection automatique apres succes (debattable)

**Fichier** : `app/projet/[id]/extraction/page.tsx`

Apres extraction reussie, Thomas doit cliquer "Valider et continuer". C'est un clic supplementaire. Certains marchands preferent verifier les pieces, d'autres veulent aller vite.

**Correction** : Ajouter une redirection automatique apres 5 secondes avec un compte a rebours visible : "Redirection automatique dans 5s..." + bouton "Annuler" qui stoppe le timer. Ainsi Thomas peut verifier rapidement ET ne pas etre bloque s'il ne regarde pas l'ecran.

---

### P2-3 -- Animation scanLine en style jsx inline

**Fichier** : `app/projet/[id]/extraction/page.tsx` l.319-324

L'animation est definie via `<style jsx>` en fin de composant. Bien que supporte par Next.js, c'est une approche peu standard dans un projet full Tailwind. Risque de non-purge en production et inconsistance avec le reste du code.

**Correction** : Deplacer l'animation dans `globals.css` ou la definir dans `tailwind.config.ts` sous `extend.keyframes`.

---

### P2-4 -- Bouton "Retour" fait router.back() sans cible garantie

**Fichier** : `app/projet/[id]/extraction/page.tsx` l.294

Si Thomas arrive sur cette page via un lien direct (copie-colle, bookmark, refresh), `router.back()` le renvoie a la page precedente dans l'historique du navigateur -- qui pourrait etre sa boite mail, Google, ou n'importe quoi. Pas forcement l'etape 1.

**Correction** : Remplacer `router.back()` par `router.push(\`/projet/${projectId}\`)` ou `/projet/nouveau` selon le flow.

---

## Resume des corrections

| Priorite | ID | Description | Fichier |
|----------|-----|-------------|---------|
| P0 | 1 | room_type force a "autre" -- utiliser name_raw pour inferer | route.ts l.145 |
| P1 | 2 | Pas d'apercu du plan pendant l'extraction | page.tsx (loading state) |
| P1 | 3 | Completude RoomCards : surface non retournee par l'API | route.ts RETURNING, page.tsx |
| P1 | 4 | Flash de loading au retour navigateur (pas de check statut) | page.tsx useEffect |
| P1 | 5 | Tentatives restantes non affichees | route.ts + page.tsx |
| P2 | 6 | Touch targets stepper mobile 24px < 44px | ProStepper.tsx |
| P2 | 7 | Pas de redirection auto apres succes | page.tsx |
| P2 | 8 | Animation scanLine en style jsx inline | page.tsx |
| P2 | 9 | Bouton Retour router.back() sans cible garantie | page.tsx |

---

## Conclusion Thomas

"L'etape 2 fait le boulot : ca se lance tout seul, je vois un timer, si ca plante j'ai deux options. C'est correct. Mais quand je vois que l'IA detecte 'Salon', 'Cuisine', 'Chambre 1' et que ca me met tout en 'Autre', ca me saoule -- je vais devoir tout re-remplir a la main a l'etape 3. Et ne pas voir mon plan pendant l'analyse, c'est un manque de confiance. 7/10, il y a du potentiel mais il faut finir le boulot."
