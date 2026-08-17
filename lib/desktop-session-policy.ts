export function staleDesktopSessionWhere({
  userId,
  productId,
  deviceId,
  currentTokenHash,
}: {
  userId: string;
  productId: string;
  deviceId: string;
  currentTokenHash: string;
}) {
  return {
    userId,
    productId,
    deviceId,
    type: "DESKTOP" as const,
    revokedAt: null,
    NOT: { tokenHash: currentTokenHash },
  };
}
