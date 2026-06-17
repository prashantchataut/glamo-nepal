import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "GLAMO Nepal";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 40,
          background: "#8B3A8F",
          fontFamily: "serif",
        }}
      >
        <span style={{ fontSize: 100, fontWeight: 700, color: "white" }}>G</span>
      </div>
    ),
    { ...size }
  );
}