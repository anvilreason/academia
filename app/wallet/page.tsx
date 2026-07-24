import { WalletCard } from "@/components/features/account/WalletCard";
import { ProductShell } from "@/components/shared/ProductShell";

export default function WalletPage() {
  return (
    <ProductShell context="书院身份" title="学籍星图">
      <main className="university-page wallet-page">
        <header className="wallet-hero">
          <p className="eyebrow">ACADEMIA FELLOWSHIP</p>
          <h1>身份来自走过的路，不来自拥有的标签。</h1>
          <p>
            每一门完成的课程都会留在你的学籍星图上。书院称号记录学习的深度，
            不是一套需要追逐的等级。
          </p>
        </header>
        <WalletCard />
      </main>
    </ProductShell>
  );
}
