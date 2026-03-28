# Audit Juridique — Versiroom
> Produit par @legal — 2026-03-25
> Périmètre : France, commercialisation B2C + B2B, modèle packages one-shot, IA générative images

---

## Résumé exécutif — Risques en 5 points

| # | Risque | Niveau | Délai d'action |
|---|--------|--------|----------------|
| R1 | Absence de CGV légales avant toute vente (obligation Code de la consommation) | **CRITIQUE** | Avant ouverture paiement Stripe |
| R2 | Transfert de données vers OpenAI (serveurs US) sans mention dans la politique de confidentialité | **CRITIQUE** | Avant mise en production avec comptes utilisateurs |
| R3 | Images générées utilisées sur portails immobiliers sans disclaimer "IA" — risque loi anti-fraude immo + futur DSA | **HAUTE** | Avant lancement F4 Mode Marchand |
| R4 | Droit de rétractation sur crédits numériques : exceptions à documenter explicitement dans les CGV pour être opposables | **HAUTE** | Avant ouverture paiement |
| R5 | Absence de bannière cookies conforme CNIL si analytics tiers ajoutés (PostHog/Plausible) | **MOYENNE** | Avant intégration analytics |

---

## Section 1 — Conformité tarifaire e-commerce France

### 1.1 Affichage TVA — Obligations légales

**Texte applicable :** Art. L112-1 Code de la consommation, Art. 238 annexe II CGI.

**Règle :**
- **B2C (Léa, Thomas particulier)** : prix **TTC obligatoire** en grand, TVA 20% applicable sur services numériques. Le prix HT peut figurer en mention secondaire mais le TTC doit dominer visuellement.
- **B2B (Claire, Thomas en société)** : afficher **HT + TVA séparément** est la norme. Pour un site mixte B2C/B2B, afficher le TTC avec mention "HT pour les professionnels récupérant la TVA".

**Application au pricing Versiroom :**
- Découverte : GRATUIT (3 crédits, sans CB)
- Starter : 9,90€ TTC one-shot → HT : 8,25€ (15 crédits)
- Pro : 29€/mois TTC abonnement → HT : 24,17€ (50 crédits/mois)
- Recharge Starter : 5,90€ TTC → HT : 4,92€ (+10 crédits)
- Recharge Pro : 9€ TTC → HT : 7,50€ (+20 crédits)
- F5 Dossier Décorateur 9€ TTC → HT : 7,50€

> La pricing-strategy.md mentionne "Prix HT" dans son tableau — **à corriger** : afficher le TTC sur la page publique et préciser que la TVA est récupérable pour les pros.

### 1.2 Mentions obligatoires sur la page pricing

**Texte applicable :** Art. L221-5 à L221-8 Code de la consommation (contrats à distance), Règlement UE 2019/2161 (Omnibus).

Mentions obligatoires avant achat :
- [ ] Prix TTC toutes taxes comprises, TVA 20% incluse
- [ ] Identification du vendeur (raison sociale, SIRET, adresse)
- [ ] Caractéristiques essentielles du service (ce qui est inclus par pack)
- [ ] Durée de validité des crédits (les crédits expirent-ils ?) — **à définir**
- [ ] Conditions de remboursement (crédits non utilisés)
- [ ] Modalité d'accès au service (compte requis, téléchargement HD, etc.)

### 1.3 Droit de rétractation — Crédits numériques

**Texte applicable :** Art. L221-18 et L221-28 Code de la consommation.

**Principe :** Le consommateur dispose de 14 jours de rétractation pour tout achat à distance.

**Exception applicable à Versiroom :** Art. L221-28, 13° — "contrats de fourniture de contenus numériques non fournis sur support matériel dont l'exécution a commencé avec l'accord préalable exprès du consommateur et renoncement exprès à son droit de rétractation."

**Ce que cela signifie concrètement :**
- Si l'utilisateur achète un pack et génère immédiatement une image → le droit de rétractation s'éteint dès la première génération
- **Condition impérative :** obtenir le **consentement exprès** avant le premier usage ("Je comprends que l'exécution commence immédiatement et renonce à mon droit de rétractation") — case à cocher obligatoire au moment du paiement
- Sans cette case à cocher, les 14 jours s'appliquent et l'utilisateur peut demander remboursement même après usage

**Cas des crédits non utilisés :** [A VERIFIER AVEC JURISTE] — les crédits achetés mais non consommés sont plus ambigus. Une politique de remboursement au prorata est recommandée pour éviter les litiges chargeback.

### 1.4 CGV — Éléments obligatoires pour vente de crédits numériques

**Texte applicable :** Art. L111-1, L221-5, L221-11 Code de la consommation.

Clauses obligatoires pour Versiroom :
1. Identification du vendeur (SIRET, adresse, email de contact)
2. Description du service et des packs (crédits, usages inclus, gating F4/F5)
3. Prix TTC + TVA + modalités de paiement (Stripe, CB)
4. Durée de validité des crédits (à définir — recommandation : 12 mois)
5. Clause rétractation avec exception contenu numérique + formulaire type (annexe Art. L221-5)
6. Politique de remboursement crédits non utilisés
7. Limitation de responsabilité sur la qualité des rendus générés par IA
8. Clause de propriété intellectuelle sur les images générées (voir Section 3)
9. Droit applicable : droit français, tribunal compétent : France
10. Médiateur de la consommation (obligation pour tout professionnel vendant en B2C)

---

## Section 2 — RGPD

### 2.1 Données collectées et base légale

| Donnée | Base légale (Art. 6 RGPD) | Durée de conservation recommandée |
|--------|--------------------------|-----------------------------------|
| Photos de pièces uploadées | Exécution du contrat (6b) | 30 jours après génération, puis suppression |
| Images générées (pass1 + output) | Exécution du contrat (6b) + intérêt légitime amélioration service (6f) | 90 jours, puis anonymisation ou suppression |
| Adresse IP (rate limiting, logs) | Intérêt légitime sécurité (6f) | 30 jours |
| Historique des générations (styleId, durée, succès) | Intérêt légitime amélioration service (6f) | 12 mois |
| Email (à implémenter avec auth) | Exécution du contrat (6b) | Durée du compte + 3 ans post-résiliation |
| Données de paiement Stripe | Exécution du contrat (6b) — **Stripe est responsable de traitement** | Gérée par Stripe (réglementation PCI DSS) |

**Point d'attention :** Les photos de pièces vides ne contiennent a priori pas de données personnelles (pas de personnes visibles). Si des photos avec personnes peuvent être uploadées, ajouter une clause interdisant les photos contenant des visages sans consentement des personnes.

### 2.2 Transferts hors UE — OpenAI (serveurs US)

**Texte applicable :** Chapitre V RGPD, Art. 44-49. Décision d'adéquation UE-US : Data Privacy Framework (DPF) adopté le 10 juillet 2023.

**Situation :**
- OpenAI est certifié Data Privacy Framework depuis 2023 — le transfert est légalement fondé
- **Obligation :** mentionner explicitement dans la politique de confidentialité : "Vos photos sont transmises à OpenAI Inc. (États-Unis), certifié Data Privacy Framework, pour la génération des visuels. OpenAI ne conserve pas les images au-delà du traitement selon leur politique de confidentialité."
- **Replicate (Flux Depth Pro)** : vérifier la certification DPF ou prévoir une clause contractuelle type (SCCs)

[A VERIFIER AVEC JURISTE] : Les conditions d'utilisation d'OpenAI API stipulent que les données API ne sont pas utilisées pour l'entraînement des modèles (opt-out automatique). À confirmer et documenter dans le registre des traitements.

### 2.3 Politique de rétention des images

**Recommandations :**
- **Images input (pièces brutes)** : suppression à 30 jours. Aucune valeur commerciale, risque RGPD maximal si conservées
- **Images pass1 et output** : suppression à 90 jours (permet l'audit qualité des agents Yann/Lucas sans rétention excessive)
- **Logs DB sans images** : 12 mois (métriques anonymisées)
- Implémenter un **job de nettoyage automatique** sur Replit Object Storage (cron mensuel)
- Informer l'utilisateur dans la politique de confidentialité : "Vos photos sont supprimées automatiquement 30 jours après la génération."

### 2.4 Cookie policy et analytics

**Situation actuelle :** Logging PostgreSQL interne uniquement — pas de cookie tiers. **Pas de bannière cookies requise à ce stade.**

**Si PostHog ou Plausible est intégré :**
- **Plausible** : analytics sans cookie, sans données personnelles — pas de bannière requise (compatible CNIL recommandation 2023)
- **PostHog** : selon la configuration, peut nécessiter un consentement. Mode "cookieless" disponible — préférer cette configuration pour éviter la bannière
- En cas de cookie analytics : bannière conforme CNIL obligatoire (consentement positif, refus aussi simple qu'accepter, pas de "continuer à naviguer = accepter")

**Recommandation :** Choisir Plausible (analytics sans cookie) pour rester hors du périmètre de la directive ePrivacy et éviter la complexité de la bannière cookies.

### 2.5 Droits des personnes

Mentions obligatoires dans la politique de confidentialité :
- Droit d'accès, rectification, effacement (Art. 15-17 RGPD)
- Droit à la portabilité (Art. 20 RGPD)
- Droit d'opposition au traitement sur base intérêt légitime (Art. 21 RGPD)
- Contact DPO ou responsable données : email dédié à créer (ex. privacy@versiroom.fr)
- Droit de réclamation auprès de la CNIL (www.cnil.fr)

---

## Section 3 — IA générative

### 3.1 Obligation de mention "image générée par IA"

**EU AI Act (Règlement UE 2024/1689, applicable depuis août 2024, obligations progressives 2025-2026) :**
- Art. 50 EU AI Act : obligation de transparence pour les systèmes IA qui génèrent des contenus synthétiques (deepfakes, images, vidéos)
- **Seuil applicable :** obligation de marquage des images générées par IA synthétique "de manière à indiquer clairement qu'il s'agit d'un contenu généré artificiellement"
- **Application Versiroom :** les visuels meublés sont des images modifiées par IA — le marquage est recommandé, son caractère obligatoire dépend de l'usage final

**DSA (Digital Services Act, Règlement UE 2022/2065) :** applicable aux plateformes de taille intermédiaire et grande. Versiroom en phase MVP est hors périmètre DSA mais le watermark "IA" est une bonne pratique préventive.

**Recommandation pratique :**
- Ajouter un watermark discret "Visuel généré par IA — Versiroom" dans les métadonnées EXIF des images téléchargées (invisible visuellement, lisible par les portails)
- Mentionner dans les CGU : "Les visuels générés sont des représentations artistiques produites par intelligence artificielle. Ils ne constituent pas une représentation exacte des travaux réalisés."

### 3.2 F4 Mode Marchand — Usage sur portails immobiliers

**Réglementation spécifique :**
- **Loi Hoguet (loi n°70-9 du 2 janvier 1970)** et son décret d'application : obligation d'exactitude des représentations dans les annonces immobilières
- **Art. L132-1 Code de la consommation** : pratiques commerciales trompeuses
- **Directive 2005/29/CE** (pratiques commerciales déloyales) : une image meublée présentée comme réelle sans mention "simulation" peut constituer une pratique trompeuse

**Obligations pour F4 :**
- Mention obligatoire sur chaque visuel : "Simulation — home staging virtuel" ou "Photo virtuelle — décoration non contractuelle"
- Cette mention doit figurer sur le visuel lui-même (watermark ou bandeau), pas seulement dans les CGV
- Les portails immobiliers (SeLoger, LeBonCoin Immo, etc.) ont leurs propres chartes sur les visuels IA — [A VERIFIER AVEC JURISTE] selon portail cible
- Recommandation : le PDF F4 doit inclure en en-tête ou pied de page la mention légale de simulation

### 3.3 Droit d'auteur sur les images générées

**Texte applicable :** Art. L111-1 Code de la propriété intellectuelle, jurisprudence CJUE.

**Situation :**
- En droit français, une oeuvre protégée par le droit d'auteur nécessite une création originale par une personne physique
- Les images générées par IA ne sont pas protégeables par le droit d'auteur au sens du CPI (pas d'auteur personne physique identifiable pour la partie générée)
- L'image input (photo de la pièce vide) appartient à l'utilisateur qui l'a prise — il conserve ses droits sur l'original

**Conséquences pour les CGU :**
- Versiroom ne revendique aucun droit d'auteur sur les images générées
- L'utilisateur reçoit une **licence d'utilisation** large (y compris usage commercial) sur les images générées
- Versiroom se réserve le droit d'utiliser des exemples anonymisés pour la communication marketing (avec opt-out possible)
- [A VERIFIER AVEC JURISTE] : les conditions d'utilisation d'OpenAI API attribuent les outputs à l'utilisateur de l'API — vérifier la chaîne de titularité OpenAI → Versiroom → utilisateur final

---

## Section 4 — Checklist actions

| Obligation | Statut | Priorité | Action requise |
|-----------|--------|----------|----------------|
| Rédiger les CGV complètes | A faire | **P0** | @copywriter produit le draft, validation avocat avant mise en ligne |
| Page CGV accessible avant achat (lien dans footer et au checkout) | A faire | **P0** | @fullstack intègre le lien CGV dans le footer et le tunnel Stripe |
| Case à cocher rétractation contenu numérique au checkout | A faire | **P0** | @fullstack ajoute la case avant confirmation paiement |
| Affichage prix TTC sur la page pricing | A faire | **P0** | @fullstack met à jour l'affichage pricing (TTC en grand, HT pro en mention) |
| Mentions légales (identité vendeur, SIRET, hébergeur) | A faire | **P0** | @copywriter rédige, @fullstack intègre dans le footer |
| Politique de confidentialité RGPD | A faire | **P0** | @copywriter rédige, accessible depuis le footer avant lancement auth |
| Mention OpenAI DPF dans politique de confidentialité | A faire | **P0** | Inclure dans la politique de confidentialité |
| Vérification certification DPF de Replicate | A faire | **P1** | Consulter https://www.dataprivacyframework.gov — si absent, signer SCCs |
| Watermark "Visuel généré par IA" sur images téléchargées | A faire | **P1** | @fullstack ajoute watermark ou métadonnées EXIF au téléchargement |
| Mention "Simulation" obligatoire sur visuels F4 Marchand | A faire | **P1** | À intégrer dans le PDF généré F4 avant lancement feature |
| Clause propriété intellectuelle images dans CGU | A faire | **P1** | Licence utilisateur large + opt-out usage marketing Versiroom |
| Job de nettoyage automatique images Object Storage (30j/90j) | A faire | **P1** | @infrastructure ou @fullstack implémente le cron |
| Durée de validité des crédits définie et affichée | A faire | **P1** | Décision fondateur requise (recommandation : 12 mois) |
| Email de contact RGPD (privacy@...) | A faire | **P1** | Créer l'adresse avant lancement auth |
| Médiation consommateur — désigner un médiateur | A faire | **P2** | Obligation légale B2C — liste médiateurs agréés sur economie.gouv.fr |
| Registre des traitements RGPD (Art. 30 RGPD) | A faire | **P2** | Document interne — non public, obligatoire si >250 salariés OU traitements réguliers |
| Bannière cookies si analytics tiers intégrés | Conditionnel | **P2** | Déclenché uniquement si choix d'un outil avec cookies (non requis avec Plausible) |
| Vérification chartes portails immo (SeLoger, LBC) sur visuels IA | A faire | **P2** | Avant commercialisation F4 auprès de Thomas et agences |

---

## Hypothèses à valider

- [HYPOTHÈSE] Durée de validité des crédits : 12 mois recommandés — décision fondateur requise
- [HYPOTHÈSE] Replicate certifié DPF : à vérifier sur dataprivacyframework.gov avant mise en production
- [HYPOTHÈSE] Chaîne de titularité OpenAI → Versiroom → utilisateur : à confirmer avec les CGU OpenAI API en vigueur
- [A VERIFIER AVEC JURISTE] : remboursement crédits non consommés (prorata ou non-remboursable)
- [A VERIFIER AVEC JURISTE] : chartes spécifiques des portails immobiliers sur les visuels générés par IA (SeLoger, Bien'ici, LeBonCoin Immo)

---

**Handoff → @fullstack**
- Fichiers produits : `/home/user/Architecture/docs/legal/legal-audit.md`
- Décisions prises : TVA 20% B2C TTC obligatoire — exception rétractation contenu numérique conditionne une case à cocher au checkout — watermark IA sur téléchargements — mention "Simulation" sur PDF F4
- Points d'attention :
  - **P0 — checkout Stripe** : ajouter case à cocher "Je comprends que l'exécution commence immédiatement et renonce à mon droit de rétractation" avant confirmation paiement
  - **P0 — pricing page** : afficher les prix TTC (Starter 9,90€ TTC, Pro 29€/mois TTC, mention HT pour pros)
  - **P0 — footer** : lien CGV + Mentions légales + Politique de confidentialité avant toute ouverture paiement
  - **P1 — téléchargement images** : watermark discret ou métadonnées EXIF "Généré par IA — Versiroom"
  - **P1 — cron nettoyage** : supprimer images input après 30j, pass1+output après 90j dans Replit Object Storage
  - **P1 — PDF F4** : mention légale "Simulation — home staging virtuel, décoration non contractuelle" en pied de page

**Handoff → @copywriter**
- Fichiers produits : `/home/user/Architecture/docs/legal/legal-audit.md`
- Documents à rédiger (tous à placer dans `docs/legal/`) :
  - `cgu-draft.md` : CGU + CGV combinées (modèle packages one-shot, exception rétractation, propriété intellectuelle images, limitation responsabilité rendus IA)
  - `privacy-policy.md` : politique de confidentialité RGPD (données collectées, bases légales, transfert OpenAI DPF, rétention 30j/90j, droits utilisateurs, contact privacy@)
  - `mentions-legales.md` : identité vendeur, SIRET, hébergeur Replit, directeur de publication
- Ton : clair et accessible (utilisateurs non juristes — Léa 32 ans digital native, Thomas marchand de biens), sans jargon, mais juridiquement complet
- Contrainte : valider les documents contractuels critiques (CGV) avec un avocat avant mise en ligne
