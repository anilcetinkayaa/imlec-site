import { Text } from "@react-email/components";
import { BaseEmail, text } from "./BaseEmail";

export function TrialEndingEmail({ productName }: { productName: string }) {
  return (
    <BaseEmail preview="Ücretsiz denemeniz yakında bitecek." title="Ücretsiz denemeniz yakında bitecek.">
      <Text style={text}>
        {productName} ücretsiz denemenizin bitmesine 3 gün veya daha az kaldı.
        Devam etmek istemiyorsanız hesap panelinden hemen iptal edebilirsiniz;
        deneme bitmeden iptal edildiğinde ücret alınmaz.
      </Text>
    </BaseEmail>
  );
}

export default TrialEndingEmail;
