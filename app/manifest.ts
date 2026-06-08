import type { MetadataRoute } from "next";

// Web app manifest — lets people "Add to Home Screen" and run JamKemon as a
// standalone app (no browser chrome), with the brand icon and colours.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JamKemon — জ্যাম কেমন?",
    short_name: "JamKemon",
    description: "Dhaka's live, community-driven traffic map.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#e11d48",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
    ],
  };
}
