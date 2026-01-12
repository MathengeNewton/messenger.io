import "./globals.css";
import { Albert_Sans } from "next/font/google";
import { AuthProvider } from "../contexts/AuthContext";

const albertSans = Albert_Sans({
  variable: "--font-albert-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "Messenger.io | Real-time Messaging",
  description:
    "Messenger.io — Real-time messaging platform for seamless communication.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    title: "Messenger.io | Real-time Messaging",
    description:
      "Real-time messaging platform for seamless communication.",
    url: "http://localhost:3001",
    siteName: "Messenger.io",
    type: "website",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Messenger.io",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Messenger.io | Real-time Messaging",
    description:
      "Real-time messaging platform for seamless communication.",
    images: ["/images/og-image.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${albertSans.variable} antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
