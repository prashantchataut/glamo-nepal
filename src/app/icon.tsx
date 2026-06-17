import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "GLAMO Nepal";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          background: "#8B3A8F",
          fontFamily: "serif",
        }}
      >
        <span style={{ fontSize: 20, fontWeight: 700, color: "white" }}>G</span>
      </div>
    ),
    { ...size }
  );
}