import type { Metadata } from "next";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Conditions générales de vente",
  description: "Conditions générales de vente et d'utilisation de Versimo — packages crédits, retour, propriété intellectuelle.",
  robots: { index: false, follow: false },
};

export default function CGV() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-foreground/10 py-6 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <a href="/" className="text-xl font-semibold text-foreground tracking-tighter focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded-sm">
            Versimo
          </a>
          <a href="/" className="text-xs text-muted font-light hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded-sm">
            Retour
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-8">
          Conditions générales de vente et d&apos;utilisation
        </h1>

        <div className="space-y-8 text-sm text-muted font-normal leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">1. Objet</h2>
            <p>
              Les présentes conditions régissent l&apos;utilisation du service Versimo, outil de home staging virtuel par intelligence artificielle. Versimo permet de générer des visuels meublés à partir de photos de pièces vides.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">2. Service gratuit</h2>
            <p>
              Tout utilisateur bénéficie de 3 générations gratuites à l&apos;inscription, sans carte bancaire. Le plan gratuit inclut l&apos;accès aux 12 styles et le téléchargement HD.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">3. Packages crédits</h2>
            <p>Versimo fonctionne par packages de crédits, sans abonnement. Chaque génération consomme 1 crédit.</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-foreground/10">
                    <th className="py-2 pr-4 font-medium text-foreground">Pack</th>
                    <th className="py-2 pr-4 font-medium text-foreground">Crédits</th>
                    <th className="py-2 pr-4 font-medium text-foreground">Prix TTC</th>
                    <th className="py-2 font-medium text-foreground">Prix / photo</th>
                  </tr>
                </thead>
                <tbody className="text-muted">
                  <tr className="border-b border-foreground/10"><td className="py-2 pr-4">Découverte</td><td className="py-2 pr-4">3</td><td className="py-2 pr-4">Gratuit</td><td className="py-2">0 €</td></tr>
                  <tr className="border-b border-foreground/10"><td className="py-2 pr-4">Starter (achat unique)</td><td className="py-2 pr-4">15</td><td className="py-2 pr-4">9,90 €</td><td className="py-2">0,66 €</td></tr>
                  <tr><td className="py-2 pr-4">Pro (abonnement mensuel)</td><td className="py-2 pr-4">50/mois</td><td className="py-2 pr-4">29 €/mois</td><td className="py-2">0,58 €</td></tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted/60">
              Prix TTC. TVA 20% incluse. TVA récupérable pour les professionnels assujettis.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">4. Droit de rétractation</h2>
            <p>
              Conformément à l&apos;article L221-28 13° du Code de la consommation, le droit de rétractation ne s&apos;applique pas aux contenus numériques fournis sur un support immatériel dont l&apos;exécution a commencé avec l&apos;accord du consommateur.
            </p>
            <p className="mt-2">
              Avant tout achat, l&apos;utilisateur reconnaît expressément renoncer à son droit de rétractation de 14 jours et accepte que l&apos;exécution du service commence immédiatement après le paiement.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">5. Propriété intellectuelle des images générées</h2>
            <p>
              L&apos;utilisateur conserve la pleine propriété de ses photos uploadées. Versimo accorde à l&apos;utilisateur une licence d&apos;utilisation non exclusive, mondiale et sans limitation de durée sur les images générées, y compris à des fins commerciales (plaquettes, annonces immobilières, supports de communication).
            </p>
            <p className="mt-2">
              Versimo se réserve le droit d&apos;utiliser les images générées de manière anonymisée à des fins d&apos;amélioration du service et de démonstration, sans identification de l&apos;utilisateur ni de l&apos;espace photographié.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">6. Limitation de responsabilité</h2>
            <p>
              Les visuels générés par Versimo sont produits par intelligence artificielle. Ils constituent des représentations indicatives et non contractuelles. Versimo ne garantit pas la fidélité absolue des rendus et ne saurait être tenu responsable de décisions prises sur la base de ces visuels.
            </p>
            <p className="mt-2">
              L&apos;utilisateur s&apos;engage à ne pas présenter les visuels générés comme des photographies réelles de biens existants, conformément à la réglementation en vigueur sur les pratiques commerciales.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">7. Disponibilité du service</h2>
            <p>
              Versimo s&apos;efforce d&apos;assurer une disponibilité continue du service. En cas d&apos;indisponibilité liée à une maintenance ou à un incident technique, les crédits non consommés restent valides. Les crédits achetés n&apos;ont pas de date d&apos;expiration.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">8. Médiation</h2>
            <p>
              En cas de litige, l&apos;utilisateur peut recourir gratuitement à un médiateur de la consommation. Le médiateur désigné par Versimo sera indiqué ici dès sa nomination. [Médiateur à désigner — obligatoire avant la première vente B2C]
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">9. Droit applicable</h2>
            <p>
              Les présentes conditions sont régies par le droit français. En cas de litige non résolu par la médiation, les tribunaux compétents seront ceux du ressort du siège social de Versimo.
            </p>
          </section>
        </div>

        <p className="text-xs text-muted/50 font-light mt-12">
          Dernière mise à jour : mars 2026
        </p>
      </main>

      <Footer currentPage="/cgv" />
    </div>
  );
}
