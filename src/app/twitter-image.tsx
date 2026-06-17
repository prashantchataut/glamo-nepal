import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "GLAMO Nepal — Premium Beauty & Skincare";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1a1a1a 0%, #2d1b2e 50%, #1a1a1a 100%)",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 120,
            height: 120,
            borderRadius: 28,
            background: "#8B3A8F",
            marginBottom: 40,
          }}
        >
          <span style={{ fontSize: 72, fontWeight: 700, color: "white" }}>G</span>
        </div>
        <div style={{ display: "flex", fontSize: 64, fontWeight: 700, color: "white", letterSpacing: "0.05em" }}>
          GLAMO NEPAL
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#c4a882", marginTop: 16, letterSpacing: "0.15em", textTransform: "uppercase" }}>
          Premium Beauty &amp; Skincare
        </div>
        <div style={{ display: "flex", fontSize: 20, color: "#888", marginTop: 32 }}>
          Kathmandu, Nepal
        </div>
      </div>
    ),
    { ...size }
  );
}