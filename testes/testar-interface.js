/**
 * testar-interface.js
 * Teste "ponta a ponta": digita o MESMO roteiro (tecla por tecla) no site oficial e no
 * simulador básico (../simulador-basico/index.html) e compara o que aparece na tela
 * (Quadro-Resumo: vantagens, dívida, opção, redução, saldo, entrada, parcelas, PF/BCN).
 *
 * Uso:  node testar-interface.js [--aleatorios=30] [--seed=99] [--local] [--ver]
 * Saída: testes/saida/teste-interface.json
 */
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { abrirSite } = require('./site-driver');

const arg = (n, p) => { const a = process.argv.find(x => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : p; };
const N_ALEATORIOS = parseInt(arg('aleatorios', '30'), 10);
const SEED = parseInt(arg('seed', '99'), 10);
const LOCAL = process.argv.includes('--local');
const VER = process.argv.includes('--ver');
const URL_BASICO = pathToFileURL(path.join(__dirname, '..', 'simulador-basico', 'index.html')).href;
const SAIDA = path.join(__dirname, 'saida');
fs.mkdirSync(SAIDA, { recursive: true });

const NOMES = {
    RFB_PEQUENO_VALOR: 'RFB – Edital nº 10/2026',
    RFB_GERAL_50M: 'RFB - Edital nº 9/2026',
    PGFN_PEQUENO_VALOR: 'PGFN – Edital 06/2026 - Até 60',
    PGFN_CAPACIDADE_PAGAMENTO: 'PGFN – Edital 06/2026 - Conforme a Capacidade'
};

// ------------------------------------------------------------- cenários
const FIXOS = [
    { nome: 'Print do usuário', tipo: 'DEMAIS_PJ', modo: 'AGREGADO', agregado: { principal: 3000000, multa: 1500000, juros: 200000 }, capag: 4000000, divida: 4700000 },
    { nome: 'Demais PJ + interações', tipo: 'DEMAIS_PJ', modo: 'AGREGADO', agregado: { principal: 3000000, multa: 1500000, juros: 200000 }, capag: 4000000, divida: 4700000,
      acoes: { RFB_GERAL_50M: { entrada: 3, parcelas: 60, pfFrac: 0.4 }, PGFN_CAPACIDADE_PAGAMENTO: { natureza: 'PREVIDENCIARIO', entrada: 4 } } },
    { nome: 'ME/EPP por débito', tipo: 'ME_EPP', modo: 'POR_DEBITO', debitos: [{ principal: 20000, multa: 4000, juros: 3000 }, { principal: 150000, multa: 30000, juros: 20000 }, { principal: 60000, multa: 0, juros: 5000 }], capag: 50000, divida: 400000,
      acoes: { RFB_PEQUENO_VALOR: { opcao: 3, parcelas: 40 }, PGFN_PEQUENO_VALOR: { opcao: 4, entrada: 2, parcelas: 20 } } },
    { nome: 'MEI pequeno', tipo: 'MEI', modo: 'AGREGADO', agregado: { principal: 5000, multa: 500, juros: 300 }, capag: 10000, divida: 6000,
      acoes: { RFB_PEQUENO_VALOR: { opcao: 1, parcelas: 10 }, PGFN_PEQUENO_VALOR: { parcelas: 12 } } },
    { nome: 'MEI por débito — memória de opção (débito grande digitado depois)', tipo: 'MEI', modo: 'POR_DEBITO', debitos: [{ principal: 1495.65, multa: 0, juros: 0 }, { principal: 90000, multa: 7652.15, juros: 0 }], capag: 30000, divida: 100000 },
    { nome: 'PN óbito à vista PGFN', tipo: 'PN_OBITO', modo: 'AGREGADO', agregado: { principal: 60000, multa: 12000, juros: 8000 }, capag: 500000, divida: 80000, acoes: { PGFN_CAPACIDADE_PAGAMENTO: { opcao: 1 } } },
    { nome: 'PN rating A', tipo: 'PN', modo: 'AGREGADO', agregado: { principal: 40000, multa: 8000, juros: 2000 }, capag: 200000, divida: 50000 },
    { nome: 'Demais PJ falida 15M + PF/BCN previdenciário', tipo: 'DEMAIS_PJ', falido: true, modo: 'AGREGADO', agregado: { principal: 10000000, multa: 3000000, juros: 2000000 }, capag: 1000000, divida: 20000000, acoes: { RFB_GERAL_50M: { opcao: 1, pfFrac: 0.7 } } },
    { nome: 'PF/BCN acima do limite (erro)', tipo: 'ME_EPP', modo: 'AGREGADO', agregado: { principal: 800000, multa: 200000, juros: 100000 }, capag: 300000, divida: 900000, acoes: { RFB_GERAL_50M: { pfFrac: 1.2 } } },
    { nome: 'Acima de 50M', tipo: 'DEMAIS_PJ', modo: 'AGREGADO', agregado: { principal: 40000000, multa: 15000000, juros: 5000000 }, capag: 10000000, divida: 60000000 }
];

function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rnd = rng(SEED);
const esc = a => a[Math.floor(rnd() * a.length)];
const cent = v => Math.round(v * 100) / 100;
const logU = (a, b) => Math.exp(Math.log(a) + rnd() * (Math.log(b) - Math.log(a)));
function dividir(total) { const fP = 0.3 + rnd() * 0.6, fM = rnd() * (1 - fP); const principal = cent(total * fP), multa = cent(total * fM); return { principal, multa, juros: Math.max(0, cent(total - principal - multa)) }; }
function aleatorio(i) {
    const tipo = esc(['PN', 'PN_OBITO', 'MEI', 'ME_EPP', 'DEMAIS_PJ']);
    const pj = ['MEI', 'ME_EPP', 'DEMAIS_PJ'].includes(tipo);
    const c = { nome: `aleatório ${i + 1}`, tipo, falido: pj && rnd() < 0.15, baixado: pj && rnd() < 0.1, modo: rnd() < 0.5 ? 'AGREGADO' : 'POR_DEBITO' };
    let total;
    if (c.modo === 'AGREGADO') { c.agregado = dividir(cent(logU(300, 60000000))); total = c.agregado.principal + c.agregado.multa + c.agregado.juros; }
    else { c.debitos = Array.from({ length: 1 + Math.floor(rnd() * 3) }, () => dividir(cent(rnd() < 0.5 ? logU(300, 150000) : logU(300, 5000000)))); total = c.debitos.reduce((a, d) => a + d.principal + d.multa + d.juros, 0); }
    c.divida = rnd() < 0.3 ? cent(total) : cent(total * (0.3 + rnd() * 3));
    c.capag = rnd() < 0.05 ? 0 : cent((c.divida || total) / (0.2 + rnd() * 3.5));
    c.acoes = {};
    if (rnd() < 0.5) c.acoes.RFB_PEQUENO_VALOR = { opcao: Math.floor(rnd() * 4), parcelas: 1 + Math.floor(rnd() * 60) };
    if (rnd() < 0.6) c.acoes.RFB_GERAL_50M = { opcao: Math.floor(rnd() * 2), entrada: 1 + Math.floor(rnd() * 10), parcelas: 1 + Math.floor(rnd() * 140), pfFrac: rnd() < 0.5 ? cent(rnd() * 1.1) : undefined };
    if (rnd() < 0.5) c.acoes.PGFN_PEQUENO_VALOR = { opcao: Math.floor(rnd() * 6), entrada: 1 + Math.floor(rnd() * 5), parcelas: 1 + Math.floor(rnd() * 60) };
    if (rnd() < 0.6) c.acoes.PGFN_CAPACIDADE_PAGAMENTO = { natureza: esc(['FAZENDARIO', 'PREVIDENCIARIO']), opcao: Math.floor(rnd() * 2), entrada: 1 + Math.floor(rnd() * 12), parcelas: 1 + Math.floor(rnd() * 133) };
    return c;
}

// ------------------------------------------------------------- drivers de interface
const digitos = v => String(Math.round(v * 100));

async function fecharModais(page) {
    for (let i = 0; i < 4; i++) {
        const b = page.locator('#id-entendi');
        if (await b.isVisible().catch(() => false)) { await b.click({ timeout: 3000 }).catch(() => {}); await page.waitForTimeout(100); } else return;
    }
}
async function clicar(page, sel) {
    await fecharModais(page);
    try { await page.click(sel, { timeout: 5000 }); } catch { await fecharModais(page); await page.click(sel, { timeout: 5000, force: true }); }
    await fecharModais(page);
}
async function digitarTeclaPorTecla(page, loc, valor) {
    await fecharModais(page);
    await loc.click({ timeout: 5000 }).catch(() => {});
    await fecharModais(page);
    await loc.fill('');
    await loc.pressSequentially(digitos(valor), { delay: 0 });
    await loc.press('Tab');
    await fecharModais(page);
}
async function digitarNumero(page, loc, valor) {
    await fecharModais(page);
    await loc.fill(String(valor));
    await loc.press('Tab');
    await page.waitForTimeout(60);
    await fecharModais(page);
}

const SITE = {
    linha: (page, chave) => page.locator('#id-corpo-quadro-resumo tr', { hasText: NOMES[chave] }).first(),
    async preencher(page, c) {
        const radio = { PN: 'op-pn', PN_OBITO: 'op-pn-obito', MEI: 'op-mei', ME_EPP: 'op-me-epp', DEMAIS_PJ: 'op-demais-pj' }[c.tipo];
        await clicar(page, `label[for="${radio}"]`);
        if (['MEI', 'ME_EPP', 'DEMAIS_PJ'].includes(c.tipo)) {
            if (c.falido) await clicar(page, 'label[for="sit-falido"]');
            if (c.baixado) await clicar(page, 'label[for="sit-baixado"]');
        }
        if (c.modo === 'AGREGADO') {
            await clicar(page, 'label[for="modo-agregado"]');
            for (const k of ['principal', 'multa', 'juros']) await digitarTeclaPorTecla(page, page.locator(`#id-agregado-${k}`), c.agregado[k]);
            await clicar(page, '#btnConfirmarTotalDebitosAgregado');
        } else {
            await clicar(page, 'label[for="modo-por-debito"]');
            for (let i = 0; i < c.debitos.length; i++) {
                if (i > 0) await clicar(page, '#id-btn-incluir-debito');
                const tr = page.locator('#id-corpo-tabela-debitos tr').nth(i);
                for (const k of ['principal', 'multa', 'juros']) await digitarTeclaPorTecla(page, tr.locator(`input[data-campo="${k}"]`), c.debitos[i][k]);
            }
            await clicar(page, '#btnConfirmarTotalDebitos');
        }
        await digitarTeclaPorTecla(page, page.locator('#caPag'), c.capag);
        await digitarTeclaPorTecla(page, page.locator('#totalDebitosNaoContencioso'), c.divida);
        await clicar(page, '#btnSimularModalidades');
        await page.waitForTimeout(250);
    },
    selNatureza: (page, chave) => SITE.linha(page, chave).locator('td').nth(3).locator('select').first(),
    selOpcao: async (page, chave) => { const s = SITE.linha(page, chave).locator('td').nth(3).locator('select'); return (await s.count()) > 1 ? s.nth(1) : s.first(); },
    inpEntrada: (page, chave) => SITE.linha(page, chave).locator('td').nth(6).locator('input'),
    inpParcelas: (page, chave) => SITE.linha(page, chave).locator('td').nth(7).locator('input'),
    inpPf: (page, chave) => SITE.linha(page, chave).locator('td').nth(8).locator('input'),
    seletorLinhas: '#id-corpo-quadro-resumo > tr'
};

const BASICO = {
    linha: (page, chave) => page.locator('#corpo-quadro > tr:not(.linha-detalhe)', { hasText: NOMES[chave] }).first(),
    async preencher(page, c) {
        await page.check(`input[name="tipo"][value="${c.tipo}"]`);
        if (['MEI', 'ME_EPP', 'DEMAIS_PJ'].includes(c.tipo)) {
            if (c.falido) await page.check('#sit-falido');
            if (c.baixado) await page.check('#sit-baixado');
        }
        await page.check(`input[name="modo"][value="${c.modo}"]`);
        if (c.modo === 'AGREGADO') {
            for (const k of ['principal', 'multa', 'juros']) await digitarTeclaPorTecla(page, page.locator(`input[data-agregado="${k}"]`), c.agregado[k]);
        } else {
            for (let i = 0; i < c.debitos.length; i++) {
                if (i > 0) await page.click('#btn-incluir-debito');
                const tr = page.locator('#corpo-debitos tr').nth(i);
                for (const k of ['principal', 'multa', 'juros']) await digitarTeclaPorTecla(page, tr.locator(`input[data-campo="${k}"]`), c.debitos[i][k]);
            }
        }
        await digitarTeclaPorTecla(page, page.locator('#capag'), c.capag);
        await digitarTeclaPorTecla(page, page.locator('#divida-total'), c.divida);
        await page.waitForTimeout(100);
    },
    selNatureza: (page, chave) => page.locator(`select[data-acao="natureza"][data-chave="${chave}"]`),
    selOpcao: async (page, chave) => page.locator(`select[data-acao="opcao"][data-chave="${chave}"]`),
    inpEntrada: (page, chave) => page.locator(`input[data-acao="entrada"][data-chave="${chave}"]`),
    inpParcelas: (page, chave) => page.locator(`input[data-acao="parcelas"][data-chave="${chave}"]`),
    inpPf: (page, chave) => page.locator(`input[data-acao="pfbcn"][data-chave="${chave}"]`),
    seletorLinhas: '#corpo-quadro > tr:not(.linha-detalhe)'
};

// Roteiro de ações no quadro, decidido a partir do que o SITE mostra (opções/limite disponíveis)
async function planejarAcoes(page, c) {
    const plano = [];
    for (const [chave, a] of Object.entries(c.acoes || {})) {
        const linha = SITE.linha(page, chave);
        if ((await linha.locator('td').count()) <= 2) continue; // inelegível
        if (a.natureza && chave === 'PGFN_CAPACIDADE_PAGAMENTO') plano.push({ chave, tipo: 'natureza', valor: a.natureza });
        if (a.opcao !== undefined) plano.push({ chave, tipo: 'opcao', indice: a.opcao });
        if (a.entrada !== undefined) plano.push({ chave, tipo: 'entrada', valor: a.entrada });
        if (a.parcelas !== undefined) plano.push({ chave, tipo: 'parcelas', valor: a.parcelas });
        if (a.pfFrac !== undefined && chave === 'RFB_GERAL_50M') plano.push({ chave, tipo: 'pfbcn', frac: a.pfFrac });
    }
    return plano;
}

async function executarAcao(page, D, acao, resolvido) {
    const { chave, tipo } = acao;
    if (tipo === 'natureza') { const s = D.selNatureza(page, chave); if (await s.count()) await s.selectOption(acao.valor); return; }
    if (tipo === 'opcao') {
        const s = await D.selOpcao(page, chave);
        if (!(await s.count())) return;
        if (resolvido.opcaoValor === undefined) {
            const valores = await s.locator('option').evaluateAll(os => os.map(o => o.value));
            resolvido.opcaoValor = valores[acao.indice % valores.length];
        }
        await s.selectOption(resolvido.opcaoValor).catch(e => { resolvido.erro = 'opção indisponível: ' + resolvido.opcaoValor; });
        return;
    }
    if (tipo === 'entrada') { const i = D.inpEntrada(page, chave); if (await i.count()) await digitarNumero(page, i, acao.valor); return; }
    if (tipo === 'parcelas') { const i = D.inpParcelas(page, chave); if (await i.count()) await digitarNumero(page, i, acao.valor); return; }
    if (tipo === 'pfbcn') {
        const i = D.inpPf(page, chave);
        if (!(await i.count())) return;
        if (resolvido.pfValor === undefined) {
            const texto = await i.locator('xpath=ancestor::td[1]').innerText();
            const lim = parseFloat(((texto.match(/Limite: R\$ ?([\d.]+,\d{2})/) || [])[1] || '0').replace(/\./g, '').replace(',', '.'));
            resolvido.pfValor = cent(lim * acao.frac);
        }
        await digitarTeclaPorTecla(page, i, resolvido.pfValor);
    }
}

function extrairQuadro(seletor) {
    const txt = el => (el.innerText || '').replace(/\s+/g, ' ').trim();
    const money = s => (s.match(/R\$ ?-?[\d.]+,\d{2}/g) || []).map(x => x.replace(/R\$ ?/, ''));
    const maxOf = s => (s.match(/Máx: ?(\d+)x/) || [])[1] || null;
    return [...document.querySelectorAll(seletor)].map(tr => {
        const tds = [...tr.cells];
        const nome = txt(tds[0]).replace(/Prazo para adesão.*$/i, '').replace(/Memória de cálculo/, '').trim();
        if (tds.length <= 2) return { nome, inelegivel: txt(tds[1]) };
        const inputs = td => [...td.querySelectorAll('input')].map(i => i.value);
        const sels = td => [...td.querySelectorAll('select')].map(s => (s.options[s.selectedIndex] ? s.options[s.selectedIndex].text.trim() : null));
        return {
            nome,
            vantagens: txt(tds[1]),
            divida: money(txt(tds[2]))[0] || null,
            opcoes: sels(tds[3]),
            reducao: txt(tds[4]),
            saldo: txt(tds[5]),
            entrada: { sem: /Sem Entrada/i.test(txt(tds[6])), valores: money(txt(tds[6])), n: inputs(tds[6]), max: maxOf(txt(tds[6])) },
            parcelas: { valores: money(txt(tds[7])), n: inputs(tds[7]), max: maxOf(txt(tds[7])) },
            pf: { texto: txt(tds[8]), valor: inputs(tds[8]) }
        };
    });
}

function comparar(site, basico) {
    const difs = [], conhecidas = [];
    if (site.length !== basico.length) difs.push({ campo: 'qtdLinhas', site: site.length, basico: basico.length });
    site.forEach((s, i) => {
        const b = basico[i] || {};
        const nome = s.nome.slice(0, 40);
        const cmp = (campo, vs, vb) => { if (JSON.stringify(vs) !== JSON.stringify(vb)) difs.push({ linha: nome, campo, site: vs, basico: vb }); };
        if (s.inelegivel !== undefined || b.inelegivel !== undefined) { cmp('inelegivel', s.inelegivel, b.inelegivel); return; }
        cmp('vantagens', s.vantagens, b.vantagens);
        cmp('divida', s.divida, b.divida);
        cmp('opcoes', s.opcoes, b.opcoes);
        cmp('reducao', s.reducao, b.reducao);
        cmp('saldo', s.saldo, b.saldo);
        cmp('entrada.sem', s.entrada.sem, b.entrada.sem);
        cmp('entrada.n', s.entrada.n, b.entrada.n);
        cmp('entrada.max', s.entrada.max, b.entrada.max);
        cmp('entrada.valor', s.entrada.valores[0], b.entrada.valores[0]);
        cmp('entrada.valorParcela', s.entrada.valores[1], b.entrada.valores[1]);
        cmp('parcelas', s.parcelas, b.parcelas);
        cmp('pf', s.pf, b.pf);
    });
    return { difs, conhecidas };
}

(async () => {
    const cenarios = [...FIXOS, ...Array.from({ length: N_ALEATORIOS }, (_, i) => aleatorio(i))];
    console.log(`Comparando interfaces (site ${LOCAL ? 'local' : 'ao vivo'} × simulador básico): ${cenarios.length} cenários, digitação tecla a tecla.`);
    const s = await abrirSite({ local: LOCAL, headless: !VER });
    const paginaBasico = await s.context.newPage();
    const erros = [];
    paginaBasico.on('pageerror', e => erros.push(String(e.message || e)));
    const relatorio = [];
    let ok = 0;

    for (let k = 0; k < cenarios.length; k++) {
        const c = cenarios[k];
        if (k > 0) { await s.page.reload({ waitUntil: 'load' }); await s.page.waitForFunction(() => typeof estadoGlobal !== 'undefined'); await s.page.waitForTimeout(300); }
        await paginaBasico.goto(URL_BASICO);
        let falha = null;
        try {
            await SITE.preencher(s.page, c);
            await BASICO.preencher(paginaBasico, c);
            const plano = await planejarAcoes(s.page, c);
            for (const acao of plano) {
                const resolvido = {};
                await executarAcao(s.page, SITE, acao, resolvido);
                await executarAcao(paginaBasico, BASICO, acao, resolvido);
                if (resolvido.erro) throw new Error(resolvido.erro);
            }
        } catch (e) { falha = String(e.message || e).split('\n')[0]; }
        await s.page.waitForTimeout(150);
        await paginaBasico.waitForTimeout(150);
        const qSite = await s.page.evaluate(extrairQuadro, SITE.seletorLinhas);
        const qBasico = await paginaBasico.evaluate(extrairQuadro, BASICO.seletorLinhas);
        const { difs, conhecidas } = comparar(qSite, qBasico);
        if (!difs.length && !falha) ok++;
        console.log(`${String(k + 1).padStart(2)}. ${c.nome.padEnd(66).slice(0, 66)} ${falha ? 'FALHA: ' + falha : difs.length ? `${difs.length} divergência(s)` : 'idêntico ✔'}${conhecidas.length ? ` (+${conhecidas.length} bug conhecido do site)` : ''}`);
        relatorio.push({ cenario: c, falha, divergencias: difs, diferencasConhecidas: conhecidas, quadroSite: qSite, quadroBasico: qBasico });
    }
    await s.fechar();
    fs.writeFileSync(path.join(SAIDA, 'teste-interface.json'), JSON.stringify({ geradoEm: new Date().toISOString(), total: cenarios.length, identicos: ok, errosJsSimuladorBasico: erros, relatorio }, null, 2));
    console.log(`\nRESULTADO: ${ok}/${cenarios.length} idênticos. Erros JS no simulador básico: ${erros.length}`);
    process.exitCode = ok === cenarios.length && !erros.length ? 0 : 1;
})().catch(e => { console.error(e); process.exit(2); });
