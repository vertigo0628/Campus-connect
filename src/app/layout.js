// Replacing Google Fonts with system fallback for build stability in restricted environments
import "./globals.css";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";

const geistSans = { variable: "--font-geist-sans" };
const geistMono = { variable: "--font-geist-mono" };

export const viewport = {
  themeColor: "#00bf63",
  width: "device-width",
  initialScale: 1,
};

export const metadata = {
  title: {
    default: "Campus Connect Kenya | The #1 Student Network",
    template: "%s | Campus Connect Kenya"
  },
  description:
    "The exclusive social & utility platform for Kenyan university students. Trade services, find roommates, join study groups, and stay safe with SOS alerts. Built for the MUST community and beyond.",
  keywords: [
    "campus connect kenya",
    "must university social network",
    "kenyan student marketplace",
    "student services kenya",
    "emergency sos university",
    "campus commerce",
  ],
  authors: [{ name: "The Masterminds (Group 5)" }],
  creator: "vertiGO",
  publisher: "Campus Connect Team",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Campus Connect",
  },
  openGraph: {
    title: "Campus Connect Kenya",
    description: "Connect, Trade, and Thrive in your university journey.",
    url: "https://campus-connect-ke.vercel.app",
    siteName: "Campus Connect Kenya",
    locale: "en_KE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Campus Connect Kenya",
    description: "The official network for Kenyan university comrades.",
  }
};

import { AuthProvider } from "@/context/AuthContext";
import Navigation from "@/components/Navigation";
import EmergencySOS from "@/components/EmergencySOS";
import SemaPortal from "@/components/SemaPortal";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AuthProvider>
          <ServiceWorkerRegistrar />
          <Navigation />
          <div className="main-content">
            {children}
          </div>
          <EmergencySOS />
          <SemaPortal />
        </AuthProvider>
      </body>
    </html>
  );
}
