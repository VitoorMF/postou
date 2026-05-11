import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sobre — Postou",
  description: "Por que o Postou existe e quem está construindo.",
};

export default function Sobre() {
  return (
    <main style={{
      background: "#0a0a0c",
      color: "#e0e0e0",
      minHeight: "100vh",
      padding: "80px 24px",
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      lineHeight: 1.6,
    }}>
      <article style={{ maxWidth: 720, margin: "0 auto" }}>
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

        <h1 style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-0.025em", marginBottom: 16, lineHeight: 1.05 }}>
          Conteúdo deveria ser <span style={{ color: "#4169E1" }}>fácil</span>.
        </h1>
        <p style={{ color: "#888", fontSize: 19, marginBottom: 48, textWrap: "pretty" as React.CSSProperties["textWrap"] }}>
          O Postou nasceu pra resolver um problema simples: marcas pequenas e médias precisam estar presentes nas redes todos os dias, mas não têm tempo nem equipe pra produzir conteúdo nesse ritmo.
        </p>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 14 }}>Por que existimos</h2>
          <p style={{ color: "#aaa", marginBottom: 14 }}>
            Hoje a IA generativa permite produzir conteúdo em escala, mas a maioria das ferramentas força o usuário a escrever prompts complexos e ainda entrega resultado genérico — sem identidade, sem contexto, sem memória do que aconteceu na empresa ontem.
          </p>
          <p style={{ color: "#aaa" }}>
            O Postou aprende sobre a sua marca: o que você faz, como fala, quem é sua persona, o que está acontecendo no seu negócio. E transforma isso em posts prontos, todo dia, sem você precisar pensar.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 14 }}>Como funciona por baixo</h2>
          <p style={{ color: "#aaa", marginBottom: 14 }}>
            Cada novidade que você compartilha vira um vetor semântico de alta dimensão. Com o tempo, o sistema constrói uma memória contextual da sua marca — sabe o que já aconteceu, o que conecta com o quê, e o que ainda não virou conteúdo.
          </p>
          <p style={{ color: "#aaa" }}>
            Antes de gerar qualquer post, um agent decide: qual update tem mais potencial agora? Qual formato faz mais sentido? Quando os updates esgotam, ele sugere ângulos novos — dica, bastidor, reflexão — sempre respeitando o tom de voz e a identidade visual da marca.
          </p>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 14 }}>Quem está construindo</h2>
          <p style={{ color: "#aaa" }}>
            O Postou é construído por uma equipe pequena e enxuta, focada em produto e qualidade. Acreditamos que tecnologia bem feita não precisa ser complexa pra quem usa — só pra quem constrói.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 14 }}>Fale com a gente</h2>
          <p style={{ color: "#aaa" }}>
            Dúvidas, sugestões ou só quer trocar uma ideia sobre conteúdo e IA? Entre em contato pelo email <span style={{ color: "#6e8df0", fontWeight: 600 }}>contato@postou.com.br</span>.
          </p>
        </section>
      </article>
    </main>
  );
}
