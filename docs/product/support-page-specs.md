# Specs — Page /support

**Projet** : Versimo | **Date** : 2026-04-05 | **Statut** : V1

---

## Route et accès

- **URL** : `/support` — protégée NextAuth, redirect `/login?callbackUrl=/support` si non connecté
- **Point d'entrée** : lien "Support" dans le dropdown de `AuthButton` (existant)

---

## US-SUP-01 : Envoyer un message de support

**Persona** : Claire (architecte), Thomas (marchand), Léa (particulière)
**Epic** : Support utilisateur
**Dépendances** : Session NextAuth active
**Priorité RICE** : R=3 I=8 C=9 E=1 → Score=216

### Job-to-be-done
En tant qu'utilisateur connecté, je veux envoyer un message à l'équipe Versimo afin d'obtenir de l'aide sans quitter l'application.

### Formulaire — Champs

| Champ | Type | Obligatoire | Validation | Limites | Exemple |
|---|---|---|---|---|---|
| email | email | Oui | Pré-rempli session, readonly | — | claire@cabinet-dumont.fr |
| category | enum | Oui | Valeur dans la liste | — | Bug génération |
| message | string | Oui | min 10 chars | 10–2000 chars | "La génération s'arrête à la passe 1." |
| screenshot | file | Non | jpg/png uniquement, max 5 Mo | — | bug-ecran.jpg |

**Valeurs select category** : `Bug génération` · `Facturation/crédits` · `Suggestion` · `Question` · `Autre`

### 5 états UI

| État | Comportement | Message/Affichage |
|---|---|---|
| Défaut | Formulaire chargé, email pré-rempli en readonly | Champs vides sauf email |
| Loading | Soumission en cours, bouton disabled | Spinner inline dans le bouton "Envoi en cours…" |
| Vide | N/A — le formulaire est toujours affiché | — |
| Erreur | Validation client échouée ou API error | Inline sous le champ fautif ou toast rouge "Erreur d'envoi, réessayez." |
| Succès | Email envoyé | Toast vert inline "Message envoyé, nous vous répondons sous 24h." — formulaire réinitialisé (sauf email) |

### Critères d'acceptance

**Happy path :**
- [ ] GIVEN utilisateur connecté WHEN il ouvre /support THEN son email de session est affiché en readonly
- [ ] GIVEN formulaire valide (catégorie + message >= 10 chars) WHEN il soumet THEN POST /api/support déclenche l'envoi à contact@versimo.fr et retourne 200
- [ ] GIVEN envoi réussi WHEN la réponse est 200 THEN toast vert "Message envoyé, nous vous répondons sous 24h." s'affiche et le message est réinitialisé

**Cas d'erreur :**
- [ ] GIVEN message < 10 chars WHEN il soumet THEN erreur inline sous le textarea "Message trop court (10 caractères minimum)"
- [ ] GIVEN API Resend indisponible WHEN il soumet THEN toast rouge "Erreur d'envoi, réessayez." — aucun rechargement de page

**Cas limites :**
- [ ] GIVEN screenshot > 5 Mo WHEN il sélectionne le fichier THEN erreur inline "Fichier trop lourd (max 5 Mo)"
- [ ] GIVEN fichier non jpg/png WHEN il sélectionne THEN erreur inline "Format non supporté (JPG ou PNG uniquement)"
- [ ] GIVEN double-clic sur Envoyer WHEN soumission en cours THEN bouton disabled, un seul appel API émis

**Permissions :**
- [ ] GIVEN utilisateur non connecté WHEN il accède à /support THEN redirect vers /login?callbackUrl=/support

**Données existantes :**
- [ ] GIVEN email de session présent WHEN la page charge THEN le champ email affiche l'adresse de la session sans possibilité d'édition

---

## API — POST /api/support

- **Authentification** : session NextAuth obligatoire (getServerSession)
- **Rate limit** : 5 requêtes/heure par IP
- **Request body** : `{ category: string, message: string, screenshot?: base64 string }`
- **Traitement** : envoi email via Resend (ou nodemailer SMTP fallback) à contact@versimo.fr, sujet `[Versimo Support] {category} — {email}`, corps HTML avec tous les champs + screenshot en pièce jointe si fourni
- **Response 200** : `{ success: true }`
- **Response 400** : `{ error: "Message trop court" }`
- **Response 401** : `{ error: "Non authentifié" }`
- **Response 500** : `{ error: "Erreur serveur" }`

---

## Design

- `bg-background` (#FAFAF8), tokens Versimo, Inter 300–800
- Mobile-first : formulaire pleine largeur sur mobile, max-w-lg centré sur desktop
- Screenshot input : zone de drop discrète avec icône upload, label "Ajouter une capture (optionnel)"
- Bouton submit : variante primaire sage (#7D9B76), pleine largeur mobile

---

## Notes @fullstack

- Utiliser `useSession()` pour pré-remplir l'email
- Screenshot : convertir en base64 côté client avant envoi (FileReader), envoyer dans le body JSON
- Resend SDK si déjà présent dans le projet, sinon nodemailer avec SMTP env vars (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`)
- Rate limit IP : middleware ou compteur in-memory (même pattern que /api/generate)

## Notes @ux

- Le lien "Support" dans le dropdown AuthButton s'ajoute après "Mon compte" / avant "Déconnexion"
- Toast positionné en bas-centre, visible sur mobile sans masquer le formulaire
- Label readonly sur l'email : opacité réduite (text-foreground/50) pour signaler la non-édition

---

**Handoff → @fullstack**
- Fichier produit : `docs/product/support-page-specs.md`
- Décisions : route /support protégée NextAuth, envoi via Resend/nodemailer, screenshot en base64, rate limit 5 req/h
- Points d'attention : double-soumission bloquée côté client, screenshot optionnel max 5 Mo jpg/png, email pré-rempli readonly depuis session
