/**
 * formularios-driver.js
 * Abre os FORMULÁRIOS OFICIAIS DE ADESÃO (cópias em ../fontes-oficiais) num Chrome real, 100% offline,
 * preenche os campos disparando os mesmos eventos de um usuário (input/change/click) e lê a tela.
 *
 * Nada é buscado na internet: as páginas, os scripts oficiais e a biblioteca do gov.br
 * (govbr/core-min.js e govbr/core.js) são servidos dos arquivos locais; fontes, CSS de CDN,
 * html2canvas e jsPDF são cancelados (só servem para o visual e para gerar o PDF).
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');
const { localizarChrome, RAIZ_PROJETO } = require('./site-driver');

const ORIGEM = 'https://formularios.teste/';
const PAGINAS = {
    ATE60SM: 'formularios-2026/ate60sm.html',
    FAZENDARIOS: 'formularios-2026/fazendarios.html',
    PREVIDENCIARIOS: 'formularios-2026/previdenciarios.html',
    CONTROVERSIA: 'controversia-juridica-2026/editais.html'
};
const TIPOS_MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css' };

async function abrirNavegador({ headless = true } = {}) {
    const browser = await chromium.launch({ executablePath: localizarChrome(), headless });
    const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, locale: 'pt-BR' });
    const rede = { servidas: 0, canceladas: 0, naoGet: 0, externas: new Set() };
    await context.route('**/*', route => {
        const req = route.request();
        if (req.method() !== 'GET') rede.naoGet++;
        const url = req.url().split('#')[0].split('?')[0];
        if (url.startsWith(ORIGEM)) {
            const arquivo = path.join(RAIZ_PROJETO, 'fontes-oficiais', decodeURIComponent(url.slice(ORIGEM.length)));
            if (fs.existsSync(arquivo) && fs.statSync(arquivo).isFile()) {
                rede.servidas++;
                return route.fulfill({ status: 200, contentType: TIPOS_MIME[path.extname(arquivo)] || 'application/octet-stream', body: fs.readFileSync(arquivo) });
            }
        }
        rede.canceladas++;
        rede.externas.add(new URL(url).host);
        return route.abort();
    });
    return { browser, context, rede, async fechar() { await browser.close(); } };
}

async function novaPagina(nav, formulario) {
    const page = await nav.context.newPage();
    page._errosJS = [];
    page.on('pageerror', e => page._errosJS.push(String(e && e.message || e)));
    page.on('dialog', d => d.dismiss().catch(() => {}));
    page._url = ORIGEM + PAGINAS[formulario];
    return page;
}

async function carregar(page) {
    page._errosJS.length = 0;
    await page.goto(page._url, { waitUntil: 'load', timeout: 30000 });
}

const centavos = v => String(Math.round(Math.abs(Number(v)) * 100));

// ------------------------------------------------------------------------------------------
// Funções que rodam DENTRO da página
// ------------------------------------------------------------------------------------------

function utilitariosDaPagina() {
    window.__t = {
        disparar(el, tipo) { el.dispatchEvent(new Event(tipo, { bubbles: true })); },
        digitar(el, digitos) { el.value = digitos; this.disparar(el, 'input'); this.disparar(el, 'change'); },
        texto(sel) { const e = document.querySelector(sel); return e ? (e.tagName === 'INPUT' ? e.value : e.innerText.trim()) : null; },
        visivel(sel) { const e = document.querySelector(sel); return !!e && !e.classList.contains('d-none'); },
        /** Seleção num br-select dos formulários RFB: marca o item e dispara o change nativo do rádio. */
        escolherItem(container, n) {
            const sel = container.querySelector('.br-select');
            const radio = sel && sel.querySelector(`input[type=radio][value="${n}"]`);
            if (!radio) return false;
            sel.querySelectorAll('.br-item').forEach(it => it.classList.remove('selected'));
            radio.closest('.br-item').classList.add('selected');
            radio.checked = true;
            radio.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
        },
        qtdItens(container) { return container ? container.querySelectorAll('.br-select .br-list .br-item:not(.not-found)').length : 0; },
        linhaNova(seletorTbody) {
            const trs = [...document.querySelectorAll(seletorTbody + ' tr')].filter(tr => tr.querySelector('.principal'));
            return trs[trs.length - 1];
        }
    };
}

async function preparar(page) {
    await page.evaluate(utilitariosDaPagina);
}

// ---------------------------------- ATE60SM ----------------------------------------------

async function rodarAte60sm(page, caso) {
    await carregar(page);
    await preparar(page);
    const r = await page.evaluate((c) => {
        const t = window.__t;
        document.getElementById('op-1').click();
        c.debitos.forEach((d, i) => {
            document.getElementById('btnIncluirNovoDebito').click();
            const tr = t.linhaNova('#tabelaDebitosBody');
            t.digitar(tr.querySelector('.nroProcesso'), String(12345678901000 + i));
            t.digitar(tr.querySelector('.principal'), d.principal);
            t.digitar(tr.querySelector('.multa'), d.multa);
            t.digitar(tr.querySelector('.juros'), d.juros);
        });
        document.getElementById('btnConfirmarTotalDebitos').click();
        const out = { totalGeral: t.texto('#totalGeral'), confirmou: t.visivel('#id-modalidade-transacao') };
        if (!out.confirmou) return out;
        const radio = document.querySelector(`input[name="transacao-selecionada"][data-transacao="${c.meses}"]`);
        radio.click();
        const tb = document.querySelector('#bd-tabela-calculo-restante');
        out.linha = !!tb.querySelector('#saldoAposDesconto');
        if (!out.linha) return out;
        out.total = t.texto('#saldoParaCalculoRestante');
        out.criterio = t.texto('#criterioTransacao');
        out.desconto = t.texto('#desconto');
        out.saldo = t.texto('#saldoAposDesconto');
        out.parcelasMaximo = t.qtdItens(tb);
        out.valorParcelaInicial = t.texto('#parcelaAposDesconto');
        return out;
    }, caso.pagina);
    if (r.linha && r.parcelasMaximo > 0 && caso.fracaoParcelas !== null) {
        r.parcelasEscolhidas = 1 + Math.floor(caso.fracaoParcelas * r.parcelasMaximo);
        r.valorParcela = await page.evaluate((n) => {
            const t = window.__t;
            t.escolherItem(document.querySelector('#bd-tabela-calculo-restante'), n);
            return t.texto('#parcelaAposDesconto');
        }, r.parcelasEscolhidas);
    } else if (r.linha) {
        r.parcelasEscolhidas = null;
        r.valorParcela = r.valorParcelaInicial;
    }
    r.errosJS = page._errosJS.slice();
    return r;
}

// ------------------------------ FAZENDARIOS / PREVIDENCIARIOS ------------------------------

async function rodar50M(page, caso) {
    await carregar(page);
    await preparar(page);
    const r = await page.evaluate((c) => {
        const t = window.__t;
        const OP = { PN: 'op-1', PN_OBITO: 'op-2', ME_EPP: 'op-3', DEMAIS_PJ: 'op-4' };
        document.getElementById(OP[c.tipo]).click();
        if (c.falido) document.getElementById('falido').click();
        if (c.baixado) document.getElementById('baixado').click();
        c.debitos.forEach((d, i) => {
            document.getElementById('btnIncluirNovoDebito').click();
            const tr = t.linhaNova('#tabelaDebitosBody');
            t.digitar(tr.querySelector('.nroProcesso'), d.processo || String(100000000000000 + i));
            t.digitar(tr.querySelector('.principal'), d.principal);
            t.digitar(tr.querySelector('.multa'), d.multa);
            t.digitar(tr.querySelector('.juros'), d.juros);
        });
        document.getElementById('btnConfirmarTotalDebitos').click();
        const out = { totalGeral: t.texto('#totalGeral'), confirmou: t.visivel('#id-classificacao-debitos') };
        if (!out.confirmou) return out;
        if (c.divida !== null) t.digitar(document.getElementById('totalDebitosNaoContencioso'), c.divida);
        if (c.capag !== null) t.digitar(document.getElementById('caPag'), c.capag);
        out.classificacao = {
            totalDebitos: t.texto('#totalDebitos'), relacao: t.texto('#relacaoDebitosCaPag'),
            descontoTeorico: t.texto('#descontoTeorico'), rating: t.texto('#rating')
        };
        document.getElementById('btnSelecionarModalidade').click();
        out.modalidade = t.visivel('#id-modalidade-transacao');
        if (!out.modalidade) return out;
        const divs = ['#id-ab-pessoa-natural', '#id-cd-pessoa-natural', '#id-d-pessoa-obtito', '#id-ab-me-epp-not-check', '#id-cd-me-epp-not-check',
            '#id-d-me-epp-check', '#id-ab-demais-pj-no-check', '#id-cd-demais-pj-no-check', '#id-d-demais-pj-check'];
        const div = divs.map(s => document.querySelector(s)).find(d => d && !d.classList.contains('d-none'));
        const radios = [...div.querySelectorAll('input[type=radio]')];
        let radio = radios.find(x => x.getAttribute('data-prejuizo') === (c.comPf ? 'true' : 'false')) || radios[0];
        out.radio = radio.id;
        out.comPf = radio.getAttribute('data-prejuizo') === 'true';
        radio.click();
        if (out.comPf) {
            const campo = id => document.getElementById(id);
            const pf = (id, v) => { if (v !== null) { campo(id).value = v; t.disparar(campo(id), 'input'); } };
            pf('montante-pf', c.pf.montante); pf('aliquota-pf', c.pf.aliquota);
            pf('montante-bcn', c.bcn.montante); pf('aliquota-bcn', c.bcn.aliquota);
            document.querySelector('#id-detalhamentos-pf-bcn button.primary').click();
        }
        const tabela = (sel) => [...document.querySelectorAll(sel + ' > tr')].map(tr => {
            const o = {}; tr.querySelectorAll('td[name]').forEach(td => { o[td.getAttribute('name')] = td.innerText.trim(); }); return o;
        });
        out.descontos = tabela('#bd-tabela-calculo-descontos');
        const tbE = document.querySelector('#bd-tabela-calculo-entrada');
        out.entrada = tbE.querySelector('#valorEntrada') ? {
            totalDevido: t.texto('#saldoDevedor'), entradaExibida: t.texto('#valorEntrada'),
            parcelasMaximo: t.qtdItens(tbE), valorParcelaInicial: t.texto('#parcelaAposEntrada')
        } : null;
        out.pf = tabela('#bd-tabela-calculo-utilizacao-pf-bcn')[0] || null;
        const tbR = document.querySelector('#bd-tabela-calculo-restante');
        out.restante = tbR.querySelector('#saldoParaCalculoRestante') ? {
            criterio: t.texto('#criterioTransacao'), saldo: t.texto('#saldoParaCalculoRestante'),
            parcelasMaximo: t.qtdItens(tbR), valorParcelaInicial: t.texto('#parcelaAposDesconto')
        } : null;
        return out;
    }, caso.pagina);

    if (r.entrada) {
        const n = r.entrada.parcelasMaximo > 0 && caso.fracaoEntrada !== null ? 1 + Math.floor(caso.fracaoEntrada * r.entrada.parcelasMaximo) : null;
        r.entrada.parcelasEscolhidas = n;
        r.entrada.valorParcela = n === null ? r.entrada.valorParcelaInicial : await page.evaluate((n) => {
            window.__t.escolherItem(document.querySelector('#bd-tabela-calculo-entrada'), n);
            return window.__t.texto('#parcelaAposEntrada');
        }, n);
    }
    if (r.restante) {
        const n = r.restante.parcelasMaximo > 0 && caso.fracaoParcelas !== null ? 1 + Math.floor(caso.fracaoParcelas * r.restante.parcelasMaximo) : null;
        r.restante.parcelasEscolhidas = n;
        r.restante.valorParcela = n === null ? r.restante.valorParcelaInicial : await page.evaluate((n) => {
            window.__t.escolherItem(document.querySelector('#bd-tabela-calculo-restante'), n);
            return window.__t.texto('#parcelaAposDesconto');
        }, n);
    }
    r.errosJS = page._errosJS.slice();
    return r;
}

// ---------------------------------- CONTROVERSIA -----------------------------------------

async function rodarControversia(page, caso) {
    await carregar(page);
    await page.waitForFunction(() => typeof calcularDividaConsolidada === 'function' && document.querySelector('#bd-pf-bcn-proprios .valorCredito'), null, { timeout: 10000 });
    await preparar(page);
    const r = await page.evaluate((c) => {
        const t = window.__t;
        const escolherAliquota = (linha, aliquota) => {
            if (!aliquota) return;
            const sel = linha.querySelector('br-select-component .br-select');
            const radio = [...sel.querySelectorAll('input[type=radio]')].find(x => x.value === aliquota + '%');
            sel.querySelectorAll('.br-item').forEach(it => it.classList.remove('selected'));
            radio.closest('.br-item').classList.add('selected');
            radio.checked = true;
            sel.querySelector('.br-input input').value = aliquota + '%';
            radio.dispatchEvent(new Event('change', { bubbles: true }));
        };
        const preencherCredito = (linha, cr) => {
            if (cr.montante !== null) t.digitar(linha.querySelector('input.montante'), cr.montante);
            escolherAliquota(linha, cr.aliquota);
            if (cr.valor !== null) t.digitar(linha.querySelector('input.valorCredito'), cr.valor);
        };
        c.debitos.forEach(v => {
            incluirDebito();
            const linhas = document.querySelectorAll('#bd-debitos-regularizar tr');
            const inp = linhas[linhas.length - 1].querySelector('input.valorDebito');
            t.digitar(inp, v);
        });
        const proprios = document.querySelectorAll('#bd-pf-bcn-proprios tr');
        if (c.pfProprio) preencherCredito(proprios[0], c.pfProprio);
        if (c.bcnProprio) preencherCredito(proprios[1], c.bcnProprio);
        c.terceiros.forEach(cr => {
            incluirCreditoTerceiros(cr.tipo);
            const linhas = document.querySelectorAll('#bd-pf-bcn-terceiros tr');
            preencherCredito(linhas[linhas.length - 1], cr);
        });
        document.getElementById(String(c.opcao)).click();
        document.querySelector('button[onclick="calcularDividaConsolidada()"]').click();
        const out = { totalDebitos: t.texto('#total-debitos-transacionar'), totalCreditos: t.texto('#total-creditos-pf-bcn') };
        const linhas = [...document.querySelectorAll('#bd-divida-consolidada tr')].map(tr => {
            const tds = tr.querySelectorAll('td');
            if (tds.length < 2) return null;
            const sel = tds[1].querySelector('br-select-component');
            if (sel) return { select: sel.getAttribute('inputId'), qtd: sel.querySelectorAll('.br-item').length };
            const i = tds[1].querySelector('input');
            return { valor: i ? i.value : tds[1].innerText.trim() };
        }).filter(Boolean);
        out.linhas = linhas;
        return out;
    }, caso.pagina);

    if (r.linhas.length) {
        const escolher = async (inputId, n) => page.evaluate(({ inputId, n }) => {
            const comp = document.querySelector(`br-select-component[inputid="${inputId}"]`);
            const sel = comp.querySelector('.br-select');
            const radio = [...sel.querySelectorAll('input[type=radio]')].find(x => String(x.value) === String(n));
            sel.querySelectorAll('.br-item').forEach(it => it.classList.remove('selected'));
            radio.closest('.br-item').classList.add('selected');
            radio.checked = true;
            document.getElementById(inputId).value = radio.nextElementSibling.innerText.trim();
            sel.dispatchEvent(new CustomEvent('onChange', { detail: { value: String(n) } }));
            return true;
        }, { inputId, n });
        const sE = r.linhas.find(l => l.select === 'id-select-parcelas-entrada');
        const sS = r.linhas.find(l => l.select === 'id-select-parcelas-saldo');
        r.parcelasEntradaMaximo = sE ? sE.qtd : 0;
        r.parcelasMaximo = sS ? sS.qtd : 0;
        r.parcelasEntradaEscolhidas = caso.parcelasEntrada !== null && r.parcelasEntradaMaximo ? 1 : null;
        r.parcelasEscolhidas = caso.fracaoParcelas !== null && r.parcelasMaximo ? 1 + Math.floor(caso.fracaoParcelas * r.parcelasMaximo) : null;
        if (r.parcelasEntradaEscolhidas) await escolher('id-select-parcelas-entrada', 1);
        if (r.parcelasEscolhidas) await escolher('id-select-parcelas-saldo', r.parcelasEscolhidas);
        Object.assign(r, await page.evaluate(() => ({
            valorParcelaEntrada: document.getElementById('id-valor-parcela-entrada')?.value ?? null,
            valorParcela: document.getElementById('id-valor-parcela-saldo')?.value ?? null
        })));
        r.valores = r.linhas.filter(l => 'valor' in l).map(l => l.valor);
    }
    r.errosJS = page._errosJS.slice();
    return r;
}

module.exports = { abrirNavegador, novaPagina, carregar, rodarAte60sm, rodar50M, rodarControversia, centavos, PAGINAS };
