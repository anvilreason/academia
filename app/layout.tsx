import type { Metadata } from "next";
import "./globals.css";
import "./v06.css";
import { AppProviders } from "@/components/providers/AppProviders";

export const metadata: Metadata = {
  metadataBase: new URL("https://academia-agent.anvilreason.chatgpt.site"),
  title: {
    default: "Academia｜一所没有边界的大学",
    template: "%s｜Academia",
  },
  description:
    "知识有门类，思想没有边界。进入学院，向任何结论发问，把知识变成自己的判断。",
  openGraph: {
    title: "Academia｜一所没有边界的大学",
    description:
      "不崇拜权威，不归顺主义，不接受知识的边界。17 个学院，95 个专业，4,192 门课程。",
    type: "website",
    locale: "zh_CN",
    images: [
      {
        url: "/og.png",
        width: 1734,
        height: 907,
        alt: "Academia｜知识有门类，思想没有边界",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Academia｜一所没有边界的大学",
    description: "知识有门类，思想没有边界。",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
