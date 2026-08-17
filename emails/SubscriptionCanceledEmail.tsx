import { Text } from "@react-email/components";
import { BaseEmail, text } from "./BaseEmail";

export function SubscriptionCanceledEmail({
  productName,
  accessEndsAt,
}: {
  productName: string;
  accessEndsAt?: string;
}) {
  return (
    <BaseEmail preview="Otomatik yenileme durduruldu." title="Aboneliğiniz iptal edildi.">
      <Text style={text}>
        {productName} aboneliğiniz iptal edildi ve otomatik yenileme
        durduruldu. {accessEndsAt ? `Erişiminiz ${accessEndsAt} tarihine kadar devam edecek.` : "Yeni bir ücret alınmayacak."}
      </Text>
    </BaseEmail>
  );
}

export default SubscriptionCanceledEmail;
