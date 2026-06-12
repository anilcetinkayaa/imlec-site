import { UserRole } from "@prisma/client";

export const ADMIN_PERMISSIONS = [
  {
    key: "DASHBOARD_VIEW",
    label: "Yonetim ana sayfasini gor",
    group: "Genel",
  },
  {
    key: "STAFF_MANAGE",
    label: "Personel hesabi ve yetki yonet",
    group: "Ekip",
  },
  {
    key: "CUSTOMER_MANAGE",
    label: "Musteri hesaplarini gor ve yonet",
    group: "Musteri",
  },
  {
    key: "BILLING_VIEW",
    label: "Muhasebe, odeme ve iade ekranini gor",
    group: "Finans",
  },
  {
    key: "SUPPORT_VIEW",
    label: "Destek ve fis hata bildirimlerini gor",
    group: "Destek",
  },
  {
    key: "FEATURE_SUGGESTION_MANAGE",
    label: "Ozellik onerilerini onayla ve yonet",
    group: "Urun",
  },
  {
    key: "SECURITY_VIEW",
    label: "Guvenlik ve cihaz olaylarini gor",
    group: "Guvenlik",
  },
  {
    key: "CAMPAIGN_MANAGE",
    label: "Kampanya ve manuel erisim yonet",
    group: "Pazarlama",
  },
  {
    key: "RELEASE_MANAGE",
    label: "Surum, duyuru ve launcher yayinlarini yonet",
    group: "Yayin",
  },
  {
    key: "ORGANIZATION_MANAGE",
    label: "Sirket ve paket hesaplarini yonet",
    group: "Kurumsal",
  },
  {
    key: "LEMONSQUEEZY_VIEW",
    label: "Lemon Squeezy kayitlarini gor",
    group: "Finans",
  },
] as const;

export type AdminPermissionKey = (typeof ADMIN_PERMISSIONS)[number]["key"];

export const ALL_ADMIN_PERMISSION_KEYS = ADMIN_PERMISSIONS.map(
  (permission) => permission.key,
) as AdminPermissionKey[];

export function roleLabel(role: UserRole) {
  switch (role) {
    case UserRole.OWNER:
    case UserRole.ADMIN:
      return "Firma Sahibi";
    case UserRole.SUPPORT:
      return "Personel";
    default:
      return "Musteri";
  }
}

export function normalizeStaffUsername(value: string) {
  return value
    .trim()
    .toLocaleUpperCase("tr-TR")
    .replace(/İ/g, "I")
    .replace(/Ğ/g, "G")
    .replace(/Ü/g, "U")
    .replace(/Ş/g, "S")
    .replace(/Ö/g, "O")
    .replace(/Ç/g, "C")
    .replace(/[^A-Z0-9._-]/g, "")
    .slice(0, 32);
}

export function makeStaffUsername(fullName: string) {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length < 2) {
    return normalizeStaffUsername(fullName);
  }

  const first = parts[0]?.charAt(0) ?? "";
  const last = parts[parts.length - 1] ?? "";
  return normalizeStaffUsername(`${first}${last}`);
}

export function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 12; i += 1) {
    password += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return password;
}

export function canUsePermission({
  role,
  staffPermissions,
  permission,
}: {
  role: UserRole;
  staffPermissions?: string[] | null;
  permission: AdminPermissionKey;
}) {
  if (role === UserRole.OWNER || role === UserRole.ADMIN) {
    return true;
  }

  return Boolean(staffPermissions?.includes(permission));
}
