import type { Metadata } from "next";
import { getBlogPosts } from "@/lib/blog";
import Footer from "@/components/Footer";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://architecture-toum92.replit.app";

export const metadata: Metadata = {
  title: "Blog | Versiroom",
  description:
    "Conseils home staging virtuel, inspiration decoration IA, guides pour architectes d'interieur et marchands de biens. Actualites Versiroom.",
  keywords: [
    "blog home staging",
    "decoration IA blog",
    "home staging virtuel conseils",
    "inspiration deco IA",
  ],
  openGraph: {
    title: "Blog | Versiroom",
    description:
      "Conseils home staging virtuel, inspiration decoration IA, guides pour professionnels et particuliers.",
    type: "website",
    locale: "fr_FR",
    siteName: "Versiroom",
    url: `${BASE_URL}/blog`,
  },
  alternates: {
    canonical: `${BASE_URL}/blog`,
  },
};

export const dynamic = "force-dynamic";

export default async function BlogIndexPage() {
  let posts: Awaited<ReturnType<typeof getBlogPosts>> = [];
  try {
    posts = await getBlogPosts({ publishedOnly: true, limit: 50 });
  } catch {
    // DB unavailable — show empty state
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-foreground/5">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3 sm:py-4 flex items-center justify-between">
          <a
            href="/"
            className="text-xl font-semibold text-foreground tracking-tighter focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded-sm"
          >
            Versiroom
          </a>
          <nav className="flex items-center gap-4 sm:gap-6">
            <a
              href="/pricing"
              className="text-xs text-muted font-light hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded-sm"
            >
              Tarifs
            </a>
            <a
              href="/#outil"
              className="text-xs font-medium text-background bg-foreground px-4 py-2 rounded-full hover:bg-foreground/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
            >
              Essayer
            </a>
          </nav>
        </div>
      </header>

      {/* Content */}
      <section className="pt-28 sm:pt-36 pb-20 sm:pb-32 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-3">
              Blog
            </h1>
            <p className="text-muted font-light">
              Conseils, guides et inspiration pour le home staging virtuel par IA.
            </p>
          </div>

          {posts.length > 0 ? (
            <div className="space-y-8">
              {posts.map((post) => (
                <a
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="block p-6 rounded-2xl border border-foreground/10 bg-background hover:border-foreground/20 transition-colors group"
                >
                  <h2 className="text-lg font-semibold text-foreground group-hover:text-sage transition-colors mb-2">
                    {post.title}
                  </h2>
                  {post.meta_description && (
                    <p className="text-sm text-muted font-light leading-relaxed mb-3">
                      {post.meta_description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted font-light">
                    <time dateTime={new Date(post.created_at).toISOString().split("T")[0]}>
                      {new Date(post.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </time>
                    {post.persona && (
                      <>
                        <span className="text-foreground/20">&middot;</span>
                        <span className="capitalize">{post.persona}</span>
                      </>
                    )}
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center mx-auto mb-5">
                <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-foreground mb-2">
                Bientôt disponible
              </p>
              <p className="text-sm text-muted font-light max-w-md mx-auto">
                Nous préparons des articles sur le home staging virtuel,
                l&apos;inspiration déco et les bonnes pratiques pour
                architectes, marchands de biens et particuliers.
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer currentPage="/blog" />
    </div>
  );
}
