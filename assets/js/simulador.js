/*
 * simulador.js — conversas pré-programadas para o experimento A/B.
 * Não usa IA de verdade nem internet: serve quando não há acesso a uma IA
 * no laboratório. Toda tela que usa o simulador mostra o rótulo SIMULAÇÃO.
 *
 * Uso: <div class="sim" data-sim="a"></div>  (a = resposta pronta, b = tutor)
 */
(() => {
  const QUESTAO = 'Uma loja dá 20% de desconto em um tênis de R$ 200 e, no caixa, mais 10% sobre o novo preço. O desconto total foi de 30%?';

  const ROTEIROS = {
    a: [
      ['me', 'Resolva esta questão e me dê a resposta: ' + QUESTAO],
      ['ai', 'Não. O desconto total foi de 28%. Primeiro desconto: R$ 200 − 20% = R$ 160. Segundo: R$ 160 − 10% = R$ 144. Desconto total: R$ 56, que é 28% de R$ 200.'],
      ['fim', 'Fim da conversa. A resposta está certa — mas quem fez o raciocínio?'],
    ],
    b: [
      ['me', 'Atue como tutor: faça perguntas, dê pistas graduais e não entregue a resposta antes de eu tentar. ' + QUESTAO],
      ['ai', 'Vamos lá! Antes de calcular: o segundo desconto de 10% é calculado sobre qual valor — os R$ 200 originais ou outro?'],
      ['me', 'Sobre os R$ 200?'],
      ['ai', 'Releia o trecho “mais 10% sobre o novo preço”. Qual é o novo preço depois dos 20%?'],
      ['me', 'R$ 160.'],
      ['ai', 'Isso! E quanto é 10% de R$ 160? Quanto o tênis passa a custar?'],
      ['me', 'R$ 16. Fica R$ 144.'],
      ['ai', 'Perfeito. Último passo: de quanto foi o desconto total em reais? Que porcentagem isso é de R$ 200?'],
      ['me', 'R$ 56… dá 28%! Então não foi 30%.'],
      ['ai', 'Exatamente. E por que você acha que somar 20% + 10% não funciona aqui?'],
      ['fim', 'Fim da conversa. Quem chegou ao 28%?'],
    ],
  };

  document.querySelectorAll('.sim[data-sim]').forEach((box) => {
    const script = ROTEIROS[box.dataset.sim];
    if (!script) return;
    box.innerHTML = `
      <span class="label-sim">Simulação · conversa pré-programada</span>
      <div class="log chat" aria-live="polite"></div>
      <div class="ctrl">
        <button type="button" class="btn" data-sim-next>Próxima mensagem</button>
        <button type="button" class="btn ghost" data-sim-reset>Recomeçar</button>
      </div>`;
    const log = box.querySelector('.log');
    const nextBtn = box.querySelector('[data-sim-next]');
    let n = 0;
    const show = () => {
      const [who, text] = script[n++];
      const b = document.createElement('div');
      if (who === 'fim') {
        b.className = 'small';
        b.style.fontWeight = '800';
        b.textContent = text;
      } else {
        b.className = 'bubble ' + who;
        b.innerHTML = `<span class="who">${who === 'me' ? 'Estudante' : 'IA (simulada)'}</span>`;
        b.appendChild(document.createTextNode(text));
      }
      log.appendChild(b);
      log.scrollTop = log.scrollHeight;
      nextBtn.disabled = n >= script.length;
      nextBtn.style.opacity = nextBtn.disabled ? '.4' : '';
    };
    nextBtn.addEventListener('click', () => { if (n < script.length) show(); });
    box.querySelector('[data-sim-reset]').addEventListener('click', () => { log.innerHTML = ''; n = 0; show(); });
    show();
  });
})();
