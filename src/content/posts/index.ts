import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  date: string; // ISO (mantido como string no frontmatter)
  readTime: number; // minutos
  category?: string;
  featured?: boolean; // aparece em "Guias em destaque" na landing
  content: string; // corpo em markdown
}

const DIR = path.join(process.cwd(), "src/content/posts");

function estimateReadTime(md: string): number {
  const words = md.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function load(): Post[] {
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".md"));
  const list = files.map((file) => {
    const raw = fs.readFileSync(path.join(DIR, file), "utf8");
    const { data, content } = matter(raw);
    return {
      slug: (data.slug as string) ?? file.replace(/\.md$/, ""),
      title: data.title as string,
      excerpt: (data.excerpt as string) ?? "",
      date: String(data.date),
      readTime: (data.readTime as number) ?? estimateReadTime(content),
      category: data.category as string | undefined,
      featured: data.featured === true,
      content,
    } satisfies Post;
  });
  // mais novo primeiro
  return list.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export const posts: Post[] = load();

// categorias da central de ajuda (filtros). Contagem é calculada do conteúdo real.
export const CATEGORIES: { slug: string; label: string; desc: string }[] = [
  { slug: "primeiros-passos", label: "Primeiros passos", desc: "Configure sua marca e gere o primeiro post." },
  { slug: "geracao", label: "Geração de conteúdo", desc: "Posts, stories e carrosséis no automático." },
  { slug: "marca", label: "Sua marca", desc: "Brand kit, tom de voz, paleta e personas." },
  { slug: "whatsapp", label: "WhatsApp & app", desc: "Entrega no WhatsApp e o assistente." },
  { slug: "planos", label: "Planos & cobrança", desc: "Assinatura, upgrade, reembolso e limites." },
];

export function countByCategory(slug: string): number {
  return posts.filter((p) => p.category === slug).length;
}

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}

export function getAllSlugs(): string[] {
  return posts.map((p) => p.slug);
}
