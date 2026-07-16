import { Text } from "@react-email/components";
import { BaseEmail, text } from "./BaseEmail";

export function RefundCompletedEmail({
  productName,
  amount,
}: {
  productName: string;
  amount: string;
}) {
  return (
    <BaseEmail
      preview="İade işleminiz tamamlandı."
      title="Ödeme iadeniz tamamlandı."
    >
      <Text style={text}>
        {productName} için {amount} tutarındaki ödeme Lemon Squeezy üzerinden
        iade edildi. Bankanızın iadeyi hesabınıza yansıtma süresi değişebilir.
      </Text>
    </BaseEmail>
  );
}

export default RefundCompletedEmail;
