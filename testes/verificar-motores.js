/**
 * verificar-motores.js
 * Conferência rápida, só com Node (sem navegador e sem internet), dos dois motores contra resultados
 * vistos na tela das ferramentas oficiais (cenários gravados; ver FORMULAS.md §8 e pesquisa/).
 * Roda no GitHub Actions antes de publicar o site. Os testes completos (milhares de cenários contra o
 * código oficial no Chrome) são comparar-com-site.js, testar-interface.js e comparar-formularios.js.
 *
 *   node testes/verificar-motores.js
 */
const path = require('path');
const Calc = require(path.join(__dirname, '..', 'simulador-basico', 'motor-calculo.js'));
const Form = require(path.join(__dirname, '..', 'simulador-basico', 'motor-formularios.js'));

let falhas = 0, total = 0;
function conferir(nome, obtido, esperado) {
    total++;
    if (String(obtido) !== String(esperado)) {
        falhas++;
        console.log(`✗ ${nome}: obtido ${obtido}, esperado ${esperado}`);
    }
}
const fm = Calc.formatarMoeda;

// ---- Calculadora: exemplo do §8 (print do site oficial) ----
const r = Calc.simular(Calc.entradaDeParametros(new URLSearchParams('tipo=DEMAIS_PJ&principal=3000000&multa=1500000&juros=200000&capag=4000000&divida=4700000')));
conferir('calc rating PGFN', r.classificacao.pgfn.rating, 'C');
conferir('calc rating RFB', r.classificacao.rfb.rating, 'D');
const porNome = t => r.modalidades.find(m => m.nome.includes(t));
const rfb50 = porNome('50 milhões').exibicao, cap = porNome('Capacidade').exibicao;
conferir('calc RFB 50M saldo', fm(rfb50.saldoDevedor), '3.000.000,00');
conferir('calc RFB 50M entrada', `${rfb50.entrada.parcelas}x ${fm(rfb50.entrada.valorParcela)}`, '5x 47.000,00');
conferir('calc RFB 50M parcelas', `${rfb50.parcelas.quantidade}x ${fm(rfb50.parcelas.valorParcela)}`, '115x 24.043,48');
conferir('calc RFB 50M limite PF/BCN', fm(rfb50.pfBcn.limite), '829.500,00');
conferir('calc PGFN entrada', `${cap.entrada.parcelas}x ${fm(cap.entrada.valorParcela)}`, '6x 51.700,00');
conferir('calc PGFN parcelas', `${cap.parcelas.quantidade}x ${fm(cap.parcelas.valorParcela)}`, '114x 37.780,68');
conferir('calc PGFN saldo exibido', fm(cap.saldoDevedor), '4.617.197,75');
conferir('calc inelegíveis', r.modalidades.filter(m => !m.elegivel).length, 2);

// ---- Formulários oficiais de adesão (cenários gravados ao vivo) ----
const f = q => Form.simularFormulario(Form.entradaDeParametros(q));
let x = f('form=ATE60SM&debitos=10000;2000;1500|20000;4000;3000|10130.41;1500;1000&opcao=IV&parcelas=55').resultado;
conferir('60SM C1 desconto', x.desconto, '15.939,12');
conferir('60SM C1 parcela', `${x.parcelas}x ${x.valorParcela}`, '55x 676,21');
x = f('form=ATE60SM&debitos=300;0;0&opcao=III').resultado;
conferir('60SM C3 sem parcelas', `${x.parcelasMaximo} ${x.valorParcela}`, '0 195,00');

x = f('form=FAZENDARIOS&tipo=ME_EPP&debitos=400000;300000;300000|950000;30000;20000|123456.78;30000;28024.57&divida=1200000&capag=2111111.11&entrada=7&parcelas=100');
conferir('F03 desconto teórico', x.classificacao.descontoTeorico, '42.13%');
conferir('F03 desconto por débito', x.resultado.descontos.total.descontoAplicado, '529.324,57');
conferir('F03 entrada', `${x.resultado.entrada.parcelas}x ${x.resultado.entrada.valorParcela}`, '7x 15.582,01');
conferir('F03 saldo', `${x.resultado.restante.parcelas}x ${x.resultado.restante.valorParcela}`, '100x 15.430,83');
x = f('form=FAZENDARIOS&tipo=DEMAIS_PJ&falido=1&debitos=500000;1200000;800000&divida=100000&capag=10000000&entrada=5&parcelas=115').resultado;
conferir('F07 falida 65%', x.descontos.total.descontoAplicado, '1.625.000,00');
conferir('F07 saldo', `${x.restante.parcelas}x ${x.restante.valorParcela}`, '115x 6.521,74');
x = f('form=FAZENDARIOS&tipo=DEMAIS_PJ&debitos=3000000;1500000;1000000|800000;100000;60000&divida=3000000&capag=2500000&pf=1&pf_montante=4000000&pf_aliquota=25&bcn_montante=1000000&bcn_aliquota=9&entrada=3&parcelas=80').resultado;
conferir('F06 PF cortado', `${x.prejuizoFiscal.limite} ${x.prejuizoFiscal.aplicado}`, '946.200,00 946.200,00');
conferir('F06 entrada', `${x.entrada.parcelas}x ${x.entrada.valorParcela}`, '3x 215.333,33');
conferir('F06 saldo', `${x.restante.parcelas}x ${x.restante.valorParcela}`, '80x 27.597,50');
x = f('form=PREVIDENCIARIOS&tipo=DEMAIS_PJ&debitos=2000000;1200000;800000|1500000;50000;30000&divida=4000000&capag=6000000&entrada=10&parcelas=50').resultado;
conferir('P01 entrada', `${x.entrada.parcelas}x ${x.entrada.valorParcela}`, '10x 27.900,00');
conferir('P01 saldo', `${x.restante.parcelas}x ${x.restante.valorParcela}`, '50x 73.388,00');

x = f('form=CONTROVERSIA&debitos=100000&opcao=1&entrada=1&parcelas=12').resultado;
conferir('CJ c1', `${x.entrada} ${x.parcelas}x ${x.valorParcela}`, '10.500,00 12x 2.041,67');
x = f('form=CONTROVERSIA&debitos=150000|100000|100000&opcao=2&proprio_pf=200000;25;30000&proprio_bcn=100000;9;9000&entrada=1&parcelas=24').resultado;
conferir('CJ c2 próprios ignorados', `${x.valorAmortizadoPfBcn} ${x.entrada} ${x.parcelas}x ${x.valorParcela}`, '0,00 39.375,00 24x 4.921,88');
conferir('CJ c10 PF 30% exato recusado', f('form=CONTROVERSIA&debitos=21334&opcao=2&terceiros=20000;25;2880.09').resultado, null);

console.log(`${total - falhas}/${total} conferências iguais às ferramentas oficiais.`);
process.exit(falhas ? 1 : 0);
