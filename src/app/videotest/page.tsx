"use client";

import { useState } from "react";

export default function VideoTest() {
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    setVideoUrl(null);
    try {
      const res = await fetch("/api/videotest", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      setVideoUrl(data.url);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0a", color: "#fff",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: 24, padding: 24, fontFamily: "system-ui",
    }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Veo 3.1 — teste</h1>

      <button
        onClick={generate}
        disabled={loading}
        style={{
          padding: "12px 24px", borderRadius: 999,
          background: loading ? "#333" : "#137EFF",
          color: "#fff", border: "none", fontSize: 15, fontWeight: 600,
          cursor: loading ? "default" : "pointer",
        }}
      >
        {loading ? "Gerando… (1-2 min)" : "Gerar vídeo"}
      </button>

      {error && (
        <p style={{ color: "#f87171", fontSize: 14, maxWidth: 500, textAlign: "center" }}>{error}</p>
      )}

      {videoUrl && (
        <video
          src={videoUrl}
          controls
          autoPlay
          loop
          style={{ width: 360, aspectRatio: "9/16", borderRadius: 16, background: "#111" }}
        />
      )}
    </div>
  );
}
