# Audit Personas — Claire & Léa — Galerie gating + Toggle Surfaces/Mobilier
*Date : 2026-04-02*
*Seuil de validation : 9.5/10*

---

## Changement 1 — Galerie /ma-galerie réservée Starter+Pro

### Persona Claire — Architecte d'intérieur, 40 ans, Lyon

**Verdict : ACCEPTABLE — mais le message doit mieux cibler son profil.**

| Dimension | Note /10 | Observation |
|-----------|----------|-------------|
| Compréhension immédiate | 8/10 | Le title "Votre galerie vous attend" + "L'historique de vos visuels est disponible dès votre premier pack" est clair. Claire comprend en 3 secondes que c'est derrière un achat. |
| Friction perçue | 8/10 | Claire va acheter Pro de toute façon — la galerie est critique dans son workflow (elle archive les ambiances par projet client). Le gating ne la choque pas, il l'invite à structurer son usage. |
| CTA principal | 6/10 | "Pack Starter — 14,90€" est le premier CTA. Pour Claire, c'est le mauvais CTA : elle ne veut pas 5 crédits, elle veut l'abonnement Pro 29€/mois avec les 50 crédits + Mode Pro. Le Starter est un pack one-shot, pas son achat naturel. |
| Lien "Voir les formules" | 7/10 | Présent et accessible. Mais secondaire visuellement — un architecte avec budget Pro verra ce lien trop tard après le CTA Starter qui ne lui correspond pas. |
| Logique business | 8/10 | Claire comprend le modèle freemium. Elle n'est pas frustrée, elle est alignée sur la valeur : un historique structuré de ses projets clients a une vraie valeur pro. |

**Score Claire — Changement 1 : 7.4/10**

**Problèmes identifiés :**

1. CTA principal mal ciblé. Pour Claire (usage pro récurrent), le premier bouton devrait être "Abonnement Pro — 29€/mois" et le Starter renvoyé en option secondaire "Accès immédiat — 14,90€". Dans l'état actuel, Claire clique sur "Pack Starter", se retrouve avec 5 crédits, et reviendra acheter le Pro dans 48h. Deux transactions au lieu d'une.
2. Le copy "dès votre premier pack" est générique. Claire est professionnelle : un copy comme "Conservez l'historique de vos projets clients" aurait plus de poids pour elle.
3. Pas de mention du nombre d'images historiques conservées. Pour une architecte qui gère 15 projets simultanément, savoir si la galerie garde 20 ou 200 visuels change la valeur perçue.

---

### Persona Léa — Primo-accédante, 32 ans, Nantes

**Verdict : FRICTION NOTABLE — risque de désengagement à froid.**

| Dimension | Note /10 | Observation |
|-----------|----------|-------------|
| Compréhension immédiate | 8/10 | Le message est clair. Léa comprend immédiatement que la galerie est payante. |
| Frustration freemium | 5/10 | Léa est digital native — Notion, Figma, Miro, tous ses outils ont une galerie/historique gratuit. Le gating de l'historique dès le premier euro est contre-intuitif dans son référentiel produit. Elle s'attendait à y accéder. |
| Barrière prix | 5/10 | 14,90€ pour une primo-accédante qui "voulait juste essayer" est une barrière non négligeable. Elle n'a pas encore validé la qualité du produit. Elle génère une image gratuite, elle est déçue ou satisfaite, PUIS elle décide d'acheter. Lui demander de payer avant d'avoir eu ce feedback = conversion faible. |
| Récupération de ses propres données | 4/10 | C'est le point le plus sensible. Léa a uploadé sa photo, généré un visuel, l'a téléchargé. Mais si elle revient le lendemain pour le retrouver, elle tombe sur un mur payant. Ses propres résultats sont derrière un paywall — ce n'est pas un "plus", c'est une rétention perçue comme agressive. |
| Alternative proposée | 3/10 | Il n'y a aucune mention du fait qu'elle peut télécharger son image tout de suite après génération. Si Léa ne l'a pas fait dans la session, elle n'a aucun moyen d'y accéder sans payer. Pas de message du type "Vous avez généré X visuel(s) — téléchargez-les maintenant avant de fermer la session". |

**Score Léa — Changement 1 : 5.0/10**

**Problèmes critiques :**

1. Pas de galerie limitée en gratuit. La pratique standard du freemium (Figma, Notion, Pinterest) est : accès à X éléments en gratuit, galerie complète en payant. Ici : zéro accès. Pour Léa, c'est un mur, pas une limite. Recommandation : afficher les 2-3 dernières générations en gratuit (lecture seule, sans téléchargement HD), le reste derrière Starter.
2. Aucun filet de sécurité post-génération. Si Léa a généré sans télécharger, elle perd ses visuels. Un toast ou une notification "Vos visuels seront disponibles 24h — téléchargez-les maintenant" à la fin de génération éviterait la frustration lors du retour sur /ma-galerie.
3. Le CTA "Pack Starter — 14,90€" ne lui parle pas. Elle ne sait pas ce que contient un "pack Starter". Pour Léa, "5 générations HD" aurait plus de poids que "14,90€".

---

## Changement 2 — Toggle "Surfaces uniquement / Surfaces + Mobilier"

Analyse du code InlineGenerator.tsx :
- Toggle deux boutons (pill style), withFurniture state
- Label sous le toggle : "Finitions et mobilier complet" / "Pièce finie sans meuble — idéal pour voir les surfaces"
- Valeur par défaut : withFurniture = true (Surfaces + Mobilier activé par défaut)

### Persona Claire — Architecte d'intérieur

**Verdict : FONCTIONNALITÉ HAUTE VALEUR — sous-vendue.**

| Dimension | Note /10 | Observation |
|-----------|----------|-------------|
| Utilité métier | 10/10 | "Surfaces uniquement" est exactement ce dont Claire a besoin en début de projet : valider les finitions (couleur des murs, type de sol, luminaire) avec son client avant de choisir le mobilier. C'est le workflow naturel d'une architecte. Elle avait probablement déjà ce besoin sans savoir que c'était possible. |
| Compréhension du label | 9/10 | "Surfaces uniquement" est clair pour une professionnelle. "Pièce finie sans meuble" en sous-label confirme sans ambiguïté. Claire comprend immédiatement. |
| Positionnement dans l'UI | 8/10 | Disponible dans InlineGenerator (Mode Pro, génération inline). Correct pour Claire qui utilise le mode avancé. Question : est-il aussi disponible sur la page principale — pour la séquence de workflow standard ? À vérifier. |
| Valeur différenciante | 9/10 | Aucun concurrent cité (Gepetto, Renovate Club) ne propose ce niveau de contrôle selon le project-context. C'est une fonctionnalité qui justifie le Pro. Elle devrait être mise en avant dans le messaging architecte. |
| Manque : workflow en deux temps | 7/10 | Claire voudrait idéalement : (1) générer "Surfaces uniquement" → valider avec client → (2) générer "Surfaces + Mobilier" sur la même photo avec les mêmes surfaces. Ce workflow séquentiel n'est pas explicitement supporté dans l'UI — chaque toggle relance une génération complète indépendante. |

**Score Claire — Changement 2 : 8.6/10**

**Points d'amélioration :**

1. Le sous-label "idéal pour voir les surfaces" est utile mais peut être enrichi pour Claire : "idéal pour valider les finitions avant de meubler" ancre le cas d'usage professionnel.
2. La fonctionnalité mériterait d'apparaître dans le messaging de la page /architecte (quand créée selon roadmap F7). C'est un argument de vente direct pour ce persona.
3. Si Claire génère en "Surfaces uniquement", puis repasse en "Surfaces + Mobilier" avec la même photo : est-ce que les surfaces sont cohérentes entre les deux passes ? L'UI ne le précise pas, et c'est une question clé pour son usage professionnel.

---

### Persona Léa — Primo-accédante

**Verdict : TERMINOLOGIE TROP TECHNIQUE — risque d'incompréhension ou d'ignorance du toggle.**

| Dimension | Note /10 | Observation |
|-----------|----------|-------------|
| Compréhension du terme "Surfaces" | 4/10 | Pour Léa, "surfaces" = superficie en m2. Ce n'est pas le sens ici. En décoration intérieure, "surfaces" = murs, sol, plafond. C'est un terme métier que Léa n'a pas. Elle va lire "Surfaces uniquement" et soit ne pas comprendre, soit comprendre "juste la taille de la pièce sans rien". |
| Clarification via sous-label | 7/10 | "Pièce finie sans meuble — idéal pour voir les surfaces" aide, mais arrive trop tard : Léa a déjà choisi sans lire. Et "idéal pour voir les surfaces" réutilise le terme problématique. |
| Comportement probable | — | Léa va ignorer le toggle ou rester sur "Surfaces + Mobilier" (valeur par défaut, correct). Si elle clique sur "Surfaces uniquement" par curiosité, elle va recevoir une pièce vide bien finie et se demander où sont les meubles. |
| Valeur perçue pour Léa | 3/10 | Léa veut visualiser son salon en scandinave avec des meubles. "Surfaces uniquement" ne lui apporte rien dans son cas d'usage premier. Le toggle existe pour Claire et Thomas, pas pour Léa. Le rendre aussi visible pour Léa crée du bruit sans valeur. |
| Valeur par défaut | 9/10 | Le bon choix : withFurniture = true par défaut. Léa ne voit jamais le toggle comme une contrainte. |

**Score Léa — Changement 2 : 5.8/10**

**Recommandations :**

1. Renommer pour le grand public. "Surfaces uniquement" → "Finitions seulement (sans meubles)" ou "Voir les finitions". Ça parle à tout le monde sans jargon pro. Le terme "surfaces" dans le sens revêtements n'est pas du français courant hors architecture.
2. Contextuellement, masquer ou réduire ce toggle pour les personas non-pro. Si l'authentification est en place (roadmap étape 4), détecter le profil et afficher le toggle en mode simplifié pour les particuliers — ou le cacher entièrement dans l'interface standard.
3. Ajouter une info-bulle au survol (desktop) ou un "?" tapable (mobile) qui explique : "Générer uniquement les finitions (murs, sol, plafond) sans ajouter de mobilier." Coût : minimal. Bénéfice : Léa comprend avant de choisir.

---

## Synthèse

| Changement | Claire | Léa | Verdict |
|-----------|--------|-----|---------|
| Galerie gating | 7.4/10 | 5.0/10 | Sous le seuil — corrections requises |
| Toggle Surfaces/Mobilier | 8.6/10 | 5.8/10 | Sous le seuil — label à corriger |

**Seuil projet : 9.5/10 — ni l'un ni l'autre n'atteint le seuil.**

---

## Problèmes critiques (blocants)

1. **CTA Galerie mal ciblé pour Claire** : "Pack Starter — 14,90€" en premier CTA fait rater la conversion Pro. Inverser l'ordre : Pro d'abord, Starter en option secondaire.
2. **Galerie zéro gratuit pour Léa** : Pas de filet freemium. 2-3 dernières générations en lecture seule en gratuit = standard du marché, réduit la friction à l'acquisition.
3. **Pas de filet post-génération** : Léa peut perdre ses visuels si elle ne télécharge pas dans la session. Toast "vos visuels sont disponibles X heures" à la fin de génération = correction simple, impact fort.
4. **"Surfaces" non compris par le grand public** : Le terme est jargon pro. Renommer en "Finitions seulement (sans meubles)" ne coûte rien et inclut Léa dans l'usage du toggle.

## Améliorations recommandées (non bloquantes)

- Pour Claire : enrichir le copy galerie gate avec le cas d'usage pro ("Conservez l'historique de vos projets clients").
- Pour Claire : préciser la capacité de stockage de la galerie (nombre de visuels conservés).
- Pour Claire : documenter dans le messaging que le toggle "Surfaces uniquement" permet de valider les finitions indépendamment du mobilier — argument de vente direct page /architecte.
- Pour Léa : ajouter une info-bulle sur le toggle. Micro-UX à coût quasi nul.
- Pour tous : les deux CTA de la galerie gate (Starter + "Voir les formules") mériteraient d'être inversés en présence d'un session utilisateur avec usage récurrent détecté.

## Ce qui fonctionne bien

- États du composant GalleryGate correctement gérés (loading skeleton, error avec retry, access granted, no access) — qualité technique solide.
- "Vous avez déjà acheté un pack ? Rafraîchir la page" — le cas de l'achat en cours est anticipé, bon reflexe.
- Valeur par défaut withFurniture = true — correct pour 90% des cas d'usage.
- Sous-label contextuel sous le toggle ("Finitions et mobilier complet" / "Pièce finie sans meuble") — intention bonne, formulation à affiner.
- Touch target min-h-[44px] sur le bouton Rafraîchir — accessibilité mobile respectée.
