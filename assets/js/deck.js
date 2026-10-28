/*
 * deck.js — motor das apresentações do Missão IA.
 *
 * Marcação:
 *   <main class="deck" data-deck="trilhas/verificar.html" data-root="../">
 *     <section class="slide" data-title="Abertura" data-steps="3">
 *       <div data-step="1">aparece no passo 1 e fica</div>
 *       <div data-step="1" data-until="2">aparece só no passo 1</div>
 *       <aside class="notes">roteiro de quem apresenta</aside>
 *
 * Modos (pela URL):  ?apresentador  ·  ?livre (estudo individual, sem rede)
 *                    nada = público, que só acompanha o apresentador.
 * Este arquivo só sabe mostrar slides; a rede fica no ao-vivo.js, que usa
 * a API window.Deck.
 */
(() => {
  const params = new URLSearchParams(location.search);
  const MODE = params.has('apresentador') ? 'apresentador' : params.has('livre') ? 'livre' : 'publico';
  const html = document.documentElement;
  const deck = document.querySelector('.deck');
  const slides = [...deck.querySelectorAll(':scope > .slide')];
  const NAME = deck.dataset.deck;
  const ROOT = deck.dataset.root || '';
  const KEY = 'missao-ia:' + NAME + ':';

  // Todas as apresentações do hub, para o menu e para o público seguir o apresentador.
  const DECKS = [
    ['apresentacao.html', 'Palestra · Potencialidades e armadilhas da IA'],
    ['trilhas/verificar.html', 'Trilha 1 · Fluente não é verdadeiro'],
    ['trilhas/tutor.html', 'Trilha 2 · Tutor, não atalho'],
    ['trilhas/dados.html', 'Trilha 3 · Meus dados, minha autoria'],
  ];

  const store = {
    get: (k) => { try { return localStorage.getItem(KEY + k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(KEY + k, v); } catch (e) {} },
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const stepsOf = (el) => Math.max(1, parseInt(el.dataset.steps || '1', 10));
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  let cur = -1, step = 0;
  let locked = MODE === 'publico';
  const listeners = [];
  html.classList.add('mode-' + MODE);
  html.classList.toggle('locked', locked);

  // ── Casos reais (dados em assets/data/casos.js) ──────────────────────
  deck.querySelectorAll('[data-casos]').forEach((box) => {
    const ids = box.dataset.casos ? box.dataset.casos.split(',') : null;
    const first = parseInt(box.dataset.firstStep, 10);
    const list = (window.CASOS || []).filter((c) => !ids || ids.includes(c.id));
    const step = (k) => (isNaN(first) ? '' : ` data-step="${first + k}"`);
    if (box.hasAttribute('data-shorts')) {
      // Carrossel: celulares lado a lado (data-reel) + informações do caso atual
      const n = list.length;
      box.innerHTML = `<div class="reel-stage" data-reel>${list.map((c, k) => `<div class="reel-item">${window.reelPhoneHTML(c, k, n, ROOT)}</div>`).join('')}</div>
        <div class="reel-info swap">${list.map((c, k) => window.reelInfoHTML(c, k, n, step(k) + ' data-only')).join('')}</div>`;
    } else box.innerHTML = list.map((c, k) => window.casoHTML(c, step(k))).join('');
  });

  // ── Escala do palco ──────────────────────────────────────────────────
  const layout = () => {
    const W = window.innerWidth, H = window.innerHeight;
    const portrait = H > W && W <= 900;
    html.classList.toggle('portrait', portrait);
    const w = portrait ? 720 : 1920;
    const h = portrait ? Math.max(1100, Math.round(720 * H / W)) : 1080;
    const k = Math.min(W / w, H / h);
    deck.style.width = w + 'px';
    deck.style.height = h + 'px';
    deck.style.transform = `translate(${(W - w * k) / 2}px, ${(H - h * k) / 2}px) scale(${k})`;
  };
  deck.style.left = deck.style.top = '0';
  layout();
  window.addEventListener('resize', layout);

  // ── Enquetes ─────────────────────────────────────────────────────────
  // Cada pessoa vota no próprio aparelho; o ao-vivo.js soma os votos no
  // apresentador e devolve as contagens para todos via Deck.setCounts().
  const polls = {};
  let counts = {};
  let mine = {};
  try { mine = JSON.parse(sessionStorage.getItem(KEY + 'votos') || '{}'); } catch (e) {}

  deck.querySelectorAll('.poll[data-poll]').forEach((p) => {
    const id = p.dataset.poll;
    const btns = [...p.querySelectorAll('button')];
    btns.forEach((b, k) => {
      b.type = 'button';
      b.innerHTML = `<i class="fill"></i><span>${b.innerHTML}</span><span class="pct">0%</span>`;
      b.addEventListener('click', () => vote(id, k));
    });
    const total = document.createElement('div');
    total.className = 'total';
    p.appendChild(total);
    polls[id] = { el: p, btns, total, show: parseInt(p.dataset.show || '0', 10), slide: slides.indexOf(p.closest('.slide')) };
  });

  // Monte a frase: cada .gap tem opções (data-opts) e a certa (data-ok).
  // Ao enviar, conta como voto numa enquete de 2 opções: 0 = acertou, 1 = errou.
  let picks = {};
  try { picks = JSON.parse(sessionStorage.getItem(KEY + 'frases') || '{}'); } catch (e) {}
  deck.querySelectorAll('.frase[data-poll]').forEach((f) => {
    const id = f.dataset.poll;
    const gaps = [...f.querySelectorAll('.gap')].map((g, n) => {
      const opts = g.dataset.opts.split('|');
      g.innerHTML = `<i>${n + 1}</i><b>${' '.repeat(8)}</b>`;
      return { el: g, opts, ok: parseInt(g.dataset.ok, 10) };
    });
    const sel = picks[id] || gaps.map(() => -1);
    const bank = document.createElement('div');
    bank.className = 'fr-bank';
    bank.innerHTML = gaps.map((g, n) => `<div class="fr-row"><i>${n + 1}</i>${g.opts.map((o, k) =>
      `<button type="button" data-g="${n}" data-k="${k}">${o}</button>`).join('')}</div>`).join('');
    const send = document.createElement('button');
    send.type = 'button';
    send.className = 'fr-send';
    const res = document.createElement('div');
    res.className = 'fr-res';
    f.append(bank, send, res);
    bank.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-g]');
      if (!b || mine[id] != null) return;
      sel[+b.dataset.g] = +b.dataset.k;
      renderPoll(id);
    });
    send.addEventListener('click', () => {
      if (mine[id] != null || sel.includes(-1)) return;
      picks[id] = sel;
      try { sessionStorage.setItem(KEY + 'frases', JSON.stringify(picks)); } catch (e) {}
      vote(id, gaps.every((g, n) => sel[n] === g.ok) ? 0 : 1);
    });
    polls[id] = { el: f, btns: [], size: 2, frase: { gaps, sel, bank, send, res }, show: parseInt(f.dataset.show || '0', 10), slide: slides.indexOf(f.closest('.slide')) };
  });

  const renderFrase = (id) => {
    const P = polls[id], F = P.frase;
    const c = counts[id] || [];
    const total = (c[0] || 0) + (c[1] || 0);
    const results = P.slide === cur && step >= P.show;
    const sent = mine[id] != null;
    F.gaps.forEach((g, n) => {
      const k = results ? g.ok : F.sel[n];
      g.el.querySelector('b').textContent = k >= 0 ? g.opts[k] : ' '.repeat(8);
      g.el.classList.toggle('filled', k >= 0);
      g.el.classList.toggle('ok', results);
    });
    F.bank.querySelectorAll('button').forEach((b) => {
      const g = F.gaps[+b.dataset.g], k = +b.dataset.k;
      b.classList.toggle('mine', F.sel[+b.dataset.g] === k);
      b.classList.toggle('right', results && g.ok === k);
      b.disabled = sent;
    });
    F.send.disabled = sent || F.sel.includes(-1);
    F.send.textContent = sent ? (mine[id] === 0 && results ? '✓ Você acertou' : mine[id] === 1 && results ? '✗ Compare com a frase certa' : '✓ Frase enviada') : 'Enviar minha frase';
    P.el.classList.toggle('sent', sent);
    P.el.classList.toggle('results', results);
    const pct = total ? Math.round((c[0] || 0) / total * 100) : 0;
    F.res.innerHTML = `<div class="fr-bar"><i style="width:${results ? pct : 0}%"></i></div><span><b>${results ? pct + '%' : '…'}</b> montou a frase certa · ${total === 1 ? '1 resposta' : total + ' respostas'}</span>`;
  };

  const renderPoll = (id) => {
    const P = polls[id];
    if (P.frase) return renderFrase(id);
    const c = counts[id] || [];
    const total = c.reduce((a, b) => a + (b || 0), 0);
    const results = P.slide === cur && step >= P.show;
    P.el.classList.toggle('results', results);
    P.btns.forEach((b, k) => {
      const pct = total ? Math.round((c[k] || 0) / total * 100) : 0;
      b.querySelector('.fill').style.width = (results ? pct : 0) + '%';
      b.querySelector('.pct').textContent = pct + '%';
      b.classList.toggle('mine', mine[id] === k);
      b.setAttribute('aria-pressed', mine[id] === k ? 'true' : 'false');
    });
    P.total.textContent = total === 1 ? '1 voto' : total + ' votos';
  };
  // Gráfico de diagnóstico: cada .qrow mostra os votos de uma enquete
  // Verdadeiro/Falso; data-answer é o índice da opção correta (0 = V, 1 = F).
  const renderQuiz = () => deck.querySelectorAll('.qrow[data-poll]').forEach((r) => {
    const c = counts[r.dataset.poll] || [];
    const v = c[0] || 0, f = c[1] || 0, t = v + f;
    const pv = t ? Math.round(v / t * 100) : 0;
    const pf = t ? 100 - pv : 0;
    const segV = r.querySelector('.seg.v'), segF = r.querySelector('.seg.f');
    segV.style.width = pv + '%';
    segF.style.width = pf + '%';
    segV.textContent = pv >= 12 ? '✓ ' + pv + '%' : '';
    segF.textContent = pf >= 12 ? '✗ ' + pf + '%' : '';
    const ok = r.dataset.answer === '0' ? pv : pf;
    r.querySelector('.hit').textContent = t ? ok + '% acertou' : 'sem votos';
  });
  const renderPolls = () => { Object.keys(polls).forEach(renderPoll); renderQuiz(); };

  const vote = (id, k) => {
    mine[id] = k;
    try { sessionStorage.setItem(KEY + 'votos', JSON.stringify(mine)); } catch (e) {}
    if (api.onVote) api.onVote(id, k);
    else { counts[id] = Array.from({ length: api.pollSize(id) }, (_, n) => (n === k ? 1 : 0)); }
    renderPoll(id);
  };

  // ── Campos salvos no aparelho e botões de copiar ─────────────────────
  deck.querySelectorAll('[data-save]').forEach((f) => {
    const k = 'campo:' + f.dataset.save;
    const v = store.get(k);
    if (v) f.value = v;
    f.addEventListener('input', () => store.set(k, f.value));
  });

  const copyText = (text, btn) => {
    const done = () => {
      const old = btn.textContent;
      btn.textContent = 'Copiado!';
      btn.classList.add('ok');
      setTimeout(() => { btn.textContent = old; btn.classList.remove('ok'); }, 1600);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, () => fallback());
    } else fallback();
    function fallback() {
      const t = document.createElement('textarea');
      t.value = text;
      t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t);
      t.select();
      try { document.execCommand('copy'); done(); } catch (e) {}
      t.remove();
    }
  };
  deck.querySelectorAll('.prompt').forEach((p) => {
    const btn = p.querySelector('.copy');
    if (btn) btn.addEventListener('click', () => copyText(p.querySelector('q').innerText.trim(), btn));
  });

  // ── Efeitos: título embaralhado e texto digitado ─────────────────────
  let timers = [];
  let raf = 0;
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const originals = new Map();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scramble = (el) => {
    if (!originals.has(el)) originals.set(el, el.textContent);
    const target = originals.get(el);
    if (reduced) { el.textContent = target; return; }
    const pool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    el.textContent = target.replace(/\S/g, ' ');
    later(() => {
      const t0 = performance.now();
      const tick = () => {
        const shown = Math.floor((performance.now() - t0) / 50);
        let out = '';
        for (let n = 0; n < target.length; n++) {
          const ch = target[n];
          out += !ch.trim() || n < shown ? ch : pool[(Math.random() * pool.length) | 0];
        }
        el.textContent = out;
        if (shown < target.length) raf = requestAnimationFrame(tick);
        else el.textContent = target;
      };
      raf = requestAnimationFrame(tick);
    }, 450);
  };

  // Digita palavra por palavra, como um chat de IA; ao fim restaura o HTML.
  // data-type="letras" digita letra por letra; data-type-delay atrasa o início;
  // data-keep-caret mantém o cursor piscando no fim.
  const typeText = (el) => {
    if (el.dataset.typed) return;
    el.dataset.typed = '1';
    if (!originals.has(el)) originals.set(el, el.innerHTML);
    if (reduced) { el.classList.add('done'); return; }
    const letters = el.dataset.type === 'letras';
    const parts = letters ? [...el.textContent.trim()] : el.textContent.trim().split(/(\s+)/);
    const chunk = letters ? 1 : 2;  // palavra + espaço seguinte
    el.textContent = '';
    el.classList.add('caret');
    let n = 0;
    const tick = () => {
      if (n >= parts.length) {
        el.innerHTML = originals.get(el);
        if (!el.hasAttribute('data-keep-caret')) el.classList.remove('caret');
        el.classList.add('done');
        return;
      }
      el.textContent += parts.slice(n, n + chunk).join('');
      n += chunk;
      later(tick, letters ? 80 + Math.random() * 90 : 45 + Math.random() * 70);
    };
    later(tick, parseInt(el.dataset.typeDelay || '500', 10));
  };

  const resetSlide = (el) => {
    timers.forEach(clearTimeout);
    timers = [];
    cancelAnimationFrame(raf);
    el.querySelectorAll('[data-typed]').forEach((t) => {
      delete t.dataset.typed;
      t.innerHTML = originals.get(t);
      t.classList.remove('caret', 'done');
    });
    el.querySelectorAll('[data-scramble]').forEach((t) => { if (originals.has(t)) t.textContent = originals.get(t); });
  };

  // ── Passos ───────────────────────────────────────────────────────────
  const applySteps = (el, s) => {
    el.dataset.s = s;
    const solo = el.dataset.stepMode === 'solo';
    el.querySelectorAll('[data-step]').forEach((x) => {
      const a = parseInt(x.dataset.step, 10);
      const b = x.dataset.until != null ? parseInt(x.dataset.until, 10)
        : solo || x.hasAttribute('data-only') ? a + 1 : Infinity;
      const on = s >= a && s < b;
      x.classList.toggle('on', on);
      x.classList.toggle('past', on && s > a);
    });
    // Carrossel: cada item sabe a que distância está do passo atual
    el.querySelectorAll('[data-reel]').forEach((r) => [...r.children].forEach((c, k) => {
      c.style.setProperty('--d', k - s);
      c.style.setProperty('--a', Math.min(Math.abs(k - s), 3));
      c.classList.toggle('cur', k === s);
    }));
    // Barras com largura (data-w) crescem quando ficam visíveis
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.querySelectorAll('.fill[data-w]').forEach((f) => {
        const box = f.closest('[data-step]');
        f.style.width = (!box || box.classList.contains('on')) ? f.dataset.w + '%' : '0';
      });
    }));
    el.querySelectorAll('[data-type]').forEach((t) => {
      const box = t.closest('[data-step]');
      if (!box || box.classList.contains('on')) typeText(t);
    });
  };

  const enter = (el) => {
    el.scrollTop = 0;
    el.querySelectorAll('.rise').forEach((r, n) => r.style.setProperty('--i', n));
    el.classList.remove('play');
    void el.offsetWidth;
    el.classList.add('play');
    el.querySelectorAll('[data-scramble]').forEach(scramble);
    el.querySelectorAll('.fill[data-w]').forEach((f) => { f.style.transition = 'none'; f.style.width = '0'; void f.offsetWidth; f.style.transition = ''; });
  };

  // ── Pop-ups: [data-pop] abre o .pop-body do card numa camada do slide.
  // O estado (pop-up aberto e cards já vistos) vai junto na sincronização.
  let extra = { pop: null, seen: [] };
  slides.forEach((el) => {
    if (!el.querySelector('[data-pop]')) return;
    const layer = document.createElement('div');
    layer.className = 'pop-layer';
    layer.innerHTML = '<div class="pop-box" role="dialog" aria-modal="true"><button type="button" class="pop-close" data-pop-close aria-label="Fechar">×</button><div class="pop-content"></div></div>';
    el.appendChild(layer);
  });
  const renderExtra = () => {
    deck.querySelectorAll('[data-pop]').forEach((c) => c.classList.toggle('seen', extra.seen.includes(c.dataset.pop)));
    deck.querySelectorAll('.pop-layer').forEach((layer) => {
      const card = extra.pop && layer.parentElement.querySelector(`[data-pop="${extra.pop}"]`);
      layer.classList.toggle('on', !!card);
      layer.dataset.kind = card ? (card.dataset.kind || '') : '';
      if (card) layer.querySelector('.pop-content').innerHTML = card.querySelector('.pop-body').innerHTML;
    });
  };
  const setExtra = (x, quiet) => {
    extra = { pop: x && x.pop || null, seen: (x && x.seen) || [] };
    renderExtra();
    if (!quiet) listeners.forEach((fn) => fn({ i: cur, s: step }));
  };
  deck.addEventListener('click', (e) => {
    if (locked) return;
    const card = e.target.closest('[data-pop]');
    if (card) {
      const id = card.dataset.pop;
      return setExtra({ pop: id, seen: extra.seen.includes(id) ? extra.seen : [...extra.seen, id] });
    }
    if (e.target.closest('[data-pop-close]') || e.target.classList.contains('pop-layer')) setExtra({ ...extra, pop: null });
  });

  const go = (i, s = 0) => {
    i = clamp(i | 0, 0, slides.length - 1);
    s = clamp(s | 0, 0, stepsOf(slides[i]) - 1);
    if (i === cur && s === step) return;
    const changed = i !== cur;
    if (changed && extra.pop) { extra = { ...extra, pop: null }; renderExtra(); }
    if (changed) {
      if (cur >= 0) resetSlide(slides[cur]);
      slides.forEach((el, n) => {
        el.classList.toggle('active', n === i);
        el.inert = n !== i;
        el.setAttribute('aria-hidden', n === i ? 'false' : 'true');
      });
    }
    cur = i;
    step = s;
    if (changed) enter(slides[i]);
    applySteps(slides[i], s);
    renderPolls();
    renderUI();
    if (MODE !== 'publico') history.replaceState(null, '', '#' + (i + 1) + (s ? '.' + s : ''));
    listeners.forEach((fn) => fn({ i, s }));
  };

  const next = () => {
    if (locked) return;
    if (step < stepsOf(slides[cur]) - 1) go(cur, step + 1);
    else if (cur < slides.length - 1) go(cur + 1, 0);
  };
  const prev = () => {
    if (locked) return;
    if (step > 0) go(cur, step - 1);
    else if (cur > 0) go(cur - 1, stepsOf(slides[cur - 1]) - 1);
  };

  // ── Interface fixa ───────────────────────────────────────────────────
  const ICON = {
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    full: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  };
  const ui = document.createElement('div');
  ui.id = 'ui';
  ui.innerHTML = `
    <div id="progress"></div>
    <div id="nav">
      ${MODE !== 'publico' ? `<button type="button" data-act="menu" aria-label="Sumário (M)" title="Sumário (M)">${ICON.menu}</button>
      <button type="button" data-act="notes" aria-label="Notas de quem apresenta (N)" title="Notas de quem apresenta (N)">NOTAS</button>` : `<a href="${ROOT}index.html" aria-label="Voltar ao hub" title="Voltar ao hub">HUB</a>`}
      <button type="button" class="nav-step" data-act="prev" aria-label="Anterior">${ICON.prev}</button>
      <span class="count" aria-live="polite"></span>
      <button type="button" class="nav-step" data-act="next" aria-label="Próximo">${ICON.next}</button>
      <button type="button" data-act="full" aria-label="Tela cheia (F)" title="Tela cheia (F)">${ICON.full}</button>
    </div>
    <div id="notes" role="note"></div>`;
  document.body.appendChild(ui);
  const $progress = ui.querySelector('#progress');
  const $count = ui.querySelector('.count');
  const $notes = ui.querySelector('#notes');

  const menu = document.createElement('div');
  menu.id = 'menu';
  menu.className = 'overlay';
  menu.setAttribute('role', 'dialog');
  menu.setAttribute('aria-label', 'Sumário');
  document.body.appendChild(menu);

  const link = (path) => ROOT + path + location.search;
  const renderMenu = () => {
    menu.innerHTML = `<div class="box">
      <h2>Sumário</h2>
      <ol>${slides.map((el, n) => `<li><button type="button" data-go="${n}" class="${n === cur ? 'cur' : ''}">${String(n + 1).padStart(2, '0')} · ${esc(el.dataset.title || 'Slide')}</button></li>`).join('')}</ol>
      <p><b>Ir para outra apresentação</b>${MODE === 'apresentador' ? ' — o público vai junto' : ''}:</p>
      <div class="decks">${DECKS.map(([p, t]) => `<a class="btn ${p === NAME ? '' : 'ghost'}" href="${link(p)}">${esc(t)}</a>`).join('')}</div>
      <div class="row"><a class="btn ghost" href="${ROOT}index.html">← Voltar ao hub</a><button type="button" class="btn" data-act="close">Fechar (Esc)</button></div>
    </div>`;
  };
  const openMenu = (on) => {
    if (on) renderMenu();
    menu.classList.toggle('on', on);
    if (on) { const c = menu.querySelector('.cur'); c && c.focus(); }
  };
  menu.addEventListener('click', (e) => {
    const b = e.target.closest('[data-go], [data-act="close"]');
    if (e.target === menu || (b && b.dataset.act === 'close')) return openMenu(false);
    if (b && !locked) { go(parseInt(b.dataset.go, 10), 0); openMenu(false); }
  });

  const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
  const toggleFull = () => {
    const r = document.documentElement;
    if (fsEl()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else {
      const req = r.requestFullscreen || r.webkitRequestFullscreen;
      if (req) Promise.resolve(req.call(r, { navigationUI: 'hide' })).catch(() => {});
    }
  };
  const toggleNotes = () => { $notes.classList.toggle('on'); renderUI(); };

  ui.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    ({ prev, next, full: toggleFull, notes: toggleNotes, menu: () => openMenu(true) })[b.dataset.act]();
  });

  const renderUI = () => {
    const sl = slides[cur];
    const total = slides.length;
    const n = stepsOf(sl);
    $progress.style.width = ((cur + (n > 1 ? step / n : 0)) / (total - 1 || 1) * 100) + '%';
    $count.textContent = `${cur + 1} / ${total}` + (n > 1 ? ` · ${step + 1}/${n}` : '');
    const notes = sl.querySelector('aside.notes');
    $notes.innerHTML = `<b>Notas · ${esc(sl.dataset.title || '')}</b>` + (notes ? notes.innerHTML : 'Sem notas para este slide.');
  };

  // ── Teclado, passador e toque ────────────────────────────────────────
  window.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target;
    if (t.closest && t.closest('input, textarea, select, [contenteditable="true"]')) return;
    const k = e.key;
    if (k === 'Escape' && menu.classList.contains('on')) return openMenu(false);
    if (k === 'Escape' && extra.pop && !locked) return setExtra({ ...extra, pop: null });
    if (k === 'f' || k === 'F') return toggleFull();
    if (MODE !== 'publico' && (k === 'n' || k === 'N')) return toggleNotes();
    if (MODE !== 'publico' && (k === 'm' || k === 'M')) return openMenu(!menu.classList.contains('on'));
    if (locked || menu.classList.contains('on')) return;
    const onButton = t.closest && t.closest('button, a');
    if (k === 'ArrowRight' || k === 'PageDown' || k === 'ArrowDown' || (k === ' ' && !onButton)) { e.preventDefault(); next(); }
    else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'ArrowUp') { e.preventDefault(); prev(); }
    else if (k === 'Home') go(0, 0);
    else if (k === 'End') go(slides.length - 1, 0);
  });

  let touch = null;
  window.addEventListener('touchstart', (e) => {
    const t = e.target;
    touch = (t.closest && t.closest('input, textarea, .sim .log, #ui, .overlay')) ? null : [e.touches[0].clientX, e.touches[0].clientY];
  }, { passive: true });
  window.addEventListener('touchend', (e) => {
    if (!touch || locked) return;
    const dx = e.changedTouches[0].clientX - touch[0];
    const dy = e.changedTouches[0].clientY - touch[1];
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) (dx < 0 ? next : prev)();
    touch = null;
  }, { passive: true });

  // ── API para o ao-vivo.js e para o simulador ─────────────────────────
  const api = {
    MODE, NAME, ROOT, DECKS, slides, store, link,
    get index() { return cur; },
    get step() { return step; },
    get locked() { return locked; },
    go, next, prev,
    setLocked(v) { locked = !!v; html.classList.toggle('locked', locked); },
    onChange(fn) { listeners.push(fn); },
    onVote: null,
    pollIds: () => Object.keys(polls),
    pollSize: (id) => (polls[id] ? polls[id].size || polls[id].btns.length : 0),
    setCounts(c) { counts = c || {}; renderPolls(); },
    get extra() { return extra; },
    setExtra,
  };
  window.Deck = api;

  const m = /^#(\d+)(?:\.(\d+))?$/.exec(location.hash);
  if (m && MODE !== 'publico') go(parseInt(m[1], 10) - 1, parseInt(m[2] || '0', 10));
  else go(0, 0);
})();
