import { Text } from "@react-email/components";
import { BaseEmail, text } from "./BaseEmail";

export function WelcomeEmail({ name }: { name?: string | null }) {
  return (
    <BaseEmail
      preview="İmleç Yazılım hesabınız oluşturuldu."
      title="Hesabınız oluşturuldu."
    >
      <Text style={text}>
        Merhaba{name ? ` ${name}` : ""}, İmleç Yazılım hesabınız hazır. Ürün
        erişimi tanımlandığında indirme merkezi ve hesap paneli üzerinden
        FİŞ260 kurulum dosyasına erişebilirsiniz.
      </Text>
    </BaseEmail>
  );
}

export default WelcomeEmail;
