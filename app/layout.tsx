import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";

export const metadata: Metadata = {
  metadataBase: new URL("https://academia-agent.anvilreason.chatgpt.site"),
  title: {
    default: "Academia｜用对话长出自己的认知地图",
    template: "%s｜Academia",
  },
  description:
    "一所为认真思考者设计的个人 AI 研究生院。与经典理论对话，把知识变成你的判断力。",
  openGraph: {
    title: "Academia｜用对话长出自己的认知地图",
    description:
      "不是另一门录播课。选择一个真实问题，和 AI 导师一起把经典理论推演到你的工作里。",
    type: "website",
    locale: "zh_CN",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "Academia" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Academia｜用对话长出自己的认知地图",
    description: "一所为认真思考者设计的个人 AI 研究生院。",
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
