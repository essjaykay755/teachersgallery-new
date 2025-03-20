import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/app/components/layout/navbar";
import { Footer } from "@/app/components/layout/footer";
import { AuthProvider } from "@/lib/auth-context";
import { NotificationsProvider } from "@/lib/notifications-context";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TeachersGallery - Find the Perfect Teacher",
  description: "Connect with qualified teachers for tutoring and learning",
  keywords: "teachers, tutoring, education, learning, India",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased min-h-screen flex flex-col`}>
        <AuthProvider>
          <NotificationsProvider>
            <Navbar />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </NotificationsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
