/**
 * pgfn-capacidade-pagamento.js
 */

const LIMITE_CAPACIDADE_PAGAMENTO_PGFN = 45000000;
// Acréscimo por inscrição em Dívida Ativa da PGFN — aplicado sobre a dívida que será
// efetivamente parcelada (estadoGlobal.totalDebitos), e é INDEPENDENTE do acréscimo usado
// em obterBaseCalculoPGFN() (utils.js), que serve apenas para classificar o RATING.
// São dois usos diferentes do mesmo percentual, sobre bases diferentes — não confundir.
const ACRESCIMO_INSCRICAO_DIVIDA_ATIVA_CAPAG = 0.10;

function calcularDividaElegivelCapacidadePagamentoPGFN() {
    if (!estadoGlobal.capag) {
        return { elegivel: false, motivo: 'Preencha a Capacidade de Pagamento (CAPAG) na seção anterior.' };
    }

    const tiposElegiveis = ['PN', 'PN_OBITO', 'MEI', 'ME_EPP', 'DEMAIS_PJ'];
    if (!tiposElegiveis.includes(estadoGlobal.perfil.tipoContribuinte)) {
        return { elegivel: false, motivo: 'Perfil de contribuinte não identificado.' };
    }

    // IMPORTANTE: a dívida efetivamente parcelada é a soma dos débitos informados na tabela
    // (estadoGlobal.totalDebitos), e NÃO a base usada para classificar o Rating. O campo
    // "Valor total da dívida na PGFN e RFB" (totalDebitosNaoContencioso) entra apenas na
    // conta do Rating (via obterDadosClassificacaoPGFN, mais abaixo) — nunca aqui.
    const dividaBase = estadoGlobal.totalDebitos || 0;
    if (dividaBase <= 0) {
        return { elegivel: false, motivo: 'Nenhum débito informado.' };
    }

    const dividaComAcrescimo = dividaBase * (1 + ACRESCIMO_INSCRICAO_DIVIDA_ATIVA_CAPAG);

    if (dividaComAcrescimo > LIMITE_CAPACIDADE_PAGAMENTO_PGFN) {
        return { elegivel: false, motivo: `O valor total consolidado supera o limite de R$ 45 milhões.` };
    }

    return { elegivel: true, motivo: null, dividaSemReducao: dividaComAcrescimo };
}

function isGrupoEspecialParcelasCapag(tipoContribuinte) {
    return tipoContribuinte !== 'DEMAIS_PJ';
}

const OPCOES_CAPACIDADE_PAGAMENTO_PGFN = [
    { codigoOpcao: "COM_ENTRADA", rotulo: "Com entrada" },
    { codigoOpcao: "AVISTA", rotulo: "Pagamento à vista" }
];

function calcularOpcaoCapacidadePagamentoPGFN(opcaoConfig, pEntrada, pSaldo, natureza) {
    const base = calcularDividaElegivelCapacidadePagamentoPGFN();
    if (!base.elegivel) return { elegivel: false, motivo: base.motivo };

    const dividaSemReducao = base.dividaSemReducao;
    const { rating, descontoTeorico } = obterDadosClassificacaoPGFN();
    const tipoContribuinte = estadoGlobal.perfil.tipoContribuinte;
    const grupoEspecial = isGrupoEspecialParcelasCapag(tipoContribuinte);
    
    const descontoTratado = (descontoTeorico > 1) ? (descontoTeorico / 100) : (descontoTeorico || 0);
    
    let valorMinimoParcela = tipoContribuinte === 'MEI' ? 25 : 100;

    // =========================================================================
    // 1. Identificar o Principal Original
    // =========================================================================
    let principalOriginal = 0;
    
    if (estadoGlobal.modoSimulacaoDivida === 'AGREGADO') {
        principalOriginal = estadoGlobal.debitosAgregados.principal || 0;
    } else if (estadoGlobal.modoSimulacaoDivida === 'POR_DEBITO') {
        principalOriginal = estadoGlobal.debitos.reduce((acc, d) => acc + (d.principal || 0), 0);
    } else {
        principalOriginal = estadoGlobal.totalDebitos || 0;
    }

    // RATING A ou B (Sem desconto)
    if (rating === 'A' || rating === 'B') {
        if (opcaoConfig.codigoOpcao === 'AVISTA') {
            return { elegivel: false, motivo: 'À vista indisponível para Rating A ou B (não há desconto).' };
        }
        
        const entrada = dividaSemReducao * 0.06;
        const maxEntradaEdital = grupoEspecial ? 12 : 6;
        const maxEntradaPelaMinima = Math.max(1, Math.floor(entrada / valorMinimoParcela));
        const maxEntrada = Math.min(maxEntradaEdital, maxEntradaPelaMinima);
        const numParcelasEntrada = Math.min(Math.max(pEntrada || maxEntrada, 1), maxEntrada);
        
        const parcelasMaximasNatureza = Math.max(1, 60 - numParcelasEntrada);

        const saldoDevedor = dividaSemReducao - entrada;
        const parcelasPelaMinima = Math.max(1, Math.floor(saldoDevedor / valorMinimoParcela));
        const maxReais = Math.min(parcelasMaximasNatureza, parcelasPelaMinima);
        const numeroParcelas = Math.min(Math.max(pSaldo || maxReais, 1), maxReais);
        
        return {
            elegivel: true, dividaSemReducao, entrada, numeroParcelasEntrada: numParcelasEntrada,
            parcelasEntradaMaximasReais: maxEntrada,
            valorParcelaEntrada: entrada / numParcelasEntrada, entradaDesabilitada: false, reducaoPercentual: 0,
            saldoDevedorAposReducao: saldoDevedor, numeroParcelas, parcelasMaximasReais: maxReais,
            valorParcela: saldoDevedor / numeroParcelas, totalPago: entrada + saldoDevedor, usoPfBcn: false
        };
    }

    // =========================================================================
    // RATING C ou D (Com desconto) e Amortização PGFN
    // =========================================================================
    const isAvista = opcaoConfig.codigoOpcao === 'AVISTA';
    
    const entrada = isAvista ? 0 : (dividaSemReducao * 0.06);
    const maxEntradaEdital = grupoEspecial ? 12 : 6;
    const maxEntradaPelaMinima = isAvista ? maxEntradaEdital : Math.max(1, Math.floor(entrada / valorMinimoParcela));
    const maxEntrada = Math.min(maxEntradaEdital, maxEntradaPelaMinima);
    const numParcelasEntrada = isAvista ? 0 : Math.min(Math.max(pEntrada || maxEntrada, 1), maxEntrada);
    const valorParcelaEntrada = isAvista ? 0 : (entrada / numParcelasEntrada);

    const parcelasMaximasNatureza = (natureza === 'PREVIDENCIARIO') ? Math.max(1, 60 - numParcelasEntrada) : (grupoEspecial ? 133 : 114);

    // 2. Amortização Proporcional da Entrada
    // A entrada paga um pedaço do principal e um pedaço dos juros.
    const proporcaoPrincipal = principalOriginal / dividaSemReducao;
    const principalAmortizadoNaEntrada = entrada * proporcaoPrincipal;
    const saldoPrincipalRestante = principalOriginal - principalAmortizadoNaEntrada;

    // 3. Saldo Devedor Base para o Desconto
    const saldoDevedorAposEntrada = dividaSemReducao - entrada;
    const saldoJurosMultasRestantes = saldoDevedorAposEntrada - saldoPrincipalRestante;

    // 4. Aplicação do Teto de Desconto
    // O desconto PGFN é calculado sobre o saldo APÓS a entrada (170.610 no seu exemplo).
    const tetoDescontoRating = saldoDevedorAposEntrada * descontoTratado;

    // O desconto efetivo é o menor entre o teto do Rating e os juros/multas restantes (Protege o Principal)
    const descontoConcedido = Math.min(saldoJurosMultasRestantes, tetoDescontoRating);

    // 5. Saldo Final a Parcelar
    const saldoDevedorFinal = saldoDevedorAposEntrada - descontoConcedido;

    if (isAvista) {
        return {
            elegivel: true, dividaSemReducao, entrada: 0, numeroParcelasEntrada: 0, parcelasEntradaMaximasReais: 0, valorParcelaEntrada: 0,
            entradaDesabilitada: true, reducaoPercentual: descontoTratado * 100, saldoDevedorAposReducao: saldoDevedorFinal,
            numeroParcelas: 1, parcelasMaximasReais: 1, valorParcela: saldoDevedorFinal, totalPago: saldoDevedorFinal, usoPfBcn: false
        };
    }

    const parcelasPelaMinima = Math.max(1, Math.floor(saldoDevedorFinal / valorMinimoParcela));
    const maxReais = Math.min(parcelasMaximasNatureza, parcelasPelaMinima);
    const numeroParcelas = Math.min(Math.max(pSaldo || maxReais, 1), maxReais);

    return {
        elegivel: true, dividaSemReducao, entrada, numeroParcelasEntrada: numParcelasEntrada,
        parcelasEntradaMaximasReais: maxEntrada,
        valorParcelaEntrada: valorParcelaEntrada, entradaDesabilitada: false,
        reducaoPercentual: descontoTratado * 100, saldoDevedorAposReducao: saldoDevedorFinal,
        numeroParcelas, parcelasMaximasReais: maxReais, valorParcela: saldoDevedorFinal / numeroParcelas,
        totalPago: entrada + saldoDevedorFinal, usoPfBcn: false
    };
}

function montarDefinicaoModalidadeCapacidadePagamentoPGFN() {
    const base = calcularDividaElegivelCapacidadePagamentoPGFN();
    return {
        chaveModalidade: "PGFN_CAPACIDADE_PAGAMENTO",
        nomeExibicao: "PGFN – Edital 06/2026 - Conforme a Capacidade de Pagamento",
        orgao: "PGFN",
        elegivel: base.elegivel,
        motivoInelegibilidade: base.motivo,
        dividaSemReducao: base.dividaSemReducao || 0,
        urlDetalhamento: "./assets/detalhes/pgfn-capacidade-pagamento/pgfn-capacidade-pagamento.html",
        prazoAdesao: "29/01/2027",
        vantagens: ["Desconto por Rating (C/D)"],
        permiteEditarParcelas: true, 
        permiteEditarParcelasEntrada: true,
        naturezaSelecionada: 'FAZENDARIO', // <-- Estado Local da Modalidade
        possuiSeletorNatureza: true,       // <-- Flag lida pelo Quadro-Resumo
        opcoes: OPCOES_CAPACIDADE_PAGAMENTO_PGFN.map(opcaoConfig => ({
            codigoOpcao: opcaoConfig.codigoOpcao,
            rotulo: opcaoConfig.rotulo,
            calcular: (contexto, pSaldoPersonalizado, pEntradaPersonalizado, natureza) => calcularOpcaoCapacidadePagamentoPGFN(opcaoConfig, pEntradaPersonalizado, pSaldoPersonalizado, natureza)
        }))
    };
}