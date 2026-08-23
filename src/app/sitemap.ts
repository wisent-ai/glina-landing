import type { MetadataRoute } from "next";
import site from "@/content/site.json";
export default function sitemap(): MetadataRoute.Sitemap { return [{ url: site.domain, changeFrequency: "weekly", priority: 1 }]; }
