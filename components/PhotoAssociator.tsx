"use client";

/**
 * PhotoAssociator — Composant discret affiche apres une generation reussie
 * pour permettre au marchand d'associer la photo a un bien existant.
 *
 * Affiche un popover leger "Associer à un bien ?" avec la liste des biens
 * et un bouton "+ Nouveau bien" + "Ignorer".
 */

import { useState, useEffect, useCallback } from "react";

interface Property {
  id: string;
  address_raw: string | null;
  address_normalized: string | null;
  city: string | null;
}

interface PhotoAssociatorProps {
  photoId: string;
  onDismiss: () => void;
}

export default function PhotoAssociator({ photoId, onDismiss }: PhotoAssociatorProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssociating, setIsAssociating] = useState(false);

  const fetchProperties = useCallback(async () => {
    try {
      const res = await fetch("/api/properties");
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
    fetchProperties();
  }, [fetchProperties]);

  const handleAssociate = async (propertyId: string) => {
    setIsAssociating(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoIds: [photoId] }),
      });
      if (res.ok) {
        onDismiss();
      }
    } catch (err) {
      console.error("Erreur association photo:", err);
    } finally {
      setIsAssociating(false);
    }
  };

  if (isLoading) return null;
  if (properties.length === 0) return null;

  return (
    <div className="mt-3 bg-foreground/[0.03] border border-foreground/5 rounded-2xl p-3">
      <p className="text-xs text-muted font-light mb-2">Associer à un bien ?</p>
      <div className="flex flex-wrap gap-2">
        {properties.map((p) => (
          <button
            key={p.id}
            onClick={() => handleAssociate(p.id)}
            disabled={isAssociating}
            className="min-h-[44px] text-xs sm:text-[11px] font-light bg-foreground/5 text-foreground px-3 py-2 rounded-xl hover:bg-sage/10 hover:text-sage transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 inline-flex items-center break-words text-left max-w-full"
          >
            {p.address_normalized || p.address_raw || p.city || "Bien sans adresse"}
          </button>
        ))}
        <a
          href="/mes-biens?create=true"
          className="min-h-[44px] inline-flex items-center text-xs sm:text-[11px] font-light bg-sage/10 text-sage px-3 py-2 rounded-xl hover:bg-sage/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
        >
          + Nouveau bien
        </a>
        <button
          onClick={onDismiss}
          className="min-h-[44px] inline-flex items-center text-xs sm:text-[11px] font-light text-muted px-3 py-2 rounded-xl hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
        >
          Ignorer
        </button>
      </div>
    </div>
  );
}
