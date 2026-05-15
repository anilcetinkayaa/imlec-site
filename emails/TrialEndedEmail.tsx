import { Text } from "@react-email/components";
import { BaseEmail, text } from "./BaseEmail";

export function TrialEndedEmail({ productName }: { productName: string }) {
  return (
    <BaseEmail preview="Test erişiminiz sona erdi." title="Test erişiminiz sona erdi.">
      <Text style={text}>
        {productName} test erişiminiz sona erdi. Yeniden erişim için üyelik
        talebi oluşturabilirsiniz.
      </Text>
    </BaseEmail>
  );
}

export default TrialEndedEmail;
