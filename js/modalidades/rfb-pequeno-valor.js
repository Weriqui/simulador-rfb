/**
 * rfb-pequeno-valor.js
 * Regras de negócio: Transação Tributária — Pequeno Valor (até 60 SM) — RFB
 */

const SALARIO_MINIMO_VIGENTE = 1621.00; // R$ — ATENÇÃO: atualizar todo ano
const LIMITE_PEQUENO_VALOR_RFB = 60 * SALARIO_MINIMO_VIGENTE; // R$ 97.260,00 — limite por processo ou agregado
const PARCELA_MINIMA_RFB_PEQUENO_VALOR = 200.00; // R$ — Edital nº 10/2026, item 6.3

const OPCOES_PEQUENO_VALOR_RFB = [
    { codigoOpcao: "6.1-I",   rotulo: "Art. 6.1 - I - em até 12 prestações mensais, com redução de 50%",   parcelasMaximas: 12, percentualReducao: 50 },
    { codigoOpcao: "6.1-II",  rotulo: "Art. 6.1 - II - em até 24 prestações mensais, com redução de 40%",  parcelasMaximas: 24, percentualReducao: 40 },
    { codigoOpcao: "6.1-III", rotulo: "Art. 6.1 - III - em até 36 prestações mensais, com redução de 35%", parcelasMaximas: 36, percentualReducao: 35 },
    { codigoOpcao: "6.1-IV",  rotulo: "Art. 6.1 - IV - em até 55 prestações mensais, com redução de 30%",  parcelasMaximas: 55, percentualReducao: 30 }
];

function calcularDividaElegivelPequenoValorRFB() {
    // 1. Validação de Perfil
    const tiposElegiveis = ['PN', 'PN_OBITO', 'MEI', 'ME_EPP'];
    if (!tiposElegiveis.includes(estadoGlobal.perfil.tipoContribuinte)) {
        return { elegivel: false, motivo: 'Modalidade disponível apenas para Pessoa Natural, MEI, ME ou EPP.', dividaSemReducao: 0 };
    }

    // A dívida elegível é sempre a soma dos débitos informados na tabela — NUNCA o campo
    // "Valor total da dívida na PGFN e RFB", que serve só para o Rating (obterBaseCalculoRFB,
    // em utils.js).
    let dividaSemReducao = 0;

    // 2. Regra para Simulação Detalhada (Por Débito)
    if (estadoGlobal.modoSimulacaoDivida === 'POR_DEBITO') {
        const debitosElegiveis = estadoGlobal.debitos.filter(d => d.total > 0 && d.total <= LIMITE_PEQUENO_VALOR_RFB);

        if (debitosElegiveis.length === 0) {
            return { elegivel: false, motivo: `Nenhum débito individual dentro do limite de R$ ${LIMITE_PEQUENO_VALOR_RFB.toFixed(2)} (60 salários-mínimos por processo).`, dividaSemReducao: 0 };
        }
        dividaSemReducao = debitosElegiveis.reduce((acc, d) => acc + d.total, 0);
    }
    // 3. Regra para Simulação Agregada
    else if (estadoGlobal.modoSimulacaoDivida === 'AGREGADO') {
        const totalAgregado = estadoGlobal.debitosAgregados.total;

        if (totalAgregado === 0) {
            return { elegivel: false, motivo: 'Nenhum valor de débito foi informado.', dividaSemReducao: 0 };
        }

        if (totalAgregado > LIMITE_PEQUENO_VALOR_RFB) {
            return { elegivel: false, motivo: `O valor total agregado supera o limite de R$ ${LIMITE_PEQUENO_VALOR_RFB.toFixed(2)} (60 salários-mínimos por processo).`, dividaSemReducao: 0 };
        }
        dividaSemReducao = totalAgregado;
    } else {
        return { elegivel: false, motivo: 'Modo de simulação não selecionado.', dividaSemReducao: 0 };
    }

    return { elegivel: true, motivo: null, dividaSemReducao };
}

function calcularOpcaoPequenoValorRFB(opcaoConfig, numeroParcelasEscolhidoPeloUsuario) {
    const { elegivel, motivo, dividaSemReducao } = calcularDividaElegivelPequenoValorRFB();

    if (!elegivel) {
        return { elegivel: false, motivo };
    }

    const saldoDevedor = dividaSemReducao * (1 - opcaoConfig.percentualReducao / 100);

    // Nº máximo de parcelas permitido pela regra da parcela mínima
    const parcelasPelaParcelaMinima = Math.max(1, Math.floor(saldoDevedor / PARCELA_MINIMA_RFB_PEQUENO_VALOR));
    const parcelasMaximasReais = Math.min(opcaoConfig.parcelasMaximas, parcelasPelaParcelaMinima);

    const numeroParcelas = Math.min(numeroParcelasEscolhidoPeloUsuario || parcelasMaximasReais, parcelasMaximasReais);
    const valorParcela = saldoDevedor / numeroParcelas;

    const reducaoPercentualExibicao = dividaSemReducao > 0
        ? ((dividaSemReducao - saldoDevedor) / dividaSemReducao) * 100
        : 0;

    return {
        elegivel: true,
        dividaSemReducao,
        reducaoPercentual: reducaoPercentualExibicao,
        saldoDevedorAposReducao: saldoDevedor,
        entrada: 0,
        numeroParcelasEntrada: 0,
        numeroParcelas,
        parcelasMaximasReais, // Teto real enviado ao Quadro-Resumo
        valorParcela,
        usoPfBcn: false,
        percentualMaximoPfBcn: 0
    };
}

function montarDefinicaoModalidadePequenoValorRFB() {
    const { elegivel, motivo, dividaSemReducao } = calcularDividaElegivelPequenoValorRFB();

    return {
        chaveModalidade: "RFB_PEQUENO_VALOR",
        nomeExibicao: "RFB – Edital nº 10/2026 – Até 60 salários-mínimos",
        orgao: "RFB",
        elegivel,
        motivoInelegibilidade: motivo,
        dividaSemReducao,
        urlDetalhamento: "./assets/detalhes/rfb-pequeno-valor/rfb-pequeno-valor.html",
        urlAdesao: null,
        prazoAdesao: "30/12/2026",
        vantagens: ["Menor saldo devedor"],
        permiteEditarParcelas: true, // Libera o <input> numérico na interface comparativa
        opcoes: OPCOES_PEQUENO_VALOR_RFB.map(opcaoConfig => ({
            codigoOpcao: opcaoConfig.codigoOpcao,
            rotulo: opcaoConfig.rotulo,
            calcular: (contexto, numeroParcelasEscolhido) => calcularOpcaoPequenoValorRFB(opcaoConfig, numeroParcelasEscolhido)
        }))
    };
}