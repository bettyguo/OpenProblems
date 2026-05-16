import type { MetadataRoute } from "next";
import { buildSitemap } from "@/lib/sitemap/build-sitemap";

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemap();
}
