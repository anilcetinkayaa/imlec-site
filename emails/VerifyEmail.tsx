import { Text } from "@react-email/components";
import { BaseEmail, mono, text } from "./BaseEmail";

export function VerifyEmail({ code }: { code: string }) {
  return (
    <BaseEmail preview="E-posta doğrulama kodunuz." title="E-postanızı doğrulayın.">
      <Text style={text}>Bu kod 10 dakika geçerlidir.</Text>
      <Text style={mono}>{code}</Text>
    </BaseEmail>
  );
}

export default VerifyEmail;
