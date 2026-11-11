/**
 * pgfn-pequeno-valor.js
 * Regras de negócio: Transação Tributária — Pequeno Valor (até 60 SM) — PGFN (Edital nº 06/2026)
 */

// Fallback de segurança: garante que o salário mínimo exista mesmo se o script da RFB não for carregado
const SALARIO_MINIMO_PGFN = typeof SALARIO_MINIMO_VIGENTE !== 'undefined' ? SALARIO_MINIMO_VIGENTE : 1621.00;

const LIMITE_PEQUENO_VALOR_PGFN = 60 * SALARIO_MINIMO_PGFN; // R$ 97.260,00

function obterValorMinimoParcelaPGFNPequenoValor(tipoContribuinte) {
    if (tipoContribuinte === 'MEI') {
        return 25.00; // R$25 — exclusivo do MEI, conforme o Edital nº 06/2026
    }
    return 100.00; // R$100 — Pessoa Natural, ME e EPP
}

const OPCOES_PGFN_PEQUENO_VALOR = [
    {
        codigoOpcao: "ART10-I",
        rotulo: "Art. 10.1 - Inscrições 1537 (Simples Nacional) até 5 SM, desconto de 50%, em até 60x",
        tipo: "COM_ENTRADA_ZERO",
        percentualDesconto: 50,
        parcelasMaximasSaldo: 60,
        limiteEspecifico: 5 * SALARIO_MINIMO_PGFN, // <-- USANDO A CONSTANTE SEGURA AQUI
        tiposElegiveisEspecifico: ['MEI'] // <-- Regra exclusiva para MEI
    },
    {
        codigoOpcao: "ART10-II-AVISTA",
        rotulo: "Art. 10.2 - Pagamento à vista, sem entrada, desconto de 50%",
        tipo: "AVISTA",
        percentualDesconto: 50
    },
    {
        codigoOpcao: "ART10-II-7M",
        rotulo: "Art. 10.2 - Entrada de 5% (até 5x) e o restante com redução de 50% em até 7 meses",
        tipo: "COM_ENTRADA",
        percentualDesconto: 50,
        parcelasMaximasSaldo: 7
    },
    {
        codigoOpcao: "ART10-II-12M",
        rotulo: "Art. 10.2 - Entrada de 5% (até 5x) e o restante com redução de 45% em até 12 meses",
        tipo: "COM_ENTRADA",
        percentualDesconto: 45,
        parcelasMaximasSaldo: 12
    },
    {
        codigoOpcao: "ART10-II-30M",
        rotulo: "Art. 10.2 - Entrada de 5% (até 5x) e o restante com redução de 40% em até 30 meses",
        tipo: "COM_ENTRADA",
        percentualDesconto: 40,
        parcelasMaximasSaldo: 30
    },
    {
        codigoOpcao: "ART10-II-55M",
        rotulo: "Art. 10.2 - Entrada de 5% (até 5x) e o restante com redução de 30% em até 55 meses",
        tipo: "COM_ENTRADA",
        percentualDesconto: 30,
        parcelasMaximasSaldo: 55
    }
];

function calcularDividaElegivelPGFNPequenoValor() {
    // A dívida elegível é sempre a soma dos débitos informados na tabela (+ 10% de inscrição
    // em Dívida Ativa) — NUNCA o campo "Valor total da dívida na PGFN e RFB", que serve só
    // para o cálculo do Rating (obterBaseCalculoPGFN, em utils.js). Reaproveita a mesma
    // constante ACRESCIMO_INSCRICAO_DIVIDA_ATIVA_PGFN já declarada globalmente em utils.js.

    // 1. Simulação Agregada (ou nenhum modo definido ainda)
    if (estadoGlobal.modoSimulacaoDivida !== 'POR_DEBITO') {
        const totalAgregado = estadoGlobal.debitosAgregados.total;
        if (totalAgregado === 0) {
            return { elegivel: false, motivo: 'Nenhum valor de débito foi informado.', dividaSemReducao: 0 };
        }

        const totalComAcrescimo = totalAgregado * (1 + ACRESCIMO_INSCRICAO_DIVIDA_ATIVA_PGFN);

        if (totalComAcrescimo > LIMITE_PEQUENO_VALOR_PGFN) {
            return { elegivel: false, motivo: `O valor total agregado, já acrescido de 10% (inscrição em Dívida Ativa), supera o limite de R$ ${LIMITE_PEQUENO_VALOR_PGFN.toFixed(2)} (60 salários-mínimos).`, dividaSemReducao: 0 };
        }
        return { elegivel: true, motivo: null, dividaSemReducao: totalComAcrescimo };
    }

    // 2. Simulação Por Débito
    const tiposElegiveis = ['PN', 'PN_OBITO', 'MEI', 'ME_EPP'];
    if (!tiposElegiveis.includes(estadoGlobal.perfil.tipoContribuinte)) {
        return { elegivel: false, motivo: 'Modalidade disponível apenas para Pessoa Natural, MEI, ME ou EPP.', dividaSemReducao: 0 };
    }

    // Aplica o acréscimo em cada débito individual ANTES de checar o limite
    const debitosComAcrescimo = estadoGlobal.debitos
        .filter(d => d.total > 0)
        .map(d => d.total * (1 + ACRESCIMO_INSCRICAO_DIVIDA_ATIVA_PGFN));

    const debitosElegiveis = debitosComAcrescimo.filter(valorComAcrescimo => valorComAcrescimo <= LIMITE_PEQUENO_VALOR_PGFN);

    if (debitosElegiveis.length === 0) {
        return { elegivel: false, motivo: `Nenhum débito individual dentro do limite de R$ ${LIMITE_PEQUENO_VALOR_PGFN.toFixed(2)} (considerando o acréscimo de 10% da inscrição em Dívida Ativa).`, dividaSemReducao: 0 };
    }

    // A soma já é feita com os valores acrescidos de 10%
    const dividaSemReducao = debitosElegiveis.reduce((acc, valor) => acc + valor, 0);
    return { elegivel: true, motivo: null, dividaSemReducao };
}


function calcularOpcaoPGFNPequenoValor(opcaoConfig, numeroParcelasSaldoEscolhido, numeroParcelasEntradaEscolhido) {
    const { elegivel, motivo, dividaSemReducao } = calcularDividaElegivelPGFNPequenoValor();

    if (!elegivel) {
        return { elegivel: false, motivo };
    }

    if (opcaoConfig.limiteEspecifico && dividaSemReducao > opcaoConfig.limiteEspecifico) {
        return { elegivel: false, motivo: `Esta opção específica exige dívida de até R$ ${opcaoConfig.limiteEspecifico.toFixed(2)} (5 salários-mínimos).` };
    }

    if (opcaoConfig.tiposElegiveisEspecifico && !opcaoConfig.tiposElegiveisEspecifico.includes(estadoGlobal.perfil.tipoContribuinte)) {
        return { elegivel: false, motivo: 'Esta opção específica (Art. 10, I) é exclusiva para Microempreendedor Individual (MEI).' };
    }

    const valorMinimoParcela = obterValorMinimoParcelaPGFNPequenoValor(estadoGlobal.perfil.tipoContribuinte);

    if (opcaoConfig.tipo === 'AVISTA') {
        const saldoDevedor = dividaSemReducao * (1 - opcaoConfig.percentualDesconto / 100);
        return {
            elegivel: true,
            dividaSemReducao,
            entrada: 0,
            numeroParcelasEntrada: 0,
            valorParcelaEntrada: 0,
            entradaDesabilitada: true,
            saldoDevedorAposReducao: saldoDevedor,
            numeroParcelas: 1,
            parcelasMaximasReais: 1,
            valorParcela: saldoDevedor,
            totalPago: saldoDevedor,
            reducaoPercentual: opcaoConfig.percentualDesconto,
            usoPfBcn: false,
            percentualMaximoPfBcn: 0
        };
    }

    if (opcaoConfig.tipo === 'COM_ENTRADA_ZERO') {
        const saldoDevedor = dividaSemReducao * (1 - opcaoConfig.percentualDesconto / 100);
        const parcelasPelaMinima = Math.max(1, Math.floor(saldoDevedor / valorMinimoParcela));
        const parcelasMaximasReais = Math.min(opcaoConfig.parcelasMaximasSaldo, parcelasPelaMinima);
        
        // Tratamento seguro para garantir que a parcela digitada seja aplicada corretamente
        let numeroParcelas = parcelasMaximasReais;
        if (numeroParcelasSaldoEscolhido !== undefined && numeroParcelasSaldoEscolhido !== null && !isNaN(numeroParcelasSaldoEscolhido)) {
            numeroParcelas = Math.min(Math.max(parseInt(numeroParcelasSaldoEscolhido, 10), 1), parcelasMaximasReais);
        }
        
        const valorParcela = saldoDevedor / numeroParcelas;

        return {
            elegivel: true,
            dividaSemReducao,
            entrada: 0,
            numeroParcelasEntrada: 0,
            valorParcelaEntrada: 0,
            entradaDesabilitada: true,
            saldoDevedorAposReducao: saldoDevedor,
            numeroParcelas,
            parcelasMaximasReais,
            valorParcela,
            totalPago: saldoDevedor,
            reducaoPercentual: opcaoConfig.percentualDesconto,
            usoPfBcn: false,
            percentualMaximoPfBcn: 0
        };
    }

    const entrada = dividaSemReducao * 0.05;
    const parcelasEntradaPelaMinima = Math.max(1, Math.floor(entrada / valorMinimoParcela));
    const parcelasEntradaMaximasReais = Math.min(5, parcelasEntradaPelaMinima);
    const numeroParcelasEntrada = Math.min(Math.max(numeroParcelasEntradaEscolhido || parcelasEntradaMaximasReais, 1), parcelasEntradaMaximasReais);
    const valorParcelaEntrada = entrada / numeroParcelasEntrada;

    const saldoAposEntrada = dividaSemReducao - entrada;
    const saldoDevedor = saldoAposEntrada * (1 - opcaoConfig.percentualDesconto / 100);

    const parcelasPelaMinima = Math.max(1, Math.floor(saldoDevedor / valorMinimoParcela));
    const parcelasMaximasReais = Math.min(opcaoConfig.parcelasMaximasSaldo, parcelasPelaMinima);
    
    // Tratamento seguro para garantir que a parcela digitada seja aplicada corretamente
    let numeroParcelas = parcelasMaximasReais;
    if (numeroParcelasSaldoEscolhido !== undefined && numeroParcelasSaldoEscolhido !== null && !isNaN(numeroParcelasSaldoEscolhido)) {
        numeroParcelas = Math.min(Math.max(parseInt(numeroParcelasSaldoEscolhido, 10), 1), parcelasMaximasReais);
    }
    
    const valorParcela = saldoDevedor / numeroParcelas;

    const totalPago = entrada + saldoDevedor;
    const reducaoPercentualExibicao = dividaSemReducao > 0 ? ((dividaSemReducao - totalPago) / dividaSemReducao) * 100 : 0;

    return {
        elegivel: true,
        dividaSemReducao,
        entrada,
        numeroParcelasEntrada,
        parcelasEntradaMaximasReais,
        valorParcelaEntrada,
        entradaDesabilitada: false,
        saldoDevedorAposReducao: saldoDevedor,
        numeroParcelas,
        parcelasMaximasReais,
        valorParcela,
        totalPago,
        reducaoPercentual: reducaoPercentualExibicao,
        usoPfBcn: false,
        percentualMaximoPfBcn: 0
    };
}

function montarDefinicaoModalidadePGFNPequenoValor() {
    const { elegivel, motivo, dividaSemReducao } = calcularDividaElegivelPGFNPequenoValor();

    return {
        chaveModalidade: "PGFN_PEQUENO_VALOR",
        nomeExibicao: "PGFN – Edital 06/2026 - Até 60 salários-mínimos",
        orgao: "PGFN",
        elegivel,
        motivoInelegibilidade: motivo,
        dividaSemReducao,
        urlDetalhamento: "./assets/detalhes/pgfn-pequeno-valor/pgfn-pequeno-valor.html",
        urlAdesao: null,
        prazoAdesao: "29/01/2027",
        vantagens: ["Menor saldo devedor"], 
        permiteEditarParcelas: true,
        permiteEditarParcelasEntrada: true,
        opcoes: OPCOES_PGFN_PEQUENO_VALOR.map(opcaoConfig => ({
            codigoOpcao: opcaoConfig.codigoOpcao,
            rotulo: opcaoConfig.rotulo,
            calcular: (contexto, numeroParcelasSaldo, numeroParcelasEntrada) =>
                calcularOpcaoPGFNPequenoValor(opcaoConfig, numeroParcelasSaldo, numeroParcelasEntrada)
        }))
    };
}