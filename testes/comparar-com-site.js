/**
 * comparar-com-site.js
 * Teste diferencial em massa: gera N cenários aleatórios (semente fixa), executa cada um
 * no CÓDIGO REAL do site (Chrome, chamando as mesmas funções que a interface chama) e no
 * motor local, e compara campo a campo (igualdade exata de ponto flutuante).
 *
 * Uso:  node comparar-com-site.js [--n=3000] [--seed=42] [--local]
 * Saída: testes/saida/comparacao.json
 */
const fs = require('fs');
const path = require('path');
const { abrirSite, lerEstadoNoSite, compararSiteComMotor } = require('./site-driver');
const Motor = require('../simulador-basico/motor-calculo.js');

const arg = (nome, padrao) => {
    const a = process.argv.find(x => x.startsWith(`--${nome}=`));
    return a ? a.split('=')[1] : padrao;
};
const N = parseInt(arg('n', '3000'), 10);
const SEED = parseInt(arg('seed', '42'), 10);
const LOCAL = process.argv.includes('--local');
const SAIDA = path.join(__dirname, 'saida');
fs.mkdirSync(SAIDA, { recursive: true });

// ---------------------------------------------------------------- gerador
function rng(seed) {
    let s = seed >>> 0;
    return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const rnd = rng(SEED);
const escolher = arr => arr[Math.floor(rnd() * arr.length)];
const chance = p => rnd() < p;
const centavos = v => Math.round(v * 100) / 100;
const logUniforme = (min, max) => Math.exp(Math.log(min) + rnd() * (Math.log(max) - Math.log(min)));

// Valores "de fronteira" que mudam elegibilidade/limites
const FRONTEIRAS = [97260, 97260.01, 88418.18, 88418.19, 8105, 8105.01, 7368.18, 7368.19, 50000000, 50000000.01, 40909090.9, 40909090.91, 200, 300, 2000, 6000];

function gerarTotal() {
    if (chance(0.15)) return escolher(FRONTEIRAS);
    return centavos(logUniforme(50, 70000000));
}

function dividirTotal(total) {
    const r = rnd();
    let fP, fM;
    if (r < 0.1) { fP = 1; fM = 0; }               // só principal
    else if (r < 0.15) { fP = 0; fM = 0.6; }       // sem principal
    else if (r < 0.2) { fP = 0.02; fM = 0.5; }     // principal minúsculo (entrada > principal)
    else { fP = 0.3 + rnd() * 0.65; fM = rnd() * (1 - fP); }
    const principal = centavos(total * fP);
    const multa = centavos(total * fM);
    const juros = Math.max(0, centavos(total - principal - multa));
    return { principal, multa, juros };
}

function gerarCenario(i) {
    const tipo = escolher(['PN', 'PN_OBITO', 'MEI', 'ME_EPP', 'DEMAIS_PJ']);
    const pj = ['MEI', 'ME_EPP', 'DEMAIS_PJ'].includes(tipo);
    const c = {
        id: i,
        tipo,
        falido: pj && chance(0.2),
        baixado: pj && chance(0.15),
        modo: chance(0.5) ? 'AGREGADO' : 'POR_DEBITO'
    };
    let total;
    if (c.modo === 'AGREGADO') {
        c.agregado = dividirTotal(gerarTotal());
        total = c.agregado.principal + c.agregado.multa + c.agregado.juros;
        if (total <= 0) { c.agregado.principal = 1000; total = 1000 + c.agregado.multa + c.agregado.juros; }
    } else {
        const qtd = 1 + Math.floor(rnd() * 5);
        c.debitos = [];
        for (let k = 0; k < qtd; k++) c.debitos.push(chance(0.08) ? { principal: 0, multa: 0, juros: 0 } : dividirTotal(chance(0.5) ? gerarTotal() : centavos(logUniforme(50, 200000))));
        total = c.debitos.reduce((a, d) => a + d.principal + d.multa + d.juros, 0);
        if (total <= 0) { c.debitos[0] = { principal: 5000, multa: 500, juros: 100 }; total = 5600; }
    }

    // "Valor total da dívida na PGFN e RFB"
    const rd = rnd();
    c.divida = rd < 0.1 ? 0 : rd < 0.4 ? centavos(total) : centavos(total * (0.2 + rnd() * 3));

    // CAPAG — mira em cada faixa de rating (relação dívida/capag), inclusive fronteiras exatas
    const rc = rnd();
    const baseRating = c.divida > 0 ? c.divida : total;
    if (rc < 0.06) c.capag = 0;
    else if (rc < 0.2) c.capag = centavos(baseRating / escolher([0.5, 1, 2])); // fronteira
    else c.capag = centavos(baseRating / (0.1 + rnd() * 4));
    if (c.capag < 0) c.capag = 0;

    // Interações (ordem canônica: natureza -> opcao -> entrada -> parcelas -> pfbcn)
    c.acoes = {};
    const quer = chance(0.7);
    if (quer) {
        if (chance(0.5)) c.acoes.RFB_PEQUENO_VALOR = limpar({ opcao: chance(0.8) ? Math.floor(rnd() * 4) : undefined, parcelas: chance(0.6) ? inteiroAleatorio(60) : undefined });
        if (chance(0.6)) c.acoes.RFB_GERAL_50M = limpar({ opcao: chance(0.5) ? Math.floor(rnd() * 2) : undefined, entrada: chance(0.5) ? inteiroAleatorio(12) : undefined, parcelas: chance(0.6) ? inteiroAleatorio(140) : undefined, pfFrac: chance(0.5) ? escolher([0, 0.1, 0.5, 0.99, 1, 1.01, 1.3, rnd()]) : undefined });
        if (chance(0.5)) c.acoes.PGFN_PEQUENO_VALOR = limpar({ opcao: chance(0.8) ? Math.floor(rnd() * 6) : undefined, entrada: chance(0.5) ? inteiroAleatorio(7) : undefined, parcelas: chance(0.6) ? inteiroAleatorio(65) : undefined });
        if (chance(0.6)) c.acoes.PGFN_CAPACIDADE_PAGAMENTO = limpar({ natureza: chance(0.5) ? escolher(['FAZENDARIO', 'PREVIDENCIARIO']) : undefined, opcao: chance(0.5) ? Math.floor(rnd() * 2) : undefined, entrada: chance(0.5) ? inteiroAleatorio(14) : undefined, parcelas: chance(0.6) ? inteiroAleatorio(140) : undefined });
    }
    return c;
}
function inteiroAleatorio(max) { return chance(0.05) ? 0 : 1 + Math.floor(rnd() * max); }
function limpar(o) { Object.keys(o).forEach(k => o[k] === undefined && delete o[k]); return o; }

// ------------------------------------------------- execução dentro do site
// Esta função roda DENTRO da página (chama as mesmas funções que a interface).
function rodarCenarioNoSite(c) {
    const fmt = v => (Math.round(v * 100) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const aplicadas = {};
    try {
        // reset completo do estado entre cenários
        estadoGlobal.modalidades = [];
        estadoGlobal.interface.simulacaoLiberada = false;
        estadoGlobal.interface.ordenacaoQuadroResumo = { coluna: null, direcao: 'ASC' };
        estadoGlobal.interface.filtroPfBcnQuadroResumo = null;
        estadoGlobal.debitos = [];
        document.getElementById('id-corpo-tabela-debitos').innerHTML = '';
        estadoGlobal.debitosAgregados = { principal: 0, multa: 0, juros: 0, total: 0 };
        ['principal', 'multa', 'juros'].forEach(k => { document.getElementById('id-agregado-' + k).value = ''; });
        delete estadoGlobal.capag;
        estadoGlobal.modoSimulacaoDivida = null;

        // 1. perfil
        document.querySelectorAll('input[name="tipo_contribuinte"]').forEach(r => { r.checked = r.value === c.tipo; });
        document.getElementById('sit-falido').checked = !!c.falido;
        document.getElementById('sit-baixado').checked = !!c.baixado;
        atualizarPerfilContribuinte();

        // 2. composição da dívida
        selecionarModoSimulacao(c.modo);
        if (c.modo === 'AGREGADO') {
            ['principal', 'multa', 'juros'].forEach(k => {
                const el = document.getElementById('id-agregado-' + k);
                el.value = fmt(c.agregado[k]);
                atualizarValorAgregado(el, k);
            });
        } else {
            c.debitos.forEach((d, i) => {
                if (i > 0) incluirLinhaDebito();
                const tr = document.getElementById('id-corpo-tabela-debitos').rows[i];
                ['principal', 'multa', 'juros'].forEach(k => {
                    const el = tr.querySelector(`input[data-campo="${k}"]`);
                    el.value = fmt(d[k]);
                    atualizarValorDebito(el);
                });
            });
        }
        confirmarTotalDebitos(document.getElementById(c.modo === 'AGREGADO' ? 'btnConfirmarTotalDebitosAgregado' : 'btnConfirmarTotalDebitos'));

        // 3. classificação (CAPAG)
        const capagEl = document.getElementById('caPag');
        document.getElementById('totalDebitosNaoContencioso').value = fmt(c.divida);
        capagEl.value = fmt(c.capag);
        calcularRating(capagEl);

        // 4. simular
        liberarSimulacao();

        // 5. interações no Quadro-Resumo
        const achar = k => estadoGlobal.modalidades.find(m => m.chaveModalidade === k);
        for (const [chave, a] of Object.entries(c.acoes || {})) {
            const m0 = achar(chave);
            if (!m0 || !m0.elegivel || !m0.resultadoAtual) continue;
            const ap = {};
            if (a.natureza && m0.possuiSeletorNatureza) { alterarNaturezaModalidade(chave, a.natureza); ap.natureza = a.natureza; }
            if (a.opcao !== undefined) { alterarOpcaoModalidade(chave, String(a.opcao)); ap.opcao = a.opcao; }
            if (a.entrada !== undefined && achar(chave).permiteEditarParcelasEntrada) { alterarParcelasEntradaModalidade(chave, String(a.entrada)); ap.parcelasEntrada = a.entrada; }
            if (a.parcelas !== undefined) { alterarParcelasModalidade(chave, String(a.parcelas)); ap.parcelas = a.parcelas; }
            if (a.pfFrac !== undefined && chave === 'RFB_GERAL_50M') {
                const m = achar(chave);
                const r = m.resultadoAtual;
                if (m.elegivel && r && r.usoPfBcn) {
                    const tipoDeb = obterTipoDebitoAtivoRfb50m(m);
                    const limite = obterLimitePfBcnPorTipoDebito(r, tipoDeb);
                    const valor = fmt(Math.max(0, a.pfFrac * limite));
                    alterarUsoPfBcnModalidade(chave, valor);
                    ap.valorPfBcn = valor;
                }
            }
            aplicadas[chave] = ap;
        }
        return Object.assign(lerEstadoNoSiteInjetado(), { aplicadas, erro: null });
    } catch (e) {
        return { erro: String(e && e.stack || e), aplicadas };
    }
}

function entradaMotor(c, aplicadas) {
    const escolhas = {};
    Object.entries(aplicadas || {}).forEach(([chave, a]) => { escolhas[chave] = a; });
    return {
        tipoContribuinte: c.tipo,
        situacao: { falidoRecuperacao: c.falido, baixadoInapto: c.baixado },
        modo: c.modo, agregado: c.agregado, debitos: c.debitos,
        capag: c.capag, dividaTotalPgfnRfb: c.divida, escolhas
    };
}

(async () => {
    const t0 = Date.now();
    console.log(`Abrindo ${LOCAL ? 'cópia LOCAL' : 'site AO VIVO'} no Chrome... (${N} cenários, semente ${SEED})`);
    const s = await abrirSite({ local: LOCAL, headless: true });
    // injeta o leitor de estado como função global da página
    await s.page.evaluate(`window.lerEstadoNoSiteInjetado = ${lerEstadoNoSite.toString()};`);
    s.definirFase('fuzz');

    const resultados = { total: 0, identicos: 0, comDivergencia: 0, errosSite: 0, errosMotor: 0, porCampo: {}, exemplos: [] };
    const cobertura = { elegiveis: {}, ratingsRfb: {}, ratingsPgfn: {}, opcoes: {}, pfbcnAplicado: 0, erroPfBcn: 0 };
    for (let i = 0; i < N; i++) {
        const c = gerarCenario(i);
        const site = await s.page.evaluate(rodarCenarioNoSite, c);
        resultados.total++;
        if (site.erro) {
            resultados.errosSite++;
            if (resultados.exemplos.length < 60) resultados.exemplos.push({ cenario: c, erroSite: site.erro });
            continue;
        }
        let motor;
        try { motor = Motor.simular(entradaMotor(c, site.aplicadas)); }
        catch (e) {
            resultados.errosMotor++;
            if (resultados.exemplos.length < 60) resultados.exemplos.push({ cenario: c, erroMotor: String(e.stack || e) });
            continue;
        }
        let difs = compararSiteComMotor(site, motor, Motor);

        // Peculiaridade do site: a "auto-correção" de opção feita num estado INTERMEDIÁRIO da
        // digitação fica memorizada (registrarModalidade preserva opcaoSelecionadaIndex).
        // Se a única diferença vier daí, rodar o motor com a mesma opção deve dar igualdade exata.
        if (difs.length) {
            const chavesOpcao = [...new Set(difs.filter(d => d.campo === 'opcaoSelecionadaIndex').map(d => d.chave))]
                .filter(ch => !(site.aplicadas[ch] && site.aplicadas[ch].opcao !== undefined));
            if (chavesOpcao.length) {
                const ent = entradaMotor(c, site.aplicadas);
                chavesOpcao.forEach(ch => {
                    const idx = site.mods.find(m => m.chave === ch).opcaoSelecionadaIndex;
                    ent.escolhas[ch] = Object.assign({}, ent.escolhas[ch], { opcao: idx });
                });
                const difs2 = compararSiteComMotor(site, Motor.simular(ent), Motor);
                if (difs2.length === 0) {
                    resultados.explicadasPorHistorico = (resultados.explicadasPorHistorico || 0) + 1;
                    if ((resultados.exemplosHistorico = resultados.exemplosHistorico || []).length < 10) {
                        resultados.exemplosHistorico.push({ cenarioId: c.id, modalidades: chavesOpcao, divergenciasAntes: difs.length });
                    }
                    difs = [];
                }
            }
        }

        if (difs.length === 0) resultados.identicos++;
        else {
            resultados.comDivergencia++;
            difs.forEach(d => { const k = `${d.chave}.${d.campo}`; resultados.porCampo[k] = (resultados.porCampo[k] || 0) + 1; });
            if (resultados.exemplos.length < 60) resultados.exemplos.push({ cenario: c, aplicadas: site.aplicadas, divergencias: difs.slice(0, 25) });
        }
        // cobertura
        motor.modalidades.forEach(m => {
            cobertura.elegiveis[m.chave] = (cobertura.elegiveis[m.chave] || 0) + (m.elegivel ? 1 : 0);
            if (m.elegivel) { const k = `${m.chave}:${m.opcaoCodigo}${m.natureza ? '/' + m.natureza : ''}`; cobertura.opcoes[k] = (cobertura.opcoes[k] || 0) + 1; }
            if (m.chave === 'RFB_GERAL_50M' && m.exibicao && m.exibicao.pfBcn.valor > 0) cobertura.pfbcnAplicado++;
            if (m.chave === 'RFB_GERAL_50M' && m.exibicao && m.exibicao.pfBcn.erro) cobertura.erroPfBcn++;
        });
        cobertura.ratingsRfb[motor.classificacao.rfb.rating] = (cobertura.ratingsRfb[motor.classificacao.rfb.rating] || 0) + 1;
        cobertura.ratingsPgfn[motor.classificacao.pgfn.rating] = (cobertura.ratingsPgfn[motor.classificacao.pgfn.rating] || 0) + 1;
        if ((i + 1) % 500 === 0) console.log(`  ${i + 1}/${N} — idênticos: ${resultados.identicos}, divergentes: ${resultados.comDivergencia}, erros site/motor: ${resultados.errosSite}/${resultados.errosMotor}`);
    }
    const requisicoesFuzz = s.log.requisicoes.filter(r => r.fase === 'fuzz' && !['font', 'image'].includes(r.tipo));
    await s.fechar();

    const saida = { geradoEm: new Date().toISOString(), modo: LOCAL ? 'local' : 'ao-vivo', semente: SEED, duracao_s: Math.round((Date.now() - t0) / 1000), resultados, cobertura, requisicoesDuranteFuzz: requisicoesFuzz, errosPagina: s.log.errosPagina.slice(0, 50) };
    fs.writeFileSync(path.join(SAIDA, 'comparacao.json'), JSON.stringify(saida, null, 2));
    console.log('\nRESULTADO:', JSON.stringify({ total: resultados.total, identicos: resultados.identicos, dosQuaisExplicadosPorHistoricoDeDigitacao: resultados.explicadasPorHistorico || 0, comDivergencia: resultados.comDivergencia, errosSite: resultados.errosSite, errosMotor: resultados.errosMotor }));
    console.log('Divergências por campo:', resultados.porCampo);
    console.log('Cobertura:', JSON.stringify(cobertura));
    console.log('Requisições (exceto fontes/imagens) durante o fuzz:', requisicoesFuzz.length);
    process.exitCode = resultados.comDivergencia || resultados.errosMotor ? 1 : 0;
})().catch(e => { console.error(e); process.exit(2); });
