import type { Metadata } from "next";
import { auth } from "@/auth";
import {
  AccountPageHeader,
  ProductAccessCard,
} from "@/app/account/account-ui";
import { getUserProductAccess } from "@/src/server/entitlements";

export const metadata: Metadata = {
  title: "Ürünlerim | İmleç Yazılım",
  description: "İmleç Yazılım hesabınıza bağlı ürün erişimleri.",
};

export default async function AccountProductsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const products = await getUserProductAccess(session.user.id);

  return (
    <>
      <AccountPageHeader
        description="Sahip olduğunuz ürünleri ve erişimi olmayan platform ürünlerini aynı yerde görün. Erişimi olmayan ürünler gizlenmez."
        eyebrow="Ürünlerim"
        title="Ürün erişimleri"
      />

      <div className="grid gap-4">
        {products.map((product) => (
          <ProductAccessCard key={product.id} product={product} />
        ))}
      </div>
    </>
  );
}
