/*
 * casos.js — casos reais e documentados de erros de IA.
 *
 * Regra editorial: só entra aqui o que tem fonte primária ou jornalística
 * confiável. Exemplos inventados para a oficina NÃO vão neste arquivo.
 * Ao editar, atualize "verificado" com a data da conferência dos links.
 */
window.CASOS_VERIFICADO = '27/10/2026';

window.CASOS = [
  {
    id: 'avianca',
    quando: 'EUA · junho de 2023',
    titulo: 'Processos judiciais que nunca existiram',
    resumo: 'No caso Mata v. Avianca, advogados apresentaram a um tribunal federal de Nova York uma petição com decisões judiciais inventadas pelo ChatGPT — com nomes, números e citações que pareciam reais. O juiz aplicou multa de US$ 5.000.',
    licao: 'Referência com cara de completa ainda precisa ser conferida.',
    fonte: 'Tribunal Distrital dos EUA (S.D.N.Y.), Opinion and Order on Sanctions, 22/06/2023',
    url: 'https://storage.courtlistener.com/recap/gov.uscourts.nysd.575368/gov.uscourts.nysd.575368.55.0_2.pdf',
  },
  {
    id: 'pizza',
    quando: 'EUA · maio de 2024',
    titulo: 'Cola para o queijo grudar na pizza',
    resumo: 'Os resumos de IA da busca do Google (AI Overviews) chegaram a sugerir usar cola para o queijo grudar na pizza, a partir de conteúdo de fórum e de sátira. O próprio Google explicou o problema e anunciou correções.',
    licao: 'A IA pode tratar piada ou opinião como se fosse orientação.',
    fonte: 'Google, “AI Overviews: About last week” — Liz Reid, 30/05/2024',
    url: 'https://blog.google/products/search/ai-overviews-update-may-2024/',
  },
  {
    id: 'aircanada',
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
