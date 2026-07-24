import type { Metadata } from "next";
import "./globals.css";
import "./v06.css";
import { AppProviders } from "@/components/providers/AppProviders";

export const metadata: Metadata = {
  metadataBase: new URL("https://academia-agent.anvilreason.chatgpt.site"),
  title: {
    default: "Academia｜为第一次创造真实事物的人而建",
    template: "%s｜Academia",
  },
  description:
    "从真实问题出发，找到必要的学科，完成必须亲自完成的行动，再让现实检验你的判断。",
  openGraph: {
    title: "Academia｜为第一次创造真实事物的人而建",
    description:
      "答案不从提问开始，而从发现真正的问题开始。",
    type: "website",
    locale: "zh_CN",
    images: [
      {
        url: "/og.png",
        width: 1734,
        height: 907,
        alt: "Academia｜答案不从提问开始",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Academia｜为第一次创造真实事物的人而建",
    description: "答案不从提问开始，而从发现真正的问题开始。",
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
