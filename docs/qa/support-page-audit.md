# Audit QA — Page /support

Date : 2026-04-05 | Fichiers : `app/support/page.tsx`, `app/api/support/route.ts`, `components/AuthButton.tsx`

| # | Scenario | Verdict | Ref |
|---|---|---|---|
| 1 | Non connecte → redirect /login?callbackUrl=/support | **PASS** | page.tsx:79-82 |
| 2 | Connecte → page affichee, email pre-rempli readonly | **PASS** | page.tsx:84,224-231 |
| 3 | Submit sans categorie → erreur "Selectionnez une categorie" | **PASS** | page.tsx:138-139 (client) + route.ts:99-103 (serveur) |
| 4 | Message < 10 chars → erreur "Message trop court" | **PASS** | page.tsx:142-143 (client) + route.ts:107-111 (serveur) |
| 5 | Message valide → loading spinner → toast success avec ticketId | **PASS** | page.tsx:150-198, route.ts:239 |
| 6 | Screenshot > 5 Mo → erreur "Fichier trop lourd" | **PASS** | page.tsx:109-117 (client) + route.ts:134-139 (serveur) |
| 7 | Screenshot PDF → erreur "Format non supporte" | **PASS** | page.tsx:98-106 (accept + type check) + route.ts:124-131 (base64 prefix check) |
| 8 | Double-clic submit → bloque par guard `if (sending) return` | **PASS** | page.tsx:152 + disabled={sending} ligne 410 |
| 9 | Rate limit 5 req/h → 429 au 6eme | **PASS** | route.ts:9-10,21-22,84-88 |
| 10 | Sans session → 401 "Non authentifie" | **PASS** | route.ts:71-77 |
| 11 | Categorie invalide → 400 "Categorie invalide" | **PASS** | route.ts:99-103 |
| 12 | ticketId retourne dans la reponse JSON | **PASS** | route.ts:239 (fallback Date.now() si DB fail) |
| 13 | Toast auto-dismiss 5s | **PASS** | page.tsx:56 `setTimeout(dismissToast, 5000)` |
| 14 | Toast bottom-20 mobile (pas chevauchement iOS) | **PASS** | page.tsx:445 `bottom-20 sm:bottom-6` |
| 15 | Touch targets >= 44px | **PASS** | submit min-h-[44px] L411, remove-screenshot w-11 h-11 (44px) L347, upload zone min-h-[56px] L368 |
| 16 | Wording "Probleme de generation" (pas "Bug") | **PASS** | page.tsx:15 + route.ts:60 |
| 17 | Lien "Support" visible dans AuthButton dropdown | **PASS** | AuthButton.tsx:246-255 |

**Resultat : 17/17 PASS** — aucun bug detecte. Double validation client+serveur sur tous les inputs. Rate limit, auth, guard double-clic operationnels.

**Points d'attention (non bloquants) :**
- Le rate limit est in-memory (reset au redeploy Replit) — acceptable pour le volume actuel.
- Le screenshot n'est pas stocke en Object Storage, juste marque "attached" en DB (route.ts:225) — si Resend echoue, la capture est perdue. Escalade recommandee vers @fullstack si retention screenshots necessaire.
- L'email HTML injecte `message` sans sanitisation XSS (route.ts:172 `message.replace(/\n/g, "<br>")`) — risque faible car seul destinataire = contact@versimo.fr, mais a corriger si l'email est forward a des tiers.
