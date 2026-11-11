/**
 * gravar-sessao.js — gravador genérico de sessões no Chrome real.
 *
 * Registra numa linha do tempo única:
 *   - rede: todas as requisições/respostas (método, tipo, status, corpo enviado)
 *   - eventos de interface: click, input, change, submit, focusin (alvo + valor)
 *   - chamadas de funções JS da página (funções globais não nativas), com argumentos,
 *     retorno resumido e profundidade (mostra a cadeia de cálculo disparada por cada evento)
 *   - alert/confirm/prompt, console (erro/aviso), erros JS, downloads (PDF gerado), pop-ups
 *
 * Uso como módulo:
 *   const { iniciarGravacao } = require('./gravar-sessao');
 *   const s = await iniciarGravacao({ url, nome: 'ate60sm', headless: true });
 *   s.marcar('preenchendo débitos');           // marcador na linha do tempo
 *   ... interaja com s.page (playwright) ...
 *   const estado = await s.page.evaluate(() => ...);
 *   await s.salvar();                           // grava testes/saida/sessoes/<nome>.{json,md}
 *   await s.fechar();
 *
 * Uso direto (só abre, espera e grava o carregamento):
 *   node gravar-sessao.js <url> <nome>
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const { localizarChrome } = require('./site-driver');

const DIR_SESSOES = path.join(__dirname, 'saida', 'sessoes');

// Script injetado em toda página/frame antes de qualquer script do site
const SCRIPT_INSTRUMENTACAO = `
(() => {
  if (window.__gravacaoAtiva) return;
  window.__gravacaoAtiva = true;
  const enviar = (ev) => { try { window.__registrarGravacao && window.__registrarGravacao(ev); } catch (e) {} };
  const descrever = (el) => {
    if (!el || !el.tagName) return String(el);
    let d = el.tagName.toLowerCase();
    if (el.id) d += '#' + el.id;
    if (el.getAttribute && el.getAttribute('name')) d += '[name=' + el.getAttribute('name') + ']';
    if (el.classList && el.classList.length) d += '.' + [...el.classList].slice(0, 3).join('.');
    return d;
  };
  const resumo = (v, prof = 0) => {
    try {
      if (v === undefined) return 'undefined';
      if (v === null) return null;
      if (typeof v === 'number' || typeof v === 'boolean') return v;
      if (typeof v === 'string') return v.length > 120 ? v.slice(0, 120) + '…' : v;
      if (typeof v === 'function') return 'fn ' + (v.name || 'anônima');
      if (v instanceof Element) return '<' + descrever(v) + (('value' in v) ? ' value=' + JSON.stringify(String(v.value).slice(0, 40)) : '') + '>';
      if (v instanceof Event) return 'Event:' + v.type + '@' + descrever(v.target);
      if (Array.isArray(v)) return prof > 1 ? '[array ' + v.length + ']' : v.slice(0, 8).map(x => resumo(x, prof + 1));
      if (typeof v === 'object') {
        if (prof > 1) return '{obj}';
        const o = {}; Object.keys(v).slice(0, 12).forEach(k => { o[k] = resumo(v[k], prof + 1); }); return o;
      }
      return String(v);
    } catch (e) { return '?'; }
  };
  window.__resumoGravacao = resumo;

  // Eventos de interface (fase de captura: vê tudo antes dos handlers do site)
  ['click', 'input', 'change', 'submit', 'focusin'].forEach(tipo => {
    window.addEventListener(tipo, (e) => {
      const t = e.target;
      enviar({ cat: 'evento', tipo, alvo: descrever(t), valor: t && 'value' in t ? String(t.value).slice(0, 60) : undefined,
               checked: t && (t.type === 'checkbox' || t.type === 'radio') ? t.checked : undefined,
               handler: t && t.getAttribute ? (t.getAttribute('on' + tipo) || undefined) : undefined });
    }, true);
  });

  // Diálogos
  ['alert', 'confirm', 'prompt'].forEach(nome => {
    const orig = window[nome];
    window[nome] = function (msg) { enviar({ cat: 'dialogo', tipo: nome, mensagem: String(msg).slice(0, 300) }); return nome === 'confirm' ? true : (nome === 'prompt' ? '' : undefined); };
  });

  // Rastreamento de chamadas de funções globais definidas pela página
  let profundidade = 0;
  const contagem = {};
  const LIMITE_POR_FUNCAO = 400;
  const embrulhadas = new WeakSet();
  const nativa = (f) => { try { return /\\[native code\\]/.test(Function.prototype.toString.call(f)); } catch (e) { return true; } };
  const ehClasse = (f) => { try { return /^class[\\s{]/.test(Function.prototype.toString.call(f)); } catch (e) { return false; } };
  const IGNORAR = /^(__|webkit|on[a-z]|html2canvas|jspdf|core$|\\$|jQuery|gtag|dataLayer|ga$|google|VLibras)/;
  function embrulharGlobais() {
    let n = 0;
    for (const nome of Object.getOwnPropertyNames(window)) {
      if (IGNORAR.test(nome)) continue;
      let f;
      try { f = window[nome]; } catch (e) { continue; }
      if (typeof f !== 'function' || embrulhadas.has(f) || nativa(f) || ehClasse(f)) continue;
      const desc = Object.getOwnPropertyDescriptor(window, nome);
      if (!desc || (!desc.writable && !desc.set)) continue;
      const original = f;
      const embrulho = function (...args) {
        contagem[nome] = (contagem[nome] || 0) + 1;
        const registrar = contagem[nome] <= LIMITE_POR_FUNCAO;
        const id = registrar ? Math.random().toString(36).slice(2, 8) : null;
        if (registrar) enviar({ cat: 'chamada', funcao: nome, prof: profundidade, id, args: args.map(a => resumo(a)) });
        profundidade++;
        try {
          const r = original.apply(this, args);
          if (registrar && r !== undefined) enviar({ cat: 'retorno', funcao: nome, prof: profundidade - 1, id, valor: resumo(r) });
          return r;
        } catch (e) {
          enviar({ cat: 'erroFuncao', funcao: nome, prof: profundidade - 1, erro: String(e && e.message || e) });
          throw e;
        } finally { profundidade--; }
      };
      try { Object.defineProperty(embrulho, 'name', { value: nome }); } catch (e) {}
      Object.keys(original).forEach(k => { try { embrulho[k] = original[k]; } catch (e) {} });
      embrulho.prototype = original.prototype;
      try { window[nome] = embrulho; embrulhadas.add(embrulho); n++; } catch (e) {}
    }
    if (n) enviar({ cat: 'instrumentacao', funcoesEmbrulhadas: n });
  }
  window.__embrulharGlobais = embrulharGlobais;
  document.addEventListener('DOMContentLoaded', embrulharGlobais, true);
  window.addEventListener('load', () => { embrulharGlobais(); setTimeout(embrulharGlobais, 1500); });
  window.__contagemChamadas = contagem;
})();
`;

async function iniciarGravacao({ url, nome, headless = true, viewport = { width: 1600, height: 1000 }, esperar = 'load' }) {
    const browser = await chromium.launch({ executablePath: localizarChrome(), headless });
    const context = await browser.newContext({ viewport, locale: 'pt-BR', acceptDownloads: true });
    const t0 = Date.now();
    const linha = [];
    let marcador = 'carregamento';
    const add = (ev) => { linha.push(Object.assign({ t: Date.now() - t0, fase: marcador }, ev)); };

    await context.exposeBinding('__registrarGravacao', (src, ev) => add(Object.assign({ pagina: src.page && src.page.url().split('?')[0].split('/').slice(-2).join('/') }, ev)));
    await context.addInitScript(SCRIPT_INSTRUMENTACAO);

    const instrumentar = (page) => {
        page.on('request', r => add({ cat: 'rede', tipo: r.resourceType(), metodo: r.method(), url: r.url(), corpo: r.postData() ? r.postData().slice(0, 2000) : undefined }));
        page.on('response', r => add({ cat: 'resposta', status: r.status(), url: r.url(), contentType: r.headers()['content-type'] }));
        page.on('requestfailed', r => add({ cat: 'falhaRede', url: r.url(), erro: r.failure() && r.failure().errorText }));
        page.on('console', m => { if (['error', 'warning', 'log'].includes(m.type())) add({ cat: 'console', tipo: m.type(), texto: m.text().slice(0, 400) }); });
        page.on('pageerror', e => add({ cat: 'erroJS', mensagem: String(e.message || e).slice(0, 400) }));
        page.on('dialog', d => { add({ cat: 'dialogoNativo', tipo: d.type(), mensagem: d.message() }); d.accept().catch(() => {}); });
        page.on('download', async d => {
            const destino = path.join(DIR_SESSOES, `${nome}-${d.suggestedFilename()}`);
            fs.mkdirSync(DIR_SESSOES, { recursive: true });
            await d.saveAs(destino).catch(() => {});
            add({ cat: 'download', arquivo: d.suggestedFilename(), salvoEm: destino });
        });
        page.on('popup', p => { add({ cat: 'popup', url: p.url() }); instrumentar(p); });
    };
    const page = await context.newPage();
    instrumentar(page);
    context.on('page', p => { if (p !== page) add({ cat: 'novaAba', url: p.url() }); });

    await page.goto(url, { waitUntil: esperar, timeout: 90000 });
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.__embrulharGlobais && window.__embrulharGlobais()).catch(() => {});

    return {
        browser, context, page, linha,
        marcar(texto) { marcador = texto; add({ cat: 'marcador', texto }); },
        async salvar(extra = {}) {
            fs.mkdirSync(DIR_SESSOES, { recursive: true });
            const contagem = await page.evaluate(() => window.__contagemChamadas || {}).catch(() => ({}));
            const dados = Object.assign({ nome, url, geradoEm: new Date().toISOString(), contagemChamadas: contagem, linhaDoTempo: linha }, extra);
            fs.writeFileSync(path.join(DIR_SESSOES, `${nome}.json`), JSON.stringify(dados, null, 2));
            fs.writeFileSync(path.join(DIR_SESSOES, `${nome}.md`), gerarMarkdown(dados));
            return dados;
        },
        async fechar() { await browser.close(); }
    };
}

function gerarMarkdown(d) {
    const L = d.linhaDoTempo;
    const rede = L.filter(e => e.cat === 'rede');
    const porFase = {};
    rede.forEach(r => { porFase[r.fase] = porFase[r.fase] || []; porFase[r.fase].push(r); });
    const md = [`# Sessão gravada: ${d.nome}`, '', `- URL: ${d.url}`, `- Gerado em: ${d.geradoEm}`,
        `- Requisições: ${rede.length} (não-GET: ${rede.filter(r => r.metodo !== 'GET').length}, XHR/fetch: ${rede.filter(r => ['xhr', 'fetch'].includes(r.tipo)).length})`,
        `- Eventos de interface: ${L.filter(e => e.cat === 'evento').length} | chamadas de função registradas: ${L.filter(e => e.cat === 'chamada').length} | erros JS: ${L.filter(e => e.cat === 'erroJS' || e.cat === 'erroFuncao').length} | downloads: ${L.filter(e => e.cat === 'download').length}`, ''];
    md.push('## Requisições por fase', '');
    Object.entries(porFase).forEach(([f, rs]) => {
        md.push(`### ${f} (${rs.length})`);
        rs.forEach(r => md.push(`- ${r.metodo} ${r.tipo} ${r.url.length > 150 ? r.url.slice(0, 150) + '…' : r.url}${r.corpo ? ' — corpo: `' + r.corpo.slice(0, 200) + '`' : ''}`));
        md.push('');
    });
    md.push('## Funções mais chamadas', '', '| Função | Chamadas |', '|---|---|');
    Object.entries(d.contagemChamadas || {}).sort((a, b) => b[1] - a[1]).slice(0, 60).forEach(([f, c]) => md.push(`| ${f} | ${c} |`));
    md.push('', '## Linha do tempo (eventos, chamadas e diálogos)', '');
    L.filter(e => ['marcador', 'evento', 'chamada', 'retorno', 'dialogo', 'dialogoNativo', 'erroJS', 'erroFuncao', 'download', 'popup', 'novaAba'].includes(e.cat)).slice(0, 4000).forEach(e => {
        const ind = '  '.repeat(Math.min(e.prof || 0, 10));
        if (e.cat === 'marcador') md.push('', `#### ▶ ${e.texto}`);
        else if (e.cat === 'evento') md.push(`- [${e.t}ms] EVENTO ${e.tipo} ${e.alvo}${e.valor !== undefined && e.valor !== '' ? ' = ' + JSON.stringify(e.valor) : ''}${e.handler ? ' (on' + e.tipo + '="' + e.handler + '")' : ''}`);
        else if (e.cat === 'chamada') md.push(`- ${ind}→ ${e.funcao}(${(e.args || []).map(a => JSON.stringify(a)).join(', ').slice(0, 220)})`);
        else if (e.cat === 'retorno') md.push(`- ${ind}← ${e.funcao} = ${JSON.stringify(e.valor).slice(0, 220)}`);
        else md.push(`- [${e.t}ms] ${e.cat.toUpperCase()} ${JSON.stringify(Object.assign({}, e, { t: undefined, fase: undefined, cat: undefined })).slice(0, 300)}`);
    });
    return md.join('\n');
}

module.exports = { iniciarGravacao, SCRIPT_INSTRUMENTACAO };

if (require.main === module) {
    const [url, nome] = process.argv.slice(2);
    if (!url) { console.error('Uso: node gravar-sessao.js <url> <nome>'); process.exit(1); }
    (async () => {
        const s = await iniciarGravacao({ url, nome: nome || 'sessao' });
        const d = await s.salvar();
        await s.fechar();
        const rede = d.linhaDoTempo.filter(e => e.cat === 'rede');
        console.log(`${d.nome}: ${rede.length} requisições, ${d.linhaDoTempo.filter(e => e.cat === 'instrumentacao').map(e => e.funcoesEmbrulhadas).join('+')} funções instrumentadas. Relatório: testes/saida/sessoes/${d.nome}.md`);
    })().catch(e => { console.error(e); process.exit(1); });
}
