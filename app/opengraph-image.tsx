import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0f1013",
          color: "white",
          padding: 72,
          fontFamily: "Arial",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            color: "#aeb4bf",
            fontSize: 28,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              border: "1px solid #414854",
              background: "#252a32",
            }}
          />
          İmleç Yazılım
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              color: "#67a5ff",
              fontSize: 24,
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            Desktop software platformu
          </div>
          <h1
            style={{
              maxWidth: 920,
              margin: "24px 0 0",
              fontSize: 72,
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            Muhasebe ve finans ekipleri için masaüstü yazılım ürünleri.
          </h1>
        </div>
      </div>
    ),
    size,
  );
}
