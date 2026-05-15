import { Text } from "@react-email/components";
import { BaseEmail, text } from "./BaseEmail";

export function AdminAlertEmail({
  action,
  target,
}: {
  action: string;
  target: string;
}) {
  return (
    <BaseEmail preview="Admin işlem bildirimi." title="Admin işlem bildirimi.">
      <Text style={text}>
        Admin panelinde {action} işlemi çalıştı. Hedef kullanıcı: {target}.
      </Text>
    </BaseEmail>
  );
}

export default AdminAlertEmail;
