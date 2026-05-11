import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termos de Uso — Postou",
  description: "Termos e condições de uso do Postou.",
};

export default function Termos() {
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
        <Link href="/" style={{ color: "#6e8df0", fontSize: 14, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 32 }}>
          ← voltar
        </Link>

        <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.025em", marginBottom: 8 }}>Termos de Uso</h1>
        <p style={{ color: "#888", fontSize: 14, marginBottom: 48 }}>Última atualização: 11 de maio de 2026</p>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>1. Aceitação dos Termos</h2>
          <p style={{ color: "#aaa" }}>
            Ao criar uma conta ou utilizar o Postou (&ldquo;serviço&rdquo;), você concorda com estes Termos de Uso. Se não concordar com qualquer cláusula, não utilize o serviço.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>2. Descrição do Serviço</h2>
          <p style={{ color: "#aaa" }}>
            O Postou é uma plataforma de geração automatizada de conteúdo para redes sociais usando inteligência artificial. Geramos posts, carrosséis e stories a partir de informações fornecidas pelo usuário sobre sua marca.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>3. Cadastro</h2>
          <p style={{ color: "#aaa" }}>
            Para usar o serviço, é necessário criar uma conta via Google OAuth. Você é responsável por manter a confidencialidade das suas credenciais e por todas as atividades realizadas em sua conta.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>4. Conteúdo Gerado por IA</h2>
          <p style={{ color: "#aaa", marginBottom: 8 }}>
            O conteúdo gerado pelo Postou é produzido por modelos de inteligência artificial. Reconhecemos que:
          </p>
          <ul style={{ color: "#aaa", paddingLeft: 24 }}>
            <li>O conteúdo pode conter imprecisões, erros ou informações desatualizadas.</li>
            <li>Cabe a você revisar todo o conteúdo antes de publicar.</li>
            <li>Não nos responsabilizamos pelo uso indevido ou consequências de publicações feitas com conteúdo gerado.</li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>5. Conteúdo do Usuário</h2>
          <p style={{ color: "#aaa" }}>
            Todo o conteúdo enviado por você (textos, imagens, paleta, logos, fotos de persona) permanece de sua propriedade. Você nos concede licença não exclusiva para processar esse conteúdo exclusivamente com a finalidade de fornecer o serviço.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>6. Conduta Proibida</h2>
          <p style={{ color: "#aaa", marginBottom: 8 }}>Você concorda em não utilizar o serviço para:</p>
          <ul style={{ color: "#aaa", paddingLeft: 24 }}>
            <li>Gerar conteúdo ilegal, difamatório, discriminatório ou que viole direitos de terceiros.</li>
            <li>Tentar acessar áreas restritas ou comprometer a segurança do sistema.</li>
            <li>Revender ou redistribuir o serviço sem autorização.</li>
            <li>Usar a identidade de outras pessoas sem permissão.</li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>7. Planos e Pagamentos</h2>
          <p style={{ color: "#aaa" }}>
            O Postou oferece planos gratuitos e pagos. Os valores e termos de cada plano estão descritos na página de Preços. Assinaturas pagas são cobradas mensalmente e podem ser canceladas a qualquer momento — o cancelamento entra em vigor no final do período já pago.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>8. Limitação de Responsabilidade</h2>
          <p style={{ color: "#aaa" }}>
            O serviço é fornecido &ldquo;como está&rdquo;. Não garantimos disponibilidade ininterrupta, ausência de erros ou que o conteúdo gerado atenderá objetivos comerciais específicos. Nossa responsabilidade limita-se ao valor pago pelo usuário nos 12 meses anteriores ao evento que originou a reclamação.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>9. Modificações</h2>
          <p style={{ color: "#aaa" }}>
            Podemos atualizar estes Termos a qualquer momento. Mudanças relevantes serão comunicadas por email ou pela própria plataforma. O uso continuado após a atualização constitui aceitação dos novos termos.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>10. Lei Aplicável</h2>
          <p style={{ color: "#aaa" }}>
            Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca do domicílio do usuário para dirimir quaisquer controvérsias.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>11. Contato</h2>
          <p style={{ color: "#aaa" }}>
            Dúvidas sobre estes Termos podem ser enviadas para nosso canal de contato indicado no rodapé do site.
          </p>
        </section>
      </article>
    </main>
  );
}
