interface FooterProps {
  /** Path of the current page — its link will be omitted from the nav */
  currentPage?: string;
}

const LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/marchand", label: "Professionnels" },
  { href: "/architecte", label: "Architectes" },
  { href: "/particulier", label: "Particuliers" },
  { href: "/examples", label: "Exemples" },
  { href: "/pricing", label: "Tarifs" },
  { href: "/blog", label: "Blog" },
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/cgv", label: "CGV" },
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "mailto:contact@versimo.fr", label: "Contact" },
];

export default function Footer({ currentPage }: FooterProps) {
  const filteredLinks = LINKS.filter((l) => l.href !== currentPage);

  return (
    <footer className="border-t border-foreground/5 py-10 px-5 sm:px-8">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted font-light">
        <div>
          <p>Pour les architectes, marchands de biens et particuliers</p>
          <p className="text-[11px] text-muted mt-1">
            Un produit{" "}
            <a
              href="https://versi-immobilier.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Versi Immobilier
            </a>
          </p>
        </div>
        <nav aria-label="Navigation footer" className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          {filteredLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-foreground transition-colors py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 rounded"
            >
              {link.label}
            </a>
          ))}
          <span>&copy; Versimo 2026</span>
        </nav>
      </div>
    </footer>
  );
}
