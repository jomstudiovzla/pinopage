import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/*", "/espace/*"],
    },
    sitemap: "https://pinoespacesverts.online/sitemap.xml",
  };
}
