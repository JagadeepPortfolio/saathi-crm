import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#FFF8F0",
          color: "#D97706",
          fontSize: 24,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          letterSpacing: -1,
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        S
      </div>
    ),
    { ...size }
  );
}
