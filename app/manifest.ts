import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Saathi",
    short_name: "Saathi",
    description: "AI co-pilot for small businesses.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFF8F0",
    theme_color: "#D97706",
    orientation: "portrait",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
