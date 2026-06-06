import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "./i18n/LanguageProvider";
import { ReportProvider } from "./report/ReportContext";
import { ReportsProvider } from "./report/ReportsContext";
import { DirectionsProvider } from "./directions/DirectionsContext";
import { ThemeProvider } from "./theme/ThemeProvider";

// Inter covers English/Latin; Noto Sans Bengali covers বাংলা. Both are listed
// in the font stack (see globals.css) so mixed text renders correctly.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const notoBengali = Noto_Sans_Bengali({
  variable: "--font-bengali",
  subsets: ["bengali"],
});

export const metadata: Metadata = {
  title: "JamKemon — জ্যাম কেমন?",
  description: "Community-driven, live traffic map for Dhaka.",
};

export const viewport: Viewport = {
  themeColor: "#e11d48",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover", // lets content extend under phone notches/safe areas
};

// Runs before paint so the correct theme is applied with no flash of the wrong one.
const noFlashTheme = `
(function(){try{
  var s=localStorage.getItem('jamkemon.theme');
  var d=s? s==='dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  if(d) document.documentElement.classList.add('dark');
}catch(e){}})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="bn"
      suppressHydrationWarning
      className={`${inter.variable} ${notoBengali.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashTheme }} />
      </head>
      <body className="h-dvh flex flex-col overflow-hidden bg-white text-slate-900 dark:bg-neutral-950 dark:text-slate-100">
        <ThemeProvider>
          <LanguageProvider>
            <ReportProvider>
              <ReportsProvider>
                <DirectionsProvider>{children}</DirectionsProvider>
              </ReportsProvider>
            </ReportProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
