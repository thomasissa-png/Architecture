"use client";

/**
 * Mes biens — Liste des biens de l'utilisateur.
 * Accessible aux utilisateurs connectes avec profil marchand.
 * Permet de creer un nouveau bien et naviguer vers sa fiche.
 */

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback, useRef } from "react";
import AuthButton from "@/components/AuthButton";

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
  created_at: string;
}

interface AddressSuggestion {
  label: string;
  postcode: string;
  city: string;
  lat: number;
  lon: number;
}

const TYPE_LABELS: Record<string, string> = {
  appartement: "Appartement",
  maison: "Maison",
  loft: "Loft",
  studio: "Studio",
  duplex: "Duplex",
  bureau: "Bureau commercial",
};

export default function MesBiensPage() {
  const { data: session, status: authStatus } = useSession();
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

  // Address autocomplete
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Redirect if not authenticated
  useEffect(() => {
    if (authStatus === "unauthenticated") {
      window.location.href = "/";
    }
  }, [authStatus]);

  const fetchProperties = useCallback(async () => {
    try {
      const res = await fetch("/api/properties");
      if (res.ok) {
        const data = await res.json();
        setProperties(data.properties || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      fetchProperties();
    }
  }, [session, fetchProperties]);

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
      } catch {
        // ignore
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
        setCreateError(data.error || "Erreur lors de la creation.");
        return;
      }

      const data = await res.json();
      // Redirect to the new property page
      window.location.href = `/mes-biens/${data.property.id}`;
    } catch {
      setCreateError("Erreur reseau.");
    } finally {
      setIsCreating(false);
    }
  };

  if (authStatus === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted font-light text-sm">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-foreground/5">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3 sm:py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-semibold text-foreground tracking-tighter">
            Versiroom
          </a>
          <nav className="flex items-center gap-2 sm:gap-6">
            <a href="/mes-biens" className="text-xs text-sage font-medium">
              Mes biens
            </a>
            <a href="/ma-galerie" className="text-xs text-muted font-light hover:text-foreground transition-colors">
              Ma galerie
            </a>
            <a href="/mes-dossiers" className="text-xs text-muted font-light hover:text-foreground transition-colors">
              Mes dossiers
            </a>
            <AuthButton />
          </nav>
        </div>
      </header>

      <main className="pt-24 pb-16 px-5 sm:px-8 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Mes biens</h1>
            <p className="text-sm text-muted font-light mt-1">
              {properties.length} bien{properties.length !== 1 ? "s" : ""} enregistre{properties.length !== 1 ? "s" : ""}
            </p>
          </div>

          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="text-xs bg-foreground text-background px-4 py-2 rounded-full font-medium hover:bg-foreground/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
          >
            + Nouveau bien
          </button>
        </div>

        {/* Create form */}
        {showCreateForm && (
          <div className="mb-8 bg-foreground/[0.02] border border-foreground/5 rounded-2xl p-5">
            <h2 className="text-sm font-medium text-foreground mb-4">Ajouter un bien</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Address with autocomplete */}
              <div className="sm:col-span-2 relative">
                <label className="block text-[10px] text-muted font-light mb-1">Adresse</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => handleAddressInput(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="12 rue de la Paix, 75002 Paris"
                  className="w-full text-sm font-light bg-background border border-foreground/10 rounded-xl px-3 py-2 text-foreground placeholder:text-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-background border border-foreground/10 rounded-xl shadow-lg overflow-hidden">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onMouseDown={() => selectSuggestion(s)}
                        className="w-full text-left text-xs font-light px-3 py-2 hover:bg-foreground/5 transition-colors"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] text-muted font-light mb-1">Type de bien</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full text-sm font-light bg-background border border-foreground/10 rounded-xl px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
                >
                  <option value="">Selectionner</option>
                  {Object.entries(TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-muted font-light mb-1">Surface (m2)</label>
                <input
                  type="number"
                  value={newSurface}
                  onChange={(e) => setNewSurface(e.target.value)}
                  placeholder="65"
                  className="w-full text-sm font-light bg-background border border-foreground/10 rounded-xl px-3 py-2 text-foreground placeholder:text-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
                />
              </div>

              <div>
                <label className="block text-[10px] text-muted font-light mb-1">Nombre de pieces</label>
                <input
                  type="number"
                  value={newRooms}
                  onChange={(e) => setNewRooms(e.target.value)}
                  placeholder="3"
                  className="w-full text-sm font-light bg-background border border-foreground/10 rounded-xl px-3 py-2 text-foreground placeholder:text-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
                />
              </div>

              <div>
                <label className="block text-[10px] text-muted font-light mb-1">Prix de vente (EUR)</label>
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="250000"
                  className="w-full text-sm font-light bg-background border border-foreground/10 rounded-xl px-3 py-2 text-foreground placeholder:text-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
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
                className="text-xs bg-sage text-white px-4 py-2 rounded-full font-medium hover:bg-sage/85 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
              >
                {isCreating ? "Creation..." : "Creer le bien"}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-xs text-muted font-light px-4 py-2 rounded-full hover:text-foreground transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Property list */}
        {properties.length === 0 && !showCreateForm ? (
          <div className="text-center py-16">
            <p className="text-muted font-light text-sm">Aucun bien enregistre.</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-block mt-4 text-xs bg-foreground text-background px-4 py-2 rounded-full font-medium hover:bg-foreground/85 transition-colors"
            >
              Ajouter mon premier bien
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map((property) => (
              <a
                key={property.id}
                href={`/mes-biens/${property.id}`}
                className="block bg-foreground/[0.02] border border-foreground/5 rounded-2xl p-5 hover:border-sage/30 transition-all group"
              >
                <h3 className="text-sm font-medium text-foreground group-hover:text-sage transition-colors truncate">
                  {property.address_normalized || property.address_raw || "Bien sans adresse"}
                </h3>

                {(property.city || property.postal_code) && (
                  <p className="text-[10px] text-muted font-light mt-1">
                    {[property.postal_code, property.city].filter(Boolean).join(" ")}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mt-3">
                  {property.property_type && (
                    <span className="text-[10px] bg-foreground/5 text-muted px-2 py-0.5 rounded-lg">
                      {TYPE_LABELS[property.property_type] || property.property_type}
                    </span>
                  )}
                  {property.surface_m2 && (
                    <span className="text-[10px] bg-foreground/5 text-muted px-2 py-0.5 rounded-lg">
                      {property.surface_m2} m2
                    </span>
                  )}
                  {property.room_count && (
                    <span className="text-[10px] bg-foreground/5 text-muted px-2 py-0.5 rounded-lg">
                      {property.room_count} pieces
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-3 text-[10px] text-muted font-light">
                  <span>{property.photo_count || 0} photo{(property.photo_count || 0) !== 1 ? "s" : ""}</span>
                  <span>{property.dossier_count || 0} dossier{(property.dossier_count || 0) !== 1 ? "s" : ""}</span>
                </div>

                {property.dvf_median_price_m2 && (
                  <p className="text-[10px] text-sage font-light mt-2">
                    {property.dvf_median_price_m2.toLocaleString("fr-FR")} EUR/m2 (quartier)
                  </p>
                )}
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
