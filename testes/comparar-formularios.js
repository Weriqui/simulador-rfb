/**
 * comparar-formularios.js
 * Compara o motor dos formulários (simulador-basico/motor-formularios.js) com o código REAL dos
 * formulários oficiais de adesão, rodando offline no Chrome (cópias em ../fontes-oficiais).
 * Cada cenário é preenchido no formulário com os mesmos eventos de um usuário; os textos da tela
 * são comparados com o motor por igualdade exata.
 *
 * Uso:
 *   node comparar-formularios.js                 # 300 cenários por formulário (semente 2026)
 *   node comparar-formularios.js --n=1000 --semente=7
 *   node comparar-formularios.js --so=FAZENDARIOS,CONTROVERSIA
 *   node comparar-formularios.js --fixos         # só os cenários gravados nos relatórios de pesquisa/
 */
const fs = require('fs');
const path = require('path');
const D = require('./formularios-driver');
const M = require('../simulador-basico/motor-formularios.js');

const args = Object.fromEntries(process.argv.slice(2).map(a => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v === undefined ? true : v];
}));
const N = parseInt(args.n || '300', 10);
let semente = parseInt(args.semente || '2026', 10);
const SO = args.so ? String(args.so).toUpperCase().split(',') : ['ATE60SM', 'FAZENDARIOS', 'PREVIDENCIARIOS', 'CONTROVERSIA'];

// ------------------------------ gerador pseudoaleatório -----------------------------------
const rnd = () => { semente = (semente * 1103515245 + 12345) % 2147483648; return semente / 2147483648; };
const escolha = arr => arr[Math.floor(rnd() * arr.length)];
const cent = max => Math.round(rnd() * max * 100) / 100;
const fracao = () => (rnd() < 0.15 ? null : rnd());   // null = deixa o padrão do formulário

// --------------------------------- cenários ----------------------------------------------
function casoAte60sm(d) {
    // d = { debitos:[{principal,multa,juros}], opcao:0..3, fracaoParcelas }
    const op = M.OPCOES_60SM[d.opcao];
    return {
        pagina: { meses: op.meses, debitos: d.debitos.map(x => ({ principal: D.centavos(x.principal), multa: D.centavos(x.multa), juros: D.centavos(x.juros) })) },
        motor: { formulario: 'ATE60SM', debitos: d.debitos, opcao: d.opcao },
        fracaoParcelas: d.fracaoParcelas === undefined ? null : d.fracaoParcelas
    };
}

function gerarAte60sm() {
    const nDeb = 1 + Math.floor(rnd() * 4);
    const escala = escolha([150, 400, 3000, 30000, 90000]);
    const debitos = [];
    for (let i = 0; i < nDeb; i++) {
        let principal = cent(escala), multa = cent(escala * escolha([0, 0.2, 0.5])), juros = cent(escala * escolha([0, 0.1, 0.4]));
        if (rnd() < 0.03) { principal = 97260 - multa - juros + escolha([0, 0.01]); }   // borda de 60 SM
        if (rnd() < 0.03) { principal = escolha([9.99, 10, 5]); multa = 0; juros = 0; } // piso do DARF
        debitos.push({ principal: Math.max(0, Math.round(principal * 100) / 100), multa, juros });
    }
    return casoAte60sm({ debitos, opcao: Math.floor(rnd() * 4), fracaoParcelas: fracao() });
}

function caso50M(d) {
    const dig = v => (v === null || v === undefined ? null : D.centavos(v));
    return {
        pagina: {
            tipo: d.tipo, falido: !!d.falido, baixado: !!d.baixado,
            debitos: d.debitos.map((x, i) => ({ principal: dig(x.principal), multa: dig(x.multa), juros: dig(x.juros), processo: x.processo || null })),
            divida: dig(d.divida), capag: dig(d.capag), comPf: !!d.comPf,
            pf: { montante: d.pf ? dig(d.pf.montante) : null, aliquota: d.pf && d.pf.aliquota !== null ? String(d.pf.aliquota) : null },
            bcn: { montante: d.bcn ? dig(d.bcn.montante) : null, aliquota: d.bcn && d.bcn.aliquota !== null ? String(d.bcn.aliquota) : null }
        },
        motor: {
            formulario: d.formulario, tipo: d.tipo, falido: d.falido, baixado: d.baixado, debitos: d.debitos,
            dividaPgfnRfb: d.divida, capag: d.capag, comPf: d.comPf, pf: d.pf, bcn: d.bcn
        },
        fracaoEntrada: d.fracaoEntrada === undefined ? null : d.fracaoEntrada,
        fracaoParcelas: d.fracaoParcelas === undefined ? null : d.fracaoParcelas
    };
}

function processo17() {
    const base = String(100000000000000 + Math.floor(rnd() * 8e14)).slice(0, 15);
    for (let dv = 0; dv < 100; dv++) {
        const p = base + String(dv).padStart(2, '0');
        if (M.processoValido(p)) return p;
    }
    return base;
}

function gerar50M(formulario) {
    const tipo = escolha(['PN', 'PN_OBITO', 'ME_EPP', 'DEMAIS_PJ']);
    const pj = tipo === 'ME_EPP' || tipo === 'DEMAIS_PJ';
    const falido = pj && rnd() < 0.15, baixado = pj && !falido && rnd() < 0.1;
    const nDeb = 1 + Math.floor(rnd() * 4);
    const escala = escolha([300, 2000, 50000, 1e6, 8e6]);
    const debitos = [];
    for (let i = 0; i < nDeb; i++) {
        let principal = cent(escala);
        const multa = cent(escala * escolha([0, 0.05, 0.3, 0.8, 1.5])), juros = cent(escala * escolha([0, 0.02, 0.2, 0.6]));
        if (principal + multa + juros < 10) principal = 10;
        let processo = rnd() < 0.5 ? processo17() : String(100000000000000 + Math.floor(rnd() * 8e14)).slice(0, 15);
        const borda = rnd();
        if (borda < 0.02) principal = 50000000 - multa - juros + escolha([0.01, 1000]);          // acima de R$ 50 mi
        else if (borda < 0.04) { principal = escolha([9.99, 5]); }                                // piso do DARF
        else if (borda < 0.06 && i > 0) processo = debitos[0].processo;                           // processo repetido
        else if (borda < 0.08) processo = processo.slice(0, 16);                                  // nº inválido
        debitos.push({ principal: Math.round(principal * 100) / 100, multa: borda < 0.04 && borda >= 0.02 ? 0 : multa, juros: borda < 0.04 && borda >= 0.02 ? 0 : juros, processo });
    }
    const T = debitos.reduce((a, x) => a + x.principal + x.multa + x.juros, 0);
    let divida = rnd() < 0.2 ? 0 : cent(T * escolha([0.1, 1, 3]));
    const alvo = escolha([0.3, 0.5, 0.7, 1.0, 1.2, 1.5, 1.8, 2.0, 2.5, 4]);
    let capag = rnd() < 0.06 ? 0 : Math.max(0.01, Math.round(((T + divida) / alvo) * (0.97 + rnd() * 0.06) * 100) / 100);
    if (capag && rnd() < 0.08) capag = Math.max(0.01, Math.round(((T + divida) / escolha([0.5, 1, 2])) * 100) / 100 + escolha([0, 0.01, -0.01]));   // fronteiras A/B, B/C, C/D
    if (rnd() < 0.03) divida = null;
    if (rnd() < 0.03) capag = null;
    const comPf = pj && rnd() < 0.5;
    const vazio = () => rnd() < 0.06;
    const pf = { montante: vazio() ? null : cent(T * escolha([0.1, 1, 3])), aliquota: vazio() ? null : escolha([0, 9, 15, 25, 34, 100]) };
    const bcn = { montante: vazio() ? null : cent(T * escolha([0, 0.5, 1])), aliquota: vazio() ? null : escolha([0, 9, 15, 20]) };
    return caso50M({ formulario, tipo, falido, baixado, debitos, divida, capag, comPf, pf, bcn, fracaoEntrada: fracao(), fracaoParcelas: fracao() });
}

function casoControversia(d) {
    const dig = v => (v === null || v === undefined ? null : D.centavos(v));
    const cr = c => (c ? { tipo: c.tipo || 'PF', montante: dig(c.montante), aliquota: c.aliquota || null, valor: dig(c.valor) } : null);
    return {
        pagina: {
            debitos: d.debitos.map(dig), opcao: d.opcao,
            pfProprio: cr(d.pfProprio), bcnProprio: cr(d.bcnProprio), terceiros: (d.terceiros || []).map(cr)
        },
        motor: {
            formulario: 'CONTROVERSIA', debitos: d.debitos, opcao: d.opcao,
            creditosProprios: { pf: d.pfProprio || null, bcn: d.bcnProprio || null },
            creditosTerceiros: d.terceiros || []
        },
        parcelasEntrada: d.parcelasEntrada === undefined ? 1 : d.parcelasEntrada,
        fracaoParcelas: d.fracaoParcelas === undefined ? null : d.fracaoParcelas
    };
}

function gerarControversia() {
    const nDeb = 1 + Math.floor(rnd() * 3);
    const escala = escolha([800, 20000, 300000, 5e6]);
    const debitos = [];
    for (let i = 0; i < nDeb; i++) debitos.push(Math.max(0.01, cent(escala)));
    const D0 = debitos.reduce((a, b) => a + b, 0);
    const opcao = 1 + Math.floor(rnd() * 8);
    const credito = (tipo) => {
        const montante = rnd() < 0.08 ? 0 : cent(D0 * escolha([0.05, 0.3, 1]));
        const aliquota = rnd() < 0.08 ? null : escolha(tipo === 'PF' ? [25, 9, 15, 20] : [9, 15, 20, 25]);
        const teto = montante * (aliquota || 0) / 100;
        const valor = rnd() < 0.15 ? Math.round(teto * 1.1 * 100) / 100 : Math.round(teto * rnd() * escolha([0.1, 0.5, 1]) * 100) / 100;
        return { tipo, montante, aliquota, valor: valor || 0.01 };
    };
    const pfProprio = rnd() < 0.35 ? credito('PF') : null;
    const bcnProprio = rnd() < 0.2 ? credito('BCN') : null;
    const terceiros = [];
    const nT = rnd() < 0.5 ? 0 : 1 + Math.floor(rnd() * 2);
    for (let i = 0; i < nT; i++) terceiros.push(credito(escolha(['PF', 'BCN'])));
    if (rnd() < 0.2) {
        // crédito de terceiro perto do teto de 30% da dívida reduzida (inclui o valor exato)
        const op = M.OPCOES_CONTROVERSIA[opcao - 1];
        const somaD = debitos.reduce((a, v) => a + v, 0);
        const teto = (somaD - somaD * op.reducao) * 0.3;
        const valor = Math.max(0.01, Math.round(teto * 100) / 100 + escolha([0, 0, 0.01, -0.01, 1]));
        terceiros.push({ tipo: 'PF', montante: Math.ceil(valor * 4 + 100), aliquota: 25, valor });
    }
    return casoControversia({ debitos, opcao, pfProprio, bcnProprio, terceiros, parcelasEntrada: rnd() < 0.1 ? null : 1, fracaoParcelas: fracao() });
}

// ------------------------------------ comparação -----------------------------------------
function comparar(campos) {
    return campos.filter(([, a, b]) => String(a) !== String(b)).map(([k, a, b]) => ({ campo: k, formulario: a, motor: b }));
}

function compararAte60sm(caso, tela) {
    const entrada = Object.assign({}, caso.motor, { parcelas: tela.parcelasEscolhidas ?? null });
    const m = M.simularFormulario(entrada);
    Object.defineProperty(m, '__entrada', { value: entrada, enumerable: false });
    const campos = [['totalGeral', tela.totalGeral, m.totalGeral], ['confirmou', tela.confirmou, m.erros.length === 0]];
    if (tela.confirmou && m.resultado) {
        const r = m.resultado;
        campos.push(['total', tela.total, r.total], ['criterio', tela.criterio, r.criterio], ['desconto', tela.desconto, r.desconto],
            ['saldo', tela.saldo, r.saldo], ['parcelasMaximo', tela.parcelasMaximo, r.parcelasMaximo], ['valorParcela', tela.valorParcela, r.valorParcela]);
    }
    return { dif: comparar(campos), motor: m };
}

function compararEntrada50M(caso, tela) {
    const entrada = Object.assign({}, caso.motor, {
        comPf: tela.comPf ?? caso.motor.comPf,
        parcelasEntrada: tela.entrada ? tela.entrada.parcelasEscolhidas : null,
        parcelas: tela.restante ? tela.restante.parcelasEscolhidas : null
    });
    const m = M.simularFormulario(entrada);
    Object.defineProperty(m, '__entrada', { value: entrada, enumerable: false });
    const recusouNosDebitos = m.erros.length > 0 && !m.classificacao && !m.erros.some(e => /dívida na PGFN/.test(e));
    const campos = [['totalGeral', tela.totalGeral, m.totalGeral], ['confirmou', tela.confirmou, !recusouNosDebitos]];
    if (tela.confirmou && m.classificacao) {
        const c = m.classificacao;
        campos.push(['totalDebitos', tela.classificacao.totalDebitos, c.totalDebitos], ['relacao', tela.classificacao.relacao, c.relacao],
            ['descontoTeorico', tela.classificacao.descontoTeorico, c.descontoTeorico], ['rating', tela.classificacao.rating, c.rating]);
    }
    if (tela.confirmou) campos.push(['modalidade', !!tela.modalidade, !!m.resultado]);
    if (tela.modalidade && m.resultado) {
        const r = m.resultado;
        campos.push(['comPf', tela.comPf, r.comPf]);
        const td = tela.descontos || [];
        const md = r.descontos ? r.descontos.linhas.concat([r.descontos.total]) : [];
        campos.push(['linhasDesconto', td.length, md.length]);
        td.forEach((l, i) => {
            const x = md[i] || {};
            if (i < md.length - 1) {
                campos.push([`desc${i}.maximo`, l.desconto_maximo, x.descontoMaximo], [`desc${i}.calculado`, l.desconto_calculado, x.descontoCalculado],
                    [`desc${i}.aplicado`, l.desconto_aplicado, x.descontoAplicado], [`desc${i}.saldo`, l.saldo_devedor_apos_descontos, x.saldo]);
            } else {
                campos.push(['descTotal.maximo', l.total_desconto_maximo, x.descontoMaximo], ['descTotal.calculado', l.total_desconto_calculado, x.descontoCalculado],
                    ['descTotal.aplicado', l.total_desconto_aplicado, x.descontoAplicado], ['descTotal.saldo', l.total_saldo_devedor_apos_descontos, x.saldo]);
            }
        });
        const e = tela.entrada, me = r.entrada;
        campos.push(['entrada.existe', !!e, !!me]);
        if (e && me) {
            campos.push(['entrada.totalDevido', e.totalDevido, me.totalDevido], ['entrada.exibida', e.entradaExibida, me.entradaExibida],
                ['entrada.parcelasMaximo', e.parcelasMaximo, me.parcelasMaximo], ['entrada.valorParcela', e.valorParcela, me.valorParcela]);
        }
        const p = tela.pf, mp = r.prejuizoFiscal;
        campos.push(['pf.existe', !!p, !!mp]);
        if (p && mp) {
            campos.push(['pf.saldoDevedor', p.saldo_devedor, mp.saldoDevedor], ['pf.limite', p.limite_abatimento, mp.limite], ['pf.proposto', p.abatimento_proposto, mp.proposto],
                ['pf.aplicado', p.abatimento_aplicado, mp.aplicado], ['pf.saldoAPagar', p.saldo_a_pagar, mp.saldoAPagar]);
        }
        const s = tela.restante, ms = r.restante;
        campos.push(['restante.existe', !!s, !!ms]);
        if (s && ms) {
            campos.push(['restante.criterio', s.criterio, ms.criterio], ['restante.saldo', s.saldo, ms.saldo],
                ['restante.parcelasMaximo', s.parcelasMaximo, ms.parcelasMaximo], ['restante.valorParcela', s.valorParcela, ms.valorParcela]);
        }
    }
    return { dif: comparar(campos), motor: m };
}

function compararControversia(caso, tela) {
    const entrada = Object.assign({}, caso.motor, { parcelasEntrada: tela.parcelasEntradaEscolhidas ?? null, parcelas: tela.parcelasEscolhidas ?? null });
    const m = M.simularFormulario(entrada);
    Object.defineProperty(m, '__entrada', { value: entrada, enumerable: false });
    const campos = [['totalDebitos', tela.totalDebitos, m.totalDebitos], ['totalCreditos', tela.totalCreditos, m.totalCreditos],
        ['calculou', tela.linhas.length > 0, !!m.resultado]];
    if (tela.linhas.length && m.resultado) {
        const r = m.resultado;
        const esperado = [r.dividaConsolidada, r.percentualReducao, r.valorReducao, r.dividaComReducao, r.percentualMaximoPfBcn, r.valorAmortizadoPfBcn,
            r.saldoDevedor, r.percentualEntrada, r.entrada, '0,00', r.saldoAposEntrada, '0,00', '', '', ''];
        const vistos = tela.valores;   // lidos logo depois de "Calcular", antes de escolher as parcelas
        campos.push(['qtdValores', vistos.length, esperado.length]);
        esperado.forEach((v, i) => campos.push([`linha${i}`, vistos[i], v]));
        campos.push(['parcelasEntradaMaximo', tela.parcelasEntradaMaximo, r.parcelasEntradaMaximo], ['parcelasMaximo', tela.parcelasMaximo, r.parcelasMaximo]);
        if (tela.parcelasEntradaEscolhidas) campos.push(['valorParcelaEntrada', tela.valorParcelaEntrada, r.valorParcelaEntrada]);
        if (tela.parcelasEscolhidas) campos.push(['valorParcela', tela.valorParcela, r.valorParcela]);
    }
    return { dif: comparar(campos), motor: m };
}

const RODAR = {
    ATE60SM: { gerar: gerarAte60sm, rodar: D.rodarAte60sm, comparar: compararAte60sm },
    FAZENDARIOS: { gerar: () => gerar50M('FAZENDARIOS'), rodar: D.rodar50M, comparar: compararEntrada50M },
    PREVIDENCIARIOS: { gerar: () => gerar50M('PREVIDENCIARIOS'), rodar: D.rodar50M, comparar: compararEntrada50M },
    CONTROVERSIA: { gerar: gerarControversia, rodar: D.rodarControversia, comparar: compararControversia }
};

// ------------------- cenários gravados ao vivo nos relatórios (pesquisa/) -------------------
function fixos() {
    const pmj = (principal, multa, juros) => ({ principal, multa, juros });
    return [
        ['ATE60SM', 'C1 opção IV 55x', casoAte60sm({ debitos: [pmj(10000, 2000, 1500), pmj(20000, 4000, 3000), pmj(10130.41, 1500, 1000)], opcao: 3, fracaoParcelas: 0.999 })],
        ['ATE60SM', 'C3 T=300 opção III (sem parcelas)', casoAte60sm({ debitos: [pmj(300, 0, 0)], opcao: 2, fracaoParcelas: 0.5 })],
        ['FAZENDARIOS', 'F03 ME/EPP C', caso50M({ formulario: 'FAZENDARIOS', tipo: 'ME_EPP', debitos: [pmj(400000, 300000, 300000), pmj(950000, 30000, 20000), pmj(123456.78, 30000, 28024.57)], divida: 1200000, capag: 2111111.11, fracaoEntrada: 0.65, fracaoParcelas: 0.5 })],
        ['FAZENDARIOS', 'F04 ME/EPP C com PF', caso50M({ formulario: 'FAZENDARIOS', tipo: 'ME_EPP', debitos: [pmj(500000, 300000, 200000)], divida: 600000, capag: 1000000, comPf: true, pf: { montante: 300000, aliquota: 25 }, bcn: { montante: 200000, aliquota: 9 }, fracaoEntrada: 0.95, fracaoParcelas: 0.999 })],
        ['FAZENDARIOS', 'F06 Demais PJ D, PF acima do limite', caso50M({ formulario: 'FAZENDARIOS', tipo: 'DEMAIS_PJ', debitos: [pmj(3000000, 1500000, 1000000), pmj(800000, 100000, 60000)], divida: 3000000, capag: 2500000, comPf: true, pf: { montante: 4000000, aliquota: 25 }, bcn: { montante: 1000000, aliquota: 9 }, fracaoEntrada: 0.5, fracaoParcelas: 0.69 })],
        ['FAZENDARIOS', 'F07 Demais PJ falida', caso50M({ formulario: 'FAZENDARIOS', tipo: 'DEMAIS_PJ', falido: true, debitos: [pmj(500000, 1200000, 800000)], divida: 100000, capag: 10000000, fracaoEntrada: 0.99, fracaoParcelas: 0.99 })],
        ['FAZENDARIOS', 'F11 Demais PJ CAPAG 0', caso50M({ formulario: 'FAZENDARIOS', tipo: 'DEMAIS_PJ', debitos: [pmj(1000000, 300000, 200000)], divida: 500000, capag: 0, fracaoEntrada: null, fracaoParcelas: 0.999 })],
        ['FAZENDARIOS', 'F12 ME/EPP D dívida pequena', caso50M({ formulario: 'FAZENDARIOS', tipo: 'ME_EPP', debitos: [pmj(2000, 1000, 1000)], divida: 0, capag: 100, fracaoEntrada: null, fracaoParcelas: 0.999 })],
        ['FAZENDARIOS', 'F13 ME/EPP D saldo < mínimo', caso50M({ formulario: 'FAZENDARIOS', tipo: 'ME_EPP', debitos: [pmj(500, 250, 250)], divida: 0, capag: 100, fracaoEntrada: null, fracaoParcelas: null })],
        ['PREVIDENCIARIOS', 'P01 Demais PJ C', caso50M({ formulario: 'PREVIDENCIARIOS', tipo: 'DEMAIS_PJ', debitos: [pmj(2000000, 1200000, 800000), pmj(1500000, 50000, 30000)], divida: 4000000, capag: 6000000, fracaoEntrada: 0.95, fracaoParcelas: 0.999 })],
        ['PREVIDENCIARIOS', 'P03 Demais PJ D com PF', caso50M({ formulario: 'PREVIDENCIARIOS', tipo: 'DEMAIS_PJ', debitos: [pmj(3000000, 1500000, 1000000), pmj(800000, 100000, 60000)], divida: 3000000, capag: 2500000, comPf: true, pf: { montante: 4000000, aliquota: 25 }, bcn: { montante: 1000000, aliquota: 9 }, fracaoEntrada: 0.5, fracaoParcelas: 0.999 })],
        ['CONTROVERSIA', 'c1 opção I', casoControversia({ debitos: [100000], opcao: 1, fracaoParcelas: 0.999 })],
        ['CONTROVERSIA', 'c2 créditos próprios ignorados', casoControversia({ debitos: [150000, 100000, 100000], opcao: 2, pfProprio: { tipo: 'PF', montante: 200000, aliquota: 25, valor: 30000 }, bcnProprio: { tipo: 'BCN', montante: 100000, aliquota: 9, valor: 9000 }, fracaoParcelas: 0.999 })],
        ['CONTROVERSIA', 'c3 próprio entra com terceiro', casoControversia({ debitos: [500000], opcao: 3, pfProprio: { tipo: 'PF', montante: 100000, aliquota: 25, valor: 40000 }, terceiros: [{ tipo: 'PF', montante: 100000, aliquota: 25, valor: 25000 }, { tipo: 'BCN', montante: 50000, aliquota: 9, valor: 4500 }], fracaoParcelas: 0.999 })],
        ['CONTROVERSIA', 'c4 PF acima de 30% (recusa)', casoControversia({ debitos: [100000], opcao: 1, terceiros: [{ tipo: 'PF', montante: 100000, aliquota: 25, valor: 10500.01 }], fracaoParcelas: 0.999 })],
        ['CONTROVERSIA', 'c10 PF = 30% exato (recusa por ponto flutuante)', casoControversia({ debitos: [21334], opcao: 2, terceiros: [{ tipo: 'PF', montante: 20000, aliquota: 25, valor: 2880.09 }], fracaoParcelas: 0.999 })]
    ];
}

(async () => {
    const nav = await D.abrirNavegador();
    const paginas = {};
    for (const f of SO) paginas[f] = await D.novaPagina(nav, f);
    // --interface: confere também o simulador básico (formularios.html), carregado pela URL do cenário
    let paginaUi = null;
    if (args.interface) {
        const { chromium } = require('playwright-core');
        const { localizarChrome } = require('./site-driver');
        const b2 = await chromium.launch({ executablePath: localizarChrome() });
        paginaUi = await b2.newPage();
        paginaUi._errosJS = [];
        paginaUi.on('pageerror', e => paginaUi._errosJS.push(String(e.message || e)));
        paginaUi._fechar = () => b2.close();
        paginaUi._base = require('url').pathToFileURL(path.resolve(__dirname, '..', 'simulador-basico', 'formularios.html')).href;
    }
    const saida = { inicio: new Date().toISOString(), semente: args.semente || 2026, resultados: {} };
    const lista = [];
    if (args.fixos) fixos().filter(([f]) => SO.includes(f)).forEach(([f, nome, caso]) => lista.push({ f, nome, caso }));
    else SO.forEach(f => { for (let i = 0; i < N; i++) lista.push({ f, nome: `${f} #${i + 1}`, caso: RODAR[f].gerar() }); });

    const resumo = {};
    const divergencias = [];
    for (const item of lista) {
        const r = resumo[item.f] || (resumo[item.f] = { total: 0, identicos: 0, errosJSNaPagina: 0, recusadosPeloFormulario: 0, falhasDoTeste: 0 });
        r.total++;
        let tela;
        try {
            tela = await RODAR[item.f].rodar(paginas[item.f], item.caso);
        } catch (e) {
            r.falhasDoTeste++;
            divergencias.push({ nome: item.nome, falha: String(e.message || e), caso: item.caso });
            continue;
        }
        if (tela.errosJS.length) r.errosJSNaPagina++;
        const { dif, motor } = RODAR[item.f].comparar(item.caso, tela);
        if (paginaUi) {
            const entradaUsada = motor.__entrada;
            const q = M.parametrosDeEntrada(entradaUsada);
            await paginaUi.goto(paginaUi._base + '?' + q);
            const ui = await paginaUi.evaluate(() => JSON.stringify(window.__resultadoFormulario));
            const esperado = JSON.stringify(M.simularFormulario(M.entradaDeParametros(q)));
            const direto = JSON.stringify(motor);
            if (ui !== direto) dif.push({ campo: 'interface', formulario: 'formularios.html', motor: ui === esperado ? 'difere só na serialização da URL' : 'resultado diferente' });
            r.interface = (r.interface || 0) + (ui === direto ? 1 : 0);
        }
        if (motor.erros.length) r.recusadosPeloFormulario++;
        if (!dif.length) r.identicos++;
        else divergencias.push({ nome: item.nome, dif, caso: item.caso, tela, motor });
        if (args.fixos || args.verbose) {
            const res = motor.resultado || {};
            console.log(`${dif.length ? '✗' : '✓'} ${item.nome}` + (dif.length ? '  ' + JSON.stringify(dif) : '') +
                (tela.errosJS.length ? `  [erro JS na página: ${tela.errosJS[0].slice(0, 70)}]` : '') + (motor.erros.length ? `  [recusado: ${motor.erros[0].slice(0, 80)}]` : ''));
        }
    }
    await nav.fechar();
    if (paginaUi) { saida.errosJSInterface = paginaUi._errosJS; await paginaUi._fechar(); }
    saida.resumo = resumo;
    saida.rede = { servidasLocalmente: nav.rede.servidas, canceladas: nav.rede.canceladas, naoGet: nav.rede.naoGet, hostsCancelados: [...nav.rede.externas] };
    saida.divergencias = divergencias;
    const dir = path.join(__dirname, 'saida');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, args.fixos ? 'comparacao-formularios-fixos.json' : 'comparacao-formularios.json'), JSON.stringify(saida, null, 1));
    for (const [f, r] of Object.entries(resumo)) console.log(`${f}: ${r.identicos}/${r.total} idênticos | recusados pelo formulário (e pelo motor): ${r.recusadosPeloFormulario} | casos com erro JS na página oficial: ${r.errosJSNaPagina} | falhas do teste: ${r.falhasDoTeste}` + (paginaUi ? ` | formularios.html pela URL igual ao motor: ${r.interface || 0}/${r.total}` : ''));
    if (saida.errosJSInterface) console.log('Erros JS em formularios.html:', saida.errosJSInterface.length);
    console.log('Rede:', JSON.stringify(saida.rede));
    divergencias.slice(0, 8).forEach(d => console.log('DIVERGÊNCIA', d.nome, JSON.stringify(d.dif || d.falha).slice(0, 600)));
    process.exit(divergencias.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
