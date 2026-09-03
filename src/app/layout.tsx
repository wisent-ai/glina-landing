import type { Metadata } from "next";
import type { ReactNode } from "react";
import { EchoAnalytics } from "@/components/echo-analytics";
import { LandingFooter, LandingHeader } from "@/components/landing-components.js";
import componentPlan from "@/content/components.json";
import plan from "@/content/plan.json";
import site from "@/content/site.json";
import "./globals.css";

const chosen = (id: string) => componentPlan.components.some((entry) => entry.id === id && entry.status !== "excluded");
const headline = plan.hero.headline;
const prefixed = site.product + " — " + headline;
const pageTitle = headline.toLowerCase().includes(site.product.toLowerCase()) ? headline : prefixed.length <= 65 ? prefixed : headline;

export const metadata: Metadata = {
  metadataBase: new URL(site.domain),
  title: { default: pageTitle, template: "%s — " + site.product },
  description: plan.hero.metaDescription,
  openGraph: { type: "website", url: site.domain, siteName: site.siteName, title: pageTitle, description: plan.hero.metaDescription },
  twitter: { card: "summary_large_image", title: pageTitle, description: plan.hero.metaDescription },
  alternates: { canonical: site.domain },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: site.product,
  description: plan.hero.metaDescription,
  applicationCategory: "DeveloperApplication",
  url: site.domain,
  codeRepository: site.sourceUrl,
  publisher: { "@type": "Organization", name: "Wisent", url: "https://wisent.ai" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>
    <a className="skip-link" href="#main">Skip to content</a>
    {chosen("landing.header") ? <LandingHeader site={site} /> : null}
    <main id="main">{children}</main>
    {chosen("landing.footer") ? <LandingFooter site={site} /> : null}
    <EchoAnalytics />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
  </body></html>;
}
