import "./globals.css"
import { Inter } from "next/font/google"
import type { Metadata } from "next"
import type React from "react"
import Script from "next/script"
import SidebarWrapper from "./components/layout/sidebarWrapper"
import { ThemeProvider } from "@/app/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Financial Insights",
  description: "Financial insights and market trends dashboard",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <div className="flex h-screen bg-background overflow-hidden">
            <SidebarWrapper />
            <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
          </div>

          {/* UserWay Accessibility Widget */}
          <Script
            id="userway-widget"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  var s = document.createElement('script');
                  s.src = 'https://cdn.userway.org/widget.js';
                  s.setAttribute('data-account', 'ncKywmkXbA');
                  s.async = true;
                  document.body.appendChild(s);
                })();
              `,
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}

