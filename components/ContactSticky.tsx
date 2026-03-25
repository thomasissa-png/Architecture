"use client";

/**
 * ContactSticky — Sticky bottom CTA for phone/email contact.
 * Used on both /annonce/[uuid] and /dossier/[uuid] public pages.
 * Renders nothing if no contact info is available.
 */

interface ContactStickyProps {
  telephone?: string | null;
  email?: string | null;
  raisonSociale?: string | null;
}

export default function ContactSticky({
  telephone,
  email,
}: ContactStickyProps) {
  if (!telephone && !email) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] p-4 pointer-events-none">
      <div className="max-w-5xl mx-auto flex justify-center">
        {telephone ? (
          <a
            href={`tel:${telephone}`}
            className="pointer-events-auto inline-flex items-center gap-2.5 bg-sage text-white px-6 py-3.5 rounded-full font-medium text-sm shadow-lg hover:bg-sage/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 min-h-[48px]"
            data-testid="contact-sticky-phone"
          >
            <svg
              className="w-4.5 h-4.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
              />
            </svg>
            Appeler
          </a>
        ) : email ? (
          <a
            href={`mailto:${email}`}
            className="pointer-events-auto inline-flex items-center gap-2.5 bg-sage text-white px-6 py-3.5 rounded-full font-medium text-sm shadow-lg hover:bg-sage/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 min-h-[48px]"
            data-testid="contact-sticky-email"
          >
            <svg
              className="w-4.5 h-4.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
            Envoyer un email
          </a>
        ) : null}
      </div>
    </div>
  );
}
