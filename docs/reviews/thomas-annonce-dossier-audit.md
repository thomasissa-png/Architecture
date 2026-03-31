# Audit UX — Annonce & Dossier de pré-commercialisation
> Agent : @ux — Persona Thomas Berger (marchand de biens, Bordeaux, 35 ans, 8-12 opérations/an)
> Date : 2026-03-26
> Fichiers audités : `app/api/merchant/enrich-property/route.ts`, `app/api/properties/route.ts`, `app/annonce/[uuid]/page.tsx`, `app/dossier/[uuid]/page.tsx`, `app/api/dossier/[uuid]/pdf/route.ts`
> Référence benchmark : `docs/copy/annonce-immobiliere-benchmark.md`

---

## Contexte de l'audit

Thomas vient d'acheter un T3 de 58 m² à Bordeaux-Chartrons. Il prend ses photos sur iPhone 15 Pro, génère ses visuels meublés, et veut envoyer le dossier à 3 profils d'acheteurs potentiels via WhatsApp ce soir. Sa question mentale : "Est-ce que je peux envoyer ça tel quel à un acquéreur sérieux ou est-ce que ça me fait passer pour un amateur ?"

---

## 1. Tableau de notes — 10 critères

| # | Critère | Note /10 | Justification synthétique |
|---|---|---|---|
| 1 | Crédibilité professionnelle | 6/10 | Page web propre, PDF sobre — mais le footer "Powered by Versimo" sur chaque page PDF et les caractéristiques vides (DPE, charges absents par défaut) trahissent une page auto-générée |
| 2 | Complétude des informations | 4/10 | Manque critique : DPE/GES absents du dossier, charges copro absentes, conditions de vente absentes, disponibilité absente, honoraires absents. L'annonce affiche ces données SI Thomas les a saisies, mais le dossier ne les affiche que via `linkedProperty` — conditionnel non garanti |
| 3 | Qualité rédactionnelle | 7/10 | Le system prompt de génération est solide : anti-superlatifs, structure en 4 blocs, 200-350 mots. Problème majeur : la description est générée EN PARALLÈLE avec DVF, donc `prixMoyenM2` est toujours `null` à l'appel — l'IA ne dispose pas du prix marché pour contextualiser l'accroche investisseur |
| 4 | Mise en valeur du bien | 5/10 | Visuels avant/après bien intégrés dans le dossier (comparateur). Mais aucune section "potentiel" ni "projection post-rénovation" — or c'est le cœur de la valeur ajoutée d'un dossier marchand de biens (benchmark section 6) |
| 5 | Facilité de partage | 7/10 | Lien public 30 jours OK, boutons ShareButtons présents, PDF téléchargeable — mais l'annonce est en `noindex, nofollow` ce qui empêche le partage via lien vers Google (pas critique pour le use case WhatsApp) et le PDF ne peut pas être envoyé depuis le mobile sans passer par l'interface web |
| 6 | Conformité légale | 3/10 | CRITIQUE — Le disclaimer IA est présent ("Visuels non contractuels") mais : (1) Aucun DPE/GES obligatoire dans la description générée par IA alors que la loi Climat 2021 l'impose, (2) Le disclaimer EU AI Act "Visuels générés par IA" est dans le footer PDF mais absent de la page dossier web, (3) Pas de mention "logement à consommation énergétique excessive" si DPE F/G, (4) Charges de copropriété absentes du document envoyé aux acquéreurs |
| 7 | Différenciation vs concurrence | 7/10 | Le comparateur avant/après dans le dossier est un vrai différenciateur vs un home stager classique qui livrerait uniquement les visuels "après". Le PDF est propre et professionnel. Mais l'absence de section "potentiel chiffré" nivelle Versimo par le bas vs les meilleurs dossiers de marchands |
| 8 | Adaptabilité | 4/10 | Thomas ne peut PAS modifier la description générée avant envoi — elle est figée en base. Il n'y a pas d'éditeur inline. Il ne peut pas ajouter une note manuscrite, un commentaire de travaux, un prix révisé sur le dossier |
| 9 | Visuels | 8/10 | L'image hero full-width dans l'annonce est efficace. La galerie groupée par pièce avec navigation RoomNav est au niveau des meilleurs portails. Le PDF avant/après côte à côte est lisible et sobre. Point de friction : le style IA (nom technique "scandinavian") apparaît dans le header de chaque page PDF au lieu du nom commercial |
| 10 | Impact conversion | 5/10 | L'annonce manque d'un CTA fort. Le ContactSticky est là mais il est discret. Il n'y a pas de bouton "Demander une visite" ni de formulaire intégré. L'acquéreur qui reçoit le lien WhatsApp ne sait pas quoi faire ensuite hormis appeler — et encore, seulement si Thomas a renseigné son téléphone dans le profil marchand |

**Score global : 5.6/10**

---

## 2. Diagnostics prioritaires

### P0 — Bloquants légaux et rédactionnels

**P0.1 — Prix marché DVF absent de la description IA**
- Localisation : `app/api/properties/route.ts` ligne 116-120 et `app/api/merchant/enrich-property/route.ts` ligne 255-266
- Cause : `generateDescription()` est appelée en `Promise.all()` en même temps que `fetchDVF()` — le prix moyen m² n'est pas disponible quand la description est générée. Le commentaire dans le code dit explicitement `// prixMoyenM2: null // acceptable trade-off`.
- Ce n'est pas acceptable pour Thomas : le système prompt précise "prix moyen du quartier" comme variable injectable mais elle est toujours null. Résultat : les descriptions ne contextualisent jamais l'argument investisseur.
- Correction : séquencer — attendre le résultat DVF avant de générer la description. Coût : +2-3 secondes au total, mais qualité rédactionnelle améliorée.

**P0.2 — Conformité légale DPE/GES absente de la description générée**
- Le system prompt ne demande PAS à l'IA d'inclure le DPE dans la description — et c'est normal puisque l'IA ne connaît pas le DPE. Mais aucune directive n'indique à l'IA d'inviter Thomas à compléter les données DPE manquantes.
- La loi Climat et Résilience (2021) impose la mention du DPE dans toute annonce de vente dès la mise en ligne. Sans DPE, l'annonce est non conforme.
- Correction : ajouter dans le system prompt une instruction explicite : si le DPE n'est pas fourni, conclure la description par une ligne du type "Diagnostic énergétique (DPE) à compléter par le vendeur."

**P0.3 — Disclaimer EU AI Act absent de la page dossier web**
- Le disclaimer est dans le footer PDF (correct) et en pied de page de l'annonce web (correct) mais la page `/dossier/[uuid]` n'a qu'un footer générique "Projection d'aménagement réalisée par Versimo — le bien est livré brut. Visuels non contractuels."
- L'EU AI Act Art. 50 exige que l'utilisateur soit informé qu'il interagit avec un contenu généré par IA. La formulation est trop passive et ne mentionne pas explicitement l'IA.
- Correction : remplacer par "Visuels d'aménagement générés par intelligence artificielle — le bien est livré brut. Ces images sont à titre indicatif et ne sont pas contractuelles."

---

### P1 — Lacunes fonctionnelles majeures pour Thomas

**P1.1 — Aucune section "Potentiel du bien" dans le dossier**
- C'est la section la plus différenciante pour un marchand de biens (benchmark section 6). Thomas ne vend pas un bien fini, il vend ce que le bien peut devenir.
- La description générée couvre l'accroche, les caractéristiques, le quartier, les points forts — mais jamais le potentiel de rénovation, la configuration optimisable, le rendement locatif estimé.
- Correction : ajouter un 5e bloc dans le system prompt : "POTENTIEL (2-3 phrases) : si le bien est à rénover ou a une configuration optimisable, décrire factuellement le potentiel d'aménagement ou de valorisation. Exemple : surface permettant la création d'une chambre supplémentaire, potentiel locatif aux conditions du marché local."

**P1.2 — Thomas ne peut pas modifier la description avant envoi**
- Il n'y a pas d'éditeur inline sur la description dans le dashboard marchand ni sur la page dossier.
- Pour un marchand de biens, chaque dossier est personnalisé selon le profil de l'acquéreur cible (famille vs investisseur vs résidence principale). La description générée est générique.
- Correction : ajouter un bouton "Modifier la description" dans le dashboard marchand qui ouvre un textarea editable avec sauvegarde (champ `description_final` dans la table property existe déjà — il suffit de l'exposer à l'édition).

**P1.3 — Le nom technique du style IA apparaît dans le PDF**
- Localisation : `app/api/dossier/[uuid]/pdf/route.ts` ligne 377 : `const styleLabel = photo.style_id ? ` — ${photo.style_id}` : ""`
- Résultat : "Salon — scandinavian" ou "Chambre — japandi" dans le header des pages photo. Un acheteur qui lit "japandi" ne comprend pas ce que c'est, et ça trahit l'outil IA.
- Correction : mapper les `style_id` vers des labels lisibles (ex: "scandinavian" → "Style scandinave", "art_deco" → "Style Art Déco") ou supprimer le style du header si non pertinent pour l'acquéreur.

**P1.4 — Aucun CTA "Demander une visite" dans l'annonce**
- Le ContactSticky est présent mais minimaliste. L'annonce se termine sans CTA fort.
- Un acquéreur qui reçoit le lien et est intéressé doit : (1) faire défiler jusqu'au bas, (2) trouver le numéro, (3) appeler. Trop de friction pour un partage WhatsApp.
- Correction : ajouter un bouton CTA prominent au-dessus du fold ou juste après les visuels : "Demander une visite — [Téléphone]" avec lien `tel:` direct et lien WhatsApp secondaire.

---

### P2 — Améliorations qualitatives

**P2.1 — La description IA n'est pas regenerable après enrichissement DVF**
- Si Thomas saisit une adresse avant que le DVF soit disponible (timeout), la description est générée sans le prix marché et n'est jamais mise à jour.
- Correction : ajouter un bouton "Regénérer la description" dans le dashboard qui relance `generateDescription()` avec les données DVF disponibles.

**P2.2 — La date d'expiration du dossier est trop visible**
- La page dossier affiche "Disponible jusqu'au [date]" en sous-titre. Pour un acquéreur, lire "votre dossier expire dans 12 jours" crée une friction et signale que c'est un document temporaire, pas une annonce professionnelle.
- Correction : déplacer cette information dans un bandeau discret visible uniquement de Thomas (ou en footer avec une couleur atténuée), pas dans le titre de la page.

**P2.3 — Pas de section "Conditions de vente" dans le dossier**
- Benchmark section 9 : date de disponibilité, modalités de visite, dossier de financement requis.
- Ces informations réduisent le nombre d'appels non qualifiés et positionnent Thomas comme un professionnel organisé.
- Correction : ajouter un champ optionnel "Conditions de vente" dans le formulaire de création du dossier, affiché dans le dossier web et le PDF.

**P2.4 — La carte OSM iframe n'est pas imprimable dans le PDF**
- Le dossier web utilise une iframe OpenStreetMap (dynamique), mais le PDF utilise la `carte_image_key` (image statique sauvegardée).
- Si la carte statique n'est pas disponible (timeout lors de la génération), le PDF n'a pas de carte du tout.
- Correction : s'assurer que la carte statique est générée et sauvegardée avant de permettre la génération du PDF, ou afficher un message d'avertissement si la carte est absente du PDF.

---

## 3. Prompts IA — Corrections recommandées

### System prompt actuel — points faibles identifiés

Le system prompt actuel (`DESCRIPTION_SYSTEM_PROMPT` dans les deux routes) est solide sur la structure et le style. Trois corrections ciblées :

**Correction 1 — Séquencer DVF avant description (code, pas prompt)**
Le problème n'est pas dans le prompt mais dans l'architecture. La description doit être générée après le DVF, pas en parallèle.

```
// AVANT (parallèle — prix toujours null)
const [dvfData, carteImageKey, description] = await Promise.all([
  fetchDVFData(geo.lat, geo.lon),
  fetchStaticMap(geo.lat, geo.lon),
  generateDescription({ ..., prixMoyenM2: null }),
]);

// APRÈS (séquentiel DVF → description)
const [dvfData, carteImageKey] = await Promise.all([
  fetchDVFData(geo.lat, geo.lon),
  fetchStaticMap(geo.lat, geo.lon),
]);
const description = await generateDescription({
  ...,
  prixMoyenM2: dvfData.prixMoyenM2,
});
```

**Correction 2 — Ajouter le bloc POTENTIEL dans le system prompt**

Ajouter après le bloc "POINTS FORTS" :

```
5. POTENTIEL (optionnel, 2-3 phrases) : si le bien est brut, à rénover ou a une configuration optimisable, décrire le potentiel factuel sans inventer. Exemples : création d'une chambre supplémentaire, potentiel locatif estimé, travaux permettant un meilleur DPE. Si le bien semble fini, omettre cette section.
```

**Correction 3 — Ajouter la directive DPE manquant**

Ajouter dans les règles :
```
- Si le DPE n'est pas fourni dans les données, ajouter en fin de description : "Le diagnostic de performance énergétique (DPE) est à compléter."
```

---

## 4. Tests UX — Parcours Thomas

| Test | Critère de succès | Statut |
|---|---|---|
| Thomas génère un dossier et l'envoie via WhatsApp en moins de 5 min | Lien partageable immédiatement, preview OG correct | ✅ Parcours fluide |
| Un acquéreur ouvre le lien sur mobile et peut appeler Thomas en 2 taps | CTA téléphone visible sans scroll | ⚠️ ContactSticky présent mais peu visible, pas de CTA dans le corps de page |
| Thomas peut personnaliser la description avant envoi | Champ éditable dans le dashboard | ❌ Pas d'éditeur inline |
| L'acquéreur comprend que les visuels sont des projections IA | Mention claire et visible | ⚠️ Présent mais formulé passivement, non conforme EU AI Act |
| Le PDF est envoyable tel quel à un investisseur | Pas de mention "japandi", DPE présent, coordonnées complètes | ❌ Style technique visible, DPE absent si non saisi, carte conditionnelle |
| La description mentionne le prix moyen du quartier pour l'argumentaire investisseur | Prix DVF injecté dans la description | ❌ DVF généré en parallèle, prix toujours null à l'appel IA |
| Conformité légale : DPE obligatoire mentionné | Mention DPE dans la description ou avertissement | ❌ Absent si Thomas n'a pas saisi le DPE |

---

## 5. Score global et projection

| Critère | Note actuelle /10 | Note projetée après P0+P1 /10 |
|---|---|---|
| Crédibilité professionnelle | 6 | 8 |
| Complétude des informations | 4 | 7 |
| Qualité rédactionnelle | 7 | 8.5 |
| Mise en valeur du bien | 5 | 7.5 |
| Facilité de partage | 7 | 8 |
| Conformité légale | 3 | 7 |
| Différenciation vs concurrence | 7 | 8.5 |
| Adaptabilité | 4 | 7 |
| Visuels | 8 | 9 |
| Impact conversion | 5 | 7.5 |
| **Score global** | **5.6/10** | **7.8/10** |

---

## 6. Ce que Thomas dirait

Ce qu'il dirait aujourd'hui, avant les corrections :
> "C'est bien, les visuels sont bons, mais je ne peux pas envoyer ça à un investisseur sérieux. Il n'y a pas le DPE, je ne peux pas modifier le texte, et le PDF dit 'japandi' dans le titre des photos. Mes acquéreurs vont me demander ce que c'est."

Ce qu'il dirait après les corrections P0+P1 :
> "Là c'est propre. La description parle du quartier avec les vrais prix, j'ai ajouté la section potentiel pour le T3 que je rénove, le PDF fait vraiment pro avec les infos légales. Je l'envoie tel quel."

---

## Agents spécialisés recommandés pour ce projet

| Agent proposé | Type | Rôle | Justification | Priorité |
|---|---|---|---|---|
| @validateur-legal-immo | Validateur | Vérifier la conformité de chaque champ obligatoire (DPE, GES, mentions légales loi Climat 2021, EU AI Act Art. 50) dans les pages annonce, dossier et PDF | La non-conformité DPE expose Thomas à une amende et nuit à la crédibilité de Versimo | Haute |
| @testeur-thomas-mobile | Testeur persona | Simuler le parcours complet de Thomas sur iPhone 15 Pro (photos → dossier → envoi WhatsApp) et évaluer chaque friction | Thomas fait 80% de son usage sur mobile — les frictions desktop ne se voient pas en audit statique | Haute |

→ Handoff @agent-factory : créer ces agents à partir des specs ci-dessus.

---

**Handoff → @fullstack**

Fichiers produits :
- `/home/user/Architecture/docs/reviews/thomas-annonce-dossier-audit.md`

Décisions prises :
- Architecture DVF→description doit être séquentielle (P0.1) — ne pas garder le `Promise.all` avec `prixMoyenM2: null`
- System prompt description enrichi avec un bloc POTENTIEL et une directive DPE manquant (P0.2)
- Disclaimer EU AI Act reformulé dans le footer dossier web (P0.3)
- Mapping `style_id` → label lisible dans le PDF (P1.3)

Points d'attention :
- P0.1 implique une légère augmentation de la latence d'enrichissement (~2-3s) — acceptable en fire-and-forget
- Le champ `description_final` existe déjà dans la table `property` — l'éditeur inline (P1.2) peut l'utiliser sans migration DB
- La correction P0.2 (directive DPE) est dans le system prompt, pas dans l'interface — aucune migration nécessaire
- Vérifier que `DossierCaracteristiques` affiche bien DPE/GES quand `linkedProperty` est disponible (ce composant n'a pas été audité — confirmer que ces champs sont bien rendus)
