export default function manifest() {
    return {
        name: "Campus Connect Kenya",
        short_name: "CampusConnect",
        description:
            "A centralized digital ecosystem for Kenyan university students — communication, commerce, safety, and campus life.",
        start_url: "/",
        display: "standalone",
        background_color: "#0a0e17",
        theme_color: "#006633",
        orientation: "portrait-primary",
        categories: ["education", "social", "lifestyle"],
        icons: [
            {
                src: "/icons/icon-192.svg",
                sizes: "192x192",
                type: "image/svg+xml",
                purpose: "any",
            },
            {
                src: "/icons/icon-512.svg",
                sizes: "512x512",
                type: "image/svg+xml",
                purpose: "any",
            },
            {
                src: "/icons/icon-maskable.svg",
                sizes: "512x512",
                type: "image/svg+xml",
                purpose: "maskable",
            },
        ],
    };
}
