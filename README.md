# Missão IA — Potencialidades e armadilhas da IA no estudo

Hub da oficina: palestra ao vivo, três trilhas para estudantes multiplicadores, criador de desafios e kit desplugado para imprimir. Site estático: não precisa de build, login nem chave de API.

## Páginas

| Página | Para quê |
|---|---|
| `index.html` | Hub: entrada da turma, trilhas, ferramentas, casos reais |
| `apresentacao.html` | Palestra principal (28 slides) |
| `trilhas/verificar.html` | Trilha 1 · Fluente não é verdadeiro |
| `trilhas/tutor.html` | Trilha 2 · Tutor, não atalho |
| `trilhas/dados.html` | Trilha 3 · Meus dados, minha autoria |
| `criar-desafio.html` | Criador de desafios (4 campos, validação, copiar/baixar/imprimir) |
| `kit.html` | Kit do multiplicador para A4 (roteiros, cartas, fichas, rubrica) |

## Modo ao vivo

- **Palestra (você):** `apresentacao.html?apresentador` — usa a sala fixa `PALESTRA`. Esse link não aparece no hub de propósito.
- **Público da palestra:** `apresentacao.html` (ou o botão "Assistir à palestra ao vivo" no hub).
- **Trilhas:** o botão "Apresentar" do hub abre `?apresentador` e cria um código de sala (ex.: `K7Q2`). A turma entra pelo QR code ou digitando o código no hub.
- **Controle remoto:** abra no celular o mesmo link do apresentador (aparece ao clicar no selo AO VIVO). Os dois aparelhos ficam sincronizados e o celular mostra as notas.
- **Trocar de apresentação:** pelo sumário (tecla `M`) o apresentador abre uma trilha na mesma sala e o público vai junto.
- **Sem apresentador:** `?livre` deixa navegar sozinho, sem rede.

Teclas: `→`/`←` (ou passador) avançar e voltar · `F` tela cheia · `N` notas · `M` sumário.

A sincronização usa servidores MQTT públicos (vários ao mesmo tempo, incluindo um na porta 443). Votos são anônimos; o que se escreve nos campos fica só no aparelho de cada pessoa.

## Como editar

- **Slides:** cada `<section class="slide">` é um slide. `data-steps="3"` define quantos cliques ele tem; elementos com `data-step="n"` aparecem no clique `n` (`data-until="m"` some no clique `m`). As notas de quem apresenta ficam em `<aside class="notes">`.
- **Enquete:** `<div class="poll" data-poll="id-unico" data-show="1"><button>Opção</button>…</div>` — `data-show` é o clique em que o resultado aparece. Use ids diferentes em cada apresentação.
- **Casos reais:** `assets/data/casos.js`. Só entra caso com fonte verificável; atualize `CASOS_VERIFICADO` ao conferir os links.
- **Conversas simuladas:** `assets/js/simulador.js`.
- **Cores e fontes:** `assets/css/base.css`.

Depois de mudar CSS ou JS, aumente o `?v=` nas tags `<link>`/`<script>` para os celulares baixarem a versão nova.

## Testar localmente

```
python -m http.server 8000
```

Abra `http://localhost:8000`. Para testar o ao vivo, abra uma aba com `?apresentador&sala=TESTE` e outra com `?sala=TESTE`.
