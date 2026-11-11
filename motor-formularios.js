/*
 * Motor dos FORMULÁRIOS OFICIAIS DE ADESÃO da RFB (os "discriminativos" anexados ao pedido).
 *
 * Os formulários calculam de forma diferente da calculadora (motor-calculo.js). Este arquivo
 * reproduz a conta de cada um, com a mesma ordem de operações e os mesmos arredondamentos
 * intermediários (os formulários releem valores já formatados da tela):
 *
 *   ATE60SM          ate60sm.html          + negocio-60.js   (Pequeno Valor, Edital RFB 10/2026)
 *   FAZENDARIOS      fazendarios.html      + negocio-faz.js  (até R$ 50 milhões, Edital RFB 9/2026)
 *   PREVIDENCIARIOS  previdenciarios.html  + negocio-pre.js  (até R$ 50 milhões, Edital RFB 9/2026)
 *   CONTROVERSIA     controversia-juridica-2026/editais.html (Editais Conjuntos PGFN/RFB 4 e 5/2026)
 *
 * Cópias dos fontes oficiais: fontes-oficiais/. Análise detalhada: pesquisa/ e FORMULAS.md §12.
 * Funciona no navegador (window.MotorFormularios) e no Node (require).
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.MotorFormularios = factory();
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    // ------------------------------------------------------------------------------------
    // Conversões idênticas às de utils.js dos formulários
    // ------------------------------------------------------------------------------------

    /** converterNumeroEmMoeda / converteNumeroEmReais: "1.234,56" (arredonda meio centavo para cima). */
    function fmt(valor) {
        return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    /** converterStringEmNumero: remove tudo que não é dígito nem vírgula; vírgula vira ponto. */
    function num(texto) {
        const n = parseFloat(String(texto).replace(/[^\d,]/g, '').replace(',', '.'));
        if (Number.isNaN(n)) throw new Error('Valor inválido para conversão.');
        return n;
    }

    /** Ida e volta pela tela: o formulário grava fmt(x) num campo e depois relê com num(). */
    function relido(valor) {
        return num(fmt(valor));
    }

    /**
     * Valor digitado num campo com máscara de moeda (validarValorNaoNegativo / validarValor):
     * "centavos inteiros ÷ 100", sem sinal. Aceita número ou texto ("1234.56", "1.234,56", "R$ 10").
     */
    function valorDeCampo(valor) {
        if (valor === null || valor === undefined || valor === '') return null;
        let numero;
        if (typeof valor === 'number') {
            numero = valor;
        } else {
            let texto = String(valor).trim().replace(/^R\$\s*/i, '').replace(/\s/g, '');
            if (texto.includes(',')) {
                texto = texto.replace(/\./g, '').replace(',', '.');
            } else if ((texto.match(/\./g) || []).length > 1 || /^\d{1,3}(\.\d{3})+$/.test(texto)) {
                texto = texto.replace(/\./g, '');
            }
            numero = parseFloat(texto);
        }
        if (!Number.isFinite(numero)) return null;
        const centavos = Math.round(Math.abs(numero) * 100);
        return num(fmt(centavos / 100));
    }

    /** Inteiro opcional (parcelas). Vazio/inválido => null. */
    function inteiro(valor) {
        if (valor === null || valor === undefined || valor === '') return null;
        const n = parseInt(valor, 10);
        return Number.isNaN(n) ? null : n;
    }

    /**
     * Escolhe o nº de parcelas dentro de 1..máximo. Fora da faixa, ajusta e avisa
     * (no formulário só é possível escolher itens da lista).
     */
    function escolherParcelas(pedido, maximo, padrao, rotulo, avisos) {
        if (maximo < 1) return null;
        if (pedido === null) return padrao;
        if (pedido > maximo) {
            avisos.push(`${rotulo}: ${pedido} parcelas não estão disponíveis no formulário (máximo ${maximo}); usado ${maximo}.`);
            return maximo;
        }
        if (pedido < 1) {
            avisos.push(`${rotulo}: o mínimo é 1 parcela; usado 1.`);
            return 1;
        }
        return pedido;
    }

    // ------------------------------------------------------------------------------------
    // ATE60SM — Pequeno Valor (negocio-60.js)
    // ------------------------------------------------------------------------------------

    const LIMITE_60SM = 97260;          // limiteValor (negocio-60.js:47), POR processo
    const PISO_DARF = 10;               // valorMinimoDarf, POR processo
    const PARCELA_MINIMA_60SM = 200;    // valorMinimo do único perfil ("contribuinte")
    const DARF_60SM = '6359';

    const OPCOES_60SM = [
        { codigo: 'I', meses: 12, desconto: '0,5', rotulo: 'I - em até 12 meses, com redução de 50%' },
        { codigo: 'II', meses: 24, desconto: '0,4', rotulo: 'II - em até 24 meses, com redução de 40%' },
        { codigo: 'III', meses: 36, desconto: '0,35', rotulo: 'III - em até 36 meses, com redução de 35%' },
        { codigo: 'IV', meses: 55, desconto: '0,3', rotulo: 'IV - em até 55 meses, com redução de 30%' }
    ];

    function indiceOpcao(opcao, lista, base) {
        if (opcao === null || opcao === undefined || opcao === '') return null;
        const texto = String(opcao).trim().toUpperCase();
        const porCodigo = lista.findIndex(o => o.codigo === texto);
        if (porCodigo >= 0) return porCodigo;
        const n = parseInt(texto, 10);
        if (!Number.isNaN(n) && n - base >= 0 && n - base < lista.length) return n - base;
        return -1;
    }

    /** Débitos com principal/multa/juros, como nas tabelas dos formulários. */
    function lerDebitosPmj(debitos, limite, rotuloLimite, erros) {
        const linhas = [];
        // O formulário recalcula o total da linha a cada campo (principal → multa → juros) e o total
        // geral só quando a linha fica dentro do limite. Depois de uma recusa, o total geral fica
        // desatualizado (bug). Simula essa sequência de digitação para exibir o mesmo total.
        const totaisNaTela = [];
        let totalGeralTexto = '';   // campo vazio até o primeiro recálculo
        const digitarCampo = (i, parcial) => {
            if (parcial > limite) { totaisNaTela[i] = ''; return; }
            totaisNaTela[i] = fmt(parcial);
            let soma = 0;
            totaisNaTela.forEach(t => { soma += num(t ? t : '0'); });
            totalGeralTexto = fmt(soma);
        };
        (debitos || []).forEach((d, i) => {
            totaisNaTela[i] = '';
            const p = valorDeCampo(d.principal) || 0, m = valorDeCampo(d.multa) || 0, j = valorDeCampo(d.juros) || 0;
            digitarCampo(i, p + 0 + 0);
            digitarCampo(i, p + m + 0);
            digitarCampo(i, p + m + j);
        });
        linhas.totalGeralTexto = totalGeralTexto;
        (debitos || []).forEach((d, i) => {
            const principal = valorDeCampo(d.principal);
            const multa = valorDeCampo(d.multa);
            const juros = valorDeCampo(d.juros);
            const processo = d.processo ? String(d.processo).replace(/\D/g, '') : '';
            // calcularValorTotalProcesso: campo vazio conta 0
            const total = (principal || 0) + (multa || 0) + (juros || 0);
            const linha = {
                numero: i + 1, processo,
                principal: principal || 0, multa: multa || 0, juros: juros || 0,
                total, totalTexto: '', recusado: false
            };
            if (principal === null || multa === null || juros === null) {
                erros.push(`Débito ${i + 1}: preencha principal, multa e juros (use 0 quando não houver). O formulário não aceita campo vazio.`);
            }
            if (total > limite) {
                linha.recusado = true;
                erros.push(`Débito ${i + 1}: ${rotuloLimite} (total ${fmt(total)}). O formulário recusa a linha.`);
            } else {
                linha.totalTexto = fmt(total);
            }
            linhas.push(linha);
        });
        if (linhas.length === 0) erros.push('Insira pelo menos um débito para prosseguir.');
        return linhas;
    }

    /** confirmarTotalDebitos: piso do DARF por processo + soma (recalcularTotalGeral). */
    function confirmarTotal(linhas, erros, avisos) {
        if (linhas.some(l => l.recusado)) {
            avisos.push(`O "Total" exibido pelo formulário (${linhas.totalGeralTexto || "vazio"}) fica desatualizado depois da recusa: ele não é recalculado quando uma linha passa do limite.`);
        }
        if (erros.length === 0) {
            for (const l of linhas) {
                if (num(l.totalTexto) < PISO_DARF) {
                    erros.push(`Débito ${l.numero}: esta transação não é possível, pois o valor total de cada débito deve ser de no mínimo R$ 10,00 (DARF).`);
                    break;
                }
            }
        }
        return linhas.totalGeralTexto;
    }

    function simularAte60sm(entrada) {
        const erros = [];
        const avisos = [];
        const linhas = lerDebitosPmj(entrada.debitos, LIMITE_60SM,
            'esta modalidade não se aplica a valores acima de 60 salários-mínimos (R$ 97.260,00) por processo administrativo', erros);
        const totalGeralTexto = confirmarTotal(linhas, erros, avisos);

        const base = {
            formulario: 'ATE60SM', erros, avisos,
            debitos: linhas.map(l => ({ numero: l.numero, total: l.totalTexto || '(recusado)' })),
            totalGeral: totalGeralTexto, resultado: null
        };
        if (erros.length) return base;

        const idx = indiceOpcao(entrada.opcao, OPCOES_60SM, 0);
        if (idx === null) { erros.push('Escolha uma das opções (I a IV).'); return base; }
        if (idx < 0) { erros.push(`Opção inválida: "${entrada.opcao}". Use 0–3 ou I–IV.`); return base; }
        const op = OPCOES_60SM[idx];

        // popularTabelaRestante (negocio-60.js:390-443)
        const T = num(base.totalGeral);
        const d = num(op.desconto);
        const reducao = num(op.desconto) * 100;
        const saldoAposDesconto = T - (T * d);

        // calcularMaximoParcelasRestante (:447-468)
        let nMax = Math.min(op.meses, Math.floor(T / PARCELA_MINIMA_60SM));
        if (saldoAposDesconto / nMax < PARCELA_MINIMA_60SM) {
            nMax = Math.floor(saldoAposDesconto / PARCELA_MINIMA_60SM);
        }

        const saldoTexto = fmt(saldoAposDesconto);
        const parcelas = escolherParcelas(inteiro(entrada.parcelas), nMax, 1, 'Nº de parcelas', avisos);
        // ao escolher a opção: parcela = saldo (1 parcela); ao trocar: num(saldo exibido) ÷ n
        const valorParcela = parcelas === null ? saldoTexto : fmt(num(saldoTexto) / parcelas);

        if (nMax < 1) {
            avisos.push('Saldo abaixo de R$ 200,00: o formulário oficial não oferece nenhuma opção de parcelas (a lista fica vazia e a página tem um erro de JavaScript), mas mostra a "parcela" igual ao saldo e ainda gera o PDF.');
        }

        base.resultado = {
            opcao: idx, codigoOpcao: op.codigo, rotuloOpcao: op.rotulo,
            total: fmt(T),
            criterio: `até ${op.meses} meses, redução ${reducao}%`,
            desconto: fmt(T * d),
            saldo: saldoTexto,
            parcelasMaximo: nMax,
            parcelas,
            valorParcela,
            darf: DARF_60SM,
            numeros: { total: T, percentualDesconto: d, desconto: T * d, saldo: saldoAposDesconto }
        };
        return base;
    }

    // ------------------------------------------------------------------------------------
    // FAZENDARIOS / PREVIDENCIARIOS — até R$ 50 milhões (negocio-faz.js / negocio-pre.js)
    // ------------------------------------------------------------------------------------

    const LIMITE_50M = 50000000;        // limiteValor, POR processo (contencioso)
    const TIPOS_50M = {
        PN: 'Pessoa Natural',
        PN_OBITO: 'Pessoa Natural com indicativo de óbito',
        ME_EPP: 'ME, EPP, Santas Casas, cooperativas, OSC (Lei 13.019) ou instituições de ensino',
        DEMAIS_PJ: 'Demais Pessoas Jurídicas'
    };

    function aliquotaInteira(valor, rotulo, avisos) {
        // validarPercentual: só dígitos, inteiro de 0 a 100, seguido de "%"
        if (valor === null || valor === undefined || valor === '') return null;
        const digitos = String(valor).split(/[.,]/)[0].replace(/\D/g, '');
        if (digitos === '') return null;
        let n = parseInt(digitos, 10);
        if (String(valor).match(/[.,]\d*[1-9]/)) {
            avisos.push(`${rotulo}: o formulário só aceita alíquota inteira; usado ${Math.min(n, 100)}%.`);
        }
        if (n > 100) n = 100;
        return num(n.toString() + '%');
    }

    /** validarProcesso (utils.js:77-147): 15 dígitos sem DV, ou 17 com 2 DVs módulo 11. */
    function processoValido(digitos) {
        if (digitos.length === 15) return true;
        if (digitos.length !== 17) return false;
        const numeros = digitos.substring(0, 15).split('').map(Number);
        const dv = (lista, pesoMax) => {
            let soma = 0, peso = 2;
            for (let i = lista.length - 1; i >= 0; i--) {
                soma += lista[i] * peso;
                peso++;
                if (peso > pesoMax) peso = 2;
            }
            const resto = soma % 11;
            return resto === 0 ? 1 : resto === 1 ? 0 : 11 - resto;
        };
        const d1 = dv(numeros, 16);
        numeros.push(d1);
        const d2 = dv(numeros, 17);
        return parseInt(digitos.charAt(15), 10) === d1 && parseInt(digitos.charAt(16), 10) === d2;
    }

    function simular50Milhoes(entrada) {
        const previdenciario = String(entrada.formulario || entrada.natureza || '').toUpperCase().startsWith('PREV');
        const erros = [];
        const avisos = [];
        const tipo = String(entrada.tipo || entrada.tipoContribuinte || '').toUpperCase();
        if (!TIPOS_50M[tipo]) {
            erros.push('Escolha o tipo de contribuinte: PN, PN_OBITO, ME_EPP ou DEMAIS_PJ.');
            return { formulario: previdenciario ? 'PREVIDENCIARIOS' : 'FAZENDARIOS', erros, avisos, resultado: null };
        }
        const isPN = tipo === 'PN', isObito = tipo === 'PN_OBITO', isME = tipo === 'ME_EPP', isPJ = tipo === 'DEMAIS_PJ';
        const situacao = entrada.situacao || {};
        const temSituacao = isME || isPJ;
        const isFalido = temSituacao && !!(entrada.falido || situacao.falido || situacao.falidoRecuperacao);
        const isBaixado = temSituacao && !!(entrada.baixado || situacao.baixado || situacao.baixadoInapto);
        if (!temSituacao && (entrada.falido || entrada.baixado)) {
            avisos.push('Falido/baixado só existe para ME/EPP e Demais PJ no formulário; ignorado.');
        }
        const isRatingD = isObito || isFalido || isBaixado;
        const valorMinimo = (isPN || isObito) ? 200 : 300;

        const linhas = lerDebitosPmj(entrada.debitos, LIMITE_50M,
            'esta modalidade não se aplica a valores acima de R$ 50.000.000,00 por contencioso', erros);
        // Nº do processo (opcional aqui; no formulário é obrigatório): 15 dígitos, ou 17 com DV.
        // Inválido ou repetido em outra linha => o formulário apaga o campo e o "Confirmar" barra.
        const vistos = {};
        linhas.forEach(l => {
            if (!l.processo) return;
            if (!processoValido(l.processo)) {
                erros.push(`Débito ${l.numero}: número do processo inválido (deve ter 15 dígitos, ou 17 com dígitos verificadores corretos). O formulário apaga o campo.`);
            } else if (vistos[l.processo]) {
                erros.push(`Débito ${l.numero}: o número do processo já existe em outra linha. O formulário apaga o campo.`);
            }
            vistos[l.processo] = true;
        });
        const totalGeralTexto = confirmarTotal(linhas, erros, avisos);

        const base = {
            formulario: previdenciario ? 'PREVIDENCIARIOS' : 'FAZENDARIOS',
            tipo, rotuloTipo: TIPOS_50M[tipo], erros, avisos,
            parcelaMinima: valorMinimo,
            debitos: linhas.map(l => ({ numero: l.numero, processo: l.processo, total: l.totalTexto || '(recusado)' })),
            totalGeral: totalGeralTexto,
            classificacao: null, resultado: null
        };
        if (erros.length) return base;

        // calcularRating (negocio-faz.js:428-486)
        const divida = valorDeCampo(entrada.dividaPgfnRfb ?? entrada.divida);
        if (divida === null) {
            erros.push('O valor total da dívida na PGFN e RFB (débitos não incluídos no contencioso) deve ser preenchido (pode ser 0).');
            return base;
        }
        const capagCampo = valorDeCampo(entrada.capag);
        const capagTexto = capagCampo === null ? '' : fmt(capagCampo);
        const totalDebitosTransacionar = num(base.totalGeral);
        const totalDebitosTexto = fmt(totalDebitosTransacionar + num(fmt(divida)));
        let relacaoTexto;
        if (capagTexto === '0,00' || capagTexto === '0' || capagTexto === '') {
            relacaoTexto = num(totalDebitosTexto) + '%';
        } else {
            relacaoTexto = (((num(totalDebitosTexto) / num(capagTexto)) * 100)).toFixed(2) + '%';
        }
        const relacao = num(relacaoTexto) / 10000;
        let rating;
        if (isRatingD) rating = 'D';
        else if (relacao <= 0.5) rating = 'A';
        else if (relacao <= 1) rating = 'B';
        else if (relacao <= 2) rating = 'C';
        else rating = 'D';
        const descontoMaximo = isPJ ? 0.65 : 0.7;
        let descontoTeoricoTexto;
        if (rating === 'A' || rating === 'B') descontoTeoricoTexto = '0,00%';
        else if (rating === 'D') descontoTeoricoTexto = (descontoMaximo * 100).toFixed(2) + '%';
        else descontoTeoricoTexto = (descontoMaximo * ((num(relacaoTexto) / 10000 - 1)) * 100).toFixed(2) + '%';

        base.classificacao = {
            totalDebitosTransacionar: base.totalGeral,
            dividaPgfnRfb: fmt(divida),
            capag: capagTexto,
            totalDebitos: totalDebitosTexto,
            relacao: relacaoTexto,
            descontoTeorico: descontoTeoricoTexto,
            rating,
            descontoMaximo
        };
        if (capagTexto === '0,00') {
            avisos.push('CAPAG = 0: o formulário não dá rating A; ele escreve o próprio total de débitos como "relação" (ex.: "4700000%"), o que costuma dar rating D, mas o resultado depende dos centavos.');
        }
        if (capagTexto === '') {
            erros.push('Informe a capacidade de pagamento em 60 meses (pode ser 0). Sem ela o formulário não deixa selecionar a modalidade.');
            return base;
        }

        // Modalidade (rádios da seção 5)
        const cd = rating === 'C' || rating === 'D';
        const pfDisponivel = cd && (isME || isPJ);
        let comPf = !!entrada.comPf;
        if (comPf && !pfDisponivel) {
            avisos.push(cd ? 'Pessoa natural não tem a opção com prejuízo fiscal/BCN no formulário; calculado sem PF/BCN.'
                : 'Rating A/B não tem a opção com prejuízo fiscal/BCN no formulário; calculado sem PF/BCN.');
            comPf = false;
        }
        const item = previdenciario ? (cd ? '6.3' : '6.5') : (!cd ? '6.4' : (isPJ ? (comPf ? '6.1-II' : '6.1-I') : '6.2'));

        // popularTabelaDescontos (negocio-faz.js:569-652) — só C/D
        const descontoTeorico = parseFloat(descontoTeoricoTexto) || 0;
        let tabelaDescontos = null;
        let saldoDevedorAposDescontos = null;
        if (cd) {
            const t = { principal: 0, multa: 0, juros: 0, total: 0, descontoMaximo: 0, descontoCalculado: 0, descontoAplicado: 0, saldo: 0 };
            const linhasDesconto = linhas.map(l => {
                const valorTotalProcesso = num(l.totalTexto);
                const dMax = l.multa + l.juros;
                const dCalc = (valorTotalProcesso * descontoTeorico) / 100;
                const dApl = Math.min(dMax, dCalc);
                const saldo = valorTotalProcesso - dApl;
                t.principal += l.principal; t.multa += l.multa; t.juros += l.juros;
                t.total += valorTotalProcesso; t.descontoMaximo += dMax; t.descontoCalculado += dCalc;
                t.descontoAplicado += dApl; t.saldo += saldo;
                return {
                    numero: l.numero, processo: l.processo,
                    principal: fmt(l.principal), multa: fmt(l.multa), juros: fmt(l.juros),
                    total: fmt(valorTotalProcesso), descontoMaximo: fmt(dMax),
                    descontoCalculado: fmt(dCalc), descontoAplicado: fmt(dApl), saldo: fmt(saldo)
                };
            });
            tabelaDescontos = {
                linhas: linhasDesconto,
                total: {
                    principal: fmt(t.principal), multa: fmt(t.multa), juros: fmt(t.juros), total: fmt(t.total),
                    descontoMaximo: fmt(t.descontoMaximo), descontoCalculado: fmt(t.descontoCalculado),
                    descontoAplicado: fmt(t.descontoAplicado), saldo: fmt(t.saldo)
                }
            };
            // calcularMaximoParcelasEntrada relê o total "Saldo devedor" da tela (arredondado)
            saldoDevedorAposDescontos = num(tabelaDescontos.total.saldo);
        }

        // calcularMaximoParcelasEntrada (negocio-faz.js:1443-1715 / negocio-pre.js)
        const totalFazendario = num(base.totalGeral);
        let percentualEntrada, limiteEntrada;
        if (previdenciario) { percentualEntrada = 0.05; limiteEntrada = 10; }
        else if (!cd) { percentualEntrada = 0.1; limiteEntrada = 10; }
        else if (isPJ) { percentualEntrada = comPf ? 0.1 : 0.05; limiteEntrada = 5; }
        else { percentualEntrada = 0.05; limiteEntrada = 10; }

        let valorEntrada = totalFazendario * percentualEntrada;
        if (valorEntrada < valorMinimo) valorEntrada = valorMinimo;
        const saldoDevedorAposEntrada = cd ? saldoDevedorAposDescontos - valorEntrada : totalFazendario - valorEntrada;
        let nEntradaMax = Math.min(limiteEntrada, Math.floor(valorEntrada / valorMinimo));
        if (valorEntrada / nEntradaMax < valorMinimo) nEntradaMax = Math.floor(valorEntrada / valorMinimo);
        // célula "Entrada (R$)": total × % sem o piso, exceto PN rating A/B no fazendário
        const entradaExibidaNumero = (!previdenciario && isPN && !cd) ? valorEntrada : totalFazendario * percentualEntrada;
        const parcelasEntrada = escolherParcelas(inteiro(entrada.parcelasEntrada), nEntradaMax, 1, 'Parcelas da entrada', avisos);
        const valorParcelaEntrada = fmt(valorEntrada / parcelasEntrada);
        if (fmt(entradaExibidaNumero) !== fmt(valorEntrada)) {
            avisos.push(`O formulário mostra "Entrada" ${fmt(entradaExibidaNumero)}, mas calcula com a entrada mínima de ${fmt(valorEntrada)} (uma parcela mínima de R$ ${fmt(valorMinimo)}).`);
        }

        // popularTabelaPrejuizoFiscal (negocio-faz.js:1764-1809)
        let prejuizoFiscal = null;
        let saldoDevedorAposPf = null;
        let abatimentoAplicadoNumero = 0;
        if (comPf) {
            const pf = entrada.pf || {};
            const bcn = entrada.bcn || {};
            const montantePf = valorDeCampo(pf.montante ?? entrada.montantePf);
            const montanteBcn = valorDeCampo(bcn.montante ?? entrada.montanteBcn);
            const aliquotaPf = aliquotaInteira(pf.aliquota ?? entrada.aliquotaPf, 'Alíquota do PF', avisos);
            const aliquotaBcn = aliquotaInteira(bcn.aliquota ?? entrada.aliquotaBcn, 'Alíquota da BCN', avisos);
            if (montantePf === null || montanteBcn === null || aliquotaPf === null || aliquotaBcn === null) {
                avisos.push('PF/BCN: campo vazio conta 0. O formulário exige os 4 campos preenchidos (no 1º clique em "Prosseguir" ele deixa passar).');
            }
            const saldoParaCalculoPf = saldoDevedorAposDescontos - valorEntrada;
            const limiteAbatimento = saldoParaCalculoPf * 0.3;
            const abatimentoProposto = ((montantePf || 0) * ((aliquotaPf || 0) / 100)) + ((montanteBcn || 0) * ((aliquotaBcn || 0) / 100));
            const abatimentoAplicado = Math.min(limiteAbatimento, abatimentoProposto);
            saldoDevedorAposPf = saldoParaCalculoPf - abatimentoAplicado;
            abatimentoAplicadoNumero = abatimentoAplicado;
            prejuizoFiscal = {
                montantePf: fmt(montantePf || 0), aliquotaPf: (aliquotaPf || 0) + '%',
                montanteBcn: fmt(montanteBcn || 0), aliquotaBcn: (aliquotaBcn || 0) + '%',
                saldoDevedor: fmt(saldoParaCalculoPf),
                limite: fmt(limiteAbatimento),
                proposto: fmt(abatimentoProposto),
                aplicado: fmt(abatimentoAplicado),
                saldoAPagar: fmt(saldoDevedorAposPf)
            };
            if (abatimentoProposto > limiteAbatimento) {
                avisos.push(`Abatimento proposto (${fmt(abatimentoProposto)}) acima do limite de 30%: o formulário aceita e corta para ${fmt(abatimentoAplicado)}.`);
            }
        }

        // popularTabelaRestante / calcularMaximoParcelasRestante (negocio-faz.js:1814-2594)
        let limiteRestante;
        if (previdenciario) limiteRestante = 50;
        else if (!cd) limiteRestante = 74;
        else if (isPJ) limiteRestante = 115;
        else limiteRestante = 135;
        const saldoRestante = comPf ? saldoDevedorAposPf : (cd ? saldoDevedorAposDescontos - valorEntrada : saldoDevedorAposEntrada);
        let restante = null;
        if (saldoRestante > 0) {
            let nMax = Math.min(limiteRestante, Math.floor(saldoRestante / valorMinimo));
            if (saldoRestante / nMax < valorMinimo) nMax = Math.floor(saldoRestante / valorMinimo);
            const parcelas = escolherParcelas(inteiro(entrada.parcelas), nMax, 1, 'Parcelas do saldo', avisos);
            restante = {
                criterio: `Até ${limiteRestante} meses`,
                saldo: fmt(saldoRestante),
                parcelasMaximo: nMax,
                parcelas,
                valorParcela: parcelas === null ? fmt(saldoRestante) : fmt(saldoRestante / parcelas)
            };
            if (nMax < 1) {
                avisos.push(`Saldo a parcelar abaixo da parcela mínima (R$ ${fmt(valorMinimo)}): o formulário oficial não oferece nenhuma opção de parcelas (lista vazia e erro de JavaScript), mas mostra a "parcela" igual ao saldo.`);
            }
        } else {
            avisos.push('Não sobra saldo a parcelar depois da entrada: o formulário não mostra a linha do saldo restante.');
        }

        base.resultado = {
            item, rotuloItem: `Item ${item} do edital`,
            comPf,
            descontos: tabelaDescontos,
            entrada: {
                totalDevido: fmt(totalFazendario),
                percentual: percentualEntrada,
                entradaExibida: fmt(entradaExibidaNumero),
                entrada: fmt(valorEntrada),
                parcelasMaximo: nEntradaMax,
                parcelas: parcelasEntrada,
                valorParcela: valorParcelaEntrada,
                darf: '1124'
            },
            prejuizoFiscal,
            restante,
            numeros: {
                totalDebitos: totalFazendario,
                descontoAplicado: tabelaDescontos ? num(tabelaDescontos.total.descontoAplicado) : 0,
                saldoAposDescontos: cd ? saldoDevedorAposDescontos : totalFazendario,
                entrada: valorEntrada,
                abatimentoPfBcn: abatimentoAplicadoNumero,
                saldoRestante
            }
        };
        return base;
    }

    // ------------------------------------------------------------------------------------
    // CONTROVERSIA — Relevante e disseminada controvérsia jurídica (editais.html)
    // ------------------------------------------------------------------------------------

    const OPCOES_CONTROVERSIA = [
        { codigo: '1', item: '3.1.1-I', reducao: 0.65, entrada: 0.3, parcelasEntrada: 1, parcelasSaldo: 12, percentualPfBcn: 0.3 },
        { codigo: '2', item: '3.1.1-II', reducao: 0.55, entrada: 0.25, parcelasEntrada: 1, parcelasSaldo: 24, percentualPfBcn: 0.3 },
        { codigo: '3', item: '3.1.1-III', reducao: 0.45, entrada: 0.2, parcelasEntrada: 1, parcelasSaldo: 36, percentualPfBcn: 0.3 },
        { codigo: '4', item: '3.1.1-IV', reducao: 0.35, entrada: 0.15, parcelasEntrada: 1, parcelasSaldo: 48, percentualPfBcn: 0.3 },
        { codigo: '5', item: '3.1.1-V', reducao: 0.25, entrada: 0.1, parcelasEntrada: 1, parcelasSaldo: 60, percentualPfBcn: 0.3 },
        { codigo: '6', item: '3.1.2-I (Portaria RFB 568/2025)', reducao: 0.4, entrada: 0.3, parcelasEntrada: 1, parcelasSaldo: 12, percentualPfBcn: 0.3 },
        { codigo: '7', item: '3.1.2-II (Portaria RFB 568/2025)', reducao: 0.2, entrada: 0.25, parcelasEntrada: 1, parcelasSaldo: 24, percentualPfBcn: 0.3 },
        { codigo: '8', item: '3.1.2-III (Portaria RFB 568/2025)', reducao: 0.05, entrada: 0.2, parcelasEntrada: 1, parcelasSaldo: 36, percentualPfBcn: 0.3 }
    ];
    const ALIQUOTAS_CONTROVERSIA = [9, 15, 20, 25];
    const PARCELA_MINIMA_CONTROVERSIA = 500;

    /** calcularMaximoParcelas (editais.html:1651-1667). */
    function maximoParcelasControversia(valorTotal, maxParcelas) {
        if (valorTotal <= PARCELA_MINIMA_CONTROVERSIA) return 1;
        let n = maxParcelas;
        while (valorTotal / n < PARCELA_MINIMA_CONTROVERSIA) n--;
        return n;
    }

    function lerCredito(c, rotulo, avisos) {
        if (!c) return null;
        const montante = valorDeCampo(c.montante);
        const valor = valorDeCampo(c.valor);
        let aliquota = c.aliquota === null || c.aliquota === undefined || c.aliquota === '' ? 0 : parseInt(c.aliquota, 10);
        if (Number.isNaN(aliquota) || (aliquota !== 0 && !ALIQUOTAS_CONTROVERSIA.includes(aliquota))) {
            avisos.push(`${rotulo}: alíquota "${c.aliquota}" não existe no formulário (9, 15, 20 ou 25%); tratada como não selecionada.`);
            aliquota = 0;
        }
        if (montante === null && valor === null) return null;
        return { montante: montante || 0, aliquota, valor };
    }

    /** calcularLimiteValor (editais.html:1210-1256): devolve o valor aceito ou null (campo apagado). */
    function validarCredito(c, rotulo, avisos) {
        const montante = num(fmt(c.montante));
        const aliquota = c.aliquota ? num(c.aliquota + '%') : 0;
        const valor = c.valor === null ? 0 : c.valor;
        if (montante === 0) {
            avisos.push(`${rotulo}: ${aliquota === 0 ? 'insira um montante e selecione uma alíquota válidos' : 'insira um montante válido'}; o formulário apaga o valor.`);
            return null;
        }
        const limite = montante * (aliquota / 100);
        if (valor > limite) {
            avisos.push(aliquota === 0 ? `${rotulo}: selecione uma alíquota; o formulário apaga o valor.`
                : `${rotulo}: o valor não pode exceder ${limite.toFixed(2)}; o formulário apaga o valor.`);
            return null;
        }
        return c.valor;
    }

    function simularControversia(entrada) {
        const erros = [];
        const avisos = [];
        const reproduzirFalha = entrada.corrigirCreditosProprios ? false : true;

        // atualizarValorTotalDebitos: Σ valores, exibido e relido
        const debitos = (entrada.debitos || []).map((d, i) => {
            const v = valorDeCampo(typeof d === 'object' && d !== null ? d.valor : d);
            if (v === null) erros.push(`Débito ${i + 1}: informe o valor atualizado.`);
            return v || 0;
        });
        if (debitos.length === 0) erros.push('A tabela de débitos é de preenchimento obrigatório.');
        let somaDebitos = 0;
        debitos.forEach(v => { somaDebitos += num(fmt(v)); });
        const totalDebitosTexto = fmt(somaDebitos);

        // Créditos de PF/BCN
        const proprios = entrada.creditosProprios || {};
        const pfProprio = lerCredito(proprios.pf, 'PF próprio', avisos);
        const bcnProprio = lerCredito(proprios.bcn, 'BCN própria', avisos);
        const terceiros = (entrada.creditosTerceiros || []).map((c, i) => lerCredito(c, `Crédito de terceiro ${i + 1}`, avisos)).filter(Boolean);

        const valoresTerceiros = terceiros.map((c, i) => (c.valor === null ? null : validarCredito(c, `Crédito de terceiro ${i + 1}`, avisos)));
        const algumTerceiroDigitado = terceiros.some(c => c.valor !== null);
        const valoresProprios = [];
        [[pfProprio, 'PF próprio'], [bcnProprio, 'BCN própria']].forEach(([c, rotulo]) => {
            if (!c || c.valor === null) return;
            if (reproduzirFalha) valoresProprios.push(c.valor);
            else {
                const v = validarCredito(c, rotulo, avisos);
                if (v !== null) valoresProprios.push(v);
            }
        });

        let somaCreditos = 0;
        let creditosConsiderados = [];
        if (!reproduzirFalha || algumTerceiroDigitado) {
            // atualizarValorTotalCreditos soma todos os .valorCredito com texto (próprios em cima, terceiros embaixo)
            creditosConsiderados = valoresProprios.concat(valoresTerceiros.filter(v => v !== null));
        }
        creditosConsiderados.forEach(v => { somaCreditos += num(fmt(v)); });
        const totalCreditosTexto = creditosConsiderados.length || algumTerceiroDigitado ? fmt(somaCreditos) : '0';
        if (reproduzirFalha && valoresProprios.length) {
            if (algumTerceiroDigitado) {
                avisos.push('Créditos PRÓPRIOS: o formulário só os soma porque há crédito de terceiro digitado depois deles, e não confere o limite montante × alíquota.');
            } else {
                avisos.push('Créditos PRÓPRIOS ignorados, como no formulário oficial: por um erro de carregamento da página, eles não entram no "Total de créditos de PF e BCN" (o PDF sai com "Valor amortizado com PF/BCN 0,00"). Para calcular como deveria ser, marque "Corrigir a falha" na página (ou use corrigir=1 na URL).');
            }
        }

        const base = {
            formulario: 'CONTROVERSIA', erros, avisos,
            totalDebitos: totalDebitosTexto,
            totalCreditos: totalCreditosTexto,
            resultado: null
        };
        if (erros.length) return base;

        const idx = indiceOpcao(entrada.opcao, OPCOES_CONTROVERSIA, 1);
        if (idx === null) { erros.push('Selecione uma das opções de transação (1 a 8).'); return base; }
        if (idx < 0) { erros.push(`Opção inválida: "${entrada.opcao}". Use 1 a 8.`); return base; }
        const op = OPCOES_CONTROVERSIA[idx];

        // calcularDividaConsolidada (editais.html:1304-1348)
        const totalDebitos = num(totalDebitosTexto);
        const totalCreditos = num(totalCreditosTexto);
        const valorReducao = totalDebitos * op.reducao;
        const dividaComReducao = totalDebitos - valorReducao;
        if (totalCreditos > (dividaComReducao * op.percentualPfBcn)) {
            erros.push(`Valor de PF/BCN (${fmt(totalCreditos)}) acima do permitido para a opção (30% de ${fmt(dividaComReducao)} = ${fmt(dividaComReducao * op.percentualPfBcn)}). O formulário recusa e não calcula.`);
            return base;
        }
        const saldoDevedor = dividaComReducao - totalCreditos;
        const valorEntrada = saldoDevedor * op.entrada;
        const parcelasEntradaMax = maximoParcelasControversia(valorEntrada, op.parcelasEntrada);
        const saldoRestante = saldoDevedor - valorEntrada;
        const parcelasMax = maximoParcelasControversia(saldoRestante, op.parcelasSaldo);

        const entradaTexto = fmt(valorEntrada);
        const saldoTexto = fmt(saldoRestante);
        const pedidoEntrada = inteiro(entrada.parcelasEntrada);
        const pedidoSaldo = inteiro(entrada.parcelas);
        const parcelasEntrada = pedidoEntrada === null ? null : escolherParcelas(pedidoEntrada, parcelasEntradaMax, 1, 'Parcelas da entrada', avisos);
        const parcelas = pedidoSaldo === null ? null : escolherParcelas(pedidoSaldo, parcelasMax, 1, 'Parcelas do saldo', avisos);

        base.resultado = {
            opcao: idx + 1, item: op.item,
            dividaConsolidada: fmt(totalDebitos),
            percentualReducao: (op.reducao * 100).toFixed(0) + ' %',
            valorReducao: fmt(valorReducao),
            dividaComReducao: fmt(dividaComReducao),
            percentualMaximoPfBcn: (op.percentualPfBcn * 100).toFixed(0) + ' %',
            valorAmortizadoPfBcn: fmt(totalCreditos),
            saldoDevedor: fmt(saldoDevedor),
            percentualEntrada: (op.entrada * 100).toFixed(0) + ' %',
            entrada: entradaTexto,
            parcelasEntradaMaximo: parcelasEntradaMax,
            parcelasEntrada,
            valorParcelaEntrada: parcelasEntrada === null ? '0,00' : fmt(num(entradaTexto) / parcelasEntrada),
            saldoAposEntrada: saldoTexto,
            parcelasMaximo: parcelasMax,
            parcelas,
            valorParcela: parcelas === null ? '0,00' : fmt(num(saldoTexto) / parcelas),
            numeros: { totalDebitos, valorReducao, dividaComReducao, totalCreditos, saldoDevedor, valorEntrada, saldoRestante }
        };
        if (parcelas === null || parcelasEntrada === null) {
            avisos.push('Escolha o nº de parcelas da entrada e do saldo: o formulário começa sem nenhuma seleção e mostra "0,00" no valor da parcela até a escolha.');
        }
        if (saldoRestante <= PARCELA_MINIMA_CONTROVERSIA) {
            avisos.push('Saldo até R$ 500,00: o formulário permite 1 parcela abaixo do mínimo de R$ 500,00.');
        }
        return base;
    }

    // ------------------------------------------------------------------------------------
    // Entrada única, parâmetros de URL
    // ------------------------------------------------------------------------------------

    const FORMULARIOS = {
        ATE60SM: 'Pequeno Valor — até 60 salários-mínimos (Edital RFB 10/2026)',
        FAZENDARIOS: 'Até R$ 50 milhões — débitos fazendários (Edital RFB 9/2026)',
        PREVIDENCIARIOS: 'Até R$ 50 milhões — débitos previdenciários (Edital RFB 9/2026)',
        CONTROVERSIA: 'Controvérsia jurídica — Editais Conjuntos PGFN/RFB 4 e 5/2026'
    };

    function simularFormulario(entrada) {
        const f = String(entrada.formulario || '').toUpperCase();
        if (f === 'ATE60SM') return simularAte60sm(entrada);
        if (f === 'FAZENDARIOS' || f === 'PREVIDENCIARIOS') return simular50Milhoes(Object.assign({}, entrada, { formulario: f }));
        if (f === 'CONTROVERSIA') return simularControversia(entrada);
        return { formulario: f, erros: ['Formulário desconhecido. Use ATE60SM, FAZENDARIOS, PREVIDENCIARIOS ou CONTROVERSIA.'], avisos: [], resultado: null };
    }

    function dividirLista(texto) {
        return String(texto || '').split('|').map(s => s.trim()).filter(s => s !== '');
    }

    function trio(texto) {
        const [montante, aliquota, valor] = String(texto).split(';').map(s => s.trim());
        return { montante: montante || null, aliquota: aliquota || null, valor: valor || null };
    }

    /** Querystring (sem "?") ou URLSearchParams => entrada do motor. */
    function entradaDeParametros(params) {
        const p = typeof params === 'string' ? new URLSearchParams(params.replace(/^\?/, '')) : params;
        const formulario = String(p.get('form') || p.get('formulario') || 'ATE60SM').toUpperCase();
        const entrada = { formulario };
        if (formulario === 'CONTROVERSIA') {
            entrada.debitos = dividirLista(p.get('debitos'));
            entrada.opcao = p.get('opcao');
            if (p.get('proprio_pf') || p.get('proprio_bcn')) {
                entrada.creditosProprios = {};
                if (p.get('proprio_pf')) entrada.creditosProprios.pf = trio(p.get('proprio_pf'));
                if (p.get('proprio_bcn')) entrada.creditosProprios.bcn = trio(p.get('proprio_bcn'));
            }
            entrada.creditosTerceiros = dividirLista(p.get('terceiros')).map(trio);
            entrada.parcelasEntrada = p.get('entrada');
            entrada.parcelas = p.get('parcelas');
            entrada.corrigirCreditosProprios = p.get('corrigir') === '1';
            return entrada;
        }
        entrada.debitos = dividirLista(p.get('debitos')).map(s => {
            const [principal, multa, juros, processo] = s.split(';').map(x => x.trim());
            return { principal, multa, juros, processo };
        });
        entrada.parcelas = p.get('parcelas');
        if (formulario === 'ATE60SM') {
            entrada.opcao = p.get('opcao');
            return entrada;
        }
        entrada.tipo = p.get('tipo');
        entrada.falido = p.get('falido') === '1';
        entrada.baixado = p.get('baixado') === '1';
        entrada.dividaPgfnRfb = p.get('divida');
        entrada.capag = p.get('capag');
        entrada.comPf = p.get('pf') === '1';
        entrada.pf = { montante: p.get('pf_montante'), aliquota: p.get('pf_aliquota') };
        entrada.bcn = { montante: p.get('bcn_montante'), aliquota: p.get('bcn_aliquota') };
        entrada.parcelasEntrada = p.get('entrada');
        return entrada;
    }

    /** Inverso de entradaDeParametros (sem "?"). */
    function parametrosDeEntrada(entrada) {
        const p = new URLSearchParams();
        const f = String(entrada.formulario || 'ATE60SM').toUpperCase();
        const definir = (k, v) => { if (v !== null && v !== undefined && v !== '' && v !== false) p.set(k, v === true ? '1' : String(v)); };
        p.set('form', f);
        if (f === 'CONTROVERSIA') {
            definir('debitos', (entrada.debitos || []).map(d => (typeof d === 'object' && d !== null ? d.valor : d)).filter(v => v !== null && v !== undefined && v !== '').join('|'));
            definir('opcao', entrada.opcao);
            const cp = entrada.creditosProprios || {};
            const t = c => [c.montante ?? '', c.aliquota ?? '', c.valor ?? ''].join(';');
            if (cp.pf && (cp.pf.montante || cp.pf.valor)) definir('proprio_pf', t(cp.pf));
            if (cp.bcn && (cp.bcn.montante || cp.bcn.valor)) definir('proprio_bcn', t(cp.bcn));
            definir('terceiros', (entrada.creditosTerceiros || []).filter(c => c && (c.montante || c.valor)).map(t).join('|'));
            definir('entrada', entrada.parcelasEntrada);
            definir('parcelas', entrada.parcelas);
            definir('corrigir', !!entrada.corrigirCreditosProprios);
            return p.toString();
        }
        definir('debitos', (entrada.debitos || []).map(d => {
            const campos = [d.principal ?? '', d.multa ?? '', d.juros ?? ''];
            if (d.processo) campos.push(d.processo);
            return campos.join(';');
        }).join('|'));
        if (f === 'ATE60SM') {
            definir('opcao', entrada.opcao);
            definir('parcelas', entrada.parcelas);
            return p.toString();
        }
        definir('tipo', entrada.tipo);
        definir('falido', !!entrada.falido);
        definir('baixado', !!entrada.baixado);
        definir('divida', entrada.dividaPgfnRfb);
        definir('capag', entrada.capag);
        definir('pf', !!entrada.comPf);
        if (entrada.comPf) {
            definir('pf_montante', entrada.pf && entrada.pf.montante);
            definir('pf_aliquota', entrada.pf && entrada.pf.aliquota);
            definir('bcn_montante', entrada.bcn && entrada.bcn.montante);
            definir('bcn_aliquota', entrada.bcn && entrada.bcn.aliquota);
        }
        definir('entrada', entrada.parcelasEntrada);
        definir('parcelas', entrada.parcelas);
        return p.toString();
    }

    return {
        simularFormulario,
        simularAte60sm,
        simular50Milhoes,
        simularControversia,
        entradaDeParametros,
        parametrosDeEntrada,
        fmt,
        num,
        valorDeCampo,
        processoValido,
        FORMULARIOS,
        TIPOS_50M,
        OPCOES_60SM,
        OPCOES_CONTROVERSIA,
        ALIQUOTAS_CONTROVERSIA
    };
});
