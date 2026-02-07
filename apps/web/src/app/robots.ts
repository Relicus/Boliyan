import type { MetadataRoute } from "next";

const baseUrl = "https://boliyan.pk";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/dashboard",
          "/dashboard/",
          "/inbox",
          "/inbox/",
          "/api/",
          "/profile",
          "/complete-profile",
          "/signin",
          "/signup",
          "/auth/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
