import assert from "node:assert/strict";
import test from "node:test";

const {
  getAdminActionChanges,
  getAdminActionPresentation,
  getActionsForCategory,
} = await import("../src/server/admin-action-presenter.ts");

test("admin actions have readable labels and categories", () => {
  assert.deepEqual(getAdminActionPresentation("ENTITLEMENT_GRANT"), {
    label: "Ürün erişimi tanımlandı",
    category: "ERİŞİM",
  });
  assert.ok(getActionsForCategory("CİHAZ").includes("DEVICE_REVOKE"));
});

test("admin action snapshots produce field-level changes", () => {
  assert.deepEqual(
    getAdminActionChanges(
      { staffTitle: "Destek", staffPermissions: ["SUPPORT_VIEW"] },
      {
        staffTitle: "Operasyon",
        staffPermissions: ["SUPPORT_VIEW", "RELEASE_MANAGE"],
      },
    ),
    [
      {
        key: "staffTitle",
        label: "Unvan",
        before: "Destek",
        after: "Operasyon",
      },
      {
        key: "staffPermissions",
        label: "Yetkiler",
        before: "SUPPORT_VIEW",
        after: "SUPPORT_VIEW, RELEASE_MANAGE",
      },
    ],
  );
});
