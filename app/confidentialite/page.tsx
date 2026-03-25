import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Politique de confidentialité de Versiroom — RGPD, données collectées, droits des utilisateurs.",
  robots: { index: false, follow: false },
};

export default function Confidentialite() {
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
          Politique de confidentialité
        </h1>

        <div className="space-y-8 text-sm text-muted font-light leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">1. Responsable du traitement</h2>
            <p>Versiroom — <a href="mailto:contact@versiroom.fr" className="text-sage hover:underline">contact@versiroom.fr</a></p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">2. Données collectées</h2>
            <ul className="space-y-2 list-disc pl-5">
              <li><strong className="text-foreground font-medium">Photos uploadées</strong> — les images que vous chargez pour générer un visuel meublé. Base légale : exécution du service (consentement implicite par l&apos;upload).</li>
              <li><strong className="text-foreground font-medium">Adresse IP</strong> — utilisée pour le rate limiting (10 requêtes/minute) et la sécurité du service. Base légale : intérêt légitime.</li>
              <li><strong className="text-foreground font-medium">Logs de génération</strong> — style choisi, durée de traitement, modèle utilisé. Base légale : intérêt légitime (amélioration du service).</li>
              <li><strong className="text-foreground font-medium">Cookies techniques</strong> — identifiant de session anonyme (localStorage). Aucun cookie tiers, aucun tracker publicitaire.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">3. Finalités du traitement</h2>
            <ul className="space-y-1 list-disc pl-5">
              <li>Fournir le service de home staging virtuel par IA</li>
              <li>Prévenir les abus (rate limiting)</li>
              <li>Améliorer la qualité des générations (analyse anonymisée des résultats)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">4. Sous-traitants</h2>
            <div className="space-y-3">
              <div>
                <p><strong className="text-foreground font-medium">OpenAI</strong> (San Francisco, USA) — génération d&apos;images IA. Certifié EU-US Data Privacy Framework.</p>
              </div>
              <div>
                <p><strong className="text-foreground font-medium">Replicate</strong> (San Francisco, USA) — modèle de secours Flux Depth Pro.</p>
              </div>
              <div>
                <p><strong className="text-foreground font-medium">Replit</strong> (USA) — hébergement, base de données, stockage d&apos;images. Certifié EU-US Data Privacy Framework.</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted/60">
              Vos photos sont transmises à OpenAI et/ou Replicate pour la génération des visuels, puis supprimées après traitement. Les images générées sont conservées pendant la durée de rétention indiquée ci-dessous.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">5. Durée de conservation</h2>
            <ul className="space-y-1 list-disc pl-5">
              <li>Photos uploadées et images générées : <strong className="text-foreground font-medium">30 jours</strong></li>
              <li>Logs de génération (style, durée, modèle) : <strong className="text-foreground font-medium">90 jours</strong></li>
              <li>Adresses IP : <strong className="text-foreground font-medium">durée de la session</strong> (rate limiting en mémoire)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">6. Vos droits (RGPD)</h2>
            <p>Conformément au Règlement Général sur la Protection des Données, vous disposez des droits suivants :</p>
            <ul className="space-y-1 list-disc pl-5 mt-2">
              <li>Droit d&apos;accès à vos données</li>
              <li>Droit de rectification</li>
              <li>Droit à l&apos;effacement</li>
              <li>Droit à la portabilité</li>
              <li>Droit d&apos;opposition au traitement</li>
              <li>Droit d&apos;introduire une réclamation auprès de la CNIL</li>
            </ul>
            <p className="mt-3">
              Pour exercer ces droits : <a href="mailto:contact@versiroom.fr" className="text-sage hover:underline">contact@versiroom.fr</a>
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">7. Cookies</h2>
            <p>Versiroom utilise uniquement des cookies techniques strictement nécessaires au fonctionnement du service (identifiant de session anonyme). Aucun cookie tiers, aucun traceur publicitaire. Conformément aux recommandations de la CNIL, aucun bandeau de consentement n&apos;est requis pour les cookies techniques strictement nécessaires.</p>
          </section>
        </div>

        <p className="text-xs text-muted/50 font-light mt-12">
          Dernière mise à jour : mars 2026
        </p>
      </main>
    </div>
  );
}
