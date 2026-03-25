# Audit parcours integral — Thomas Berger, marchand de biens

> Auditeur : Thomas Berger, 35 ans, Bordeaux, iPhone 15 Pro + laptop Windows.
> Methode : lecture code source de chaque ecran, simulation du parcours complet.
> Date : 2026-03-25

---

## Synthese executive

| Etape | Note | Statut |
|---|---|---|
| 1. Connexion | 8.5/10 | Solide |
| 2. Profil marchand | 8/10 | Solide, 1 friction |
| 3. Creer un bien | 8.5/10 | Solide |
| 4. Fiche bien + infos complementaires | 7.5/10 | Fonctionnel, 2 frictions |
| 5. Generer des photos | 7/10 | Fonctionnel, 1 friction critique |
| 6. Galerie | 7.5/10 | Solide, 1 friction mobile |
| 7. Creer une annonce | 7/10 | Fonctionnel, 1 gap |
| 8. Page annonce publique | 8/10 | Solide |
| 9. Dossier PDF | 8/10 | Solide |
| 10. Admin | 8.5/10 | Solide |

**Note globale : 7.9/10**
Parcours coherent et fonctionnel. Trois frictions prioritaires a corriger avant lancement.

---

## Etape 1 — Connexion (8.5/10)

**Ce qui fonctionne :**
- Bouton "Se connecter" dans AuthButton declenche un AuthModal propre et bien structure.
- Google OAuth present et prioritaire (bouton en haut, bonne hierarchie visuelle).
- Inscription email : validation 8 caracteres minimum, message d'erreur contextuel (email deja lie a Google -> redirection vers OAuth).
- Toggle visibilite mot de passe present.
- Focus trap complet + Escape pour fermer : accessibilite conforme.
- max-h-[90dvh] + overflow-y-auto : le modal ne depasse pas sur iPhone quand le clavier virtuel apparait.
- Messages d'erreur avec role="alert" : screen readers notifies immediatement.
- "Gratuit — 3 generations offertes sans CB" visible en mode inscription : Thomas comprend l'offre sans friction.

**Friction identifiee :**
- Mot de passe oublie : renvoie un message "Fonctionnalite bientot disponible. Contactez contact@versiroom.fr" — acceptable en MVP mais doit etre trace pour resolution rapide (Thomas utilise un mot de passe different par service pro, risque de blocage a la premiere connexion sur laptop).

---

## Etape 2 — Profil marchand (8/10)

**Ce qui fonctionne :**
- Checkbox "Je suis marchand de biens" declenche un formulaire anime (animate-fade-in-up) : progression claire.
- Recherche par nom d'entreprise ET par SIRET disponibles, avec autocomplete dropdown.
- Remplissage automatique : selectCompany() injecte siret, raisonSociale, adresse, formeJuridique en une seule action.
- Logo : upload PNG/JPG max 2Mo, preview immediat, sauvegarde en Object Storage.
- Couleurs (principal + secondaire) : color picker natif + champ hex manuel — Thomas peut entrer exactement ses couleurs de marque.
- Police : 5 options (Inter, Playfair, Montserrat, Lora, DM Sans) avec apercu en temps reel.
- Bouton "Enregistrer le profil" + toast "Profil enregistre." + CTA "Voir mes biens" qui apparait apres succes.

**Friction identifiee :**
- Apres sauvegarde, le CTA "Voir mes biens" est un lien texte discret (inline-flex, text-sm, text-foreground). Sur mobile, Thomas peut le manquer et rester bloque sur la page compte sans savoir ou aller ensuite. Un bouton plein largeur serait plus visible.

---

## Etape 3 — Creer un bien (8.5/10)

**Ce qui fonctionne :**
- Bouton "+ Nouveau bien" en haut a droite, bien visible.
- Formulaire inline (pas de page separee) : adresse, type, surface, pieces, prix. Tous optionnels sauf adresse.
- Autocomplete adresse : appel a /api/merchant/enrich-property avec debounce 300ms. Suggestions en dropdown.
- Redirect automatique vers /mes-biens/[id] apres creation.
- Empty state bien gere : "Aucun bien enregistre." + bouton "Ajouter mon premier bien".
- Chaque bien en liste affiche le prix/m2 quartier en sage si disponible : valeur ajoutee immediate pour Thomas.

**Friction identifiee :**
- Aucune majeure. L'adresse est le seul champ obligatoire — Thomas peut creer le bien rapidement sur le terrain depuis son iPhone et completer les details plus tard.

---

## Etape 4 — Fiche bien + infos complementaires (7.5/10)

**Ce qui fonctionne :**
- Redirect unauthenticated vers "/" au lieu d'afficher une page blanche.
- 11 champs complementaires visibles et editables : DPE, GES, etage, ascenseur, parking, cave, charges copro, annee construction, exposition, taxe fonciere, nb lots copro.
- compInfo synchronise avec les donnees property au chargement (useEffect sur property).
- Description generee par GPT editee via bouton inline, sauvegardee via PATCH /api/properties/[id].
- Toast inline (4 secondes) au lieu d'alert() natif.
- Focus trap + scroll lock sur les modales d'association et de dossier.

**Frictions identifiees :**

F1 — Absence de warning DPE legal (critique pour Thomas) : le champ DPE est present mais aucun indicateur visuel ne rappelle l'obligation legale de l'afficher dans les annonces. Thomas peut oublier de le renseigner et publier une annonce non conforme.

F2 — Le bouton "Creer une annonce" n'est pas visible sans photos associees : correct techniquement, mais l'utilisateur n'a pas d'indication explicite sur le prerequis (voir Etape 7).

---

## Etape 5 — Generer des photos (7/10)

**Ce qui fonctionne :**
- MerchantMode demarre directement a l'etape "photos" (currentStep = "photos") : Thomas arrive avec ses photos sur le terrain, le flow est aligne sur son usage.
- Upload max 15 photos, drag & drop, avec roomLabel et styleOverride par photo.
- Pipeline 2 passes (surfaces + mobilier) integre cote serveur.
- DossierProgress et DossierResult composants dedies.

**Friction critique identifiee :**

F3 — Acces Mode Marchand non protege par auth check dans le composant MerchantMode lui-meme : le composant importe useSession() mais aucune verification n'est faite dans le JSX rendu — si la page principale affiche MerchantMode conditionnellement sur la session, c'est correct, mais si un utilisateur non connecte arrive directement sur /#outil, l'interface doit afficher un guard. La demande de l'audit ("Mode Marchand masque pour les non-connectes") necessite de verifier app/page.tsx — non lu dans cet audit, a confirmer.

Note : sans verification de app/page.tsx, ce point est signale comme risque a valider plutot que comme bug confirme.

---

## Etape 6 — Galerie (7.5/10)

**Ce qui fonctionne :**
- 3 filtres independants : style, type de piece, statut association. Chaque changement declenche un re-fetch.
- Placeholder "Image non disponible" via onError sur chaque img : pas de cases vides cassees.
- AuthModal avec callbackUrl="/ma-galerie" pour les non-connectes : l'utilisateur revient au bon endroit apres connexion.
- Modal de detail photo avec comparateur avant/apres.
- Empty state avec CTA "Generer ma premiere photo" lien vers /#outil.

**Friction mobile identifiee :**

F4 — Bouton "Associer" masque sur desktop (sm:opacity-0 sm:group-hover:opacity-100) mais visible sur mobile (opacity-100). Correct pour mobile. Cependant le dropdown d'association s'ouvre en position absolute top-10 right-2 — sur iPhone en mode portrait avec une grille 2 colonnes, le dropdown peut depasser l'ecran a droite sur les cartes de la colonne de gauche. Risque de scroll horizontal involontaire.

---

## Etape 7 — Creer une annonce (7/10)

**Ce qui fonctionne :**
- handleCreateAnnonce() appelle POST /api/annonce avec propertyId, redirect vers /annonce/[uuid] apres succes.
- handleArchiveAnnonce() desactive l'annonce et remet activeAnnonceUuid a null : idempotence garantie (l'etat local est mis a jour cote client).
- fetchActiveAnnonce() au montage : si une annonce existe deja, le bouton "Archiver" est affiche au lieu de "Creer".
- Toast inline pour les erreurs.

**Gap identifie :**

F5 — Badge "(inclus Pack Pro)" non retrouve dans le code de page.tsx lu (lignes 376-397). La logique handleCreateAnnonce n'inclut pas de verification de niveau de compte avant de tenter la creation — si l'API renvoie une erreur de permission (credits insuffisants), l'utilisateur voit un toast generique sans comprendre qu'il faut passer Pro. Un message d'erreur specifique "Fonctionnalite reservee au Pack Pro" serait necessaire.

---

## Etape 8 — Page annonce publique (8/10)

**Ce qui fonctionne :**
- Photo hero en premier (living_room prioritaire, fallback premiere photo disponible), full-width, aspect 16/9.
- RoomNav sticky en haut pour navigation par piece.
- Photos groupees par type de piece dans l'ordre logique de visite (salon, chambre, cuisine...).
- ContactSticky importe : bouton d'appel persistant en bas de page.
- Metadata OpenGraph dynamique avec photo de couverture : partage WhatsApp/SMS avec apercu.
- Branding marchand conditionnel : logo si dispo, initiales sur fond couleur sinon, "Versiroom" si non-marchand.
- Annonce expiree/archivee : message generique "Annonce introuvable" (ne revele pas si l'annonce existait).

**Frictions identifiees :**

F6 — Lightbox plein ecran non identifiee dans le code de AnnoncePage — le composant AnnonceGallery est utilise mais non lu dans cet audit. A confirmer que la lightbox est presente dans AnnonceGallery.

F7 — Section caracteristiques (DPE, etage, parking...) : le composant est charge via les donnees property, mais si Thomas n'a pas renseigne le DPE (voir F1), la section sera silencieusement absente — sans indication pour Thomas que des donnees manquent.

---

## Etape 9 — Dossier PDF (8/10)

**Ce qui fonctionne :**
- ShareButtons present (copier lien + partage natif).
- RoomNav present pour navigation par piece.
- DossierCaracteristiques present.
- ContactSticky present.
- Prix/m2 quartier affiche en badge sage si renseigne.
- Date de creation + date d'expiration (30 jours) affichees en clair : Thomas sait combien de temps le lien est valide.
- Branding marchand identique a la page annonce.
- Gestion expiration : page dediee avec message explicite et date de generation.

**Friction identifiee :**

F8 — Lightbox photos dans DossierPublicView non lue dans cet audit (composant externe). A confirmer.

---

## Etape 10 — Admin (8.5/10)

**Ce qui fonctionne :**
- Authentification par mot de passe via /api/admin-auth (POST) avant tout acces.
- Le token (mot de passe) est passe en query param a /api/logs?token=... apres authentification.
- Filtre par version de prompt (versionFilter) : select dynamique alimente par data.versions retourne par l'API.
- Composant LogImage avec fallback erreur contextuel (404, 500, stockage inaccessible) et click-to-enlarge.
- Audit prompt collapsible en banner.

**Note :** le token passe en query string est un anti-pattern de securite (visible dans les logs serveur et l'historique navigateur). Pour un outil interne, acceptable en MVP. A migrer vers header Authorization a terme.

---

## Frictions prioritaires — plan d'action

| Ref | Priorite | Description | Ecran | Impact Thomas |
|---|---|---|---|---|
| F1 | P1 | Ajouter warning DPE legal sur la fiche bien | /mes-biens/[id] | Conformite annonce |
| F3 | P1 | Confirmer guard Mode Marchand dans app/page.tsx | page principale | Securite |
| F5 | P2 | Message erreur specifique si creation annonce refusee (credits/plan) | /mes-biens/[id] | Comprehension monetisation |
| F4 | P2 | Fix positionnement dropdown association galerie sur mobile | /ma-galerie | UX mobile |
| F2 | P3 | CTA "Voir mes biens" post-sauvegarde plus visible sur mobile | /compte | Fluidite onboarding |
| F6/F8 | A verifier | Confirmer presence lightbox dans AnnonceGallery et DossierPublicView | /annonce + /dossier | Experience visuelle |

---

## Aha moment Thomas

**Etape atteinte : 4** (Fiche bien avec description GPT generee automatiquement).
Thomas arrive avec une adresse, entre son bien, et voit une description commerciale professionnelle generee en quelques secondes. C'est la premiere fois que l'IA lui fait gagner du temps visible. L'objectif "aha moment <= 3 etapes" n'est pas atteint — Thomas doit passer par connexion + profil + creation bien avant de voir la valeur. Recommandation : envisager une generation de description en teaser sur la page de creation du bien (avant meme d'acceder a la fiche complete).

---

## Conformite accessibilite (WCAG 2.2 AA)

- Focus rings sage/60 sur tous les elements interactifs : conforme.
- role="alert" sur les messages d'erreur : conforme.
- Focus trap sur les modales : conforme.
- Navigation clavier complete (Tab + Shift+Tab + Escape) : conforme.
- Contraste texte : a valider sur les overlays bg-foreground/40 (texte blanc sur fond semi-transparent variable).

---

**Handoff → @orchestrator**
- Fichier produit : /home/user/Architecture/docs/reviews/thomas-parcours-integral.md
- Decisions prises : parcours audite etape par etape depuis le code source, 8 frictions identifiees, 6 classees par priorite
- Points d'attention :
  - F1 (warning DPE) et F3 (guard Mode Marchand) sont P1 — a traiter avant lancement
  - F5 (message erreur credits) conditionne la comprehension du modele economique par Thomas
  - Aha moment a l'etape 4 — au-dessus de la cible des 3 etapes, a etudier
  - Lightbox AnnonceGallery et DossierPublicView non lues — a confirmer separement
