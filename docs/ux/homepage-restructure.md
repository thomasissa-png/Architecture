# Wireframe — Restructuration Homepage + Pages Personas
> Agent : @ux — 2026-03-27
> Contexte lus : project-context.md, app/page.tsx (code actuel), docs/copy/brand-voice.md
> Recherche concurrents : Gepetto (Bordeaux, qualité, 1-clic, 30+ styles), Renovate Club (9,99€/mois illimité)
> Demande fondateur : suppression galerie métier, déplacement Mode Pro, renommage, 3 pages personas

---

## Frictions UX identifiées et résolues

### Friction 1 — Répétition sans valeur ajoutée : galerie "par métier" après les pills du hero

**Problème actuel.** La section "Avant / Après par métier" (lignes 889-976 de page.tsx) contient 3 cartes (Claire/Thomas/Léa) qui redoublent exactement les pills du hero. L'utilisateur lit "Pour les architectes d'intérieur" dans le hero, puis scroll de 20vh pour relire "Claire, architecte d'intérieur" avec la même citation. Aucune information nouvelle. La section occupe ~350px sur desktop, ~520px sur mobile pour zéro gain de compréhension.

**Signal de friction.** Dans les patterns observés chez Gepetto et les benchmarks SaaS 2026, la duplication d'un message sur la même page est systématiquement corrélée à un taux de scroll-through plus bas : l'utilisateur perçoit qu'il n'y a "rien de nouveau" et quitte ou saute directement à l'outil.

**Résolution.** Suppression complète. Les 3 personas ont leurs pages dédiées (/architecte, /marchand, /particulier) où leur cas d'usage est développé avec profondeur. Les pills du hero deviennent des liens directs vers ces pages.

---

### Friction 2 — Mode Pro invisible au moment décisif

**Problème actuel.** L'encart "Mode Marchand" est positionné AVANT l'outil (section "Teaser Mode Marchand", lignes 978-1017), à un moment où l'utilisateur n'a pas encore testé le produit. Il découvre une promesse de fonctionnalité Pro avant même d'avoir compris la valeur de base. Ce placement crée une friction cognitive : "dois-je d'abord payer ?" alors qu'on veut qu'il essaie gratuitement d'abord.

**Résolution.** L'encart Mode Pro est déplacé immédiatement après le CTA "Essayer gratuitement, 3 générations offertes sans carte bancaire". L'ordre logique devient : (1) essaie gratuitement, (2) voici ce que débloque le Pro. C'est le moment où l'utilisateur est le plus réceptif — il vient d'être convaincu d'essayer, il est chaud.

---

### Friction 3 — Nomenclature "Mode Marchand" trop restrictive

**Problème actuel.** "Mode Marchand" signale que la feature est réservée aux marchands de biens. Or Claire (architecte) et des agences immobilières ont exactement les mêmes besoins (dossiers PDF, liens partageables). Le nom ferme la porte à 60% des clients potentiels.

**Résolution.** Renommage en "Mode Pro" — inclusif, lisible pour tous les professionnels. "Dossiers PDF avant/après" renommé en "Dossiers de pré-commercialisation" pour ancrer la valeur métier.

---

### Friction 4 — Thomas ne voit pas le ROI immédiatement

**Problème actuel.** Le pricing (29€/mois) apparaît en bas de page, dans une section distincte. Thomas, marchand de biens, arrive sur la page avec une question précise : "combien ça coûte vs mon prestataire à 200-500€/planche ?". Il doit scroller ~800px pour trouver la réponse. Entre-temps, il est susceptible de partir.

**Résolution.** L'encart Mode Pro repositionné après le CTA gratuit contient explicitement : "29€/mois · 50 crédits · 0 prestataire". La comparaison "29€ vs 200-500€ par planche" est inscrite dans le copy de l'encart Mode Pro, pas seulement dans la page pricing.

---

### Friction 5 — Léa ne comprend pas que c'est gratuit pour commencer

**Problème actuel.** Le CTA actuel dit "Essayer gratuitement" mais la mention "3 générations offertes · Sans carte bancaire" est en petits caractères sous le bouton. Sur mobile, cette ligne est souvent tronquée. Léa, digital native, a un réflexe de méfiance sur "gratuit" (= gratuit avec CB, puis facturation automatique).

**Résolution.** La mention "Sans carte bancaire" est hissée au même niveau de lisibilité que le CTA — non plus en `text-xs muted` mais en corps de texte normal. Le sous-titre de l'outil intègre "3 générations gratuites, sans créer de compte" pour répéter la garantie juste avant qu'elle engage l'action.

---

### Friction 6 — Blocs "Architectes / Marchands / Particuliers" redondants sous l'outil

**Problème actuel.** La section USE_CASES (3 cartes sous le hero, lignes 878-887) est distincte de la galerie par métier mais porte le même message une troisième fois. L'architecture actuelle répète le même signal d'audience 3 fois en 500px de scroll.

**Résolution.** Les 3 cartes USE_CASES sont remplacées par 3 liens texte discrets vers les pages personas (/architecte, /marchand, /particulier), formulés comme des invitations : "Vous êtes architecte ? Voir les cas d'usage" — pas de cartes, pas de répétition.

---

## Homepage — Nouvelle structure

---

## Page /architecte — Wireframe

---

## Page /marchand — Wireframe

---

## Page /particulier — Wireframe

---

## Tests UX — Homepage restructurée

---

## Agents spécialisés recommandés

---

## Handoff
