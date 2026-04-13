# Audit UX — Page upload nouveau projet marchand
**Agent** : @ux | **Date** : 2026-04-13 | **Fichier audité** : `app/projet/nouveau/page.tsx`

## Scores par critère

| # | Critère | Note | Verdict |
|---|---|---|---|
| 1 | Onboarding — Thomas comprend quoi faire en 3s | 7/10 | OK — titre "Nouveau bien" + sous-titre explicite. Friction : aucun contexte "étape 1 sur X" verbalisé, ProStepper seul ne suffit pas |
| 2 | Upload — Drag & drop + clic + formats | 9/10 | PASS — zone dashed cliquable, drag-over coloré sage, libellé formats visible (PDF PNG JPG 20 Mo), feedback isDragOver |
| 3 | Multi-fichier — plusieurs étages clairs | 8/10 | OK — label "1 fichier par étage", CTA mute en "Ajouter un autre étage" après 1 fichier. Friction : max 10 jamais affiché avant erreur |
| 4 | Réordination — discoverable et intuitive | 7/10 | OK sur desktop (grip handle 44px, ligne drop visible). FRICTION P1 mobile : l'hint "Glissez pour réordonner" n'apparaît qu'après 2 fichiers, aucun affordance visuel avant |
| 5 | Autocomplétion adresse — suggestions visibles | 8/10 | PASS — debounce 300ms, listbox ARIA complet, min-h 44px par suggestion, onBlur avec delay 300ms pour éviter fermeture prématurée |
| 6 | Validation — erreurs claires + champs obligatoires | 6/10 | FRICTION P0 : aucun astérisque (*) ni marqueur visuel sur les champs requis (adresse, plan). Thomas ne sait pas ce qui bloquera le submit. Les messages fieldErrors existent mais ne s'affichent qu'après soumission |
| 7 | Mobile — touch targets 44px, layout responsive | 8/10 | PASS — grip handle 44px explicite, suggestions min-h 44px, max-w-2xl centré. Attention : input `type="number"` sur iOS ouvre un clavier numérique sans virgule (surface en m²) |
| 8 | Feedback — toast/spinner après soumission | 6/10 | FRICTION P1 : isSubmitting existe mais aucun libellé de spinner visible dans le JSX lu. Le bouton submit doit afficher "Création en cours…" pendant isSubmitting. Pas de toast succès (redirect immédiat, acceptable) |
| 9 | Confiance — prix clair | 8/10 | OK — "gratuit pendant la bêta" encodé dans le commentaire, mais absent du rendu visible. FRICTION P1 : Thomas ne voit nulle part "0 €" ou "gratuit" avant de soumettre |
| 10 | Progression — stepper visible | 7/10 | OK — ProStepper présent en haut. Friction : currentStep={1} sans label textuel "Étape 1 : Informations du bien" dans la page elle-même — dépendance totale au composant ProStepper non audité |

**Moyenne : 7.4/10**

## Corrections P0/P1 à appliquer immédiatement

**P0-A — Marqueurs champs obligatoires** (critère 6) : ajouter `<span aria-hidden="true" className="text-[#B91C1C] ml-0.5">*</span>` après le label "Adresse du bien" et "Plans du bien". Ajouter une légende `<p className="text-xs text-[#9B9A94] mb-4">* Champs obligatoires</p>` sous le titre de page.

**P1-A — Spinner submit visible** (critère 8) : le bouton submit doit rendre `{isSubmitting ? "Création en cours…" : "Créer le projet"}` avec `disabled={isSubmitting}` et un spinner SVG inline.

**P1-B — Prix affiché** (critère 9) : ajouter sous le bouton submit `<p className="text-xs text-center text-[#9B9A94] mt-2">Gratuit pendant la bêta — aucune carte bancaire requise</p>`.

**P1-C — Hint réordination dès 1 fichier** (critère 4) : afficher le bandeau "Glissez pour réordonner" dès `planFiles.length >= 1` (condition actuelle : `> 1`), avec libellé conditionnel "Vous pourrez réordonner les étages après le 2e fichier" si un seul fichier est présent.

---
**Handoff → @fullstack** : appliquer P0-A, P1-A, P1-B, P1-C dans `app/projet/nouveau/page.tsx`. Aucun changement de structure — modifications de libellés et de conditions d'affichage uniquement.
