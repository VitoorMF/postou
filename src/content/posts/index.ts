export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  date: string; // ISO
  readTime: number; // minutos
  body: { type: "h2" | "p" | "ul" | "quote"; text?: string; items?: string[] }[];
}

export const posts: Post[] = [
  {
    slug: "carrosseis-instagram-que-convertem",
    title: "Como criar carrosséis no Instagram que realmente convertem",
    excerpt: "O carrossel é o formato com maior alcance médio do Instagram em 2026. Mas a maioria erra na primeira capa e perde 80% do potencial.",
    date: "2026-05-09",
    readTime: 5,
    body: [
      { type: "p", text: "Carrossel virou o formato favorito do algoritmo do Instagram. Tem mais alcance médio, mais tempo de leitura e tende a gerar mais salvamentos — métrica que conta muito no ranking de relevância." },
      { type: "p", text: "Mas a verdade é que a maioria das marcas trata carrossel como uma sequência de cards de design bonito. E perde a maior parte do potencial logo no primeiro slide." },

      { type: "h2", text: "1. A capa decide tudo" },
      { type: "p", text: "Você tem aproximadamente 1,3 segundo pra fazer alguém parar de rolar. Capa cheia de informação, fonte pequena ou frase genérica derruba o engajamento antes mesmo do conteúdo começar." },
      { type: "p", text: "Boas capas geralmente têm uma frase curta, contrastante e específica. \"5 erros que destroem seu carrossel\" performa melhor que \"Dicas pra fazer carrossel\"." },

      { type: "h2", text: "2. Crie continuidade entre os slides" },
      { type: "p", text: "Cada slide precisa de uma razão pra fazer a pessoa arrastar. Pode ser cliffhanger (\"o terceiro erro é o mais comum...\"), pode ser progressão lógica, pode ser revelação parcial. O importante é que o slide N+1 não funcione sem o slide N." },

      { type: "h2", text: "3. O último slide é o CTA, não a despedida" },
      { type: "p", text: "Muita gente fecha carrossel com \"obrigado por chegar até aqui!\" — que é simpático mas converte zero. Use o último slide pra direcionar: comentário, salvamento, link do bio, mensagem direta. Diga exatamente o que você quer." },

      { type: "h2", text: "4. Texto na imagem > legenda longa" },
      { type: "p", text: "Apenas uma minoria dos usuários expande a legenda. Coloque o conteúdo principal na imagem. A legenda complementa, contextualiza, gera comentários — mas não é onde a mensagem central vive." },

      { type: "quote", text: "Carrossel bom é uma história em camadas. Cada slide tem que ganhar o direito ao próximo." },

      { type: "h2", text: "Como o Postou ajuda" },
      { type: "p", text: "Toda essa estrutura — capa-anzol, progressão, CTA final, balanceamento texto/imagem — está integrada na geração automática do Postou. Você compartilha a novidade, e o sistema decide formato, número de slides e estrutura narrativa baseado no que tende a performar pro seu nicho." },
    ],
  },
  {
    slug: "horarios-postar-instagram-2026",
    title: "Os melhores horários pra postar no Instagram em 2026",
    excerpt: "Os horários \"mágicos\" mudaram nos últimos anos. Veja o que mostra a análise de mais de 1.400 contas brasileiras.",
    date: "2026-05-02",
    readTime: 4,
    body: [
      { type: "p", text: "A pergunta \"qual o melhor horário pra postar?\" parece simples mas tem uma resposta complicada: depende do seu nicho, do seu público e do tipo de conteúdo. Mas alguns padrões aparecem repetidamente." },

      { type: "h2", text: "O padrão geral no Brasil" },
      { type: "p", text: "Em média, os horários de maior engajamento orgânico no Instagram brasileiro em 2026 ficam entre:" },
      { type: "ul", items: [
        "Manhã: 7h-9h — gente checando o celular antes do trabalho",
        "Almoço: 11h30-13h30 — pausa no expediente",
        "Noite: 19h-22h — pico geral, especialmente quarta a domingo",
      ] },

      { type: "h2", text: "O que mudou" },
      { type: "p", text: "Até 2023, fim de semana era território de baixo alcance. Em 2026, com o algoritmo priorizando mais salvamentos e tempo de tela, sábado à noite e domingo de manhã viraram horários competitivos — especialmente pra conteúdo de lifestyle, fitness e nichos de hobby." },

      { type: "h2", text: "Por nicho" },
      { type: "ul", items: [
        "B2B / consultoria: terça e quarta, 8h-10h e 17h-19h",
        "Lifestyle / fitness: todos os dias 19h-21h",
        "Agro / produtor rural: 5h-7h e 20h-22h (jornada do campo é diferente)",
        "E-commerce / moda: quinta-feira à noite e sábado de tarde",
      ] },

      { type: "h2", text: "A regra real" },
      { type: "p", text: "O melhor horário pra você não está em nenhuma tabela genérica. Está nos insights da sua própria conta — quando seu público específico tá online. Mas se você ainda não tem dados suficientes, comece pelos padrões acima e itera." },

      { type: "h2", text: "Consistência > horário perfeito" },
      { type: "p", text: "Postar 5 vezes por semana no \"horário errado\" performa muito melhor que postar 1 vez no \"horário perfeito\". O algoritmo recompensa frequência. Esse é o motivo do Postou existir: tirar o atrito de produzir conteúdo todos os dias." },
    ],
  },
  {
    slug: "marca-pessoal-erro-comum",
    title: "Marca pessoal: o erro mais comum de quem está começando",
    excerpt: "Quase todo mundo erra a mesma coisa nos primeiros 6 meses de marca pessoal. E não tem nada a ver com design ou frequência de postagem.",
    date: "2026-04-21",
    readTime: 3,
    body: [
      { type: "p", text: "Conversei com mais de 50 profissionais construindo marca pessoal no último ano. Quase todos cometem o mesmo erro inicial — e nenhum percebe enquanto está fazendo." },

      { type: "h2", text: "O erro: tentar parecer maior do que é" },
      { type: "p", text: "Posts polidos demais. Linguagem corporativa em vez da própria voz. Cases de estudo de outras pessoas em vez do que aconteceu na semana. Tom de \"especialista internacional\" pra uma audiência de 200 seguidores." },
      { type: "p", text: "O resultado é uma página que parece de agência — e ninguém se conecta com agência. As pessoas seguem pessoas." },

      { type: "h2", text: "Por que isso acontece" },
      { type: "p", text: "É medo, basicamente. Medo de parecer pequeno, de admitir que tá começando, de mostrar processo em vez de resultado." },
      { type: "p", text: "Mas no Instagram de 2026, autenticidade entrega 3-5x mais engajamento que polish. Bastidor performa melhor que case de estudo. Erro contado vira ouro." },

      { type: "h2", text: "O que fazer em vez disso" },
      { type: "ul", items: [
        "Compartilhe o que aconteceu hoje na sua semana profissional — mesmo coisas \"pequenas\".",
        "Use a sua voz real. Se você fala \"cara\" e \"tipo\" em conversa, fale isso na legenda.",
        "Mostre o processo, não só o resultado. Como você chegou nessa solução? O que deu errado primeiro?",
        "Admita o que ainda não sabe. Posicionamento de \"aprendendo em público\" cria comunidade muito mais rápido que \"guru\".",
      ] },

      { type: "quote", text: "Ninguém quer seguir um perfil. Quer seguir uma pessoa." },

      { type: "h2", text: "A ironia" },
      { type: "p", text: "Quando você para de tentar parecer maior, geralmente é quando cresce. Os algoritmos premiam conversa real, e o público distingue muito rápido o que é genuíno do que é roteirizado." },
    ],
  },
];

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}

export function getAllSlugs(): string[] {
  return posts.map((p) => p.slug);
}
