# Audit Etape 5 -- Recommandations Architecte IA (Session 42)

> Auditeur : Thomas Berger, 35 ans, marchand de biens a Bordeaux, iPhone 15 Pro + laptop Windows.
> Methode : lecture exhaustive du code source page + API + composants, simulation mentale etape par etape.
> Date : 2026-04-10
> Seuil : 9.5/10 minimum (preference fondateur)

---

## Note globale : 7.8 / 10

## Verdict en une phrase

"Les recommandations se generent correctement, les cartes sont belles et l'optimistic UI fonctionne enfin, mais il manque le retour utilisateur sur la progression lot par lot, aucune estimation de duree sur les travaux, et le bouton 'Lancer la generation' me laisse passer meme si j'ai rien decide -- c'est trop permissif pour un engagement a 99 euros."

---

## Tableau 10 criteres

| # | Critere | Note | Commentaire Thomas |
|---|---------|------|-------------------|
| 1 | Retrouvabilite | 8.5 | Le stepper est clair, l'etape 5 s'appelle "Recommandations / Architecte" -- je sais ou je suis. Navigation vers les etapes precedentes OK via les pastilles cliquables. Si je reviens 3 semaines plus tard, je retrouve mes recommandations deja generees sans regeneration (chargement depuis la DB). |
| 2 | Prix/valeur | 6.0 | Le cout estime par recommandation est affiche (ex: "2 500 EUR") -- bien. Mais il n'y a AUCUNE synthese du cout total des recommandations acceptees. Si j'accepte 5 recommandations, je dois additionner mentalement. Un marchand veut savoir en 1 coup d'oeil combien ca coute GLOBALEMENT. Pas de mention du cout de generation IA non plus. |
| 3 | Qualite pro | 8.0 | Les types de recommandation sont pertinents (redistribution, fusion, conversion, optimisation). Les icones sont differenciees. L'impact est affiche (eleve/moyen/faible). La description vient de l'agent IA architecte -- si l'IA est bonne, les recommandations sont pro. Manque : la duree estimee des travaux et le rationale acquereur (present en DB `rationale_buyer` mais pas affiche dans la carte). |
| 4 | Partage acquereurs | N/A | Pas applicable a cette etape. |
| 5 | Gestion d'erreur | 8.5 | Nette amelioration par rapport a l'audit session 41. L'optimistic UI avec revert on failure est implementee (lignes 289-323). Si le PATCH echoue, la decision revient a "pending" et un toast rouge s'affiche "Erreur de sauvegarde. Verifiez votre connexion et reessayez." -- message clair, pas technique. L'etat "error" global affiche un bouton "Reessayer" + "Retour a la qualification". Rate limit cote API (429) avec message francais. Bonne gestion du cas "aucun lot" (message actionnable). |
| 6 | Simplicite | 8.0 | Le parcours est lineaire : j'arrive, ca genere, je decide, je passe a la suite. Les boutons "Appliquer au dossier" / "Ignorer" sont clairs. Le badge "Appliquee" / "Ignoree" confirme visuellement ma decision. Mais le titre "Recommandations de l'architecte IA" pendant la generation change en "Analyse en cours..." -- c'est un detail mais ca fait scintiller la page. |
| 7 | Confiance | 7.5 | Les recommandations sont groupees par lot -- structurant. L'icone par type (redistribution, fusion, etc.) donne un air pro. Mais : aucune mention de QUI est l'"architecte IA", pas de logo pro, pas d'explication de la methodologie. Pour un marchand qui engage des travaux sur ces recommandations, la confiance passe par la credibilite de la source. |
| 8 | Completude | 6.5 | Manques critiques : (1) Pas de cout total des recommandations acceptees. (2) Pas de duree estimee des travaux (champ absent de l'interface et du type Recommendation). (3) Le champ `rationale_buyer` est en DB mais pas affiche -- c'est dommage car "pourquoi un acquereur apprecierait cette modification" est exactement ce que Thomas veut savoir. (4) Pas de recap "avant/apres" de la surface du lot si des pieces sont fusionnees/redistribuees. |
| 9 | Mobile-first | 8.5 | Les boutons "Appliquer au dossier" / "Ignorer" sont en flex-1 -- ils prennent toute la largeur sur mobile, touch target correct (py-2 px-3 = environ 36px de hauteur -- un peu juste par rapport au 44px Apple minimum). Le stepper mobile est vertical et compact. La barre sticky en bas (compteur) fonctionne avec backdrop-blur. Les boutons d'action en bas sont en flex-col sur mobile (sm:flex-row). Correct. |
| 10 | Rapidite | 7.5 | La generation se fait en parallele par lot (Promise.allSettled) -- bien. Mais le feedback de progression est insuffisant : un seul spinner global "L'architecte IA analyse votre projet..." sans indication de combien de lots sont traites ni combien restent. Si j'ai 3 lots et que 2 sont finis, je ne le vois pas. Les recommandations existantes sont chargees depuis la DB sans regeneration -- gain de temps au retour. Le bouton "Regenerer" permet un refresh force. |

---

## Points positifs (max 5)

1. **Optimistic UI implementee** (lignes 289-323) : les decisions accepter/refuser se mettent a jour instantanement, avec revert automatique si le PATCH echoue. Le toast d'erreur est clair. C'est le fix du P1-5 de la session 41 -- bien fait.

2. **Chargement intelligent des recommandations existantes** (lignes 128-171) : si des recommandations existent deja en DB, elles sont chargees directement sans regeneration. Quand je reviens 3 semaines plus tard, je retrouve mes decisions. La retrouvabilite est bonne.

3. **Cartes de recommandation bien designees** (RecommendationCard.tsx) : icone par type, description, cout estime, impact, badge de decision, etats visuels differencies (pending/accepted/rejected). Le composant est complet et lisible.

4. **Gestion des erreurs par lot** (lignes 504-539) : chaque lot a son propre etat d'erreur, pas un plantage global. Si 1 lot echoue sur 3, les 2 autres affichent leurs recommandations correctement.

5. **Barre sticky de compteur** (lignes 568-579) : "3 recommandations acceptees / 8 total" en sticky bottom avec backdrop-blur -- je garde le contexte meme en scrollant les cartes. Pratique.

---

## Problemes

### P0 -- Aucun

Pas de bloquant fonctionnel sur cette etape. L'optimistic UI corrige le principal risque identifie.

### P1 -- Haute priorite

#### P1-1 : Le bouton "Lancer la generation" est toujours actif meme si aucune decision n'est prise

**Fichier** : `app/projet/[id]/recommandations/page.tsx` lignes 583-591
**Impact** : Thomas peut lancer la generation de visuels (etape 6) sans avoir decide quoi que ce soit sur les recommandations. Ca n'a pas de sens : les recommandations influencent les visuels generes. Si j'ai 8 recommandations en "pending", le systeme genere des visuels sur quelles bases ?

**Code actuel** :
```tsx
<button
  onClick={handleLaunchGeneration}
  className="flex-1 py-3 px-4 rounded-lg bg-[#7D9B76] ..."
>
  Lancer la generation des visuels
</button>
```

**Correction** : ajouter un garde `disabled={decidedCount < totalRecs}` + message "Decidez toutes les recommandations avant de continuer". Ou au minimum un avertissement ("3 recommandations en attente -- continuer quand meme ?").

#### P1-2 : Pas de cout total des recommandations acceptees

**Fichier** : `app/projet/[id]/recommandations/page.tsx` lignes 568-579
**Impact** : Thomas accepte 5 recommandations a 2 500 EUR, 1 800 EUR, 3 200 EUR, 900 EUR, 4 100 EUR. Il doit additionner mentalement pour savoir que ca fait 12 500 EUR. C'est inadmissible pour un professionnel qui gere un budget travaux.

**Correction** : ajouter dans la barre sticky un total calcule :
```tsx
const totalCost = allRecs
  .filter((r) => decisions.get(r.id) === "accepted" && r.estimated_cost)
  .reduce((sum, r) => {
    const num = parseFloat(r.estimated_cost!.replace(/[^0-9]/g, ''));
    return sum + (isNaN(num) ? 0 : num);
  }, 0);
// Afficher: "Budget estimé : 12 500 €"
```

Note : le parsing du cout depuis une string formatee ("2 500 EUR") est fragile. Idealement, garder la valeur numerique brute (`estimated_cost_eur`) en plus de la string formatee.

#### P1-3 : Le champ `rationale_buyer` n'est pas affiche

**Fichier** : `components/marchand/RecommendationCard.tsx` -- champ absent du type `Recommendation`
**Fichier** : `app/api/pro/projects/[id]/recommend/route.ts` ligne 198 -- le champ EST sauvegarde en DB
**Impact** : L'agent architecte genere une justification orientee acquereur ("Cette redistribution cree un espace de vie lumineux qui seduit les familles avec enfants"), mais Thomas ne la voit jamais. C'est exactement l'information qui lui permet de vendre le bien. Le champ existe en DB, il suffit de l'afficher.

**Correction** : ajouter `rationale_buyer` au type Recommendation, l'inclure dans la reponse API, et l'afficher dans la carte sous la description : "Pour l'acquereur : {rationale_buyer}".

### P2 -- Priorite moyenne

#### P2-1 : Pas de feedback de progression par lot pendant la generation

**Fichier** : `app/projet/[id]/recommandations/page.tsx` lignes 381-409
**Impact** : Quand j'ai 3 lots et que la generation prend 15 secondes par lot, je vois un seul spinner pendant 45 secondes. Pas de "Lot 1/3 analyse... Lot 2/3 analyse...". Les lots individuels ont bien un spinner (lignes 504-529) mais ils ne sont visibles que si `pageState === "ready"`, pas pendant `pageState === "generating"`.

**Correction** : basculer `pageState` a "ready" des que les lotRecommendations sont initialisees (ligne 200-201), pour que les spinners individuels par lot s'affichent pendant que les calls paralleles tournent. L'etat "generating" global avec un seul spinner est une regression UX.

#### P2-2 : Touch target des boutons Appliquer/Ignorer trop petit sur mobile

**Fichier** : `components/marchand/RecommendationCard.tsx` lignes 196-213
**Impact** : Les boutons ont `py-2 px-3` ce qui donne environ 36px de hauteur. Le minimum Apple est 44px. Sur un iPhone 15 Pro, on peut toucher a cote par erreur.

**Correction** : `py-2` -> `py-3` (48px) ou ajouter `min-h-[44px]`.

#### P2-3 : Erreur par lot mal associee (bug logique)

**Fichier** : `app/projet/[id]/recommandations/page.tsx` lignes 257-269
**Impact** : Dans le traitement des resultats `Promise.allSettled`, le code cherche le result par `lot_id` pour les fulfilled, mais pour les rejected il prend le PREMIER rejected trouve -- sans associer a un lot specifique. Si 2 lots echouent, tous les lots non-fulfilled affichent le meme message d'erreur. Le code devrait matcher par index, pas par recherche globale.

**Code problematique** :
```tsx
const errorResult = results.find((r) => {
  if (r.status === "rejected") return true;
  return false;
});
```

**Correction** : utiliser l'index du lot pour associer le bon resultat rejected :
```tsx
const resultIndex = lots.findIndex((l: { id: string }) => l.id === lotRec.lot_id);
const result = results[resultIndex];
if (result.status === "rejected") {
  return { ...lotRec, isLoading: false, error: (result.reason as Error).message };
}
```

#### P2-4 : Le status du projet n'est pas mis a jour apres generation des recommandations

**Fichier** : `app/api/pro/projects/[id]/recommend/route.ts`
**Impact** : L'API genere et sauvegarde les recommandations mais ne met pas a jour le status du projet (ex: "qualified" -> "plan_final"). Le stepper reste donc sur l'etape 4 completee meme apres les recommandations. L'etape 5 ne s'affiche jamais comme "completee" dans le stepper puisque `getCompletedSteps("qualified")` retourne `[1, 2, 3, 4]` sans le 5.

**Correction** : ajouter un UPDATE du status projet apres insertion des recommandations :
```sql
UPDATE pro_projects SET status = 'plan_final' WHERE id = $1
```

---

## Synthese

| Categorie | Nombre | Details |
|-----------|--------|---------|
| P0 (bloquant) | 0 | -- |
| P1 (haute) | 3 | Bouton non garde, cout total absent, rationale_buyer masque |
| P2 (moyenne) | 4 | Progression par lot, touch targets, bug association erreur, status projet |

**Score : 7.8 / 10** -- En dessous du seuil de 9.5/10.

Pour atteindre 9.5, il faut :
- P1-1 : garder le bouton "Lancer la generation" tant que des decisions sont en attente (+0.5)
- P1-2 : afficher le cout total des recommandations acceptees (+0.4)
- P1-3 : afficher le rationale_buyer dans les cartes (+0.3)
- P2-1 : feedback de progression par lot pendant la generation (+0.2)
- P2-2 : touch targets 44px minimum sur les boutons (+0.1)
- P2-3 : fix bug association erreur par lot (+0.1)
- P2-4 : mise a jour du status projet apres recommandations (+0.1)

Total potentiel avec corrections : ~9.5/10.
