const estadoGlobal = {

    elementos: {

        secaoDebitos: null,
        secaoClassificacaoDebitos: null,
        secaoModalidadeTransacao: null,

        secaoDetalhamentoDescontos: null,
        secaoDetalhamentoEntrada: null,
        secaoDetalhamentoRestante: null,

        tabelaDebitos: null,
        tabelaDebitosBody: null,

        modal: null
    },

    contribuinte: {

        pessoaNatural: false,
        pessoaObito: false,

        meepp: false,
        demaisPJ: false,

        falido: false,
        baixado: false,
        recuperacaoJudicial: false,
        grupoEconomico: false,

        valorMinimo: 0,
        valorMinimoDarf: 10
    },

    calculos: {

        saldoDevedorAposDescontos: 0,
        saldoDevedorAposEntrada: 0,

        contadorDebitos: 0,
        contadorParcelasEntrada: 0,
        contadorParcelasRestante: 0
    },


    configuracao: {
        limiteValor: 50000000
    },

    // Compatibilidade com composicao-divida.js

    perfil: {
        tipoContribuinte: null,     // 'PN', 'PN_OBITO', 'ME_EPP' ou 'DEMAIS_PJ'
        isOrgaoPublico: false,      // true ou false
        situacaoCadastral: {
            falidoRecuperacao: false, // Falido / Recuperação / Liquidação
            baixadoInapto: false      // Baixado / Inapto / Suspenso
        },
        ratingForcadoD: false       // true se preencher os requisitos drásticos (óleo/falência)
    },
    modoSimulacaoDivida: null,      // 'AGREGADO' ou 'POR_DEBITO'
    debitosAgregados: {
        principal: 0,
        multa: 0,
        juros: 0,
        total: 0
    },
    debitos: [],
    totalDebitos: 0 ,
    modalidades: [],
    // Outros dados como capacidade de pagamento (Capag) entrarão aqui nas próximas issues.
    interface: {
        modalCapagExibido: false,
        simulacaoLiberada: false, // <--- NOVA FLAG ADICIONADA AQUI
        ordenacaoQuadroResumo: { coluna: null, direcao: 'ASC' },
        filtroPfBcnQuadroResumo: null
    }

};

/**
 * Função acionada sempre que algum campo do Módulo 1 (Perfil) é alterado.
 * Atualiza o objeto de estado global, recalcula flags e renderiza os blocos da tela.
 */
function atualizarPerfilContribuinte() {
    // 1. Captura o Tipo de Contribuinte
    const tipoEl = document.querySelector('input[name="tipo_contribuinte"]:checked');
    estadoGlobal.perfil.tipoContribuinte = tipoEl ? tipoEl.value : null;

    // 2. Captura "É Órgão Público?"
    const orgaoPubEl = document.querySelector('input[name="orgao_publico"]:checked');
    estadoGlobal.perfil.isOrgaoPublico = orgaoPubEl ? (orgaoPubEl.value === 'S') : false;

    // 3. Regra de Exibição da Situação Cadastral
    // Só aparece se for Pessoa Jurídica (ME_EPP ou DEMAIS_PJ)
    const containerSituacao = document.getElementById('id-opcoes-contribuintes');
    
    if (['MEI', 'ME_EPP', 'DEMAIS_PJ'].includes(estadoGlobal.perfil.tipoContribuinte)) {
        containerSituacao.classList.remove('d-none');
    } else {
        containerSituacao.classList.add('d-none');
        
        // Se ocultar o menu, desmarca os checkboxes para não manter sujeira no estado global
        document.getElementById('sit-falido').checked = false;
        document.getElementById('sit-baixado').checked = false;
    }

    // 4. Captura a Situação Cadastral Específica
    estadoGlobal.perfil.situacaoCadastral.falidoRecuperacao = document.getElementById('sit-falido').checked;
    estadoGlobal.perfil.situacaoCadastral.baixadoInapto = document.getElementById('sit-baixado').checked;

    // 5. Validação de Rating Forçado
    // Se for PN Falecido ou PJ com situação cadastral crítica, o Rating D é travado no sistema.
    if (
        estadoGlobal.perfil.tipoContribuinte === 'PN_OBITO' || 
        estadoGlobal.perfil.situacaoCadastral.falidoRecuperacao || 
        estadoGlobal.perfil.situacaoCadastral.baixadoInapto
    ) {
        estadoGlobal.perfil.ratingForcadoD = true;
    } else {
        estadoGlobal.perfil.ratingForcadoD = false;
    }

    // 6. Exibição da Próxima Etapa (Composição da Dívida)
    // Destrava a seção de Composição apenas se um tipo de contribuinte foi selecionado
    if (estadoGlobal.perfil.tipoContribuinte) {
        document.getElementById('id-composicao-divida').classList.remove('d-none');
    }

    // 7. Esconde as etapas seguintes para forçar o recálculo se o perfil mudar
    estadoGlobal.interface.simulacaoLiberada = false;
    document.getElementById('id-classificacao-debitos')?.classList.add('d-none');
    document.getElementById('id-quadro-resumo')?.classList.add('d-none');

    // 8. Re-avalia elegibilidade de todas as modalidades mediante mudança de perfil
    if (typeof recarregarTodasAsModalidades === 'function') {
        recarregarTodasAsModalidades();
    }
}

// ==============================================================================
// GERENCIADOR DE MODAL (SCRIM) GLOBAL DO SISTEMA
// ==============================================================================

let modalGenerico;

document.addEventListener('DOMContentLoaded', () => {
    const modalScrim = document.querySelector('#modal-scrim');
    if (modalScrim && typeof core !== 'undefined') {
        modalGenerico = new core.Scrim({
            closeElement: '[data-dismiss="true"]', // Fecha ao clicar nos botões nativos (X ou Entendi)
            trigger: modalScrim, 
            escEnable: true, 
            limitTabKey: true
        });
    }
});



// OBRIGATORIO PARA BRSELECT
const notFoundElement = `
            <div class="br-item not-found">
            <div class="container">
            <div class="row">
                <div class="col">
                <p><strong>Ops!</strong> Não encontramos o que você está procurando!</p>
                </div>
            </div>
            </div>
            </div>
        `

// ATRIBUICAO DE VALORES
document.addEventListener('DOMContentLoaded', function() {
    estadoGlobal.elementos.secaoDebitos =
        document.querySelector('#id-composicao-divida');

    estadoGlobal.elementos.secaoClassificacaoDebitos =
        document.querySelector('#id-classificacao-debitos');

    estadoGlobal.elementos.secaoModalidadeTransacao =
        document.querySelector('#id-modalidade-transacao');

    estadoGlobal.elementos.secaoDetalhamentoDescontos =
        document.querySelector('#id-detalhamento-descontos');

    estadoGlobal.elementos.secaoDetalhamentoEntrada =
        document.querySelector('#id-detalhamento-entrada');

    estadoGlobal.elementos.secaoDetalhamentoRestante =
        document.querySelector('#id-detalhamento-restante');

    estadoGlobal.elementos.tabelaDebitosBody =
    document.getElementById('id-corpo-tabela-debitos');

    const modalScrim =
        document.querySelector('#modal-scrim');

    estadoGlobal.elementos.modal =
        new core.Scrim({
            closeElement: '.clicktoclose',
            trigger: modalScrim,
            escEnable: true,
            limitTabKey: true
        });
});


// EXIBE MODAL
function showModal(mensagem) {
    let elementoDaMensagem = document.querySelector('#id-elemento-mensagem');
    elementoDaMensagem.innerHTML = mensagem ? mensagem : '';
    estadoGlobal.elementos.modal.showScrim(); // Exibe o modal
}

//---------------FUNCOES PARA A CLASSIFICACAO DOS DEBITOS--------------------//

function isRatingD() {

    return estadoGlobal.perfil.ratingForcadoD;
}

// FUNCAO QUE CALCULA RATING
function calcularRating(elemento) {
    
    reiniciarFormulario(elemento);
    
    let totalDebitos = document.querySelector('#totalDebitos');
    let totalDebitosTransacionar =
    document.querySelector('#totalDebitosTransacionar')?.value || '0';
    totalDebitosTransacionar =
    converterStringEmNumero(totalDebitosTransacionar);
    let totalDebitosNaoContencioso = document.querySelector('#totalDebitosNaoContencioso').value;
    let capag = document.querySelector('#caPag').value;
    let relacaoDebitosCaPag = document.querySelector('#relacaoDebitosCaPag');
    let descontoTeorico = document.querySelector('#descontoTeorico');
    let rating = document.querySelector('#rating');
    let descontoMaximo = 0;

    // CALCULA O TOTAL DOS DÉBITOS
    let valorNaoContencioso = totalDebitosNaoContencioso !== '' ? converterStringEmNumero(totalDebitosNaoContencioso) : 0;
    totalDebitos.value = converterNumeroEmMoeda(totalDebitosTransacionar + valorNaoContencioso);

    // CALCULA A RELAÇÃO DE DÉBITOS COM A CAPACIDADE DE PAGAMENTO
    if (capag == '0,00' || capag === '0' || capag === ''){
        relacaoDebitosCaPag.value = converterStringEmNumero(document.querySelector('#totalDebitos').value) + "%";
    }else{
        relacaoDebitosCaPag.value = (((converterStringEmNumero(document.querySelector('#totalDebitos').value) / converterStringEmNumero(capag))*100)).toFixed(2) + '%';
    }

    // CALCULA O RATING
    if (isRatingD()) {
        rating.value = 'D';
    } else {
        if (converterStringEmNumero(relacaoDebitosCaPag.value)/10000 <= 0.5) {
            rating.value = 'A';
        } else if (converterStringEmNumero(relacaoDebitosCaPag.value)/10000 <= 1) {
            rating.value = 'B';
        } else if (converterStringEmNumero(relacaoDebitosCaPag.value)/10000 <= 2) {
            rating.value = 'C';
        } else {
            rating.value = 'D';
        }
    }

    // CALCULA DESCONTO MÁXIMO
    if (estadoGlobal.perfil.tipoContribuinte === 'DEMAIS_PJ' && !estadoGlobal.perfil.situacaoCadastral.falidoRecuperacao) {
        descontoMaximo = 0.65;
    } else {
        descontoMaximo = 0.70;
    }

    // =========================================================
    // CALCULA O DESCONTO TEORICO
    // =========================================================
    let valorDecimalDesconto = 0; // Armazena o valor bruto (ex: 0.70) para os cálculos

    if (rating.value == 'A' || rating.value == 'B'){
        valorDecimalDesconto = 0;
        descontoTeorico.value = '0,00%';
    } else if (rating.value == 'D'){
        valorDecimalDesconto = descontoMaximo;
        descontoTeorico.value = (descontoMaximo * 100).toFixed(2).replace('.', ',') + '%';
    } else {
        // Regra do Rating C
        valorDecimalDesconto = descontoMaximo * ((converterStringEmNumero(relacaoDebitosCaPag.value)/10000) - 1);
        descontoTeorico.value = (valorDecimalDesconto * 100).toFixed(2).replace('.', ',') + '%';
    }
    if (typeof recarregarTodasAsModalidades === 'function') {
        recarregarTodasAsModalidades();
    }

    // Grava a Capag no Estado Global para que a PGFN possa ler
    estadoGlobal.capag = {
        totalDebitos: converterStringEmNumero(totalDebitos.value),
        capag: converterStringEmNumero(capag),
        relacaoDebitosCaPag: converterStringEmNumero(relacaoDebitosCaPag.value) / 100,
        rating: rating.value,
        
        // CORREÇÃO: Enviamos a variável tipo Number crua, escapando do bug do parse da String!
        descontoTeorico: valorDecimalDesconto,

        // RATING POR ÓRGÃO (fonte única da verdade — ver utils.js > obterDadosClassificacaoPGFN/RFB):
        // a PGFN considera só a dívida na PGFN; a RFB soma PGFN + débitos que deseja transacionar.
        // Calculados aqui, na página principal (onde os campos do formulário existem), e
        // "congelados" neste objeto para que as páginas de detalhe — que não têm esses campos
        // no DOM — usem exatamente o mesmo valor mostrado no Quadro-Resumo, sem recalcular.
        pgfn: obterDadosClassificacaoPGFN(),
        rfb: obterDadosClassificacaoRFB()
    };

    atualizarResumoCalculos();

    popularModalidades();
}

// Atualiza o painel "Resumo dos Cálculos" (PGFN vs RFB) a partir dos ratings já
// calculados e armazenados em estadoGlobal.capag — não recalcula nada por conta própria,
// evitando uma segunda fórmula de rating que poderia divergir da usada pelas modalidades.
function atualizarResumoCalculos() {
    const valorPgfn = document.getElementById('resumoDividaPgfn');
    const valorRfb = document.getElementById('resumoBaseRfb');
    const ratingPgfn = document.getElementById('resumoRatingPgfn');
    const ratingRfb = document.getElementById('resumoRatingRfb');

    const dadosPgfn = estadoGlobal.capag.pgfn;
    const dadosRfb = estadoGlobal.capag.rfb;

    if (valorPgfn) valorPgfn.textContent = `R$ ${converterNumeroEmMoeda(dadosPgfn.dividaBase || 0)}`;
    if (valorRfb) valorRfb.textContent = `R$ ${converterNumeroEmMoeda(dadosRfb.dividaBase || 0)}`;
    if (ratingPgfn) ratingPgfn.textContent = dadosPgfn.rating || '-';
    if (ratingRfb) ratingRfb.textContent = dadosRfb.rating || '-';
}


// REINICIA FORMULÁRIO
function reiniciarFormulario(elemento) {
    const btnGerarDocumento =
    document.querySelector('#id-btn-gerar-documento');

    if (btnGerarDocumento) {
        btnGerarDocumento.classList.add('d-none');
    }                                                    // Esconde seção botão gerar documento

    // Obtém todas as seções em ordem
    const secoes = Array.from(document.querySelectorAll('.secao'));
    // Encontra a seção atual (a mais próxima do elemento)
    const secaoAtual = elemento.closest('.secao');
    const idxAtual = secoes.indexOf(secaoAtual);

    // Identifica se o elemento é um dos radios da identificação do contribuinte
    const isRadioIdentificacao = (
        secaoAtual && secaoAtual.id === 'id-identificacao-do-contribuinte' &&
        elemento.type === 'radio'
    );
    // Identifica se é um dos checkboxes de condição do contribuinte
    const isCondicaoCheckbox =
        ['recuperacaoJudicial', 'falido', 'baixado'].includes(elemento.id);

    if (isRadioIdentificacao) {
        // desmarca todos os checkboxes de condição do contribuinte
        document.querySelectorAll('.contribuinte').forEach(checkbox => {
            if (checkbox.type === 'checkbox') {
                checkbox.checked = false;
                checkbox.removeAttribute('disabled');
            }
        });
    }

    if (isRadioIdentificacao || isCondicaoCheckbox) {
        // Limpa a tabela de débitos
        estadoGlobal.elementos.tabelaDebitosBody.innerHTML = '';
        // Garante que apenas as seções até id-detalhamento-creditos-tributarios fiquem visíveis
        let mostrar = ['id-identificacao-do-contribuinte', 'id-opcoes-contribuintes', 'id-detalhamento-creditos-tributarios'];
        secoes.forEach(secao => {
            if (mostrar.includes(secao.id)) {
                secao.classList.remove('d-none');
            } else {
                secao.classList.add('d-none');
            }
        });
        return;
    }

    // Esconde e limpa todas as seções seguintes à atual
    secoes.forEach((secao, idx) => {
        if (idx > idxAtual) {
            secao.classList.add('d-none');
            // Limpa inputs, selects e textareas dentro da seção
            secao.querySelectorAll('input, select').forEach(input => {
                if (input.type === 'checkbox' || input.type === 'radio') {
                    input.checked = false;
                } else {
                    input.value = '';
                }
            });
            // Limpa tabelas dentro da seção
            if (secao.id === 'id-detalhamentos-descontos' || secao.id === 'id-detalhamento-entrada' || secao.id == 'id-detalhamento-utilizacao-pf-bcn' || secao.id === 'id-detalhamento-restante') {
                secao.querySelectorAll('tbody').forEach(tbody => tbody.innerHTML = '');
            }
        }
    });
}

function mostrarAjudaCapag() {

    if (estadoGlobal.interface.modalCapagExibido) {
        return;
    }

    estadoGlobal.interface.modalCapagExibido = true;

    showModal(`
        Obtenha essa informação no site
        <strong>Regularize (PGFN)</strong>,
        conforme o link abaixo:<br><br>

        <a
            href="https://www.regularize.pgfn.gov.br/"
            target="_blank"
            rel="noopener noreferrer">
            Regularize
        </a>
    `);
}


// REINICIAR AS FLAGS DE IDENTIFICAÇÂO CASO NECESSARIO
function resetarCondicoesContribuinte() {
    estadoGlobal.contribuinte.falido = false;
    estadoGlobal.contribuinte.baixado = false;
    estadoGlobal.contribuinte.grupoEconomico = false;
    estadoGlobal.contribuinte.recuperacaoJudicial = false;
}

// LIDA COM VALIDAÇÃO DE VALOR NÃO NEGATIVO
function handleValidarValorNaoNegativo(element) {
    const isValid = validarValorNaoNegativo(element);
    // Se o retorno for falso, exibe o modal
    if (!isValid) {
        showModal(mensagem="Valor inválido! Valor deve ser numérico e maior ou igual a zero.");
    }
}
