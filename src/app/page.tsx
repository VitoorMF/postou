import type { Metadata } from "next";
import "./page.css";
import SignInButton from "@/components/SignInButton";
import HowItWorks from "@/components/HowItWorks";
import { HeroPhone, DemoTrigger } from "@/components/HeroPhone";
import LandingScripts from "@/components/LandingScripts";

export const metadata: Metadata = {
  title: "Postou — Sua IA de conteúdo para Instagram",
  description:
    "O Postou aprende sobre sua marca e cria posts, stories e carrosséis automaticamente para manter sua empresa ativa todos os dias.",
};

export default function Landing() {
  return (
    <>
      <div className="landing" id="landing-root">

        {/* Nav */}
        <header className="nav" id="nav" suppressHydrationWarning>
          <div className="nav-inner">
            <a href="#" className="logo">
              <span className="logo-mark"><span></span><span></span><span></span></span>
              <span>postou</span>
            </a>
            <nav className="nav-links">
              <a href="#recursos">Recursos</a>
              <a href="#como-funciona">Como funciona</a>
              <a href="#precos">Preços</a>
              <a href="#app">App</a>
            </nav>
            <div className="nav-cta">
              <SignInButton className="btn btn-ghost">Entrar</SignInButton>
              <SignInButton className="btn btn-primary nav-link-text">Começar grátis</SignInButton>
              <button className="hamburger" id="hamburger" aria-label="Abrir menu"><span></span></button>
            </div>
          </div>
        </header>

        <div className="mobile-nav" id="mobileNav">
          <a href="#recursos">Recursos</a>
          <a href="#como-funciona">Como funciona</a>
          <a href="#precos">Preços</a>
          <a href="#app">App</a>
          <SignInButton className="btn btn-primary btn-lg">Começar grátis</SignInButton>
        </div>

        {/* Hero */}
        <section className="hero">
          <div className="wrap hero-grid">
            <div className="hero-load">

              <h1>Sua empresa <span className="hl">postando</span> todos os dias.</h1>
              <p className="hero-sub">O Postou aprende sobre sua marca, cria os posts e entrega prontos no seu <b>WhatsApp</b>. Você só publica.</p>
              <div className="hero-ctas">
                <SignInButton className="btn btn-primary btn-lg">Criar meu primeiro post grátis</SignInButton>
                <DemoTrigger className="btn btn-ghost btn-lg">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                  Ver demonstração
                </DemoTrigger>
              </div>
              <div className="hero-meta">
                <div className="avatars"><span></span><span></span><span></span><span></span></div>
                <div>Grátis para começar · sem cartão</div>
              </div>
            </div>

            <HeroPhone />
          </div>
        </section>

        {/* Marquee
        <div className="marquee">
          <div className="marquee-track">
            <span><b>+8.2M</b> visualizações geradas</span><span className="sep"></span>
            <span><b>12.400</b> criadores ativos</span><span className="sep"></span>
            <span><b>4.9★</b> média no Trustpilot</span><span className="sep"></span>
            <span><b>+340 mil</b> carrosséis publicados</span><span className="sep"></span>
            <span><b>27 nichos</b> treinados</span><span className="sep"></span>
            <span><b>+8.2M</b> visualizações geradas</span><span className="sep"></span>
            <span><b>12.400</b> criadores ativos</span><span className="sep"></span>
            <span><b>4.9★</b> média no Trustpilot</span><span className="sep"></span>
            <span><b>+340 mil</b> carrosséis publicados</span><span className="sep"></span>
            <span><b>27 nichos</b> treinados</span><span className="sep"></span>
          </div>
        </div> */}

        {/* Marquee */}
        <div className="marquee">
          <div className="marquee-track">
            <span><b>Memória de marca</b></span><span className="sep"></span>
            <span><b>Posts automáticos</b></span><span className="sep"></span>
            <span><b>Stories, posts e carrosséis</b></span><span className="sep"></span>
            <span><b>Conteúdo diário</b></span><span className="sep"></span>
            <span><b>Identidade consistente</b></span><span className="sep"></span>
            <span><b>Pronto para publicar</b></span><span className="sep"></span>

            <span><b>Memória de marca</b></span><span className="sep"></span>
            <span><b>Posts automáticos</b></span><span className="sep"></span>
            <span><b>Stories, posts e carrosséis</b></span><span className="sep"></span>
            <span><b>Conteúdo diário</b></span><span className="sep"></span>
            <span><b>Identidade consistente</b></span><span className="sep"></span>
            <span><b>Pronto para publicar</b></span><span className="sep"></span>
          </div>
        </div>

        {/* Features */}
        <section id="recursos">
          <div className="wrap">
            <div className="sec-head reveal">
              <span className="sec-tag">Recursos</span>
              <h2>Seu conteúdo funcionando no automático.</h2>
              <p className="sec-sub">Da ideia ao carrossel pronto: copy, design e identidade visual em uma única ferramenta pensada para criadores brasileiros.</p>
            </div>
            <div className="features-grid stagger">
              <div className="feature">
                <div className="feat-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 9.91 8.26 3 9l5 4.87L6.18 21 12 17.77 17.82 21 16 13.87 21 9l-6.91-.74Z" /></svg>
                </div>
                <h3>Memória de marca</h3>
                <p>O Postou salva identidade visual, tom de voz e contexto para manter consistência em cada publicação.</p>
              </div>
              <div className="feature">
                <div className="feat-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M3 9h18M9 21V9" /></svg>
                </div>
                <h3>Geração inteligente</h3>
                <p>A IA decide formato, copy e visual com base nas novidades reais do seu negócio.</p>
              </div>
              <div className="feature">
                <div className="feat-icon">
                  <svg viewBox="0 0 512 512" fill="currentColor"><path d="M317.12 285.93c-9.69 3.96-15.88 19.13-22.16 26.88-3.22 3.97-7.06 4.59-12.01 2.6-36.37-14.49-64.25-38.76-84.32-72.23-3.4-5.19-2.79-9.29 1.31-14.11 6.06-7.14 13.68-15.25 15.32-24.87 3.64-21.28-24.18-87.29-60.92-57.38C48.62 232.97 330.7 461.46 381.61 337.88c14.4-35.03-48.43-58.53-64.49-51.95zM256 467.28c-37.39 0-74.18-9.94-106.39-28.76-5.17-3.03-11.42-3.83-17.2-2.26l-69.99 19.21 24.38-53.71a22.34 22.34 0 0 0-2.22-22.32C58.5 343.29 44.71 300.61 44.71 256c0-116.51 94.78-211.29 211.29-211.29S467.28 139.49 467.28 256c0 116.5-94.78 211.28-211.28 211.28zM256 0C114.84 0 0 114.84 0 256c0 49.66 14.1 97.35 40.89 138.74L2 480.39a22.37 22.37 0 0 0 3.34 23.76A22.403 22.403 0 0 0 22.36 512c14.42 0 93.05-24.71 113.06-30.2C172.41 501.59 213.9 512 256 512c141.15 0 256-114.85 256-256C512 114.84 397.15 0 256 0z" /></svg>
                </div>
                <h3>Chega no seu WhatsApp</h3>
                <p>O post pronto — imagem e legenda — chega todo dia no seu WhatsApp. É só publicar.</p>
              </div>
            </div>
          </div>
        </section>

        <HowItWorks />

        {/* Pricing */}
        <section id="precos">
          <div className="wrap">
            <div className="sec-head reveal">
              <span className="sec-tag">Preços</span>
              <h2>Comece grátis. Cresça quando quiser.</h2>
              <p className="sec-sub">Sem fidelidade. Cancele em dois cliques. Reembolso de 7 dias sem perguntas.</p>
            </div>
            <div className="price-grid stagger">
              <div className="plan reveal">
                <h3>Free</h3>
                <div className="plan-price"><b>R$0</b><span>/sempre</span></div>
                <p className="plan-desc">Para testar e descobrir se o Postou cabe na sua rotina.</p>
                <ul>
                  <li>1 post automático por semana</li>
                  <li>1 post manual por semana</li>
                  <li>Entrega no WhatsApp</li>
                </ul>
                <SignInButton className="btn btn-ghost">Criar conta grátis</SignInButton>
              </div>
              <div className="plan featured">
                <h3>Starter</h3>
                <div className="plan-price"><b>R$39</b><span>/mês</span></div>
                <p className="plan-desc">Para quem posta toda semana e quer crescer de verdade.</p>
                <ul>
                  <li>3 posts automáticos por semana</li>
                  <li>2 posts manuais por semana</li>
                  <li>1 carrossel por semana</li>
                </ul>
              </div>
              <div className="plan reveal">
                <h3>Pro</h3>
                <div className="plan-price"><b>R$89</b><span>/mês</span></div>
                <p className="plan-desc">Para quem posta todos os dias</p>
                <ul>
                  <li>Tudo do plano Starter</li>
                  <li>Posta todos os dias da semana</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* App (Em breve) */}
        <section className="app" id="app">
          <div className="wrap app-grid">
            <div className="reveal">
              <span className="sec-tag">Em breve</span>
              <h2 style={{ marginTop: 14 }}>Postou no seu bolso, a qualquer hora.</h2>
              <p className="sec-sub" style={{ maxWidth: 520 }}>Estamos finalizando os apps para iOS e Android. Crie carrosséis no ônibus, aprove no almoço e agende antes de dormir — tudo direto do celular.</p>
              <div className="app-badge-row">
                <a href="#" className="store-btn" aria-label="Em breve na App Store">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" /></svg>
                  <span className="store-txt"><small>Em breve na</small><b>App Store</b></span>
                </a>
                <a href="#" className="store-btn" aria-label="Em breve no Google Play">
                  <svg viewBox="0 0 512.086 512.086" aria-hidden="true">
                    <path fill="#2196f3" d="m281.963 245.846-247.68 247.68c-11.84-11.2-18.24-26.56-18.24-43.2V61.846c0-16.96 6.72-32.32 18.88-43.84l247.04 227.84z" />
                    <path fill="#ffc107" d="M496.043 256.086c0 22.4-12.16 42.24-32.32 53.44l-70.4 39.04-87.36-80.64-24-22.08 92.48-92.48 89.28 49.28c20.16 11.2 32.32 31.04 32.32 53.44z" />
                    <path fill="#4caf50" d="M281.963 245.846 34.923 18.006c3.2-3.2 7.36-6.08 11.52-8.64 20.16-12.16 44.48-12.48 65.28-.96l262.72 144.96-92.48 92.48z" />
                    <path fill="#f44336" d="m393.323 348.566-281.6 155.2c-9.92 5.76-21.12 8.32-32 8.32-11.52 0-23.04-2.88-33.28-9.28a58.212 58.212 0 0 1-12.16-9.28l247.68-247.68 24 22.08 87.36 80.64z" />
                  </svg>
                  <span className="store-txt"><small>Em breve no</small><b>Google Play</b></span>
                </a>
              </div>
              <div className="app-note">Enquanto o app não chega, você já pode usar tudo direto pelo navegador.</div>
            </div>

            <div className="app-stage reveal">
              <div className="mini-phones" aria-hidden="true">
                <div className="mini-phone ios">
                  <div className="mp-screen">
                    <span className="mp-os">iOS</span>
                    <span className="logo-mark mp-logo"><span></span><span></span><span></span></span>
                    <span className="mp-name">postou</span>
                    <span className="mp-sub">Em breve</span>
                  </div>
                </div>
                <div className="mini-phone and">
                  <div className="mp-screen">
                    <span className="mp-os">Android</span>
                    <span className="logo-mark mp-logo"><span></span><span></span><span></span></span>
                    <span className="mp-name">postou</span>
                    <span className="mp-sub">Em breve</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq">
          <div className="wrap">
            <div className="sec-head reveal">
              <span className="sec-tag">Dúvidas</span>
              <h2>Perguntas frequentes</h2>
            </div>
            <div className="faq-list reveal">
              <details className="faq-item">
                <summary>Preciso saber design ou escrever bem?<span className="faq-ic">+</span></summary>
                <p>Não. Você só conta o que aconteceu no seu negócio e a IA cria o post — imagem e legenda — já na identidade da sua marca.</p>
              </details>
              <details className="faq-item">
                <summary>O Postou posta sozinho no meu Instagram?<span className="faq-ic">+</span></summary>
                <p>Ele gera e entrega o post pronto no seu WhatsApp. A publicação final é sua — você confere, dá o último toque e posta quando quiser.</p>
              </details>
              <details className="faq-item">
                <summary>Funciona para o meu tipo de negócio?<span className="faq-ic">+</span></summary>
                <p>Sim. Seja restaurante, advogado, nutricionista, loja ou prestador de serviço, o Postou aprende o seu nicho e gera conteúdo relevante para ele.</p>
              </details>
              <details className="faq-item">
                <summary>E se eu não gostar do post?<span className="faq-ic">+</span></summary>
                <p>Você gera outro na hora ou edita a legenda direto no app. Nada é publicado sem você aprovar.</p>
              </details>
              <details className="faq-item">
                <summary>Preciso de cartão para usar o plano grátis?<span className="faq-ic">+</span></summary>
                <p>Não. O plano Free é gratuito para sempre, sem cartão. Você só assina se quiser mais gerações por semana.</p>
              </details>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta-sec" id="comecar">
          <div className="wrap">
            <div className="cta-inner reveal">
              <h2>Sua próxima postagem está a <span style={{ color: "var(--blue)" }}>um clique</span> daqui.</h2>
              <p>Junte-se às marcas que automatizaram sua produção de conteúdo com IA.</p>
              <div className="hero-ctas">
                <a href="#precos" className="btn btn-primary btn-lg">Começar agora</a>
                <a href="#como-funciona" className="btn btn-ghost btn-lg">Ver como funciona</a>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer>
          <div className="wrap">
            <div className="foot-grid">
              <div className="foot-brand">
                <a href="#" className="logo">
                  <span className="logo-mark lg"><span></span><span></span><span></span></span>
                  <span>postou</span>
                </a>
                <p>Conteúdo inteligente para marcas modernas.</p>
              </div>
              <div className="foot-col">
                <h4>Produto</h4>
                <ul>
                  <li><a href="#recursos">Recursos</a></li>
                  <li><a href="#como-funciona">Como funciona</a></li>
                  <li><a href="#precos">Preços</a></li>
                  <li><a href="#app">App</a></li>
                </ul>
              </div>
              <div className="foot-col">
                <h4>Empresa</h4>
                <ul>
                  <li><a href="/sobre">Sobre</a></li>
                  <li><a href="/blog">Blog</a></li>
                  <li><a href="mailto:contato@postou.app">Contato</a></li>
                </ul>
              </div>
              <div className="foot-col">
                <h4>Legal</h4>
                <ul>
                  <li><a href="/termos">Termos de uso</a></li>
                  <li><a href="/privacidade">Privacidade</a></li>
                </ul>
              </div>
            </div>
            <div className="foot-bot">
              <div>© 2026 Postou. Feito no Brasil 🇧🇷</div>
              <div className="socials">
                <a href="#" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg></a>
                <a href="#" aria-label="TikTok"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.6 6.3a4.8 4.8 0 0 1-3.4-1.4 4.8 4.8 0 0 1-1.4-3.3h-3.4v13.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .6 0 .8.1V9a6 6 0 1 0 5.2 5.9V8.6a8 8 0 0 0 4.8 1.6V6.3z" /></svg></a>
                <a href="#" aria-label="YouTube"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3z" /></svg></a>
              </div>
            </div>
          </div>
        </footer>

      </div>

      <LandingScripts />
    </>
  );
}
