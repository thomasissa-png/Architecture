import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales de Versiroom — éditeur, hébergeur, propriété intellectuelle.",
  robots: { index: false, follow: false },
};

export default function MentionsLegales() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-gray-200/40 py-6 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <a href="/" className="text-xl font-semibold text-foreground tracking-tighter">
            Versiroom
          </a>
          <a href="/" className="text-xs text-muted font-light hover:text-foreground transition-colors">
            Retour
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-8">
          Mentions légales
        </h1>

        <div className="space-y-8 text-sm text-muted font-light leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">1. Éditeur du site</h2>
            <p>Le site Versiroom est édité par :</p>
            <div className="mt-3 space-y-1">
              <p><strong className="text-foreground font-medium">Versiroom</strong></p>
              <p>Forme juridique : [À compléter]</p>
              <p>SIRET : [À compléter]</p>
              <p>Adresse du siège social : [À compléter]</p>
              <p>Email : <a href="mailto:contact@versiroom.fr" className="text-sage hover:underline">contact@versiroom.fr</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">2. Directeur de la publication</h2>
            <p>[Nom à compléter], en qualité de représentant légal de Versiroom.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">3. Hébergement</h2>
            <div className="space-y-1">
              <p><strong className="text-foreground font-medium">Replit Inc.</strong></p>
              <p>440 N Barranca Ave, Covina, CA 91723, États-Unis</p>
              <p>Site web : <a href="https://replit.com" className="text-sage hover:underline" target="_blank" rel="noopener noreferrer">replit.com</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">4. Propriété intellectuelle</h2>
            <p>
              L&apos;ensemble des éléments du site Versiroom — textes, interface, code source, logo — est la propriété exclusive de Versiroom, sauf mention contraire.
            </p>
            <p className="mt-3">
              Les visuels générés par le service sont produits par intelligence artificielle. L&apos;utilisateur conserve tous les droits sur les photos qu&apos;il uploade. Versiroom accorde une licence d&apos;utilisation large sur les images générées, y compris à des fins commerciales.
            </p>
            <p className="mt-3 text-xs text-muted/60">
              Les visuels générés sont des représentations indicatives produites par IA. Ils ne constituent pas des représentations exactes de travaux ou de biens existants.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">5. Technologies utilisées</h2>
            <p>
              Versiroom utilise les technologies suivantes : Next.js (interface), OpenAI gpt-4.1 (génération d&apos;images IA), Flux Depth Pro via Replicate (modèle de secours), PostgreSQL (base de données).
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">6. Contact</h2>
            <p>
              Pour toute question : <a href="mailto:contact@versiroom.fr" className="text-sage hover:underline">contact@versiroom.fr</a>
            </p>
          </section>
        </div>

        <p className="text-xs text-muted/50 font-light mt-12">
          Dernière mise à jour : mars 2026
        </p>
      </main>
    </div>
  );
}
