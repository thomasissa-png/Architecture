# Audit UX — Page /support (3 personas)
Date : 2026-04-05

---

## Claire — Architecte, 40 ans, iPad Pro

**Note : 8/10**

Points positifs : formulaire épuré, tokens Versimo respectés, champ email pré-rempli (zéro saisie), ARIA correct.

Frictions identifiées :

- **"Bug génération" manque de précision.** Claire cherchera "génération IA" ou "résultat incorrect" — le terme "bug" est trop technique/développeur pour une architecte. Reformuler : "Problème de génération".
- **Screenshot iPad : le tap target de la zone upload est insuffisant.** L'icône + texte font ~44px de hauteur mais toute la zone cliquable est restreinte au `<label>`. Sur iPad, le tap zone devrait couvrir toute la largeur avec au moins 56px de hauteur pour un confort tactile. Actuellement `py-3` = environ 36-40px.
- **Pas de sous-titre de page côté contexte** : Claire arrive sans savoir si cette page couvre aussi les questions métier (tarifs, projets, conseils). Un sous-titre rassurant ("Besoin d'aide sur une génération, une facture ou un style ? Écrivez-nous.") lèverait l'hésitation.
- **Toast de succès sans auto-dismiss.** Le toast reste visible indéfiniment. Claire ne sait pas s'il faut le fermer manuellement ou s'il disparaît. Ajouter auto-dismiss à 5 secondes ou un bouton de fermeture explicite.

---

## Thomas — Marchand de biens, 35 ans, iPhone chantier

**Note : 7.5/10**

Points positifs : formulaire court (aucune étape superflue), envoi rapide, rate limit 5/h raisonnable pour son usage.

Frictions identifiées :

- **Textarea trop petite sur mobile.** `rows={5}` avec `min-h-[120px]` est correct sur desktop mais sur iPhone en mode portrait, le clavier prend 40% de l'écran — la textarea visible se réduit à ~2 lignes. Passer à `min-h-[100px]` + `rows={4}` ET ajouter `resize-none` avec un compteur visible pour forcer un champ moins "écrasable".
- **"Facturation/crédits" couvre son besoin primaire** (recharges, factures Pro) mais Thomas cherche aussi "Abonnement" ou "Résiliation" qui n'apparaissent nulle part. L'entrée "Facturation/crédits" est correcte mais pourrait s'appeler "Facturation / Abonnement" pour couvrir les questions de gestion de compte sans ambiguïté.
- **Bouton "Envoyer" pleine largeur uniquement sur mobile manqué.** Sur mobile, le bouton est `w-full sm:w-auto`. C'est bien, mais `min-h-[44px]` est respecté — pas de problème ici. En revanche, sur iPhone SE (375px), le bouton texte "Envoyer" sans icône contextuelle manque de signal visuel. Ajouter une icône d'envoi renforcerait la clarté.
- **Aucun numéro de ticket après envoi.** Thomas travaille vite, il a besoin d'une référence pour son suivi. Le message de succès ("nous vous répondons sous 24h") ne donne aucune traçabilité. Ajouter un ID de ticket même simple ("Demande #XXXXX") rassure et réduit les doublons de contact.

---

## Léa — Particulière, 32 ans, iPhone

**Note : 7/10**

Points positifs : ton sobre et accessible, formulaire non intimidant, confirmation 24h claire.

Frictions identifiées :

- **Vocabulaire "Catégorie" trop générique.** Léa hésite : est-ce que "Suggestion" c'est pour demander un nouveau style ? Est-ce que "Question" c'est pour demander comment ça marche ? Les catégories manquent d'une micro-description au survol ou d'un placeholder contextuel. Exemple : remplacer "Autre" par "Autre question" et "Suggestion" par "Idée / Suggestion".
- **Tone of voice trop neutre pour Léa.** Le sous-titre "Une question, un bug, une suggestion ?" utilise le mot "bug" qui est technique. Pour Léa digital-native mais non-technicienne : "Un souci, une idée, ou juste une question ?" est plus naturel.
- **Toast de succès sans auto-dismiss (même friction que Claire).** Sur iPhone, le toast fixe en bas peut être masqué par la barre de navigation système iOS. Positionner à `bottom-20` sur mobile (au lieu de `bottom-6`) pour éviter le chevauche avec la barre home indicator.
- **Pas de lien de retour post-envoi.** Après confirmation, Léa est sur la page support vide (formulaire réinitialisé) sans indication de quoi faire ensuite. Ajouter un lien "Retourner à l'outil" dans le toast ou sous le formulaire post-succès.

---

## Design — Conformité tokens Versimo

**Statut : PASS avec 2 points de vigilance**

- Tokens bg-background, text-foreground, sage (#7D9B76) : conformes.
- Focus-visible:ring-2 ring-sage/50 : présent sur tous les interactifs (select, textarea, button, file label). PASS.
- Touch targets : bouton submit = `min-h-[44px]` PASS. Bouton suppression screenshot = `w-8 h-8` = 32px — FAIL (en dessous des 44px requis). Corriger à `w-11 h-11`.
- Mobile-first : `max-w-xl` centré, `sm:w-auto` sur le bouton, `text-2xl sm:text-3xl` — cohérent. PASS.
- Le select `appearance-none` sans chevron SVG custom : sur iOS Safari, le select native s'affiche avec le style système (acceptable mais incohérent avec le design system Versimo). Ajouter un chevron SVG positionné absolument pour homogénéiser.

---

## Top 5 corrections pour atteindre 10/10

| # | Correction | Persona(s) | Impact |
|---|---|---|---|
| 1 | Bouton suppression screenshot : `w-8 h-8` → `w-11 h-11` (32px → 44px) | Claire, Thomas, Léa | Accessibilité mobile, WCAG 2.2 |
| 2 | Toast auto-dismiss 5s + position `bottom-20` sur mobile (évite barre iOS) | Claire, Léa | Clarté feedback, UX mobile |
| 3 | Renommer "Bug génération" → "Problème de génération" et "Autre" → "Autre question" | Claire, Léa | Vocabulaire persona, réduction friction catégorie |
| 4 | Ajouter ID de ticket dans le message de succès ("Demande #XXXXX") | Thomas | Confiance, traçabilité, réduction doublons |
| 5 | Chevron SVG custom sur le select (replace appearance-none sans visuel) + zone upload `min-h-[56px]` sur mobile | Claire, Thomas | Cohérence design system, confort tactile iPad/iPhone |

---

**Synthèse** : la page est fonctionnellement solide (auth, rate limit, DB + email, validation client + serveur). Les 5 corrections sont cosmétiques et micro-UX — aucune refonte structurelle nécessaire. Avec ces corrections, la page atteint le 10/10 fondateur.

---

**Handoff → @fullstack**
- Fichier produit : `/home/user/Architecture/docs/reviews/audit-support-personas.md`
- Corrections à implémenter : 5 items listés dans le tableau ci-dessus (2 corrections CSS, 1 wording, 1 feature toast/ID ticket, 1 select chevron)
- Point d'attention : l'ID de ticket nécessite que l'API `/api/support` retourne un `id` dans la réponse JSON (actuellement `{ success: true }` seulement) — petit changement backend requis
