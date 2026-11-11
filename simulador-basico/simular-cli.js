#!/usr/bin/env node
/**
 * simular-cli.js — roda uma simulação pela linha de comando usando os MESMOS parâmetros
 * de URL do index.html.
 *
 *   node simular-cli.js "tipo=DEMAIS_PJ&modo=AGREGADO&principal=3000000&multa=1500000&juros=200000&capag=4000000&divida=4700000"
 *   node simular-cli.js "file:///.../index.html?tipo=MEI&principal=5000&multa=500&juros=300&capag=10000&divida=6000" --json
 *
 * Parâmetros:
 *   tipo        PN | PN_OBITO | MEI | ME_EPP | DEMAIS_PJ           (obrigatório)
 *   falido=1    baixado=1                                           (situação cadastral — só MEI/ME_EPP/DEMAIS_PJ)
 *   modo        AGREGADO (padrão) | POR_DEBITO
 *   principal, multa, juros                                         (modo AGREGADO)
 *   debitos     p;m;j|p;m;j|...                                     (modo POR_DEBITO)
 *   capag       Capacidade de pagamento em 60 meses
 *   divida      Valor total da dívida na PGFN e RFB
 *   Escolhas por modalidade (opcionais; vazio = padrão do site, parcelas = máximo):
 *     rfbpv_opcao (0-3), rfbpv_parcelas
 *     rfb50_opcao (FAZENDARIO|PREVIDENCIARIO), rfb50_parcelas, rfb50_entrada, rfb50_pfbcn
 *     pgfnpv_opcao (0-5), pgfnpv_parcelas, pgfnpv_entrada
 *     pgfncp_opcao (COM_ENTRADA|AVISTA), pgfncp_natureza (FAZENDARIO|PREVIDENCIARIO), pgfncp_parcelas, pgfncp_entrada
 *   Valores: "3000000", "3000000.50", "3.000.000" ou "3.000.000,50" (ponto sem vírgula com grupos de
 *   3 dígitos = separador de milhar; "1.5"/"1.50" = decimal).
 *
 * Formulários oficiais de adesão (mesmos parâmetros de formularios.html): inclua form=...
 *   node simular-cli.js "form=ATE60SM&debitos=10000;2000;1500&opcao=IV&parcelas=55"
 *   node simular-cli.js "form=FAZENDARIOS&tipo=ME_EPP&debitos=400000;300000;300000&divida=0&capag=500000&entrada=5&parcelas=100"
 *   node simular-cli.js "form=CONTROVERSIA&debitos=100000&opcao=1&terceiros=100000;25;5000&entrada=1&parcelas=12"
 */
const Motor = require('./motor-calculo.js');

const args = process.argv.slice(2);
const json = args.includes('--json');
const texto = args.find(a => !a.startsWith('--'));
if (!texto) {
    console.error('Uso: node simular-cli.js "tipo=DEMAIS_PJ&principal=...&multa=...&juros=...&capag=...&divida=..." [--json]');
    process.exit(1);
}
const query = texto.includes('?') ? texto.slice(texto.indexOf('?') + 1) : texto;
if (new URLSearchParams(query).has('form')) {
    simularFormularioOficial(query);
    process.exit(0);
}
let resultado;
try {
    resultado = Motor.simular(Motor.entradaDeParametros(new URLSearchParams(query)));
} catch (e) {
    console.error('Erro: ' + e.message);
    process.exit(1);
}

if (json) {
    console.log(JSON.stringify(resultado, (k, v) => (typeof v === 'function' ? undefined : v), 2));
    process.exit(0);
}

const fm = Motor.formatarMoeda;
const c = resultado.classificacao;
console.log(`Total dos débitos: R$ ${fm(resultado.entrada.totalDebitos)}`);
console.log(`Rating PGFN: ${c.pgfn.rating} (base R$ ${fm(c.pgfn.dividaBase)}) | Rating RFB: ${c.rfb.rating} (base R$ ${fm(c.rfb.dividaBase)})\n`);
for (const m of resultado.modalidades) {
    console.log(`■ ${m.nome}`);
    if (!m.elegivel) { console.log(`  Não elegível — ${m.motivo}\n`); continue; }
    const e = m.exibicao;
    console.log(`  Opção: ${m.opcaoRotulo}${m.natureza ? ' | ' + m.natureza : ''}`);
    console.log(`  Dívida elegível: R$ ${fm(e.dividaElegivel)} | Redução: ${e.reducaoTexto} | Saldo devedor: R$ ${fm(e.saldoDevedor)}`);
    console.log(`  Entrada: ${e.entrada.semEntrada ? 'Sem entrada' : `R$ ${fm(e.entrada.valor)} em ${e.entrada.parcelas}x de R$ ${fm(e.entrada.valorParcela)} (máx ${e.entrada.maximo}x)`}`);
    console.log(`  Parcelas: R$ ${fm(e.parcelas.saldo)} em ${e.parcelas.quantidade}x de R$ ${fm(e.parcelas.valorParcela)} (máx ${e.parcelas.maximo}x)`);
    console.log(`  PF/BCN: ${e.pfBcn.limite !== undefined ? `R$ ${fm(e.pfBcn.valor)} (limite R$ ${fm(e.pfBcn.limite)})${e.pfBcn.erro ? ' — ' + e.pfBcn.erro : ''}` : e.pfBcn.texto}`);
    if (m.vantagens.length) console.log(`  Vantagens: ${m.vantagens.join(', ')}`);
    (m.avisos || []).forEach(a => console.log(`  ⚠ ${a}`));
    console.log('');
}

function simularFormularioOficial(q) {
    const F = require('./motor-formularios.js');
    const r = F.simularFormulario(F.entradaDeParametros(q));
    if (json) { console.log(JSON.stringify(r, null, 2)); return; }
    console.log(`Formulário: ${F.FORMULARIOS[r.formulario] || r.formulario}`);
    r.erros.forEach(e => console.log(`  ✖ ${e}`));
    const x = r.resultado;
    if (r.formulario === 'ATE60SM') {
        console.log(`Total: R$ ${r.totalGeral}`);
        if (x) console.log(`Opção ${x.codigoOpcao} (${x.criterio}) | desconto R$ ${x.desconto} | saldo R$ ${x.saldo} | ${x.parcelas ?? '—'}x de R$ ${x.valorParcela} (máx ${x.parcelasMaximo}x)`);
    } else if (r.formulario === 'CONTROVERSIA') {
        console.log(`Débitos: R$ ${r.totalDebitos} | créditos PF/BCN: R$ ${r.totalCreditos}`);
        if (x) {
            console.log(`Opção ${x.item}: redução ${x.percentualReducao} = R$ ${x.valorReducao} | com redução R$ ${x.dividaComReducao} | amortizado R$ ${x.valorAmortizadoPfBcn}`);
            console.log(`Entrada ${x.percentualEntrada}: R$ ${x.entrada} | saldo R$ ${x.saldoAposEntrada} em ${x.parcelas ?? '—'}x de R$ ${x.valorParcela} (máx ${x.parcelasMaximo}x)`);
        }
    } else {
        console.log(`Total do contencioso: R$ ${r.totalGeral}`);
        const c = r.classificacao;
        if (c) console.log(`Total de débitos R$ ${c.totalDebitos} | relação ${c.relacao} | desconto teórico ${c.descontoTeorico} | rating ${c.rating}`);
        if (x) {
            console.log(`Item ${x.item}${x.comPf ? ' com PF/BCN' : ''}`);
            if (x.descontos) console.log(`Desconto obtido (por débito): R$ ${x.descontos.total.descontoAplicado} | saldo após descontos R$ ${x.descontos.total.saldo}`);
            const e = x.entrada;
            console.log(`Entrada R$ ${e.entradaExibida} (calculada com R$ ${e.entrada}) em ${e.parcelas}x de R$ ${e.valorParcela} (máx ${e.parcelasMaximo}x)`);
            if (x.prejuizoFiscal) console.log(`PF/BCN: limite R$ ${x.prejuizoFiscal.limite} | proposto R$ ${x.prejuizoFiscal.proposto} | aplicado R$ ${x.prejuizoFiscal.aplicado}`);
            if (x.restante) console.log(`Saldo R$ ${x.restante.saldo} (${x.restante.criterio}) em ${x.restante.parcelas ?? '—'}x de R$ ${x.restante.valorParcela} (máx ${x.restante.parcelasMaximo}x)`);
        }
    }
    r.avisos.forEach(a => console.log(`  ⚠ ${a}`));
}
