import { Text } from "@react-email/components";
import { BaseEmail, text } from "./BaseEmail";

export function NewDeviceActivatedEmail({
  deviceName,
  productName,
}: {
  deviceName?: string | null;
  productName: string;
}) {
  return (
    <BaseEmail
      preview="Yeni cihaz doğrulandı."
      title="Yeni cihaz hesabınıza bağlandı."
    >
      <Text style={text}>
        {productName} için {deviceName ?? "isimsiz cihaz"} doğrulandı. Bu işlem
        size ait değilse destek ekibiyle iletişime geçin.
      </Text>
    </BaseEmail>
  );
}

export default NewDeviceActivatedEmail;
