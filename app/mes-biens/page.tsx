"use client";

/**
 * Mes biens — Liste des biens de l'utilisateur.
 * Accessible aux utilisateurs connectes avec profil marchand.
 * Permet de creer un nouveau bien et naviguer vers sa fiche.
 */

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import ProGate from "@/components/ProGate";
import Header from "@/components/Header";
import { TYPE_LABELS } from "@/lib/constants";

interface Property {
  id: string;
  address_raw: string | null;
  address_normalized: string | null;
  city: string | null;
  postal_code: string | null;
  property_type: string | null;
  surface_m2: number | null;
  room_count: number | null;
  sale_price: number | null;
  dvf_median_price_m2: number | null;
  photo_count?: number;
  dossier_count?: number;
  last_dossier_uuid?: string | null;
  annonce_uuid?: string | null;
  created_at: string;
}

interface AddressSuggestion {
  label: string;
  postcode: string;
  city: string;
  lat: number;
  lon: number;
}


export default function MesBiensPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Create form state
  const [newAddress, setNewAddress] = useState("");
  const [newType, setNewType] = useState("");
  const [newSurface, setNewSurface] = useState("");
  const [newRooms, setNewRooms] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  // Search + sort
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "ville">("recent");

  // Filtered + sorted properties
  const filteredProperties = properties
    .filter(p => !searchQuery ||
      (p.address_normalized || p.address_raw || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.city || "").toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => sortBy === "ville"
      ? (a.city || "").localeCompare(b.city || "")
      : 0
    );

  // Address autocomplete
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchProperties = useCallback(async (archived = false) => {
    try {
      const params = archived ? "?archived=true" : "";
      const res = await fetch(`/api/properties${params}`);
      if (res.ok) {
        const data = await res.json();
        setProperties(data.properties || []);
      }
    } catch (err) {
      console.error("Erreur chargement biens:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      fetchProperties(showArchived);
    }
  }, [session, fetchProperties, showArchived]);

  // Address autocomplete with debounce
  const handleAddressInput = (value: string) => {
    setNewAddress(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/merchant/enrich-property?q=${encodeURIComponent(value)}`
        );
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error("Erreur autocompletion adresse:", err);
      }
    }, 300);
  };

  const selectSuggestion = (s: AddressSuggestion) => {
    setNewAddress(s.label);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleCreate = async () => {
    if (!newAddress.trim()) {
      setCreateError("L'adresse est requise.");
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressRaw: newAddress.trim(),
          propertyType: newType || undefined,
          surfaceM2: newSurface ? Number(newSurface) : undefined,
          roomCount: newRooms ? Number(newRooms) : undefined,
          salePrice: newPrice ? Number(newPrice) : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setCreateError(data.error || "Erreur lors de la création.");
        return;
      }

      const data = await res.json();
      // Redirect to the new property page
      router.push(`/mes-biens/${data.property.id}`);
    } catch {
      setCreateError("Erreur réseau.");
    } finally {
      setIsCreating(false);
    }
  };

  if (authStatus === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header activePage="mes-biens" />
        <main className="pt-24 pb-16 px-5 sm:px-8 max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="h-7 w-36 bg-foreground/5 rounded-lg animate-pulse mb-2" />
            <div className="h-4 w-28 bg-foreground/5 rounded-lg animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 bg-foreground/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <ProGate featureName="Mes biens">
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header activePage="mes-biens" />

      <main className="pt-24 pb-16 px-5 sm:px-8 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Mes biens</h1>
            <p className="text-sm text-muted font-light mt-1">
              {properties.length} bien{properties.length !== 1 ? "s" : ""} {showArchived ? "archivé" : "enregistré"}{properties.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="text-xs text-muted hover:text-foreground font-light transition-colors px-3 py-1.5 rounded-full border border-foreground/10 hover:border-foreground/20 min-h-[36px]"
            >
              {showArchived ? "Masquer archivés" : "Voir archivés"}
            </button>
            {!showArchived && <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="text-xs bg-foreground text-background px-4 py-2 min-h-[44px] flex items-center rounded-full font-medium hover:bg-foreground/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
          >
            + Nouveau bien
          </button>}
          </div>
        </div>

        {/* Create form */}
        {showCreateForm && (
          <div className="mb-8 bg-foreground/[0.02] border border-foreground/5 rounded-2xl p-5" data-testid="new-bien-form">
            <h2 className="text-sm font-medium text-foreground mb-4">Ajouter un bien</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Address with autocomplete */}
              <div className="sm:col-span-2 relative">
                <label className="block text-xs text-muted font-light mb-1">Adresse</label>
                <input
                  type="text"
                  role="combobox"
                  value={newAddress}
                  onChange={(e) => handleAddressInput(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 300)}
                  placeholder="12 rue de la Paix, 75002 Paris"
                  aria-expanded={showSuggestions && suggestions.length > 0}
                  aria-controls="address-suggestions-listbox"
                  aria-autocomplete="list"
                  className="w-full text-sm font-light bg-background border border-foreground/10 rounded-xl px-3 py-2 min-h-[44px] text-foreground placeholder:text-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div id="address-suggestions-listbox" role="listbox" className="absolute top-full left-0 right-0 z-10 mt-1 bg-background border border-foreground/10 rounded-xl shadow-lg overflow-hidden">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        role="option"
                        aria-selected={false}
                        onMouseDown={() => selectSuggestion(s)}
                        className="w-full text-left text-xs font-light px-3 py-2 min-h-[44px] flex items-center hover:bg-foreground/5 transition-colors"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs text-muted font-light mb-1">Type de bien</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full text-sm font-light bg-background border border-foreground/10 rounded-xl px-3 py-2 min-h-[44px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
                >
                  <option value="">Sélectionner</option>
                  {Object.entries(TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-muted font-light mb-1">Surface (m²)</label>
                <input
                  type="number"
                  value={newSurface}
                  onChange={(e) => setNewSurface(e.target.value)}
                  placeholder="65"
                  className="w-full text-sm font-light bg-background border border-foreground/10 rounded-xl px-3 py-2 min-h-[44px] text-foreground placeholder:text-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
                />
              </div>

              <div>
                <label className="block text-xs text-muted font-light mb-1">Nombre de pièces</label>
                <input
                  type="number"
                  value={newRooms}
                  onChange={(e) => setNewRooms(e.target.value)}
                  placeholder="3"
                  className="w-full text-sm font-light bg-background border border-foreground/10 rounded-xl px-3 py-2 min-h-[44px] text-foreground placeholder:text-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
                />
              </div>

              <div>
                <label className="block text-xs text-muted font-light mb-1">Prix de vente (€)</label>
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="250000"
                  className="w-full text-sm font-light bg-background border border-foreground/10 rounded-xl px-3 py-2 min-h-[44px] text-foreground placeholder:text-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
                />
              </div>
            </div>

            {createError && (
              <p className="text-xs text-red-500 font-light mt-3">{createError}</p>
            )}

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleCreate}
                disabled={isCreating || !newAddress.trim()}
                className="text-xs bg-sage text-white px-4 py-2 min-h-[44px] flex items-center rounded-full font-medium hover:bg-sage/85 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
              >
                {isCreating ? "Création..." : "Créer le bien"}
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewAddress("");
                  setNewType("");
                  setNewSurface("");
                  setNewRooms("");
                  setNewPrice("");
                  setCreateError(null);
                  setSuggestions([]);
                }}
                className="text-xs text-muted font-light px-4 py-2 min-h-[44px] rounded-full hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Property list */}
        {properties.length === 0 && !showCreateForm ? (
          <div className="text-center py-16">
            <p className="text-sm text-muted font-light">Aucun bien enregistré.</p>
            <p className="text-xs text-muted/60 font-light mt-2">
              Ajoutez vos biens pour générer des visuels meublés et créer vos dossiers de pré-commercialisation.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center mt-4 text-xs bg-foreground text-background px-4 py-2 min-h-[44px] rounded-full font-medium hover:bg-foreground/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
            >
              Ajouter mon premier bien
            </button>
          </div>
        ) : (
          <>
          {/* Search + sort bar */}
          {properties.length > 0 && (
            <div className="flex gap-3 items-center mb-6">
              <input
                type="text"
                placeholder="Rechercher par adresse ou ville..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2.5 min-h-[44px] border border-foreground/10 rounded-xl text-sm font-light focus:border-foreground focus:outline-none transition-colors placeholder:text-foreground/30"
              />
              <button
                onClick={() => setSortBy(s => s === "recent" ? "ville" : "recent")}
                className="text-xs text-muted border border-foreground/10 px-3 py-2 min-h-[44px] rounded-xl hover:text-foreground hover:border-foreground/20 transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 shrink-0"
              >
                {sortBy === "recent" ? "↕ Par ville" : "↕ Plus récent"}
              </button>
            </div>
          )}

          {filteredProperties.length === 0 && searchQuery && (
            <div className="text-center py-10">
              <p className="text-sm text-muted font-light">Aucun bien ne correspond à votre recherche.</p>
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs text-sage font-medium mt-3 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 rounded-sm"
              >
                Effacer la recherche
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="biens-list">
            {filteredProperties.map((property) => (
              <div
                key={property.id}
                onClick={() => window.location.href = `/mes-biens/${property.id}`}
                className="bg-foreground/[0.02] border border-foreground/5 rounded-2xl p-5 hover:border-sage/30 transition-all group cursor-pointer"
                role="link"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && (window.location.href = `/mes-biens/${property.id}`)}
                data-testid="bien-card"
              >
                <h3 className="text-sm font-medium text-foreground group-hover:text-sage transition-colors truncate">
                  {property.address_normalized || property.address_raw || "Bien sans adresse"}
                </h3>

                {(property.city || property.postal_code) && (
                  <p className="text-xs text-muted font-light mt-1">
                    {[property.postal_code, property.city].filter(Boolean).join(" ")}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mt-3">
                  {property.property_type && (
                    <span className="text-xs bg-foreground/5 text-muted px-2 py-0.5 rounded-lg">
                      {TYPE_LABELS[property.property_type] || property.property_type}
                    </span>
                  )}
                  {property.surface_m2 && (
                    <span className="text-xs bg-foreground/5 text-muted px-2 py-0.5 rounded-lg">
                      {property.surface_m2} m²
                    </span>
                  )}
                  {property.room_count && (
                    <span className="text-xs bg-foreground/5 text-muted px-2 py-0.5 rounded-lg">
                      {property.room_count} pièces
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-foreground/5 text-xs text-muted font-light">
                  <span>{property.photo_count || 0} photo{(property.photo_count || 0) !== 1 ? "s" : ""}</span>
                  <span>·</span>
                  <span>{property.dossier_count || 0} dossier{(property.dossier_count || 0) !== 1 ? "s" : ""}</span>
                  {property.annonce_uuid && (
                    <>
                      <span>·</span>
                      <span className="text-sage font-medium">Annonce active</span>
                    </>
                  )}
                </div>

                {property.dvf_median_price_m2 && (
                  <p className="text-xs text-sage font-light mt-2">
                    {property.dvf_median_price_m2.toLocaleString("fr-FR")} €/m² (quartier)
                  </p>
                )}

                {showArchived ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      fetch(`/api/properties/${property.id}/archive`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "unarchive" }),
                      }).then(() => fetchProperties(true)).catch(() => {});
                    }}
                    className="mt-3 text-xs text-sage border border-sage/20 px-3 py-1.5 rounded-full hover:bg-sage/5 transition-colors min-h-[44px] flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
                  >
                    Désarchiver
                  </button>
                ) : (
                <>
                {((property.dossier_count ?? 0) > 0 || property.annonce_uuid) && (
                  <div className="flex gap-2 mt-2">
                    {(property.dossier_count ?? 0) > 0 && property.last_dossier_uuid && (
                      <a
                        href={`/dossier/${property.last_dossier_uuid}`}
                        onClick={(e) => e.stopPropagation()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted border border-foreground/10 px-3 py-1.5 rounded-full hover:text-foreground hover:border-foreground/20 transition-colors min-h-[44px] flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
                      >
                        Voir le dossier ↗
                      </a>
                    )}
                    {property.annonce_uuid && (
                      <a
                        href={`/annonce/${property.annonce_uuid}`}
                        onClick={(e) => e.stopPropagation()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-sage border border-sage/20 px-3 py-1.5 rounded-full hover:bg-sage/5 transition-colors min-h-[44px] flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
                      >
                        Voir l&apos;annonce ↗
                      </a>
                    )}
                  </div>
                )}
                </>
                )}
              </div>
            ))}
          </div>
          </>
        )}
      </main>
    </div>
    </ProGate>
  );
}
