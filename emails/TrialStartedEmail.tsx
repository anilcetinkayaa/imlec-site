import { Text } from "@react-email/components";
import { BaseEmail, text } from "./BaseEmail";

export function TrialStartedEmail({
  productName,
  trialEndsAt,
}: {
  productName: string;
  trialEndsAt?: string;
}) {
  return (
    <BaseEmail preview="Ücretsiz denemeniz başladı." title="Ücretsiz denemeniz başladı.">
      <Text style={text}>
        {productName} için ücretsiz deneme erişiminiz hesabınıza tanımlandı.
        {trialEndsAt
          ? ` Deneme süreniz ${trialEndsAt} tarihinde sona erecek.`
          : ""}{" "}
        Bu tarihten önce iptal ederseniz ücret alınmaz.
      </Text>
    </BaseEmail>
  );
}

export default TrialStartedEmail;
