import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, getAllSlugs } from "@/content/posts";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Post não encontrado" };
  return {
    title: `${post.title} — Postou`,
    description: post.excerpt,
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <main style={{
      background: "#0a0a0c",
      color: "#e0e0e0",
      minHeight: "100vh",
      padding: "80px 24px",
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      lineHeight: 1.65,
    }}>
      <article style={{ maxWidth: 720, margin: "0 auto" }}>
        <Link
          href="/blog"
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
          ← todos os posts
        </Link>

        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, fontSize: 13.5, color: "#666" }}>
          <span>{formatDate(post.date)}</span>
          <span style={{ color: "#444" }}>·</span>
          <span>{post.readTime} min de leitura</span>
        </div>

        <h1 style={{
          fontSize: 42,
          fontWeight: 800,
          letterSpacing: "-0.025em",
          lineHeight: 1.08,
          marginBottom: 40,
        }}>
          {post.title}
        </h1>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {post.body.map((block, i) => {
            if (block.type === "h2") {
              return (
                <h2 key={i} style={{
                  fontSize: 24,
                  fontWeight: 700,
                  letterSpacing: "-0.015em",
                  marginTop: 16,
                  marginBottom: 0,
                  color: "#fff",
                }}>
                  {block.text}
                </h2>
              );
            }
            if (block.type === "p") {
              return (
                <p key={i} style={{ color: "#bbb", fontSize: 17, margin: 0 }}>
                  {block.text}
                </p>
              );
            }
            if (block.type === "ul") {
              return (
                <ul key={i} style={{ color: "#bbb", fontSize: 17, paddingLeft: 24, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  {block.items?.map((it, j) => <li key={j}>{it}</li>)}
                </ul>
              );
            }
            if (block.type === "quote") {
              return (
                <blockquote key={i} style={{
                  borderLeft: "3px solid #4169E1",
                  paddingLeft: 20,
                  color: "#ddd",
                  fontSize: 19,
                  fontStyle: "italic",
                  fontWeight: 500,
                  margin: "8px 0",
                }}>
                  {block.text}
                </blockquote>
              );
            }
            return null;
          })}
        </div>

        <div style={{
          marginTop: 64,
          paddingTop: 32,
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          alignItems: "flex-start",
        }}>
          <p style={{ color: "#888", fontSize: 15, margin: 0 }}>Gostou? Compartilha com alguém que precisa ler.</p>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 22px",
              borderRadius: 999,
              background: "#4169E1",
              color: "#fff",
              fontSize: 14.5,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Conhecer o Postou →
          </Link>
        </div>
      </article>
    </main>
  );
}
