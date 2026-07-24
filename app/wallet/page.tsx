import { WalletCard } from "@/components/features/account/WalletCard";
import { ProductShell } from "@/components/shared/ProductShell";

export default function WalletPage() {
  return (
    <ProductShell context="账户与会员" title="星图学籍卡">
      <main className="university-page wallet-page">
        <header className="wallet-hero">
          <p className="eyebrow">ACADEMIA MEMBERSHIP</p>
          <h1>储值是准备，完成才是等级。</h1>
          <p>
            六档储值用于管理学习预算；会员等级严格按已经购买并完成的课程金额累计。
          </p>
        </header>
        <WalletCard />
      </main>
    </ProductShell>
  );
}
