import type { MetadataRoute } from "next";

const baseUrl = "https://boliyan.pk";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/categories",
    "/list",
    "/dashboard",
    "/inbox",
    "/profile",
    "/privacy",
    "/privacy-policy",
    "/terms",
    "/terms-of-service",
    "/data-deletion",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
  }));
}
