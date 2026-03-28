# Audit Pages Connectées — Versiroom

## Synthèse

| Page | P0 | P1 | P2 |
|---|---|---|---|
| `/ma-galerie` | 1 | 3 | 3 |
| `/mes-biens` | 0 | 2 | 3 |
| `/mes-biens/[id]` | 1 | 4 | 4 |
| `/mes-dossiers` | 1 | 2 | 2 |
| `/compte` | 0 | 3 | 3 |

---

## `/ma-galerie` — findings

### P0

| # | Critère | Problème | Code exact | Correction |
|---|---|---|---|---|
| P0-1 | Accents FR dans JSX | `&#233;` `&#232;` `&#224;` encodés en entités HTML dans des strings JS — violation règle globale | `"g&#233;n&#233;r&#233;e"` (l.287), `"Non class&#233;e"` (l.389), `"G&#233;n&#233;rer ma premi&#232;re photo"` (l.341), `"Associ&#233;e &#224;"` (l.507), etc. | Remplacer par les vrais caractères UTF-8 : `"générée"`, `"Non classée"`, `"Associée à"` |

### P1

| # | Critère | Problème | Code exact | Correction |
|---|---|---|---|---|
| P1-1 | Touch target 44px — bouton "Associer" | `px-2 py-1` sur mobile = ~28px de hauteur. Visible en permanence mobile mais trop petit | `className="... bg-background/90 text-foreground text-xs px-2 py-1 rounded-lg"` (l.400) | Passer à `px-3 py-2.5 min-h-[44px]` |
| P1-2 | État vide filtré non distinct | Si les filtres produisent 0 résultat, le même état vide générique s'affiche ("Aucune photo pour le moment.") sans indiquer que c'est dû au filtre | L.335–344 : aucune distinction entre "galerie vide" et "filtre sans résultat" | Ajouter : `{filterStyle || filterRoomType || filterAssociated ? "Aucune photo ne correspond à ces filtres." : "Aucune photo pour le moment."}` + bouton "Effacer les filtres" |
| P1-3 | Aria-label manquant sur carte photo | `.group.relative` cliquable (l.348–424) n'a ni `role="button"` ni `aria-label` — navigation clavier impossible | `<div className="group relative ... cursor-pointer" onClick={() => setSelectedPhoto(photo)}>` (l.349) | Remplacer par `<button>` ou ajouter `role="button" tabIndex={0} aria-label={...} onKeyDown={e => e.key==='Enter' && setSelectedPhoto(photo)}` |

### P2

| # | Critère | Problème | Code exact | Correction |
|---|---|---|---|---|
| P2-1 | `aria-label` absent sur modal | Le dialog a `role="dialog"` et `aria-modal="true"` mais pas `aria-labelledby` | L.439–441 | Ajouter `aria-labelledby="modal-title"` + `id="modal-title"` sur le h2 (l.445) |
| P2-2 | `room_type` brut affiché | Dans le modal détail, `room_type` est affiché tel quel (`living_room`, `bedroom`...) sans label lisible | `<span className="bg-foreground/5 px-2 py-1 rounded-lg">{selectedPhoto.room_type}</span>` (l.494) | Utiliser un dictionnaire `ROOM_LABELS` ou importer depuis `lib/constants` |
| P2-3 | Pas de focus visible sur la photo-card `<div>` | Le `cursor-pointer` sur un `<div>` non-focusable exclut la navigation clavier (redondant avec P1-3 mais distinct : le `focus-visible:ring` ne s'applique pas aux divs) | L.349 | Idem P1-3 : passer en `<button>` pour bénéficier du focus natif |

---

## `/mes-biens` — findings

### P0

Aucun P0.

### P1

| # | Critère | Problème | Code exact | Correction |
|---|---|---|---|---|
| P1-1 | Touch target 44px — bouton "Annuler" du formulaire | `px-4 py-2` = ~32px hauteur. Cible trop petite sur mobile | `className="text-xs text-muted font-light px-4 py-2 rounded-full hover:text-foreground"` (l.322) | Ajouter `min-h-[44px]` ou `py-3` |
| P1-2 | Accents FR encodés dans les strings | `&#233;` `&#178;` `&#232;` utilisés dans des textes JS/JSX — violation règle globale | `"enregistr&#233;"` (l.207), `"S&#233;lectionner"` (l.259), `"Surface (m&#178;)"` (l.267), `"Nombre de pi&#232;ces"` (l.279), `"Prix de vente (&#8364;)"` (l.289), `"m&#178;"` (l.370), `"pi&#232;ces"` (l.376), `"&#8364;/m&#178;"` (l.387) | Remplacer par vrais caractères UTF-8 |

### P2

| # | Critère | Problème | Code exact | Correction |
|---|---|---|---|---|
| P2-1 | État loading authentification vs données fusionné | `authStatus === "loading" \|\| isLoading` dans le même return (l.151) : pas de distinction entre "auth en cours" (pas de nav) et "données en cours" (nav disponible) — incohérent avec `/ma-galerie` qui les distingue | L.151 | Séparer en deux états : auth loading sans nav, data loading avec nav complet (cohérence inter-pages) |
| P2-2 | Pas de `focus-visible` sur le bouton "Ajouter mon premier bien" (empty state) | `className="inline-block mt-4 text-xs bg-foreground text-background px-4 py-2 rounded-full ..."` (l.337) — manque `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2` | L.337 | Ajouter les classes focus-visible |
| P2-3 | Pas d'état erreur sur fetchProperties | Si l'API `/api/properties` échoue, `setIsLoading(false)` est appelé mais aucun message d'erreur n'est affiché — la page affiche l'état vide au lieu d'un message d'erreur | L.60–72 : `catch` ne fait que `console.error` | Ajouter un state `error` et afficher un message actionnable |

---

## `/mes-biens/[id]` — findings

### P0

| # | Critère | Problème | Code exact | Correction |
|---|---|---|---|---|
| P0-1 | `window.confirm()` pour action destructive | La suppression du bien utilise `window.confirm()` — bloqué dans certains contextes (iframes Replit), non stylable, inaccessible aux screen readers | `if (!window.confirm("Supprimer ce bien ?..."))` (l.455) | Remplacer par une modal de confirmation avec focus trap, boutons "Supprimer" / "Annuler", et `role="alertdialog"` |

### P1

| # | Critère | Problème | Code exact | Correction |
|---|---|---|---|---|
| P1-1 | Accents encodés en entités dans strings JS | `\u00e9` `\u2019` `\u00ea` utilisés dans `setToastMsg()` — violation règle globale | `"Description g\u00e9n\u00e9r\u00e9e avec succ\u00e8s."` (l.310), `"La description n\u2019a pas pu \u00eatre g\u00e9n\u00e9r\u00e9e."` (l.313), etc. | Remplacer par vrais caractères UTF-8 : `"Description générée avec succès."` etc. |
| P1-2 | Touch targets < 44px sur boutons inline description | `px-3 py-1.5` = ~30px hauteur | `"text-xs bg-sage text-white px-3 py-1.5 rounded-full"` (l.629, 675) et `"text-xs text-muted font-light px-3 py-1.5 rounded-full"` (l.634) | Passer à `py-2.5 min-h-[44px]` |
| P1-3 | `focus-visible` absent sur boutons "Modifier" / "Regénérer" | Les boutons textuels (l.651, 662) n'ont pas de `focus-visible:ring` — navigation clavier sans retour visuel | `className="text-xs text-sage font-light mt-1 hover:underline"` (l.655) | Ajouter `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 rounded` |
| P1-4 | Pas de lien retour "Mes biens" visible au mobile | Le breadcrumb (l.573–579) est en `text-xs` peu visible et n'a pas de touch target 44px — le seul retour est la nav header | `<a href="/mes-biens" className="text-xs text-muted font-light hover:text-foreground"` (l.574) | Ajouter un bouton retour explicite `← Mes biens` avec `min-h-[44px]` en mobile, ou agrandir le target du breadcrumb |

### P2

| # | Critère | Problème | Code exact | Correction |
|---|---|---|---|---|
| P2-1 | `_blank` sans `rel="noreferrer"` sur window.open | `window.open(\`/dossier/...\`, '_blank')` (l.421) et `window.open(\`/annonce/...\`, '_blank')` (l.483) — sécurité et performance (pas de `noopener noreferrer`) | L.421, L.483 | `window.open(..., '_blank', 'noopener,noreferrer')` |
| P2-2 | État "Bien non trouvé" sans lien retour accessible | L'état `error` (l.524–535) a un lien retour mais le composant global affiche un spinner `animate-pulse` identique à l'état loading (l.537–543) — impossible de distinguer "en cours" de "introuvable" | L.537–543 | L'état `!property` après fin du loading devrait rediriger vers `/mes-biens` ou afficher une page 404 explicite |
| P2-3 | `setTéléphone` — nom de state avec accent | La variable `setTéléphone` (l.38) contient un caractère accentué — non bloquant mais anti-convention JS et source de bugs potentiels dans certains bundlers | `const [telephone, setTéléphone] = useState("")` (l.38 de `compte/page.tsx`) | Renommer en `setTelephone` |
| P2-4 | `focus-visible` absent sur checkboxes compInfo | Les checkboxes Ascenseur, Parking, Cave (l.779, 795, 806) utilisent `focus:ring-sage/50` au lieu de `focus-visible:ring-sage/50` — ring visible même au clic souris | `className="w-4 h-4 rounded border-foreground/20 text-sage focus:ring-sage/50"` | Remplacer `focus:ring` par `focus-visible:ring` |

---

## `/mes-dossiers` — findings

### P0

| # | Critère | Problème | Code exact | Correction |
|---|---|---|---|---|
| P0-1 | Redirection `window.location.href = "/"` côté client sans guard SSR | `if (!session)` déclenche une redirection JS côté client (l.104–112). Sur un réseau lent, l'utilisateur voit brièvement "Redirection en cours..." sans navigation React — perte du contexte de scroll et de l'historique browser | L.104–112 | Remplacer par `redirect("/")` côté serveur ou `useRouter().push("/")` dans un `useEffect` — ne jamais forcer `window.location.href` dans le JSX synchrone |

### P1

| # | Critère | Problème | Code exact | Correction |
|---|---|---|---|---|
| P1-1 | Touch target 44px — bouton "Copier le lien" | `px-1.5 py-1` = ~24px hauteur. Trop petit sur mobile dans un contexte de liste dense | `className="text-[11px] text-muted ... px-1.5 py-1"` (l.232) | `px-3 py-2.5 min-h-[44px]` ou positionner hors du flux de la card |
| P1-2 | Empty state ne crée pas réellement un dossier | Le CTA "Créer un dossier" (l.168) renvoie vers `/` (page d'accueil) sans ancre vers la section de génération — Thomas doit retrouver l'outil lui-même | `<a href="/">Créer un dossier</a>` (l.169) | Changer en `href="/#outil"` pour scroller directement à l'outil |

### P2

| # | Critère | Problème | Code exact | Correction |
|---|---|---|---|---|
| P2-1 | Pas d'état erreur affiché si `navigator.clipboard` échoue | Le `.then()` sur `navigator.clipboard.writeText` (l.227) ne gère pas le `.catch()` — si les permissions clipboard sont refusées, l'UI reste sur "Copier le lien" sans feedback | L.227–230 | Ajouter `.catch(() => setCopiedUuid("error"))` et afficher "Échec de la copie" |
| P2-2 | `focus-visible` absent sur la card `<a>` dossier | `className="block p-5 rounded-2xl border ... hover:border-foreground/10"` (l.184) — manque `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50` | L.184 | Ajouter les classes focus-visible sur la card |

---

## `/compte` — findings

### P0

Aucun P0.

### P1

| # | Critère | Problème | Code exact | Correction |
|---|---|---|---|---|
| P1-1 | Variable state avec accent | `const [telephone, setTéléphone] = useState("")` (l.38) — nom de setter avec caractère accentué, anti-convention JS | L.38 | Renommer `setTéléphone` → `setTelephone` partout |
| P1-2 | `focus-visible` absent sur inputs de couleur hex | Les deux `<input type="text">` pour les codes hex (l.632, 657) n'ont pas de `focus-visible:ring` — seul `focus-visible:border-foreground` est défini, border invisible sur certains thèmes | `className="flex-1 px-3 py-2 border ... focus-visible:border-foreground focus:outline-none"` (l.636, 660) | Ajouter `focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2` |
| P1-3 | Pas de feedback erreur d'upload logo visible durablement | `setSaveMessage` est défini en cas d'erreur upload (l.252) mais `saveMessage` n'est pas auto-dismissed avec timeout — l'erreur reste affichée indéfiniment jusqu'à la prochaine action | L.246–262 : aucun `setTimeout(() => setSaveMessage(null), ...)` sur le path erreur logo | Ajouter un `setTimeout(() => setSaveMessage(null), 5000)` après les `setSaveMessage({ type: "error", ... })` |

### P2

| # | Critère | Problème | Code exact | Correction |
|---|---|---|---|---|
| P2-1 | Pricing v3 non référencé | La page `/compte` ne mentionne pas les plans ni les limites associées (ex : branding disponible en Pro/Business). Thomas ne sait pas à quel plan correspond cette feature | L.367–374 : checkbox merchant sans mention du plan requis | Ajouter une note inline sous la checkbox : `"Disponible à partir du plan Pro (29€/mois)"` avec lien vers `/pricing` |
| P2-2 | `focus-visible` absent sur input `type="color"` | Les `<input type="color">` (l.621, 647) n'ont ni `focus-visible:ring` ni `aria-label` distinct de leur `<label>` parent | L.621 : `className="w-10 h-10 rounded-lg border ... cursor-pointer p-0.5"` | Ajouter `focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2` + `aria-label="Sélecteur de couleur principale"` |
| P2-3 | CTA "Voir mes biens" conditionnel mal placé | Le lien "Voir mes biens" (l.745–751) s'affiche uniquement si `saveMessage?.type === "success"` — il disparaît au bout de 3s avec le message. Après 3s, aucun CTA de navigation vers la prochaine étape | L.744–751 | Afficher ce lien en permanence sous le bouton Enregistrer (pas conditionné au message de succès), car c'est la prochaine étape logique du parcours Thomas |
