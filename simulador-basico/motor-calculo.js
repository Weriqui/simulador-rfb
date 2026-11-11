/**
 * motor-calculo.js
 * ---------------------------------------------------------------------------
 * Motor de cálculo PURO (sem DOM) que replica as fórmulas do
 * "Simulador de Negociações" da RFB/PGFN:
 *   https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/
 *
 * Fonte: arquivos js/core/*.js e js/modalidades/*.js do próprio site (versão 1.0.0,
 * editais RFB nº 9/2026 e nº 10/2026 e PGFN/PGDAU nº 06/2026).
 *
 * Todas as expressões aritméticas foram mantidas NA MESMA ORDEM do código original
 * para que os resultados sejam bit-a-bit iguais (inclusive empates de "vantagens").
 *
 * Funciona no navegador (window.MotorSimulador) e no Node (require).
 *
 *   const { simular } = require('./motor-calculo.js');
 *   const r = simular({
 *     tipoContribuinte: 'DEMAIS_PJ',
 *     modo: 'AGREGADO',
 *     agregado: { principal: 3000000, multa: 1500000, juros: 200000 },
 *     capag: 4000000,
 *     dividaTotalPgfnRfb: 4700000
 *   });
 */
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    } else {
        root.MotorSimulador = api;
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    // =========================================================================
    // CONSTANTES (iguais às do site)
    // =========================================================================
    const SALARIO_MINIMO_VIGENTE = 1621.00;                         // rfb-pequeno-valor.js
    const LIMITE_PEQUENO_VALOR = 60 * SALARIO_MINIMO_VIGENTE;       // R$ 97.260,00
    const PARCELA_MINIMA_RFB_PEQUENO_VALOR = 200.00;                // Edital RFB 10/2026, item 6.3
    const ACRESCIMO_INSCRICAO_DIVIDA_ATIVA = 0.10;                  // Encargo legal 10% (PGFN)
    const LIMITE_CAPACIDADE_PAGAMENTO_PGFN = 45000000;              // R$ 45 milhões
    const LIMITE_RFB_50_MILHOES = 50000000;                         // R$ 50 milhões

    const TIPOS_CONTRIBUINTE = {
        PN: 'Pessoa Natural',
        PN_OBITO: 'Pessoa Natural com indicativo de óbito',
        MEI: 'Microempreendedor Individual (MEI)',
        ME_EPP: 'Microempresa (ME) ou Empresa de Pequeno Porte (EPP)',
        DEMAIS_PJ: 'Demais Pessoas Jurídicas'
    };

    const OPCOES_PEQUENO_VALOR_RFB = [
        { codigoOpcao: '6.1-I', rotulo: 'Art. 6.1 - I - em até 12 prestações mensais, com redução de 50%', parcelasMaximas: 12, percentualReducao: 50 },
        { codigoOpcao: '6.1-II', rotulo: 'Art. 6.1 - II - em até 24 prestações mensais, com redução de 40%', parcelasMaximas: 24, percentualReducao: 40 },
        { codigoOpcao: '6.1-III', rotulo: 'Art. 6.1 - III - em até 36 prestações mensais, com redução de 35%', parcelasMaximas: 36, percentualReducao: 35 },
        { codigoOpcao: '6.1-IV', rotulo: 'Art. 6.1 - IV - em até 55 prestações mensais, com redução de 30%', parcelasMaximas: 55, percentualReducao: 30 }
    ];

    const OPCOES_PGFN_PEQUENO_VALOR = [
        { codigoOpcao: 'ART10-I', rotulo: 'Art. 10.1 - Inscrições 1537 (Simples Nacional) até 5 SM, desconto de 50%, em até 60x', tipo: 'COM_ENTRADA_ZERO', percentualDesconto: 50, parcelasMaximasSaldo: 60, limiteEspecifico: 5 * SALARIO_MINIMO_VIGENTE, tiposElegiveisEspecifico: ['MEI'] },
        { codigoOpcao: 'ART10-II-AVISTA', rotulo: 'Art. 10.2 - Pagamento à vista, sem entrada, desconto de 50%', tipo: 'AVISTA', percentualDesconto: 50 },
        { codigoOpcao: 'ART10-II-7M', rotulo: 'Art. 10.2 - Entrada de 5% (até 5x) e o restante com redução de 50% em até 7 meses', tipo: 'COM_ENTRADA', percentualDesconto: 50, parcelasMaximasSaldo: 7 },
        { codigoOpcao: 'ART10-II-12M', rotulo: 'Art. 10.2 - Entrada de 5% (até 5x) e o restante com redução de 45% em até 12 meses', tipo: 'COM_ENTRADA', percentualDesconto: 45, parcelasMaximasSaldo: 12 },
        { codigoOpcao: 'ART10-II-30M', rotulo: 'Art. 10.2 - Entrada de 5% (até 5x) e o restante com redução de 40% em até 30 meses', tipo: 'COM_ENTRADA', percentualDesconto: 40, parcelasMaximasSaldo: 30 },
        { codigoOpcao: 'ART10-II-55M', rotulo: 'Art. 10.2 - Entrada de 5% (até 5x) e o restante com redução de 30% em até 55 meses', tipo: 'COM_ENTRADA', percentualDesconto: 30, parcelasMaximasSaldo: 55 }
    ];

    const OPCOES_CAPACIDADE_PAGAMENTO_PGFN = [
        { codigoOpcao: 'COM_ENTRADA', rotulo: 'Com entrada' },
        { codigoOpcao: 'AVISTA', rotulo: 'Pagamento à vista' }
    ];

    const OPCOES_RFB_50M = [
        { codigoOpcao: 'FAZENDARIO', rotulo: 'Debitos Fazendarios' },
        { codigoOpcao: 'PREVIDENCIARIO', rotulo: 'Debitos Previdenciarios' }
    ];

    // =========================================================================
    // UTILITÁRIOS
    // =========================================================================

    /** Formata número como o site (converterNumeroEmMoeda): 1.234.567,89 */
    function formatarMoeda(valor) {
        return Number(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    /** Percentual da coluna "Redução" (até 2 casas, sem zeros à direita). */
    function formatarPercentual(valor) {
        return Number(valor || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + '%';
    }

    /**
     * Normaliza um valor monetário exatamente como os campos mascarados do site
     * (validarValorNaoNegativo): o valor vira "centavos inteiros / 100".
     * Aceita número ou texto ("3000000", "3000000.50", "3.000.000,50", "R$ 1.234,56").
     */
    function normalizarValor(valor) {
        if (valor === null || valor === undefined || valor === '') return 0;
        let numero;
        if (typeof valor === 'number') {
            numero = valor;
        } else {
            let texto = String(valor).trim().replace(/^R\$\s*/i, '').replace(/\s/g, '');
            if (texto.includes(',')) {
                texto = texto.replace(/\./g, '').replace(',', '.');
            } else if ((texto.match(/\./g) || []).length > 1 || /^\d{1,3}(\.\d{3})+$/.test(texto)) {
                // "3.000.000" e "30.000" = separador de milhar (padrão brasileiro)
                texto = texto.replace(/\./g, '');
            }
            numero = parseFloat(texto);
        }
        if (!Number.isFinite(numero)) return 0;
        // O site não aceita negativos (o sinal é descartado pela máscara).
        const centavos = Math.round(Math.abs(numero) * 100);
        return centavos / 100;
    }

    /** Arredonda para centavos do mesmo jeito que o roundtrip moeda->texto->número do site. */
    function arredondarCentavos(valor) {
        return Math.round(valor * 100) / 100;
    }

    /** Inteiro opcional (parcelas). null/''/inválido => null (= "máximo permitido"). */
    function normalizarInteiro(valor) {
        if (valor === null || valor === undefined || valor === '') return null;
        const n = parseInt(valor, 10);
        return Number.isNaN(n) ? null : n;
    }

    function inelegivel(motivo) {
        return { elegivel: false, motivo };
    }

    // =========================================================================
    // CONTEXTO (equivale ao estadoGlobal do site)
    // =========================================================================
    function criarContexto(entrada) {
        entrada = entrada || {};
        const tipoContribuinte = entrada.tipoContribuinte || entrada.tipo || null;
        if (!TIPOS_CONTRIBUINTE[tipoContribuinte]) {
            throw new Error('tipoContribuinte inválido. Use: ' + Object.keys(TIPOS_CONTRIBUINTE).join(', '));
        }

        // A "Situação Cadastral" só existe para MEI, ME/EPP e Demais PJ (o site desmarca para PN).
        const permiteSituacao = ['MEI', 'ME_EPP', 'DEMAIS_PJ'].includes(tipoContribuinte);
        const situacao = entrada.situacao || {};
        const falidoRecuperacao = permiteSituacao && !!(situacao.falidoRecuperacao ?? entrada.falido);
        const baixadoInapto = permiteSituacao && !!(situacao.baixadoInapto ?? entrada.baixado);

        const perfil = {
            tipoContribuinte,
            situacaoCadastral: { falidoRecuperacao, baixadoInapto },
            // estado_global.js > atualizarPerfilContribuinte(), passo 5
            ratingForcadoD: tipoContribuinte === 'PN_OBITO' || falidoRecuperacao || baixadoInapto
        };

        const modo = (entrada.modo || entrada.modoSimulacaoDivida || 'AGREGADO').toUpperCase();
        if (modo !== 'AGREGADO' && modo !== 'POR_DEBITO') {
            throw new Error('modo inválido. Use AGREGADO ou POR_DEBITO.');
        }

        // composicao-divida.js — total = principal + multa + juros (nessa ordem)
        const agregadoIn = entrada.agregado || {};
        const debitosAgregados = { principal: 0, multa: 0, juros: 0, total: 0 };
        let debitos = [];
        if (modo === 'AGREGADO') {
            debitosAgregados.principal = normalizarValor(agregadoIn.principal);
            debitosAgregados.multa = normalizarValor(agregadoIn.multa);
            debitosAgregados.juros = normalizarValor(agregadoIn.juros);
            debitosAgregados.total = debitosAgregados.principal + debitosAgregados.multa + debitosAgregados.juros;
        } else {
            debitos = (entrada.debitos || []).map((d, i) => {
                const principal = normalizarValor(d.principal);
                const multa = normalizarValor(d.multa);
                const juros = normalizarValor(d.juros);
                return { id: 'deb-' + (i + 1), principal, multa, juros, total: principal + multa + juros };
            });
        }

        const totalDebitos = modo === 'AGREGADO'
            ? debitosAgregados.total
            : debitos.reduce((acc, d) => acc + d.total, 0);

        const capag = normalizarValor(entrada.capag ?? entrada.capacidadePagamento);
        const dividaTotalPgfnRfb = normalizarValor(entrada.dividaTotalPgfnRfb ?? entrada.divida);

        const ctx = {
            perfil,
            modoSimulacaoDivida: modo,
            debitosAgregados,
            debitos,
            totalDebitos,
            capagInformada: capag,
            dividaTotalPgfnRfb,
            // Campo "Total de débitos que deseja Transacionar" (readonly). No site ele só é gravado ao
            // clicar em "Confirmar total de débitos"; se o usuário editar débitos depois e clicar direto
            // em "Simular Modalidades", o rating RFB usa o total ANTIGO. Para reproduzir esse caso,
            // informe entrada.totalDebitosTransacionar (padrão: total atual, = reconfirmar).
            totalDebitosTransacionar: (entrada.totalDebitosTransacionar !== undefined && entrada.totalDebitosTransacionar !== null && entrada.totalDebitosTransacionar !== '')
                ? normalizarValor(entrada.totalDebitosTransacionar)
                : arredondarCentavos(totalDebitos)
        };

        ctx.classificacao = {
            pgfn: obterClassificacaoPorBase(ctx, obterBaseCalculoPGFN(ctx)),
            rfb: obterClassificacaoPorBase(ctx, obterBaseCalculoRFB(ctx))
        };
        return ctx;
    }

    // =========================================================================
    // RATING / DESCONTO TEÓRICO (utils.js)
    // =========================================================================

    // PGFN: base = "Valor total da dívida na PGFN e RFB" (sem o acréscimo de 10%)
    function obterBaseCalculoPGFN(ctx) {
        const valorInformado = ctx.dividaTotalPgfnRfb;
        if (valorInformado > 0) return valorInformado;
        return 0; // na página principal estadoGlobal.modalidadeCompleta não existe
    }

    // RFB: base = "Valor total da dívida na PGFN e RFB" + "Total de débitos que deseja Transacionar"
    function obterBaseCalculoRFB(ctx) {
        const valorPGFN = ctx.dividaTotalPgfnRfb;
        const valorTransacao = ctx.totalDebitosTransacionar;
        if (valorPGFN > 0 || valorTransacao > 0) return valorPGFN + valorTransacao;
        return Number(ctx.totalDebitos || 0);
    }

    function obterClassificacaoPorBase(ctx, dividaBase) {
        const capacidadePagamento = ctx.capagInformada;
        const relacao = capacidadePagamento > 0 ? dividaBase / capacidadePagamento : 0;

        let rating;
        if (ctx.perfil.ratingForcadoD) rating = 'D';
        else if (relacao <= 0.5) rating = 'A';
        else if (relacao <= 1) rating = 'B';
        else if (relacao <= 2) rating = 'C';
        else rating = 'D';

        const descontoMaximo = ctx.perfil.tipoContribuinte === 'DEMAIS_PJ' &&
            !ctx.perfil.situacaoCadastral.falidoRecuperacao
            ? 0.65
            : 0.70;

        const descontoTeorico = rating === 'A' || rating === 'B'
            ? 0
            : rating === 'D'
                ? descontoMaximo
                : descontoMaximo * (relacao - 1);

        return { dividaBase, relacao, rating, descontoMaximo, descontoTeorico };
    }

    // =========================================================================
    // MODALIDADE 1 — RFB Edital 10/2026 — Pequeno valor (até 60 SM)
    // =========================================================================
    function calcularDividaElegivelPequenoValorRFB(ctx) {
        const tiposElegiveis = ['PN', 'PN_OBITO', 'MEI', 'ME_EPP'];
        if (!tiposElegiveis.includes(ctx.perfil.tipoContribuinte)) {
            return { elegivel: false, motivo: 'Modalidade disponível apenas para Pessoa Natural, MEI, ME ou EPP.', dividaSemReducao: 0 };
        }

        let dividaSemReducao = 0;
        if (ctx.modoSimulacaoDivida === 'POR_DEBITO') {
            const debitosElegiveis = ctx.debitos.filter(d => d.total > 0 && d.total <= LIMITE_PEQUENO_VALOR);
            if (debitosElegiveis.length === 0) {
                return { elegivel: false, motivo: `Nenhum débito individual dentro do limite de R$ ${LIMITE_PEQUENO_VALOR.toFixed(2)} (60 salários-mínimos por processo).`, dividaSemReducao: 0 };
            }
            dividaSemReducao = debitosElegiveis.reduce((acc, d) => acc + d.total, 0);
        } else if (ctx.modoSimulacaoDivida === 'AGREGADO') {
            const totalAgregado = ctx.debitosAgregados.total;
            if (totalAgregado === 0) {
                return { elegivel: false, motivo: 'Nenhum valor de débito foi informado.', dividaSemReducao: 0 };
            }
            if (totalAgregado > LIMITE_PEQUENO_VALOR) {
                return { elegivel: false, motivo: `O valor total agregado supera o limite de R$ ${LIMITE_PEQUENO_VALOR.toFixed(2)} (60 salários-mínimos por processo).`, dividaSemReducao: 0 };
            }
            dividaSemReducao = totalAgregado;
        }
        return { elegivel: true, motivo: null, dividaSemReducao };
    }

    function calcularOpcaoPequenoValorRFB(ctx, opcaoConfig, numeroParcelasEscolhido) {
        const { elegivel, motivo, dividaSemReducao } = calcularDividaElegivelPequenoValorRFB(ctx);
        if (!elegivel) return inelegivel(motivo);

        const saldoDevedor = dividaSemReducao * (1 - opcaoConfig.percentualReducao / 100);
        const parcelasPelaParcelaMinima = Math.max(1, Math.floor(saldoDevedor / PARCELA_MINIMA_RFB_PEQUENO_VALOR));
        const parcelasMaximasReais = Math.min(opcaoConfig.parcelasMaximas, parcelasPelaParcelaMinima);
        const numeroParcelas = Math.min(numeroParcelasEscolhido || parcelasMaximasReais, parcelasMaximasReais);
        const valorParcela = saldoDevedor / numeroParcelas;
        const reducaoPercentual = dividaSemReducao > 0 ? ((dividaSemReducao - saldoDevedor) / dividaSemReducao) * 100 : 0;

        return {
            elegivel: true,
            dividaSemReducao,
            reducaoPercentual,
            saldoDevedorAposReducao: saldoDevedor,
            entrada: 0,
            numeroParcelasEntrada: 0,
            numeroParcelas,
            parcelasMaximasReais,
            valorParcela,
            usoPfBcn: false,
            percentualMaximoPfBcn: 0
        };
    }

    function montarDefinicaoPequenoValorRFB(ctx) {
        const base = calcularDividaElegivelPequenoValorRFB(ctx);
        return {
            chaveModalidade: 'RFB_PEQUENO_VALOR',
            nomeExibicao: 'RFB – Edital nº 10/2026 – Até 60 salários-mínimos',
            orgao: 'RFB',
            elegivel: base.elegivel,
            motivoInelegibilidade: base.motivo,
            dividaSemReducao: base.dividaSemReducao,
            prazoAdesao: '30/12/2026',
            permiteEditarParcelas: true,
            permiteEditarParcelasEntrada: false,
            opcoes: OPCOES_PEQUENO_VALOR_RFB.map(cfg => ({
                codigoOpcao: cfg.codigoOpcao,
                rotulo: cfg.rotulo,
                calcular: (c, nParcelas) => calcularOpcaoPequenoValorRFB(ctx, cfg, nParcelas)
            }))
        };
    }

    // =========================================================================
    // MODALIDADE 2 — RFB Edital 9/2026 — Até 50 milhões por processo
    // =========================================================================
    function obterPercentualEntradaFazendariaRfb50m(rating, valorPfBcn) {
        return rating === 'A' || rating === 'B' || (Number(valorPfBcn) || 0) > 0 ? 0.10 : 0.05;
    }

    function somarMultaEJuros(debitos) {
        return debitos.reduce((acc, d) => acc + (d.multa || 0) + (d.juros || 0), 0);
    }

    function obterDescontoMaximoPermitidoRfb50Milhoes(ctx) {
        if (ctx.modoSimulacaoDivida === 'POR_DEBITO') {
            return somarMultaEJuros(ctx.debitos.filter(d => d.total > 0 && d.total <= LIMITE_RFB_50_MILHOES));
        }
        return (ctx.debitosAgregados.multa || 0) + (ctx.debitosAgregados.juros || 0);
    }

    function calcularDividaElegivelRfb50Milhoes(ctx) {
        const dividaSemReducao = ctx.totalDebitos || 0;
        let descontoMaximoPermitido = obterDescontoMaximoPermitidoRfb50Milhoes(ctx);

        if (dividaSemReducao <= 0) {
            return { elegivel: false, motivo: 'Nenhum valor de debito foi informado.', dividaSemReducao: 0, descontoMaximoPermitido: 0 };
        }
        if (dividaSemReducao > LIMITE_RFB_50_MILHOES) {
            return { elegivel: false, motivo: `O valor total informado supera o limite de R$ ${LIMITE_RFB_50_MILHOES.toFixed(2)} por processo.`, dividaSemReducao: 0, descontoMaximoPermitido: 0 };
        }
        if (ctx.modoSimulacaoDivida === 'POR_DEBITO') {
            const debitosElegiveis = ctx.debitos.filter(d => d.total > 0 && d.total <= LIMITE_RFB_50_MILHOES);
            if (debitosElegiveis.length === 0) {
                return { elegivel: false, motivo: `Nenhum debito individual dentro do limite de R$ ${LIMITE_RFB_50_MILHOES.toFixed(2)} (50 Milhões) por processo.`, dividaSemReducao: 0, descontoMaximoPermitido: 0 };
            }
            descontoMaximoPermitido = somarMultaEJuros(debitosElegiveis);
        } else if (ctx.modoSimulacaoDivida === 'AGREGADO') {
            const totalAgregado = ctx.debitosAgregados.total;
            if (totalAgregado <= 0) {
                return { elegivel: false, motivo: 'Nenhum valor de debito foi informado.', dividaSemReducao: 0, descontoMaximoPermitido: 0 };
            }
            if (totalAgregado > LIMITE_RFB_50_MILHOES) {
                return { elegivel: false, motivo: `O valor total agregado supera o limite de R$ ${LIMITE_RFB_50_MILHOES.toFixed(2)} por processo.`, dividaSemReducao: 0, descontoMaximoPermitido: 0 };
            }
        }
        return { elegivel: true, motivo: null, dividaSemReducao, descontoMaximoPermitido };
    }

    function isPerfilEspecial(tipo) {
        return tipo === 'PN' || tipo === 'PN_OBITO' || tipo === 'MEI' || tipo === 'ME_EPP';
    }

    function obterValorMinimoParcelaRfb50m(tipo) {
        return (tipo === 'PN' || tipo === 'PN_OBITO') ? 200 : 300;
    }

    function obterLimiteEditalParcelasFazendariasRfb50Milhoes(rating, tipo) {
        if (isPerfilEspecial(tipo)) return (rating === 'A' || rating === 'B') ? 74 : 135;
        return (rating === 'A' || rating === 'B') ? 74 : 115;
    }

    function obterLimiteParcelasEntradaRfb50m(rating, tipo) {
        return (!isPerfilEspecial(tipo) && (rating === 'C' || rating === 'D')) ? 5 : 10;
    }

    function calcularParcelasMaximasPorValorMinimo(saldo, parcelasMaximasPermitidas, valorMinimoParcela) {
        const maximoPorValorMinimo = Math.floor((saldo || 0) / valorMinimoParcela);
        return Math.min(parcelasMaximasPermitidas, Math.max(1, maximoPorValorMinimo));
    }

    function calcularResultadoRfb50Milhoes(ctx, tipoDebitoSelecionado, pParcelasPersonalizadas, pEntradaPersonalizada) {
        const av = calcularDividaElegivelRfb50Milhoes(ctx);
        if (!av.elegivel) return inelegivel(av.motivo);

        const tipo = ctx.perfil.tipoContribuinte;
        const dividaSemReducao = av.dividaSemReducao;
        const descontoMaximoPermitido = av.descontoMaximoPermitido || 0;
        const { rating, descontoTeorico } = ctx.classificacao.rfb;
        const desconto = descontoTeorico * 100;
        const descontoCalculado = dividaSemReducao * (desconto / 100);
        const descontoAplicado = Math.min(descontoCalculado, descontoMaximoPermitido);
        const saldoDevedor = dividaSemReducao - descontoAplicado;

        const contribuinteElegivelPfBcn = !(tipo === 'PN' || tipo === 'PN_OBITO') && (rating === 'C' || rating === 'D');
        const valorMinimoParcela = obterValorMinimoParcelaRfb50m(tipo);

        const entradaFazendaria = dividaSemReducao * obterPercentualEntradaFazendariaRfb50m(rating, 0);
        const entradaPrevidenciaria = dividaSemReducao * 0.05;

        const limiteEditalParcelasEntrada = obterLimiteParcelasEntradaRfb50m(rating, tipo);
        const numeroParcelasEntradaMaximas = Math.max(1, Math.min(
            limiteEditalParcelasEntrada,
            Math.floor(entradaFazendaria / valorMinimoParcela),
            Math.floor(entradaPrevidenciaria / valorMinimoParcela)
        ));
        const numeroParcelasEntradaSelecionadas = Math.min(
            Math.max(parseInt(pEntradaPersonalizada, 10) || numeroParcelasEntradaMaximas, 1),
            numeroParcelasEntradaMaximas
        );

        const saldoAposEntradaFazendaria = saldoDevedor - entradaFazendaria;
        const saldoAposEntradaPrevidenciaria = saldoDevedor - entradaPrevidenciaria;
        const valorPrestacaoEntradaFazendaria = entradaFazendaria / numeroParcelasEntradaSelecionadas;
        const valorPrestacaoEntradaPrevidenciaria = entradaPrevidenciaria / numeroParcelasEntradaSelecionadas;

        const limitePfBcnFazendario = contribuinteElegivelPfBcn ? (saldoAposEntradaFazendaria * 0.30) : 0;
        const limitePfBcnPrevidenciario = contribuinteElegivelPfBcn ? (saldoAposEntradaPrevidenciaria * 0.30) : 0;

        const saldoRemanescenteFazendario = saldoAposEntradaFazendaria;
        const saldoRemanescentePrevidenciario = saldoAposEntradaPrevidenciaria;

        const parcelasFazendariasMaximas = calcularParcelasMaximasPorValorMinimo(
            saldoRemanescenteFazendario, obterLimiteEditalParcelasFazendariasRfb50Milhoes(rating, tipo), valorMinimoParcela);
        const parcelasPrevidenciariasMaximas = calcularParcelasMaximasPorValorMinimo(
            saldoRemanescentePrevidenciario, 50, valorMinimoParcela);

        const parcelasFazendariasSelecionadas = Math.min(
            Math.max(parseInt(pParcelasPersonalizadas, 10) || parcelasFazendariasMaximas, 1), parcelasFazendariasMaximas);
        const parcelasPrevidenciariasSelecionadas = Math.min(
            Math.max(parseInt(pParcelasPersonalizadas, 10) || parcelasPrevidenciariasMaximas, 1), parcelasPrevidenciariasMaximas);

        const valorPrestacaoFazendaria = saldoRemanescenteFazendario / parcelasFazendariasSelecionadas;
        const valorPrestacaoPrevidenciaria = saldoRemanescentePrevidenciario / parcelasPrevidenciariasSelecionadas;

        const isFazendario = tipoDebitoSelecionado === 'FAZENDARIO';

        return {
            elegivel: true,
            rating,
            tipoContribuinte: tipo,
            dividaSemReducao,
            reducaoPercentual: desconto,
            descontoCalculado,
            descontoAplicado,
            descontoMaximoPermitido,
            saldoDevedorAposReducao: saldoDevedor,
            numeroParcelasEntrada: numeroParcelasEntradaSelecionadas,
            numeroParcelasEntradaMaximas,
            parcelasEntradaMaximasReais: numeroParcelasEntradaMaximas,
            entradaDesabilitada: false,
            valorParcelaEntrada: isFazendario ? valorPrestacaoEntradaFazendaria : valorPrestacaoEntradaPrevidenciaria,
            usoPfBcn: contribuinteElegivelPfBcn,
            percentualMaximoPfBcn: 30,
            limiteMaximoPfBcn: isFazendario ? limitePfBcnFazendario : limitePfBcnPrevidenciario,
            valorPfBcn: 0,
            valorMinimoParcela,
            entrada: isFazendario ? entradaFazendaria : entradaPrevidenciaria,
            numeroParcelas: isFazendario
                ? (numeroParcelasEntradaSelecionadas + parcelasFazendariasSelecionadas)
                : (numeroParcelasEntradaSelecionadas + parcelasPrevidenciariasSelecionadas),
            parcelasMaximasReais: isFazendario ? parcelasFazendariasMaximas : parcelasPrevidenciariasMaximas,
            valorParcela: isFazendario ? valorPrestacaoFazendaria : valorPrestacaoPrevidenciaria,
            parcelasFazendariasMaximas,
            parcelasFazendariasSelecionadas,
            valorPrestacaoFazendaria,
            parcelasPrevidenciariasMaximas,
            parcelasPrevidenciariasSelecionadas,
            valorPrestacaoPrevidenciaria,
            entradaFazendaria,
            valorPrestacaoEntradaFazendaria,
            saldoAposEntradaFazendaria,
            saldoRemanescenteFazendario,
            limitePfBcnFazendario,
            valorPfBcnFazendario: 0,
            entradaPrevidenciaria,
            valorPrestacaoEntradaPrevidenciaria,
            saldoAposEntradaPrevidenciaria,
            saldoRemanescentePrevidenciario,
            limitePfBcnPrevidenciario,
            valorPfBcnPrevidenciario: 0,
            numeroParcelasFazendarias: numeroParcelasEntradaSelecionadas + parcelasFazendariasSelecionadas,
            numeroParcelasPrevidenciarias: numeroParcelasEntradaSelecionadas + parcelasPrevidenciariasSelecionadas
        };
    }

    /**
     * Recálculo ao informar PF/BCN (50milh.js > recalcularCamposPfBcnRfb50m).
     * Usar PF/BCN nos débitos fazendários eleva a entrada de 5% para 10% da dívida.
     * Altera "resultado" in-place, como no site.
     */
    function recalcularCamposPfBcnRfb50m(resultado, valorPfBcnFazendario, valorPfBcnPrevidenciario) {
        const valorMinimoParcela = resultado.valorMinimoParcela || obterValorMinimoParcelaRfb50m(resultado.tipoContribuinte);
        const numeroParcelasEntrada = resultado.numeroParcelasEntrada || 10;
        const valorPfBcnFazendarioInformado = Math.max(Number(valorPfBcnFazendario) || 0, 0);
        const percentualEntradaFazendaria = obterPercentualEntradaFazendariaRfb50m(resultado.rating, valorPfBcnFazendarioInformado);

        resultado.entradaFazendaria = (resultado.dividaSemReducao || 0) * percentualEntradaFazendaria;
        resultado.entrada = resultado.entradaFazendaria;
        resultado.saldoAposEntradaFazendaria = (resultado.saldoDevedorAposReducao || 0) - resultado.entradaFazendaria;

        const limiteEditalParcelasEntrada = obterLimiteParcelasEntradaRfb50m(resultado.rating, resultado.tipoContribuinte);
        const numeroParcelasEntradaMaximas = Math.max(1, Math.min(
            limiteEditalParcelasEntrada,
            Math.floor(resultado.entradaFazendaria / valorMinimoParcela),
            Math.floor((resultado.entradaPrevidenciaria || 0) / valorMinimoParcela)
        ));
        const numeroParcelasEntradaAtualizadas = Math.min(Math.max(numeroParcelasEntrada, 1), numeroParcelasEntradaMaximas);

        resultado.numeroParcelasEntrada = numeroParcelasEntradaAtualizadas;
        resultado.numeroParcelasEntradaMaximas = numeroParcelasEntradaMaximas;
        resultado.parcelasEntradaMaximasReais = numeroParcelasEntradaMaximas;
        resultado.valorPrestacaoEntradaFazendaria = resultado.entradaFazendaria / numeroParcelasEntradaAtualizadas;
        resultado.valorPrestacaoEntradaPrevidenciaria = (resultado.entradaPrevidenciaria || 0) / numeroParcelasEntradaAtualizadas;

        const limiteFaz = Math.max(resultado.saldoAposEntradaFazendaria * 0.30, 0);
        const limitePrev = Math.max((resultado.saldoAposEntradaPrevidenciaria || 0) * 0.30, 0);
        resultado.limitePfBcnFazendario = limiteFaz;
        resultado.limitePfBcnPrevidenciario = limitePrev;

        const valorFazNormalizado = Math.min(valorPfBcnFazendarioInformado, limiteFaz);
        const valorPrevNormalizado = Math.min(Math.max(Number(valorPfBcnPrevidenciario) || 0, 0), limitePrev);
        resultado.valorPfBcnFazendario = valorFazNormalizado;
        resultado.valorPfBcnPrevidenciario = valorPrevNormalizado;

        resultado.saldoRemanescenteFazendario = resultado.saldoAposEntradaFazendaria - valorFazNormalizado;
        resultado.saldoRemanescentePrevidenciario = (resultado.saldoAposEntradaPrevidenciaria || 0) - valorPrevNormalizado;

        const limiteParcelasFazendarias = obterLimiteEditalParcelasFazendariasRfb50Milhoes(resultado.rating, resultado.tipoContribuinte);
        resultado.parcelasFazendariasMaximas = calcularParcelasMaximasPorValorMinimo(resultado.saldoRemanescenteFazendario, limiteParcelasFazendarias, valorMinimoParcela);
        resultado.parcelasPrevidenciariasMaximas = calcularParcelasMaximasPorValorMinimo(resultado.saldoRemanescentePrevidenciario, 50, valorMinimoParcela);

        resultado.parcelasFazendariasSelecionadas = Math.min(
            Math.max(resultado.parcelasFazendariasSelecionadas || resultado.parcelasFazendariasMaximas, 1), resultado.parcelasFazendariasMaximas);
        resultado.parcelasPrevidenciariasSelecionadas = Math.min(
            Math.max(resultado.parcelasPrevidenciariasSelecionadas || resultado.parcelasPrevidenciariasMaximas, 1), resultado.parcelasPrevidenciariasMaximas);

        resultado.valorPrestacaoFazendaria = resultado.saldoRemanescenteFazendario / Math.max(resultado.parcelasFazendariasSelecionadas, 1);
        resultado.valorPrestacaoPrevidenciaria = resultado.saldoRemanescentePrevidenciario / Math.max(resultado.parcelasPrevidenciariasSelecionadas, 1);

        resultado.numeroParcelasFazendarias = numeroParcelasEntradaAtualizadas + resultado.parcelasFazendariasSelecionadas;
        resultado.numeroParcelasPrevidenciarias = numeroParcelasEntradaAtualizadas + resultado.parcelasPrevidenciariasSelecionadas;
        return resultado;
    }

    /** quadro-resumo.js > sincronizarResultadoOpcaoAtivaRfb50m (sem mexer em valorParcelaEntrada, como no site). */
    function sincronizarResultadoOpcaoAtivaRfb50m(tipoDebito, resultado) {
        if (tipoDebito === 'PREVIDENCIARIO') {
            resultado.entrada = resultado.entradaPrevidenciaria;
            resultado.valorParcela = resultado.valorPrestacaoPrevidenciaria;
            resultado.numeroParcelas = resultado.numeroParcelasPrevidenciarias;
            resultado.valorPfBcn = resultado.valorPfBcnPrevidenciario;
            resultado.limiteMaximoPfBcn = resultado.limitePfBcnPrevidenciario;
            resultado.parcelasMaximasReais = resultado.parcelasPrevidenciariasMaximas;
            return;
        }
        resultado.entrada = resultado.entradaFazendaria;
        resultado.valorParcela = resultado.valorPrestacaoFazendaria;
        resultado.numeroParcelas = resultado.numeroParcelasFazendarias;
        resultado.valorPfBcn = resultado.valorPfBcnFazendario;
        resultado.limiteMaximoPfBcn = resultado.limitePfBcnFazendario;
        resultado.parcelasMaximasReais = resultado.parcelasFazendariasMaximas;
    }

    function montarDefinicaoRfb50Milhoes(ctx) {
        const base = calcularDividaElegivelRfb50Milhoes(ctx);
        return {
            chaveModalidade: 'RFB_GERAL_50M',
            nomeExibicao: 'RFB - Edital nº 9/2026 - Até 50 milhões por Processo',
            orgao: 'RFB',
            elegivel: base.elegivel,
            motivoInelegibilidade: base.motivo,
            dividaSemReducao: base.dividaSemReducao,
            prazoAdesao: '30/12/2026',
            exibirSaldoComEntrada: false,
            permiteEditarParcelas: true,
            permiteEditarParcelasEntrada: true,
            opcoes: OPCOES_RFB_50M.map(cfg => ({
                codigoOpcao: cfg.codigoOpcao,
                rotulo: cfg.rotulo,
                calcular: (c, pSaldo, pEntrada) => calcularResultadoRfb50Milhoes(ctx, cfg.codigoOpcao, pSaldo, pEntrada)
            }))
        };
    }

    // =========================================================================
    // MODALIDADE 3 — PGFN Edital 06/2026 — Pequeno valor (até 60 SM)
    // =========================================================================
    function obterValorMinimoParcelaPGFNPequenoValor(tipo) {
        return tipo === 'MEI' ? 25.00 : 100.00;
    }

    function calcularDividaElegivelPGFNPequenoValor(ctx) {
        // Atenção: no modo AGREGADO o site NÃO verifica o tipo de contribuinte (Demais PJ passa).
        if (ctx.modoSimulacaoDivida !== 'POR_DEBITO') {
            const totalAgregado = ctx.debitosAgregados.total;
            if (totalAgregado === 0) {
                return { elegivel: false, motivo: 'Nenhum valor de débito foi informado.', dividaSemReducao: 0 };
            }
            const totalComAcrescimo = totalAgregado * (1 + ACRESCIMO_INSCRICAO_DIVIDA_ATIVA);
            if (totalComAcrescimo > LIMITE_PEQUENO_VALOR) {
                return { elegivel: false, motivo: `O valor total agregado, já acrescido de 10% (inscrição em Dívida Ativa), supera o limite de R$ ${LIMITE_PEQUENO_VALOR.toFixed(2)} (60 salários-mínimos).`, dividaSemReducao: 0 };
            }
            return { elegivel: true, motivo: null, dividaSemReducao: totalComAcrescimo };
        }

        const tiposElegiveis = ['PN', 'PN_OBITO', 'MEI', 'ME_EPP'];
        if (!tiposElegiveis.includes(ctx.perfil.tipoContribuinte)) {
            return { elegivel: false, motivo: 'Modalidade disponível apenas para Pessoa Natural, MEI, ME ou EPP.', dividaSemReducao: 0 };
        }
        const debitosComAcrescimo = ctx.debitos.filter(d => d.total > 0).map(d => d.total * (1 + ACRESCIMO_INSCRICAO_DIVIDA_ATIVA));
        const debitosElegiveis = debitosComAcrescimo.filter(v => v <= LIMITE_PEQUENO_VALOR);
        if (debitosElegiveis.length === 0) {
            return { elegivel: false, motivo: `Nenhum débito individual dentro do limite de R$ ${LIMITE_PEQUENO_VALOR.toFixed(2)} (considerando o acréscimo de 10% da inscrição em Dívida Ativa).`, dividaSemReducao: 0 };
        }
        const dividaSemReducao = debitosElegiveis.reduce((acc, v) => acc + v, 0);
        return { elegivel: true, motivo: null, dividaSemReducao };
    }

    function calcularOpcaoPGFNPequenoValor(ctx, opcaoConfig, numeroParcelasSaldoEscolhido, numeroParcelasEntradaEscolhido) {
        const { elegivel, motivo, dividaSemReducao } = calcularDividaElegivelPGFNPequenoValor(ctx);
        if (!elegivel) return inelegivel(motivo);

        if (opcaoConfig.limiteEspecifico && dividaSemReducao > opcaoConfig.limiteEspecifico) {
            return inelegivel(`Esta opção específica exige dívida de até R$ ${opcaoConfig.limiteEspecifico.toFixed(2)} (5 salários-mínimos).`);
        }
        if (opcaoConfig.tiposElegiveisEspecifico && !opcaoConfig.tiposElegiveisEspecifico.includes(ctx.perfil.tipoContribuinte)) {
            return inelegivel('Esta opção específica (Art. 10, I) é exclusiva para Microempreendedor Individual (MEI).');
        }

        const valorMinimoParcela = obterValorMinimoParcelaPGFNPequenoValor(ctx.perfil.tipoContribuinte);
        const parcelaInformada = numeroParcelasSaldoEscolhido !== undefined && numeroParcelasSaldoEscolhido !== null && !isNaN(numeroParcelasSaldoEscolhido);

        if (opcaoConfig.tipo === 'AVISTA') {
            const saldoDevedor = dividaSemReducao * (1 - opcaoConfig.percentualDesconto / 100);
            return {
                elegivel: true, dividaSemReducao, entrada: 0, numeroParcelasEntrada: 0, valorParcelaEntrada: 0,
                entradaDesabilitada: true, saldoDevedorAposReducao: saldoDevedor, numeroParcelas: 1,
                parcelasMaximasReais: 1, valorParcela: saldoDevedor, totalPago: saldoDevedor,
                reducaoPercentual: opcaoConfig.percentualDesconto, usoPfBcn: false, percentualMaximoPfBcn: 0
            };
        }

        if (opcaoConfig.tipo === 'COM_ENTRADA_ZERO') {
            const saldoDevedor = dividaSemReducao * (1 - opcaoConfig.percentualDesconto / 100);
            const parcelasPelaMinima = Math.max(1, Math.floor(saldoDevedor / valorMinimoParcela));
            const parcelasMaximasReais = Math.min(opcaoConfig.parcelasMaximasSaldo, parcelasPelaMinima);
            let numeroParcelas = parcelasMaximasReais;
            if (parcelaInformada) {
                numeroParcelas = Math.min(Math.max(parseInt(numeroParcelasSaldoEscolhido, 10), 1), parcelasMaximasReais);
            }
            const valorParcela = saldoDevedor / numeroParcelas;
            return {
                elegivel: true, dividaSemReducao, entrada: 0, numeroParcelasEntrada: 0, valorParcelaEntrada: 0,
                entradaDesabilitada: true, saldoDevedorAposReducao: saldoDevedor, numeroParcelas, parcelasMaximasReais,
                valorParcela, totalPago: saldoDevedor, reducaoPercentual: opcaoConfig.percentualDesconto,
                usoPfBcn: false, percentualMaximoPfBcn: 0
            };
        }

        // COM_ENTRADA: 5% de entrada (até 5x) SEM desconto; desconto só sobre o saldo após a entrada
        const entrada = dividaSemReducao * 0.05;
        const parcelasEntradaPelaMinima = Math.max(1, Math.floor(entrada / valorMinimoParcela));
        const parcelasEntradaMaximasReais = Math.min(5, parcelasEntradaPelaMinima);
        const numeroParcelasEntrada = Math.min(Math.max(numeroParcelasEntradaEscolhido || parcelasEntradaMaximasReais, 1), parcelasEntradaMaximasReais);
        const valorParcelaEntrada = entrada / numeroParcelasEntrada;
        const saldoAposEntrada = dividaSemReducao - entrada;
        const saldoDevedor = saldoAposEntrada * (1 - opcaoConfig.percentualDesconto / 100);
        const parcelasPelaMinima = Math.max(1, Math.floor(saldoDevedor / valorMinimoParcela));
        const parcelasMaximasReais = Math.min(opcaoConfig.parcelasMaximasSaldo, parcelasPelaMinima);
        let numeroParcelas = parcelasMaximasReais;
        if (parcelaInformada) {
            numeroParcelas = Math.min(Math.max(parseInt(numeroParcelasSaldoEscolhido, 10), 1), parcelasMaximasReais);
        }
        const valorParcela = saldoDevedor / numeroParcelas;
        const totalPago = entrada + saldoDevedor;
        const reducaoPercentual = dividaSemReducao > 0 ? ((dividaSemReducao - totalPago) / dividaSemReducao) * 100 : 0;

        return {
            elegivel: true, dividaSemReducao, entrada, numeroParcelasEntrada, parcelasEntradaMaximasReais,
            valorParcelaEntrada, entradaDesabilitada: false, saldoDevedorAposReducao: saldoDevedor,
            numeroParcelas, parcelasMaximasReais, valorParcela, totalPago, reducaoPercentual,
            usoPfBcn: false, percentualMaximoPfBcn: 0
        };
    }

    function montarDefinicaoPGFNPequenoValor(ctx) {
        const base = calcularDividaElegivelPGFNPequenoValor(ctx);
        return {
            chaveModalidade: 'PGFN_PEQUENO_VALOR',
            nomeExibicao: 'PGFN – Edital 06/2026 - Até 60 salários-mínimos',
            orgao: 'PGFN',
            elegivel: base.elegivel,
            motivoInelegibilidade: base.motivo,
            dividaSemReducao: base.dividaSemReducao,
            prazoAdesao: '29/01/2027',
            permiteEditarParcelas: true,
            permiteEditarParcelasEntrada: true,
            opcoes: OPCOES_PGFN_PEQUENO_VALOR.map(cfg => ({
                codigoOpcao: cfg.codigoOpcao,
                rotulo: cfg.rotulo,
                calcular: (c, pSaldo, pEntrada) => calcularOpcaoPGFNPequenoValor(ctx, cfg, pSaldo, pEntrada)
            }))
        };
    }

    // =========================================================================
    // MODALIDADE 4 — PGFN Edital 06/2026 — Conforme a Capacidade de Pagamento
    // =========================================================================
    function calcularDividaElegivelCapacidadePagamentoPGFN(ctx) {
        const tiposElegiveis = ['PN', 'PN_OBITO', 'MEI', 'ME_EPP', 'DEMAIS_PJ'];
        if (!tiposElegiveis.includes(ctx.perfil.tipoContribuinte)) {
            return { elegivel: false, motivo: 'Perfil de contribuinte não identificado.' };
        }
        const dividaBase = ctx.totalDebitos || 0;
        if (dividaBase <= 0) return { elegivel: false, motivo: 'Nenhum débito informado.' };
        const dividaComAcrescimo = dividaBase * (1 + ACRESCIMO_INSCRICAO_DIVIDA_ATIVA);
        if (dividaComAcrescimo > LIMITE_CAPACIDADE_PAGAMENTO_PGFN) {
            return { elegivel: false, motivo: 'O valor total consolidado supera o limite de R$ 45 milhões.' };
        }
        return { elegivel: true, motivo: null, dividaSemReducao: dividaComAcrescimo };
    }

    function calcularOpcaoCapacidadePagamentoPGFN(ctx, opcaoConfig, pEntrada, pSaldo, natureza) {
        const base = calcularDividaElegivelCapacidadePagamentoPGFN(ctx);
        if (!base.elegivel) return inelegivel(base.motivo);

        const dividaSemReducao = base.dividaSemReducao;
        const { rating, descontoTeorico } = ctx.classificacao.pgfn;
        const tipo = ctx.perfil.tipoContribuinte;
        const grupoEspecial = tipo !== 'DEMAIS_PJ';
        const descontoTratado = (descontoTeorico > 1) ? (descontoTeorico / 100) : (descontoTeorico || 0);
        const valorMinimoParcela = tipo === 'MEI' ? 25 : 100;

        let principalOriginal = 0;
        if (ctx.modoSimulacaoDivida === 'AGREGADO') {
            principalOriginal = ctx.debitosAgregados.principal || 0;
        } else if (ctx.modoSimulacaoDivida === 'POR_DEBITO') {
            principalOriginal = ctx.debitos.reduce((acc, d) => acc + (d.principal || 0), 0);
        } else {
            principalOriginal = ctx.totalDebitos || 0;
        }

        // Rating A ou B: sem desconto, entrada de 6%, total até 60 meses
        if (rating === 'A' || rating === 'B') {
            if (opcaoConfig.codigoOpcao === 'AVISTA') {
                return inelegivel('À vista indisponível para Rating A ou B (não há desconto).');
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
                elegivel: true, rating, dividaSemReducao, entrada, numeroParcelasEntrada: numParcelasEntrada,
                parcelasEntradaMaximasReais: maxEntrada, valorParcelaEntrada: entrada / numParcelasEntrada,
                entradaDesabilitada: false, reducaoPercentual: 0, saldoDevedorAposReducao: saldoDevedor,
                numeroParcelas, parcelasMaximasReais: maxReais, valorParcela: saldoDevedor / numeroParcelas,
                totalPago: entrada + saldoDevedor, usoPfBcn: false,
                // memória de cálculo (não existe no objeto do site)
                memoria: { principalOriginal, descontoTratado: 0, descontoConcedido: 0, parcelasMaximasNatureza }
            };
        }

        // Rating C ou D: desconto limitado a juros+multas restantes após a entrada
        const isAvista = opcaoConfig.codigoOpcao === 'AVISTA';
        const entrada = isAvista ? 0 : (dividaSemReducao * 0.06);
        const maxEntradaEdital = grupoEspecial ? 12 : 6;
        const maxEntradaPelaMinima = isAvista ? maxEntradaEdital : Math.max(1, Math.floor(entrada / valorMinimoParcela));
        const maxEntrada = Math.min(maxEntradaEdital, maxEntradaPelaMinima);
        const numParcelasEntrada = isAvista ? 0 : Math.min(Math.max(pEntrada || maxEntrada, 1), maxEntrada);
        const valorParcelaEntrada = isAvista ? 0 : (entrada / numParcelasEntrada);
        const parcelasMaximasNatureza = (natureza === 'PREVIDENCIARIO') ? Math.max(1, 60 - numParcelasEntrada) : (grupoEspecial ? 133 : 114);

        const proporcaoPrincipal = principalOriginal / dividaSemReducao;
        const principalAmortizadoNaEntrada = entrada * proporcaoPrincipal;
        const saldoPrincipalRestante = principalOriginal - principalAmortizadoNaEntrada;
        const saldoDevedorAposEntrada = dividaSemReducao - entrada;
        const saldoJurosMultasRestantes = saldoDevedorAposEntrada - saldoPrincipalRestante;
        const tetoDescontoRating = saldoDevedorAposEntrada * descontoTratado;
        const descontoConcedido = Math.min(saldoJurosMultasRestantes, tetoDescontoRating);
        const saldoDevedorFinal = saldoDevedorAposEntrada - descontoConcedido;

        const memoria = {
            principalOriginal, proporcaoPrincipal, principalAmortizadoNaEntrada, saldoPrincipalRestante,
            saldoDevedorAposEntrada, saldoJurosMultasRestantes, tetoDescontoRating, descontoConcedido,
            descontoTratado, parcelasMaximasNatureza
        };

        if (isAvista) {
            return {
                elegivel: true, rating, dividaSemReducao, entrada: 0, numeroParcelasEntrada: 0, parcelasEntradaMaximasReais: 0,
                valorParcelaEntrada: 0, entradaDesabilitada: true, reducaoPercentual: descontoTratado * 100,
                saldoDevedorAposReducao: saldoDevedorFinal, numeroParcelas: 1, parcelasMaximasReais: 1,
                valorParcela: saldoDevedorFinal, totalPago: saldoDevedorFinal, usoPfBcn: false, memoria
            };
        }

        const parcelasPelaMinima = Math.max(1, Math.floor(saldoDevedorFinal / valorMinimoParcela));
        const maxReais = Math.min(parcelasMaximasNatureza, parcelasPelaMinima);
        const numeroParcelas = Math.min(Math.max(pSaldo || maxReais, 1), maxReais);
        return {
            elegivel: true, rating, dividaSemReducao, entrada, numeroParcelasEntrada: numParcelasEntrada,
            parcelasEntradaMaximasReais: maxEntrada, valorParcelaEntrada, entradaDesabilitada: false,
            reducaoPercentual: descontoTratado * 100, saldoDevedorAposReducao: saldoDevedorFinal,
            numeroParcelas, parcelasMaximasReais: maxReais, valorParcela: saldoDevedorFinal / numeroParcelas,
            totalPago: entrada + saldoDevedorFinal, usoPfBcn: false, memoria
        };
    }

    function montarDefinicaoCapacidadePagamentoPGFN(ctx) {
        const base = calcularDividaElegivelCapacidadePagamentoPGFN(ctx);
        return {
            chaveModalidade: 'PGFN_CAPACIDADE_PAGAMENTO',
            nomeExibicao: 'PGFN – Edital 06/2026 - Conforme a Capacidade de Pagamento',
            orgao: 'PGFN',
            elegivel: base.elegivel,
            motivoInelegibilidade: base.motivo,
            dividaSemReducao: base.dividaSemReducao || 0,
            prazoAdesao: '29/01/2027',
            permiteEditarParcelas: true,
            permiteEditarParcelasEntrada: true,
            possuiSeletorNatureza: true,
            naturezaSelecionada: 'FAZENDARIO',
            opcoes: OPCOES_CAPACIDADE_PAGAMENTO_PGFN.map(cfg => ({
                codigoOpcao: cfg.codigoOpcao,
                rotulo: cfg.rotulo,
                // ATENÇÃO: o site passa (pSaldo, pEntrada) mas a função recebe (pEntrada, pSaldo)
                calcular: (c, pSaldo, pEntrada, natureza) => calcularOpcaoCapacidadePagamentoPGFN(ctx, cfg, pEntrada, pSaldo, natureza)
            }))
        };
    }

    // =========================================================================
    // ORQUESTRAÇÃO (quadro-resumo.js > recalcularModalidade)
    // =========================================================================
    function resolverIndiceOpcao(definicao, opcao, avisos) {
        if (opcao === null || opcao === undefined || opcao === '') return 0;
        const texto = String(opcao).trim();
        const porCodigo = definicao.opcoes.findIndex(o => o.codigoOpcao.toUpperCase() === texto.toUpperCase());
        if (porCodigo >= 0) return porCodigo;
        const idx = parseInt(texto, 10); // mesma conversão de alterarOpcaoModalidade no site
        if (Number.isInteger(idx) && idx >= 0 && idx < definicao.opcoes.length) return idx;
        // No site, um índice inválido calcula com opcoes[0]
        if (avisos) avisos.push(`Opção "${opcao}" inválida; usada a primeira opção (${definicao.opcoes[0].codigoOpcao}).`);
        return 0;
    }

    function resolverModalidade(ctx, definicao, escolha) {
        escolha = escolha || {};
        const m = Object.assign({}, definicao);
        m.avisos = [];
        m.opcaoSelecionadaIndex = resolverIndiceOpcao(definicao, escolha.opcao ?? escolha.opcaoIndex, m.avisos);
        m.numeroParcelasPersonalizado = normalizarInteiro(escolha.parcelas);
        m.numeroParcelasEntradaPersonalizado = normalizarInteiro(escolha.parcelasEntrada);
        if (m.possuiSeletorNatureza) {
            const nat = String(escolha.natureza || m.naturezaSelecionada).toUpperCase();
            m.naturezaSelecionada = nat === 'PREVIDENCIARIO' ? 'PREVIDENCIARIO' : 'FAZENDARIO';
        }
        m.resultadoAtual = null;

        if (m.elegivel && m.opcoes && m.opcoes.length > 0) {
            let opcaoAtiva = m.opcoes[m.opcaoSelecionadaIndex] || m.opcoes[0];
            const calc = (op) => op.calcular(null, m.numeroParcelasPersonalizado, m.numeroParcelasEntradaPersonalizado, m.naturezaSelecionada);
            let r = calc(opcaoAtiva);

            // Auto-correção: se a opção escolhida não é elegível, pula para a primeira elegível
            if (!r || !r.elegivel) {
                const indexValido = m.opcoes.findIndex(op => op.calcular(null, null, null).elegivel);
                if (indexValido !== -1) {
                    if (escolha.opcao !== undefined || escolha.opcaoIndex !== undefined) {
                        m.avisos.push(`Opção escolhida indisponível (${r && r.motivo}); usada a primeira opção elegível.`);
                    }
                    m.opcaoSelecionadaIndex = indexValido;
                    opcaoAtiva = m.opcoes[indexValido];
                    r = calc(opcaoAtiva);
                } else {
                    m.elegivel = false;
                    m.motivoInelegibilidade = r ? r.motivo : 'Nenhuma opção elegível.';
                }
            }
            m.resultadoAtual = r;

            // Parcelas acima do máximo real são "puxadas" para o máximo
            if (m.numeroParcelasPersonalizado && r && r.parcelasMaximasReais &&
                m.numeroParcelasPersonalizado > r.parcelasMaximasReais) {
                m.numeroParcelasPersonalizado = r.parcelasMaximasReais;
                m.resultadoAtual = calc(opcaoAtiva);
            }

            // PF/BCN — só RFB 50M (equivale a informar o valor por último no site)
            if (m.chaveModalidade === 'RFB_GERAL_50M' && m.elegivel && m.resultadoAtual && m.resultadoAtual.elegivel) {
                aplicarPfBcnRfb50m(m, escolha.valorPfBcn ?? escolha.pfBcn, escolha.valorPfBcnAnterior);
            }
        }

        // Opções que aparecem no <select> (só as elegíveis)
        m.opcoesDisponiveis = m.opcoes.map((op, i) => {
            const t = op.calcular(null, null, null, m.naturezaSelecionada);
            return t.elegivel ? { index: i, codigo: op.codigoOpcao, rotulo: op.rotulo } : null;
        }).filter(Boolean);

        return m;
    }

    /**
     * @param valorInformado  PF/BCN a aplicar (aplicado por último, como no site)
     * @param valorAnterior   PF/BCN que já estava aplicado na tela quando o novo valor foi digitado.
     *                        O site valida o novo valor contra o limite EXIBIDO nesse momento (que já
     *                        considera a entrada de 10% do PF anterior), e não contra o limite "limpo".
     */
    function aplicarPfBcnRfb50m(m, valorInformado, valorAnterior) {
        const r = m.resultadoAtual;
        m.erroPfBcn = '';
        if (valorInformado === null || valorInformado === undefined || valorInformado === '') return;
        if (!r.usoPfBcn) {
            m.avisos.push('PF/BCN ignorado: permitido apenas para PJ/MEI com Rating C ou D.');
            return;
        }
        const tipoDebito = m.opcoes[m.opcaoSelecionadaIndex].codigoOpcao === 'PREVIDENCIARIO' ? 'PREVIDENCIARIO' : 'FAZENDARIO';
        let limite = tipoDebito === 'PREVIDENCIARIO' ? (r.limitePfBcnPrevidenciario || 0) : (r.limitePfBcnFazendario || 0);
        const anterior = normalizarValor(valorAnterior);
        if (anterior > 0) {
            const estadoAnterior = JSON.parse(JSON.stringify(r));
            recalcularCamposPfBcnRfb50m(estadoAnterior, tipoDebito === 'FAZENDARIO' ? anterior : 0, tipoDebito === 'PREVIDENCIARIO' ? anterior : 0);
            limite = tipoDebito === 'PREVIDENCIARIO' ? (estadoAnterior.limitePfBcnPrevidenciario || 0) : (estadoAnterior.limitePfBcnFazendario || 0);
        }
        const valor = normalizarValor(valorInformado);
        if (valor < 0 || valor > limite) {
            m.erroPfBcn = `Informe um valor entre R$ 0,00 e R$ ${formatarMoeda(limite)}.`;
            return;
        }
        const valorFaz = tipoDebito === 'FAZENDARIO' ? valor : (r.valorPfBcnFazendario || 0);
        const valorPrev = tipoDebito === 'PREVIDENCIARIO' ? valor : (r.valorPfBcnPrevidenciario || 0);
        recalcularCamposPfBcnRfb50m(r, valorFaz, valorPrev);
        sincronizarResultadoOpcaoAtivaRfb50m(tipoDebito, r);
        m.numeroParcelasPersonalizado = tipoDebito === 'PREVIDENCIARIO' ? r.parcelasPrevidenciariasSelecionadas : r.parcelasFazendariasSelecionadas;
        // Como no site: r.valorParcelaEntrada NÃO é atualizado (o Quadro-Resumo mostra o valor
        // anterior ao PF/BCN). O valor recalculado fica em valorParcelaEntradaCorreto, que é o
        // que a página de "Detalhes" do site mostra.
        r.valorParcelaEntradaCorreto = tipoDebito === 'PREVIDENCIARIO' ? r.valorPrestacaoEntradaPrevidenciaria : r.valorPrestacaoEntradaFazendaria;
        if (Math.abs(r.valorParcelaEntradaCorreto - r.valorParcelaEntrada) > 0.004) {
            m.avisos.push(`Como no site oficial, o Quadro-Resumo mostra R$ ${formatarMoeda(r.valorParcelaEntrada)}/parcela na entrada (valor anterior ao PF/BCN). Com a entrada recalculada, cada parcela é de R$ ${formatarMoeda(r.valorParcelaEntradaCorreto)} (é o que a página de Detalhes do site mostra).`);
        }
    }

    // =========================================================================
    // EXIBIÇÃO (quadro-resumo.js + vantagens-comparativas.js)
    // =========================================================================
    function codigoOpcaoAtiva(m) {
        return m.opcoes[m.opcaoSelecionadaIndex] && m.opcoes[m.opcaoSelecionadaIndex].codigoOpcao;
    }

    function obterSaldoDevedorVisivel(m) {
        const r = m.resultadoAtual;
        if (!r) return 0;
        if (m.chaveModalidade === 'RFB_GERAL_50M') return r.saldoDevedorAposReducao || 0;
        const incluirEntrada = m.exibirSaldoComEntrada !== false;
        return (r.saldoDevedorAposReducao || 0) + (incluirEntrada ? (r.entrada || 0) : 0);
    }

    function obterValorTotalParcelas(m) {
        const r = m.resultadoAtual;
        const parcelasEntrada = r.entradaDesabilitada ? 0 : (r.numeroParcelasEntrada || 0);
        let parcelasSaldo;
        if (m.chaveModalidade === 'RFB_GERAL_50M') {
            parcelasSaldo = codigoOpcaoAtiva(m) === 'PREVIDENCIARIO'
                ? (r.parcelasPrevidenciariasSelecionadas || 0)
                : (r.parcelasFazendariasSelecionadas || 0);
        } else {
            parcelasSaldo = r.numeroParcelas || 0;
        }
        return parcelasEntrada + parcelasSaldo;
    }

    function calcularVantagens(modalidades) {
        const elegiveis = modalidades.filter(m => m.elegivel && m.resultadoAtual);
        modalidades.forEach(m => { m.vantagens = []; });
        if (elegiveis.length === 0) return;

        const definicoes = [
            { rotulo: 'Menor saldo devedor', tipo: 'MENOR', obter: obterSaldoDevedorVisivel },
            { rotulo: 'Maior número de parcelas', tipo: 'MAIOR', obter: obterValorTotalParcelas },
            { rotulo: 'Possibilidade de utilização de PF/BCN', tipo: 'BOOLEANO', obter: m => m.resultadoAtual.usoPfBcn === true }
        ];
        definicoes.forEach(def => {
            if (def.tipo === 'BOOLEANO') {
                elegiveis.forEach(m => { if (def.obter(m) === true) m.vantagens.push(def.rotulo); });
                return;
            }
            const valores = elegiveis.map(def.obter);
            const vencedor = def.tipo === 'MENOR' ? Math.min(...valores) : Math.max(...valores);
            elegiveis.forEach((m, i) => { if (valores[i] === vencedor) m.vantagens.push(def.rotulo); });
        });
    }

    function montarExibicao(ctx, m) {
        if (!m.elegivel || !m.resultadoAtual) return null;
        const r = m.resultadoAtual;
        const is50 = m.chaveModalidade === 'RFB_GERAL_50M';
        const codigo = codigoOpcaoAtiva(m);
        const prev = codigo === 'PREVIDENCIARIO';

        // Coluna "Redução"
        let reducaoTexto;
        const semReducao = Number(r.reducaoPercentual || 0) <= 0;
        if (is50 && !semReducao) {
            const teto = ['PN', 'PN_OBITO', 'MEI', 'ME_EPP'].includes(ctx.perfil.tipoContribuinte) ? 70 : 65;
            reducaoTexto = `Até ${teto}%`;
        } else {
            reducaoTexto = formatarPercentual(r.reducaoPercentual);
        }

        // Coluna "Entrada"
        const semEntrada = r.entrada === 0 || !!r.entradaDesabilitada;
        const entrada = semEntrada ? { semEntrada: true } : {
            semEntrada: false,
            valor: r.entrada || 0,
            parcelas: m.permiteEditarParcelasEntrada ? (r.numeroParcelasEntrada || 1) : r.numeroParcelasEntrada,
            valorParcela: r.valorParcelaEntrada || 0,
            maximo: r.parcelasEntradaMaximasReais || null
        };

        // Coluna "Nº de Parcelas"
        const parcelas = {
            saldo: is50 ? (prev ? (r.saldoRemanescentePrevidenciario || 0) : (r.saldoRemanescenteFazendario || 0)) : (r.saldoDevedorAposReducao || 0),
            quantidade: is50 ? (prev ? (r.parcelasPrevidenciariasSelecionadas || r.numeroParcelas || 1) : (r.parcelasFazendariasSelecionadas || r.numeroParcelas || 1)) : (r.numeroParcelas || 1),
            valorParcela: is50 ? (prev ? (r.valorPrestacaoPrevidenciaria || r.valorParcela || 0) : (r.valorPrestacaoFazendaria || r.valorParcela || 0)) : (r.valorParcela || 0),
            maximo: r.parcelasMaximasReais || null
        };

        // Coluna "Uso PF/BCN"
        let pfBcn;
        if (is50 && r.usoPfBcn) {
            pfBcn = {
                permitido: true,
                valor: prev ? (r.valorPfBcnPrevidenciario || 0) : (r.valorPfBcnFazendario || 0),
                limite: prev ? (r.limitePfBcnPrevidenciario || 0) : (r.limitePfBcnFazendario || 0),
                erro: m.erroPfBcn || ''
            };
        } else {
            pfBcn = { permitido: !!r.usoPfBcn, texto: r.usoPfBcn ? `SIM (até ${r.percentualMaximoPfBcn}%)` : 'NÃO' };
        }

        const totalPago = r.totalPago !== undefined
            ? r.totalPago
            : (is50 ? null : (r.entrada || 0) + (r.saldoDevedorAposReducao || 0));
        return {
            dividaElegivel: m.dividaSemReducao || 0,
            reducaoTexto,
            saldoDevedor: obterSaldoDevedorVisivel(m),
            entrada,
            parcelas,
            pfBcn,
            totalParcelas: obterValorTotalParcelas(m),
            totalPago,
            economia: totalPago === null ? null : (r.dividaSemReducao - totalPago)
        };
    }

    // =========================================================================
    // API PRINCIPAL
    // =========================================================================
    /**
     * @param {object} entrada
     *   tipoContribuinte: 'PN'|'PN_OBITO'|'MEI'|'ME_EPP'|'DEMAIS_PJ'
     *   situacao: { falidoRecuperacao: bool, baixadoInapto: bool }   (só MEI/ME_EPP/DEMAIS_PJ)
     *   modo: 'AGREGADO'|'POR_DEBITO'
     *   agregado: { principal, multa, juros }                         (modo AGREGADO)
     *   debitos: [{ principal, multa, juros }, ...]                   (modo POR_DEBITO)
     *   capag: Capacidade de pagamento em 60 meses (R$)
     *   dividaTotalPgfnRfb: Valor total da dívida na PGFN e RFB (R$)
     *   escolhas: {
     *     RFB_PEQUENO_VALOR:         { opcao, parcelas },
     *     RFB_GERAL_50M:             { opcao: 'FAZENDARIO'|'PREVIDENCIARIO', parcelas, parcelasEntrada, valorPfBcn },
     *     PGFN_PEQUENO_VALOR:        { opcao, parcelas, parcelasEntrada },
     *     PGFN_CAPACIDADE_PAGAMENTO: { opcao: 'COM_ENTRADA'|'AVISTA', natureza: 'FAZENDARIO'|'PREVIDENCIARIO', parcelas, parcelasEntrada }
     *   }
     *   (opcao = índice ou código; parcelas vazias = máximo permitido, como no site)
     */
    function simular(entrada) {
        const ctx = criarContexto(entrada);
        const escolhas = (entrada && entrada.escolhas) || {};
        if (!(ctx.totalDebitos > 0)) {
            throw new Error('O valor total dos débitos deve ser maior que zero (o site bloqueia em "Confirmar total de débitos").');
        }

        // Mesma ordem de registro do site (ordem das linhas no Quadro-Resumo)
        const definicoes = [
            montarDefinicaoPequenoValorRFB(ctx),
            montarDefinicaoRfb50Milhoes(ctx),
            montarDefinicaoPGFNPequenoValor(ctx),
            montarDefinicaoCapacidadePagamentoPGFN(ctx)
        ];
        const modalidades = definicoes.map(d => resolverModalidade(ctx, d, escolhas[d.chaveModalidade]));
        calcularVantagens(modalidades);

        return {
            entrada: {
                tipoContribuinte: ctx.perfil.tipoContribuinte,
                ratingForcadoD: ctx.perfil.ratingForcadoD,
                situacaoCadastral: ctx.perfil.situacaoCadastral,
                modo: ctx.modoSimulacaoDivida,
                totalDebitos: ctx.totalDebitos,
                debitosAgregados: ctx.debitosAgregados,
                debitos: ctx.debitos,
                capag: ctx.capagInformada,
                dividaTotalPgfnRfb: ctx.dividaTotalPgfnRfb
            },
            classificacao: ctx.classificacao,
            modalidades: modalidades.map(m => ({
                chave: m.chaveModalidade,
                nome: m.nomeExibicao,
                orgao: m.orgao,
                prazoAdesao: m.prazoAdesao,
                elegivel: !!(m.elegivel && m.resultadoAtual),
                motivo: m.elegivel ? null : m.motivoInelegibilidade,
                dividaSemReducao: m.dividaSemReducao || 0,
                opcaoIndex: m.opcaoSelecionadaIndex,
                opcaoCodigo: codigoOpcaoAtiva(m),
                opcaoRotulo: m.opcoes[m.opcaoSelecionadaIndex] && m.opcoes[m.opcaoSelecionadaIndex].rotulo,
                opcoesDisponiveis: m.opcoesDisponiveis,
                natureza: m.possuiSeletorNatureza ? m.naturezaSelecionada : undefined,
                possuiSeletorNatureza: !!m.possuiSeletorNatureza,
                permiteEditarParcelas: !!m.permiteEditarParcelas,
                permiteEditarParcelasEntrada: !!m.permiteEditarParcelasEntrada,
                numeroParcelasPersonalizado: m.numeroParcelasPersonalizado,
                numeroParcelasEntradaPersonalizado: m.numeroParcelasEntradaPersonalizado,
                vantagens: m.vantagens,
                avisos: m.avisos,
                resultado: m.resultadoAtual,
                exibicao: montarExibicao(ctx, m)
            }))
        };
    }

    /**
     * Converte parâmetros de URL (URLSearchParams ou objeto) em "entrada" para simular().
     * Ex.: ?tipo=DEMAIS_PJ&modo=AGREGADO&principal=3000000&multa=1500000&juros=200000&capag=4000000&divida=4700000
     */
    function entradaDeParametros(params) {
        const get = (k) => {
            if (!params) return null;
            if (typeof params.get === 'function') return params.get(k);
            return params[k] !== undefined ? params[k] : null;
        };
        const flag = (k) => ['1', 'true', 'sim', 's', 'yes'].includes(String(get(k) || '').toLowerCase());
        const modo = (get('modo') || 'AGREGADO').toUpperCase();
        const entrada = {
            tipoContribuinte: (get('tipo') || '').toUpperCase(),
            situacao: { falidoRecuperacao: flag('falido'), baixadoInapto: flag('baixado') },
            modo,
            capag: get('capag'),
            dividaTotalPgfnRfb: get('divida'),
            totalDebitosTransacionar: get('transacionar'),   // opcional: total "confirmado" antigo
            escolhas: {}
        };
        if (modo === 'POR_DEBITO') {
            // debitos=principal;multa;juros|principal;multa;juros
            entrada.debitos = String(get('debitos') || '').split('|').filter(s => s.trim() !== '').map(s => {
                const [principal, multa, juros] = s.split(';');
                return { principal, multa, juros };
            });
        } else {
            entrada.agregado = { principal: get('principal'), multa: get('multa'), juros: get('juros') };
        }
        const pref = {
            RFB_PEQUENO_VALOR: 'rfbpv',
            RFB_GERAL_50M: 'rfb50',
            PGFN_PEQUENO_VALOR: 'pgfnpv',
            PGFN_CAPACIDADE_PAGAMENTO: 'pgfncp'
        };
        Object.keys(pref).forEach(chave => {
            const p = pref[chave];
            const e = {};
            ['opcao', 'parcelas', 'parcelasEntrada:entrada', 'natureza', 'valorPfBcn:pfbcn'].forEach(spec => {
                const [campo, nomeParam] = spec.includes(':') ? spec.split(':') : [spec, spec];
                const v = get(`${p}_${nomeParam}`);
                if (v !== null && v !== undefined && v !== '') e[campo] = v;
            });
            if (Object.keys(e).length) entrada.escolhas[chave] = e;
        });
        return entrada;
    }

    /** Inverso de entradaDeParametros: gera a querystring (sem "?"). */
    function parametrosDeEntrada(entrada) {
        const p = new URLSearchParams();
        p.set('tipo', entrada.tipoContribuinte);
        const s = entrada.situacao || {};
        if (s.falidoRecuperacao) p.set('falido', '1');
        if (s.baixadoInapto) p.set('baixado', '1');
        p.set('modo', entrada.modo || 'AGREGADO');
        if ((entrada.modo || 'AGREGADO') === 'POR_DEBITO') {
            p.set('debitos', (entrada.debitos || []).map(d => [d.principal || 0, d.multa || 0, d.juros || 0].join(';')).join('|'));
        } else {
            const a = entrada.agregado || {};
            p.set('principal', a.principal || 0);
            p.set('multa', a.multa || 0);
            p.set('juros', a.juros || 0);
        }
        const preenchido = v => v !== null && v !== undefined && v !== '';
        if (preenchido(entrada.capag)) p.set('capag', entrada.capag);
        if (preenchido(entrada.dividaTotalPgfnRfb)) p.set('divida', entrada.dividaTotalPgfnRfb);
        if (preenchido(entrada.totalDebitosTransacionar)) p.set('transacionar', entrada.totalDebitosTransacionar);
        const pref = { RFB_PEQUENO_VALOR: 'rfbpv', RFB_GERAL_50M: 'rfb50', PGFN_PEQUENO_VALOR: 'pgfnpv', PGFN_CAPACIDADE_PAGAMENTO: 'pgfncp' };
        const nomes = { opcao: 'opcao', parcelas: 'parcelas', parcelasEntrada: 'entrada', natureza: 'natureza', valorPfBcn: 'pfbcn' };
        Object.entries(entrada.escolhas || {}).forEach(([chave, e]) => {
            Object.entries(e || {}).forEach(([campo, v]) => {
                if (v !== null && v !== undefined && v !== '' && nomes[campo]) p.set(`${pref[chave]}_${nomes[campo]}`, v);
            });
        });
        return p.toString();
    }

    return {
        simular,
        entradaDeParametros,
        parametrosDeEntrada,
        formatarMoeda,
        formatarPercentual,
        normalizarValor,
        TIPOS_CONTRIBUINTE,
        CONSTANTES: {
            SALARIO_MINIMO_VIGENTE,
            LIMITE_PEQUENO_VALOR,
            PARCELA_MINIMA_RFB_PEQUENO_VALOR,
            ACRESCIMO_INSCRICAO_DIVIDA_ATIVA,
            LIMITE_CAPACIDADE_PAGAMENTO_PGFN,
            LIMITE_RFB_50_MILHOES
        },
        OPCOES: {
            RFB_PEQUENO_VALOR: OPCOES_PEQUENO_VALOR_RFB,
            RFB_GERAL_50M: OPCOES_RFB_50M,
            PGFN_PEQUENO_VALOR: OPCOES_PGFN_PEQUENO_VALOR,
            PGFN_CAPACIDADE_PAGAMENTO: OPCOES_CAPACIDADE_PAGAMENTO_PGFN
        }
    };
});
