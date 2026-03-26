# Lessons Learned — Versiroom

> Ce fichier capitalise les apprentissages de chaque session pour que les sessions suivantes ne répètent pas les mêmes erreurs.
> Lire ce fichier AVANT de commencer toute nouvelle session.

---

## Session 2026-03-26 — Sprint massif (lint, auth, F6, audits, agents, iteration pipeline)

### Ce qui a bien fonctionné

- **Agents en parallèle** : lancer 3+ agents simultanément (reviewer + Thomas + QA) divise le temps d'audit par 3. Toujours les lancer en parallèle quand ils n'ont pas de dépendances.
- **Itérations rapides Marc** : 4 passes (V1 6.9 → V2 8.3 → V3 9.2 → V4 ~9.5) en audite-corrige-reaudite. Le cycle audit → fix ciblé → re-audit fonctionne bien.
- **Persona enrichi en temps réel** : mettre à jour persona-marc-acheteur.md avec les apprentissages des audits permet aux sessions suivantes de ne pas redécouvrir les mêmes insights.
- **Prompt versioning** : PROMPT_VERSION dans route.ts (v18→v21) permet aux agents auditeurs (Yann, Lucas, Camille) de savoir quelle version de prompt a produit chaque image.
- **Read-after-write Object Storage** : le fix le plus impactant de la session — le sidecar Replit Object Storage reporte ok:true mais le blob n'est pas toujours durable immédiatement.

### Ce qui a mal fonctionné

- **Agents trop gros = timeout** : les agents UX et Design avec 20 fichiers à lire ont timeout 2 fois. Solution : scope réduit (8-10 fichiers max), écriture par sections (Write puis Edit), max 100 lignes de sortie.
- **Agent-factory sans permissions Write** : les agents lancés via `agent-factory` n'ont pas accès à Write dans leur environnement isolé. Solution : l'orchestrateur crée les fichiers manuellement avec le contenu produit par l'agent.
- **`client-mandataire` non disponible comme subagent_type** : les agents custom dans `.claude/agents/` ne sont pas dans la liste hardcodée des types d'agents. Solution : utiliser `subagent_type: "ux"` en incarnant le persona Marc.
- **Fire-and-forget = données perdues** : `saveUserPhoto()` et `saveImage()` en IIFE fire-and-forget pouvaient être tués par le runtime serverless avant de finir. Solution : `await Promise.race([save, 5s timeout])`.
- **Object Storage consistance éventuelle** : `uploadFromBytes` retourne ok:true mais `downloadAsBytes` peut retourner false juste après. Solution : read-after-write verification + retry lecture après 500ms.
- **var(--token) vs classes Tailwind** : `/compte/page.tsx` utilisait `text-[var(--foreground)]` au lieu de `text-foreground` — ~100 occurrences à nettoyer. Règle : toujours utiliser les alias Tailwind directs.
- **focus:ring vs focus-visible:ring** : `focus:ring` se déclenche au clic souris, `focus-visible:ring` uniquement au clavier. Toujours utiliser `focus-visible:ring` (WCAG 2.2).
- **text-[10px]** : sous le seuil WCAG AA de 12px. Toujours utiliser `text-xs` (12px) minimum pour le texte visible.

### Améliorations framework

- **Règle anti-timeout pour les agents** : max 10 fichiers à lire, max 100 lignes de sortie, écrire section par section.
- **Toujours committer les WIP** : les agents background peuvent timeout — committer régulièrement les changements intermédiaires.
- **Ne pas lancer 4+ agents sur les mêmes fichiers** : conflit de merge garanti. Sérialiser quand les agents touchent les mêmes fichiers.
- **Tester les API images de bout en bout** : le chemin DB → Object Storage → API → frontend a 4 points de rupture possibles. Toujours tracer le chemin complet.

---

## Sessions 2026-03-24/25 — F1-F4, audits, legal, SEO, branding

### Ce qui a bien fonctionné

- **Pipeline 2 passes** (Sprint 8-18) : séparer surfaces (passe 1) et mobilier (passe 2) est la décision architecturale la plus impactante du projet. Single-pass échoue systématiquement.
- **Audits croisés Yann+Lucas** : l'architecte juge le contenu (style, meubles, proportions), l'expert IA juge la technique (photorealisme, préservation géométrie). Complémentaires, jamais redondants.
- **Audit → fix → re-audit itéré** : Thomas est passé de 6.1 à 9.0/10 en 5 itérations. Le cycle fonctionne.
- **Personas dans les prompts** : les prompts enrichis avec des pièces iconiques (PH5, Eames, Wegner) ancrent l'identité stylistique immédiatement.

### Ce qui a mal fonctionné

- **images.edit (OpenAI)** = inpainting, pas style transfer. Sans mask = ultra-conservateur. Mask full = régénère tout. Aucun juste milieu.
- **SDXL img2img** : prompt_strength trop binaire (0.35 = rien, 0.50 = tout détruit).
- **"TRANSFORM" dans le prompt** = le modèle régénère toute la scène. Toujours utiliser "Edit" (passe 1) ou "Add" (passe 2).
- **Directives de lumière dans les styles** : écrasent systématiquement "preserve existing lighting". NE JAMAIS inclure de directive lumière dans les stylePrompts.
- **Mentionner "window/curtains"** même en négatif : AMORCE le modèle à les générer. NE JAMAIS mentionner d'éléments architecturaux qu'on ne veut pas voir.
- **"pixel-identical"** : promesse impossible — ajouter un canapé MODIFIE les pixels du mur (ombre portée). Utiliser "visually identical".

### Patterns récurrents

- **Le lampadaire arc noir** et le **pothos** sont des "marqueurs IA" génériques. Chaque style doit avoir ses propres luminaires et plantes.
- **Les modèles IA composent comme des photographes** : sujet au premier plan, arrière-plan vide. Il faut explicitement demander la distribution en profondeur.
- **Plus un style est éloigné de l'input, plus le modèle régénère** au lieu d'éditer. Limiter la passe 1 à des changements de FINITION.
- **Les dimensions de silhouette mobilier (cm)** améliorent la cohérence d'échelle.
- **Les directives conditionnelles** ("if ceiling > 3m", "if room is deep") sont NEUTRES sur les cas standard.

---

## Règles techniques consolidées

1. **Object Storage** : toujours read-after-write, jamais fire-and-forget pour les sauvegardes critiques
2. **Migrations DB** : toujours ALTER TABLE IF NOT EXISTS ou DO/EXCEPTION, jamais DROP+CREATE
3. **Focus** : toujours focus-visible:ring, jamais focus:ring
4. **Texte** : minimum text-xs (12px), jamais text-[10px]
5. **Tokens Tailwind** : toujours text-foreground, jamais text-[var(--foreground)]
6. **Prompt version** : incrémenter PROMPT_VERSION dans route.ts à chaque modification de prompt
7. **Touch targets** : minimum 44px (w-11 h-11 ou py-3 sur boutons)
8. **Middleware** : protéger les routes sensibles côté serveur (JWT), pas seulement côté client
9. **Images** : `/api/logs/image?path=` accepte les deux params (?path= et ?file=)
10. **Itérations IA** : adjust = image meublée, restyle = image vide. Classifier le commentaire avant.
