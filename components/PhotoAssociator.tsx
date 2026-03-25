"use client";

/**
 * PhotoAssociator — Composant discret affiche apres une generation reussie
 * pour permettre au marchand d'associer la photo a un bien existant.
 *
 * Affiche un popover leger "Associer a un bien ?" avec la liste des biens
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
    } catch {
      // ignore
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
    } catch {
      // ignore
    } finally {
      setIsAssociating(false);
    }
  };

  if (isLoading) return null;
  if (properties.length === 0) return null;

  return (
    <div className="mt-3 bg-foreground/[0.03] border border-foreground/5 rounded-2xl p-3">
      <p className="text-xs text-muted font-light mb-2">Associer a un bien ?</p>
      <div className="flex flex-wrap gap-2">
        {properties.map((p) => (
          <button
            key={p.id}
            onClick={() => handleAssociate(p.id)}
            disabled={isAssociating}
            className="text-[11px] font-light bg-foreground/5 text-foreground px-3 py-1.5 rounded-xl hover:bg-sage/10 hover:text-sage transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
          >
            {(p.address_normalized || p.address_raw || p.city || "Bien sans adresse").substring(0, 30)}
          </button>
        ))}
        <a
          href="/mes-biens?create=true"
          className="text-[11px] font-light bg-sage/10 text-sage px-3 py-1.5 rounded-xl hover:bg-sage/20 transition-colors"
        >
          + Nouveau bien
        </a>
        <button
          onClick={onDismiss}
          className="text-[11px] font-light text-muted px-3 py-1.5 rounded-xl hover:text-foreground transition-colors"
        >
          Ignorer
        </button>
      </div>
    </div>
  );
}
