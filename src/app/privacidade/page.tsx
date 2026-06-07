import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidade — Postou",
  description: "Como o Postou coleta, usa e protege seus dados pessoais.",
};

export default function Privacidade() {
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
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ display: "inline-block" }}>
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
          voltar
        </Link>

        <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.025em", marginBottom: 8 }}>Política de Privacidade</h1>
        <p style={{ color: "#888", fontSize: 14, marginBottom: 48 }}>Última atualização: 11 de maio de 2026</p>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>1. Introdução</h2>
          <p style={{ color: "#aaa" }}>
            Esta Política de Privacidade descreve como o Postou coleta, usa, armazena e compartilha dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
          </p>
          <p style={{ color: "#aaa", marginTop: 8 }}>
            O controlador dos dados é <b>Vitor Freire</b>, responsável pela operação do Postou. Para questões sobre tratamento de dados, o contato é <a href="mailto:contato@postou.app" style={{ color: "#6e8df0" }}>contato@postou.app</a>.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>2. Dados Coletados</h2>
          <p style={{ color: "#aaa", marginBottom: 8 }}>Coletamos os seguintes dados:</p>
          <ul style={{ color: "#aaa", paddingLeft: 24 }}>
            <li><b>Dados de cadastro:</b> nome, email e foto de perfil fornecidos pelo Google ao autenticar via OAuth.</li>
            <li><b>Dados de marca:</b> informações sobre seu negócio fornecidas por você (descrição, paleta, logo, tom de voz, restrições).</li>
            <li><b>Conteúdo enviado:</b> atualizações, fotos da persona e imagens que você compartilha para gerar posts.</li>
            <li><b>Conteúdo gerado:</b> posts, carrosséis e legendas produzidos pela IA a partir do seu input.</li>
            <li><b>Dados de uso:</b> logs de acesso, ações realizadas e métricas de uso da plataforma.</li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>3. Finalidade do Tratamento</h2>
          <p style={{ color: "#aaa", marginBottom: 8 }}>Tratamos seus dados para:</p>
          <ul style={{ color: "#aaa", paddingLeft: 24 }}>
            <li>Fornecer o serviço de geração de conteúdo personalizado.</li>
            <li>Autenticar e identificar usuários.</li>
            <li>Processar pagamentos quando aplicável.</li>
            <li>Melhorar a qualidade do serviço.</li>
            <li>Comunicar atualizações importantes sobre a plataforma.</li>
            <li>Cumprir obrigações legais e regulatórias.</li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>4. Base Legal</h2>
          <p style={{ color: "#aaa" }}>
            O tratamento dos seus dados é baseado nas seguintes hipóteses legais previstas na LGPD: execução do contrato (prestação do serviço), legítimo interesse (segurança e melhoria), consentimento (quando aplicável) e cumprimento de obrigação legal.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>5. Compartilhamento de Dados</h2>
          <p style={{ color: "#aaa", marginBottom: 8 }}>Compartilhamos dados estritamente necessários com:</p>
          <ul style={{ color: "#aaa", paddingLeft: 24 }}>
            <li><b>OpenAI:</b> para geração de texto e imagens via API. Os dados enviados não são usados para treinar modelos (conforme política de API da OpenAI).</li>
            <li><b>Supabase:</b> infraestrutura de banco de dados e autenticação.</li>
            <li><b>Google:</b> para autenticação OAuth.</li>
            <li><b>Autoridades:</b> quando exigido por lei ou ordem judicial.</li>
          </ul>
          <p style={{ color: "#aaa", marginTop: 8 }}>
            Não vendemos seus dados pessoais a terceiros.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>6. Seus Direitos (LGPD)</h2>
          <p style={{ color: "#aaa", marginBottom: 8 }}>Como titular dos dados, você tem direito a:</p>
          <ul style={{ color: "#aaa", paddingLeft: 24 }}>
            <li>Confirmar a existência de tratamento.</li>
            <li>Acessar seus dados.</li>
            <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
            <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários.</li>
            <li>Solicitar a portabilidade dos dados.</li>
            <li>Eliminar dados tratados com consentimento.</li>
            <li>Revogar o consentimento a qualquer momento.</li>
          </ul>
          <p style={{ color: "#aaa", marginTop: 8 }}>
            Para exercer qualquer desses direitos, entre em contato pelo canal indicado no rodapé.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>7. Retenção de Dados</h2>
          <p style={{ color: "#aaa" }}>
            Mantemos seus dados pelo tempo necessário para fornecer o serviço e cumprir obrigações legais. Ao deletar sua conta, removemos seus dados pessoais em até 30 dias, salvo obrigações de retenção previstas em lei.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>8. Segurança</h2>
          <p style={{ color: "#aaa" }}>
            Adotamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado, perda ou alteração. Apesar disso, nenhum sistema é 100% seguro — qualquer incidente relevante será comunicado conforme exigido pela LGPD.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>9. Cookies</h2>
          <p style={{ color: "#aaa" }}>
            Usamos cookies estritamente necessários para autenticação e funcionamento do serviço. Não utilizamos cookies de rastreamento publicitário.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>10. Alterações</h2>
          <p style={{ color: "#aaa" }}>
            Podemos atualizar esta Política periodicamente. Mudanças relevantes serão comunicadas por email ou pela plataforma.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>11. Contato</h2>
          <p style={{ color: "#aaa" }}>
            Para questões relacionadas a esta Política ou ao tratamento de dados pessoais, entre em contato pelo email <a href="mailto:contato@postou.app" style={{ color: "#6e8df0" }}>contato@postou.app</a>.
          </p>
        </section>
      </article>
    </main>
  );
}
