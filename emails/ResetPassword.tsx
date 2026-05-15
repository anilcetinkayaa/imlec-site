import { Button, Text } from "@react-email/components";
import { BaseEmail, text } from "./BaseEmail";

export function ResetPassword({ resetUrl }: { resetUrl: string }) {
  return (
    <BaseEmail preview="Şifre sıfırlama talebi." title="Şifrenizi sıfırlayın.">
      <Text style={text}>
        Şifre sıfırlama talebi aldıysanız aşağıdaki bağlantıdan yeni şifre
        belirleyebilirsiniz.
      </Text>
      <Button href={resetUrl} style={button}>
        Şifreyi sıfırla
      </Button>
    </BaseEmail>
  );
}

const button = {
  display: "inline-block",
  backgroundColor: "#f5f5f5",
  color: "#0f1013",
  borderRadius: "8px",
  padding: "12px 16px",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
};

export default ResetPassword;
