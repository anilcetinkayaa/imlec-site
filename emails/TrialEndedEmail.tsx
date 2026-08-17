import { Text } from "@react-email/components";
import { BaseEmail, text } from "./BaseEmail";

export function TrialEndedEmail({ productName }: { productName: string }) {
  return (
    <BaseEmail preview="Ücretsiz denemeniz sona erdi." title="Ücretsiz denemeniz sona erdi.">
      <Text style={text}>
        {productName} ücretsiz deneme süreniz sona erdi. Abonelik durumunuzu ve
        ödeme kayıtlarınızı hesap panelinden kontrol edebilirsiniz.
      </Text>
    </BaseEmail>
  );
}

export default TrialEndedEmail;
