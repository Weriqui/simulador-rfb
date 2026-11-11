/**
 * controversia-juridica.js
 * Regras de negócio: Transação Tributária — Controvérsia Jurídica — RFB
 */

const VALOR_MINIMO_PARCELA_CONTROVERSIA_JURIDICA = 500;

const OPCOES_CONTROVERSIA_JURIDICA = [
    {
        codigoOpcao: '3.1-I',
        rotulo: 'Opção I - Redução 65% - Entrada 30% - Parcelas até 12 - PF/BCN até 30%',
        parcelasMaximas: 12,
        percentualReducao: 65,
        percentualEntrada: 30
    },
    {
        codigoOpcao: '3.1-II',
        rotulo: 'Opção II - Redução 55% - Entrada 25% - Parcelas até 24 - PF/BCN até 30%',
        parcelasMaximas: 24,
        percentualReducao: 55,
        percentualEntrada: 25
    },
    {
        codigoOpcao: '3.1-III',
        rotulo: 'Opção III - Redução 45% - Entrada 20% - Parcelas até 36 - PF/BCN até 30%',
        parcelasMaximas: 36,
        percentualReducao: 45,
        percentualEntrada: 20
    },
    {
        codigoOpcao: '3.1-IV',
        rotulo: 'Opção IV - Redução 35% - Entrada 15% - Parcelas até 48 - PF/BCN até 30%',
        parcelasMaximas: 48,
        percentualReducao: 35,
        percentualEntrada: 15
    },
    {
        codigoOpcao: '3.1-V',
        rotulo: 'Opção V - Redução 25% - Entrada 10% - Parcelas até 60 - PF/BCN até 30%',
        parcelasMaximas: 60,
        percentualReducao: 25,
        percentualEntrada: 10
    }
];

function calcularDividaElegivelControversiaJuridica() {
    const tiposElegiveis = [
        'MEI',
        'ME_EPP',
        'DEMAIS_PJ'
    ];

    if (!tiposElegiveis.includes(estadoGlobal?.perfil?.tipoContribuinte)) {
        return {
            elegivel: false,
            motivo: 'Modalidade disponível para MEI e Pessoa Jurídica, apenas para débitos abrangidos pelo Edital 59/2025.',
            dividaSemReducao: 0
        };
    }

    // Dívida efetivamente parcelada = soma dos débitos informados na tabela.
    const dividaSemReducao = Number(estadoGlobal?.totalDebitos || 0);

    if (dividaSemReducao <= 0) {
        return {
            elegivel: false,
            motivo: 'Nenhum valor de débito foi informado.',
            dividaSemReducao: 0
        };
    }

    return {
        elegivel: true,
        motivo: null,
        dividaSemReducao
    };
}

function calcularOpcaoControversiaJuridica(
    opcaoConfig,
    numeroParcelasEscolhidoPeloUsuario,
    valorPfBcnPersonalizado
) {
    const avaliacaoElegibilidade = calcularDividaElegivelControversiaJuridica();

    if (!avaliacaoElegibilidade.elegivel) {
        return {
            elegivel: false,
            motivo: avaliacaoElegibilidade.motivo,
            dividaSemReducao: 0
        };
    }

    const dividaSemReducao = avaliacaoElegibilidade.dividaSemReducao;
    const reducaoPercentual = Number(opcaoConfig.percentualReducao || 0);
    const percentualEntrada = Number(opcaoConfig.percentualEntrada || 0);
    const percentualMaximoPfBcn = 30;

    const saldoComReducao = dividaSemReducao * (1 - reducaoPercentual / 100);
    const limiteMaximoPfBcn = saldoComReducao * (percentualMaximoPfBcn / 100);
    const valorPfBcnNormalizado = Number(valorPfBcnPersonalizado);
    const valorPfBcn = Number.isFinite(valorPfBcnNormalizado)
        ? Math.min(Math.max(valorPfBcnNormalizado, 0), limiteMaximoPfBcn)
        : limiteMaximoPfBcn;
    const saldoAposPfBcn = saldoComReducao - valorPfBcn;
    const entrada = saldoAposPfBcn * (percentualEntrada / 100);
    const saldoAposEntrada = saldoAposPfBcn - entrada;

    const parcelasMaximasPermitidas = Math.max(1, Number(opcaoConfig.parcelasMaximas || 1));
    const valorMinimoParcela = VALOR_MINIMO_PARCELA_CONTROVERSIA_JURIDICA;

    const parcelasPelaParcelaMinima = Math.max(
        1,
        Math.floor(saldoAposEntrada / valorMinimoParcela)
    );

    const parcelasMaximasReais = Math.min(
        parcelasMaximasPermitidas,
        parcelasPelaParcelaMinima
    );

    const numeroParcelasSolicitado = Number(numeroParcelasEscolhidoPeloUsuario);
    const numeroParcelasNormalizado = Number.isFinite(numeroParcelasSolicitado)
        ? Math.floor(numeroParcelasSolicitado)
        : null;

    const numeroParcelas = numeroParcelasNormalizado
        ? Math.min(Math.max(numeroParcelasNormalizado, 1), parcelasMaximasReais)
        : parcelasMaximasReais;

    const valorPrestacao = saldoAposEntrada / numeroParcelas;

    return {
        elegivel: true,
        dividaSemReducao,
        reducaoPercentual,
        saldoComReducao,
        saldoDevedorAposReducao: saldoComReducao,
        valorPfBcn,
        percentualMaximoPfBcn,
        limiteMaximoPfBcn,
        saldoAposPfBcn,
        entrada,
        numeroParcelasEntrada: 1,
        saldoAposEntrada,
        saldoDevedorAposEntrada: saldoAposEntrada,
        numeroParcelas,
        valorPrestacao,
        valorParcela: valorPrestacao,
        usoPfBcn: true,
        parcelasMaximasReais,
        valorMinimoParcela,
        valorPfBcnPersonalizadoAplicado: valorPfBcn
    };
}

function montarDefinicaoModalidadeControversiaJuridica() {
    const avaliacaoElegibilidade = calcularDividaElegivelControversiaJuridica();

    return {
        chaveModalidade:
            'RFB_CONTROVERSIA_JURIDICA',
        nomeExibicao:
            'RFB - Transação Tributária - Relevante e Disseminada Controvérsia Jurídica - Edital 59/2025',
        orgao: 'RFB',
        elegivel: avaliacaoElegibilidade.elegivel,
        motivoInelegibilidade: avaliacaoElegibilidade.motivo,
        dividaSemReducao: avaliacaoElegibilidade.dividaSemReducao,
        urlDetalhamento:
            './assets/detalhes/controversiaJuridica/controversia-juridica.html',
        urlAdesao: null,
        prazoAdesao:
            '29/12/2025',
        vantagens: [
            'PF/BCN permitido até 30%'
        ],
        permiteEditarParcelas: true,
        parcelasRecalculoEmTempoReal: true,
        opcaoSelecionadaIndex: 0,
        valorPfBcnPersonalizado: null,
        opcoes: OPCOES_CONTROVERSIA_JURIDICA.map(opcaoConfig => ({
            codigoOpcao: opcaoConfig.codigoOpcao,
            rotulo: opcaoConfig.rotulo,
            calcular: (
                contexto,
                numeroParcelasEscolhido,
                numeroParcelasEntradaPersonalizado,
                naturezaSelecionada,
                valorPfBcnPersonalizado
            ) => calcularOpcaoControversiaJuridica(
                opcaoConfig,
                numeroParcelasEscolhido,
                valorPfBcnPersonalizado
            )
        }))
    };
}

function carregarModalidadeControversiaJuridica() {
    registrarModalidade(montarDefinicaoModalidadeControversiaJuridica());
}
