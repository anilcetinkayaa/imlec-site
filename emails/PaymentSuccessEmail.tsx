import { Text } from "@react-email/components";
import { BaseEmail, text } from "./BaseEmail";

export function PaymentSuccessEmail({
  productName,
  amount,
}: {
  productName: string;
  amount: string;
}) {
  return (
    <BaseEmail preview="Ödeme kaydınız işlendi." title="Ödeme başarılı.">
      <Text style={text}>
        {productName} için {amount} tutarındaki ödeme kaydınız işlendi.
      </Text>
    </BaseEmail>
  );
}

export default PaymentSuccessEmail;
