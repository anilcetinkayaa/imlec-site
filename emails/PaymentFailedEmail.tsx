import { Text } from "@react-email/components";
import { BaseEmail, text } from "./BaseEmail";

export function PaymentFailedEmail({ productName }: { productName: string }) {
  return (
    <BaseEmail preview="Ödeme işlemi tamamlanamadı." title="Ödeme tamamlanamadı.">
      <Text style={text}>
        {productName} için ödeme işlemi tamamlanamadı. Ürün erişimi durumunu
        hesap panelinden kontrol edebilirsiniz.
      </Text>
    </BaseEmail>
  );
}

export default PaymentFailedEmail;
