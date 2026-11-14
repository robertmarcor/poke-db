import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Home-screen icon: the lens (see .lens in shell.css) on the dark page colour.
// iOS needs a PNG with no transparency, so it is drawn here instead of reusing icon.svg.
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0a",
      }}
    >
      <div
        style={{
          width: 132,
          height: 132,
          borderRadius: "50%",
          border: "11px solid #f1f5f9",
          background:
            "radial-gradient(circle at 30% 30%, #fff 0%, #fff 8%, #7dd3fc 22%, #0284c7 70%)",
        }}
      />
    </div>,
    size,
  );
}
