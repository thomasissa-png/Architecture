# Audit de conformité site — Versiroom
> Produit par @legal — 2026-03-25
> Périmètre : page.tsx (frontend visible) + layout.tsx — état actuel du site en production

---

## Résumé exécutif — Risques en 5 points

| # | Risque | Niveau | Délai d'action |
|---|--------|--------|----------------|
| R1 | Aucune mention légale accessible (SIRET, éditeur, hébergeur) — obligation légale LCEN Art. 6 III | **CRITIQUE** | Immédiat — site déjà en ligne |
| R2 | Aucune CGU/CGV — le pricing affiche "Bientôt disponible" mais aucun lien contractuel n'existe | **CRITIQUE** | Avant ouverture paiement |
| R3 | Aucune politique de confidentialité — le site collecte des photos et logs IP sans information RGPD | **CRITIQUE** | Immédiat — collecte en cours |
| R4 | Prix affichés sans mention TTC/HT ni TVA — obligation Code de la consommation Art. L112-1 | **HAUTE** | Avant ouverture paiement |
| R5 | Aucun disclaimer "image générée par IA" visible sur les rendus — EU AI Act Art. 50 | **HAUTE** | Dans les 30 jours |

---

## Checklist de conformité site

| Élément obligatoire | Présent ? | Priorité | Constat dans le code |
|---------------------|-----------|----------|----------------------|
| **Mentions légales** (LCEN Art. 6 III) | NON | **P0** | Footer : uniquement "© Versiroom 2026" + lien mailto — pas de page dédiée |
| Nom/raison sociale de l'éditeur | NON | **P0** | Absent du footer et du site |
| SIRET ou numéro d'immatriculation | NON | **P0** | Absent |
| Adresse du siège social | NON | **P0** | Absent |
| Nom de l'hébergeur (Replit) + adresse | NON | **P0** | Absent |
| Directeur de la publication | NON | **P0** | Absent |
| **CGU / CGV** accessibles avant achat | NON | **P0** | Aucun lien dans footer ni sur la page pricing |
| Lien CGV dans le footer | NON | **P0** | Footer contient : "Tarifs", "Contact", "© 2026" — pas de lien légal |
| **Politique de confidentialité** | NON | **P0** | Absente du footer et du site |
| Lien politique confidentialité dans footer | NON | **P0** | Absent |
| **Affichage prix TTC** (Art. L112-1 Conso) | NON | **P0** | "29€/mois" affiché sans mention TTC, sans taux TVA, sans mention HT pour pros |
| **Bandeau cookies / consentement CNIL** | N/A | — | Pas d'analytics tiers détecté — non requis à ce stade (conforme legal-audit.md §2.4) |
| **Mention "image générée par IA"** sur rendus | PARTIEL | **P1** | Disclaimer bas de page présent ("projections indicatives") mais ne cite pas explicitement l'IA |
| Mention "Simulation" sur visuels téléchargés | NON | **P1** | Aucun watermark ni métadonnée EXIF au téléchargement |
| **Email de contact** accessible | OUI | — | mailto:contact@versiroom.fr dans footer et pricing Business |
| Lien "Nous contacter" dans footer | OUI | — | Présent |
| **Droit de rétractation** visible avant achat | NON | **P0** | Absent — paiement non encore actif mais doit être prêt avant activation |
| **Médiateur de la consommation** | NON | **P2** | Absent — obligatoire dès la 1re vente B2C |
| Informations caractéristiques service par pack | PARTIEL | **P1** | Les 3 packs listent les inclusions mais sans durée de validité des crédits ni conditions de remboursement |

---

## Actions requises par priorité

### P0 — Bloquant avant toute vente (ou avant 30 jours si site déjà actif sans paiement)

| Action | Agent responsable |
|--------|-------------------|
| Créer une page `/mentions-legales` avec éditeur, SIRET, adresse, hébergeur (Replit Inc., 440 N Barranca Ave, Covina CA 91723), directeur de publication | @fullstack + @copywriter |
| Créer une page `/cgv` avec clauses obligatoires (identité vendeur, packs, TVA, rétractation numérique, remboursement, PI images, médiation) | @copywriter (draft) → validation avocat |
| Créer une page `/confidentialite` avec collecte données, bases légales, transfert OpenAI/DPF, rétention 30j/90j, droits RGPD, contact privacy@ | @copywriter |
| Ajouter dans le footer les 3 liens : Mentions légales · CGV · Confidentialité | @fullstack |
| Afficher les prix **TTC** sur la page pricing avec mention "TVA 20% incluse" et "HT récupérable pour les professionnels" | @fullstack |
| Ajouter case à cocher rétractation contenu numérique au tunnel de paiement Stripe | @fullstack |

### P1 — Dans les 30 jours

| Action | Agent responsable |
|--------|-------------------|
| Renforcer le disclaimer IA : remplacer "projections indicatives" par "Visuels générés par intelligence artificielle — représentations non contractuelles" (EU AI Act Art. 50) | @fullstack |
| Ajouter watermark discret ou métadonnées EXIF "Généré par IA — Versiroom" sur images téléchargées | @fullstack |
| Ajouter durée de validité des crédits et politique de remboursement dans la section pricing | @fullstack + @copywriter |
| Créer email privacy@versiroom.fr et le mentionner dans la politique de confidentialité | Fondateur |

### P2 — Dans les 90 jours

| Action | Agent responsable |
|--------|-------------------|
| Désigner un médiateur de la consommation agréé (liste sur economie.gouv.fr) et le mentionner dans les CGV | Fondateur + @copywriter |
| Vérifier certification DPF de Replicate sur dataprivacyframework.gov — si absent, signer SCCs | Fondateur |
| Implémenter cron de nettoyage automatique images Object Storage (input 30j, pass1+output 90j) | @fullstack ou @infrastructure |

---

## Constat sur le pricing actuel

Le bloc pricing affiche "Bientôt disponible" sur le plan Pro et Business — **aucun paiement n'est actuellement actif**. Cela laisse une fenêtre pour mettre en conformité avant la 1re transaction. Cependant, le site est déjà en ligne et collecte des photos + logs IP : **la politique de confidentialité et les mentions légales sont exigibles dès maintenant**, indépendamment de l'activation du paiement.

---

**Handoff → @fullstack**
- Fichiers produits : `/home/user/Architecture/docs/legal/site-compliance-audit.md`
- Décisions prises : 3 pages légales à créer (/mentions-legales, /cgv, /confidentialite) — footer à enrichir avec 3 liens légaux — pricing à afficher TTC — disclaimer IA à renforcer — watermark sur téléchargements
- Points d'attention :
  - **P0 — footer** : ajouter `<a href="/mentions-legales">Mentions légales</a>` · `<a href="/cgv">CGV</a>` · `<a href="/confidentialite">Confidentialité</a>` dans le footer de `app/page.tsx` (ou créer un composant Footer dédié dans `app/layout.tsx`)
  - **P0 — pricing** : remplacer `29€/mois` par `29€ TTC/mois (TVA 20% incluse)` et ajouter note "HT récupérable pour les professionnels assujettis à la TVA"
  - **P0 — Stripe checkout** : case à cocher obligatoire avant validation paiement ("Je comprends que l'exécution du service numérique commence immédiatement et renonce expressément à mon droit de rétractation de 14 jours")
  - **P1 — disclaimer IA** : modifier le texte ligne 1319 de page.tsx vers "Visuels générés par intelligence artificielle — représentations indicatives non contractuelles"
  - **P1 — téléchargement images** : ajouter watermark textuel ou métadonnées EXIF au moment du download dans `ImageComparator.tsx`

**Handoff → @copywriter**
- Fichiers produits : `/home/user/Architecture/docs/legal/site-compliance-audit.md`
- Documents à rédiger (chemin obligatoire : `docs/legal/`) :
  - `mentions-legales.md` : éditeur, SIRET, adresse, hébergeur Replit, directeur de publication, email contact
  - `cgu-draft.md` : CGU + CGV — modèle packages crédits one-shot, exception rétractation contenu numérique, PI images générées, limitation responsabilité rendus IA, médiation consommateur
  - `privacy-policy.md` : politique de confidentialité RGPD — données collectées (photos, IP, logs), bases légales, transfert OpenAI (DPF), rétention 30j/90j, droits utilisateurs, contact privacy@versiroom.fr
- Référence : `docs/legal/legal-audit.md` contient l'analyse juridique détaillée (sections 1 à 3) à utiliser comme base pour tous les drafts
- Ton : accessible et sans jargon (Léa 32 ans, Thomas marchand de biens), mais juridiquement complet
- **Important** : les CGV doivent être validées par un avocat avant mise en ligne publique
