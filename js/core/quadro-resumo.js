/**
 * quadro-resumo.js
 * Gerencia a Tabela Comparativa de Simulações e o registro interativo de modalidades [SETUP-6a / 6b v2].
 */

const CHAVE_SESSION_STORAGE_SIMULADOR = 'simulador_negociacao_estado_compartilhado';

function prepararEstadoCompartilhado(chaveModalidade) {
    const modalidade = estadoGlobal.modalidades.find(m => m.chaveModalidade === chaveModalidade);

    const pacote = {
        debitos: estadoGlobal.debitos,
        debitosAgregados: estadoGlobal.debitosAgregados,
        modoSimulacaoDivida: estadoGlobal.modoSimulacaoDivida,
        perfil: estadoGlobal.perfil,
        
        // ==========================================
        // DADOS FALTANTES QUE CAUSAVAM O ERRO:
        capag: estadoGlobal.capag,
        totalDebitos: estadoGlobal.totalDebitos,
        // ==========================================

        modalidadeCompleta: modalidade || null,
        modalidadeAtiva: modalidade ? {
            chaveModalidade: modalidade.chaveModalidade,
            opcaoSelecionadaIndex: modalidade.opcaoSelecionadaIndex,
            numeroParcelasPersonalizado: modalidade.numeroParcelasPersonalizado,
            numeroParcelasEntradaPersonalizado: modalidade.numeroParcelasEntradaPersonalizado,
            naturezaSelecionada: modalidade.naturezaSelecionada,
            valorPfBcnPersonalizado: modalidade.valorPfBcnPersonalizado
        } : null
    };

    sessionStorage.setItem(CHAVE_SESSION_STORAGE_SIMULADOR, JSON.stringify(pacote));

    // Compatibilidade legada: página de detalhamento RFB 50M ainda lê esta chave.
    if (modalidade && modalidade.chaveModalidade === 'RFB_GERAL_50M') {
        sessionStorage.setItem('modalidadeRfb50m', JSON.stringify(modalidade));
    }
}

function abrirDetalhamentoModalidade(chaveModalidade, url) {
    prepararEstadoCompartilhado(chaveModalidade);
    window.open(url, '_blank');
}

function registrarModalidade(definicao) {
    if (!definicao || !definicao.chaveModalidade) {
        console.error('registrarModalidade: definição inválida, chaveModalidade é obrigatória.', definicao);
        return;
    }

    const indiceExistente = estadoGlobal.modalidades.findIndex(m => m.chaveModalidade === definicao.chaveModalidade);

    if (indiceExistente >= 0) {
        const anterior = estadoGlobal.modalidades[indiceExistente];
        definicao.opcaoSelecionadaIndex = anterior.opcaoSelecionadaIndex || 0;
        definicao.numeroParcelasPersonalizado = anterior.numeroParcelasPersonalizado;
        definicao.numeroParcelasEntradaPersonalizado = anterior.numeroParcelasEntradaPersonalizado;
        definicao.naturezaSelecionada = anterior.naturezaSelecionada || definicao.naturezaSelecionada;
        definicao.valorPfBcnPersonalizado = anterior.valorPfBcnPersonalizado;
        estadoGlobal.modalidades[indiceExistente] = definicao;
    }else {
        if (typeof definicao.opcaoSelecionadaIndex !== 'number') definicao.opcaoSelecionadaIndex = 0;
        estadoGlobal.modalidades.push(definicao);
    }

    recalcularModalidade(definicao.chaveModalidade);
}

/**
 * Função central para re-avaliar todas as modalidades conectadas.
 * Deve ser chamada sempre que houver alteração nos débitos ou no perfil.
 */
function recarregarTodasAsModalidades() {
    if (typeof montarDefinicaoModalidadePequenoValorRFB === 'function') {
        registrarModalidade(montarDefinicaoModalidadePequenoValorRFB());
    }

    if (typeof carregarModalidadeRfb50Milhoes === 'function') {
        carregarModalidadeRfb50Milhoes();
    }
    if (typeof carregarModalidadeControversiaJuridica === 'function') {
        carregarModalidadeControversiaJuridica();
    }
    if (typeof montarDefinicaoModalidadePGFNPequenoValor === 'function') {
        registrarModalidade(montarDefinicaoModalidadePGFNPequenoValor());
    }
    // Restaura a chamada da PGFN que havia sumido!
    if (typeof montarDefinicaoModalidadeCapacidadePagamentoPGFN === 'function') {
        registrarModalidade(montarDefinicaoModalidadeCapacidadePagamentoPGFN());
    }

    renderizarQuadroResumo();
}

function obterContextoCalculo() {
    return {
        totalDebitos: estadoGlobal.totalDebitos,
        perfil: estadoGlobal.perfil,
        ratingForcadoD: estadoGlobal.perfil.ratingForcadoD
    };
}

/**
 * Acionada pelo novo botão "Simular Modalidades" na seção de Classificação.
 */
function liberarSimulacao() {
    // Valida se os campos obrigatórios (Capag, etc.) estão preenchidos
    if (!validarCamposObrigatoriosPorSecao('id-classificacao-debitos')) {
        showModal('Preencha os campos obrigatórios da Classificação dos Débitos antes de prosseguir.');
        return;
    }

    // Libera a trava global
    estadoGlobal.interface.simulacaoLiberada = true;
    
    // Recalcula todas as modalidades e força a renderização
    if (typeof recarregarTodasAsModalidades === 'function') {
        recarregarTodasAsModalidades();
    }

    // Rola a tela suavemente para a tabela de resultados
    setTimeout(() => {
        const quadro = document.getElementById('id-quadro-resumo');
        if (quadro) quadro.scrollIntoView({ behavior: 'smooth' });
    }, 150);
}

function recalcularModalidade(chaveModalidade) {
    const modalidade = estadoGlobal.modalidades.find(m => m.chaveModalidade === chaveModalidade);
    if (!modalidade) return;

    if (modalidade.elegivel && modalidade.opcoes && modalidade.opcoes.length > 0) {
        let opcaoAtiva = modalidade.opcoes[modalidade.opcaoSelecionadaIndex] || modalidade.opcoes[0];
        
        let r = opcaoAtiva.calcular(
            obterContextoCalculo(), 
            modalidade.numeroParcelasPersonalizado,
            modalidade.numeroParcelasEntradaPersonalizado,
            modalidade.naturezaSelecionada,
            modalidade.valorPfBcnPersonalizado
        );        
        
        // AUTO-CORREÇÃO (UX): Se a opção atual quebrou (ex: a dívida passou de 5 SM), pula para a próxima elegível
        if (!r || !r.elegivel) {
            const indexValido = modalidade.opcoes.findIndex(op => op.calcular(obterContextoCalculo(), null, null).elegivel);
            if (indexValido !== -1) {
                modalidade.opcaoSelecionadaIndex = indexValido;
                opcaoAtiva = modalidade.opcoes[indexValido];
                r = opcaoAtiva.calcular(
                    obterContextoCalculo(),
                    modalidade.numeroParcelasPersonalizado,
                    modalidade.numeroParcelasEntradaPersonalizado,
                    modalidade.naturezaSelecionada,
                    modalidade.valorPfBcnPersonalizado
                );
            } else {
                // Se TODAS as opções ficarem bloqueadas, a modalidade inteira é reprovada
                modalidade.elegivel = false;
                modalidade.motivoInelegibilidade = r ? r.motivo : 'Nenhuma opção elegível.';
            }
        }

        modalidade.resultadoAtual = r;

        // Mecanismo de correção automática caso a parcela mínima "atropele" a escolha do usuário
        if (modalidade.numeroParcelasPersonalizado && modalidade.resultadoAtual && modalidade.resultadoAtual.parcelasMaximasReais) {
            if (modalidade.numeroParcelasPersonalizado > modalidade.resultadoAtual.parcelasMaximasReais) {
                modalidade.numeroParcelasPersonalizado = modalidade.resultadoAtual.parcelasMaximasReais;
                modalidade.resultadoAtual = opcaoAtiva.calcular(
                    obterContextoCalculo(),
                    modalidade.numeroParcelasPersonalizado,
                    modalidade.numeroParcelasEntradaPersonalizado,
                    modalidade.naturezaSelecionada,
                    modalidade.valorPfBcnPersonalizado
                );
            }
        }
    } else {
        modalidade.resultadoAtual = null;
    }

    prepararEstadoCompartilhado(chaveModalidade);

    renderizarQuadroResumo();
}

function alterarOpcaoModalidade(chaveModalidade, novoIndice) {
    const modalidade = estadoGlobal.modalidades.find(m => m.chaveModalidade === chaveModalidade);
    if (!modalidade) return;

    if (typeof definirModalidadeAtiva === 'function') {
        definirModalidadeAtiva(chaveModalidade);
    }

    modalidade.opcaoSelecionadaIndex = parseInt(novoIndice, 10);
    recalcularModalidade(chaveModalidade);
}

function alterarNaturezaModalidade(chaveModalidade, novaNatureza) {
    const modalidade = estadoGlobal.modalidades.find(m => m.chaveModalidade === chaveModalidade);
    if (!modalidade) return;

    if (typeof definirModalidadeAtiva === 'function') {
        definirModalidadeAtiva(chaveModalidade);
    }
    
    modalidade.naturezaSelecionada = novaNatureza;
    // Reseta as parcelas personalizadas, pois o limite Previdenciário (60) é menor que o Fazendário (133)
    modalidade.numeroParcelasPersonalizado = null; 
    
    recalcularModalidade(chaveModalidade);
}

function alterarParcelasModalidade(chaveModalidade, parcelas) {
    const modalidade = estadoGlobal.modalidades.find(m => m.chaveModalidade === chaveModalidade);
    if (!modalidade) return;

    if (String(parcelas ?? '').trim() === '') {
        return;
    }

    if (typeof definirModalidadeAtiva === 'function') {
        definirModalidadeAtiva(chaveModalidade);
    }

    modalidade.numeroParcelasPersonalizado = parseInt(parcelas, 10);
    recalcularModalidade(chaveModalidade);
}

function obterCodigoOpcaoAtivaModalidade(modalidade) {
    return modalidade?.opcoes?.[modalidade.opcaoSelecionadaIndex]?.codigoOpcao;
}

function obterDividaElegivelVisivelModalidade(modalidade) {
    // A "Dívida Elegível à Modalidade" exibida na tabela é sempre modalidade.dividaSemReducao —
    // o valor já calculado (e correto) pela própria modalidade. Não usar obterBaseCalculoPGFN()/
    // obterBaseCalculoRFB() aqui: essas funções servem só para classificar o RATING e leem
    // campos diferentes (ex.: "Valor total da dívida na PGFN e RFB"), não a dívida efetivamente
    // parcelada.
    return modalidade?.dividaSemReducao || 0;
}

function obterSaldoDevedorVisivelModalidade(modalidade) {
    if (!modalidade || !modalidade.resultadoAtual) {
        return 0;
    }

    const r = modalidade.resultadoAtual;

    if (modalidade.chaveModalidade === 'RFB_GERAL_50M') {
        // Mantém o mesmo comportamento das outras modalidades:
        // a coluna de saldo devedor mostra o valor após descontos, antes da entrada.
        return r.saldoDevedorAposReducao || 0;
    }

    if (modalidade.chaveModalidade === 'RFB_CONTROVERSIA_JURIDICA') {
        return r.saldoAposEntrada || r.saldoDevedorAposEntrada || 0;
    }

    const incluirEntradaNoSaldo = modalidade.exibirSaldoComEntrada !== false;
    return (r.saldoDevedorAposReducao || 0) + (incluirEntradaNoSaldo ? (r.entrada || 0) : 0);
}

function obterTipoDebitoAtivoRfb50m(modalidade) {
    return obterCodigoOpcaoAtivaModalidade(modalidade) === 'PREVIDENCIARIO'
        ? 'PREVIDENCIARIO'
        : 'FAZENDARIO';
}

function obterLimitePfBcnPorTipoDebito(resultado, tipoDebito) {
    return tipoDebito === 'PREVIDENCIARIO'
        ? (resultado.limitePfBcnPrevidenciario || 0)
        : (resultado.limitePfBcnFazendario || 0);
}

function obterValorPfBcnPorTipoDebito(resultado, tipoDebito) {
    return tipoDebito === 'PREVIDENCIARIO'
        ? (resultado.valorPfBcnPrevidenciario || 0)
        : (resultado.valorPfBcnFazendario || 0);
}

function sincronizarResultadoOpcaoAtivaRfb50m(modalidade, resultado) {
    const tipoDebito = obterTipoDebitoAtivoRfb50m(modalidade);

    if (tipoDebito === 'PREVIDENCIARIO') {
        resultado.entrada = resultado.entradaPrevidenciaria;
        resultado.valorParcela = resultado.valorPrestacaoPrevidenciaria;
        resultado.numeroParcelas = resultado.numeroParcelasPrevidenciarias;
        resultado.valorPfBcn = resultado.valorPfBcnPrevidenciario;
        resultado.limiteMaximoPfBcn = resultado.limitePfBcnPrevidenciario;
        resultado.parcelasMaximasReais = resultado.parcelasPrevidenciariasMaximas;
        modalidade.numeroParcelasPersonalizado = resultado.parcelasPrevidenciariasSelecionadas;
        return;
    }

    resultado.entrada = resultado.entradaFazendaria;
    resultado.valorParcela = resultado.valorPrestacaoFazendaria;
    resultado.numeroParcelas = resultado.numeroParcelasFazendarias;
    resultado.valorPfBcn = resultado.valorPfBcnFazendario;
    resultado.limiteMaximoPfBcn = resultado.limitePfBcnFazendario;
    resultado.parcelasMaximasReais = resultado.parcelasFazendariasMaximas;
    modalidade.numeroParcelasPersonalizado = resultado.parcelasFazendariasSelecionadas;
}

function aplicarRecalculoUsoPfBcnRfb50m(resultado, tipoDebito, valorValido) {
    const valorFazendario = tipoDebito === 'FAZENDARIO'
        ? valorValido
        : (resultado.valorPfBcnFazendario || 0);

    const valorPrevidenciario = tipoDebito === 'PREVIDENCIARIO'
        ? valorValido
        : (resultado.valorPfBcnPrevidenciario || 0);

    if (typeof recalcularCamposPfBcnRfb50m === 'function') {
        recalcularCamposPfBcnRfb50m(
            resultado,
            valorFazendario,
            valorPrevidenciario
        );
        return;
    }

    // Fallback de compatibilidade caso o helper compartilhado não esteja disponível.
    const valorMinimoParcela = resultado.valorMinimoParcela || obterValorMinimoParcelaPorPerfil();
    const numeroParcelasEntrada = resultado.numeroParcelasEntrada || 10;

    resultado.valorPfBcnFazendario = valorFazendario;
    resultado.valorPfBcnPrevidenciario = valorPrevidenciario;

    resultado.saldoRemanescenteFazendario = (resultado.saldoAposEntradaFazendaria || 0) - valorFazendario;
    resultado.saldoRemanescentePrevidenciario = (resultado.saldoAposEntradaPrevidenciaria || 0) - valorPrevidenciario;

    resultado.parcelasFazendariasMaximas = calcularParcelasMaximasPorValorMinimo(
        resultado.saldoRemanescenteFazendario,
        typeof obterLimiteEditalParcelasFazendariasRfb50Milhoes === 'function'
            ? obterLimiteEditalParcelasFazendariasRfb50Milhoes(
                resultado.rating,
                resultado.tipoContribuinte
            )
            : 135,
        valorMinimoParcela
    );

    resultado.parcelasPrevidenciariasMaximas = calcularParcelasMaximasPorValorMinimo(
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
        numeroParcelasEntrada + resultado.parcelasFazendariasSelecionadas;

    resultado.numeroParcelasPrevidenciarias =
        numeroParcelasEntrada + resultado.parcelasPrevidenciariasSelecionadas;

    resultado.descricaoFazendaria = gerarDescricaoFazendaria(
        resultado.rating,
        resultado.reducaoPercentual,
        resultado.saldoDevedorAposReducao,
        resultado.entradaFazendaria,
        resultado.valorPrestacaoEntradaFazendaria,
        numeroParcelasEntrada,
        resultado.parcelasFazendariasSelecionadas,
        resultado.valorPrestacaoFazendaria
    );

    resultado.descricaoPrevidenciaria = gerarDescricaoPrevidenciaria(
        resultado.rating,
        resultado.reducaoPercentual,
        resultado.saldoDevedorAposReducao,
        resultado.entradaPrevidenciaria,
        resultado.valorPrestacaoEntradaPrevidenciaria,
        numeroParcelasEntrada,
        resultado.parcelasPrevidenciariasSelecionadas,
        resultado.valorPrestacaoPrevidenciaria
    );
}

function sincronizarSessionStorageRfb50m(modalidade) {
    sessionStorage.setItem('modalidadeRfb50m', JSON.stringify(modalidade));

    const pacote = JSON.parse(sessionStorage.getItem(CHAVE_SESSION_STORAGE_SIMULADOR) || 'null');
    if (!pacote || pacote.modalidadeCompleta?.chaveModalidade !== modalidade.chaveModalidade) {
        return;
    }

    pacote.modalidadeCompleta = modalidade;

    if (pacote.modalidadeAtiva && pacote.modalidadeAtiva.chaveModalidade === modalidade.chaveModalidade) {
        pacote.modalidadeAtiva.opcaoSelecionadaIndex = modalidade.opcaoSelecionadaIndex;
        pacote.modalidadeAtiva.numeroParcelasPersonalizado = modalidade.numeroParcelasPersonalizado;
        pacote.modalidadeAtiva.numeroParcelasEntradaPersonalizado = modalidade.numeroParcelasEntradaPersonalizado;
        pacote.modalidadeAtiva.naturezaSelecionada = modalidade.naturezaSelecionada;
    }

    sessionStorage.setItem(CHAVE_SESSION_STORAGE_SIMULADOR, JSON.stringify(pacote));
}

function converterTextoMoedaBrParaNumero(valorDigitado) {
    const textoOriginal = String(valorDigitado ?? '').trim();

    if (!textoOriginal) {
        return 0;
    }

    const textoSemSimbolo = textoOriginal
        .replace(/^R\$\s*/i, '')
        .replace(/\s/g, '');

    const textoNormalizado = textoSemSimbolo
        .replace(/\./g, '')
        .replace(',', '.');

    const numero = Number(textoNormalizado);
    return Number.isFinite(numero) ? numero : 0;
}

function alterarUsoPfBcnModalidade(chaveModalidade, valorDigitado) {
    const modalidade = estadoGlobal.modalidades.find(m => m.chaveModalidade === chaveModalidade);
    if (!modalidade || !modalidade.resultadoAtual) {
        return;
    }

    if (typeof definirModalidadeAtiva === 'function') {
        definirModalidadeAtiva(chaveModalidade);
    }

    const resultado = modalidade.resultadoAtual;
    if (!resultado.usoPfBcn) {
        return;
    }

    if (modalidade.chaveModalidade === 'RFB_CONTROVERSIA_JURIDICA') {
        const limiteControv = resultado.limiteMaximoPfBcn || 0;
        const valorControv = converterTextoMoedaBrParaNumero(valorDigitado);

        if (valorControv < 0 || valorControv > limiteControv) {
            modalidade.erroPfBcnPrincipal = `Informe um valor entre R$ 0,00 e R$ ${converterNumeroEmMoeda(limiteControv)}.`;
            renderizarQuadroResumo();
            return;
        }

        modalidade.erroPfBcnPrincipal = '';
        modalidade.valorPfBcnPersonalizado = valorControv;
        recalcularModalidade(chaveModalidade);
        return;
    }

    if (modalidade.chaveModalidade !== 'RFB_GERAL_50M') {
        return;
    }

    const tipoDebito = obterTipoDebitoAtivoRfb50m(modalidade);
    const limite = obterLimitePfBcnPorTipoDebito(resultado, tipoDebito);
    const valorValido = converterTextoMoedaBrParaNumero(valorDigitado);

    if (valorValido < 0 || valorValido > limite) {
        modalidade.erroPfBcnPrincipal = `Informe um valor entre R$ 0,00 e R$ ${converterNumeroEmMoeda(limite)}.`;
        renderizarQuadroResumo();
        return;
    }

    modalidade.erroPfBcnPrincipal = '';

    aplicarRecalculoUsoPfBcnRfb50m(resultado, tipoDebito, valorValido);
    sincronizarResultadoOpcaoAtivaRfb50m(modalidade, resultado);
    sincronizarSessionStorageRfb50m(modalidade);

    renderizarQuadroResumo();
}



// Funcoes de Filtro
function alterarOrdenacaoQuadroResumo(coluna) {
    const atual = estadoGlobal.interface.ordenacaoQuadroResumo;
    if (atual.coluna === coluna) {
        atual.direcao = atual.direcao === 'ASC' ? 'DESC' : 'ASC';
    } else {
        estadoGlobal.interface.ordenacaoQuadroResumo = { coluna, direcao: 'ASC' };
    }
    renderizarQuadroResumo();
}

function alterarFiltroPfBcn(valor) {
    estadoGlobal.interface.filtroPfBcnQuadroResumo = valor === '' ? null : (valor === 'SIM');
    renderizarQuadroResumo();
}

function obterModalidadesOrdenadasEFiltradas() {
    let lista = [...estadoGlobal.modalidades];

    // Aplica o filtro PF/BCN
    if (estadoGlobal.interface.filtroPfBcnQuadroResumo !== null) {
        lista = lista.filter(m => {
            const usoAtual = m.resultadoAtual && m.resultadoAtual.usoPfBcn;
            return usoAtual === estadoGlobal.interface.filtroPfBcnQuadroResumo;
        });
    }

    // Aplica a ordenação
    const { coluna, direcao } = estadoGlobal.interface.ordenacaoQuadroResumo;
    if (coluna) {
        const mapaCampo = {
            dividaSemReducao: (m) => obterDividaElegivelVisivelModalidade(m),
            reducaoPercentual: (m) => (m.resultadoAtual && m.resultadoAtual.reducaoPercentual) || 0,
            saldoDevedor: (m) => {
                // Se a função do vantagens-comparativas estiver disponível, usamos ela
                if (typeof obterValorSaldoVisivel === 'function') {
                    return obterValorSaldoVisivel(m);
                }
                return m.resultadoAtual?.saldoDevedorAposReducao || 0;
            }
        };
        
        lista.sort((a, b) => {
            const va = mapaCampo[coluna](a);
            const vb = mapaCampo[coluna](b);
            return direcao === 'ASC' ? va - vb : vb - va;
        });
    }
    return lista;
}

function obterTetoReducaoExibicao(modalidade) {
    if (modalidade.chaveModalidade !== 'RFB_GERAL_50M') {
        return null;
    }

    const tiposComTetoDeSetentaPorcento = ['PN', 'PN_OBITO', 'MEI', 'ME_EPP'];
    return tiposComTetoDeSetentaPorcento.includes(estadoGlobal.perfil.tipoContribuinte) ? 70 : 65;
}



/**
 * Atualiza visualmente o Quadro-Resumo Comparativo no HTML manipulando o DOM.
 */
function renderizarQuadroResumo() {
    const secaoQuadro = document.getElementById('id-quadro-resumo');
    const corpoTabela = document.getElementById('id-corpo-quadro-resumo');
    const containerTabela = document.getElementById('id-quadro-resumo-tabela-container');
    const estadoVazio = document.getElementById('id-quadro-resumo-vazio');

    // TRAVA DO FLUXO: Só renderiza se a etapa anterior foi confirmada
    if (!estadoGlobal.interface.simulacaoLiberada) {
        secaoQuadro.classList.add('d-none');
        return;
    }

    secaoQuadro.classList.remove('d-none');

    if (!estadoGlobal.modalidades || estadoGlobal.modalidades.length === 0) {
        containerTabela.classList.add('d-none');
        estadoVazio.classList.remove('d-none');
        return;
    }

    // Oculta o container "Sem dados"
    estadoVazio.classList.add('d-none');
    containerTabela.classList.remove('d-none');

    // NOVA CHAMADA DO MOTOR DE VANTAGENS AQUI
    calcularVantagensComparativas();

    // Limpa as linhas antigas antes de desenhar
    corpoTabela.innerHTML = '';

    if (typeof definirModalidadeAtiva === 'function') {
        const chaveAtiva = estadoGlobal.assistenteTributario?.chaveModalidadeAtiva;
        const modalidadeAtivaValida = estadoGlobal.modalidades.find(m =>
            m.chaveModalidade === chaveAtiva &&
            m.elegivel &&
            m.resultadoAtual
        );

        if (!modalidadeAtivaValida) {
            const modalidadeElegivel = estadoGlobal.modalidades.find(m => m.elegivel && m.resultadoAtual);
            if (modalidadeElegivel) {
                definirModalidadeAtiva(modalidadeElegivel.chaveModalidade);
            }
        }
    }

    // Varre o array (agora ordenado e filtrado) e constrói as <tr>'s dinâmicas
    obterModalidadesOrdenadasEFiltradas().forEach(modalidade => {
        corpoTabela.appendChild(construirLinhaModalidade(modalidade));
    });
}

function construirLinhaModalidade(modalidade) {
    const tr = document.createElement('tr');

    if (!modalidade.elegivel || !modalidade.resultadoAtual) {
        tr.innerHTML = `
            <td class="text-weight-semi-bold align-middle">
                ${modalidade.nomeExibicao}
                <span class="tooltip-ajuda" tabindex="0" aria-label="Prazo para adesão">
                    <i class="fas fa-circle-info icone-ajuda" aria-hidden="true"></i>
                    <span class="tooltip-texto">Prazo para Adesão: ${modalidade.prazoAdesao || '-'}</span>
                </span>
            </td>
            <td colspan="10" class="text-down-01 align-middle">
                <i class="fas fa-times-circle" style="color:#b00020;" aria-hidden="true"></i>
                Não elegível — ${modalidade.motivoInelegibilidade || 'motivo não informado'}
            </td>
        `;
        return tr;
    }

    const r = modalidade.resultadoAtual;
    
    // UX: Filtra as opções no select para NÃO MOSTRAR as que o usuário é inelegível (ex: Art 10 I)
    const optionsHtml = modalidade.opcoes.map((opcao, i) => {
        const testeElegibilidade = opcao.calcular(obterContextoCalculo(), null, null, modalidade.naturezaSelecionada);
        if (!testeElegibilidade.elegivel) return ''; // Ignora opções quebradas
        return `<option value="${i}" ${i === modalidade.opcaoSelecionadaIndex ? 'selected' : ''}>${opcao.rotulo}</option>`;
    }).join('');

    const codigoOpcaoAtiva = obterCodigoOpcaoAtivaModalidade(modalidade);
    const valorParcelasSaldoPrincipal =
        modalidade.chaveModalidade === 'RFB_GERAL_50M'
            ? (codigoOpcaoAtiva === 'PREVIDENCIARIO'
                ? (r.parcelasPrevidenciariasSelecionadas || r.numeroParcelas || 1)
                : (r.parcelasFazendariasSelecionadas || r.numeroParcelas || 1))
            : (r.numeroParcelas || 1);
    const valorPrestacaoSaldoPrincipal =
        modalidade.chaveModalidade === 'RFB_GERAL_50M'
            ? (codigoOpcaoAtiva === 'PREVIDENCIARIO'
                ? (r.valorPrestacaoPrevidenciaria || r.valorParcela || 0)
                : (r.valorPrestacaoFazendaria || r.valorParcela || 0))
            : (r.valorParcela || 0);
            
    // Identifica o valor que está sendo ativamente parcelado na coluna (sem a entrada)
    const valorSaldoPrincipal =
        modalidade.chaveModalidade === 'RFB_GERAL_50M'
            ? (codigoOpcaoAtiva === 'PREVIDENCIARIO'
                ? (r.saldoRemanescentePrevidenciario || 0)
                : (r.saldoRemanescenteFazendario || 0))
            : (r.saldoDevedorAposReducao || 0);

    let colunaParcelas = `<td class="align-middle text-center">R$ ${converterNumeroEmMoeda(valorSaldoPrincipal)} em ${valorParcelasSaldoPrincipal}x</td>`;
    
    if (modalidade.permiteEditarParcelas && r.parcelasMaximasReais) {
        const eventoTempoReal = modalidade.parcelasRecalculoEmTempoReal
            ? `oninput="alterarParcelasModalidade('${modalidade.chaveModalidade}', this.value)"`
            : '';

        colunaParcelas = `
            <td class="align-middle text-center">
                R$ ${converterNumeroEmMoeda(valorSaldoPrincipal)} em
                <div class="br-input d-inline-block mt-1">
                    <input type="number" 
                           value="${valorParcelasSaldoPrincipal}" 
                           min="1" 
                           max="${r.parcelasMaximasReais}" 
                           style="width: 60px; text-align: center; padding: 2px; border: 1px solid #1351b4; border-radius: 4px;"
                           ${eventoTempoReal}
                           onchange="alterarParcelasModalidade('${modalidade.chaveModalidade}', this.value)">
                </div> x
                <div class="text-down-01 mt-1 text-muted">R$ ${converterNumeroEmMoeda(valorPrestacaoSaldoPrincipal)}/parcela</div>
                <div class="text-down-01 mt-1 text-muted">Máx: ${r.parcelasMaximasReais}x</div>
            </td>
        `;
    }

    // Verifica se o valor da entrada é 0 para exibir o texto amigável
    let colunaEntrada = (r.entrada === 0 || r.entradaDesabilitada)
        ? `<td class="align-middle text-center text-muted">Sem Entrada</td>`
        : `<td class="align-middle text-center">R$ ${converterNumeroEmMoeda(r.entrada || 0)}${r.numeroParcelasEntrada ? ' em ' + r.numeroParcelasEntrada + 'x' : ''}</td>`;

    if (modalidade.permiteEditarParcelasEntrada) {
        if (r.entradaDesabilitada || r.entrada === 0) {
            colunaEntrada = `<td class="align-middle text-center text-muted">Sem Entrada</td>`;
        } else {
            colunaEntrada = `
                <td class="align-middle text-center">
                    R$ ${converterNumeroEmMoeda(r.entrada || 0)} em
                    <div class="br-input d-inline-block">
                    <input type="number" value="${r.numeroParcelasEntrada || 1}" min="1"
                        ${r.parcelasEntradaMaximasReais ? `max="${r.parcelasEntradaMaximasReais}"` : ''}
                        style="width: 55px; text-align: center; padding: 2px; border: 1px solid #1351b4; border-radius: 4px;"
                        onchange="alterarParcelasEntradaModalidade('${modalidade.chaveModalidade}', this.value)">
                    </div> x
                    <div class="text-down-01 mt-1 text-muted">R$ ${converterNumeroEmMoeda(r.valorParcelaEntrada || 0)}/parcela</div>
                    ${r.parcelasEntradaMaximasReais ? `<div class="text-down-01 mt-1 text-muted">Máx: ${r.parcelasEntradaMaximasReais}x</div>` : ''}
                </td>
            `;
        }
    }

    const tetoReducao = obterTetoReducaoExibicao(modalidade);
    // Nas modalidades sem alíquota efetiva exibida (RFB até 50 milhões) mostra o teto: "Até 70%".
    // Quando não há redução (ex.: Rating A/B), mostra apenas "0%".
    const semReducao = Number(r.reducaoPercentual || 0) <= 0;
    const percentualReducao = (tetoReducao === null || semReducao)
        ? Number(r.reducaoPercentual || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + '%'
        : `Até ${tetoReducao}%`;
    const colunaReducao = `<td class="align-middle text-center">${percentualReducao}</td>`;

    let colunaPfBcn = `<td class="align-middle text-center">${r.usoPfBcn ? 'SIM (até ' + r.percentualMaximoPfBcn + '%)' : 'NÃO'}</td>`;

    if (modalidade.chaveModalidade === 'RFB_GERAL_50M' && r.usoPfBcn) {
        const tipoDebito = obterTipoDebitoAtivoRfb50m(modalidade);
        const valorPfBcnAtual = obterValorPfBcnPorTipoDebito(r, tipoDebito);
        const limitePfBcnAtual = obterLimitePfBcnPorTipoDebito(r, tipoDebito);
        const mensagemErroPfBcn = modalidade.erroPfBcnPrincipal || '';
        const bordaPfBcn = mensagemErroPfBcn ? '#b00020' : '#1351b4';

        colunaPfBcn = `
            <td class="align-middle text-center">
                <div class="mt-1">
                    <input
                        type="text"
                        inputmode="decimal"
                        value="${converterNumeroEmMoeda(valorPfBcnAtual)}"
                        placeholder="0,00"
                        style="width: 155px; text-align: right; padding: 8px 12px; border: 1px solid ${bordaPfBcn}; border-radius: 4px; font-style: italic;"
                        oninput="validarValorNaoNegativo(this)"
                        onchange="alterarUsoPfBcnModalidade('${modalidade.chaveModalidade}', this.value)"
                    >
                </div>
                <div class="text-down-01 mt-1">Limite: R$ ${converterNumeroEmMoeda(limitePfBcnAtual)}</div>
                <div class="text-down-01 mt-1" style="color: #b00020; ${mensagemErroPfBcn ? '' : 'display:none;'}">${mensagemErroPfBcn}</div>
            </td>
        `;
    } else if (modalidade.chaveModalidade === 'RFB_CONTROVERSIA_JURIDICA' && r.usoPfBcn) {
        const valorPfBcnAtual = Number(modalidade.valorPfBcnPersonalizado);
        const valorExibicaoPfBcn = Number.isFinite(valorPfBcnAtual)
            ? valorPfBcnAtual
            : (r.valorPfBcn || 0);
        const limitePfBcnAtual = r.limiteMaximoPfBcn || 0;
        const mensagemErroPfBcn = modalidade.erroPfBcnPrincipal || '';
        const bordaPfBcn = mensagemErroPfBcn ? '#b00020' : '#1351b4';

        colunaPfBcn = `
            <td class="align-middle text-center">
                <div class="mt-1">
                    <input
                        type="text"
                        inputmode="decimal"
                        value="${converterNumeroEmMoeda(valorExibicaoPfBcn)}"
                        placeholder="0,00"
                        style="width: 155px; text-align: right; padding: 8px 12px; border: 1px solid ${bordaPfBcn}; border-radius: 4px; font-style: italic;"
                        oninput="validarValorNaoNegativo(this)"
                        onchange="alterarUsoPfBcnModalidade('${modalidade.chaveModalidade}', this.value)"
                    >
                </div>
                <div class="text-down-01 mt-1">Limite: R$ ${converterNumeroEmMoeda(limitePfBcnAtual)}</div>
                <div class="text-down-01 mt-1" style="color: #b00020; ${mensagemErroPfBcn ? '' : 'display:none;'}">${mensagemErroPfBcn}</div>
            </td>
        `;
    }

    const valorSaldoDevedorExibicao = obterSaldoDevedorVisivelModalidade(modalidade);

    // =========================================================================
    // ALTERAÇÃO 1: Construção do seletor de natureza ANTES de montar a string HTML
    // =========================================================================
    let seletorNaturezaHtml = '';
    if (modalidade.possuiSeletorNatureza) {
        seletorNaturezaHtml = `
            <div class="br-select mb-2">
                <div class="br-input">
                    <select class="p-2 bg-gray-10 text-weight-semi-bold" style="border: 1px solid #1351b4; border-radius: 4px; width: 100%; min-width: 200px;" onchange="alterarNaturezaModalidade('${modalidade.chaveModalidade}', this.value)">
                        <option value="FAZENDARIO" ${modalidade.naturezaSelecionada === 'FAZENDARIO' ? 'selected' : ''}>Débitos Fazendários</option>
                        <option value="PREVIDENCIARIO" ${modalidade.naturezaSelecionada === 'PREVIDENCIARIO' ? 'selected' : ''}>Débitos Previdenciários</option>
                    </select>
                </div>
            </div>
        `;
    }

    // Ícone de informação ao lado da Dívida Elegível (somente modalidades da PGFN):
    // explica o adicional de 10% e sua fundamentação legal.
    let tooltipAdicionalPgfnHtml = '';
    if (modalidade.chaveModalidade === 'PGFN_PEQUENO_VALOR' || modalidade.chaveModalidade === 'PGFN_CAPACIDADE_PAGAMENTO') {
        tooltipAdicionalPgfnHtml = `
            <span class="tooltip-ajuda" tabindex="0" aria-label="Informação sobre o adicional de 10%">
                <i class="fas fa-circle-info icone-ajuda icone-ajuda-escuro" aria-hidden="true"></i>
                <span class="tooltip-texto tooltip-texto-largo">
                    O adicional de <strong>10%</strong> é cobrado pela Procuradoria-Geral da Fazenda Nacional (PGFN) quando a dívida é inscrita em dívida ativa, mas <strong>paga antes de o processo ir para a Justiça (ajuizamento da execução fiscal).</strong> Fundamentação Legal:<br>
                    - Art. 1º do Decreto-Lei nº 1.025, de 21 de outubro de 1969;<br>
                    - Art. 3º do Decreto-Lei nº 1.569, de 8 de agosto de 1977.
                </span>
            </span>`;
    }

    // =========================================================================
    // Montagem final do HTML da linha (<tr>)
    // =========================================================================
    tr.innerHTML = `
        <td class="text-weight-semi-bold align-middle">
            ${modalidade.nomeExibicao}
            <span class="tooltip-ajuda" tabindex="0" aria-label="Prazo para adesão">
                <i class="fas fa-circle-info icone-ajuda" aria-hidden="true"></i>
                <span class="tooltip-texto">Prazo para Adesão: ${modalidade.prazoAdesao || '-'}</span>
            </span>
        </td>
        <td class="align-middle text-weight-semi-bold text-success" style="font-size: 1.0rem;">${(modalidade.vantagensCalculadas || []).join('<br>') || '—'}</td>
        <td class="align-middle text-center">R$ ${converterNumeroEmMoeda(modalidade.dividaSemReducao)}${tooltipAdicionalPgfnHtml}</td>
        
        <td class="align-middle">
            ${seletorNaturezaHtml} 
            <div class="br-select">
                <div class="br-input">
                    <select class="p-2" style="border: 1px solid #1351b4; border-radius: 4px; width: 100%; min-width: 200px;" onchange="alterarOpcaoModalidade('${modalidade.chaveModalidade}', this.value)">
                        ${optionsHtml}
                    </select>
                </div>
            </div>
        </td>
        
        ${colunaReducao}
        <td class="align-middle text-center text-weight-semi-bold" style="font-size: 1.15rem;">R$ ${converterNumeroEmMoeda(valorSaldoDevedorExibicao)}</td>
        
        ${colunaEntrada}
        ${colunaParcelas}
        ${colunaPfBcn}
        
        <td class="align-middle text-center">
            <a href="javascript:void(0)" onclick="abrirDetalhamentoModalidade('${modalidade.chaveModalidade}', '${modalidade.urlDetalhamento}')" title="Ver detalhes" style="font-size: 1.3rem; color:#1351b4; text-decoration:none;">
                <i class="fas fa-plus-circle" aria-hidden="true"></i>
            </a>
        </td>
    `;

    tr.addEventListener('click', () => {
        if (typeof definirModalidadeAtiva === 'function') {
            definirModalidadeAtiva(modalidade.chaveModalidade);
        }
    });

    return tr;
}

function alterarParcelasEntradaModalidade(chaveModalidade, parcelas) {
    const modalidade = estadoGlobal.modalidades.find(m => m.chaveModalidade === chaveModalidade);
    if (!modalidade) return;

    if (typeof definirModalidadeAtiva === 'function') {
        definirModalidadeAtiva(chaveModalidade);
    }

    // Atualiza o estado da entrada e re-renderiza
    modalidade.numeroParcelasEntradaPersonalizado = parseInt(parcelas, 10);
    recalcularModalidade(chaveModalidade);
}

function popularModalidades() {
    // Mantido apenas para compatibilidade legada.
    if (typeof recarregarTodasAsModalidades === 'function') {
        recarregarTodasAsModalidades();
    }
}