import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: new URL("/", SITE_URL).toString(),
      lastModified,
      changeFrequency: "yearly",
      priority: 1,
    },
    {
      url: new URL("/caso-de-estudio", SITE_URL).toString(),
      lastModified,
      changeFrequency: "yearly",
      priority: 0.8,
    },
    {
      url: new URL("/contacto", SITE_URL).toString(),
      lastModified,
      changeFrequency: "yearly",
      priority: 0.7,
    },
  ];
}


