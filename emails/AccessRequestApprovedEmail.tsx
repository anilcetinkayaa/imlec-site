import { Text } from "@react-email/components";
import { BaseEmail, text } from "./BaseEmail";

export function AccessRequestApprovedEmail({
  productName,
}: {
  productName: string;
}) {
  return (
    <BaseEmail
      preview={`${productName} erişiminiz aktif edildi.`}
      title={`${productName} erişiminiz aktif edildi.`}
    >
      <Text style={text}>
        Kullanıcı hesabınız için {productName} erişimi aktif edilmiştir.
        Artık hesabınız üzerinden uygulamayı indirebilirsiniz.
      </Text>
    </BaseEmail>
  );
}

export default AccessRequestApprovedEmail;
