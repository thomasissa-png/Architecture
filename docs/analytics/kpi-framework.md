# KPI Framework — Versimo
> Produit par @data-analyst — 2026-03-24
> Source : project-context.md + docs/strategy/personas.md + docs/product/functional-specs.md
> Destinataire implémentation : @infrastructure (tracking) + @fullstack (events)

---

## Section 1 — Validation des personas

Avant d'investir en acquisition, vérifier que chaque persona correspond à un segment réel. Ces métriques sont à mesurer dans les 60 premiers jours post-lancement.

### Claire — Architecte d'intérieur

| Métrique | Comment mesurer | Seuil de validation | Coût/effort |
|---|---|---|---|
| **Taux d'usage sur chantier** (iPad/mobile en dehors du bureau) | `device_type` dans l'event `generation_started` — % iPad + mobile dans les heures 8h-18h jours ouvrés | >30% des générations Claire sur mobile/iPad | Faible — propriété ajoutée à l'event existant |
| **Taux de partage client** (envoie le visuel à un tiers) | Event `result_shared` avec `method: whatsapp\|copy\|native` par segment utilisateur pro | >40% des sessions Claire se terminent par un partage | Faible — event déjà partiellement implémenté (ImageComparator.tsx) |

### Thomas — Marchand de biens

| Métrique | Comment mesurer | Seuil de validation | Coût/effort |
|---|---|---|---|
| **Taux batch** (plusieurs photos du même bien en une session) | Ratio `photos_uploaded / sessions` — moyenne par utilisateur | Moyenne >3 photos/session pour Thomas | Faible — propriété `photos_count` sur l'event `generation_started` |
| **Rétention inter-opération** (revient pour un nouveau bien) | Cohorte J+30 et J+60 sur utilisateurs ayant acheté un package | >50% reviennent dans les 60 jours suivant le premier achat | Moyen — nécessite auth + email |

### Léa — Acheteuse particulière

| Métrique | Comment mesurer | Seuil de validation | Coût/effort |
|---|---|---|---|
| **Taux de partage social** (iOS native share, Instagram) | Event `result_shared` avec `method: native` sur mobile | >25% des sessions Léa avec au moins 1 partage natif | Faible — event existant, filtrer par device mobile |
| **Nombre de styles testés par session** | Ratio `style_selected events / sessions` | Moyenne >2 styles testés par session en première visite | Faible — event `style_selected` à implémenter |

---

## Section 2 — Arbre de décomposition du KPI North Star

**North Star : 3 000 EUR/mois de marge nette**

```
MARGE NETTE = REVENUS - COÛTS
│
├── REVENUS = nb_packages_vendus × prix_moyen_package
│   │
│   ├── nb_packages_vendus = visiteurs × taux_conversion_payant
│   │   ├── visiteurs (trafic entrant — SEO, partages, bouche-à-oreille)
│   │   ├── taux_activation (visiteur → 1ère génération gratuite)
│   │   └── taux_conversion_payant (utilisateur gratuit → acheteur)
│   │
│   └── prix_moyen_package
│       ├── Découverte GRATUIT (3 crédits — test qualité)
│       ├── Starter 9,90€ one-shot (15 crédits — Léa usage ponctuel)
│       └── Pro 29€/mois abonnement (50 crédits/mois — Thomas, Claire récurrents)
│
└── COÛTS = coût_IA + coût_infra + coût_acquisition
    ├── coût_IA : ~0,15-0,30€/génération (2 passes OpenAI gpt-4.1)
    │   [HYPOTHÈSE : à calibrer avec les données de production réelles]
    ├── coût_infra : Replit + PostgreSQL + Object Storage (fixe faible)
    └── coût_acquisition : à définir par canal (@growth)
```

### Cibles par niveau pour atteindre 3 000 EUR/mois

[HYPOTHÈSE : les taux ci-dessous sont des hypothèses de travail à valider sur données réelles]

| Métrique | Cible M+3 | Cible M+6 | Levier principal |
|---|---|---|---|
| Visiteurs uniques/mois | 3 000 | 8 000 | SEO + partages Léa + LinkedIn Claire |
| Taux activation (visite → génération) | 25% | 35% | UX onboarding, friction upload |
| Taux conversion gratuit → payant | 8% | 12% | Gating crédits, qualité résultat |
| Packages vendus/mois | [HYPOTHÈSE] 60-80 | 150-200 | Rétention Thomas + réachat Claire |
| Panier moyen | [HYPOTHÈSE] 18-22€ | 22-28€ | Upsell itérations, pack Business |
| Coût IA estimé/mois | [HYPOTHÈSE] 300-600€ | 800-1 200€ | Volume générations |
| **Marge nette estimée** | **[HYPOTHÈSE] 600-1 200€** | **3 000€+** | Combinaison des leviers |

---

## Section 3 — Métriques produit MVP par phase AARRR

### Acquisition
| Métrique | Définition | Cible [HYPOTHÈSE] | Source |
|---|---|---|---|
| Trafic organique | Sessions depuis recherche Google | +20%/mois M+1 à M+6 | GA4 / Plausible |
| Trafic partage | Sessions depuis whatsapp/native share | >15% du trafic total | UTM sur liens partagés |
| Taux rebond landing | Quittent sans action | <60% | Plausible / GA4 |

### Activation (première génération réussie)
| Métrique | Définition | Cible [HYPOTHÈSE] | Persona prioritaire |
|---|---|---|---|
| Taux upload J0 | Visiteurs ayant uploadé ≥1 photo | >40% des inscrits | Tous |
| Taux génération complète J0 | Visiteurs ayant reçu un résultat | >30% des visiteurs | Tous |
| Délai activation | Temps entre 1ère visite et 1ère génération | <5 min médiane | Léa (mobile) |
| Taux retry | Utilisateurs ayant relancé après erreur | <20% (erreur) | Thomas (volume) |

### Rétention
| Métrique | Définition | Cible [HYPOTHÈSE] | Persona prioritaire |
|---|---|---|---|
| Rétention J7 | Reviennent dans les 7 jours | >25% | Claire (projet en cours) |
| Rétention J30 | Reviennent dans les 30 jours | >15% | Claire + Thomas |
| Sessions/utilisateur actif | Fréquence d'usage mensuelle | Claire : >4/mois — Thomas : >2/opération | Claire > Thomas |
| Taux utilisation itération (F1) | % générations suivies d'une itération | >20% des générations payantes | Claire |

### Revenu
| Métrique | Définition | Cible [HYPOTHÈSE] | Note |
|---|---|---|---|
| Taux conversion free→paid | Utilisateurs gratuits passant au payant | 8-12% | [HYPOTHÈSE secteur SaaS/crédit] |
| Panier moyen | Revenu moyen par transaction | 18-22€ | Pondéré 4 tiers |
| LTV Claire | Valeur sur 12 mois | [HYPOTHÈSE] 60-120€ | Réachat régulier |
| LTV Thomas | Valeur sur 12 mois | [HYPOTHÈSE] 60-200€ | Volume par opération |
| LTV Léa | Valeur sur 12 mois | [HYPOTHÈSE] 5-15€ | Usage unique |

### Référral
| Métrique | Définition | Cible [HYPOTHÈSE] |
|---|---|---|
| Taux partage résultat | Sessions avec ≥1 action de partage | >20% des générations complètes |
| Trafic referred | Sessions depuis un lien partagé | >10% du trafic total en M+3 |

---

## Section 4 — Tracking plan (events à implémenter)

### Naming convention
- snake_case, verbe_objet
- Préfixe par domaine si nécessaire (pas de préfixe pour les events core)
- Propriétés : snake_case, types typés (string, number, boolean)

### Events core (P0 — implémenter avant lancement)

| Event | Trigger | Propriétés obligatoires | Propriétés optionnelles |
|---|---|---|---|
| `page_viewed` | Chargement de toute page | `page_path: string`, `referrer: string`, `device_type: mobile\|tablet\|desktop` | `utm_source`, `utm_medium`, `utm_campaign` |
| `photo_uploaded` | Upload réussi d'une photo dans UploadZone | `photo_count: number` (total dans la session), `file_type: string`, `file_size_kb: number` | `is_heic: boolean` |
| `style_selected` | Clic sur un style dans StylePicker | `style_id: string`, `style_name: string`, `is_custom: boolean` | `room_type_id: string` |
| `generation_started` | Appel POST /api/generate déclenché | `style_id: string`, `photo_count: number`, `room_type_id: string\|null`, `is_outdoor: boolean`, `is_iteration: boolean` | `iteration_number: number` |
| `generation_completed` | Résultat reçu côté client | `style_id: string`, `duration_ms: number`, `model_used: openai\|flux`, `pass1_duration_ms: number`, `pass2_duration_ms: number`, `success: boolean` | `error_code: string` |
| `generation_failed` | Erreur côté client ou serveur | `style_id: string`, `error_code: string`, `error_message: string` | `model_used: string` |
| `result_downloaded` | Clic sur "Télécharger HD" | `style_id: string`, `photo_index: number` | `is_batch: boolean` |
| `result_shared` | Action de partage effectuée | `method: whatsapp\|copy\|native\|download_all`, `style_id: string` | `photo_count: number` |
| `package_viewed` | Arrivée sur la section pricing / modal achat | `source: landing\|upsell_modal\|credits_empty` | — |
| `package_purchased` | Achat confirmé (post-Stripe webhook) | `package_id: string`, `package_price_eur: number`, `credits_included: number`, `iterations_included: number` | `coupon_code: string` |

### Events secondaires (P1 — implémenter post-lancement)

| Event | Trigger | Propriétés obligatoires |
|---|---|---|
| `iteration_started` | Ouverture de RefineModal et soumission | `iteration_number: number`, `style_id: string`, `comment_length: number` |
| `iteration_completed` | Résultat itération reçu | `iteration_number: number`, `duration_ms: number`, `success: boolean` |
| `upsell_shown` | Modal upsell affiché (crédits épuisés / itérations max) | `trigger: credits_empty\|max_iterations\|gate_feature`, `package_suggested: string` |
| `upsell_converted` | Achat depuis un upsell | `trigger: string`, `package_id: string` |
| `version_selected` | Clic sur une version dans VersionSelector | `version_number: number`, `style_id: string` |
| `room_type_selected` | Sélection d'un type de pièce dans RoomTypePicker | `room_type_id: string`, `room_type_name: string`, `is_outdoor: boolean` |
| `retry_clicked` | Clic sur "Réessayer" après échec | `style_id: string`, `error_code: string` |

### Propriétés de session à passer sur tous les events (context)

```typescript
// À enrichir côté client avant envoi
{
  session_id: string,          // uuid généré à la visite, stocké sessionStorage
  user_id: string | null,      // null jusqu'à implémentation auth
  device_type: 'mobile' | 'tablet' | 'desktop',
  timestamp_utc: string        // ISO 8601
}
```

### Stack analytics recommandée

Compte tenu du budget "raisonnable et ROI positif" et du trafic attendu (<10 000 sessions/mois en phase alpha) :

| Outil | Usage | Coût | Recommandation |
|---|---|---|---|
| **Plausible** (self-hosted ou cloud 9€/mois) | Trafic, pages, referrers — privacy-first, conforme RGPD sans bandeau cookie | 9€/mois cloud | **Retenu pour analytics trafic** |
| **PostHog** (cloud free jusqu'à 1M events/mois) | Events custom, funnels, cohortes, session replay | Gratuit jusqu'à 1M events | **Retenu pour product analytics** |
| **PostgreSQL existant** | Métriques IA (coût, latence, modèle, succès) — déjà implémenté | 0 (existant) | **Conserver — source vérité IA** |

Ne pas implémenter GA4 : sur-dimensionné pour le trafic actuel, configuration complexe, biais cookies.

---

## Hypothèses à valider

| Hypothèse | Paramètre | À valider via |
|---|---|---|
| Coût IA par génération | 0,15-0,30€ | Monitoring réel OpenAI billing |
| Taux conversion free→paid | 8-12% | 30 premiers utilisateurs payants |
| Panier moyen | 18-22€ | 50 premières transactions |
| LTV par persona | Voir section 3 | Cohortes à 90 jours |
| Taux activation J0 | 30-40% | 500 premières visites |

---

**Handoff → @infrastructure**
- Fichiers produits : `docs/analytics/kpi-framework.md`
- Décisions prises :
  - Stack analytics retenue : Plausible (trafic) + PostHog (events product) + PostgreSQL existant (métriques IA)
  - North Star décomposé en arbre actionnable : visiteurs → activation → conversion → panier moyen → marge
  - 10 events P0 définis avec propriétés typées et naming convention snake_case
  - 7 events P1 définis pour post-lancement
- Points d'attention :
  - Les cibles chiffrées sont des `[HYPOTHÈSE]` — aucune donnée de production disponible au moment de la rédaction
  - `package_purchased` doit être déclenché côté serveur (Stripe webhook), pas côté client, pour éviter les doublons
  - `session_id` doit être généré en `sessionStorage` (pas `localStorage`) — conformité RGPD : pas de persistance cross-sessions sans consentement
  - L'event `generation_completed` duplique partiellement les logs PostgreSQL existants — les 2 sources sont complémentaires (PostgreSQL = vérité IA, PostHog = comportement utilisateur)
  - Valider la conformité RGPD de PostHog avec @legal avant activation du session replay (données personnelles potentielles dans les sessions)
