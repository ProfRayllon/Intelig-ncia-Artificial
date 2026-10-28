/*
 * ao-vivo.js — sincronização ao vivo entre quem apresenta e o público.
 *
 * Apresentador: pagina.html?apresentador            (trilha: cria um código de sala)
 * Público:      pagina.html?sala=CODIGO             (a palestra usa a sala PALESTRA)
 * Controle remoto: abra a mesma URL do apresentador no celular — os dois
 * aparelhos ficam em sincronia, e o celular mostra as notas (botão NOTAS).
 *
 * O apresentador publica { apresentação, slide, passo, votos } em servidores
 * MQTT públicos (vários ao mesmo tempo, para um cair sem parar a
 * transmissão); o público assina o mesmo tópico e acompanha. A mensagem fica
 * retida, então quem entra depois cai no slide atual. Se o apresentador
 * troca de apresentação (palestra → trilha), o público vai junto.
 *
 * Votos são anônimos: cada aparelho tem um identificador aleatório que só
 * serve para não contar o mesmo voto duas vezes.
 */
(() => {
  const D = window.Deck;
  if (!D || D.MODE === 'livre') return;

  const params = new URLSearchParams(location.search);
  const IS_PRESENTER = D.MODE === 'apresentador';
  const NS = 'missao-ia/rayllon/';
  const MQTT_SRC = 'https://unpkg.com/mqtt@5.10.1/dist/mqtt.min.js';
  const QR_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
  // shiftr.io usa a porta 443, que passa em redes de celular e Wi-Fi que
  // bloqueiam as portas 8084/8081/8884 dos demais.
  const BROKERS = [
    ['wss://public.cloud.shiftr.io', { username: 'public', password: 'public' }],
    ['wss://broker.emqx.io:8084/mqtt'],
    ['wss://test.mosquitto.org:8081/mqtt'],
    ['wss://broker.hivemq.com:8884/mqtt'],
  ];
  const BEAT_MS = 5000;
  const FRESH_MS = 60000;            // estado mais velho que isso não puxa ninguém de página
  const BOOT = Date.now();
  const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rid = () => Math.random().toString(36).slice(2, 12);
  const newCode = () => Array.from({ length: 4 }, () => ALPHA[(Math.random() * ALPHA.length) | 0]).join('');
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ── Sala ─────────────────────────────────────────────────────────────
  let sala = (params.get('sala') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
  // ?nova: a palestra apresentada por outra pessoa ganha uma sala própria
  if (!sala && D.NAME === 'apresentacao.html' && !params.has('nova')) sala = 'PALESTRA';
  if (!sala && IS_PRESENTER) {
    sala = newCode();
    params.delete('nova');
    params.set('sala', sala);
    history.replaceState(null, '', '?' + params.toString().replace(/=(?=&|$)/g, '') + location.hash);
  }

  // Aparelho: mesmo id durante a sessão do navegador (recarregar não duplica votos)
  let me;
  try { me = sessionStorage.getItem('missao-ia:id') || rid(); sessionStorage.setItem('missao-ia:id', me); } catch (e) { me = rid(); }

  // ── Interface: selo e painéis ────────────────────────────────────────
  const pill = document.createElement('button');
  pill.type = 'button';
  pill.id = 'av-pill';
  pill.innerHTML = '<i></i><span></span>';
  document.body.appendChild(pill);
  const setPill = (state, text) => {
    pill.dataset.s = state;
    pill.querySelector('span').textContent = text;
  };

  const panel = document.createElement('div');
  panel.className = 'overlay';
  panel.setAttribute('role', 'dialog');
  document.body.appendChild(panel);
  const openPanel = (htmlStr) => { panel.innerHTML = `<div class="box">${htmlStr}</div>`; panel.classList.add('on'); };
  const closePanel = () => panel.classList.remove('on');
  panel.addEventListener('click', (e) => {
    if (e.target === panel || e.target.closest('[data-close]')) closePanel();
  });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePanel(); });

  // Público sem código de sala (trilha aberta direto): pede o código.
  if (!sala) {
    setPill('off', 'SEM SALA');
    const askCode = () => {
      openPanel(`
        <h2>Entrar na sala</h2>
        <p>Digite o código que aparece na tela de quem está apresentando.</p>
        <form id="av-join" class="row"><input name="c" maxlength="8" autocomplete="off" autocapitalize="characters" aria-label="Código da sala" placeholder="EX.: K7Q2" required><button class="btn">Entrar</button></form>
        <p>Sem apresentador? <a href="?livre">Estudar sozinho nesta trilha</a> · <a href="${D.ROOT}index.html">Voltar ao hub</a></p>`);
      panel.querySelector('#av-join').addEventListener('submit', (e) => {
        e.preventDefault();
        const c = e.target.c.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (c) location.search = '?sala=' + c;
      });
      panel.querySelector('input').focus();
    };
    pill.addEventListener('click', askCode);
    askCode();
    return;
  }

  const ROOM = NS + sala;
  const T_STATE = ROOM + '/estado';  // retido: apresentação, slide, passo, votos
  const T_HELLO = ROOM + '/publico'; // público avisa que está assistindo
  const T_VOTE = ROOM + '/voto';     // votos anônimos das enquetes

  // ── Rede ─────────────────────────────────────────────────────────────
  const loadScript = (src, global) => new Promise((resolve, reject) => {
    if (window[global]) return resolve(window[global]);
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve(window[global]);
    s.onerror = reject;
    document.head.appendChild(s);
  });

  // Uma conexão por servidor; cada uma se reconecta sozinha a cada 3s.
  const openBrokers = (mqtt, onMessage, onChange) => {
    let clients = [];
    const open = () => {
      clients = BROKERS.map(([url, auth]) => {
        const c = mqtt.connect(url, {
          ...auth,
          clientId: 'mia-' + rid(),
          reconnectPeriod: 3000, connectTimeout: 8000, keepalive: 30, clean: true,
        });
        c.on('connect', () => onChange(c, true));
        c.on('close', () => onChange(c, false));
        c.on('offline', () => onChange(c, false));
        c.on('error', () => {});
        c.on('message', (topic, buf) => {
          let msg;
          try { msg = JSON.parse(buf.toString()); } catch (e) { return; }
          if (msg && typeof msg === 'object') onMessage(topic, msg);
        });
        return c;
      });
    };
    open();
    return {
      live: () => clients.filter((c) => c.connected),
      send: (topic, obj, retain) => {
        const body = JSON.stringify(obj);
        clients.filter((c) => c.connected).forEach((c) => c.publish(topic, body, { qos: 0, retain: !!retain }));
      },
      reset: () => { clients.forEach((c) => c.end(true)); open(); },
    };
  };

  const followDeck = (path) => {
    const q = IS_PRESENTER ? '?apresentador&sala=' + sala : '?sala=' + sala;
    location.href = D.ROOT + path + q;
  };

  // ── Apresentador ─────────────────────────────────────────────────────
  const startPresenter = (mqtt) => {
    const VKEY = 'missao-ia:votos:' + sala;
    let votes = {};                // enquete → { aparelho: opção }
    try { votes = JSON.parse(sessionStorage.getItem(VKEY) || '{}'); } catch (e) {}
    const viewers = new Map();     // aparelho do público → último aviso
    let net = null;
    let last = '';
    let lastRemote = 0;
    let applying = false;
    let dimTimer;

    const tally = () => {
      const out = {};
      Object.keys(votes).forEach((p) => {
        const size = D.pollSize(p);
        if (!size) return;
        const arr = new Array(size).fill(0);
        Object.values(votes[p]).forEach((o) => { if (o >= 0 && o < size) arr[o]++; });
        out[p] = arr;
      });
      return out;
    };
    const record = (voter, p, o) => {
      if (!D.pollSize(p) || typeof o !== 'number') return;
      (votes[p] = votes[p] || {})[voter] = o;
      try { sessionStorage.setItem(VKEY, JSON.stringify(votes)); } catch (e) {}
      D.setCounts(tally());
      schedule();
    };
    D.onVote = (p, o) => { record(me, p, o); if (net) net.send(T_VOTE, { id: me, p, o }); };
    D.setCounts(tally());

    // hb = batimento: só confirma o estado, não comanda outros apresentadores.
    // dt = quando esta apresentação foi aberta: só uma troca mais recente puxa os outros.
    const snapshot = () => ({ d: D.NAME, i: D.index, s: D.step, v: tally(), x: D.extra });
    const publish = (hb) => net && net.send(T_STATE, { ...snapshot(), t: Date.now(), dt: BOOT, from: me, hb: hb ? 1 : 0 }, true);
    let synced = false;            // já mudamos algo aqui ou adotamos o estado de outro aparelho
    const broadcast = () => {
      const msg = JSON.stringify(snapshot());
      if (msg === last) return;
      last = msg;
      synced = true;
      publish(false);
    };
    let queued = false;
    const schedule = () => {
      if (queued || applying) return;
      queued = true;
      queueMicrotask(() => { queued = false; broadcast(); });
    };

    const render = () => {
      const now = Date.now();
      viewers.forEach((t, id) => { if (now - t > 3 * BEAT_MS + 2000) viewers.delete(id); });
      if (!net || !net.live().length) {
        setPill('off', `SALA ${sala} · SEM CONEXÃO`);
        pill.removeAttribute('data-dim');
        clearTimeout(dimTimer);
        return;
      }
      const msg = `AO VIVO · SALA ${sala} · ${viewers.size} assistindo`;
      if (pill.dataset.s === 'live' && pill.textContent === msg) return;
      setPill('live', msg);
      pill.removeAttribute('data-dim');
      clearTimeout(dimTimer);
      dimTimer = setTimeout(() => pill.setAttribute('data-dim', ''), 4000);
      const n = panel.querySelector('[data-viewers]');
      if (n) n.textContent = viewers.size;
    };

    let announced = false;
    net = openBrokers(mqtt, (topic, m) => {
      if (topic === T_HELLO && m.id) { viewers.set(m.id, Date.now()); render(); return; }
      if (topic === T_VOTE && m.id) { record(m.id, m.p, m.o); return; }
      // Outro aparelho do apresentador (controle remoto). Ao abrir, adota o
      // slide em que ele está; depois, segue só mudanças (não batimentos).
      if (topic === T_STATE && m.from && m.from !== me && typeof m.t === 'number') {
        if (m.t <= lastRemote || Date.now() - m.t > 3 * BEAT_MS) return;
        if (m.d !== D.NAME) { if (m.dt > BOOT) followDeck(m.d); return; }
        if (synced && m.hb) return;
        lastRemote = m.t;
        synced = true;
        applying = true;
        try { D.go(m.i, m.s); D.setExtra(m.x, true); } finally { applying = false; }
        last = JSON.stringify(snapshot());
      }
    }, (c, up) => {
      if (up) {
        c.subscribe([T_HELLO, T_VOTE, T_STATE]);
        // Espera um instante para adotar o estado de outro aparelho do apresentador.
        if (!announced) {
          announced = true;
          setTimeout(() => { synced = true; last = JSON.stringify(snapshot()); publish(false); }, 1500);
        } else publish(true);
      }
      render();
    });
    D.onChange(schedule);
    // Batimento: reenvia o estado para o público saber que estamos no ar.
    setInterval(() => { publish(true); render(); }, BEAT_MS);

    const viewerUrl = location.origin + location.pathname + '?sala=' + sala;
    const remoteUrl = location.origin + location.pathname + '?apresentador&sala=' + sala;
    pill.addEventListener('click', () => {
      openPanel(`
        <h2>Convide o público</h2>
        <div class="row" style="align-items:flex-start">
          <div class="qr" aria-hidden="true"></div>
          <div style="display:flex;flex-direction:column;gap:10px;flex:1;min-width:240px">
            <p>Código da sala</p>
            <div class="code">${esc(sala)}</div>
            <p><b data-viewers>${viewers.size}</b> aparelho(s) assistindo agora.</p>
          </div>
        </div>
        <p>Link para o público (ou entrar pelo hub com o código):</p>
        <div class="link">${esc(viewerUrl)}</div>
        <p><b>Controle remoto:</b> abra este outro link no seu celular para passar os slides e ler as notas sem mostrar no telão.</p>
        <div class="link">${esc(remoteUrl)}</div>
        <div class="row">
          <button type="button" class="btn" data-close>Fechar</button>
          <button type="button" class="btn ghost" data-reset>Reconectar</button>
        </div>`);
      panel.querySelector('[data-reset]').addEventListener('click', () => { setPill('off', 'RECONECTANDO…'); net.reset(); closePanel(); });
      loadScript(QR_SRC, 'qrcode').then((qrcode) => {
        const qr = qrcode(0, 'M');
        qr.addData(viewerUrl);
        qr.make();
        const box = panel.querySelector('.qr');
        if (box) box.innerHTML = qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
      }).catch(() => {});
    });
    render();
  };

  // ── Público ──────────────────────────────────────────────────────────
  const startViewer = (mqtt) => {
    let lastT = 0;        // carimbo do último estado aplicado
    let lastSeen = 0;     // quando recebemos algo fresco do apresentador
    let connected = false;
    // Abertura da apresentação mais recente que seguimos; sobrevive à troca de página.
    const DTKEY = 'missao-ia:dt:' + sala;
    let seenDt = 0;
    try { seenDt = parseInt(sessionStorage.getItem(DTKEY) || '0', 10); } catch (e) {}
    const renderPill = () => setPill(connected ? 'live' : 'off', connected ? `AO VIVO · SALA ${sala}` : 'AGUARDANDO APRESENTADOR');
    const check = () => {
      const was = connected;
      connected = Date.now() - lastSeen < 3 * BEAT_MS;
      if (was !== connected) renderPill();
    };
    const net = openBrokers(mqtt, (topic, m) => {
      if (topic !== T_STATE || typeof m.t !== 'number' || m.t < lastT) return;
      const fresh = Date.now() - m.t < FRESH_MS;
      if (m.d !== D.NAME) {
        // Um aparelho do apresentador que ficou para trás não puxa ninguém de volta.
        if (!fresh || (m.dt || 0) <= seenDt) return;
        try { sessionStorage.setItem(DTKEY, String(m.dt)); } catch (e) {}
        return followDeck(m.d);
      }
      if (fresh) lastSeen = Date.now();
      const changed = m.t !== lastT;
      lastT = m.t;
      if (changed) { D.go(m.i, m.s); D.setCounts(m.v); D.setExtra(m.x, true); }
      check();
    }, (c, up) => {
      if (up) {
        c.subscribe(T_STATE);
        c.publish(T_HELLO, JSON.stringify({ id: me }));
      }
    });
    D.onVote = (p, o) => net.send(T_VOTE, { id: me, p, o });
    setInterval(() => { net.send(T_HELLO, { id: me }); check(); }, BEAT_MS);
    pill.addEventListener('click', () => {
      openPanel(`
        <h2>${connected ? 'Você está ao vivo' : 'Aguardando quem apresenta'}</h2>
        <p>Sala <b>${esc(sala)}</b>. Os slides mudam sozinhos quando quem apresenta avança. Você pode votar nas enquetes e escrever nos campos — o que você escreve fica só neste aparelho.</p>
        <div class="row">
          <button type="button" class="btn" data-close>Continuar</button>
          <button type="button" class="btn ghost" data-reset>Reconectar</button>
          <a class="btn ghost" href="?livre">Estudar sozinho</a>
        </div>`);
      panel.querySelector('[data-reset]').addEventListener('click', () => { net.reset(); closePanel(); });
    });
    renderPill();
  };

  setPill('off', 'CONECTANDO…');
  loadScript(MQTT_SRC, 'mqtt').then((mqtt) => {
    if (IS_PRESENTER) startPresenter(mqtt);
    else startViewer(mqtt);
  }).catch(() => setPill('off', 'SEM CONEXÃO AO VIVO'));
})();
