/**
 * mapear-requisicoes.js
 * Abre o simulador oficial num Chrome real, faz várias simulações CLICANDO na interface
 * (como um usuário), registra TODAS as requisições de rede por fase e confere cada
 * resultado do Quadro-Resumo com o motor local (../simulador-basico/motor-calculo.js).
 *
 * Uso:  node mapear-requisicoes.js            (site ao vivo, headless)
 *       node mapear-requisicoes.js --local    (HTML/JS servidos dos arquivos salvos)
 *       node mapear-requisicoes.js --ver      (abre a janela do navegador)
 * Saída: testes/saida/mapeamento-requisicoes.{json,md} e prints caso-N.png
 */
const fs = require('fs');
const path = require('path');
const { abrirSite, lerEstadoNoSite, compararSiteComMotor, URL_SITE } = require('./site-driver');
const Motor = require('../simulador-basico/motor-calculo.js');

const ARGS = process.argv.slice(2);
const LOCAL = ARGS.includes('--local');
const VER = ARGS.includes('--ver');
const SAIDA = path.join(__dirname, 'saida');
fs.mkdirSync(SAIDA, { recursive: true });

const RADIO_TIPO = { PN: 'op-pn', PN_OBITO: 'op-pn-obito', MEI: 'op-mei', ME_EPP: 'op-me-epp', DEMAIS_PJ: 'op-demais-pj' };
const TEXTO_LINHA = {
    RFB_PEQUENO_VALOR: 'RFB – Edital nº 10/2026',
    RFB_GERAL_50M: 'RFB - Edital nº 9/2026',
    PGFN_PEQUENO_VALOR: 'PGFN – Edital 06/2026 - Até 60',
    PGFN_CAPACIDADE_PAGAMENTO: 'PGFN – Edital 06/2026 - Conforme a Capacidade'
};

// Ações por modalidade, SEMPRE nesta ordem canônica: natureza -> opcao -> entrada -> parcelas -> pfbcn
const CASOS = [
    {
        nome: 'Print do usuário — Demais PJ, valor agregado',
        tipo: 'DEMAIS_PJ', modo: 'AGREGADO',
        agregado: { principal: 3000000, multa: 1500000, juros: 200000 },
        capag: 4000000, divida: 4700000
    },
    {
        nome: 'Demais PJ — mesmo caso + interações (natureza, opção, parcelas, entrada, PF/BCN)',
        tipo: 'DEMAIS_PJ', modo: 'AGREGADO',
        agregado: { principal: 3000000, multa: 1500000, juros: 200000 },
        capag: 4000000, divida: 4700000,
        acoes: {
            RFB_GERAL_50M: { entrada: 3, parcelas: 60, pfbcn: 100000 },
            PGFN_CAPACIDADE_PAGAMENTO: { natureza: 'PREVIDENCIARIO', entrada: 4 }
        }
    },
    {
        nome: 'ME/EPP — simulação por débito (3 débitos)',
        tipo: 'ME_EPP', modo: 'POR_DEBITO',
        debitos: [
            { principal: 20000, multa: 4000, juros: 3000 },
            { principal: 150000, multa: 30000, juros: 20000 },
            { principal: 60000, multa: 0, juros: 5000 }
        ],
        capag: 50000, divida: 400000,
        acoes: { RFB_PEQUENO_VALOR: { opcao: 3, parcelas: 40 }, PGFN_PEQUENO_VALOR: { opcao: 5, entrada: 2, parcelas: 20 } }
    },
    {
        nome: 'MEI — débito pequeno (até 5 salários-mínimos)',
        tipo: 'MEI', modo: 'AGREGADO',
        agregado: { principal: 5000, multa: 500, juros: 300 },
        capag: 10000, divida: 6000,
        acoes: { RFB_PEQUENO_VALOR: { opcao: 1, parcelas: 10 }, PGFN_PEQUENO_VALOR: { parcelas: 12 } }
    },
    {
        nome: 'Pessoa Natural com indicativo de óbito (rating D forçado)',
        tipo: 'PN_OBITO', modo: 'AGREGADO',
        agregado: { principal: 60000, multa: 12000, juros: 8000 },
        capag: 500000, divida: 80000,
        acoes: { PGFN_CAPACIDADE_PAGAMENTO: { opcao: 1 } }
    },
    {
        nome: 'Pessoa Natural — rating A (sem desconto na transação por capacidade)',
        tipo: 'PN', modo: 'AGREGADO',
        agregado: { principal: 40000, multa: 8000, juros: 2000 },
        capag: 200000, divida: 50000
    },
    {
        nome: 'Demais PJ falida/em recuperação — 15 milhões',
        tipo: 'DEMAIS_PJ', falido: true, modo: 'AGREGADO',
        agregado: { principal: 10000000, multa: 3000000, juros: 2000000 },
        capag: 1000000, divida: 20000000,
        acoes: { RFB_GERAL_50M: { opcao: 1, pfbcn: 500000 } }
    },
    {
        nome: 'Demais PJ — acima de R$ 50 milhões (inelegível em quase tudo)',
        tipo: 'DEMAIS_PJ', modo: 'AGREGADO',
        agregado: { principal: 40000000, multa: 15000000, juros: 5000000 },
        capag: 10000000, divida: 60000000
    }
];

function digitos(valor) { return String(Math.round(valor * 100)); }

async function fecharModais(page) {
    for (let i = 0; i < 4; i++) {
        const botao = page.locator('#id-entendi');
        if (await botao.isVisible().catch(() => false)) {
            await botao.click({ timeout: 3000 }).catch(() => {});
            await page.waitForTimeout(150);
        } else return;
    }
}

async function clicar(page, seletor) {
    await fecharModais(page);
    try { await page.click(seletor, { timeout: 5000 }); }
    catch { await fecharModais(page); await page.click(seletor, { timeout: 5000, force: true }); }
    await page.waitForTimeout(80);
    await fecharModais(page);
}

async function digitarMoeda(page, locator, valor) {
    await fecharModais(page);
    await locator.click({ timeout: 5000 }).catch(() => {});
    await fecharModais(page);
    await locator.fill(digitos(valor));   // dispara "input" -> máscara do site
    await locator.press('Tab');           // dispara "change"
    await page.waitForTimeout(80);
    await fecharModais(page);
}

async function digitarInteiro(page, locator, valor) {
    await fecharModais(page);
    await locator.fill(String(valor));
    await locator.press('Tab');
    await page.waitForTimeout(80);
    await fecharModais(page);
}

function linhaModalidade(page, chave) {
    return page.locator('#id-corpo-quadro-resumo tr', { hasText: TEXTO_LINHA[chave] }).first();
}

async function executarCasoNaInterface(page, caso) {
    await clicar(page, `label[for="${RADIO_TIPO[caso.tipo]}"]`);
    if (['MEI', 'ME_EPP', 'DEMAIS_PJ'].includes(caso.tipo)) {
        if (caso.falido) await clicar(page, 'label[for="sit-falido"]');
        if (caso.baixado) await clicar(page, 'label[for="sit-baixado"]');
        if (!caso.falido && !caso.baixado) await clicar(page, 'label[for="sit-nenhuma"]');
    }

    if (caso.modo === 'AGREGADO') {
        await clicar(page, 'label[for="modo-agregado"]');
        for (const campo of ['principal', 'multa', 'juros']) {
            await digitarMoeda(page, page.locator(`#id-agregado-${campo}`), caso.agregado[campo]);
        }
        await clicar(page, '#btnConfirmarTotalDebitosAgregado');
    } else {
        await clicar(page, 'label[for="modo-por-debito"]');
        for (let i = 0; i < caso.debitos.length; i++) {
            if (i > 0) await clicar(page, '#id-btn-incluir-debito');
            const tr = page.locator('#id-corpo-tabela-debitos tr').nth(i);
            for (const campo of ['principal', 'multa', 'juros']) {
                await digitarMoeda(page, tr.locator(`input[data-campo="${campo}"]`), caso.debitos[i][campo]);
            }
        }
        await clicar(page, '#btnConfirmarTotalDebitos');
    }

    await digitarMoeda(page, page.locator('#caPag'), caso.capag);
    await digitarMoeda(page, page.locator('#totalDebitosNaoContencioso'), caso.divida);
    await clicar(page, '#btnSimularModalidades');
    await page.waitForTimeout(400);

    for (const [chave, a] of Object.entries(caso.acoes || {})) {
        if (a.natureza) await linhaModalidade(page, chave).locator('select').first().selectOption(a.natureza);
        if (a.opcao !== undefined) {
            const selects = linhaModalidade(page, chave).locator('select');
            const sel = (await selects.count()) > 1 ? selects.nth(1) : selects.first();
            await sel.selectOption(String(a.opcao));
        }
        if (a.entrada !== undefined) await digitarInteiro(page, linhaModalidade(page, chave).locator('td').nth(6).locator('input'), a.entrada);
        if (a.parcelas !== undefined) await digitarInteiro(page, linhaModalidade(page, chave).locator('td').nth(7).locator('input'), a.parcelas);
        if (a.pfbcn !== undefined) await digitarMoeda(page, linhaModalidade(page, chave).locator('td').nth(8).locator('input'), a.pfbcn);
        await page.waitForTimeout(150);
    }
}

function entradaMotor(caso) {
    const escolhas = {};
    for (const [chave, a] of Object.entries(caso.acoes || {})) {
        escolhas[chave] = { natureza: a.natureza, opcao: a.opcao, parcelasEntrada: a.entrada, parcelas: a.parcelas, valorPfBcn: a.pfbcn };
    }
    return {
        tipoContribuinte: caso.tipo,
        situacao: { falidoRecuperacao: !!caso.falido, baixadoInapto: !!caso.baixado },
        modo: caso.modo, agregado: caso.agregado, debitos: caso.debitos,
        capag: caso.capag, dividaTotalPgfnRfb: caso.divida, escolhas
    };
}

function hostDe(url) { try { return new URL(url).host; } catch { return url.slice(0, 40); } }

(async () => {
    console.log(`Abrindo ${LOCAL ? 'cópia LOCAL (servida na URL oficial)' : 'site AO VIVO'} no Chrome...`);
    const s = await abrirSite({ local: LOCAL, headless: !VER });
    const relatorioCasos = [];

    for (let i = 0; i < CASOS.length; i++) {
        const caso = CASOS[i];
        const n = i + 1;
        if (i > 0) {
            s.definirFase(`caso-${n}:recarregar-pagina`);
            await s.page.reload({ waitUntil: 'load' });
            await s.page.waitForFunction(() => typeof estadoGlobal !== 'undefined');
            await s.page.waitForTimeout(800);
        }
        s.definirFase(`caso-${n}:simulacao`);
        process.stdout.write(`Caso ${n}/${CASOS.length}: ${caso.nome} ... `);
        let erro = null;
        try { await executarCasoNaInterface(s.page, caso); } catch (e) { erro = String(e.message || e); }
        await s.page.waitForTimeout(500);

        const estado = await s.page.evaluate(lerEstadoNoSite);
        const quadro = s.page.locator('#id-quadro-resumo');
        if (await quadro.isVisible().catch(() => false)) {
            await quadro.screenshot({ path: path.join(SAIDA, `caso-${n}.png`) }).catch(() => {});
        }

        const motor = Motor.simular(entradaMotor(caso));
        const difs = compararSiteComMotor(estado, motor, Motor);
        const reqsCaso = s.log.requisicoes.filter(r => r.fase === `caso-${n}:simulacao`);
        console.log(erro ? `ERRO: ${erro}` : (difs.length ? `${difs.length} divergência(s)` : 'site = motor ✔'), `| requisições durante a simulação: ${reqsCaso.length}`);
        relatorioCasos.push({ caso: n, nome: caso.nome, entrada: entradaMotor(caso), erro, divergencias: difs, linhasQuadro: estado.linhas, requisicoesDuranteSimulacao: reqsCaso });
    }

    s.definirFase('fim');
    await s.fechar();

    const reqs = s.log.requisicoes;
    const porFase = {};
    reqs.forEach(r => { porFase[r.fase] = (porFase[r.fase] || 0) + 1; });
    const porHost = {};
    reqs.forEach(r => { const h = hostDe(r.url); porHost[h] = (porHost[h] || 0) + 1; });
    const naoGet = reqs.filter(r => r.metodo !== 'GET');
    const xhr = reqs.filter(r => ['xhr', 'fetch', 'websocket', 'eventsource'].includes(r.tipo));

    const json = { geradoEm: new Date().toISOString(), modo: LOCAL ? 'local' : 'ao-vivo', url: URL_SITE, resumo: { totalRequisicoes: reqs.length, porFase, porHost, naoGet: naoGet.length, xhrFetch: xhr.length }, casos: relatorioCasos, requisicoes: reqs, websockets: s.log.websockets, errosPagina: s.log.errosPagina, console: s.log.console };
    fs.writeFileSync(path.join(SAIDA, 'mapeamento-requisicoes.json'), JSON.stringify(json, null, 2));

    // Relatório em Markdown
    const md = [];
    md.push(`# Mapeamento de requisições — Simulador de Negociações (RFB/PGFN)`, '');
    md.push(`- Gerado em: ${json.geradoEm}`, `- Origem: ${LOCAL ? 'cópia local servida na URL oficial' : 'site ao vivo'} — ${URL_SITE}`, `- Total de requisições: **${reqs.length}** | métodos ≠ GET: **${naoGet.length}** | XHR/fetch: **${xhr.length}** | WebSockets: **${s.log.websockets.length}**`, '');
    md.push('## Requisições por fase', '', '| Fase | Requisições |', '|---|---|');
    Object.entries(porFase).forEach(([f, c]) => md.push(`| ${f} | ${c} |`));
    md.push('', '## Requisições por servidor', '', '| Servidor | Requisições |', '|---|---|');
    Object.entries(porHost).sort((a, b) => b[1] - a[1]).forEach(([h, c]) => md.push(`| ${h} | ${c} |`));
    md.push('', '## XHR / fetch / não-GET (qualquer fase)', '');
    const especiais = reqs.filter(r => r.metodo !== 'GET' || ['xhr', 'fetch'].includes(r.tipo));
    if (!especiais.length) md.push('_Nenhuma._');
    especiais.forEach(r => md.push(`- [${r.fase}] ${r.metodo} ${r.tipo} ${r.status ?? ''} ${r.url}${r.corpo ? ' — corpo: `' + String(r.corpo).slice(0, 200) + '`' : ''}`));
    md.push('', '## Casos simulados pela interface', '');
    relatorioCasos.forEach(c => {
        md.push(`### Caso ${c.caso} — ${c.nome}`, '');
        md.push(`- Requisições disparadas durante a simulação: **${c.requisicoesDuranteSimulacao.length}**`);
        c.requisicoesDuranteSimulacao.forEach(r => md.push(`  - ${r.metodo} ${r.tipo} ${r.url}`));
        md.push(`- Comparação site × motor local: ${c.erro ? 'ERRO ' + c.erro : (c.divergencias.length ? `**${c.divergencias.length} divergência(s)**` : '**idêntico** ✔')}`);
        c.divergencias.slice(0, 20).forEach(d => md.push(`  - ${d.chave}.${d.campo}: site=${JSON.stringify(d.site)} motor=${JSON.stringify(d.motor)}`));
        md.push('', '| Modalidade | Redução | Saldo devedor | Entrada | Parcelas | PF/BCN |', '|---|---|---|---|---|---|');
        c.linhasQuadro.forEach(l => {
            if (l.length <= 2) md.push(`| ${l[0]} | ${l[1] || ''} | | | | |`);
            else md.push(`| ${l[0]} | ${l[4]} | ${l[5]} | ${l[6]} | ${l[7]} | ${l[8]} |`);
        });
        md.push('', `![caso ${c.caso}](caso-${c.caso}.png)`, '');
    });
    md.push('## Todas as requisições', '', '| # | t (ms) | Fase | Método | Tipo | Status | URL |', '|---|---|---|---|---|---|---|');
    reqs.forEach(r => md.push(`| ${r.id} | ${r.t_ms} | ${r.fase} | ${r.metodo} | ${r.tipo} | ${r.status ?? (r.falha || '')} | ${r.url.length > 140 ? r.url.slice(0, 140) + '…' : r.url} |`));
    if (s.log.errosPagina.length) { md.push('', '## Erros de JavaScript na página', ''); s.log.errosPagina.forEach(e => md.push(`- [${e.fase}] ${e.mensagem}`)); }
    fs.writeFileSync(path.join(SAIDA, 'mapeamento-requisicoes.md'), md.join('\n'));

    console.log('\nResumo por fase:', porFase);
    console.log('Requisições XHR/fetch:', xhr.length, '| não-GET:', naoGet.length, '| WebSockets:', s.log.websockets.length);
    console.log('Relatório: testes/saida/mapeamento-requisicoes.md');
})().catch(e => { console.error(e); process.exit(1); });
