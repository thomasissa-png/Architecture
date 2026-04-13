# Audit UX — Page upload projet (`app/projet/nouveau/page.tsx`)

**Date** : 2026-04-13
**Agent** : @fullstack
**Persona** : Thomas (marchand de biens, 35 ans, Bordeaux)

## Grille /10

| # | Critere | Note | Justification |
|---|---|---|---|
| 1 | Onboarding (comprendre en 3s) | 8/10 | Titre "Nouveau bien" + sous-texte clair. Stepper visible. Seul manque : pas d'exemple visuel de ce qu'est un "plan" (Thomas pourrait confondre avec photo). |
| 2 | Upload multi-fichier | 9/10 | Drop zone toujours visible, label "1 fichier par etage", feedback instantane (preview image ou icone PDF), taille affichee, format refuse = message explicite. Touch targets 44px sur le bouton supprimer. |
| 3 | Reordination | 8/10 | Grip handle 6 points visible, hint sage "Glissez pour reordonner" apparait a 2+ fichiers, label "Etage 0/1/2" se met a jour en temps reel, ligne sage entre les items au survol. Touch support present. Point faible : pas d'animation de deplacement (l'item dragged devient transparent, pas de slide). |
| 4 | Validation (pret a soumettre) | 7/10 | Le CTA est disabled tant que adresse ou plan manquent. Message d'erreur rouge clair. Manque : pas de validation inline sur l'adresse (champ vide + required mais pas de message "champ obligatoire" avant submit). Pas de confirmation visuelle "tout est pret" (checkmark vert). |
| 5 | Mobile (touch, targets) | 8/10 | Tous les boutons interactifs ont min 44x44px. Touch reorder implemente. Drop zone cliquable. Seul point : le touch reorder n'a pas de haptic feedback (limitation navigateur) et la zone de grip pourrait etre plus grande sur petit ecran. |

**Moyenne : 8.0/10**

## Actions recommandees (par priorite)

1. **P2** : Ajouter une micro-illustration ou tooltip sur "Plans du bien" pour guider Thomas (plan = plan d'architecte ou scan, pas photo du salon)
2. **P2** : Validation inline sur le champ adresse (message sous le champ si < 5 caracteres au blur)
3. **P3** : Animation slide sur le reorder (translateY pendant le drag) pour un feedback plus fluide
4. **P3** : Indicateur "Pret" (checkmark vert) a cote du CTA quand tous les champs sont remplis
