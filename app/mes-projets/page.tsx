"use client";

/**
 * /mes-projets — Liste des projets pro (pipeline marchand) de l'utilisateur.
 *
 * Rendu : Client Component (fetch côté client, état interactif).
 *
 * Affiche une grille de cartes projet avec statut, type de bien, nombre de pièces,
 * date de création et CTA contextuel selon le statut.
 */

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// ─── Types ──────────────────────────────────────────────────────────

interface Project {
  id: string;
  adresse: string;
  type_bien: string;
  status: string;
  created_at: string;
  updated_at: string;
  room_count: number;
}

// ─── Status configuration ───────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  plan_uploaded: "Plan uploadé",
  lots_defined: "Lots définis",
  extraction_done: "Pièces détectées",
  extraction_failed: "Extraction échouée",
  validated: "Pièces validées",
  qualified: "Lots qualifiés",
  plan_final: "Plan finalisé",
  generating: "Génération en cours",
  visuals_done: "Visuels prêts",
  delivered: "Dossier livré",
};

const STATUS_COLORS: Record<string, string> = {
  plan_uploaded: "bg-[#F5F5F0] text-[#9B9A94]",
  lots_defined: "bg-[#F5F5F0] text-[#9B9A94]",
  extraction_done: "bg-[#F5F5F0] text-[#9B9A94]",
  extraction_failed: "bg-[#FEF2F2] text-[#B91C1C]",
  validated: "bg-[#F5F5F0] text-[#9B9A94]",
  qualified: "bg-[#F5F5F0] text-[#9B9A94]",
  plan_final: "bg-[#F5F5F0] text-[#9B9A94]",
  generating: "bg-[#ECFDF5] text-[#4A7A42]",
  visuals_done: "bg-[#ECFDF5] text-[#4A7A42]",
  delivered: "bg-[#ECFDF5] text-[#4A7A42]",
};

const STATUS_ROUTES: Record<string, string> = {
  plan_uploaded: "/decoupe",
  lots_defined: "/extraction",
  extraction_done: "/validation",
  extraction_failed: "/extraction",
  validated: "/qualification",
  qualified: "/recommandations",
  plan_final: "/generation",
  generating: "/generation",
  visuals_done: "/dossier",
  delivered: "/dossier",
};

const TYPE_BIEN_LABELS: Record<string, string> = {
  immeuble: "Immeuble",
  appartement: "Appartement",
  maison: "Maison",
  bureaux: "Bureaux",
  local_commercial: "Local commercial",
};

// ─── Helpers ────────────────────────────────────────────────────────

function formatDateFR(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getProjectRoute(project: Project): string {
  const suffix = STATUS_ROUTES[project.status] ?? "/decoupe";
  return `/projet/${project.id}${suffix}`;
}

// ─── Page component ─────────────────────────────────────────────────

export default function MesProjetsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStatus === "loading") return;

    if (!session?.user?.id) {
      router.push("/");
      return;
    }

    async function fetchProjects() {
      try {
        const res = await fetch("/api/pro/projects");
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/");
            return;
          }
          throw new Error("Erreur serveur");
        }
        const data = await res.json();
        setProjects(data);
      } catch {
        setError("Impossible de charger vos projets. Réessayez dans quelques instants.");
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [session, sessionStatus, router]);

  // ─── Auth loading ───────────────────────────────────────────────
  if (sessionStatus === "loading") {
    return (
      <>
        <Header variant="internal" />
        <main className="min-h-screen pt-24 pb-16 px-5 sm:px-8 bg-background">
          <div className="max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
            <div className="w-6 h-6 border-2 border-foreground/20 border-t-sage rounded-full animate-spin" />
          </div>
        </main>
        <Footer currentPage="/mes-projets" />
      </>
    );
  }

  return (
    <>
      <Header variant="internal" activePage="mes-projets" />

      <main className="min-h-screen pt-24 pb-16 px-5 sm:px-8 bg-background">
        <div className="max-w-6xl mx-auto">

          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                Mes projets
              </h1>
              <p className="text-sm text-muted font-light mt-1">
                {projects.length > 0
                  ? `${projects.length} projet${projects.length > 1 ? "s" : ""}`
                  : "Gérez vos dossiers de home staging pro"}
              </p>
            </div>

            <a
              href="/projet/nouveau"
              className="inline-flex items-center justify-center gap-2 bg-sage text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-sage/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Nouveau projet
            </a>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="w-6 h-6 border-2 border-foreground/20 border-t-sage rounded-full animate-spin" />
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <p className="text-sm text-muted font-light mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-sage font-medium hover:text-sage/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 rounded"
              >
                Réessayer
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && projects.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
              <div className="w-16 h-16 rounded-2xl bg-sage/10 flex items-center justify-center mb-5">
                <svg className="w-8 h-8 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Aucun projet pour le moment
              </h2>
              <p className="text-sm text-muted font-light mb-6 max-w-sm">
                Créez votre premier dossier de home staging professionnel en quelques minutes.
              </p>
              <a
                href="/projet/nouveau"
                className="inline-flex items-center gap-2 bg-sage text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-sage/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Créer mon premier projet
              </a>
            </div>
          )}

          {/* Project cards grid */}
          {!loading && !error && projects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer currentPage="/mes-projets" />
    </>
  );
}

// ─── Project card component ─────────────────────────────────────────

function ProjectCard({ project }: { project: Project }) {
  const statusLabel = STATUS_LABELS[project.status] ?? project.status;
  const statusColor = STATUS_COLORS[project.status] ?? "bg-gray-100 text-gray-700";
  const href = getProjectRoute(project);

  return (
    <a
      href={href}
      className="group block rounded-2xl border border-foreground/8 bg-background p-5 sm:p-6 transition-all hover:border-sage/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
    >
      {/* Status badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium ${statusColor}`}>
          {project.status === "generating" && (
            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse mr-1.5" />
          )}
          {statusLabel}
        </span>
        <span className="text-[11px] text-muted font-light whitespace-nowrap">
          {formatDateFR(project.created_at)}
        </span>
      </div>

      {/* Address */}
      <h3 className="text-base font-medium text-foreground mb-2 line-clamp-2 group-hover:text-sage transition-colors">
        {project.adresse}
      </h3>

      {/* Meta row */}
      <div className="flex items-center gap-3 text-xs text-muted font-light">
        {/* Type de bien */}
        <span className="inline-flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />
          </svg>
          {TYPE_BIEN_LABELS[project.type_bien] ?? project.type_bien}
        </span>

        {/* Room count */}
        <span className="inline-flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
          {project.room_count} pièce{project.room_count !== 1 ? "s" : ""}
        </span>
      </div>

      {/* CTA */}
      <div className="mt-4 pt-3 border-t border-foreground/5">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sage group-hover:gap-2.5 transition-all">
          {project.status === "delivered" ? "Voir le dossier" : "Continuer"}
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </span>
      </div>
    </a>
  );
}
