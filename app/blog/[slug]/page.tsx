import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBlogPostBySlug } from "@/lib/blog";
import Footer from "@/components/Footer";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://architecture-toum92.replit.app";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  let post: Awaited<ReturnType<typeof getBlogPostBySlug>> = null;
  try {
    post = await getBlogPostBySlug(slug);
  } catch {
    // DB unavailable
  }

  if (!post) {
    return { title: "Article introuvable" };
  }

  return {
    title: post.title,
    description: post.meta_description || `${post.title} — Blog Versiroom`,
    openGraph: {
      title: post.title,
      description: post.meta_description || `${post.title} — Blog Versiroom`,
      type: "article",
      locale: "fr_FR",
      siteName: "Versiroom",
      url: `${BASE_URL}/blog/${post.slug}`,
      publishedTime: new Date(post.created_at).toISOString(),
      modifiedTime: new Date(post.updated_at).toISOString(),
    },
    alternates: {
      canonical: `${BASE_URL}/blog/${post.slug}`,
    },
  };
}

/** Very basic Markdown to HTML — handles headers, bold, italic, links, paragraphs.
 *  No external dependency needed for the simple Markdown stored in DB. */
function markdownToHtml(md: string): string {
  return md
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-foreground mt-8 mb-3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold text-foreground mt-10 mb-4">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-foreground mt-12 mb-4">$1</h1>')
    // Bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-medium">$1</strong>')
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-sage hover:underline">$1</a>')
    // Line breaks → paragraphs
    .split(/\n\n+/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      // Don't wrap already-wrapped blocks (headers)
      if (trimmed.startsWith("<h")) return trimmed;
      return `<p class="text-sm text-muted font-light leading-relaxed mb-4">${trimmed.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("\n");
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  let post: Awaited<ReturnType<typeof getBlogPostBySlug>> = null;
  try {
    post = await getBlogPostBySlug(slug);
  } catch {
    // DB unavailable
  }

  if (!post || !post.published) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.meta_description || post.title,
    datePublished: new Date(post.created_at).toISOString(),
    dateModified: new Date(post.updated_at).toISOString(),
    publisher: {
      "@type": "Organization",
      name: "Versiroom",
      url: BASE_URL,
    },
    mainEntityOfPage: `${BASE_URL}/blog/${post.slug}`,
  };

  const contentHtml = markdownToHtml(post.content);

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
              href="/blog"
              className="text-xs text-muted font-light hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded-sm"
            >
              Blog
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

      {/* Article */}
      <article className="pt-28 sm:pt-36 pb-20 sm:pb-32 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <nav className="text-xs text-muted font-light mb-8 flex items-center gap-2">
            <a href="/blog" className="hover:text-foreground transition-colors">Blog</a>
            <span className="text-foreground/20">/</span>
            <span className="text-foreground/60">{post.title}</span>
          </nav>

          <h1 className="text-2xl sm:text-4xl font-bold text-foreground tracking-tight mb-4 leading-tight">
            {post.title}
          </h1>

          <div className="flex items-center gap-3 text-xs text-muted font-light mb-10">
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

          {/* Article content */}
          <div
            className="prose-versiroom"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />

          {/* CTA */}
          <div className="mt-16 pt-10 border-t border-foreground/10 text-center">
            <p className="text-sm font-semibold text-foreground mb-2">
              Envie de tester ?
            </p>
            <p className="text-sm text-muted font-light mb-6">
              3 visuels offerts, sans carte bancaire.
            </p>
            <a
              href="/#outil"
              className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-full text-sm font-medium hover:bg-foreground/85 transition-all duration-200 active:scale-[0.98]"
            >
              Essayer Versiroom
            </a>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
}
