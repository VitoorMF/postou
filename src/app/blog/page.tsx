import type { Metadata } from "next";
import Link from "next/link";
import { posts, CATEGORIES } from "@/content/posts";

export const metadata: Metadata = {
  title: "Blog — Postou",
  description: "Conteúdo, IA e estratégia de marca pra quem quer estar presente nas redes todos os dias.",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogIndex({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const { cat } = await searchParams;
  const active = CATEGORIES.find((c) => c.slug === cat)?.slug ?? "";
  const filtered = active ? posts.filter((p) => p.category === active) : posts;
  const chips = [
    { slug: "", label: "Todos" },
    ...CATEGORIES.filter((c) => posts.some((p) => p.category === c.slug)),
  ];

  return (
    <main style={{
      background: "#0a0a0c",
      color: "#e0e0e0",
      minHeight: "100vh",
      padding: "80px 24px",
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Link
          href="/"
          style={{
            color: "#6e8df0",
            fontSize: 14,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 32,
          }}
        >
          ← voltar
        </Link>

        <h1 style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-0.025em", marginBottom: 12, lineHeight: 1.05 }}>
          Blog
        </h1>
        <p style={{ color: "#888", fontSize: 18, marginBottom: 32 }}>
          Conteúdo, IA e estratégia de marca pra quem quer estar presente todos os dias.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 48 }}>
          {chips.map((c) => {
            const on = c.slug === active;
            return (
              <Link
                key={c.slug || "todos"}
                href={c.slug ? `/blog?cat=${c.slug}` : "/blog"}
                style={{
                  padding: "8px 16px",
                  borderRadius: 999,
                  border: `1px solid ${on ? "#fff" : "rgba(255,255,255,0.12)"}`,
                  background: on ? "#fff" : "transparent",
                  color: on ? "#0a0a0c" : "#888",
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                {c.label}
              </Link>
            );
          })}
        </div>

        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                style={{
                  display: "block",
                  padding: "28px 0",
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  textDecoration: "none",
                  color: "inherit",
                  transition: "background 0.2s",
                }}
              >
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
                  <span style={{ color: "#666", fontSize: 13 }}>{formatDate(post.date)}</span>
                  <span style={{ color: "#444", fontSize: 13 }}>·</span>
                  <span style={{ color: "#666", fontSize: 13 }}>{post.readTime} min de leitura</span>
                </div>
                <h2 style={{
                  fontSize: 24,
                  fontWeight: 700,
                  letterSpacing: "-0.015em",
                  marginBottom: 8,
                  lineHeight: 1.2,
                }}>
                  {post.title}
                </h2>
                <p style={{ color: "#888", fontSize: 15.5, lineHeight: 1.55, margin: 0 }}>
                  {post.excerpt}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
