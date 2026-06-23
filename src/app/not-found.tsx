import type { Metadata } from "next";
import Link from "next/link";
import NotFoundActions from "@/components/NotFoundActions";

export const metadata: Metadata = {
  title: "Página não encontrada — Postou",
};

const square: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  borderRadius: "22%",
  boxShadow: "0 4px 10px rgba(0,0,0,.25)",
};

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0a0a0b",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "'Inter', -apple-system, system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {/* glow azul (igual o hero da landing) */}
      <div
        style={{
          position: "absolute",
          top: "-160px",
          left: "50%",
          transform: "translateX(-50%)",
          width: 760,
          height: 420,
          background: "radial-gradient(closest-side, rgba(65,105,225,.20), transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", textAlign: "center", maxWidth: 460 }}>
        {/* logo Postou (logo-mark + wordmark) */}
        <Link
          href="/"
          style={{ display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 36, textDecoration: "none", color: "#fff", letterSpacing: "-.02em" }}
        >
          <span style={{ position: "relative", width: 34, height: 34, flex: "none" }}>
            <span style={{ ...square, background: "#1A3580", transform: "translate(-7px,-3px) rotate(-14deg)" }} />
            <span style={{ ...square, background: "#2952B3", transform: "translate(-3px,-1px) rotate(-7deg)" }} />
            <span style={{ ...square, background: "#4169E1" }} />
          </span>
          <span style={{ fontWeight: 800, fontSize: 22 }}>postou</span>
        </Link>

        <p
          style={{
            fontSize: "clamp(80px, 18vw, 130px)",
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "-.05em",
            margin: 0,
            background: "linear-gradient(180deg, #ffffff, #9bb4ff)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          404
        </p>

        <h1 style={{ fontSize: 25, fontWeight: 800, letterSpacing: "-.02em", margin: "18px 0 0" }}>
          Essa página não existe
        </h1>
        <p style={{ fontSize: 16, color: "#8A8A8E", margin: "12px 0 30px", lineHeight: 1.55 }}>
          O link pode ter mudado de lugar — ou nunca existiu. Acontece nas melhores marcas.
        </p>

        <NotFoundActions />
      </div>
    </main>
  );
}
