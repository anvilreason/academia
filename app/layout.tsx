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
    "一所为认真思考者设计的 AI 大学。从学院、专业到课程，与 AI 导师对话，用考试、学分和重修把知识变成判断力。",
  openGraph: {
    title: "Academia｜用对话长出自己的认知地图",
    description:
      "17 个学院、95 个专业与 4,192 门完整培养课程。每一学分落实到课程，用考试和定向重修检验真正掌握。",
    type: "website",
    locale: "zh_CN",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "Academia" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Academia｜用对话长出自己的认知地图",
    description: "从学院、专业到课程，建立一张可检验的个人学术地图。",
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
