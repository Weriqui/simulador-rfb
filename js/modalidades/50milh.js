function gerarDescricaoFazendaria(
    rating,
    desconto,
    saldoDevedor,
    entrada,
    parcelaEntrada,
    numeroParcelasEntrada,
    parcelas,
    valorPrestacao,
    percentualEntrada
) {
    const percentualEntradaTexto = percentualEntrada ?? ((rating === 'A' || rating === 'B') ? 10 : 5);

    if (
        rating === 'A' ||
        rating === 'B'
    ) {

        return `
            Desconto teórico de até ${desconto}%.
            Saldo devedor de R$ ${converterNumeroEmMoeda(saldoDevedor)}.
            Entrada de ${percentualEntradaTexto}% (R$ ${converterNumeroEmMoeda(entrada)})
            em ${numeroParcelasEntrada} prestações mensais
            (R$ ${converterNumeroEmMoeda(parcelaEntrada)} - ${numeroParcelasEntrada}x)
            e o restante em até ${parcelas} prestações
            (R$ ${converterNumeroEmMoeda(valorPrestacao)}).
        `;
    }

    return `
        Desconto teórico de até ${desconto}%.
        Saldo devedor de R$ ${converterNumeroEmMoeda(saldoDevedor)}.
        Entrada de ${percentualEntradaTexto}% (R$ ${converterNumeroEmMoeda(entrada)}),
        antes dos descontos,
        em ${numeroParcelasEntrada} prestações mensais
        (R$ ${converterNumeroEmMoeda(parcelaEntrada)} - ${numeroParcelasEntrada}x)
        e o restante em até ${parcelas} prestações
        (R$ ${converterNumeroEmMoeda(valorPrestacao)}).
    `;
}

function gerarDescricaoPrevidenciaria(
    rating,
    desconto,
    saldoDevedor,
    entrada,
    parcelaEntrada,
    numeroParcelasEntrada,
    parcelas,
    valorPrestacao
) {
    if (
        rating === 'A' ||
        rating === 'B'
    ) {
        

        return `
            Desconto teórico de até ${desconto}%.
            Saldo devedor de R$ ${converterNumeroEmMoeda(saldoDevedor)}.
            Entrada de 5% (R$ ${converterNumeroEmMoeda(entrada)})
            em ${numeroParcelasEntrada} prestações mensais
            (R$ ${converterNumeroEmMoeda(parcelaEntrada)} - ${numeroParcelasEntrada}x)
            e o restante em até ${parcelas} prestações
            (R$ ${converterNumeroEmMoeda(valorPrestacao)}).
        `;
    }

    return `
        Desconto teórico de até ${desconto}%.
        Saldo devedor de R$ ${converterNumeroEmMoeda(saldoDevedor)}.
        Entrada de 5% (R$ ${converterNumeroEmMoeda(entrada)}),
        antes dos descontos,
        em ${numeroParcelasEntrada} prestações mensais
        (R$ ${converterNumeroEmMoeda(parcelaEntrada)} - ${numeroParcelasEntrada}x)
        e o restante em até ${parcelas} prestações
        (R$ ${converterNumeroEmMoeda(valorPrestacao)}).
    `;
}

const LIMITE_RFB_50_MILHOES = 50000000;

function obterPercentualEntradaFazendariaRfb50m(rating, valorPfBcn) {
    return rating === 'A' ||
        rating === 'B' ||
        (Number(valorPfBcn) || 0) > 0
        ? 0.10
        : 0.05;
}

function somarMultaEJuros(debitos) {
    return debitos.reduce(
        (acumulado, debito) =>
            acumulado +
            (debito.multa || 0) +
            (debito.juros || 0),
        0
    );
}

function obterDescontoMaximoPermitidoRfb50Milhoes() {
    if (estadoGlobal.modoSimulacaoDivida === 'POR_DEBITO') {
        const debitosElegiveis = estadoGlobal.debitos.filter(
            debito =>
                debito.total > 0 &&
                debito.total <= LIMITE_RFB_50_MILHOES
        );

        return somarMultaEJuros(debitosElegiveis);
    }

    if (estadoGlobal.modoSimulacaoDivida === 'AGREGADO') {
        return (
            (estadoGlobal.debitosAgregados?.multa || 0) +
            (estadoGlobal.debitosAgregados?.juros || 0)
        );
    }

    if (estadoGlobal.debitos.length > 0) {
        return somarMultaEJuros(estadoGlobal.debitos);
    }

    return (
        (estadoGlobal.debitosAgregados?.multa || 0) +
        (estadoGlobal.debitosAgregados?.juros || 0)
    );
}

function calcularDividaElegivelRfb50Milhoes() {
    // IMPORTANTE: a dívida efetivamente parcelada no RFB é a soma dos débitos informados
    // na tabela (estadoGlobal.totalDebitos) — o mesmo valor usado antes da separação de
    // Rating por órgão. O campo "Valor total da dívida na PGFN e RFB"
    // (totalDebitosNaoContencioso) entra só na conta do Rating (obterDadosClassificacaoRFB,
    // usado mais abaixo para desconto/limite de parcelas), nunca na dívida a parcelar.
    const dividaSemReducao = estadoGlobal.totalDebitos || 0;
    let descontoMaximoPermitido = obterDescontoMaximoPermitidoRfb50Milhoes();

    if (dividaSemReducao <= 0) {
        return {
            elegivel: false,
            motivo: 'Nenhum valor de debito foi informado.',
            dividaSemReducao: 0,
            descontoMaximoPermitido: 0
        };
    }

    if (dividaSemReducao > LIMITE_RFB_50_MILHOES) {
        return {
            elegivel: false,
            motivo: `O valor total informado supera o limite de R$ ${LIMITE_RFB_50_MILHOES.toFixed(2)} por processo.`,
            dividaSemReducao: 0,
            descontoMaximoPermitido: 0
        };
    }

    if (estadoGlobal.modoSimulacaoDivida === 'POR_DEBITO') {
        const debitosElegiveis = estadoGlobal.debitos.filter(
            debito =>
                debito.total > 0 &&
                debito.total <= LIMITE_RFB_50_MILHOES
        );

        if (debitosElegiveis.length === 0) {
            return {
                elegivel: false,
                motivo: `Nenhum debito individual dentro do limite de R$ ${LIMITE_RFB_50_MILHOES.toFixed(2)} (50 Milhões) por processo.`,
                dividaSemReducao: 0,
                descontoMaximoPermitido: 0
            };
        }

        descontoMaximoPermitido =
            somarMultaEJuros(debitosElegiveis);
    } else if (estadoGlobal.modoSimulacaoDivida === 'AGREGADO') {
        const totalAgregado = estadoGlobal.debitosAgregados.total;

        if (totalAgregado <= 0) {
            return {
                elegivel: false,
                motivo: 'Nenhum valor de debito foi informado.',
                dividaSemReducao: 0,
                descontoMaximoPermitido: 0
            };
        }

        if (totalAgregado > LIMITE_RFB_50_MILHOES) {
            return {
                elegivel: false,
                motivo: `O valor total agregado supera o limite de R$ ${LIMITE_RFB_50_MILHOES.toFixed(2)} por processo.`,
                dividaSemReducao: 0,
                descontoMaximoPermitido: 0
            };
        }

    }

    return {
        elegivel: true,
        motivo: null,
        dividaSemReducao: dividaSemReducao,
        descontoMaximoPermitido: descontoMaximoPermitido
    };
}

function carregarModalidadeRfb50Milhoes() {

    const resultadoElegibilidade =
        calcularDividaElegivelRfb50Milhoes();

    const dividaElegivelSemReducao =
        resultadoElegibilidade.dividaSemReducao;

    const calcularResultadoRfb50Milhoes = function (
        contexto,
        tipoDebitoSelecionado,
        pParcelasPersonalizadas,
        pEntradaPersonalizada
    ) {
        const avaliacaoElegibilidade =
            calcularDividaElegivelRfb50Milhoes();

        if (!avaliacaoElegibilidade.elegivel) {
            return {
                elegivel: false,
                motivo: avaliacaoElegibilidade.motivo
            };
        }

        const dividaSemReducao =
            avaliacaoElegibilidade.dividaSemReducao;

        const descontoMaximoPermitido =
            avaliacaoElegibilidade.descontoMaximoPermitido || 0;

        const { rating, descontoTeorico } = obterDadosClassificacaoRFB();
        const desconto = descontoTeorico * 100;

        const descontoCalculado =
            dividaSemReducao * (desconto / 100);

        const descontoAplicado =
            Math.min(
                descontoCalculado,
                descontoMaximoPermitido
            );

        const saldoDevedor =
            dividaSemReducao - descontoAplicado;

        // PF/BCN só é permitido para Pessoa Jurídica (excluindo PN/PN_OBITO) E somente
        // quando o Rating for C ou D — Ratings A ou B não têm direito ao uso de PF/BCN.
        const contribuinteElegivelPfBcn = !(
            estadoGlobal?.perfil?.tipoContribuinte === 'PN' ||
            estadoGlobal?.perfil?.tipoContribuinte === 'PN_OBITO'
        ) && (rating === 'C' || rating === 'D');

        const valorMinimoParcela =
            obterValorMinimoParcelaPorPerfil();

        const entradaFazendaria =
            dividaSemReducao * obterPercentualEntradaFazendariaRfb50m(rating, 0);
        const entradaPrevidenciaria = dividaSemReducao * 0.05;

        const limiteEditalParcelasEntrada =
            obterLimiteParcelasEntradaRfb50m(
                rating,
                estadoGlobal?.perfil?.tipoContribuinte
            );

        const numeroParcelasEntradaMaximas = Math.max(
            1,
            Math.min(
                limiteEditalParcelasEntrada,
                Math.floor(entradaFazendaria / valorMinimoParcela),
                Math.floor(entradaPrevidenciaria / valorMinimoParcela)
            )
        );

        const numeroParcelasEntradaSelecionadas = Math.min(
            Math.max(parseInt(pEntradaPersonalizada, 10) || numeroParcelasEntradaMaximas, 1),
            numeroParcelasEntradaMaximas
        );

        const saldoAposEntradaFazendaria =
            saldoDevedor - entradaFazendaria;

        const saldoAposEntradaPrevidenciaria =
            saldoDevedor - entradaPrevidenciaria;

        const valorPrestacaoEntradaFazendaria =
            entradaFazendaria / numeroParcelasEntradaSelecionadas;

        const valorPrestacaoEntradaPrevidenciaria =
            entradaPrevidenciaria / numeroParcelasEntradaSelecionadas;

        const limitePfBcnFazendario =
            contribuinteElegivelPfBcn
                ? (saldoAposEntradaFazendaria * 0.30)
                : 0;

        const limitePfBcnPrevidenciario =
            contribuinteElegivelPfBcn
                ? (saldoAposEntradaPrevidenciaria * 0.30)
                : 0;

        const saldoRemanescenteFazendario = saldoAposEntradaFazendaria;
        const saldoRemanescentePrevidenciario = saldoAposEntradaPrevidenciaria;

        const parcelasFazendariasMaximas =
            calcularParcelasMaximasPorValorMinimo(
                saldoRemanescenteFazendario,
                obterLimiteEditalParcelasFazendariasRfb50Milhoes(
                    rating,
                    estadoGlobal.perfil.tipoContribuinte
                ),
                valorMinimoParcela
            );

        const parcelasPrevidenciariasMaximas =
            calcularParcelasMaximasPorValorMinimo(
                saldoRemanescentePrevidenciario,
                50,
                valorMinimoParcela
            );

        const parcelasFazendariasSelecionadas =
            Math.min(
                Math.max(parseInt(pParcelasPersonalizadas, 10) || parcelasFazendariasMaximas, 1),
                parcelasFazendariasMaximas
            );

        const parcelasPrevidenciariasSelecionadas =
            Math.min(
                Math.max(parseInt(pParcelasPersonalizadas, 10) || parcelasPrevidenciariasMaximas, 1),
                parcelasPrevidenciariasMaximas
            );

        const valorPrestacaoFazendaria =
            saldoRemanescenteFazendario /
            parcelasFazendariasSelecionadas;

        const valorPrestacaoPrevidenciaria =
            saldoRemanescentePrevidenciario /
            parcelasPrevidenciariasSelecionadas;

        const isFazendario = tipoDebitoSelecionado === 'FAZENDARIO';

        return {
            elegivel: true,

            rating: rating,

            tipoContribuinte: estadoGlobal.perfil.tipoContribuinte,

            dividaSemReducao: dividaSemReducao,

            reducaoPercentual: desconto,

            descontoCalculado: descontoCalculado,

            descontoAplicado: descontoAplicado,

            descontoMaximoPermitido: descontoMaximoPermitido,

            saldoDevedorAposReducao: saldoDevedor,

            numeroParcelasEntrada: numeroParcelasEntradaSelecionadas,

            numeroParcelasEntradaMaximas: numeroParcelasEntradaMaximas,

            parcelasEntradaMaximasReais: numeroParcelasEntradaMaximas,

            entradaDesabilitada: false,

            valorParcelaEntrada:
                isFazendario
                    ? valorPrestacaoEntradaFazendaria
                    : valorPrestacaoEntradaPrevidenciaria,

            usoPfBcn: contribuinteElegivelPfBcn,

            percentualMaximoPfBcn: 30,

            limiteMaximoPfBcn:
                isFazendario
                    ? limitePfBcnFazendario
                    : limitePfBcnPrevidenciario,

            valorPfBcn: 0,

            valorMinimoParcela: valorMinimoParcela,

            entrada: isFazendario ? entradaFazendaria : entradaPrevidenciaria,

            numeroParcelas:
                isFazendario
                    ? (numeroParcelasEntradaSelecionadas + parcelasFazendariasSelecionadas)
                    : (numeroParcelasEntradaSelecionadas + parcelasPrevidenciariasSelecionadas),

            parcelasMaximasReais:
                isFazendario
                    ? parcelasFazendariasMaximas
                    : parcelasPrevidenciariasMaximas,

            valorParcela:
                isFazendario
                    ? valorPrestacaoFazendaria
                    : valorPrestacaoPrevidenciaria,

            // FAZENDARIOS

            parcelasFazendariasMaximas:
                parcelasFazendariasMaximas,

            parcelasFazendariasSelecionadas:
                parcelasFazendariasSelecionadas,

            valorPrestacaoFazendaria:
                valorPrestacaoFazendaria,

            // PREVIDENCIARIOS

            parcelasPrevidenciariasMaximas:
                parcelasPrevidenciariasMaximas,

            parcelasPrevidenciariasSelecionadas:
                parcelasPrevidenciariasSelecionadas,

            valorPrestacaoPrevidenciaria:
                valorPrestacaoPrevidenciaria,

            entradaFazendaria:
                entradaFazendaria,

            valorPrestacaoEntradaFazendaria:
                valorPrestacaoEntradaFazendaria,

            saldoAposEntradaFazendaria:
                saldoAposEntradaFazendaria,

            saldoRemanescenteFazendario:
                saldoRemanescenteFazendario,

            limitePfBcnFazendario:
                limitePfBcnFazendario,

            valorPfBcnFazendario:
                0,

            entradaPrevidenciaria:
                entradaPrevidenciaria,

            valorPrestacaoEntradaPrevidenciaria:
                valorPrestacaoEntradaPrevidenciaria,

            saldoAposEntradaPrevidenciaria:
                saldoAposEntradaPrevidenciaria,

            saldoRemanescentePrevidenciario:
                saldoRemanescentePrevidenciario,

            limitePfBcnPrevidenciario:
                limitePfBcnPrevidenciario,

            valorPfBcnPrevidenciario:
                0,

            numeroParcelasFazendarias:
                numeroParcelasEntradaSelecionadas +
                parcelasFazendariasSelecionadas,

            numeroParcelasPrevidenciarias:
                numeroParcelasEntradaSelecionadas +
                parcelasPrevidenciariasSelecionadas,

            descricaoFazendaria:
                gerarDescricaoFazendaria(
                    rating,
                    desconto,
                    saldoDevedor,
                    entradaFazendaria,
                    valorPrestacaoEntradaFazendaria,
                    numeroParcelasEntradaSelecionadas,
                    parcelasFazendariasSelecionadas,
                    valorPrestacaoFazendaria
                ),

            descricaoPrevidenciaria:
                gerarDescricaoPrevidenciaria(
                    rating,
                    desconto,
                    saldoDevedor,
                    entradaPrevidenciaria,
                    valorPrestacaoEntradaPrevidenciaria,
                    numeroParcelasEntradaSelecionadas,
                    parcelasPrevidenciariasSelecionadas,
                    valorPrestacaoPrevidenciaria
                )
        };
    };

    registrarModalidade({

        chaveModalidade: 'RFB_GERAL_50M',

        nomeExibicao:
            'RFB - Edital nº 9/2026 - Até 50 milhões por Processo',

        orgao: 'RFB',

        elegivel: resultadoElegibilidade.elegivel,

        motivoInelegibilidade: resultadoElegibilidade.motivo,

        dividaSemReducao: dividaElegivelSemReducao,

        urlDetalhamento: './assets/detalhes/rfb-50-milhoes/detalhar-rfb-geral-50m.html',

        urlAdesao: null,

        prazoAdesao: '30/12/2026',

        exibirSaldoComEntrada: false,

        permiteEditarParcelas: true,

        permiteEditarParcelasEntrada: true,

        vantagens: [],

        opcaoSelecionadaIndex: 0,

        opcoes: [
            {
                codigoOpcao: 'FAZENDARIO',

                rotulo: 'Debitos Fazendarios',

                calcular: function (contexto, pSaldoPersonalizado, pEntradaPersonalizada) {
                    return calcularResultadoRfb50Milhoes(
                        contexto,
                        'FAZENDARIO',
                        pSaldoPersonalizado,
                        pEntradaPersonalizada
                    );
                }
            },
            {
                codigoOpcao: 'PREVIDENCIARIO',

                rotulo: 'Debitos Previdenciarios',

                calcular: function (contexto, pSaldoPersonalizado, pEntradaPersonalizada) {
                    return calcularResultadoRfb50Milhoes(
                        contexto,
                        'PREVIDENCIARIO',
                        pSaldoPersonalizado,
                        pEntradaPersonalizada
                    );
                }
            }
        ]
    });
}

function obterValorMinimoParcelaPorPerfil() {
    const tipoContribuinte = estadoGlobal?.perfil?.tipoContribuinte;

    if (
        tipoContribuinte === 'PN' ||
        tipoContribuinte === 'PN_OBITO'
    ) {
        return 200;
    }

    return 300;
}

function obterLimiteEditalParcelasFazendariasRfb50Milhoes(
    rating,
    tipoContribuinte
) {
    const perfilEspecial = (
        tipoContribuinte === 'PN' ||
        tipoContribuinte === 'PN_OBITO' ||
        tipoContribuinte === 'MEI' ||
        tipoContribuinte === 'ME_EPP'
    );

    if (perfilEspecial) {
        return (rating === 'A' || rating === 'B')
            ? 74
            : 135;
    }

    // DEMAIS_PJ
    return (rating === 'A' || rating === 'B')
        ? 74
        : 115;
}

// Demais PJ com rating C/D têm limite reduzido de parcelas de entrada, independente do uso de PF/BCN.
function obterLimiteParcelasEntradaRfb50m(
    rating,
    tipoContribuinte
) {
    const perfilEspecial =
        tipoContribuinte === 'PN' ||
        tipoContribuinte === 'PN_OBITO' ||
        tipoContribuinte === 'MEI' ||
        tipoContribuinte === 'ME_EPP';

    const demaisPj = !perfilEspecial;

    if (
        demaisPj &&
        (rating === 'C' || rating === 'D')
    ) {
        return 5;
    }

    return 10;
}
``

function calcularParcelasMaximasPorValorMinimo(
    saldo,
    parcelasMaximasPermitidas,
    valorMinimoParcela
) {
    const maximoPorValorMinimo =
        Math.floor((saldo || 0) / valorMinimoParcela);

    return Math.min(
        parcelasMaximasPermitidas,
        Math.max(1, maximoPorValorMinimo)
    );
}

function recalcularCamposPfBcnRfb50m(
    resultado,
    valorPfBcnFazendario,
    valorPfBcnPrevidenciario
) {
    if (!resultado) {
        return;
    }

    const valorMinimoParcela =
        resultado.valorMinimoParcela ||
        obterValorMinimoParcelaPorPerfil();

    const numeroParcelasEntrada =
        resultado.numeroParcelasEntrada || 10;

    const valorPfBcnFazendarioInformado =
        Math.max(Number(valorPfBcnFazendario) || 0, 0);

    const percentualEntradaFazendaria =
        obterPercentualEntradaFazendariaRfb50m(
            resultado.rating,
            valorPfBcnFazendarioInformado
        );

    console.debug('[RFB 50M] PF/BCN antes do recálculo:', {
        valorPfBcnFazendarioInformado,
        percentualEntradaFazendaria
    });

    resultado.entradaFazendaria =
        (resultado.dividaSemReducao || 0) * percentualEntradaFazendaria;
    resultado.entrada = resultado.entradaFazendaria;

    resultado.saldoAposEntradaFazendaria =
        (resultado.saldoDevedorAposReducao || 0) - resultado.entradaFazendaria;

    const limiteEditalParcelasEntrada =
        obterLimiteParcelasEntradaRfb50m(
            resultado.rating,
            resultado.tipoContribuinte
        );

    const numeroParcelasEntradaMaximas = Math.max(
        1,
        Math.min(
            limiteEditalParcelasEntrada,
            Math.floor(resultado.entradaFazendaria / valorMinimoParcela),
            Math.floor((resultado.entradaPrevidenciaria || 0) / valorMinimoParcela)
        )
    );

    const numeroParcelasEntradaAtualizadas = Math.min(
        Math.max(numeroParcelasEntrada, 1),
        numeroParcelasEntradaMaximas
    );

    resultado.numeroParcelasEntrada = numeroParcelasEntradaAtualizadas;
    resultado.numeroParcelasEntradaMaximas = numeroParcelasEntradaMaximas;
    resultado.parcelasEntradaMaximasReais = numeroParcelasEntradaMaximas;
    resultado.valorPrestacaoEntradaFazendaria =
        resultado.entradaFazendaria / numeroParcelasEntradaAtualizadas;
    resultado.valorPrestacaoEntradaPrevidenciaria =
        (resultado.entradaPrevidenciaria || 0) / numeroParcelasEntradaAtualizadas;

    const limiteFaz = Math.max(
        resultado.saldoAposEntradaFazendaria * 0.30,
        0
    );
    const limitePrev = Math.max(
        (resultado.saldoAposEntradaPrevidenciaria || 0) * 0.30,
        0
    );

    resultado.limitePfBcnFazendario = limiteFaz;
    resultado.limitePfBcnPrevidenciario = limitePrev;

    const valorFazNormalizado = Math.min(
        valorPfBcnFazendarioInformado,
        limiteFaz
    );

    const valorPrevNormalizado = Math.min(
        Math.max(Number(valorPfBcnPrevidenciario) || 0, 0),
        limitePrev
    );

    resultado.valorPfBcnFazendario = valorFazNormalizado;
    resultado.valorPfBcnPrevidenciario = valorPrevNormalizado;

    resultado.saldoRemanescenteFazendario =
        resultado.saldoAposEntradaFazendaria - valorFazNormalizado;

    resultado.saldoRemanescentePrevidenciario =
        (resultado.saldoAposEntradaPrevidenciaria || 0) - valorPrevNormalizado;

    console.debug('[RFB 50M] entradaFazendaria atualizada:', resultado.entradaFazendaria);

    const limiteParcelasFazendarias =
        obterLimiteEditalParcelasFazendariasRfb50Milhoes(
            resultado.rating,
            resultado.tipoContribuinte
        );

    console.debug('[RFB 50M] limite de parcelas obtido após atualização da entrada:', limiteParcelasFazendarias);

    resultado.parcelasFazendariasMaximas =
        calcularParcelasMaximasPorValorMinimo(
            resultado.saldoRemanescenteFazendario,
            limiteParcelasFazendarias,
            valorMinimoParcela
        );

    resultado.parcelasPrevidenciariasMaximas =
        calcularParcelasMaximasPorValorMinimo(
            resultado.saldoRemanescentePrevidenciario,
            50,
            valorMinimoParcela
        );

    resultado.parcelasFazendariasSelecionadas = Math.min(
        Math.max(resultado.parcelasFazendariasSelecionadas || resultado.parcelasFazendariasMaximas, 1),
        resultado.parcelasFazendariasMaximas
    );

    resultado.parcelasPrevidenciariasSelecionadas = Math.min(
        Math.max(resultado.parcelasPrevidenciariasSelecionadas || resultado.parcelasPrevidenciariasMaximas, 1),
        resultado.parcelasPrevidenciariasMaximas
    );

    resultado.valorPrestacaoFazendaria =
        resultado.saldoRemanescenteFazendario /
        Math.max(resultado.parcelasFazendariasSelecionadas, 1);

    resultado.valorPrestacaoPrevidenciaria =
        resultado.saldoRemanescentePrevidenciario /
        Math.max(resultado.parcelasPrevidenciariasSelecionadas, 1);

    resultado.numeroParcelasFazendarias =
        numeroParcelasEntradaAtualizadas + resultado.parcelasFazendariasSelecionadas;

    resultado.numeroParcelasPrevidenciarias =
        numeroParcelasEntradaAtualizadas + resultado.parcelasPrevidenciariasSelecionadas;

    resultado.descricaoFazendaria =
        gerarDescricaoFazendaria(
            resultado.rating,
            resultado.reducaoPercentual,
            resultado.saldoDevedorAposReducao,
            resultado.entradaFazendaria,
            resultado.valorPrestacaoEntradaFazendaria,
            numeroParcelasEntradaAtualizadas,
            resultado.parcelasFazendariasSelecionadas,
            resultado.valorPrestacaoFazendaria,
            percentualEntradaFazendaria * 100
        );

    resultado.descricaoPrevidenciaria =
        gerarDescricaoPrevidenciaria(
            resultado.rating,
            resultado.reducaoPercentual,
            resultado.saldoDevedorAposReducao,
            resultado.entradaPrevidenciaria,
            resultado.valorPrestacaoEntradaPrevidenciaria,
            numeroParcelasEntrada,
            resultado.parcelasPrevidenciariasSelecionadas,
            resultado.valorPrestacaoPrevidenciaria
        );

    console.debug('[RFB 50M] recálculo concluído:', {
        valorPfBcnFazendarioInformado,
        percentualEntradaFazendaria,
        entradaFazendaria: resultado.entradaFazendaria,
        entrada: resultado.entrada,
        saldoAposEntradaFazendaria: resultado.saldoAposEntradaFazendaria,
        parcelasFazendariasMaximas: resultado.parcelasFazendariasMaximas
    });
}

function gerarOpcoesParcelamento(
    maximo,
    selecionado
) {
    let html = '';
    for (let i = 1; i <= maximo; i++) {
        html += `
            <option value="${i}" ${i === Number(selecionado) ? 'selected' : ''}>
                ${i}
            </option>
        `;
    }
    return html;
}

function alterarParcelasPrevidenciarias(parcelas) {

    const modalidade =
        JSON.parse(
            sessionStorage.getItem(
                'modalidadeRfb50m'
            )
        );

    const valorMinimoParcela =
        modalidade.resultadoAtual.valorMinimoParcela ||
        obterValorMinimoParcelaPorPerfil();

    const parcelasPrevidenciariasMaximas =
        calcularParcelasMaximasPorValorMinimo(
            modalidade.resultadoAtual.saldoRemanescentePrevidenciario,
            modalidade.resultadoAtual.parcelasPrevidenciariasMaximas || 50,
            valorMinimoParcela
        );

    const parcelasSelecionadas =
        Math.min(
            Math.max(parseInt(parcelas, 10) || parcelasPrevidenciariasMaximas, 1),
            Math.max(parcelasPrevidenciariasMaximas, 1)
        );

    modalidade.resultadoAtual
        .parcelasPrevidenciariasMaximas =
            parcelasPrevidenciariasMaximas;

    modalidade.resultadoAtual
        .parcelasPrevidenciariasSelecionadas =
            parcelasSelecionadas;

    modalidade.resultadoAtual
        .valorPrestacaoPrevidenciaria =
            modalidade.resultadoAtual.saldoRemanescentePrevidenciario /
            parcelasSelecionadas;

    modalidade.resultadoAtual
        .descricaoPrevidenciaria =
            gerarDescricaoPrevidenciaria(
                modalidade.resultadoAtual.rating,
                modalidade.resultadoAtual.reducaoPercentual,
                modalidade.resultadoAtual.saldoDevedorAposReducao,
                modalidade.resultadoAtual.entradaPrevidenciaria,
                modalidade.resultadoAtual
                    .valorPrestacaoEntradaPrevidenciaria,
                modalidade.resultadoAtual
                    .numeroParcelasEntrada,
                parcelasSelecionadas,
                modalidade.resultadoAtual
                    .valorPrestacaoPrevidenciaria
            );

    modalidade.resultadoAtual.numeroParcelasPrevidenciarias =
        modalidade.resultadoAtual.numeroParcelasEntrada + parcelasSelecionadas;

    modalidade.resultadoAtual.numeroParcelas =
        modalidade.resultadoAtual.numeroParcelasFazendarias;

    sessionStorage.setItem(
        'modalidadeRfb50m',
        JSON.stringify(modalidade)
    );

    document.getElementById(
        'id-valor-prestacao-previdenciaria'
    ).innerHTML =
        'R$ ' +
        converterNumeroEmMoeda(
            modalidade.resultadoAtual
                .valorPrestacaoPrevidenciaria
        );

    document.getElementById(
        'id-descricao-previdenciaria'
    ).innerHTML =
        modalidade.resultadoAtual
            .descricaoPrevidenciaria;

    atualizarResumoParcelasDetalhamento(modalidade);
}

function alterarParcelasFazendarias(parcelas) {

    const modalidade =
        JSON.parse(
            sessionStorage.getItem(
                'modalidadeRfb50m'
            )
        );

    const valorMinimoParcela =
        modalidade.resultadoAtual.valorMinimoParcela ||
        obterValorMinimoParcelaPorPerfil();

    const parcelasFazendariasMaximas =
        calcularParcelasMaximasPorValorMinimo(
            modalidade.resultadoAtual.saldoRemanescenteFazendario,
            modalidade.resultadoAtual.parcelasFazendariasMaximas ||
                obterLimiteEditalParcelasFazendariasRfb50Milhoes(
                    modalidade.resultadoAtual.rating,
                    modalidade.resultadoAtual.tipoContribuinte
                ),
            valorMinimoParcela
        );

    const parcelasSelecionadas =
        Math.min(
            Math.max(parseInt(parcelas, 10) || parcelasFazendariasMaximas, 1),
            Math.max(parcelasFazendariasMaximas, 1)
        );

    modalidade.resultadoAtual
        .parcelasFazendariasMaximas =
            parcelasFazendariasMaximas;

    modalidade.resultadoAtual
        .parcelasFazendariasSelecionadas =
            parcelasSelecionadas;

    modalidade.resultadoAtual
        .valorPrestacaoFazendaria =
            modalidade.resultadoAtual.saldoRemanescenteFazendario /
            parcelasSelecionadas;

    modalidade.resultadoAtual
        .descricaoFazendaria =
            gerarDescricaoFazendaria(
                modalidade.resultadoAtual.rating,
                modalidade.resultadoAtual.reducaoPercentual,
                modalidade.resultadoAtual.saldoDevedorAposReducao,
                modalidade.resultadoAtual.entradaFazendaria,
                modalidade.resultadoAtual
                    .valorPrestacaoEntradaFazendaria,
                modalidade.resultadoAtual
                    .numeroParcelasEntrada,
                parcelasSelecionadas,
                modalidade.resultadoAtual
                    .valorPrestacaoFazendaria
            );

    modalidade.resultadoAtual.numeroParcelasFazendarias =
        modalidade.resultadoAtual.numeroParcelasEntrada + parcelasSelecionadas;

    modalidade.resultadoAtual.numeroParcelas =
        modalidade.resultadoAtual.numeroParcelasFazendarias;

    sessionStorage.setItem(
        'modalidadeRfb50m',
        JSON.stringify(modalidade)
    );

    document.getElementById(
        'id-valor-prestacao-fazendaria'
    ).innerHTML =
        'R$ ' +
        converterNumeroEmMoeda(
            modalidade.resultadoAtual
                .valorPrestacaoFazendaria
        );

    document.getElementById(
        'id-descricao-fazendaria'
    ).innerHTML =
        modalidade.resultadoAtual
            .descricaoFazendaria;

    atualizarResumoParcelasDetalhamento(modalidade);
}

function atualizarResumoParcelasDetalhamento(modalidade) {
    const resultado = modalidade?.resultadoAtual;
    if (!resultado) {
        return;
    }

    const descontoValor = document.getElementById('id-detalhe-desconto-valor');
    if (descontoValor) {
        descontoValor.textContent = converterNumeroEmMoeda(
            (modalidade.dividaSemReducao || 0) -
            (resultado.saldoDevedorAposReducao || 0)
        );
    }

    const saldoFaz = document.getElementById('id-detalhe-saldo-faz');
    if (saldoFaz) {
        saldoFaz.textContent = converterNumeroEmMoeda(resultado.saldoRemanescenteFazendario || 0);
    }

    const saldoPrev = document.getElementById('id-detalhe-saldo-prev');
    if (saldoPrev) {
        saldoPrev.textContent = converterNumeroEmMoeda(resultado.saldoRemanescentePrevidenciario || 0);
    }

    const entradaFaz = document.getElementById('id-detalhe-entrada-faz');
    if (entradaFaz) {
        entradaFaz.textContent = converterNumeroEmMoeda(resultado.entradaFazendaria || 0);
    }

    const entradaPrev = document.getElementById('id-detalhe-entrada-prev');
    if (entradaPrev) {
        entradaPrev.textContent = converterNumeroEmMoeda(resultado.entradaPrevidenciaria || 0);
    }

    const totalParcelasFaz = document.getElementById('id-total-parcelas-faz');
    if (totalParcelasFaz) {
        totalParcelasFaz.textContent = `R$ ${converterNumeroEmMoeda(resultado.valorPrestacaoFazendaria || 0)}/parcela`;
    }

    const totalParcelasPrev = document.getElementById('id-total-parcelas-prev');
    if (totalParcelasPrev) {
        totalParcelasPrev.textContent = `R$ ${converterNumeroEmMoeda(resultado.valorPrestacaoPrevidenciaria || 0)}/parcela`;
    }

    const maxParcelasFaz = document.getElementById('id-max-parcelas-faz');
    if (maxParcelasFaz) {
        maxParcelasFaz.textContent = `${resultado.parcelasFazendariasMaximas || 1}x`;
    }

    const maxParcelasPrev = document.getElementById('id-max-parcelas-prev');
    if (maxParcelasPrev) {
        maxParcelasPrev.textContent = `${resultado.parcelasPrevidenciariasMaximas || 1}x`;
    }

    const cardParcelasFaz = document.getElementById('id-detalhe-parcelas-faz');
    if (cardParcelasFaz) {
        cardParcelasFaz.textContent = resultado.parcelasFazendariasSelecionadas + 'x';
    }

    const cardParcelasPrev = document.getElementById('id-detalhe-parcelas-prev');
    if (cardParcelasPrev) {
        cardParcelasPrev.textContent = resultado.parcelasPrevidenciariasSelecionadas + 'x';
    }

    const numeroParcelasFazInput = document.getElementById('id-input-numero-parcelas-faz');
    if (numeroParcelasFazInput) {
        numeroParcelasFazInput.max = String(resultado.parcelasFazendariasMaximas || 1);
        numeroParcelasFazInput.value = String(resultado.parcelasFazendariasSelecionadas || 1);
    }

    const numeroParcelasPrevInput = document.getElementById('id-input-numero-parcelas-prev');
    if (numeroParcelasPrevInput) {
        numeroParcelasPrevInput.max = String(resultado.parcelasPrevidenciariasMaximas || 1);
        numeroParcelasPrevInput.value = String(resultado.parcelasPrevidenciariasSelecionadas || 1);
    }

    const numeroParcelasEntradaFaz = document.getElementById('id-numero-parcelas-entrada-faz');
    if (numeroParcelasEntradaFaz) {
        numeroParcelasEntradaFaz.value = resultado.numeroParcelasEntrada;
        numeroParcelasEntradaFaz.max = String(resultado.numeroParcelasEntradaMaximas || 10);
    }

    const numeroParcelasEntradaPrev = document.getElementById('id-numero-parcelas-entrada-prev');
    if (numeroParcelasEntradaPrev) {
        numeroParcelasEntradaPrev.value = resultado.numeroParcelasEntrada;
        numeroParcelasEntradaPrev.max = String(resultado.numeroParcelasEntradaMaximas || 10);
    }

    const maxParcelasEntradaFaz = document.getElementById('id-max-parcelas-entrada-faz');
    if (maxParcelasEntradaFaz) {
        maxParcelasEntradaFaz.textContent = `${resultado.numeroParcelasEntradaMaximas || 10}x`;
    }

    const maxParcelasEntradaPrev = document.getElementById('id-max-parcelas-entrada-prev');
    if (maxParcelasEntradaPrev) {
        maxParcelasEntradaPrev.textContent = `${resultado.numeroParcelasEntradaMaximas || 10}x`;
    }

    const valorParcelaEntradaFaz = document.getElementById('id-valor-prestacao-entrada-faz');
    if (valorParcelaEntradaFaz) {
        valorParcelaEntradaFaz.textContent = converterNumeroEmMoeda(resultado.valorPrestacaoEntradaFazendaria || 0);
    }

    const valorParcelaEntradaPrev = document.getElementById('id-valor-prestacao-entrada-prev');
    if (valorParcelaEntradaPrev) {
        valorParcelaEntradaPrev.textContent = converterNumeroEmMoeda(resultado.valorPrestacaoEntradaPrevidenciaria || 0);
    }
}

function alterarParcelasEntradaRfb50Milhoes(tipoDebito, parcelas) {
    const modalidade = JSON.parse(sessionStorage.getItem('modalidadeRfb50m') || 'null');
    if (!modalidade || !modalidade.resultadoAtual) {
        return;
    }

    const valorMinimoParcela =
        modalidade.resultadoAtual.valorMinimoParcela ||
        obterValorMinimoParcelaPorPerfil();

    const limiteEditalParcelasEntrada =
        obterLimiteParcelasEntradaRfb50m(
            modalidade.resultadoAtual.rating,
            modalidade.resultadoAtual.tipoContribuinte
        );

    const numeroParcelasEntradaMaximas = Math.max(
        1,
        Math.min(
            limiteEditalParcelasEntrada,
            Math.floor((modalidade.resultadoAtual.entradaFazendaria || 0) / valorMinimoParcela),
            Math.floor((modalidade.resultadoAtual.entradaPrevidenciaria || 0) / valorMinimoParcela)
        )
    );

    const parcelasEntrada = Math.min(Math.max(parseInt(parcelas, 10) || 1, 1), numeroParcelasEntradaMaximas);
    modalidade.resultadoAtual.numeroParcelasEntrada = parcelasEntrada;
    modalidade.resultadoAtual.numeroParcelasEntradaMaximas = numeroParcelasEntradaMaximas;
    modalidade.resultadoAtual.parcelasEntradaMaximasReais = numeroParcelasEntradaMaximas;

    modalidade.resultadoAtual.valorPrestacaoEntradaFazendaria =
        (modalidade.resultadoAtual.entradaFazendaria || 0) / parcelasEntrada;
    modalidade.resultadoAtual.valorPrestacaoEntradaPrevidenciaria =
        (modalidade.resultadoAtual.entradaPrevidenciaria || 0) / parcelasEntrada;

    modalidade.resultadoAtual.numeroParcelasFazendarias =
        parcelasEntrada + (modalidade.resultadoAtual.parcelasFazendariasSelecionadas || 0);
    modalidade.resultadoAtual.numeroParcelasPrevidenciarias =
        parcelasEntrada + (modalidade.resultadoAtual.parcelasPrevidenciariasSelecionadas || 0);

    if (tipoDebito === 'FAZENDARIO') {
        modalidade.resultadoAtual.valorParcelaEntrada = modalidade.resultadoAtual.valorPrestacaoEntradaFazendaria;
        modalidade.resultadoAtual.numeroParcelas = modalidade.resultadoAtual.numeroParcelasFazendarias;
    } else {
        modalidade.resultadoAtual.valorParcelaEntrada = modalidade.resultadoAtual.valorPrestacaoEntradaPrevidenciaria;
        modalidade.resultadoAtual.numeroParcelas = modalidade.resultadoAtual.numeroParcelasPrevidenciarias;
    }

    modalidade.resultadoAtual.descricaoFazendaria = gerarDescricaoFazendaria(
        modalidade.resultadoAtual.rating,
        modalidade.resultadoAtual.reducaoPercentual,
        modalidade.resultadoAtual.saldoDevedorAposReducao,
        modalidade.resultadoAtual.entradaFazendaria,
        modalidade.resultadoAtual.valorPrestacaoEntradaFazendaria,
        parcelasEntrada,
        modalidade.resultadoAtual.parcelasFazendariasSelecionadas,
        modalidade.resultadoAtual.valorPrestacaoFazendaria
    );

    modalidade.resultadoAtual.descricaoPrevidenciaria = gerarDescricaoPrevidenciaria(
        modalidade.resultadoAtual.rating,
        modalidade.resultadoAtual.reducaoPercentual,
        modalidade.resultadoAtual.saldoDevedorAposReducao,
        modalidade.resultadoAtual.entradaPrevidenciaria,
        modalidade.resultadoAtual.valorPrestacaoEntradaPrevidenciaria,
        parcelasEntrada,
        modalidade.resultadoAtual.parcelasPrevidenciariasSelecionadas,
        modalidade.resultadoAtual.valorPrestacaoPrevidenciaria
    );

    sessionStorage.setItem('modalidadeRfb50m', JSON.stringify(modalidade));
    atualizarResumoParcelasDetalhamento(modalidade);

    const descricaoFaz = document.getElementById('id-descricao-fazendaria');
    if (descricaoFaz) {
        descricaoFaz.innerHTML = modalidade.resultadoAtual.descricaoFazendaria;
    }

    const descricaoPrev = document.getElementById('id-descricao-previdenciaria');
    if (descricaoPrev) {
        descricaoPrev.innerHTML = modalidade.resultadoAtual.descricaoPrevidenciaria;
    }
}

