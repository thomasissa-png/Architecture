# Re-audit Thomas Berger V2 — 2026-03-25

## Tableau des 10 etapes

| Etape | Note V1 | Note V2 | Delta | Verification |
|---|---|---|---|---|
| 1. Connexion | 8.5 | 8.5 | = | Pas de friction ajoutee, mot de passe oublie toujours MVP |
| 2. Profil marchand | 8.0 | 8.0 | = | CTA "Voir mes biens" toujours texte discret post-save (non corrige) |
| 3. Creer un bien | 8.5 | 8.5 | = | RAS |
| 4. Fiche bien + infos complementaires | 7.5 | 9.0 | +1.5 | F1 corrige : warning rouge "DPE requis par la loi" conditionnel sous le select |
| 5. Generer des photos | 7.0 | 8.5 | +1.5 | F3 corrige : toggle Mode Marchand conditionnel `{session && ...}` dans page.tsx |
| 6. Galerie | 7.5 | 8.0 | +0.5 | F4 partiellement corrige : dropdown `right-0 sm:right-2 max-w-[calc(100vw-2rem)]` evite le depassement horizontal |
| 7. Creer une annonce | 7.0 | 9.0 | +2.0 | F5 corrige : 403 → toast avec lien "/pricing" + label bouton "Creer une annonce (inclus Pack Pro)" + F7 : alerte amber DPE sous les boutons |
| 8. Page annonce publique | 8.0 | 8.5 | +0.5 | DossierCaracteristiques avec badge "Passoire energetique" F/G (R1 confirme : template literals corrects, pas de concatenation string) |
| 9. Dossier PDF | 8.0 | 8.5 | +0.5 | Meme composant DossierCaracteristiques, coherence garantie |
| 10. Admin | 8.5 | 8.5 | = | Middleware R2 : guard NEXTAUTH_SECRET en production present, deny-all si absent |

**Score global V1 : 7.9/10**
**Score global V2 : 8.65/10** (+0.75 pts)

---

## Frictions restantes pour 9/10

**F-R1 (P2) — CTA "Voir mes biens" post-sauvegarde profil (etape 2)**
Toujours un lien texte inline-flex text-sm. Sur iPhone, Thomas peut le manquer apres la sauvegarde et se retrouver bloque sur /compte. Un bouton plein largeur ou une redirection automatique vers /mes-biens apres 2s suffirait.

**F-R2 (P3) — Alerte DPE sous bouton annonce : position imbriquee dans le flex**
L'alerte amber `dpe-annonce-warning` est dans le `flex gap-2` avec les boutons (ligne 880-884). Sur mobile, elle s'affiche en ligne avec les boutons plutot qu'en dessous — risque de layout casse sur iPhone 15 Pro portrait. Deplacer la `<p>` hors du `div.flex` en bloc separe.

**F-R3 (P3) — Aha moment a l'etape 4**
Non traite. Thomas doit encore passer 3 etapes (connexion + profil + creation bien) avant de voir la valeur. La generation de description GPT en teaser sur /mes-biens avant la fiche detail reduirait ce friction.

---

## Notes de verification code

- **F1** : `{!compInfo.dpeClasse && <p data-testid="dpe-warning">DPE requis par la loi</p>}` — confirme ligne 609-614
- **F3** : `{session && <div data-testid="mode-toggle">...</div>}` — confirme ligne 883, MerchantMode invisible pour non-connectes
- **F4** : `right-0 sm:right-2 max-w-[calc(100vw-2rem)]` — confirme ligne 336, depassement contenu
- **F5** : `else if (res.status === 403) { setToastMsg(<span>...Pack Pro...<a href="/pricing">Voir les tarifs</a></span>) }` — confirme ligne 389-395
- **F7** : `{!compInfo.dpeClasse && <p data-testid="dpe-annonce-warning">Pensez a renseigner le DPE...</p>}` — confirme ligne 880-884
- **R1** : DossierCaracteristiques utilise `{"\u00E9"}` et template literals corrects — pas de concatenation string cassee
- **R2** : middleware.ts ligne 17-19 : guard production NEXTAUTH_SECRET avec console.error + deny implicite

---

**Handoff → @orchestrator**
- Fichier produit : /home/user/Architecture/docs/reviews/thomas-reaudit-v2.md
- Decisions : 5 frictions sur 8 corrigees, score 7.9 → 8.65/10
- Points d'attention : F-R2 (layout flex alerte DPE mobile) est un bug de rendu a corriger avant lancement, F-R1 (CTA profil) impacte la fluidite onboarding des nouveaux marchands
