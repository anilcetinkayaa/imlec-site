import { Button, Text } from "@react-email/components";
import { BaseEmail, text } from "./BaseEmail";

export function VerifyEmail({ verificationUrl }: { verificationUrl: string }) {
  return (
    <BaseEmail preview="E-posta adresinizi doğrulayın." title="E-postanızı doğrulayın.">
      <Text style={text}>
        İmleç Yazılım hesabınızı kullanmaya devam etmek için aşağıdaki düğmeye
        tıklayın. Bağlantı 24 saat geçerlidir.
      </Text>
      <Button href={verificationUrl} style={button}>
        E-posta adresimi doğrula
      </Button>
      <Text style={hint}>
        Bu hesabı siz oluşturmadıysanız bu e-postayı dikkate almayabilirsiniz.
      </Text>
    </BaseEmail>
  );
}

const button = {
  backgroundColor: "#2563eb",
  borderRadius: "8px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: "600",
  marginTop: "8px",
  padding: "12px 18px",
  textDecoration: "none",
};

const hint = {
  ...text,
  color: "#7b8492",
  fontSize: "12px",
  marginTop: "20px",
};

export default VerifyEmail;
