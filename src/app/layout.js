import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport = {
  themeColor: "#006633",
  width: "device-width",
  initialScale: 1,
};

export const metadata = {
  title: "Campus Connect Kenya",
  description:
    "A centralized digital ecosystem for Kenyan university students — communication, commerce, safety, and campus life, all in one place.",
  keywords: [
    "campus",
    "university",
    "Kenya",
    "students",
    "marketplace",
    "study groups",
    "hostel finder",
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CampusConnect",
  },
  openGraph: {
    title: "Campus Connect Kenya",
    description:
      "The all-in-one platform for Kenyan university students.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  );
}
