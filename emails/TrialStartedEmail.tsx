import { Text } from "@react-email/components";
import { BaseEmail, text } from "./BaseEmail";

export function TrialStartedEmail({ productName }: { productName: string }) {
  return (
    <BaseEmail preview="Test erişiminiz başladı." title="Test erişiminiz başladı.">
      <Text style={text}>
        {productName} için test erişiminiz hesabınıza tanımlandı. Kurulum
        dosyasını indirme merkezinden alabilirsiniz.
      </Text>
    </BaseEmail>
  );
}

export default TrialStartedEmail;
