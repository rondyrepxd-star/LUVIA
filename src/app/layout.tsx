import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Luvia | Advanced Study App',
  description: 'AI-powered study assistant and notebook.',
};

import { ClientLayout } from "@/components/ClientLayout";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Code+Pro:wght@400;500&family=Roboto:wght@400;700&family=Open+Sans:wght@400;700&family=Montserrat:wght@400;700&family=Playfair+Display:wght@400;700&family=Lora:wght@400;700&family=Merriweather:wght@400;700&family=Ubuntu:wght@400;700&family=Oswald:wght@400;700&family=Raleway:wght@400;700&family=Pacifico&family=Caveat:wght@400;700&family=Dancing+Script:wght@400;700&family=Lobster&family=Abril+Fatface&display=swap" rel="stylesheet" />
        {/* KaTeX CSS & JS - loaded globally so math renders correctly on page reload */}
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" crossOrigin="anonymous" />
        <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js" crossOrigin="anonymous" defer></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const observer = new MutationObserver((mutations) => {
                  mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'bis_skin_checked') {
                      mutation.target.removeAttribute('bis_skin_checked');
                    }
                  });
                });
                observer.observe(document.documentElement, {
                  attributes: true,
                  childList: true,
                  subtree: true,
                  attributeFilter: ['bis_skin_checked']
                });
              })();
            `,
          }}
        />
      </head>
      <body className="font-body antialiased selection:bg-primary/30" suppressHydrationWarning>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
