# Audit Thomas Berger -- Page "Decoupe en biens" (Etape 3) -- R2

**Agent** : @marchand-de-biens (Thomas Berger)
**Date** : 2026-04-13
**Fichiers** : `app/projet/[id]/decoupe/page.tsx`, `components/marchand/PlanEditor.tsx`
**Revision** : R2 (post-corrections P0/P1/P2 du R1)

---

## Scoring (grille 10 criteres Thomas)

| # | Critere | Note | Commentaire |
|---|---------|------|-------------|
| 1 | Retrouvabilite | 9.5/10 | Stepper clair, etape 3 visible, le projet est retrouvable via /projet/[id]. Rien a redire. |
| 2 | Prix/valeur | 10/10 | Pas de notion de credit/prix sur cette page. Normal, c'est une etape de workflow. |
| 3 | Qualite pro | 9.5/10 | Plan central, sidebar propre, couleurs de lots distinctes. Ca fait serieux devant un acquereur. |
| 4 | Partage acquereurs | N/A | Pas applicable a cette etape (partage = etape dossier/annonce). |
| 5 | Gestion d'erreur | 9/10 | Erreur chargement avec "Reessayer", fallback 1 lot si detection IA echoue, toast de confirmation. Un point : le message d'erreur generique "Erreur lors de la sauvegarde" pourrait etre plus precis (connexion ? serveur ? droits ?). |
| 6 | Simplicite | 9.5/10 | Clic sur piece du plan, bottom sheet mobile, "Confirmer et continuer". Limpide. Le subtitle "Assignez chaque piece a un lot" dit tout. |
| 7 | Confiance | 9.5/10 | Header/Footer coherents, branding Versimo, stepper pro, toast "Decoupe enregistree" avec checkmark. |
| 8 | Completude | 9/10 | Lots avec nom, type, surface, nombre de pieces, indicateur multi-etage. Manque : pas de vue recapitulative des lots avant confirmation (combien de m2 total ? combien de pieces au total ? rien ne resume l'ensemble). |
| 9 | Mobile-first | 9/10 | Bottom sheet OK, pills 44px, floor tabs 44px, CTA sticky backdrop-blur. Deux points mineurs : (a) les boutons du desktop dropdown (py-1.5, pas de min-h-44px) seraient trop petits si un tablet tombe dans le breakpoint lg, (b) le bouton "Retour" du CTA sticky n'a pas de min-h-44px. |
| 10 | Rapidite | 9.5/10 | Detection IA auto au mount, assignation en 2 taps (clic piece + choix lot), sauvegarde avec toast + redirect. Le flow est rapide. |

**Note globale : 9.4/10**

---

## Verdict

Presque au seuil. Les P0 du R1 sont tous corriges : bottom sheet mobile, confirmation suppression, toast sauvegarde, touch targets. Le parcours "clic sur piece, choix du lot, confirmer" fonctionne en 3 gestes. Il reste 2 points mineurs qui empechent le 9.5 :

1. **P2 -- Recapitulatif avant confirmation.** Quand j'ai 4 lots, je veux voir un resume "Lot 1 : 3 pieces, 45 m2 / Lot 2 : 2 pieces, 30 m2 / Total : 5 pieces, 75 m2" au-dessus du bouton Confirmer. Aujourd'hui il faut parcourir chaque carte mentalement.

2. **P2 -- Bouton "Retour" sans min-h-44px.** Le CTA "Retour" (ligne 798) a py-2.5 mais pas de min-h-[44px] explicite. Sur mobile, ca passe probablement mais c'est mieux de le garantir.

3. **P3 -- Message d'erreur sauvegarde.** "Erreur lors de la sauvegarde" est vague. Preferer "La sauvegarde a echoue, verifiez votre connexion et reessayez." avec un bouton Reessayer (au lieu de juste afficher le texte).

Score arrondi avec ces corrections mineures : passage a **9.5/10** apres fix du P2-1 (recapitulatif).
