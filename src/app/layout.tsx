import type { Metadata, Viewport } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";

const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ศูนย์21 ลอยกระทงรักษ์โลก ๒๕๖๙ | กิจกรรมภายในหน่วยงาน",
  description:
    "ร่วมลอยกระทงออนไลน์ ตอบคำถามรักษ์สิ่งแวดล้อม โหวตคำอธิษฐานโดนใจ และลุ้นรางวัล Lucky Draw",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#060e22",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={prompt.className}>
      <body className="min-h-screen bg-[#060e22] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
