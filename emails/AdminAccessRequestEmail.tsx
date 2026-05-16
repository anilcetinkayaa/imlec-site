import { Text } from "@react-email/components";
import { BaseEmail, text } from "./BaseEmail";

export function AdminAccessRequestEmail({
  email,
  productName,
  requestedAt,
}: {
  email: string;
  productName: string;
  requestedAt: string;
}) {
  return (
    <BaseEmail preview="Yeni erişim talebi alındı." title="Yeni erişim talebi">
      <Text style={text}>Kullanıcı maili: {email}</Text>
      <Text style={text}>Ürün: {productName}</Text>
      <Text style={text}>Tarih: {requestedAt}</Text>
    </BaseEmail>
  );
}

export default AdminAccessRequestEmail;
