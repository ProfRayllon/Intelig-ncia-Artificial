/*
 * casos.js — casos reais e documentados de erros e usos indevidos de IA.
 *
 * Regra editorial: só entra aqui o que tem fonte primária ou jornalística
 * confiável. Exemplos inventados para a oficina NÃO vão neste arquivo.
 * Ao editar, atualize "verificado" com a data da conferência dos links.
 *
 * pais: 'br' (Brasil) ou 'mundo'. tema: rótulo curto do card estilo shorts.
 * foto: caminho opcional de uma imagem vertical (ex.: assets/img/casos/tse.jpg);
 * sem foto, o card usa um fundo azul.
 */
window.CASOS_VERIFICADO = '27/10/2026';

window.CASOS = [
  // ── Brasil ──────────────────────────────────────────────────────────
  {
    id: 'tse', pais: 'br', tema: 'Justiça Eleitoral', foto: '',
    quando: 'Brasília · abril de 2023',
    titulo: 'A petição que virou “fábula”',
    resumo: 'Um advogado pediu para entrar em um processo no TSE com uma petição escrita com o ChatGPT. O corregedor-geral da Justiça Eleitoral negou o pedido, chamou o texto de “fábula” e aplicou multa de R$ 2.604 por litigância de má-fé.',
    licao: 'Texto gerado por IA não substitui o trabalho de quem assina.',
    fonte: 'Migalhas, 19/04/2023',
    url: 'https://www.migalhas.com.br/quentes/385080/advogado-usa-chatgpt-em-peticao-e-e-multado-pelo-tse-fabula',
  },
  {
    id: 'trf1', pais: 'br', tema: 'Justiça Federal', foto: '',
    quando: 'Brasil · novembro de 2023',
    titulo: 'Sentença com jurisprudência inventada',
    resumo: 'A decisão de um juiz federal da 1ª Região citou um precedente do STJ que não existia, criado pelo ChatGPT. O erro foi descoberto pelo advogado da parte que perdeu o processo, e o CNJ abriu investigação.',
    licao: 'Até quem julga precisa conferir a fonte.',
    fonte: 'ConJur, 16/11/2023',
    url: 'https://www.conjur.com.br/2023-nov-16/chatgpt-inventando-precedente-e-a-terceirizacao-da-justica/',
  },
  {
    id: 'poa', pais: 'br', tema: 'Câmara Municipal', foto: '',
    quando: 'Porto Alegre (RS) · novembro de 2023',
    titulo: 'A lei que o ChatGPT escreveu',
    resumo: 'Um vereador apresentou um projeto de lei redigido pelo ChatGPT sem contar a ninguém. A Câmara aprovou por unanimidade e o prefeito sancionou. Só depois ele revelou a autoria — e o presidente da Câmara chamou o caso de “precedente perigoso”.',
    licao: 'Usar IA sem contar levanta a pergunta: de quem é a autoria?',
    fonte: 'Canaltech, 29/11/2023',
    url: 'https://canaltech.com.br/inteligencia-artificial/lei-escrita-pelo-chatgpt-e-aprovada-em-porto-alegre-271605/',
  },
  {
    id: 'drauzio', pais: 'br', tema: 'Golpes digitais', foto: '',
    quando: 'Brasil · fevereiro de 2026',
    titulo: 'Médico famoso “vendendo” remédio falso',
    resumo: 'Vídeos falsos feitos com IA imitavam o rosto e a voz do médico Drauzio Varella e de outros famosos para vender produtos de saúde sem aprovação. A Meta processou os anunciantes responsáveis.',
    licao: 'Ver e ouvir já não é prova: confira de onde veio o vídeo.',
    fonte: 'Tecnoblog, 26/02/2026',
    url: 'https://tecnoblog.net/noticias/meta-processa-golpistas-por-uso-de-videos-falsos-de-celebridades/',
  },
  {
    id: 'tst', pais: 'br', tema: 'Justiça do Trabalho', foto: '',
    quando: 'Brasília · março de 2026',
    titulo: 'Decisões falsas no TST',
    resumo: 'Uma empresa e seu advogado citaram decisões que nunca existiram, provavelmente geradas por IA. O Tribunal Superior do Trabalho concluiu que foi criação de conteúdo fictício para enganar a corte e multou os dois.',
    licao: 'Quem usa a resposta da IA responde por ela.',
    fonte: 'TST, 26/03/2026',
    url: 'https://www.tst.jus.br/-/empresa-e-advogado-sao-multados-por-uso-de-ia-com-decisoes-falsas',
  },

  // ── Mundo ───────────────────────────────────────────────────────────
  {
    id: 'avianca', pais: 'mundo', tema: 'Justiça', foto: '',
    quando: 'EUA · junho de 2023',
    titulo: 'Processos judiciais que nunca existiram',
    resumo: 'No caso Mata v. Avianca, advogados apresentaram a um tribunal federal de Nova York uma petição com decisões judiciais inventadas pelo ChatGPT — com nomes, números e citações que pareciam reais. O juiz aplicou multa de US$ 5.000.',
    licao: 'Referência com cara de completa ainda precisa ser conferida.',
    fonte: 'Tribunal Distrital dos EUA (S.D.N.Y.), Opinion and Order on Sanctions, 22/06/2023',
    url: 'https://storage.courtlistener.com/recap/gov.uscourts.nysd.575368/gov.uscourts.nysd.575368.55.0_2.pdf',
  },
  {
    id: 'pizza', pais: 'mundo', tema: 'Busca na internet', foto: '',
    quando: 'EUA · maio de 2024',
    titulo: 'Cola para o queijo grudar na pizza',
    resumo: 'Os resumos de IA da busca do Google (AI Overviews) chegaram a sugerir usar cola para o queijo grudar na pizza, a partir de conteúdo de fórum e de sátira. O próprio Google explicou o problema e anunciou correções.',
    licao: 'A IA pode tratar piada ou opinião como se fosse orientação.',
    fonte: 'Google, “AI Overviews: About last week” — Liz Reid, 30/05/2024',
    url: 'https://blog.google/products/search/ai-overviews-update-may-2024/',
  },
  {
    id: 'aircanada', pais: 'mundo', tema: 'Atendimento', foto: '',
    quando: 'Canadá · fevereiro de 2024',
    titulo: 'O chatbot inventou uma regra de reembolso',
    resumo: 'O assistente virtual da Air Canada disse a um passageiro que ele poderia pedir desconto por luto depois da viagem — o que a política da empresa não permitia. Um tribunal canadense decidiu que a companhia era responsável pelo que o chatbot informou.',
    licao: 'Quem usa a resposta da IA continua responsável por ela.',
    fonte: 'Civil Resolution Tribunal (BC), Moffatt v. Air Canada, 2024 BCCRT 149, 14/02/2024',
    url: 'https://decisions.civilresolutionbc.ca/crt/crtd/en/525448/1/document.do',
  },
];

window.casoHTML = (c, attrs = '') => `
  <article class="caso"${attrs}>
    <span class="when">${c.quando}</span>
    <h3>${c.titulo}</h3>
    <p>${c.resumo}</p>
    <p class="licao">${c.licao}</p>
    <a class="fonte" href="${c.url}" target="_blank" rel="noopener">Fonte: ${c.fonte} ↗</a>
  </article>`;

// Card estilo shorts: celular vertical à esquerda, informações à direita.
// k = posição do caso na sequência, n = total (para as barrinhas de progresso).
window.shortHTML = (c, k, n, attrs = '') => `
  <article class="short"${attrs}>
    <div class="phone"${c.foto ? ` style="background-image:url('${c.foto}')"` : ''}>
      <div class="ph-bars">${Array.from({ length: n }, (_, i) => `<i class="${i <= k ? 'on' : ''}"></i>`).join('')}</div>
      <span class="ph-tema">${c.tema}</span>
      <div class="ph-foot">
        <span class="ph-when">${c.quando}</span>
        <b class="ph-title">${c.titulo}</b>
        <span class="ph-tag">Caso real · ${c.pais === 'br' ? 'Brasil' : 'Mundo'}</span>
      </div>
    </div>
    <div class="info">
      <span class="kicker">Caso real ${k + 1} de ${n} · ${c.tema}</span>
      <p class="lead">${c.resumo}</p>
      <p class="licao">${c.licao}</p>
      <a class="fonte" href="${c.url}" target="_blank" rel="noopener">Fonte: ${c.fonte} ↗</a>
    </div>
  </article>`;
