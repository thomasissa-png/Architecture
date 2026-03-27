# Audit ExportPortail V2a — Thomas Berger
> Date : 2026-03-27
> Fichiers : `components/ExportPortail.tsx`, `lib/portal-formatter.ts`, `app/annonce/[uuid]/page.tsx`

---

## Parcours simule

T3 Chartrons, 65 m2, 5 photos, DPE D, 285 000 EUR. J'ouvre ma page annonce, je veux copier le texte pour le coller sur LeBonCoin.

1. Je vois "Exporter votre annonce" juste sous le prix, AVANT la galerie photo. Bien. Pas besoin de scroller.
2. Je clique "Choisir un portail" -> dropdown avec LeBonCoin, SeLoger, Bien'ici. Logic-Immo grise "bientot". OK.
3. Je selectionne LeBonCoin. Le titre et la description apparaissent instantanement. Compteur de caracteres visible. Bien.
4. Je clique "Copier le texte LeBonCoin". Feedback "Texte LeBonCoin copie". Je colle sur LeBonCoin, c'est bon.
5. Je clique "Telecharger les photos (5)". ZIP avec noms clairs (01_Salon.jpg, 02_Chambre.jpg). Bien.
6. Le disclaimer IA en bas de la description : "Photos d'interieur generees par IA, a titre indicatif, non contractuelles." Correct, je prefere que ce soit la plutot que de risquer un litige.

**Flow reel : 3 clics** (dropdown -> LeBonCoin -> Copier). C'est ce que je voulais.

---

## Notes /10

| # | Critere | Note | Commentaire |
|---|---------|------|-------------|
| 1 | Retrouvabilite | 9/10 | Le composant est sur MA page annonce, je le retrouve quand je retrouve l'annonce. Pas un outil separe. |
| 2 | Prix/valeur | 10/10 | Gratuit (inclus dans Pro). Pas de cout cache. |
| 3 | Qualite pro | 9/10 | Texte pret a coller, disclaimer integre. Le format LeBonCoin est correct (titre + description continue). SeLoger/Bien'ici ont les champs structures en plus. |
| 4 | Partage acquereurs | N/A | Ce composant est pour MOI (export portail), pas pour les acquereurs. |
| 5 | Gestion d'erreur | 8/10 | "Copie echouee -- selectionnez le texte manuellement" est clair. Le warning description manquante est utile. MAIS : si le ZIP echoue (reseau, serveur), rien ne s'affiche -- le catch est silencieux (console.error seulement). |
| 6 | Simplicite | 10/10 | 3 clics. Je comprends en 5 secondes. Zero formation. |
| 7 | Confiance | 9/10 | Branding pro. Les compteurs de caracteres montrent que c'est calibre pour chaque portail. La note "Limites indicatives" sur SeLoger est honnete. |
| 8 | Completude | 8/10 | Titre + description + photos ZIP + champs structures. Il manque : pas d'indication du DPE dans le texte copie LeBonCoin (le DPE est saisi separement sur le portail, mais le texte copie ne le rappelle pas). |
| 9 | Mobile-first | 8/10 | Le dropdown est `w-full sm:w-auto`, OK sur iPhone. Les boutons copier sont `py-3`, touch target OK. MAIS : le bouton "Copier le titre" a un touch target de seulement `px-2 py-3` -- 2px de padding horizontal, c'est trop petit sur mobile. |
| 10 | Rapidite | 10/10 | Tout est instantane (formatage client-side, zero API). Le ZIP met quelques secondes pour les photos, normal. |

**Score global : 9.1/10** (sur 9 criteres applicables)

---

## Verdict

**Thomas utiliserait-il cette feature ? OUI.**

C'est exactement ce dont j'ai besoin. Au lieu d'ecrire mon annonce a la main sur LeBonCoin puis sur SeLoger puis sur Bien'ici, je copie-colle en 30 secondes. Le texte est calibre pour chaque portail. Game changer.

---

## Corrections pour atteindre 9.5/10

### P1 — Touch target bouton "Copier le titre" / "Copier la description" (8 -> 10 mobile)

`ExportPortail.tsx` ligne 322 et 357 : `px-2 py-3` est trop etroit horizontalement.

Changer `px-2 py-3` en `px-4 py-3` sur les 2 boutons "Copier le titre" et "Copier la description" pour un touch target >= 44px.

### P1 — Feedback utilisateur si le ZIP echoue (8 -> 9.5 erreur)

`ExportPortail.tsx` ligne 206-207 : le catch est silencieux. Ajouter un state `zipError` et afficher un message visible :
"Le telechargement a echoue. Verifiez votre connexion et reessayez."

### P2 — Rappel DPE dans le texte copie LeBonCoin (8 -> 9 completude)

`portal-formatter.ts` : dans le `copyText` LeBonCoin, si `dpeClasse` est renseigne, ajouter une ligne "DPE : D" avant le disclaimer. Ca evite que j'oublie de le saisir separement sur le portail.

### P2 — Note SeLoger/Bien'ici avec marqueur [HYPOTHESE]

`portal-formatter.ts` lignes 89 et 99 : les limites de caracteres sont des hypotheses. C'est bien documente dans le code mais le `notes` affiche en UI dit seulement "Limites indicatives". Ajouter "(valeurs estimees)" pour etre transparent.
