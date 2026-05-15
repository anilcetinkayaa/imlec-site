import { Text } from "@react-email/components";
import { BaseEmail, text } from "./BaseEmail";

export function TrialEndingEmail({ productName }: { productName: string }) {
  return (
    <BaseEmail preview="Test erişiminiz yakında bitecek." title="Test süreci yakında bitecek.">
      <Text style={text}>
        {productName} test erişiminizin bitmesine 3 gün kaldı. Ürün erişimi
        devam edecekse hesap panelinden durumu takip edebilirsiniz.
      </Text>
    </BaseEmail>
  );
}

export default TrialEndingEmail;
