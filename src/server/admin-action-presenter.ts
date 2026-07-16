export const ADMIN_ACTION_DEFINITIONS = {
  STAFF_ACCOUNT_CREATE: {
    label: "Personel hesabı oluşturuldu",
    category: "PERSONEL",
  },
  STAFF_PERMISSIONS_UPDATE: {
    label: "Personel yetkileri güncellendi",
    category: "PERSONEL",
  },
  USER_PASSWORD_RESET: {
    label: "Kullanıcı şifresi sıfırlandı",
    category: "GÜVENLİK",
  },
  ENTITLEMENT_GRANT: {
    label: "Ürün erişimi tanımlandı",
    category: "ERİŞİM",
  },
  ENTITLEMENT_REVOKE: {
    label: "Ürün erişimi kaldırıldı",
    category: "ERİŞİM",
  },
  CAMPAIGN_GRANT: {
    label: "Kampanya erişimi tanımlandı",
    category: "KAMPANYA",
  },
  DEVICE_REVOKE: {
    label: "Cihaz erişimi kaldırıldı",
    category: "CİHAZ",
  },
  DEVICE_REVOKE_ALL: {
    label: "Kullanıcının tüm cihazları kaldırıldı",
    category: "CİHAZ",
  },
  ACCESS_REQUEST_APPROVE: {
    label: "Erişim talebi onaylandı",
    category: "ERİŞİM",
  },
  ACCESS_REQUEST_REJECT: {
    label: "Erişim talebi reddedildi",
    category: "ERİŞİM",
  },
  PRODUCT_VERSION_UPSERT: {
    label: "Ürün sürümü yayınlandı veya güncellendi",
    category: "YAYIN",
  },
  ORGANIZATION_CREATE: {
    label: "Şirket hesabı oluşturuldu",
    category: "ŞİRKET",
  },
  ORGANIZATION_MEMBER_UPSERT: {
    label: "Şirket üyesi eklendi veya güncellendi",
    category: "ŞİRKET",
  },
} as const;

export const ADMIN_ACTION_CATEGORIES = [
  "PERSONEL",
  "ERİŞİM",
  "CİHAZ",
  "KAMPANYA",
  "YAYIN",
  "ŞİRKET",
  "GÜVENLİK",
] as const;

export function getAdminActionPresentation(action: string) {
  const definition =
    ADMIN_ACTION_DEFINITIONS[action as keyof typeof ADMIN_ACTION_DEFINITIONS];

  return (
    definition ?? {
      label: action.replaceAll("_", " ").toLocaleLowerCase("tr-TR"),
      category: "DİĞER",
    }
  );
}

export function getActionsForCategory(category: string | undefined) {
  if (!category) {
    return [];
  }

  return Object.entries(ADMIN_ACTION_DEFINITIONS)
    .filter(([, definition]) => definition.category === category)
    .map(([action]) => action);
}

const FIELD_LABELS: Record<string, string> = {
  name: "Ad soyad",
  username: "Kullanıcı adı",
  email: "E-posta",
  staffTitle: "Unvan",
  staffPermissions: "Yetkiler",
  role: "Rol",
  status: "Durum",
  reason: "Neden",
  expiresAt: "Bitiş tarihi",
  revokedAt: "Kaldırılma tarihi",
  version: "Sürüm",
  minimumVersion: "Minimum sürüm",
  filePath: "Dosya",
  productSlug: "Ürün",
  deviceName: "Cihaz",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function flattenSnapshot(value: unknown) {
  if (!isRecord(value)) {
    return {};
  }

  const flattened: Record<string, unknown> = {};

  for (const [key, item] of Object.entries(value)) {
    if (["id", "userId", "productId", "subscriptionId"].includes(key)) {
      continue;
    }

    if (isRecord(item)) {
      for (const [nestedKey, nestedItem] of Object.entries(item)) {
        if (!["id", "userId", "productId", "subscriptionId"].includes(nestedKey)) {
          flattened[nestedKey] = nestedItem;
        }
      }
      continue;
    }

    flattened[key] = item;
  }

  return flattened;
}

function comparable(value: unknown) {
  return JSON.stringify(value ?? null);
}

export function formatAdminActionValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "Yok";
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "Yok";
  }

  if (typeof value === "boolean") {
    return value ? "Evet" : "Hayır";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

export function getAdminActionChanges(before: unknown, after: unknown) {
  const beforeFields = flattenSnapshot(before);
  const afterFields = flattenSnapshot(after);
  const keys = [...new Set([...Object.keys(beforeFields), ...Object.keys(afterFields)])];

  return keys
    .filter((key) => comparable(beforeFields[key]) !== comparable(afterFields[key]))
    .slice(0, 12)
    .map((key) => ({
      key,
      label: FIELD_LABELS[key] ?? key.replaceAll("_", " "),
      before: formatAdminActionValue(beforeFields[key]),
      after: formatAdminActionValue(afterFields[key]),
    }));
}
