"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

const btnBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontWeight: 600,
  fontSize: 15,
  padding: "13px 24px",
  borderRadius: 999,
  textDecoration: "none",
  cursor: "pointer",
  fontFamily: "inherit",
};

export default function NotFoundActions() {
  const router = useRouter();

  function goBack() {
    // volta pra última página visitada; se não houver histórico, vai pro início
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/");
  }

  return (
    <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
      <button onClick={goBack} style={{ ...btnBase, background: "#4169E1", color: "#fff", border: "none" }}>
        ← Voltar
      </button>
      <Link href="/" style={{ ...btnBase, background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,.14)" }}>
        Página inicial
      </Link>
    </div>
  );
}
