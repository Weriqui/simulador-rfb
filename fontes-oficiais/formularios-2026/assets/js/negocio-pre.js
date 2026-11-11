// SECOES, TABELAS, MODAL
let secaoDebitos;
let secaoClassificacaoDebitos;
let secaoModalidadeTransacao;
let secaoDetalhamentoDescontos;
let secaoDetalhamentoEntrada;
let secaoDetalhamentoRestante;
let divDemaisOpcoesContribuintes;
let tabelaDebitos;
let tabelaDebitosBody;
let modal;
window.nomePdf = "DISCRIMINATIVOTRANSACAODEBITOSPREVIDENCIARIOS.pdf";

// VARIAVEIS PARA POPULAR TABELA DE ENTRADA
let nParcelasEntrada;
let nParcelasRestante;
let parcelaAposEntrada
let valorEntrada;
let saldoDevedorAposEntrada;
let saldoDevedorAposDescontos;
let saldoDevedorAposPf;
let saldoParaCalculoRestante;
let saldoParaCalculoPf;
let comPrejuizo;
let saldoDevedorMJE; // Saldo devedor após multa, juros e encargos legais


// CONTADORES
let contadorDebitos = 0;
let contadorParcelasEntrada = 0;
let contadorParcelasRestante = 0;

// IDENTIFICACAO CONTRIBUINTE
let isPessoaNatural;
let isPessoaObito;
let isMEEPP;
let isdemaisPJ;
let valorMinimo = 0;
let valorMinimoDarf = 10;

let isRatingD;

// CONDICAO CONTRIBUINTE
let isFalido;
let isBaixado;
let isGrupoEconomico;
let isRecuperacaoJudicial;

// CALCULO ENTRADA E PARCELAMENTO
let totalPrevidenciario;


let limiteValor = 50000000;

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
    secaoDebitos = document.querySelector('#id-detalhamento-creditos-tributarios');
    secaoClassificacaoDebitos = document.querySelector('#id-classificacao-debitos');
    secaoModalidadeTransacao = document.querySelector('#id-modalidade-transacao');
    secaoDetalhamentoDescontos = document.querySelector('#id-detalhamento-descontos');
    secaoDetalhamentoEntrada = document.querySelector('#id-detalhamento-entrada');
    secaoDetalhamentoRestante = document.querySelector('#id-detalhamento-restante');
    divDemaisOpcoesContribuintes = document.querySelector('#id-demais-opcoes-contribuintes');

    // Instancia do modal
    const modalScrim = document.querySelector('#modal-scrim');
    const scrimInstance = new core.Scrim({closeElement: '.clicktoclose', trigger: modalScrim, escEnable: true, limitTabKey: true});
    modal = scrimInstance;

    // TABELAS
    tabelaDebitos = document.querySelector('#tabelaDebitos');
    tabelaDebitosBody = document.getElementById('tabelaDebitosBody');
})

// EXIBE MODAL
function showModal(mensagem) {
    let elementoDaMensagem = document.querySelector('#id-elemento-mensagem');
    elementoDaMensagem.innerHTML = mensagem ? mensagem : '';
    modal.showScrim(); // Exibe o modal
}


//-------------FUNCOES PARA IDENTIFICACAO DO CONTRIBUINTE--------------------//

// IDENTIFICACAO DO CONTRIBIUNTE
function identificacaoContribuinte(elemento) {
    isPessoaNatural = false;
    isPessoaObito = false;
    isMEEPP = false;
    isdemaisPJ = false;
    isRatingD = false;

    resetarCondicoesContribuinte();

    // Mostra a seção de débitos
    secaoDebitos.classList.remove('d-none');

    if (elemento.getAttribute('data-contribuinte') == 'pessoa-natural') {
        valorMinimo = 200;
        isPessoaNatural = true;
        document.querySelector('#id-opcoes-contribuintes').classList.add('d-none');
        showModal(mensagem="O valor mínimo de qualquer parcela <strong>(entrada ou valor restante)</strong> para Pessoa Natural é de <strong>R$200,00</strong>");
    } else if (elemento.getAttribute('data-contribuinte') == 'pessoa-obito') {
        valorMinimo = 200;
        isPessoaObito = true;
        isRatingD = true;
        document.querySelector('#id-opcoes-contribuintes').classList.add('d-none');
        showModal(mensagem="O valor mínimo de qualquer parcela <strong>(entrada ou valor restante)</strong> para Pessoa Natural com indicativo de óbito é de <strong>R$200,00</strong>");
    } else if (elemento.getAttribute('data-contribuinte') == 'me-epp') {
        valorMinimo = 300;
        isMEEPP = true;
        document.querySelector('#id-opcoes-contribuintes').classList.remove('d-none');
        showModal(mensagem="O valor mínimo de qualquer parcela <strong>(entrada ou valor restante)</strong> para ME, EPP, Santas Casas de Misericórdia, Sociedades Cooperativas e demais organizações da sociedade civil de que trata a Lei nº 13.019, de 31 de julho de 2014 ou instituições de ensino é de <strong>R$300,00</strong>");
    } else if (elemento.getAttribute('data-contribuinte') == 'demais-pj') {
        valorMinimo = 300;
        isdemaisPJ = true;
        document.querySelector('#id-opcoes-contribuintes').classList.remove('d-none');
        showModal(mensagem="O valor mínimo de qualquer parcela <strong>(entrada ou valor restante)</strong> para Demais PJ é de <strong>R$300,00</strong>");
    }
}

// DEFINE CONDICAO CONTRIBUINTE
function definirCondicaoContribuinte(elemento) {
    const falidoCheckbox = document.querySelector('#falido');
    const baixadoCheckbox = document.querySelector('#baixado');
    const recuperacaoJudicialCheckbox = document.querySelector('#recuperacaoJudicial');

    const condicao = elemento.getAttribute('data-condicao');

    if (condicao == 'recuperacaoJudicial') {
        isRecuperacaoJudicial = recuperacaoJudicialCheckbox?.checked || false;

        if (isRecuperacaoJudicial) {
            if (falidoCheckbox) {
                falidoCheckbox.checked = false;
                falidoCheckbox.setAttribute('disabled', '');
            }

            if (baixadoCheckbox) {
                baixadoCheckbox.checked = false;
                baixadoCheckbox.setAttribute('disabled', '');
            }

            isFalido = false;
            isBaixado = false;
        } else {
            if (falidoCheckbox) falidoCheckbox.removeAttribute('disabled');
            if (baixadoCheckbox) baixadoCheckbox.removeAttribute('disabled');
        }

    } else if (condicao == 'falido') {
        isFalido = elemento.checked;

    } else if (condicao == 'baixado') {
        isBaixado = elemento.checked;

    } else if (condicao == 'grupoEconomico') {
        isGrupoEconomico = elemento.checked;

        if (isGrupoEconomico) {
            showModal(mensagem="Junto com o pedido de adesão deverá ser apresentado o reconhecimento expresso de que o contribuinte integra gupo econômico, de direito ou de fato, reconhecido ou não em decisão administrativa ou judicial. Deverá listar todas as partes relacionadas, admitindo a inserção destes como corresponsáveis tributário nos sistemas da RFB.");
        }
    }

    isRatingD = isPessoaObito || isFalido || isBaixado || isRecuperacaoJudicial;
}




//-------------FUNCOES PARA A TABELA DE DETALHAMENTO DE CREDITOS--------------------//

// INCLUI NOVA LINHA NA TABELA DE DEBITOS
function incluirNovoDebito(){
    let linhas = tabelaDebitosBody.rows;

    // verifica se não existe linha na tabela para adicionar a linha do total
    if (linhas.length == 0) {
        let templateTotalGeral = document.querySelector('#id-template-total-geral').content.cloneNode(true);
        tabelaDebitosBody.appendChild(templateTotalGeral);
    }

    // Clona o template da linha de débito
    let template = document.querySelector('#id-template-debito').content.cloneNode(true);

    let ultimaLinha = tabelaDebitosBody.lastElementChild; // Última linha da tabela
    tabelaDebitosBody.insertBefore(template, ultimaLinha);

    // Anexa listener ao input de processo da nova linha para evitar duplicatas
    let linhaInserida = ultimaLinha.previousElementSibling;
    if (linhaInserida) {
        const inputProcesso = linhaInserida.querySelector('.nroProcesso');
        if (inputProcesso) {
            inputProcesso.addEventListener('change', function() {
                handleValidarProcesso(this);
                verificarProcessoUnico(this);
            });
            // Também verifica ao perder o foco
            inputProcesso.addEventListener('blur', function() {
                verificarProcessoUnico(this);
            });
        }
    }

}


// EXCLUI LINHA DA TABELA DEBITOS
function excluirLinha(botao) {
    const linha = botao.closest('tr'); // Encontra a linha mais próxima do botão clicado
    if (linha && tabelaDebitosBody.rows.length === 2) {
        tabelaDebitosBody.innerHTML = '';
    } else {
        linha.remove();
        recalcularTotalGeral();
    }
}

// REINICIA FORMULÁRIO
function reiniciarFormulario(elemento) {
    document.querySelector('#id-btn-gerar-documento').classList.add('d-none'); // Esconde seção botão gerar documento

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
        tabelaDebitosBody.innerHTML = '';
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


// REINICIAR AS FLAGS DE IDENTIFICAÇÂO CASO NECESSARIO
function resetarCondicoesContribuinte() {
    isFalido = false;
    isBaixado = false;
    isGrupoEconomico = false;
    isRecuperacaoJudicial = false;
}


// LIDA COM VALIDAÇÃO DE PROCESSO
function handleValidarProcesso(element) {
    const isValid = validarProcesso(element);
    // Se o retorno for falso, exibe o modal
    if (!isValid) {
        showModal(mensagem="Número do processo inválido! O número do processo deve conter 15 ou 17 dígitos.");
    }
}

// VERIFICA SE O NUMERO DO PROCESSO JA EXISTE EM OUTRA LINHA
function verificarProcessoUnico(element) {
    const numero = element.value.replace(/\D/g, '');
    if (!numero) return true;

    let ocorrencias = 0;
    document.querySelectorAll('.nroProcesso').forEach(input => {
        if (input.value.replace(/\D/g, '') === numero) ocorrencias++;
    });

    if (ocorrencias > 1) {
        showModal(mensagem=`O número do processo informado já existe em outra linha. Por favor, informe um processo diferente ou remova a outra linha.`);
        element.value = '';
        return false;
    }
    return true;
}

// LIDA COM VALIDAÇÃO DE VALOR NÃO NEGATIVO
function handleValidarValorNaoNegativo(element) {
    const isValid = validarValorNaoNegativo(element);
    // Se o retorno for falso, exibe o modal
    if (!isValid) {
        showModal(mensagem="Valor inválido! Valor deve ser numérico e maior ou igual a zero.");
    }
}

// CALCULA O VALOR TOTAL DO PROCESSO
function calcularValorTotalProcesso(element) {
    let principal = element.closest('tr').querySelector('.principal');
    let multa = element.closest('tr').querySelector('.multa');
    let juros = element.closest('tr').querySelector('.juros');
    let total = element.closest('tr').querySelector('.total');
    let principalValor = converterStringEmNumero(principal.value ? principal.value : '0');
    let multaValor = converterStringEmNumero(multa.value ? multa.value : '0');
    let jurosValor = converterStringEmNumero(juros.value ? juros.value : '0');
    let totalValor = principalValor + multaValor + jurosValor;
    if (totalValor > limiteValor) {
        total.value = '';
        showModal(mensagem=`Esta modalidade não se aplica a valores acima de R$ ${converterNumeroEmMoeda(limiteValor)} por contencioso.`);
    }
    else {
        total.value = converterNumeroEmMoeda(totalValor);
        recalcularTotalGeral();
    }
}


// RECALCULA TOTAL GERAL
function recalcularTotalGeral(){
    let totalGeral = document.getElementById('totalGeral');
    let totais = tabelaDebitosBody.querySelectorAll('.total');
    let totalTemporario = 0;
    totais.forEach(total => {
        totalTemporario += converterStringEmNumero(total.value? total.value : '0');
    })
    totalGeral.value = converterNumeroEmMoeda(totalTemporario);

    reiniciarFormulario(document.querySelector('#totalGeral'));
}

// FUNCAO ACIONADO AO CLICAR NO BOTAO CONFIRMAR TOTAL DEBITOS
function confirmarTotalDebitos(elemento) {

    if (tabelaDebitosBody.rows.length === 0) {
        showModal(mensagem='Insira pelo menos um débito para prosseguir.');
        return
    }

    // VERIFICA SE TODOS OS CAMPOS OBRIGATORIOS ESTÃO PREENCHIDOS
    if (validarCamposObrigatoriosPorSecao('id-detalhamento-creditos-tributarios')) {

        // VERIFICA SE O VALOR TOTAL DOS DEBITOS ATENDE AO PISO DO DARF
        let totaisPorProcesso = document.querySelectorAll('.total');
        for(let total of totaisPorProcesso){
            if (converterStringEmNumero(total.value) < valorMinimoDarf) {
                showModal(mensagem=`Esta transação não é possível, pois o <strong>valor total dos débitos</strong> deve ser, no mínimo, de <strong>R$ ${converterNumeroEmMoeda(valorMinimoDarf)}</strong> (DARF).`);
                return false;
            }
            
        }

        // VALIDAÇÃO POR PROCESSO: soma os débitos que tenham o mesmo número de processo
        const mapaProcessos = {};
        const linhas = tabelaDebitosBody.querySelectorAll('tr');
        linhas.forEach(linha => {
            const procInput = linha.querySelector('.nroProcesso');
            const totalInput = linha.querySelector('.total');
            if (procInput && totalInput) {
                const proc = procInput.value.replace(/\D/g, '');
                const valor = converterStringEmNumero(totalInput.value ? totalInput.value : '0');
                if (proc) {
                    mapaProcessos[proc] = (mapaProcessos[proc] || 0) + valor;
                }
            }
        });

        for (const proc in mapaProcessos) {
            if (mapaProcessos[proc] > limiteValor) {
                showModal(mensagem=`O processo ${proc} acumula o total de R$ ${converterNumeroEmMoeda(mapaProcessos[proc])}, que excede o limite de R$ ${converterNumeroEmMoeda(limiteValor)} por contencioso.`);
                return false;
            }
        }

        // MOSTRA A SEÇÃO DE CLASSIFICAÇÃO DOS DEBITOS
        secaoClassificacaoDebitos.classList.remove('d-none');

        // RECUPERA O VALOR TOTAL DOS DEBITOS E TRANSFERE PARA A SEÇÃO DE CLASSIFICAÇÃO
        document.querySelector('#totalDebitosTransacionar').value = document.querySelector('#totalGeral').value;
    }
    else {
        showModal(mensaagem='Exclua linhas vazias e preencha todos os campos antes de prosseguir!');
    }
}




//---------------FUNCOES PARA A CLASSIFICACAO DOS DEBITOS--------------------//


// FUNCAO QUE CALCULA RATING
function calcularRating(elemento) {
    
    reiniciarFormulario(elemento);
    
    let totalDebitos = document.querySelector('#totalDebitos');
    let totalDebitosTransacionar = converterStringEmNumero(document.querySelector('#totalDebitosTransacionar').value);
    let totalDebitosNaoContencioso = document.querySelector('#totalDebitosNaoContencioso').value;
    let capag = document.querySelector('#caPag').value;
    let relacaoDebitosCaPag = document.querySelector('#relacaoDebitosCaPag');
    let descontoTeorico = document.querySelector('#descontoTeorico');
    let rating = document.querySelector('#rating');
    let descontoMaximo = 0;

    // CALCULA O TOTAL DOS DÉBITOS
    if (totalDebitosNaoContencioso !== '') {
        totalDebitos.value = converterNumeroEmMoeda(totalDebitosTransacionar + converterStringEmNumero(totalDebitosNaoContencioso));
    } else {
        showModal(mensagem='O valor <strong>Total dos débitos não incluídos no contencioso administrativo fiscal</strong> deve ser preenchido');
        return false;
    }

    // CALCULA A RELAÇÃO DE DÉBITOS COM A CAPACIDADE DE PAGAMENTO
    if (capag === '0,00' || capag === '0' || capag === '') {
        relacaoDebitosCaPag.value = converterStringEmNumero(document.querySelector('#totalDebitos').value) + "%";
    }else{
        relacaoDebitosCaPag.value = (((converterStringEmNumero(document.querySelector('#totalDebitos').value) / converterStringEmNumero(capag))*100)).toFixed(2) + '%';
    }

    // CALCULA O RATING
    if (isRatingD) {
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
    if (isdemaisPJ){
        descontoMaximo = 0.65;
    }else{
        descontoMaximo = 0.7;
    }

    // CALCULA O DESCONTO TEORICO
    if (rating.value == 'A' || rating.value == 'B'){
        descontoTeorico.value = '0,00%';
    } else if (rating.value == 'D'){
        descontoTeorico.value = (descontoMaximo * 100).toFixed(2) + '%';
    } else {
        descontoTeorico.value = (descontoMaximo * ((converterStringEmNumero(relacaoDebitosCaPag.value)/10000 -1))*100).toFixed(2) + '%';
    }
}

// FUNCAO ACIONADA PELO BOTAO SELECIONAR MODALIDADE QUE VALIDA CAMPOS OBRIGATORIOS E EXIBE A SEÇÃO MODADALIDADE DE TRANSAÇÃO
function selecionarModalidade(elemento) {

    reiniciarFormulario(elemento);

    let rating = document.querySelector('#rating').value;
    let desconto_teorico = document.querySelector('#descontoTeorico').value;
    if (validarCamposObrigatoriosPorSecao('id-classificacao-debitos')) {

        secaoModalidadeTransacao.classList.remove('d-none'); // Exibe a seção de modalidade de transação

        // Lista de todas as divs relacionadas à modalidade
        const divsModalidade = [
            '#id-ab-pessoa-natural',
            '#id-cd-pessoa-natural',
            '#id-d-pessoa-obtito',
            '#id-ab-me-epp-not-check',
            '#id-cd-me-epp-not-check',
            '#id-d-me-epp-check',
            '#id-ab-demais-pj-no-check',
            '#id-cd-demais-pj-no-check',
            '#id-d-demais-pj-check',
        ];

        // Esconde todas as divs inicialmente
        divsModalidade.forEach(selector => {
            const div = document.querySelector(selector);
            if (div) div.classList.add('d-none');
        });

        // Exibe a div correta com base no tipo de contribuinte e rating
        if (isPessoaNatural) {
            if (rating === 'A' || rating === 'B') {
                document.querySelector('#id-ab-pessoa-natural').classList.remove('d-none');
            } else if (rating === 'C' || rating === 'D') {
                document.querySelector('#id-cd-pessoa-natural').classList.remove('d-none');
                document.querySelector('#explicacao-pn-rating-cd').innerHTML = `Créditos classificados como irrecuperáveis ou de difícil recuperação (rating C ou D), podem ter redução de até 100% do valor dos juros, das multas e dos encargos legais, observado o limite de até ${desconto_teorico} sobre o valor total de cada crédito objeto da negociação.`;
            }
        } else if (isPessoaObito) {
            document.querySelector('#id-d-pessoa-obtito').classList.remove('d-none');
            document.querySelector('#explicacao-po-rating-d').innerHTML = `Créditos classificados como irrecuperáveis ou de difícil recuperação (rating C ou D), podem ter redução de até 100% do valor dos juros, das multas e dos encargos legais, observado o limite de até ${desconto_teorico} sobre o valor total de cada crédito objeto da negociação.`;
        } else if (isMEEPP ) {
            if ((isFalido || isBaixado || isRecuperacaoJudicial)) {
                document.querySelector('#id-d-me-epp-check').classList.remove('d-none');
                document.querySelector('#explicacao-meepp-rating-d-checked').innerHTML = `Créditos classificados como irrecuperáveis ou de difícil recuperação (rating C ou D), podem ter redução de até 100% do valor dos juros, das multas e dos encargos legais, observado o limite de até ${desconto_teorico} sobre o valor total de cada crédito objeto da negociação.`;
                if (isRecuperacaoJudicial) {
                    document.querySelector('#id-e-tb-principal-meep').classList.remove('d-none');
                } else {
                    document.querySelector('#id-e-tb-principal-meep').classList.add('d-none');
                }
            } else if (rating === 'A' || rating === 'B') {
                document.querySelector('#id-ab-me-epp-not-check').classList.remove('d-none');
            } else if (rating === 'C' || rating === 'D') {
                document.querySelector('#id-cd-me-epp-not-check').classList.remove('d-none');
                document.querySelector('#explicacao-meepp-rating-cd').innerHTML = `Créditos classificados como irrecuperáveis ou de difícil recuperação (rating C ou D), podem ter redução de até 100% do valor dos juros, das multas e dos encargos legais, observado o limite de até ${desconto_teorico} sobre o valor total de cada crédito objeto da negociação.`;
            } 
        } else if (isdemaisPJ) {
            if (isFalido || isBaixado || isRecuperacaoJudicial) {
                document.querySelector('#id-d-demais-pj-check').classList.remove('d-none');
                document.querySelector('#explicacao-demais-pj-check').innerHTML = `Créditos classificados como irrecuperáveis ou de difícil recuperação (rating C ou D), podem ter redução de até 100% do valor dos juros, das multas e dos encargos legais, observado o limite de até ${desconto_teorico} sobre o valor total de cada crédito objeto da negociação.`;
                if (isRecuperacaoJudicial) {
                    document.querySelector('#id-e-tb-principal-demais-pj').classList.remove('d-none');
                } else {
                    document.querySelector('#id-e-tb-principal-demais-pj').classList.add('d-none');
                }
            } else if (rating === 'A' || rating === 'B') {
                document.querySelector('#id-ab-demais-pj-no-check').classList.remove('d-none');
            } else if (rating === 'C' || rating === 'D') {
                document.querySelector('#id-cd-demais-pj-no-check').classList.remove('d-none');
                document.querySelector('#explicacao-demais-pj-rating-cd').innerHTML = `Créditos classificados como irrecuperáveis ou de difícil recuperação (rating C ou D), podem ter redução de até 100% do valor dos juros, das multas e dos encargos legais, observado o limite de até ${desconto_teorico} sobre o valor total de cada crédito objeto da negociação.`;
            }
        }
    }
    else {
        showModal(mensagem='Preencha todos os campos antes de prosseguir!');
    }
}


//---------------FUNCOES PARA CALCULAR DESCONTOS-------------------//
// FUNCAO QUE CALCULA DESCONTOS
function popularTabelaDescontos(elemento) {
    const tabelaDebitosBody = document.querySelector('#tabelaDebitosBody');
    const tabelaCalculoDescontosBody = document.querySelector('#bd-tabela-calculo-descontos');
    const descontoTeorico = parseFloat(document.querySelector('#descontoTeorico').value) || 0;

    document.querySelector('#id-detalhamentos-descontos').classList.remove('d-none'); // Exibe a seção de detalhamentos de descontos

    // Inicializa variáveis para os totais
    let totalValorPrincipal = 0;
    let totalMulta = 0;
    let totalJuros = 0;
    let totalValorTotalProcesso = 0;
    let totalDescontoMaximo = 0;
    let totalDescontoCalculado = 0;
    let totalDescontoAplicado = 0;
    saldoDevedorAposDescontos = 0;

    // Seleciona todas as linhas, exceto a última
    const linhas = Array.from(tabelaDebitosBody.querySelectorAll('tr')).slice(0, -1);

    // Percorre as linhas selecionadas
    linhas.forEach(linha => {
        const celulas = linha.querySelectorAll('td');
        if (celulas.length > 0) {
            // Cria uma nova linha para a tabela de descontos
            const novaLinha = document.createElement('tr');

            // Lê os valores das células
            const numeroProcesso = celulas[0].querySelector('input')?.value || '';
            const valorPrincipal = converterStringEmNumero(celulas[1].querySelector('input')?.value || 0);
            const multa = converterStringEmNumero(celulas[2].querySelector('input')?.value || 0);
            const juros = converterStringEmNumero(celulas[3].querySelector('input')?.value || 0);
            const valorTotalProcesso = converterStringEmNumero(celulas[4].querySelector('input')?.value || 0);

            // Calcula os valores das novas células
            const descontoMaximo = multa + juros;
            const descontoCalculado = (valorTotalProcesso * descontoTeorico) / 100;
            const descontoAplicado = Math.min(descontoMaximo, descontoCalculado);
            const saldoDevedor = valorTotalProcesso - descontoAplicado;

            // Atualiza os totais
            totalValorPrincipal += valorPrincipal;
            totalMulta += multa;
            totalJuros += juros;
            totalValorTotalProcesso += valorTotalProcesso;
            totalDescontoMaximo += descontoMaximo;
            totalDescontoCalculado += descontoCalculado;
            totalDescontoAplicado += descontoAplicado;
            saldoDevedorAposDescontos += saldoDevedor;

            // Adiciona as células à nova linha
            novaLinha.innerHTML = `
                <td class="is-not-component" name='n_processo'>${numeroProcesso}</td>
                <td class="is-not-component" name='valor_principal'>${converterNumeroEmMoeda(valorPrincipal)}</td>
                <td class="is-not-component" name='multa'>${converterNumeroEmMoeda(multa)}</td>
                <td class="is-not-component" name='juros'>${converterNumeroEmMoeda(juros)}</td>
                <td class="is-not-component" name='valor_total_processo'>${converterNumeroEmMoeda(valorTotalProcesso)}</td>
                <td class="is-not-component" name='desconto_maximo'>${converterNumeroEmMoeda(descontoMaximo)}</td>
                <td class="is-not-component d-none" name='desconto_calculado'>${converterNumeroEmMoeda(descontoCalculado)}</td>
                <td class="is-not-component" name='desconto_aplicado'>${converterNumeroEmMoeda(descontoAplicado)}</td>
                <td class="is-not-component" name='saldo_devedor_apos_descontos'>${converterNumeroEmMoeda(saldoDevedor)}</td>
            `;

            // Adiciona a nova linha à tabela de descontos
            tabelaCalculoDescontosBody.appendChild(novaLinha);
        }
    });

    // Adiciona a linha de total
    const linhaTotal = document.createElement('tr');
    linhaTotal.innerHTML = `
        <td class="is-not-component" name="total"><strong>Total</strong></td>
        <td class="is-not-component" name="total_valor_principal" id="total_valor_descontos"><strong>${converterNumeroEmMoeda(totalValorPrincipal)}</strong></td>
        <td class="is-not-component" name="total_multa"><strong>${converterNumeroEmMoeda(totalMulta)}</strong></td>
        <td class="is-not-component" name="total_juros"><strong>${converterNumeroEmMoeda(totalJuros)}</strong></td>
        <td class="is-not-component" name="total_processo"><strong>${converterNumeroEmMoeda(totalValorTotalProcesso)}</strong></td>
        <td class="is-not-component" name="total_desconto_maximo"><strong>${converterNumeroEmMoeda(totalDescontoMaximo)}</strong></td>
        <td class="is-not-component d-none" name="total_desconto_calculado"><strong>${converterNumeroEmMoeda(totalDescontoCalculado)}</strong></td>
        <td class="is-not-component" name="total_desconto_aplicado"><strong>${converterNumeroEmMoeda(totalDescontoAplicado)}</strong></td>
        <td class="is-not-component" name="total_saldo_devedor_apos_descontos" id="saldo-devedor-apos-descontos"><strong>${converterNumeroEmMoeda(saldoDevedorAposDescontos)}</strong></td>
    `;
    linhaTotal.style.fontWeight = 'bold'; // Destaca a linha de total
    tabelaCalculoDescontosBody.appendChild(linhaTotal);
}

//---------------FUNCOES PARA CALCULAR ENTRADA-------------------//
// FUNCAO QUE CALCULA ENTRADA E PARCELAS DA ENTRADA
function popularTabelaEntrada(elemento) {
    let tabelaEntradaBody = document.querySelector('#bd-tabela-calculo-entrada');
    let rating = document.querySelector('#rating').value;
    comPrejuizo = elemento.getAttribute('data-prejuizo');
    
    document.querySelector('#id-detalhamento-entrada').classList.remove('d-none'); // Exibe a seção de detalhamentos de entrada

    totalPrevidenciario = totalPrevidenciario = document.querySelector('#totalGeral').value ? converterStringEmNumero(document.querySelector('#totalGeral').value) : 0;
    [valorEntrada, nParcelasEntrada, parcelaAposEntrada, saldoDevedorAposEntrada] = calcularMaximoParcelasEntrada(totalPrevidenciario);

    // PESSOA NATURAL RATING A OU B
    if (isPessoaNatural && (rating == 'A' || rating == 'B')) {
        if (totalPrevidenciario > 0) {
            contadorParcelasEntrada = 0;

            // Popula a tabela de entrada
            let template = document.querySelector('#id-linha-tabela-entrada').content.cloneNode(true);
            template.querySelector('#saldoDevedor').innerHTML = converterNumeroEmMoeda(totalPrevidenciario);
            template.querySelector('#valorEntrada').innerHTML = converterNumeroEmMoeda(totalPrevidenciario * 0.05);
            template.querySelector('.br-select').setAttribute('onchange', 'calcularValorParcelasEntrada(this, valorEntrada)');
            template.querySelector('#parcelaAposEntrada').innerHTML = converterNumeroEmMoeda(parcelaAposEntrada);

            // Gera os br-items do select das parcelas dinamicamente
            let brRadioGroup = template.querySelector('.br-list');
            for (let i = 1; i <= nParcelasEntrada; i++) {
                contadorParcelasEntrada++; // Incrementa o contador

                let brItemTemplate = document.createElement('div');
                brItemTemplate.classList.add('br-item');
                brItemTemplate.innerHTML = `
                    <div class="br-radio">
                        <input id="parcela-entrada-${contadorParcelasEntrada}" type="radio" name="n_parcelas_entrada" value="${i}">
                        <label for="parcela-entrada-${contadorParcelasEntrada}">${i} parcelas</label>
                    </div>
                `
                brRadioGroup.appendChild(brItemTemplate); // Adiciona o elemento criado ao grupo de radio buttons
            }

            let selectElement = template.querySelector('.br-select');
            tabelaEntradaBody.appendChild(template);

            tabelaEntradaBody.querySelector('#parcela-entrada-1').closest('.br-item').classList.add('selected'); // Marca o primeiro radio button como selecionado
            tabelaEntradaBody.querySelector('#parcela-entrada-1').setAttribute('checked', ''); // Marca o primeiro radio button como selecionado
            tabelaEntradaBody.querySelector('#parcela-entrada-1').checked = true; // Marca o primeiro radio button como selecionado

            new core.BRSelect('br-select', selectElement, notFoundElement); // instancia o select
        }
    }

    // PESSOA NATURAL RATING C OU D
    if (isPessoaNatural && (rating == 'C' || rating == 'D')) {
        if (totalPrevidenciario > 0) {
            contadorParcelasEntrada = 0;

            document.querySelector('#entrada-rating-a-b').classList.add('d-none'); // Exibe o cabeçalho da tabela de entrada para rating A ou B
            document.querySelector('#entrada-rating-c-d').classList.remove('d-none'); // Esoconde o cabeçalho da tabela de entrada para rating C ou D

            // Popula a tabela de entrada
            let template = document.querySelector('#id-linha-tabela-entrada').content.cloneNode(true);
            template.querySelector('#saldoDevedor').innerHTML = converterNumeroEmMoeda(totalPrevidenciario);
            template.querySelector('#valorEntrada').innerHTML = converterNumeroEmMoeda(totalPrevidenciario * 0.05);
            template.querySelector('.br-select').setAttribute('onchange', 'calcularValorParcelasEntrada(this, valorEntrada)');
            template.querySelector('#parcelaAposEntrada').innerHTML = converterNumeroEmMoeda(parcelaAposEntrada);

            // Gera os br-items do select das parcelas dinamicamente
            let brRadioGroup = template.querySelector('.br-list');
            for (let i = 1; i <= nParcelasEntrada; i++) {
                contadorParcelasEntrada++; // Incrementa o contador

                let brItemTemplate = document.createElement('div');
                brItemTemplate.classList.add('br-item');
                brItemTemplate.innerHTML = `
                    <div class="br-radio">
                        <input id="parcela-entrada-${contadorParcelasEntrada}" type="radio" name="n_parcelas_entrada" value="${i}">
                        <label for="parcela-entrada-${contadorParcelasEntrada}">${i} parcelas</label>
                    </div>
                `
                brRadioGroup.appendChild(brItemTemplate); // Adiciona o elemento criado ao grupo de radio buttons
            }

            let selectElement = template.querySelector('.br-select');
            let tabelaEntradaBody = document.querySelector('#bd-tabela-calculo-entrada');
            tabelaEntradaBody.appendChild(template);

            tabelaEntradaBody.querySelector('#parcela-entrada-1').closest('.br-item').classList.add('selected'); // Marca o primeiro radio button como selecionado
            tabelaEntradaBody.querySelector('#parcela-entrada-1').setAttribute('checked', ''); // Marca o primeiro radio button como selecionado
            tabelaEntradaBody.querySelector('#parcela-entrada-1').checked = true; // Marca o primeiro radio button como selecionado

            new core.BRSelect('br-select', selectElement, notFoundElement); // instancia o select
        }
    }

    // PESSOA INDICATIVO DE OBITO RATING D SEMPRE
    if (isPessoaObito) {
        if (totalPrevidenciario > 0) {
            contadorParcelasEntrada = 0;

            document.querySelector('#entrada-rating-a-b').classList.add('d-none'); // Exibe o cabeçalho da tabela de entrada para rating A ou B
            document.querySelector('#entrada-rating-c-d').classList.remove('d-none'); // Esoconde o cabeçalho da tabela de entrada para rating C ou D

            // Popula a tabela de entrada
            let template = document.querySelector('#id-linha-tabela-entrada').content.cloneNode(true);
            template.querySelector('#saldoDevedor').innerHTML = converterNumeroEmMoeda(totalPrevidenciario);
            template.querySelector('#valorEntrada').innerHTML = converterNumeroEmMoeda(totalPrevidenciario * 0.05);
            template.querySelector('.br-select').setAttribute('onchange', 'calcularValorParcelasEntrada(this, valorEntrada)');
            template.querySelector('#parcelaAposEntrada').innerHTML = converterNumeroEmMoeda(parcelaAposEntrada);

            // Gera os br-items do select das parcelas dinamicamente
            let brRadioGroup = template.querySelector('.br-list');
            for (let i = 1; i <= nParcelasEntrada; i++) {
                contadorParcelasEntrada++; // Incrementa o contador

                let brItemTemplate = document.createElement('div');
                brItemTemplate.classList.add('br-item');
                brItemTemplate.innerHTML = `
                    <div class="br-radio">
                        <input id="parcela-entrada-${contadorParcelasEntrada}" type="radio" name="n_parcelas_entrada" value="${i}">
                        <label for="parcela-entrada-${contadorParcelasEntrada}">${i} parcelas</label>
                    </div>
                `
                brRadioGroup.appendChild(brItemTemplate); // Adiciona o elemento criado ao grupo de radio buttons
            }

            let selectElement = template.querySelector('.br-select');
            let tabelaEntradaBody = document.querySelector('#bd-tabela-calculo-entrada');
            tabelaEntradaBody.appendChild(template);

            tabelaEntradaBody.querySelector('#parcela-entrada-1').closest('.br-item').classList.add('selected'); // Marca o primeiro radio button como selecionado
            tabelaEntradaBody.querySelector('#parcela-entrada-1').setAttribute('checked', ''); // Marca o primeiro radio button como selecionado
            tabelaEntradaBody.querySelector('#parcela-entrada-1').checked = true; // Marca o primeiro radio button como selecionado

            new core.BRSelect('br-select', selectElement, notFoundElement); // instancia o select
        }
    }


    // ME EPP //

    // ME EPP RATING A OU B
    if (isMEEPP && (rating == 'A' || rating == 'B')) {
        if (totalPrevidenciario > 0) {
            contadorParcelasEntrada = 0;

            document.querySelector('#entrada-rating-a-b').classList.remove('d-none'); // Exibe o cabeçalho da tabela de entrada para rating A ou B
            document.querySelector('#entrada-rating-c-d').classList.add('d-none'); // Esoconde o cabeçalho da tabela de entrada para rating C ou D

            // Popula a tabela de entrada
            let template = document.querySelector('#id-linha-tabela-entrada').content.cloneNode(true);
            template.querySelector('#saldoDevedor').innerHTML = converterNumeroEmMoeda(totalPrevidenciario);
            template.querySelector('#valorEntrada').innerHTML = converterNumeroEmMoeda(totalPrevidenciario * 0.05);
            template.querySelector('.br-select').setAttribute('onchange', 'calcularValorParcelasEntrada(this, valorEntrada)');
            template.querySelector('#parcelaAposEntrada').innerHTML = converterNumeroEmMoeda(parcelaAposEntrada);

            // Gera os br-items do select das parcelas dinamicamente
            let brRadioGroup = template.querySelector('.br-list');
            for (let i = 1; i <= nParcelasEntrada; i++) {
                contadorParcelasEntrada++; // Incrementa o contador

                let brItemTemplate = document.createElement('div');
                brItemTemplate.classList.add('br-item');
                brItemTemplate.innerHTML = `
                    <div class="br-radio">
                        <input id="parcela-entrada-${contadorParcelasEntrada}" type="radio" name="n_parcelas_entrada" value="${i}">
                        <label for="parcela-entrada-${contadorParcelasEntrada}">${i} parcelas</label>
                    </div>
                `
                brRadioGroup.appendChild(brItemTemplate); // Adiciona o elemento criado ao grupo de radio buttons
            }

            let selectElement = template.querySelector('.br-select');
            let tabelaEntradaBody = document.querySelector('#bd-tabela-calculo-entrada');
            tabelaEntradaBody.appendChild(template);

            tabelaEntradaBody.querySelector('#parcela-entrada-1').closest('.br-item').classList.add('selected'); // Marca o primeiro radio button como selecionado
            tabelaEntradaBody.querySelector('#parcela-entrada-1').setAttribute('checked', ''); // Marca o primeiro radio button como selecionado
            tabelaEntradaBody.querySelector('#parcela-entrada-1').checked = true; // Marca o primeiro radio button como selecionado

            new core.BRSelect('br-select', selectElement, notFoundElement); // instancia o select
        }
    }

    // ME EPP SEM RECUPERACAO JUDICIAL, SEM FALENCIA OU BAIXA, RATING C OU D SEM PREJUIZO FISCAL
    if (isMEEPP && !isRecuperacaoJudicial && !isFalido && !isBaixado && (rating == 'C' || rating == 'D') && comPrejuizo == 'false') {
        if (totalPrevidenciario > 0) {
            contadorParcelasEntrada = 0;

            document.querySelector('#entrada-rating-a-b').classList.add('d-none'); // Exibe o cabeçalho da tabela de entrada para rating A ou B
            document.querySelector('#entrada-rating-c-d').classList.remove('d-none'); // Esoconde o cabeçalho da tabela de entrada para rating C ou D

            // Popula a tabela de entrada
            let template = document.querySelector('#id-linha-tabela-entrada').content.cloneNode(true);
            template.querySelector('#saldoDevedor').innerHTML = converterNumeroEmMoeda(totalPrevidenciario);
            template.querySelector('#valorEntrada').innerHTML = converterNumeroEmMoeda(totalPrevidenciario * 0.05);
            template.querySelector('.br-select').setAttribute('onchange', 'calcularValorParcelasEntrada(this, valorEntrada)');
            template.querySelector('#parcelaAposEntrada').innerHTML = converterNumeroEmMoeda(parcelaAposEntrada);

            // Gera os br-items do select das parcelas dinamicamente
            let brRadioGroup = template.querySelector('.br-list');
            for (let i = 1; i <= nParcelasEntrada; i++) {
                contadorParcelasEntrada++; // Incrementa o contador

                let brItemTemplate = document.createElement('div');
                brItemTemplate.classList.add('br-item');
                brItemTemplate.innerHTML = `
                    <div class="br-radio">
                        <input id="parcela-entrada-${contadorParcelasEntrada}" type="radio" name="n_parcelas_entrada" value="${i}">
                        <label for="parcela-entrada-${contadorParcelasEntrada}">${i} parcelas</label>
                    </div>
                `
                brRadioGroup.appendChild(brItemTemplate); // Adiciona o elemento criado ao grupo de radio buttons
            }

            let selectElement = template.querySelector('.br-select');
            let tabelaEntradaBody = document.querySelector('#bd-tabela-calculo-entrada');
            tabelaEntradaBody.appendChild(template);

            tabelaEntradaBody.querySelector('#parcela-entrada-1').closest('.br-item').classList.add('selected'); // Marca o primeiro radio button como selecionado
            tabelaEntradaBody.querySelector('#parcela-entrada-1').setAttribute('checked', ''); // Marca o primeiro radio button como selecionado
            tabelaEntradaBody.querySelector('#parcela-entrada-1').checked = true; // Marca o primeiro radio button como selecionado

            new core.BRSelect('br-select', selectElement, notFoundElement); // instancia o select
        }
    }

    // ME EPP SEM RECUPERACAO JUDICIAL, SEM FALENCIA OU BAIXA, RATING C OU D COM PREJUIZO FISCAL
    if (isMEEPP && !isRecuperacaoJudicial && !isFalido && !isBaixado && (rating == 'C' || rating == 'D') && comPrejuizo == 'true') {
        
        // Adiciona a classe 'obrigatorio' aos inputs para validar preenchimento
        let inputsObrigatoriosAlvo = document.querySelectorAll('.obrigatorio-talvez');
        for (let input of inputsObrigatoriosAlvo) {
            input.classList.add('obrigatorio');
        }

        if (totalPrevidenciario > 0) {
            contadorParcelasEntrada = 0;

            document.querySelector('#entrada-rating-a-b').classList.add('d-none'); // Exibe o cabeçalho da tabela de entrada para rating A ou B
            document.querySelector('#entrada-rating-c-d').classList.remove('d-none'); // Esoconde o cabeçalho da tabela de entrada para rating 

            // Popula a tabela de entrada
            let template = document.querySelector('#id-linha-tabela-entrada').content.cloneNode(true);
            template.querySelector('#saldoDevedor').innerHTML = converterNumeroEmMoeda(totalPrevidenciario);
            template.querySelector('#valorEntrada').innerHTML = converterNumeroEmMoeda(totalPrevidenciario * 0.05);
            template.querySelector('.br-select').setAttribute('onchange', 'calcularValorParcelasEntrada(this, valorEntrada)');
            template.querySelector('#parcelaAposEntrada').innerHTML = converterNumeroEmMoeda(parcelaAposEntrada);

            // Gera os br-items do select das parcelas dinamicamente
            let brRadioGroup = template.querySelector('.br-list');
            for (let i = 1; i <= nParcelasEntrada; i++) {
                contadorParcelasEntrada++; // Incrementa o contador

                let brItemTemplate = document.createElement('div');
                brItemTemplate.classList.add('br-item');
                brItemTemplate.innerHTML = `
                    <div class="br-radio">
                        <input id="parcela-entrada-${contadorParcelasEntrada}" type="radio" name="n_parcelas_entrada" value="${i}">
                        <label for="parcela-entrada-${contadorParcelasEntrada}">${i} parcelas</label>
                    </div>
                `
                brRadioGroup.appendChild(brItemTemplate); // Adiciona o elemento criado ao grupo de radio buttons
            }

            let selectElement = template.querySelector('.br-select');
            let tabelaEntradaBody = document.querySelector('#bd-tabela-calculo-entrada');
            tabelaEntradaBody.appendChild(template);

            tabelaEntradaBody.querySelector('#parcela-entrada-1').closest('.br-item').classList.add('selected'); // Marca o primeiro radio button como selecionado
            tabelaEntradaBody.querySelector('#parcela-entrada-1').setAttribute('checked', ''); // Marca o primeiro radio button como selecionado
            tabelaEntradaBody.querySelector('#parcela-entrada-1').checked = true; // Marca o primeiro radio button como selecionado

            new core.BRSelect('br-select', selectElement, notFoundElement); // instancia o select
        }
    }

    // ME EPP SEM RECUPERACAO JUDICIAL, COM FALENCIA OU BAIXA, RATING C OU D SEM PREJUIZO FISCAL
    if (isMEEPP && !isRecuperacaoJudicial && (isFalido || isBaixado) && (rating == 'C' || rating == 'D') && comPrejuizo == 'false') {
        if (totalPrevidenciario > 0) {
            contadorParcelasEntrada = 0;

            document.querySelector('#entrada-rating-a-b').classList.add('d-none'); // Exibe o cabeçalho da tabela de entrada para rating A ou B
            document.querySelector('#entrada-rating-c-d').classList.remove('d-none'); // Esoconde o cabeçalho da tabela de entrada para rating C ou D

            // Popula a tabela de entrada
            let template = document.querySelector('#id-linha-tabela-entrada').content.cloneNode(true);
            template.querySelector('#saldoDevedor').innerHTML = converterNumeroEmMoeda(totalPrevidenciario);
            template.querySelector('#valorEntrada').innerHTML = converterNumeroEmMoeda(totalPrevidenciario * 0.05);
            template.querySelector('.br-select').setAttribute('onchange', 'calcularValorParcelasEntrada(this, valorEntrada)');
            template.querySelector('#parcelaAposEntrada').innerHTML = converterNumeroEmMoeda(parcelaAposEntrada);

            // Gera os br-items do select das parcelas dinamicamente
            let brRadioGroup = template.querySelector('.br-list');
            for (let i = 1; i <= nParcelasEntrada; i++) {
                contadorParcelasEntrada++; // Incrementa o contador

                let brItemTemplate = document.createElement('div');
                brItemTemplate.classList.add('br-item');
                brItemTemplate.innerHTML = `
                    <div class="br-radio">
                        <input id="parcela-entrada-${contadorParcelasEntrada}" type="radio" name="n_parcelas_entrada" value="${i}">
                        <label for="parcela-entrada-${contadorParcelasEntrada}">${i} parcelas</label>
                    </div>
                `
                brRadioGroup.appendChild(brItemTemplate); // Adiciona o elemento criado ao grupo de radio buttons
            }

            let selectElement = template.querySelector('.br-select');
            let tabelaEntradaBody = document.querySelector('#bd-tabela-calculo-entrada');
            tabelaEntradaBody.appendChild(template);

            tabelaEntradaBody.querySelector('#parcela-entrada-1').closest('.br-item').classList.add('selected'); // Marca o primeiro radio button como selecionado
            tabelaEntradaBody.querySelector('#parcela-entrada-1').setAttribute('checked', ''); // Marca o primeiro radio button como selecionado
            tabelaEntradaBody.querySelector('#parcela-entrada-1').checked = true; // Marca o primeiro radio button como selecionado

            new core.BRSelect('br-select', selectElement, notFoundElement); // instancia o select
        }
    }

    // ME EPP SEM RECUPERACAO JUDICIAL, COM FALENCIA OU BAIXA, RATING C OU D COM PREJUIZO FISCAL
    if (isMEEPP && !isRecuperacaoJudicial && (isFalido || isBaixado) && (rating == 'C' || rating == 'D') && comPrejuizo == 'true') {

        // Adiciona a classe 'obrigatorio' aos inputs para validar preenchimento
        let inputsObrigatoriosAlvo = document.querySelectorAll('.obrigatorio-talvez');
        for (let input of inputsObrigatoriosAlvo) {
            input.classList.add('obrigatorio');
        }

        if (totalPrevidenciario > 0) {
            contadorParcelasEntrada = 0;

            document.querySelector('#entrada-rating-a-b').classList.add('d-none'); // Exibe o cabeçalho da tabela de entrada para rating A ou B
            document.querySelector('#entrada-rating-c-d').classList.remove('d-none'); // Esoconde o cabeçalho da tabela de entrada para rating C ou D

            // Popula a tabela de entrada
            let template = document.querySelector('#id-linha-tabela-entrada').content.cloneNode(true);
            template.querySelector('#saldoDevedor').innerHTML = converterNumeroEmMoeda(totalPrevidenciario);
            template.querySelector('#valorEntrada').innerHTML = converterNumeroEmMoeda(totalPrevidenciario * 0.05);
            template.querySelector('.br-select').setAttribute('onchange', 'calcularValorParcelasEntrada(this, valorEntrada)');
            template.querySelector('#parcelaAposEntrada').innerHTML = converterNumeroEmMoeda(parcelaAposEntrada);

            // Gera os br-items do select das parcelas dinamicamente
            let brRadioGroup = template.querySelector('.br-list');
            for (let i = 1; i <= nParcelasEntrada; i++) {
                contadorParcelasEntrada++; // Incrementa o contador

                let brItemTemplate = document.createElement('div');
                brItemTemplate.classList.add('br-item');
                brItemTemplate.innerHTML = `
                    <div class="br-radio">
                        <input id="parcela-entrada-${contadorParcelasEntrada}" type="radio" name="n_parcelas_entrada" value="${i}">
                        <label for="parcela-entrada-${contadorParcelasEntrada}">${i} parcelas</label>
                    </div>
                `
                brRadioGroup.appendChild(brItemTemplate); // Adiciona o elemento criado ao grupo de radio buttons
            }

            let selectElement = template.querySelector('.br-select');
            let tabelaEntradaBody = document.querySelector('#bd-tabela-calculo-entrada');
            tabelaEntradaBody.appendChild(template);

            tabelaEntradaBody.querySelector('#parcela-entrada-1').closest('.br-item').classList.add('selected'); // Marca o primeiro radio button como selecionado
            tabelaEntradaBody.querySelector('#parcela-entrada-1').setAttribute('checked', ''); // Marca o primeiro radio button como selecionado
            tabelaEntradaBody.querySelector('#parcela-entrada-1').checked = true; // Marca o primeiro radio button como selecionado

            new core.BRSelect('br-select', selectElement, notFoundElement); // instancia o select
        }
    }

    // ME EPP COM RECUPERACAO JUDICIAL, SEM FALENCIA OU BAIXA, RATING C OU D, SEM PREJUIZO FISCAL
    if (isMEEPP && isRecuperacaoJudicial && (!isBaixado && !isFalido) && (rating == 'C' || rating == 'D') && comPrejuizo == 'false') {

        // Adiciona a classe 'obrigatorio' aos inputs para validar preenchimento
        let inputsObrigatoriosAlvo = document.querySelectorAll('.obrigatorio-talvez');
        for (let input of inputsObrigatoriosAlvo) {
            input.classList.add('obrigatorio');
        }

        if (totalPrevidenciario > 0) {
            contadorParcelasEntrada = 0;

            // Popula a tabela de entrada
            let template = document.querySelector('#id-linha-tabela-entrada').content.cloneNode(true);
            template.querySelector('#saldoDevedor').innerHTML = converterNumeroEmMoeda(totalPrevidenciario);
            template.querySelector('#valorEntrada').innerHTML = converterNumeroEmMoeda(totalPrevidenciario * 0.05);
            template.querySelector('.br-select').setAttribute('onchange', 'calcularValorParcelasEntrada(this, valorEntrada)');
            template.querySelector('#parcelaAposEntrada').innerHTML = converterNumeroEmMoeda(parcelaAposEntrada);

            // Gera os br-items do select das parcelas dinamicamente
            let brRadioGroup = template.querySelector('.br-list');
            for (let i = 1; i <= nParcelasEntrada; i++) {
                contadorParcelasEntrada++; // Incrementa o contador

                let brItemTemplate = document.createElement('div');
                brItemTemplate.classList.add('br-item');
                brItemTemplate.innerHTML = `
                    <div class="br-radio">
                        <input id="parcela-entrada-${contadorParcelasEntrada}" type="radio" name="n_parcelas_entrada" value="${i}">
                        <label for="parcela-entrada-${contadorParcelasEntrada}">${i} parcelas</label>
                    </div>
                `
                brRadioGroup.appendChild(brItemTemplate); // Adiciona o elemento criado ao grupo de radio buttons
            }

            let selectElement = template.querySelector('.br-select');
            let tabelaEntradaBody = document.querySelector('#bd-tabela-calculo-entrada');
            tabelaEntradaBody.appendChild(template);

            tabelaEntradaBody.querySelector('#parcela-entrada-1').closest('.br-item').classList.add('selected'); // Marca o primeiro radio button como selecionado
            tabelaEntradaBody.querySelector('#parcela-entrada-1').setAttribute('checked', ''); // Marca o primeiro radio button como selecionado
            tabelaEntradaBody.querySelector('#parcela-entrada-1').checked = true; // Marca o primeiro radio button como selecionado

            new core.BRSelect('br-select', selectElement, notFoundElement); // instancia o select
        }
    }

    // ME EPP COM RECUPERACAO JUDICIAL, SEM FALENCIA OU BAIXA, RATING C OU D, COM PREJUIZO FISCAL
    if (isMEEPP && isRecuperacaoJudicial && (!isBaixado && !isFalido) && (rating == 'C' || rating == 'D') && comPrejuizo == 'true') {
        if (totalPrevidenciario > 0) {
            contadorParcelasEntrada = 0;

            // Popula a tabela de entrada
            let template = document.querySelector('#id-linha-tabela-entrada').content.cloneNode(true);
            template.querySelector('#saldoDevedor').innerHTML = converterNumeroEmMoeda(totalPrevidenciario);
            template.querySelector('#valorEntrada').innerHTML = converterNumeroEmMoeda(totalPrevidenciario * 0.05);
            template.querySelector('.br-select').setAttribute('onchange', 'calcularValorParcelasEntrada(this, valorEntrada)');
            template.querySelector('#parcelaAposEntrada').innerHTML = converterNumeroEmMoeda(parcelaAposEntrada);

            // Gera os br-items do select das parcelas dinamicamente
            let brRadioGroup = template.querySelector('.br-list');
            for (let i = 1; i <= nParcelasEntrada; i++) {
                contadorParcelasEntrada++; // Incrementa o contador

                let brItemTemplate = document.createElement('div');
                brItemTemplate.classList.add('br-item');
                brItemTemplate.innerHTML = `
                    <div class="br-radio">
                        <input id="parcela-entrada-${contadorParcelasEntrada}" type="radio" name="n_parcelas_entrada" value="${i}">
                        <label for="parcela-entrada-${contadorParcelasEntrada}">${i} parcelas</label>
                    </div>
                `
                brRadioGroup.appendChild(brItemTemplate); // Adiciona o elemento criado ao grupo de radio buttons
            }

            let selectElement = template.querySelector('.br-select');
            let tabelaEntradaBody = document.querySelector('#bd-tabela-calculo-entrada');
            tabelaEntradaBody.appendChild(template);

            tabelaEntradaBody.querySelector('#parcela-entrada-1').closest('.br-item').classList.add('selected'); // Marca o primeiro radio button como selecionado
            tabelaEntradaBody.querySelector('#parcela-entrada-1').setAttribute('checked', ''); // Marca o primeiro radio button como selecionado
            tabelaEntradaBody.querySelector('#parcela-entrada-1').checked = true; // Marca o primeiro radio button como selecionado

            new core.BRSelect('br-select', selectElement, notFoundElement); // instancia o select
        }
    }


    // DEMAIS PJ //

    // DEMAIS PJ RATING A OU B
    if (isdemaisPJ && (rating == 'A' || rating == 'B')) {
        if (totalPrevidenciario > 0) {
            contadorParcelasEntrada = 0;

            document.querySelector('#entrada-rating-a-b').classList.remove('d-none'); // Exibe o cabeçalho da tabela de entrada para rating A ou B
            document.querySelector('#entrada-rating-c-d').classList.add('d-none'); // Esoconde o cabeçalho da tabela de entrada para rating 

            // Popula a tabela de entrada
            let template = document.querySelector('#id-linha-tabela-entrada').content.cloneNode(true);
            template.querySelector('#saldoDevedor').innerHTML = converterNumeroEmMoeda(totalPrevidenciario);
            template.querySelector('#valorEntrada').innerHTML = converterNumeroEmMoeda(totalPrevidenciario * 0.05);
            template.querySelector('.br-select').setAttribute('onchange', 'calcularValorParcelasEntrada(this, valorEntrada)');
            template.querySelector('#parcelaAposEntrada').innerHTML = converterNumeroEmMoeda(parcelaAposEntrada);

            // Gera os br-items do select das parcelas dinamicamente
            let brRadioGroup = template.querySelector('.br-list');
            for (let i = 1; i <= nParcelasEntrada; i++) {
                contadorParcelasEntrada++; // Incrementa o contador

                let brItemTemplate = document.createElement('div');
                brItemTemplate.classList.add('br-item');
                brItemTemplate.innerHTML = `
                    <div class="br-radio">
                        <input id="parcela-entrada-${contadorParcelasEntrada}" type="radio" name="n_parcelas_entrada" value="${i}">
                        <label for="parcela-entrada-${contadorParcelasEntrada}">${i} parcelas</label>
                    </div>
                `
                brRadioGroup.appendChild(brItemTemplate); // Adiciona o elemento criado ao grupo de radio buttons
            }

            let selectElement = template.querySelector('.br-select');
            let tabelaEntradaBody = document.querySelector('#bd-tabela-calculo-entrada');
            tabelaEntradaBody.appendChild(template);

            tabelaEntradaBody.querySelector('#parcela-entrada-1').closest('.br-item').classList.add('selected'); // Marca o primeiro radio button como selecionado
            tabelaEntradaBody.querySelector('#parcela-entrada-1').setAttribute('checked', ''); // Marca o primeiro radio button como selecionado
            tabelaEntradaBody.querySelector('#parcela-entrada-1').checked = true; // Marca o primeiro radio button como selecionado

            new core.BRSelect('br-select', selectElement, notFoundElement); // instancia o select
        }
    }

    // DEMAIS PJ SEM RECUPERACAO JUDICIAL, SEM FALENCIA, SEM BAIXA, RATING C OU D, SEM PREJUIZO FISCAL
    if (isdemaisPJ && !isRecuperacaoJudicial && !isFalido && !isBaixado && (rating == 'C' || rating == 'D') && comPrejuizo == 'false') {
        if (totalPrevidenciario > 0) {
            contadorParcelasEntrada = 0;

            document.querySelector('#entrada-rating-a-b').classList.add('d-none'); // Exibe o cabeçalho da tabela de entrada para rating A ou B
            document.querySelector('#entrada-rating-c-d').classList.remove('d-none'); // Esoconde o cabeçalho da tabela de entrada para rating 

            // Popula a tabela de entrada
            let template = document.querySelector('#id-linha-tabela-entrada').content.cloneNode(true);
            template.querySelector('#saldoDevedor').innerHTML = converterNumeroEmMoeda(totalPrevidenciario);
            template.querySelector('#valorEntrada').innerHTML = converterNumeroEmMoeda(totalPrevidenciario * 0.05);
            template.querySelector('.br-select').setAttribute('onchange', 'calcularValorParcelasEntrada(this, valorEntrada)');
            template.querySelector('#parcelaAposEntrada').innerHTML = converterNumeroEmMoeda(parcelaAposEntrada);

            // Gera os br-items do select das parcelas dinamicamente
            let brRadioGroup = template.querySelector('.br-list');
            for (let i = 1; i <= nParcelasEntrada; i++) {
                contadorParcelasEntrada++; // Incrementa o contador

                let brItemTemplate = document.createElement('div');
                brItemTemplate.classList.add('br-item');
                brItemTemplate.innerHTML = `
                    <div class="br-radio">
                        <input id="parcela-entrada-${contadorParcelasEntrada}" type="radio" name="n_parcelas_entrada" value="${i}">
                        <label for="parcela-entrada-${contadorParcelasEntrada}">${i} parcelas</label>
                    </div>
                `
                brRadioGroup.appendChild(brItemTemplate); // Adiciona o elemento criado ao grupo de radio buttons
            }

            let selectElement = template.querySelector('.br-select');
            let tabelaEntradaBody = document.querySelector('#bd-tabela-calculo-entrada');
            tabelaEntradaBody.appendChild(template);

            tabelaEntradaBody.querySelector('#parcela-entrada-1').closest('.br-item').classList.add('selected'); // Marca o primeiro radio button como selecionado
            tabelaEntradaBody.querySelector('#parcela-entrada-1').setAttribute('checked', ''); // Marca o primeiro radio button como selecionado
            tabelaEntradaBody.querySelector('#parcela-entrada-1').checked = true; // Marca o primeiro radio button como selecionado

            new core.BRSelect('br-select', selectElement, notFoundElement); // instancia o select
        }
    }

    // DEMAIS PJ SEM RECUPERACAO JUDICIAL, SEM FALENCIA OU BAIXA, RATING C OU D, COM PREJUIZO FISCAL
    if (isdemaisPJ && !isRecuperacaoJudicial && !isFalido && !isBaixado && (rating == 'C' || rating == 'D') && comPrejuizo == 'true') {

        // Adiciona a classe 'obrigatorio' aos inputs para validar preenchimento
        let inputsObrigatoriosAlvo = document.querySelectorAll('.obrigatorio-talvez');
        for (let input of inputsObrigatoriosAlvo) {
            input.classList.add('obrigatorio');
        }

        if (totalPrevidenciario > 0) {
            contadorParcelasEntrada = 0;

            document.querySelector('#entrada-rating-a-b').classList.add('d-none'); // Exibe o cabeçalho da tabela de entrada para rating A ou B
            document.querySelector('#entrada-rating-c-d').classList.remove('d-none'); // Esoconde o cabeçalho da tabela de entrada para rating 

            // Popula a tabela de entrada
            let template = document.querySelector('#id-linha-tabela-entrada').content.cloneNode(true);
            template.querySelector('#saldoDevedor').innerHTML = converterNumeroEmMoeda(totalPrevidenciario);
            template.querySelector('#valorEntrada').innerHTML = converterNumeroEmMoeda(totalPrevidenciario * 0.05);
            template.querySelector('.br-select').setAttribute('onchange', 'calcularValorParcelasEntrada(this, valorEntrada)');
            template.querySelector('#parcelaAposEntrada').innerHTML = converterNumeroEmMoeda(parcelaAposEntrada);

            // Gera os br-items do select das parcelas dinamicamente
            let brRadioGroup = template.querySelector('.br-list');
            for (let i = 1; i <= nParcelasEntrada; i++) {
                contadorParcelasEntrada++; // Incrementa o contador

                let brItemTemplate = document.createElement('div');
                brItemTemplate.classList.add('br-item');
                brItemTemplate.innerHTML = `
                    <div class="br-radio">
                        <input id="parcela-entrada-${contadorParcelasEntrada}" type="radio" name="n_parcelas_entrada" value="${i}">
                        <label for="parcela-entrada-${contadorParcelasEntrada}">${i} parcelas</label>
                    </div>
                `
                brRadioGroup.appendChild(brItemTemplate); // Adiciona o elemento criado ao grupo de radio buttons
            }

            let selectElement = template.querySelector('.br-select');
            let tabelaEntradaBody = document.querySelector('#bd-tabela-calculo-entrada');
            tabelaEntradaBody.appendChild(template);

            tabelaEntradaBody.querySelector('#parcela-entrada-1').closest('.br-item').classList.add('selected'); // Marca o primeiro radio button como selecionado
            tabelaEntradaBody.querySelector('#parcela-entrada-1').setAttribute('checked', ''); // Marca o primeiro radio button como selecionado
            tabelaEntradaBody.querySelector('#parcela-entrada-1').checked = true; // Marca o primeiro radio button como selecionado

            new core.BRSelect('br-select', selectElement, notFoundElement); // instancia o select
        }
    }

    // DEMAIS PJ SEM RECUPERACAO JUDICIAL, COM FALENCIA OU BAIXA, RATING C OU D SEM PREJUIZO FISCAL
    if (isdemaisPJ && !isRecuperacaoJudicial && (isFalido || isBaixado) && (rating == 'C' || rating == 'D') && comPrejuizo == 'false') {
        if (totalPrevidenciario > 0) {
            contadorParcelasEntrada = 0;

            document.querySelector('#entrada-rating-a-b').classList.add('d-none'); // Exibe o cabeçalho da tabela de entrada para rating A ou B
            document.querySelector('#entrada-rating-c-d').classList.remove('d-none'); // Esoconde o cabeçalho da tabela de entrada para rating 

            // Popula a tabela de entrada
            let template = document.querySelector('#id-linha-tabela-entrada').content.cloneNode(true);
            template.querySelector('#saldoDevedor').innerHTML = converterNumeroEmMoeda(totalPrevidenciario);
            template.querySelector('#valorEntrada').innerHTML = converterNumeroEmMoeda(totalPrevidenciario * 0.05);
            template.querySelector('.br-select').setAttribute('onchange', 'calcularValorParcelasEntrada(this, valorEntrada)');
            template.querySelector('#parcelaAposEntrada').innerHTML = converterNumeroEmMoeda(parcelaAposEntrada);

            // Gera os br-items do select das parcelas dinamicamente
            let brRadioGroup = template.querySelector('.br-list');
            for (let i = 1; i <= nParcelasEntrada; i++) {
                contadorParcelasEntrada++; // Incrementa o contador

                let brItemTemplate = document.createElement('div');
                brItemTemplate.classList.add('br-item');
                brItemTemplate.innerHTML = `
                    <div class="br-radio">
                        <input id="parcela-entrada-${contadorParcelasEntrada}" type="radio" name="n_parcelas_entrada" value="${i}">
                        <label for="parcela-entrada-${contadorParcelasEntrada}">${i} parcelas</label>
                    </div>
                `
                brRadioGroup.appendChild(brItemTemplate); // Adiciona o elemento criado ao grupo de radio buttons
            }

            let selectElement = template.querySelector('.br-select');
            let tabelaEntradaBody = document.querySelector('#bd-tabela-calculo-entrada');
            tabelaEntradaBody.appendChild(template);

            tabelaEntradaBody.querySelector('#parcela-entrada-1').closest('.br-item').classList.add('selected'); // Marca o primeiro radio button como selecionado
            tabelaEntradaBody.querySelector('#parcela-entrada-1').setAttribute('checked', ''); // Marca o primeiro radio button como selecionado
            tabelaEntradaBody.querySelector('#parcela-entrada-1').checked = true; // Marca o primeiro radio button como selecionado

            new core.BRSelect('br-select', selectElement, notFoundElement); // instancia o select
        }
    }

    // DEMAIS PJ SEM RECUPERACAO JUDICIAL, COM FALENCIA OU BAIXA, RATING C OU D COM PREJUIZO FISCAL
    if (isdemaisPJ && !isRecuperacaoJudicial && (isFalido || isBaixado) && (rating == 'C' || rating == 'D') && comPrejuizo == 'true') {

        // Adiciona a classe 'obrigatorio' aos inputs para validar preenchimento
        let inputsObrigatoriosAlvo = document.querySelectorAll('.obrigatorio-talvez');
        for (let input of inputsObrigatoriosAlvo) {
            input.classList.add('obrigatorio');
        }

        if (totalPrevidenciario > 0) {
            contadorParcelasEntrada = 0;

            document.querySelector('#entrada-rating-a-b').classList.add('d-none'); // Exibe o cabeçalho da tabela de entrada para rating A ou B
            document.querySelector('#entrada-rating-c-d').classList.remove('d-none'); // Esoconde o cabeçalho da tabela de entrada para rating 

            // Popula a tabela de entrada
            let template = document.querySelector('#id-linha-tabela-entrada').content.cloneNode(true);
            template.querySelector('#saldoDevedor').innerHTML = converterNumeroEmMoeda(totalPrevidenciario);
            template.querySelector('#valorEntrada').innerHTML = converterNumeroEmMoeda(totalPrevidenciario * 0.05);
            template.querySelector('.br-select').setAttribute('onchange', 'calcularValorParcelasEntrada(this, valorEntrada)');
            template.querySelector('#parcelaAposEntrada').innerHTML = converterNumeroEmMoeda(parcelaAposEntrada);

            // Gera os br-items do select das parcelas dinamicamente
            let brRadioGroup = template.querySelector('.br-list');
            for (let i = 1; i <= nParcelasEntrada; i++) {
                contadorParcelasEntrada++; // Incrementa o contador

                let brItemTemplate = document.createElement('div');
                brItemTemplate.classList.add('br-item');
                brItemTemplate.innerHTML = `
                    <div class="br-radio">
                        <input id="parcela-entrada-${contadorParcelasEntrada}" type="radio" name="n_parcelas_entrada" value="${i}">
                        <label for="parcela-entrada-${contadorParcelasEntrada}">${i} parcelas</label>
                    </div>
                `
                brRadioGroup.appendChild(brItemTemplate); // Adiciona o elemento criado ao grupo de radio buttons
            }

            let selectElement = template.querySelector('.br-select');
            let tabelaEntradaBody = document.querySelector('#bd-tabela-calculo-entrada');
            tabelaEntradaBody.appendChild(template);

            tabelaEntradaBody.querySelector('#parcela-entrada-1').closest('.br-item').classList.add('selected'); // Marca o primeiro radio button como selecionado
            tabelaEntradaBody.querySelector('#parcela-entrada-1').setAttribute('checked', ''); // Marca o primeiro radio button como selecionado
            tabelaEntradaBody.querySelector('#parcela-entrada-1').checked = true; // Marca o primeiro radio button como selecionado

            new core.BRSelect('br-select', selectElement, notFoundElement); // instancia o select
        }
    }

    // DEMAIS PJ COM RECUPERACAO JUDICIAL, SEM FALENCIA OU BAIXA, RATING C OU D, SEM PREJUIZO FISCAL
    if (isdemaisPJ && isRecuperacaoJudicial && (!isFalido && !isBaixado) && (rating == 'C' || rating == 'D') && comPrejuizo == 'false') {
        if (totalPrevidenciario > 0) {
            contadorParcelasEntrada = 0;

            document.querySelector('#entrada-rating-a-b').classList.add('d-none'); // Exibe o cabeçalho da tabela de entrada para rating A ou B
            document.querySelector('#entrada-rating-c-d').classList.remove('d-none'); // Esoconde o cabeçalho da tabela de entrada para rating 

            // Popula a tabela de entrada
            let template = document.querySelector('#id-linha-tabela-entrada').content.cloneNode(true);
            template.querySelector('#saldoDevedor').innerHTML = converterNumeroEmMoeda(totalPrevidenciario);
            template.querySelector('#valorEntrada').innerHTML = converterNumeroEmMoeda(totalPrevidenciario * 0.05);
            template.querySelector('.br-select').setAttribute('onchange', 'calcularValorParcelasEntrada(this, valorEntrada)');
            template.querySelector('#parcelaAposEntrada').innerHTML = converterNumeroEmMoeda(parcelaAposEntrada);

            // Gera os br-items do select das parcelas dinamicamente
            let brRadioGroup = template.querySelector('.br-list');
            for (let i = 1; i <= nParcelasEntrada; i++) {
                contadorParcelasEntrada++; // Incrementa o contador

                let brItemTemplate = document.createElement('div');
                brItemTemplate.classList.add('br-item');
                brItemTemplate.innerHTML = `
                    <div class="br-radio">
                        <input id="parcela-entrada-${contadorParcelasEntrada}" type="radio" name="n_parcelas_entrada" value="${i}">
                        <label for="parcela-entrada-${contadorParcelasEntrada}">${i} parcelas</label>
                    </div>
                `
                brRadioGroup.appendChild(brItemTemplate); // Adiciona o elemento criado ao grupo de radio buttons
            }

            let selectElement = template.querySelector('.br-select');
            let tabelaEntradaBody = document.querySelector('#bd-tabela-calculo-entrada');
            tabelaEntradaBody.appendChild(template);

            tabelaEntradaBody.querySelector('#parcela-entrada-1').closest('.br-item').classList.add('selected'); // Marca o primeiro radio button como selecionado
            tabelaEntradaBody.querySelector('#parcela-entrada-1').setAttribute('checked', ''); // Marca o primeiro radio button como selecionado
            tabelaEntradaBody.querySelector('#parcela-entrada-1').checked = true; // Marca o primeiro radio button como selecionado

            new core.BRSelect('br-select', selectElement, notFoundElement); // instancia o select
        }
    }

    // DEMAIS PJ COM RECUPERACAO JUDICIAL, SEM FALENCIA OU BAIXA, RATING C OU D, COM PREJUIZO FISCAL
    if (isdemaisPJ && isRecuperacaoJudicial && (!isFalido && !isBaixado) && (rating == 'C' || rating == 'D') && comPrejuizo == 'true') { {

            // Adiciona a classe 'obrigatorio' aos inputs para validar preenchimento
            let inputsObrigatoriosAlvo = document.querySelectorAll('.obrigatorio-talvez');
            for (let input of inputsObrigatoriosAlvo) {
                input.classList.add('obrigatorio');
            }

            if (totalPrevidenciario > 0) {
                contadorParcelasEntrada = 0;

                document.querySelector('#entrada-rating-a-b').classList.add('d-none'); // Exibe o cabeçalho da tabela de entrada para rating A ou B
            document.querySelector('#entrada-rating-c-d').classList.remove('d-none'); // Esoconde o cabeçalho da tabela de entrada para rating 

                // Popula a tabela de entrada
                let template = document.querySelector('#id-linha-tabela-entrada').content.cloneNode(true);
                template.querySelector('#saldoDevedor').innerHTML = converterNumeroEmMoeda(totalPrevidenciario);
                template.querySelector('#valorEntrada').innerHTML = converterNumeroEmMoeda(totalPrevidenciario * 0.05);
                template.querySelector('.br-select').setAttribute('onchange', 'calcularValorParcelasEntrada(this, valorEntrada)');
                template.querySelector('#parcelaAposEntrada').innerHTML = converterNumeroEmMoeda(parcelaAposEntrada);

                // Gera os br-items do select das parcelas dinamicamente
                let brRadioGroup = template.querySelector('.br-list');
                for (let i = 1; i <= nParcelasEntrada; i++) {
                    contadorParcelasEntrada++; // Incrementa o contador

                    let brItemTemplate = document.createElement('div');
                    brItemTemplate.classList.add('br-item');
                    brItemTemplate.innerHTML = `
                        <div class="br-radio">
                            <input id="parcela-entrada-${contadorParcelasEntrada}" type="radio" name="n_parcelas_entrada" value="${i}">
                            <label for="parcela-entrada-${contadorParcelasEntrada}">${i} parcelas</label>
                        </div>
                    `
                    brRadioGroup.appendChild(brItemTemplate); // Adiciona o elemento criado ao grupo de radio buttons
                }

                let selectElement = template.querySelector('.br-select');
                let tabelaEntradaBody = document.querySelector('#bd-tabela-calculo-entrada');
                tabelaEntradaBody.appendChild(template);

                tabelaEntradaBody.querySelector('#parcela-entrada-1').closest('.br-item').classList.add('selected'); // Marca o primeiro radio button como selecionado
                tabelaEntradaBody.querySelector('#parcela-entrada-1').setAttribute('checked', ''); // Marca o primeiro radio button como selecionado
                tabelaEntradaBody.querySelector('#parcela-entrada-1').checked = true; // Marca o primeiro radio button como selecionado

                new core.BRSelect('br-select', selectElement, notFoundElement); // instancia o select
            }
        }

    }

}


// FUNCAO QUE CALCULA O MAXIMO DE PARCELAS DE ENTRADA
function calcularMaximoParcelasEntrada(totalPrevidenciario) {
    let rating = document.querySelector('#rating').value;
    nParcelasEntrada = 0;
    valorEntrada = 0;
    saldoDevedorAposEntrada = 0;
    parcelaAposEntrada = 0;

    if (document.querySelector('#saldo-devedor-apos-descontos') != null) {
        saldoDevedorAposDescontos = converterStringEmNumero(document.querySelector('#saldo-devedor-apos-descontos').innerHTML);
    }

    // PESSOA NATURAL RATING A OU B
    if (isPessoaNatural && (rating == 'A' || rating == 'B')) {
        if (totalPrevidenciario > 0) {
            valorEntrada = totalPrevidenciario * 0.05; // 5% de entrada
            if (valorEntrada < valorMinimo) {
                valorEntrada = valorMinimo; // Garante que o valor de entrada não seja menor que o mínimo
            }
            saldoDevedorAposEntrada = totalPrevidenciario - valorEntrada;

            // Calcula o número máximo de parcelas para a entrada
            nParcelasEntrada = Math.min(10, Math.floor(valorEntrada / valorMinimo));
            if (valorEntrada / nParcelasEntrada < valorMinimo) {
                nParcelasEntrada = Math.floor(valorEntrada / valorMinimo);
            }

            parcelaAposEntrada = valorEntrada;
        }

    }

    // PESSOA NATURAL RATING C OU D
    if (isPessoaNatural && (rating == 'C' || rating == 'D')) {
        if (totalPrevidenciario > 0) {
            valorEntrada = totalPrevidenciario * 0.05; // 5% de entrada
            if (valorEntrada < valorMinimo) {
                valorEntrada = valorMinimo; // Garante que o valor de entrada não seja menor que o mínimo
            }
            saldoDevedorAposEntrada = saldoDevedorAposDescontos - valorEntrada;

            // Calcula o número máximo de parcelas para a entrada
            nParcelasEntrada = Math.min(10, Math.floor(valorEntrada / valorMinimo));
            if (valorEntrada / nParcelasEntrada < valorMinimo) {
                nParcelasEntrada = Math.floor(valorEntrada / valorMinimo);
            }

            parcelaAposEntrada = valorEntrada;
        }

    }

    // PESSOA INDICADTVO DE OBITO RATING D SEMPRE
    if (isPessoaObito) {
        if (totalPrevidenciario > 0) {
            valorEntrada = totalPrevidenciario * 0.05; // 5% de entrada
            if (valorEntrada < valorMinimo) {
                valorEntrada = valorMinimo; // Garante que o valor de entrada não seja menor que o mínimo
            }
            saldoDevedorAposEntrada = saldoDevedorAposDescontos - valorEntrada;

            // Calcula o número máximo de parcelas para a entrada
            nParcelasEntrada = Math.min(10, Math.floor(valorEntrada / valorMinimo));
            if (valorEntrada / nParcelasEntrada < valorMinimo) {
                nParcelasEntrada = Math.floor(valorEntrada / valorMinimo);
            }

            parcelaAposEntrada = valorEntrada;
        }

    }

    // ME EPP RATING A OU B
    if (isMEEPP && (rating == 'A' || rating == 'B')) {
        if (totalPrevidenciario > 0) {
            valorEntrada = totalPrevidenciario * 0.05; // 5% de entrada
            if (valorEntrada < valorMinimo) {
                valorEntrada = valorMinimo; // Garante que o valor de entrada não seja menor que o mínimo
            }
            saldoDevedorAposEntrada = totalPrevidenciario - valorEntrada;

            // Calcula o número máximo de parcelas para a entrada
            nParcelasEntrada = Math.min(10, Math.floor(valorEntrada / valorMinimo));
            if (valorEntrada / nParcelasEntrada < valorMinimo) {
                nParcelasEntrada = Math.floor(valorEntrada / valorMinimo);
            }

            parcelaAposEntrada = valorEntrada;
        }

    }

    // ME EPP RATING C OU D SEM PREJUIZO FISCAL E SEM FALENCIA OU BAIXA
    if (isMEEPP && (rating == 'C' || rating == 'D') && comPrejuizo == 'false' && !isFalido && !isBaixado) {
        if (totalPrevidenciario > 0) {
            valorEntrada = totalPrevidenciario * 0.05; // 5% de entrada
            if (valorEntrada < valorMinimo) {
                valorEntrada = valorMinimo; // Garante que o valor de entrada não seja menor que o mínimo
            }
            saldoDevedorAposEntrada = saldoDevedorAposDescontos - valorEntrada;

            // Calcula o número máximo de parcelas para a entrada
            nParcelasEntrada = Math.min(10, Math.floor(valorEntrada / valorMinimo));
            if (valorEntrada / nParcelasEntrada < valorMinimo) {
                nParcelasEntrada = Math.floor(valorEntrada / valorMinimo);
            }

            parcelaAposEntrada = valorEntrada;
        }

    }

    // ME EPP RATING C OU D SEM PREJUIZO FISCAL E COM FALENCIA OU BAIXA
    if (isMEEPP && (rating == 'C' || rating == 'D') && comPrejuizo == 'false' && (isFalido || isBaixado)) {
        if (totalPrevidenciario > 0) {
            valorEntrada = totalPrevidenciario * 0.05; // 5% de entrada
            if (valorEntrada < valorMinimo) {
                valorEntrada = valorMinimo; // Garante que o valor de entrada não seja menor que o mínimo
            }
            saldoDevedorAposEntrada = saldoDevedorAposDescontos - valorEntrada;

            // Calcula o número máximo de parcelas para a entrada
            nParcelasEntrada = Math.min(10, Math.floor(valorEntrada / valorMinimo));
            if (valorEntrada / nParcelasEntrada < valorMinimo) {
                nParcelasEntrada = Math.floor(valorEntrada / valorMinimo);
            }

            parcelaAposEntrada = valorEntrada;
        }

    }

    // ME EPP RATING C OU D COM PREJUIZO FISCAL E SEM FALENCIA OU BAIXA
    if (isMEEPP && (rating == 'C' || rating == 'D') && comPrejuizo == 'true' && !isFalido && !isBaixado) {
        if (totalPrevidenciario > 0) {
            valorEntrada = totalPrevidenciario * 0.05; // 5% de entrada
            if (valorEntrada < valorMinimo) {
                valorEntrada = valorMinimo; // Garante que o valor de entrada não seja menor que o mínimo
            }
            saldoDevedorAposEntrada = saldoDevedorAposDescontos - valorEntrada; // valor a ser utilizado para o cálculo do prejuízo fiscal

            // Calcula o número máximo de parcelas para a entrada
            nParcelasEntrada = Math.min(10, Math.floor(valorEntrada / valorMinimo));
            if (valorEntrada / nParcelasEntrada < valorMinimo) {
                nParcelasEntrada = Math.floor(valorEntrada / valorMinimo);
            }

            parcelaAposEntrada = valorEntrada;
        }

    }

    // ME EPP RATING C OU D COM PREJUIZO FISCAL E COM FALENCIA OU BAIXA
    if (isMEEPP && (rating == 'C' || rating == 'D') && comPrejuizo == 'true' && (isFalido || isBaixado)) {
        if (totalPrevidenciario > 0) {
            valorEntrada = totalPrevidenciario * 0.05; // 5% de entrada
            if (valorEntrada < valorMinimo) {
                valorEntrada = valorMinimo; // Garante que o valor de entrada não seja menor que o mínimo
            }
            saldoDevedorAposEntrada = saldoDevedorAposDescontos - valorEntrada; // valor a ser utilizado para o cálculo do prejuízo fiscal

            // Calcula o número máximo de parcelas para a entrada
            nParcelasEntrada = Math.min(10, Math.floor(valorEntrada / valorMinimo));
            if (valorEntrada / nParcelasEntrada < valorMinimo) {
                nParcelasEntrada = Math.floor(valorEntrada / valorMinimo);
            }

            parcelaAposEntrada = valorEntrada;
        }

    }



    // DEMAIS PJ //

    // DEMAIS PJ RATING A OU B
    if (isdemaisPJ && (rating == 'A' || rating == 'B')) {
        if (totalPrevidenciario > 0) {
            valorEntrada = totalPrevidenciario * 0.05; // 5% de entrada
            if (valorEntrada < valorMinimo) {
                valorEntrada = valorMinimo; // Garante que o valor de entrada não seja menor que o mínimo
            }
            saldoDevedorAposEntrada = totalPrevidenciario - valorEntrada;

            // Calcula o número máximo de parcelas para a entrada
            nParcelasEntrada = Math.min(10, Math.floor(valorEntrada / valorMinimo));
            if (valorEntrada / nParcelasEntrada < valorMinimo) {
                nParcelasEntrada = Math.floor(valorEntrada / valorMinimo);
            }

            parcelaAposEntrada = valorEntrada;
        }

    }

    // DEMAIS PJ RATING C OU D SEM PREJUIZO FISCAL E SEM FALENCIA OU BAIXA
    if (isdemaisPJ && (rating == 'C' || rating == 'D') && comPrejuizo == 'false' && !isFalido && !isBaixado) {
        if (totalPrevidenciario > 0) {
            valorEntrada = totalPrevidenciario * 0.05; // 5% de entrada
            if (valorEntrada < valorMinimo) {
                valorEntrada = valorMinimo; // Garante que o valor de entrada não seja menor que o mínimo
            }
            saldoDevedorAposEntrada = saldoDevedorAposDescontos - valorEntrada;

            // Calcula o número máximo de parcelas para a entrada
            nParcelasEntrada = Math.min(10, Math.floor(valorEntrada / valorMinimo));
            if (valorEntrada / nParcelasEntrada < valorMinimo) {
                nParcelasEntrada = Math.floor(valorEntrada / valorMinimo);
            }

            parcelaAposEntrada = valorEntrada;
        }

    }

    // DEMAIS PJ RATING C OU D COM PREJUIZO FISCAL E SEM FALENCIA OU BAIXA
    if (isdemaisPJ && (rating == 'C' || rating == 'D') && comPrejuizo == 'true' && !isFalido && !isBaixado) {
        if (totalPrevidenciario > 0) {
            valorEntrada = totalPrevidenciario * 0.05; // 5% de entrada
            if (valorEntrada < valorMinimo) {
                valorEntrada = valorMinimo; // Garante que o valor de entrada não seja menor que o mínimo
            }
            saldoDevedorAposEntrada = saldoDevedorAposDescontos - valorEntrada;

            // Calcula o número máximo de parcelas para a entrada
            nParcelasEntrada = Math.min(10, Math.floor(valorEntrada / valorMinimo));
            if (valorEntrada / nParcelasEntrada < valorMinimo) {
                nParcelasEntrada = Math.floor(valorEntrada / valorMinimo);
            }

            parcelaAposEntrada = valorEntrada;
        }

    }

    // DEMAIS PJ RATING C OU D SEM PREJUIZO FISCAL E COM FALENCIA OU BAIXA
    if (isdemaisPJ && (rating == 'C' || rating == 'D') && comPrejuizo == 'false' && (isFalido || isBaixado)) {
        if (totalPrevidenciario > 0) {
            valorEntrada = totalPrevidenciario * 0.05; // 5% de entrada
            if (valorEntrada < valorMinimo) {
                valorEntrada = valorMinimo; // Garante que o valor de entrada não seja menor que o mínimo
            }
            saldoDevedorAposEntrada = saldoDevedorAposDescontos - valorEntrada;

            // Calcula o número máximo de parcelas para a entrada
            nParcelasEntrada = Math.min(10, Math.floor(valorEntrada / valorMinimo));
            if (valorEntrada / nParcelasEntrada < valorMinimo) {
                nParcelasEntrada = Math.floor(valorEntrada / valorMinimo);
            }

            parcelaAposEntrada = valorEntrada;
        }

    }

    // DEMAIS PJ RATING C OU D COM PREJUIZO FISCAL E COM FALENCIA OU BAIXA
    if (isdemaisPJ && (rating == 'C' || rating == 'D') && comPrejuizo == 'true' && (isFalido || isBaixado)) {
        if (totalPrevidenciario > 0) {
            valorEntrada = totalPrevidenciario * 0.05; // 5% de entrada
            if (valorEntrada < valorMinimo) {
                valorEntrada = valorMinimo; // Garante que o valor de entrada não seja menor que o mínimo
            }
            saldoDevedorAposEntrada = saldoDevedorAposDescontos - valorEntrada;

            // Calcula o número máximo de parcelas para a entrada
            nParcelasEntrada = Math.min(10, Math.floor(valorEntrada / valorMinimo));
            if (valorEntrada / nParcelasEntrada < valorMinimo) {
                nParcelasEntrada = Math.floor(valorEntrada / valorMinimo);
            }

            parcelaAposEntrada = valorEntrada;
        }

    }

    return [valorEntrada, nParcelasEntrada, parcelaAposEntrada, saldoDevedorAposEntrada];
}

// FUNCAO QUE CALCULA O PARCELAMENTO DA ENTRADA
function calcularValorParcelasEntrada(elemento, valorEntrada) {
    let parcelas = elemento.querySelector('.selected').querySelector('label').innerHTML.split(' ')[0]; // Captura o número de parcelas selecionadas
    document.querySelector('#parcelaAposEntrada').innerHTML = converterNumeroEmMoeda(valorEntrada / converterStringEmNumero(parcelas)); // Atualiza o valor da parcela
}


//---------------FUNCOES PARA CALCULAR PREJUIZO FISCAL E BASE DE CALCULO NEGATIVA-------------------//
// FUNCAO ACIONADA PELO BOTAO PROSSEGUIR
function prosseguir() {
    let rating = document.querySelector('#rating').value;
    let elemento;

    // ME EPP RATING C OU D E SEM FALENCIA OU BAIXA
    if (isMEEPP && (rating == 'C' || rating == 'D') && !isFalido && !isBaixado) {
        elemento = document.querySelector('#radio-cd-me-epp-no-check2');
    }

    // ME EPP RATING C OU D E COM FALENCIA OU BAIXA
    if (isMEEPP && (rating == 'C' || rating == 'D') && (isFalido || isBaixado)) {
        elemento = document.querySelector('#radio-d-me-epp-check2');
    }

    // DEMAIS RATING C OU D E SEM FALENCIA OU BAIXA
    if (isdemaisPJ && (rating == 'C' || rating == 'D') && !isFalido && !isBaixado) {
        elemento = document.querySelector('#radio-cd-demais-pj-no-check2');
    }

    // DEMAIS RATING C OU D E COM FALENCIA OU BAIXA
    if (isdemaisPJ && (rating == 'C' || rating == 'D') && (isFalido || isBaixado)) {
        elemento = document.querySelector('#radio-d-demais-pj-check2');
    }

    if (!validarCamposObrigatoriosPorSecao('id-detalhamentos-pf-bcn')) {
        showModal(mensagem='Preencha todos os campos antes de prosseguir!');
        return;
    }

    popularTabelaDescontos(elemento);
    popularTabelaEntrada(elemento);
    popularTabelaPrejuizoFiscal(elemento);
    popularTabelaRestante(elemento);

}


// FUNCAO QUE CALCULA PREJUIZO FISCAL E BASE DE CALCULO NEGATIVA
function popularTabelaPrejuizoFiscal(elemento) {
    document.querySelector('#id-detalhamento-utilizacao-pf-bcn').classList.remove('d-none'); // Exibe a seção de detalhamentos de prejuízo fiscal
    comPrejuizo = elemento.getAttribute('data-prejuizo');

    // Limpa a tabela de prejuízo fiscal antes de popular
    const tabelaPrejuizoFiscalBody = document.querySelector('#bd-tabela-calculo-utilizacao-pf-bcn');

    // Inicializa variáveis para os totais
    saldoDevedorAposPf = 0;
    saldoParaCalculoPf = 0;
    saldoDevedorMJE = 0;
    let limiteAbatimento = 0;
    let abatimentoProposto = 0;
    let abatimentoAplicado = 0;
    let montantePf = document.querySelector('#montante-pf').value ? converterStringEmNumero(document.querySelector('#montante-pf').value) : 0;
    let montanteBcn = document.querySelector('#montante-bcn').value ? converterStringEmNumero(document.querySelector('#montante-bcn').value) : 0;
    let aliquotaPf = document.querySelector('#aliquota-pf').value ? converterStringEmNumero(document.querySelector('#aliquota-pf').value) : 0;
    let aliquotaBcn = document.querySelector('#aliquota-bcn').value ? converterStringEmNumero(document.querySelector('#aliquota-bcn').value) : 0;
    let totalValorDescontos = document.querySelector('#total_valor_descontos').textContent ? converterStringEmNumero(document.querySelector('#total_valor_descontos').textContent) : 0;

    // Cria uma nova linha para a tabela de descontos
    const novaLinha = document.createElement('tr');

    saldoParaCalculoPf = saldoDevedorAposDescontos - valorEntrada;
    limiteAbatimento = saldoParaCalculoPf * 0.3;
    abatimentoProposto = (montantePf * (aliquotaPf/100)) + (montanteBcn * (aliquotaBcn/100));
    abatimentoAplicado = Math.min(limiteAbatimento, abatimentoProposto);
    saldoDevedorAposPf = saldoParaCalculoPf - abatimentoAplicado;

    // Adiciona as células à nova linha
    novaLinha.innerHTML = `
        <td class="is-not-component" name="saldo_devedor">${converterNumeroEmMoeda(saldoParaCalculoPf)}</td>
        <td class="is-not-component" name="limite_abatimento">${converterNumeroEmMoeda(limiteAbatimento)}</td>
        <td class="is-not-component" name="abatimento_proposto">${converterNumeroEmMoeda(abatimentoProposto)}</td>
        <td class="is-not-component" name="abatimento_aplicado">${converterNumeroEmMoeda(abatimentoAplicado)}</td>
        <td class="is-not-component" name="saldo_a_pagar">${converterNumeroEmMoeda(saldoDevedorAposPf)}</td>
    `;
    

    // Adiciona a nova linha à tabela de descontos
    tabelaPrejuizoFiscalBody.appendChild(novaLinha);
}


//---------------FUNCOES PARA CALCULAR VALOR RESTANTE A PAGAR--------------------//
// FUNCAO QUE CALCULA RESTANTE A PAGAR OU PARCELAR
function popularTabelaRestante(elemento) {
    let tabelaRestanteBody = document.querySelector('#bd-tabela-calculo-restante');
    let rating = document.querySelector('#rating').value;

    document.querySelector('#id-detalhamento-restante').classList.remove('d-none'); // Exibe a seção de detalhamentos de parcelas
    document.querySelector('#id-btn-gerar-documento').classList.remove('d-none'); // Esconde a seção de detalhamentos de prejuízo fiscal

    // PESSOA NATURAL RATING A OU B
    if (isPessoaNatural && (rating == 'A' || rating == 'B')) {
        saldoParaCalculoRestante = saldoDevedorAposEntrada;
        [nParcelasRestante, parcelaAposDesconto] = calcularMaximoParcelasRestante(saldoParaCalculoRestante);
        if (saldoParaCalculoRestante > 0) {
            contadorParcelasRestante = 0;

            // Popula a tabela de restante
            let template = document.querySelector('#id-linha-tabela-restante').content.cloneNode(true);
            template.querySelector('#criterioTransacao').innerHTML = 'Até 50 meses';
            template.querySelector('#saldoParaCalculoRestante').innerHTML = converterNumeroEmMoeda(saldoParaCalculoRestante);
            template.querySelector('.br-select').setAttribute('onchange', 'calcularValorParcelasRestante(this, saldoParaCalculoRestante)');
            template.querySelector('#parcelaAposDesconto').innerHTML = converterNumeroEmMoeda(parcelaAposDesconto);

            // Gera os br-items do select das parcelas dinamicamente
            let brRadioGroup = template.querySelector('.br-list');
            for (let i = 1; i <= nParcelasRestante; i++) {
                contadorParcelasRestante++; // Incrementa o contador

                let brItemTemplate = document.createElement('div');
                brItemTemplate.classList.add('br-item');
                brItemTemplate.innerHTML = `
                <div class="br-radio">
                <input id="parcela-restante-${contadorParcelasRestante}" type="radio" name="n_parcelas_restante" value="${i}">
                <label for="parcela-restante-${contadorParcelasRestante}">${i} parcelas</label>
                </div>
                `
                brRadioGroup.appendChild(brItemTemplate); // Adiciona o elemento criado ao grupo de radio buttons
            }

            let selectElement = template.querySelector('.br-select');
            tabelaRestanteBody.appendChild(template);
            tabelaRestanteBody.querySelector('#parcela-restante-1').closest('.br-item').classList.add('selected'); // Marca o primeiro radio button como selecionado
            tabelaRestanteBody.querySelector('#parcela-restante-1').setAttribute('checked', ''); // Marca o primeiro radio button como selecionado
            tabelaRestanteBody.querySelector('#parcela-restante-1').checked = true; // Marca o primeiro radio button como selecionado
            
            new core.BRSelect('br-select', selectElement, notFoundElement); // instancia o select
            
        }
    }

    // PESSOA NATURAL RATING C OU D
    if (isPessoaNatural && (rating == 'C' || rating == 'D')) {

        saldoParaCalculoRestante = saldoDevedorAposDescontos - valorEntrada;
        [nParcelasRestante, parcelaAposDesconto] = calcularMaximoParcelasRestante(saldoParaCalculoRestante);

        if (saldoParaCalculoRestante > 0) {
            contadorParcelasRestante = 0;

            // Popula a tabela de restante
            let template = document.querySelector('#id-linha-tabela-restante').content.cloneNode(true);
            template.querySelector('#criterioTransacao').innerHTML = 'Até 50 meses';
            template.querySelector('#saldoParaCalculoRestante').innerHTML = converterNumeroEmMoeda(saldoParaCalculoRestante);
            template.querySelector('.br-select').setAttribute('onchange', 'calcularValorParcelasRestante(this, saldoParaCalculoRestante)');
            template.querySelector('#parcelaAposDesconto').innerHTML = converterNumeroEmMoeda(parcelaAposDesconto);

            // Gera os br-items do select das parcelas dinamicamente
            let brRadioGroup = template.querySelector('.br-list');
            for (let i = 1; i <= nParcelasRestante; i++) {
                contadorParcelasRestante++; // Incrementa o contador

                let brItemTemplate = document.createElement('div');
                brItemTemplate.classList.add('br-item');
                brItemTemplate.innerHTML = `
                <div class="br-radio">
                <input id="parcela-restante-${contadorParcelasRestante}" type="radio" name="n_parcelas_restante" value="${i}">
                <label for="parcela-restante-${contadorParcelasRestante}">${i} parcelas</label>
                </div>
                `
                brRadioGroup.appendChild(brItemTemplate); // Adiciona o elemento criado ao grupo de radio buttons
            }

            let selectElement = template.querySelector('.br-select');
            let tabelaRestanteBody = document.querySelector('#bd-tabela-calculo-restante');
            tabelaRestanteBody.appendChild(template);
            tabelaRestanteBody.querySelector('#parcela-restante-1').closest('.br-item').classList.add('selected'); // Marca o primeiro radio button como selecionado
            tabelaRestanteBody.querySelector('#parcela-restante-1').setAttribute('checked', ''); // Marca o primeiro radio button como selecionado
            tabelaRestanteBody.querySelector('#parcela-restante-1').checked = true; // Marca o primeiro radio button como selecionado
            
            new core.BRSelect('br-select', selectElement, notFoundElement); // instancia o select
            
        }
    }

    // PESSOA INDICATIVO DE OBITO RATING D SEMPRE
    if (isPessoaObito) {

        saldoParaCalculoRestante = saldoDevedorAposDescontos - valorEntrada;
        [nParcelasRestante, parcelaAposDesconto] = calcularMaximoParcelasRestante(saldoParaCalculoRestante);

        if (saldoParaCalculoRestante > 0) {
            contadorParcelasRestante = 0;

            // Popula a tabela de restante
            let template = document.querySelector('#id-linha-tabela-restante').content.cloneNode(true);
            template.querySelector('#criterioTransacao').innerHTML = 'Até 50 meses';
            template.querySelector('#saldoParaCalculoRestante').innerHTML = converterNumeroEmMoeda(saldoParaCalculoRestante);
            template.querySelector('.br-select').setAttribute('onchange', 'calcularValorParcelasRestante(this, saldoParaCalculoRestante)');
            template.querySelector('#parcelaAposDesconto').innerHTML = converterNumeroEmMoeda(parcelaAposDesconto);

            // Gera os br-items do select das parcelas dinamicamente
            let brRadioGroup = template.querySelector('.br-list');
            for (let i = 1; i <= nParcelasRestante; i++) {
                contadorParcelasRestante++; // Incrementa o contador

                let brItemTemplate = document.createElement('div');
                brItemTemplate.classList.add('br-item');
                brItemTemplate.innerHTML = `
                <div class="br-radio">
                <input id="parcela-restante-${contadorParcelasRestante}" type="radio" name="n_parcelas_restante" value="${i}">
                <label for="parcela-restante-${contadorParcelasRestante}">${i} parcelas</label>
                </div>
                `
                brRadioGroup.appendChild(brItemTemplate); // Adiciona o elemento criado ao grupo de radio buttons
            }

            let selectElement = template.querySelector('.br-select');
            let tabelaRestanteBody = document.querySelector('#bd-tabela-calculo-restante');
            tabelaRestanteBody.appendChild(template);
            tabelaRestanteBody.querySelector('#parcela-restante-1').closest('.br-item').classList.add('selected'); // Marca o primeiro radio button como selecionado
            tabelaRestanteBody.querySelector('#parcela-restante-1').setAttribute('checked', ''); // Marca o primeiro radio button como selecionado
            tabelaRestanteBody.querySelector('#parcela-restante-1').checked = true; // Marca o primeiro radio button como selecionado
            
            new core.BRSelect('br-select', selectElement, notFoundElement); // instancia o select
            
        }
    }

    // ME EPP RATING A OU B
    if (isMEEPP && (rating == 'A' || rating == 'B')) {

        saldoParaCalculoRestante = saldoDevedorAposEntrada;
        [nParcelasRestante, parcelaAposDesconto] = calcularMaximoParcelasRestante(saldoParaCalculoRestante);

        if (saldoParaCalculoRestante > 0) {
            contadorParcelasRestante = 0;

            // Popula a tabela de restante
            let template = document.querySelector('#id-linha-tabela-restante').content.cloneNode(true);
            template.querySelector('#criterioTransacao').innerHTML = 'Até 50 meses';
            template.querySelector('#saldoParaCalculoRestante').innerHTML = converterNumeroEmMoeda(saldoParaCalculoRestante);
            template.querySelector('.br-select').setAttribute('onchange', 'calcularValorParcelasRestante(this, saldoParaCalculoRestante)');
            template.querySelector('#parcelaAposDesconto').innerHTML = converterNumeroEmMoeda(parcelaAposDesconto);

            // Gera os br-items do select das parcelas dinamicamente
            let brRadioGroup = template.querySelector('.br-list');
            for (let i = 1; i <= nParcelasRestante; i++) {
                contadorParcelasRestante++; // Incrementa o contador

                let brItemTemplate = document.createElement('div');
                brItemTemplate.classList.add('br-item');
                brItemTemplate.innerHTML = `
                <div class="br-radio">
                <input id="parcela-restante-${contadorParcelasRestante}" type="radio" name="n_parcelas_restante" value="${i}">
                <label for="parcela-restante-${contadorParcelasRestante}">${i} parcelas</label>
                </div>
                `
                brRadioGroup.appendChild(brItemTemplate); // Adiciona o elemento criado ao grupo de radio buttons
            }

            let selectElement = template.querySelector('.br-select');
            let tabelaRestanteBody = document.querySelector('#bd-tabela-calculo-restante');
            tabelaRestanteBody.appendChild(template);
            tabelaRestanteBody.querySelector('#parcela-restante-1').closest('.br-item').classList.add('selected'); // Marca o primeiro radio button como selecionado
            tabelaRestanteBody.querySelector('#parcela-restante-1').setAttribute('checked', ''); // Marca o primeiro radio button como selecionado
            tabelaRestanteBody.querySelector('#parcela-restante-1').checked = true; // Marca o primeiro radio button como selecionado
            
            new core.BRSelect('br-select', selectElement, notFoundElement); // instancia o select
            
        }
    }

    // ME EPP RATING C OU D SEM PREJUIZO FISCAL E SEM FALENCIA OU BAIXA
    if (isMEEPP && (rating == 'C' || rating == 'D') && comPrejuizo == 'false' && !isFalido && !isBaixado) {

        saldoParaCalculoRestante = saldoDevedorAposDescontos - valorEntrada;
        [nParcelasRestante, parcelaAposDesconto] = calcularMaximoParcelasRestante(saldoParaCalculoRestante);

        if (saldoParaCalculoRestante > 0) {
            contadorParcelasRestante = 0;

            // Popula a tabela de restante
            let template = document.querySelector('#id-linha-tabela-restante').content.cloneNode(true);
            template.querySelector('#criterioTransacao').innerHTML = 'Até 50 meses';
            template.querySelector('#saldoParaCalculoRestante').innerHTML = converterNumeroEmMoeda(saldoParaCalculoRestante);
            template.querySelector('.br-select').setAttribute('onchange', 'calcularValorParcelasRestante(this, saldoParaCalculoRestante)');
            template.querySelector('#parcelaAposDesconto').innerHTML = converterNumeroEmMoeda(parcelaAposDesconto);

            // Gera os br-items do select das parcelas dinamicamente
            let brRadioGroup = template.querySelector('.br-list');
            for (let i = 1; i <= nParcelasRestante; i++) {
                contadorParcelasRestante++; // Incrementa o contador

                let brItemTemplate = document.createElement('div');
                brItemTemplate.classList.add('br-item');
                brItemTemplate.innerHTML = `
                <div class="br-radio">
                <input id="parcela-restante-${contadorParcelasRestante}" type="radio" name="n_parcelas_restante" value="${i}">
                <label for="parcela-restante-${contadorParcelasRestante}">${i} parcelas</label>
                </div>
                `
                brRadioGroup.appendChild(brItemTemplate); // Adiciona o elemento criado ao grupo de radio buttons
            }

            let selectElement = template.querySelector('.br-select');
            let tabelaRestanteBody = document.querySelector('#bd-tabela-calculo-restante');
            tabelaRestanteBody.appendChild(template);
            tabelaRestanteBody.querySelector('#parcela-restante-1').closest('.br-item').classList.add('selected'); // Marca o primeiro radio button como selecionado
            tabelaRestanteBody.querySelector('#parcela-restante-1').setAttribute('checked', ''); // Marca o primeiro radio button como selecionado
            tabelaRestanteBody.querySelector('#parcela-restante-1').checked = true; // Marca o primeiro radio button como selecionado
            
            new core.BRSelect('br-select', selectElement, notFoundElement); // instancia o select
            
        }
    }

    // ME EPP RATING C OU D SEM PREJUIZO FISCAL COM FALENCIA OU BAIXA
    if (isMEEPP && (rating == 'C' || rating == 'D') && comPrejuizo == 'false' && (isFalido || isBaixado)) {

        saldoParaCalculoRestante = saldoDevedorAposDescontos - valorEntrada;
        [nParcelasRestante, parcelaAposDesconto] = calcularMaximoParcelasRestante(saldoParaCalculoRestante);

        if (saldoParaCalculoRestante > 0) {
            contadorParcelasRestante = 0;

            // Popula a tabela de restante
            let template = document.querySelector('#id-linha-tabela-restante').content.cloneNode(true);
            template.querySelector('#criterioTransacao').innerHTML = 'Até 50 meses';
            template.querySelector('#saldoParaCalculoRestante').innerHTML = converterNumeroEmMoeda(saldoParaCalculoRestante);
            template.querySelector('.br-select').setAttribute('onchange', 'calcularValorParcelasRestante(this, saldoParaCalculoRestante)');
            template.querySelector('#parcelaAposDesconto').innerHTML = converterNumeroEmMoeda(parcelaAposDesconto);

            // Gera os br-items do select das parcelas dinamicamente
            let brRadioGroup = template.querySelector('.br-list');
            for (let i = 1; i <= nParcelasRestante; i++) {
                contadorParcelasRestante++; // Incrementa o contador

                let brItemTemplate = document.createElement('div');
                brItemTemplate.classList.add('br-item');
                brItemTemplate.innerHTML = `
                <div class="br-radio">
                <input id="parcela-restante-${contadorParcelasRestante}" type="radio" name="n_parcelas_restante" value="${i}">
                <label for="parcela-restante-${contadorParcelasRestante}">${i} parcelas</label>
                </div>
                `
                brRadioGroup.appendChild(brItemTemplate); // Adiciona o elemento criado ao grupo de radio buttons
            }

            let selectElement = template.querySelector('.br-select');
            let tabelaRestanteBody = document.querySelector('#bd-tabela-calculo-restante');
            tabelaRestanteBody.appendChild(template);
            tabelaRestanteBody.querySelector('#parcela-restante-1').closest('.br-item').classList.add('selected'); // Marca o primeiro radio button como selecionado
            tabelaRestanteBody.querySelector('#parcela-restante-1').setAttribute('checked', ''); // Marca o primeiro radio button como selecionado
            tabelaRestanteBody.querySelector('#parcela-restante-1').checked = true; // Marca o primeiro radio button como selecionado
            
            new core.BRSelect('br-select', selectElement, notFoundElement); // instancia o select
            
        }
    }

    // ME EPP RATING C OU D COM PREJUIZO FISCAL E SEM FALENCIA OU BAIXA
    if (isMEEPP && (rating == 'C' || rating == 'D') && comPrejuizo == 'true' && !isFalido && !isBaixado) {

        saldoParaCalculoRestante = saldoDevedorAposPf;
        [nParcelasRestante, parcelaAposDesconto] = calcularMaximoParcelasRestante(saldoParaCalculoRestante);

        if (saldoParaCalculoRestante > 0) {
            contadorParcelasRestante = 0;

            // Popula a tabela de restante
            let template = document.querySelector('#id-linha-tabela-restante').content.cloneNode(true);
            template.querySelector('#criterioTransacao').innerHTML = 'Até 50 meses';
            template.querySelector('#saldoParaCalculoRestante').innerHTML = converterNumeroEmMoeda(saldoParaCalculoRestante);
            template.querySelector('.br-select').setAttribute('onchange', 'calcularValorParcelasRestante(this, saldoParaCalculoRestante)');
            template.querySelector('#parcelaAposDesconto').innerHTML = converterNumeroEmMoeda(parcelaAposDesconto);

            // Gera os br-items do select das parcelas dinamicamente
            let brRadioGroup = template.querySelector('.br-list');
            for (let i = 1; i <= nParcelasRestante; i++) {
                contadorParcelasRestante++; // Incrementa o contador

                let brItemTemplate = document.createElement('div');
                brItemTemplate.classList.add('br-item');
                brItemTemplate.innerHTML = `
                <div class="br-radio">
                <input id="parcela-restante-${contadorParcelasRestante}" type="radio" name="n_parcelas_restante" value="${i}">
                <label for="parcela-restante-${contadorParcelasRestante}">${i} parcelas</label>
                </div>
                `
                brRadioGroup.appendChild(brItemTemplate); // Adiciona o elemento criado ao grupo de radio buttons
            }

            let selectElement = template.querySelector('.br-select');
            let tabelaRestanteBody = document.querySelector('#bd-tabela-calculo-restante');
            tabelaRestanteBody.appendChild(template);
            tabelaRestanteBody.querySelector('#parcela-restante-1').closest('.br-item').classList.add('selected'); // Marca o primeiro radio button como selecionado
            tabelaRestanteBody.querySelector('#parcela-restante-1').setAttribute('checked', ''); // Marca o primeiro radio button como selecionado
            tabelaRestanteBody.querySelector('#parcela-restante-1').checked = true; // Marca o primeiro radio button como selecionado
            
            new core.BRSelect('br-select', selectElement, notFoundElement); // instancia o select
            
        }
    }

    // ME EPP RATING C OU D COM PREJUIZO FISCAL E COM FALENCIA OU BAIXA
    if (isMEEPP && (rating == 'C' || rating == 'D') && comPrejuizo == 'true' && (isFalido || isBaixado)) {

        saldoParaCalculoRestante = saldoDevedorAposPf;
        [nParcelasRestante, parcelaAposDesconto] = calcularMaximoParcelasRestante(saldoParaCalculoRestante);

        if (saldoParaCalculoRestante > 0) {
            contadorParcelasRestante = 0;

            // Popula a tabela de restante
            let template = document.querySelector('#id-linha-tabela-restante').content.cloneNode(true);
            template.querySelector('#criterioTransacao').innerHTML = 'Até 50 meses';
            template.querySelector('#saldoParaCalculoRestante').innerHTML = converterNumeroEmMoeda(saldoParaCalculoRestante);
            template.querySelector('.br-select').setAttribute('onchange', 'calcularValorParcelasRestante(this, saldoParaCalculoRestante)');
            template.querySelector('#parcelaAposDesconto').innerHTML = converterNumeroEmMoeda(parcelaAposDesconto);

            // Gera os br-items do select das parcelas dinamicamente
            let brRadioGroup = template.querySelector('.br-list');
            for (let i = 1; i <= nParcelasRestante; i++) {
                contadorParcelasRestante++; // Incrementa o contador

                let brItemTemplate = document.createElement('div');
                brItemTemplate.classList.add('br-item');
                brItemTemplate.innerHTML = `
                <div class="br-radio">
                <input id="parcela-restante-${contadorParcelasRestante}" type="radio" name="n_parcelas_restante" value="${i}">
                <label for="parcela-restante-${contadorParcelasRestante}">${i} parcelas</label>
                </div>
                `
                brRadioGroup.appendChild(brItemTemplate); // Adiciona o elemento criado ao grupo de radio buttons
            }

            let selectElement = template.querySelector('.br-select');
            let tabelaRestanteBody = document.querySelector('#bd-tabela-calculo-restante');
            tabelaRestanteBody.appendChild(template);
            tabelaRestanteBody.querySelector('#parcela-restante-1').closest('.br-item').classList.add('selected'); // Marca o primeiro radio button como selecionado
            tabelaRestanteBody.querySelector('#parcela-restante-1').setAttribute('checked', ''); // Marca o primeiro radio button como selecionado
            tabelaRestanteBody.querySelector('#parcela-restante-1').checked = true; // Marca o primeiro radio button como selecionado
            
            new core.BRSelect('br-select', selectElement, notFoundElement); // instancia o select
            
        }
    }

    // DEMAIS PJ RATING A OU B
    if (isdemaisPJ && (rating == 'A' || rating == 'B')) {
        saldoParaCalculoRestante = saldoDevedorAposEntrada;
        [nParcelasRestante, parcelaAposDesconto] = calcularMaximoParcelasRestante(saldoParaCalculoRestante);
        if (saldoParaCalculoRestante > 0) {
            contadorParcelasRestante = 0;

            // Popula a tabela de restante
            let template = document.querySelector('#id-linha-tabela-restante').content.cloneNode(true);
            template.querySelector('#criterioTransacao').innerHTML = 'Até 50 meses';
            template.querySelector('#saldoParaCalculoRestante').innerHTML = converterNumeroEmMoeda(saldoParaCalculoRestante);
            template.querySelector('.br-select').setAttribute('onchange', 'calcularValorParcelasRestante(this, saldoParaCalculoRestante)');
            template.querySelector('#parcelaAposDesconto').innerHTML = converterNumeroEmMoeda(parcelaAposDesconto);

            // Gera os br-items do select das parcelas dinamicamente
            let brRadioGroup = template.querySelector('.br-list');
            for (let i = 1; i <= nParcelasRestante; i++) {
                contadorParcelasRestante++; // Incrementa o contador

                let brItemTemplate = document.createElement('div');
                brItemTemplate.classList.add('br-item');
                brItemTemplate.innerHTML = `
                <div class="br-radio">
                <input id="parcela-restante-${contadorParcelasRestante}" type="radio" name="n_parcelas_restante" value="${i}">
                <label for="parcela-restante-${contadorParcelasRestante}">${i} parcelas</label>
                </div>
                `
                brRadioGroup.appendChild(brItemTemplate); // Adiciona o elemento criado ao grupo de radio buttons
            }

            let selectElement = template.querySelector('.br-select');
            let tabelaRestanteBody = document.querySelector('#bd-tabela-calculo-restante');
            tabelaRestanteBody.appendChild(template);
            tabelaRestanteBody.querySelector('#parcela-restante-1').closest('.br-item').classList.add('selected'); // Marca o primeiro radio button como selecionado
            tabelaRestanteBody.querySelector('#parcela-restante-1').setAttribute('checked', ''); // Marca o primeiro radio button como selecionado
            tabelaRestanteBody.querySelector('#parcela-restante-1').checked = true; // Marca o primeiro radio button como selecionado
            
            new core.BRSelect('br-select', selectElement, notFoundElement); // instancia o select
            
        }
    }

    // DEMAIS RATING C OU D SEM PREJUIZO FISCAL E SEM FALENCIA OU BAIXA
    if (isdemaisPJ && (rating == 'C' || rating == 'D') && comPrejuizo == 'false' && !isFalido && !isBaixado) {

        saldoParaCalculoRestante = saldoDevedorAposDescontos - valorEntrada;
        [nParcelasRestante, parcelaAposDesconto] = calcularMaximoParcelasRestante(saldoParaCalculoRestante);

        if (saldoParaCalculoRestante > 0) {
            contadorParcelasRestante = 0;

            // Popula a tabela de restante
            let template = document.querySelector('#id-linha-tabela-restante').content.cloneNode(true);
            template.querySelector('#criterioTransacao').innerHTML = 'Até 50 meses';
            template.querySelector('#saldoParaCalculoRestante').innerHTML = converterNumeroEmMoeda(saldoParaCalculoRestante);
            template.querySelector('.br-select').setAttribute('onchange', 'calcularValorParcelasRestante(this, saldoParaCalculoRestante)');
            template.querySelector('#parcelaAposDesconto').innerHTML = converterNumeroEmMoeda(parcelaAposDesconto);

            // Gera os br-items do select das parcelas dinamicamente
            let brRadioGroup = template.querySelector('.br-list');
            for (let i = 1; i <= nParcelasRestante; i++) {
                contadorParcelasRestante++; // Incrementa o contador

                let brItemTemplate = document.createElement('div');
                brItemTemplate.classList.add('br-item');
                brItemTemplate.innerHTML = `
                <div class="br-radio">
                <input id="parcela-restante-${contadorParcelasRestante}" type="radio" name="n_parcelas_restante" value="${i}">
                <label for="parcela-restante-${contadorParcelasRestante}">${i} parcelas</label>
                </div>
                `
                brRadioGroup.appendChild(brItemTemplate); // Adiciona o elemento criado ao grupo de radio buttons
            }

            let selectElement = template.querySelector('.br-select');
            let tabelaRestanteBody = document.querySelector('#bd-tabela-calculo-restante');
            tabelaRestanteBody.appendChild(template);
            tabelaRestanteBody.querySelector('#parcela-restante-1').closest('.br-item').classList.add('selected'); // Marca o primeiro radio button como selecionado
            tabelaRestanteBody.querySelector('#parcela-restante-1').setAttribute('checked', ''); // Marca o primeiro radio button como selecionado
            tabelaRestanteBody.querySelector('#parcela-restante-1').checked = true; // Marca o primeiro radio button como selecionado
            
            new core.BRSelect('br-select', selectElement, notFoundElement); // instancia o select
            
        }
    }

    // DEMAIS RATING C OU D COM PREJUIZO FISCAL E SEM FALENCIA OU BAIXA
    if (isdemaisPJ && (rating == 'C' || rating == 'D') && comPrejuizo == 'true' && !isFalido && !isBaixado) {

        saldoParaCalculoRestante = saldoDevedorAposPf;
        [nParcelasRestante, parcelaAposDesconto] = calcularMaximoParcelasRestante(saldoParaCalculoRestante);

        if (saldoParaCalculoRestante > 0) {
            contadorParcelasRestante = 0;

            // Popula a tabela de restante
            let template = document.querySelector('#id-linha-tabela-restante').content.cloneNode(true);
            template.querySelector('#criterioTransacao').innerHTML = 'Até 50 meses';
            template.querySelector('#saldoParaCalculoRestante').innerHTML = converterNumeroEmMoeda(saldoParaCalculoRestante);
            template.querySelector('.br-select').setAttribute('onchange', 'calcularValorParcelasRestante(this, saldoParaCalculoRestante)');
            template.querySelector('#parcelaAposDesconto').innerHTML = converterNumeroEmMoeda(parcelaAposDesconto);

            // Gera os br-items do select das parcelas dinamicamente
            let brRadioGroup = template.querySelector('.br-list');
            for (let i = 1; i <= nParcelasRestante; i++) {
                contadorParcelasRestante++; // Incrementa o contador

                let brItemTemplate = document.createElement('div');
                brItemTemplate.classList.add('br-item');
                brItemTemplate.innerHTML = `
                <div class="br-radio">
                <input id="parcela-restante-${contadorParcelasRestante}" type="radio" name="n_parcelas_restante" value="${i}">
                <label for="parcela-restante-${contadorParcelasRestante}">${i} parcelas</label>
                </div>
                `
                brRadioGroup.appendChild(brItemTemplate); // Adiciona o elemento criado ao grupo de radio buttons
            }

            let selectElement = template.querySelector('.br-select');
            let tabelaRestanteBody = document.querySelector('#bd-tabela-calculo-restante');
            tabelaRestanteBody.appendChild(template);
            tabelaRestanteBody.querySelector('#parcela-restante-1').closest('.br-item').classList.add('selected'); // Marca o primeiro radio button como selecionado
            tabelaRestanteBody.querySelector('#parcela-restante-1').setAttribute('checked', ''); // Marca o primeiro radio button como selecionado
            tabelaRestanteBody.querySelector('#parcela-restante-1').checked = true; // Marca o primeiro radio button como selecionado
            
            new core.BRSelect('br-select', selectElement, notFoundElement); // instancia o select
            
        }
    }

    // DEMAIS RATING C OU D SEM PREJUIZO FISCAL E COM FALENCIA OU BAIXA
    if (isdemaisPJ && (rating == 'C' || rating == 'D') && comPrejuizo == 'false' && (isFalido || isBaixado)) {

        saldoParaCalculoRestante = saldoDevedorAposDescontos - valorEntrada;
        [nParcelasRestante, parcelaAposDesconto] = calcularMaximoParcelasRestante(saldoParaCalculoRestante);

        if (saldoParaCalculoRestante > 0) {
            contadorParcelasRestante = 0;

            // Popula a tabela de restante
            let template = document.querySelector('#id-linha-tabela-restante').content.cloneNode(true);
            template.querySelector('#criterioTransacao').innerHTML = 'Até 50 meses';
            template.querySelector('#saldoParaCalculoRestante').innerHTML = converterNumeroEmMoeda(saldoParaCalculoRestante);
            template.querySelector('.br-select').setAttribute('onchange', 'calcularValorParcelasRestante(this, saldoParaCalculoRestante)');
            template.querySelector('#parcelaAposDesconto').innerHTML = converterNumeroEmMoeda(parcelaAposDesconto);

            // Gera os br-items do select das parcelas dinamicamente
            let brRadioGroup = template.querySelector('.br-list');
            for (let i = 1; i <= nParcelasRestante; i++) {
                contadorParcelasRestante++; // Incrementa o contador

                let brItemTemplate = document.createElement('div');
                brItemTemplate.classList.add('br-item');
                brItemTemplate.innerHTML = `
                <div class="br-radio">
                <input id="parcela-restante-${contadorParcelasRestante}" type="radio" name="n_parcelas_restante" value="${i}">
                <label for="parcela-restante-${contadorParcelasRestante}">${i} parcelas</label>
                </div>
                `
                brRadioGroup.appendChild(brItemTemplate); // Adiciona o elemento criado ao grupo de radio buttons
            }

            let selectElement = template.querySelector('.br-select');
            let tabelaRestanteBody = document.querySelector('#bd-tabela-calculo-restante');
            tabelaRestanteBody.appendChild(template);
            tabelaRestanteBody.querySelector('#parcela-restante-1').closest('.br-item').classList.add('selected'); // Marca o primeiro radio button como selecionado
            tabelaRestanteBody.querySelector('#parcela-restante-1').setAttribute('checked', ''); // Marca o primeiro radio button como selecionado
            tabelaRestanteBody.querySelector('#parcela-restante-1').checked = true; // Marca o primeiro radio button como selecionado
            
            new core.BRSelect('br-select', selectElement, notFoundElement); // instancia o select
            
        }
    }

    // DEMAIS RATING C OU D COM PREJUIZO FISCAL E COM FALENCIA OU BAIXA
    if (isdemaisPJ && (rating == 'C' || rating == 'D') && comPrejuizo == 'true' && (isFalido || isBaixado)) {

        saldoParaCalculoRestante = saldoDevedorAposPf;
        [nParcelasRestante, parcelaAposDesconto] = calcularMaximoParcelasRestante(saldoParaCalculoRestante);

        if (saldoParaCalculoRestante > 0) {
            contadorParcelasRestante = 0;

            // Popula a tabela de restante
            let template = document.querySelector('#id-linha-tabela-restante').content.cloneNode(true);
            template.querySelector('#criterioTransacao').innerHTML = 'Até 50 meses';
            template.querySelector('#saldoParaCalculoRestante').innerHTML = converterNumeroEmMoeda(saldoParaCalculoRestante);
            template.querySelector('.br-select').setAttribute('onchange', 'calcularValorParcelasRestante(this, saldoParaCalculoRestante)');
            template.querySelector('#parcelaAposDesconto').innerHTML = converterNumeroEmMoeda(parcelaAposDesconto);

            // Gera os br-items do select das parcelas dinamicamente
            let brRadioGroup = template.querySelector('.br-list');
            for (let i = 1; i <= nParcelasRestante; i++) {
                contadorParcelasRestante++; // Incrementa o contador

                let brItemTemplate = document.createElement('div');
                brItemTemplate.classList.add('br-item');
                brItemTemplate.innerHTML = `
                <div class="br-radio">
                <input id="parcela-restante-${contadorParcelasRestante}" type="radio" name="n_parcelas_restante" value="${i}">
                <label for="parcela-restante-${contadorParcelasRestante}">${i} parcelas</label>
                </div>
                `
                brRadioGroup.appendChild(brItemTemplate); // Adiciona o elemento criado ao grupo de radio buttons
            }

            let selectElement = template.querySelector('.br-select');
            let tabelaRestanteBody = document.querySelector('#bd-tabela-calculo-restante');
            tabelaRestanteBody.appendChild(template);
            tabelaRestanteBody.querySelector('#parcela-restante-1').closest('.br-item').classList.add('selected'); // Marca o primeiro radio button como selecionado
            tabelaRestanteBody.querySelector('#parcela-restante-1').setAttribute('checked', ''); // Marca o primeiro radio button como selecionado
            tabelaRestanteBody.querySelector('#parcela-restante-1').checked = true; // Marca o primeiro radio button como selecionado
            
            new core.BRSelect('br-select', selectElement, notFoundElement); // instancia o select
            
        }
    }

}


// FUNCAO QUE CALCULA O MAXIMO DE PARCELAS RESTANTE
function calcularMaximoParcelasRestante(saldoParaCalculoRestante) {
    let rating = document.querySelector('#rating').value;

    nParcelasRestante = 0;
    parcelaAposDesconto = 0;

    // PESSOA NATURAL RATING A OU B
    if (isPessoaNatural && (rating == 'A' || rating == 'B')) {
        if (saldoParaCalculoRestante > 0) {

            // Calcula o número máximo de parcelas para o restante a pagar
            nParcelasRestante = Math.min(50, Math.floor(saldoParaCalculoRestante / valorMinimo));
            if (saldoParaCalculoRestante / nParcelasRestante < valorMinimo) {
                nParcelasRestante = Math.floor(saldoParaCalculoRestante / valorMinimo);
            }

            parcelaAposDesconto = saldoParaCalculoRestante;
        }

    }

    // PESSOA NATURAL RATING C OU D
    if (isPessoaNatural && (rating == 'C' || rating == 'D')) {
        if (saldoParaCalculoRestante > 0) {

            // Calcula o número máximo de parcelas para o restante a pagar
            nParcelasRestante = Math.min(50, Math.floor(saldoParaCalculoRestante / valorMinimo));
            if (saldoParaCalculoRestante / nParcelasRestante < valorMinimo) {
                nParcelasRestante = Math.floor(saldoParaCalculoRestante / valorMinimo);
            }

            parcelaAposDesconto = saldoParaCalculoRestante;
        }

    }

    // PESSOA INDICATIVO DE OBITO RATING D SEMPRE
    if (isPessoaObito) {
        if (saldoParaCalculoRestante > 0) {

            // Calcula o número máximo de parcelas para o restante a pagar
            nParcelasRestante = Math.min(50, Math.floor(saldoParaCalculoRestante / valorMinimo));
            if (saldoParaCalculoRestante / nParcelasRestante < valorMinimo) {
                nParcelasRestante = Math.floor(saldoParaCalculoRestante / valorMinimo);
            }

            parcelaAposDesconto = saldoParaCalculoRestante;
        }

    }

    // ME EPP RATING A OU B
    if (isMEEPP && (rating == 'A' || rating == 'B')) {
        if (saldoParaCalculoRestante > 0) {

            // Calcula o número máximo de parcelas para o restante a pagar
            nParcelasRestante = Math.min(50, Math.floor(saldoParaCalculoRestante / valorMinimo));
            if (saldoParaCalculoRestante / nParcelasRestante < valorMinimo) {
                nParcelasRestante = Math.floor(saldoParaCalculoRestante / valorMinimo);
            }

            parcelaAposDesconto = saldoParaCalculoRestante;
        }

    }

    // ME EPP RATING C OU D SEM PREJUIZO FISCAL E SEM FALENCIA OU BAIXA
    if (isMEEPP && (rating == 'C' || rating == 'D') && comPrejuizo == 'false' && !isFalido && !isBaixado) {
        if (saldoParaCalculoRestante > 0) {

            // Calcula o número máximo de parcelas para o restante a pagar
            nParcelasRestante = Math.min(50, Math.floor(saldoParaCalculoRestante / valorMinimo));
            if (saldoParaCalculoRestante / nParcelasRestante < valorMinimo) {
                nParcelasRestante = Math.floor(saldoParaCalculoRestante / valorMinimo);
            }

            parcelaAposDesconto = saldoParaCalculoRestante;
        }

    }

    // ME EPP RATING C OU D SEM PREJUIZO FISCAL E COM FALENCIA OU BAIXA
    if (isMEEPP && (rating == 'C' || rating == 'D') && comPrejuizo == 'false' && (isFalido || isBaixado)) {
        if (saldoParaCalculoRestante > 0) {

            // Calcula o número máximo de parcelas para o restante a pagar
            nParcelasRestante = Math.min(50, Math.floor(saldoParaCalculoRestante / valorMinimo));
            if (saldoParaCalculoRestante / nParcelasRestante < valorMinimo) {
                nParcelasRestante = Math.floor(saldoParaCalculoRestante / valorMinimo);
            }

            parcelaAposDesconto = saldoParaCalculoRestante;
        }

    }

    // ME EPP RATING C OU D COM PREJUIZO FISCAL E SEM FALENCIA OU BAIXA
    if (isMEEPP && (rating == 'C' || rating == 'D') && comPrejuizo == 'true' && !isFalido && !isBaixado) {
        if (saldoParaCalculoRestante > 0) {

            // Calcula o número máximo de parcelas para o restante a pagar
            nParcelasRestante = Math.min(50, Math.floor(saldoParaCalculoRestante / valorMinimo));
            if (saldoParaCalculoRestante / nParcelasRestante < valorMinimo) {
                nParcelasRestante = Math.floor(saldoParaCalculoRestante / valorMinimo);
            }

            parcelaAposDesconto = saldoParaCalculoRestante;
        }

    }

    // ME EPP RATING C OU D COM PREJUIZO FISCAL E COM FALENCIA OU BAIXA
    if (isMEEPP && (rating == 'C' || rating == 'D') && comPrejuizo == 'true' && (isFalido || isBaixado)) {
        if (saldoParaCalculoRestante > 0) {

            // Calcula o número máximo de parcelas para o restante a pagar
            nParcelasRestante = Math.min(50, Math.floor(saldoParaCalculoRestante / valorMinimo));
            if (saldoParaCalculoRestante / nParcelasRestante < valorMinimo) {
                nParcelasRestante = Math.floor(saldoParaCalculoRestante / valorMinimo);
            }

            parcelaAposDesconto = saldoParaCalculoRestante;
        }

    }

    // DEMAIS PJ RATING A OU B
    if (isdemaisPJ && (rating == 'A' || rating == 'B')) {
        if (saldoParaCalculoRestante > 0) {

            // Calcula o número máximo de parcelas para o restante a pagar
            nParcelasRestante = Math.min(50, Math.floor(saldoParaCalculoRestante / valorMinimo));
            if (saldoParaCalculoRestante / nParcelasRestante < valorMinimo) {
                nParcelasRestante = Math.floor(saldoParaCalculoRestante / valorMinimo);
            }

            parcelaAposDesconto = saldoParaCalculoRestante;
        }

    }

    // DEMAIS RATING C OU D SEM PREJUIZO FISCAL E SEM FALENCIA OU BAIXA
    if (isdemaisPJ && (rating == 'C' || rating == 'D') && comPrejuizo == 'false' && !isFalido && !isBaixado) {
        if (saldoParaCalculoRestante > 0) {

            // Calcula o número máximo de parcelas para o restante a pagar
            nParcelasRestante = Math.min(50, Math.floor(saldoParaCalculoRestante / valorMinimo));
            if (saldoParaCalculoRestante / nParcelasRestante < valorMinimo) {
                nParcelasRestante = Math.floor(saldoParaCalculoRestante / valorMinimo);
            }

            parcelaAposDesconto = saldoParaCalculoRestante;
        }

    }

    // DEMAIS RATING C OU D COM PREJUIZO FISCAL E SEM FALENCIA OU BAIXA
    if (isdemaisPJ && (rating == 'C' || rating == 'D') && comPrejuizo == 'true' && !isFalido && !isBaixado) {
        if (saldoParaCalculoRestante > 0) {

            // Calcula o número máximo de parcelas para o restante a pagar
            nParcelasRestante = Math.min(50, Math.floor(saldoParaCalculoRestante / valorMinimo));
            if (saldoParaCalculoRestante / nParcelasRestante < valorMinimo) {
                nParcelasRestante = Math.floor(saldoParaCalculoRestante / valorMinimo);
            }

            parcelaAposDesconto = saldoParaCalculoRestante;
        }

    }

    // DEMAIS RATING C OU D SEM PREJUIZO FISCAL E COM FALENCIA OU BAIXA
    if (isdemaisPJ && (rating == 'C' || rating == 'D') && comPrejuizo == 'false' && (isFalido || isBaixado)) {
        if (saldoParaCalculoRestante > 0) {

            // Calcula o número máximo de parcelas para o restante a pagar
            nParcelasRestante = Math.min(50, Math.floor(saldoParaCalculoRestante / valorMinimo));
            if (saldoParaCalculoRestante / nParcelasRestante < valorMinimo) {
                nParcelasRestante = Math.floor(saldoParaCalculoRestante / valorMinimo);
            }

            parcelaAposDesconto = saldoParaCalculoRestante;
        }

    }

    // DEMAIS RATING C OU D COM PREJUIZO FISCAL E COM FALENCIA OU BAIXA
    if (isdemaisPJ && (rating == 'C' || rating == 'D') && comPrejuizo == 'true' && (isFalido || isBaixado)) {
        if (saldoParaCalculoRestante > 0) {

            // Calcula o número máximo de parcelas para o restante a pagar
            nParcelasRestante = Math.min(50, Math.floor(saldoParaCalculoRestante / valorMinimo));
            if (saldoParaCalculoRestante / nParcelasRestante < valorMinimo) {
                nParcelasRestante = Math.floor(saldoParaCalculoRestante / valorMinimo);
            }

            parcelaAposDesconto = saldoParaCalculoRestante;
        }

    }

    return [nParcelasRestante, parcelaAposDesconto];
}


// FUNCAO QUE CALCULA O VALOR PARCELAS RESTANTE
function calcularValorParcelasRestante(elemento, saldoDevedorAposEntrada) {
    let parcelas = elemento.querySelector('.selected').querySelector('label').innerHTML.split(' ')[0]; // Captura o número de parcelas selecionadas
    document.querySelector('#parcelaAposDesconto').innerHTML = converterNumeroEmMoeda(saldoDevedorAposEntrada / converterStringEmNumero(parcelas)); // Atualiza o valor da parcela
}




































// FUNCAO PARA PREENCHER O FORMULARIO AO SER CARREGADO
// document.addEventListener('DOMContentLoaded', function () {
//     // Marca o radio com id=op-1
//     const radioOp1 = document.getElementById('op-1');
//     if (radioOp1) {
//         radioOp1.click();
//     }

//     // Clica no botão com id=entendi
//     const btnEntendi = document.getElementById('id-entendi');
//     if (btnEntendi) {
//         btnEntendi.click();
//     }

//     // Clica no botão com id=btnIncluirNovoDebito
//     const btnIncluirNovoDebito = document.getElementById('btnIncluirNovoDebito');
//     if (btnIncluirNovoDebito) {
//         btnIncluirNovoDebito.click();
//         btnIncluirNovoDebito.click();
//         btnIncluirNovoDebito.click();
//         btnIncluirNovoDebito.click();
//     }

//     // Aguarda a inclusão da nova linha na tabela
//     setTimeout(() => {
//         const tabelaBody = document.getElementById('tabelaDebitosBody');
//         if (tabelaBody) {
//             const linhas = tabelaBody.querySelectorAll('tr');
//             const linha1 = linhas[linhas.length - 5]; // Seleciona a penúltima linha
//             const linha2 = linhas[linhas.length - 4]; // Seleciona a penúltima linha
//             const linha3 = linhas[linhas.length - 3]; // Seleciona a penúltima linha
//             const linha4 = linhas[linhas.length - 2]; // Seleciona a penúltima linha
//             if (linha1) {
//                 // Preenche o campo Nº Processo
//                 const campoNProcesso = linha1.querySelector('.nroProcesso');
//                 if (campoNProcesso) {
//                     campoNProcesso.value = '123456789098765';
//                 }

//                 // Preenche o campo Valor Principal
//                 const campoValorPrincipal = linha1.querySelector('.principal');
//                 if (campoValorPrincipal) {
//                     campoValorPrincipal.value = '10.000,00';
//                 }

//                 // Preenche o campo Multa
//                 const campoMulta = linha1.querySelector('.multa');
//                 if (campoMulta) {
//                     campoMulta.value = '5.000,00';
//                 }

//                 // Preenche o campo Juros
//                 const campoJuros = linha1.querySelector('.juros');
//                 if (campoJuros) {
//                     campoJuros.value = '5.000,00';
//                 }

//                 // Preenche o campo Total
//                 const campoTotal = linha1.querySelector('.total');
//                 if (campoTotal) {
//                     campoTotal.value = '20.000,00';
//                 }
//             }
//             if (linha2) {
//                 // Preenche o campo Nº Processo
//                 const campoNProcesso = linha2.querySelector('.nroProcesso');
//                 if (campoNProcesso) {
//                     campoNProcesso.value = '123456789098765';
//                 }

//                 // Seleciona a opção Fazendário no campo Tipo de Débito
//                 const campoTipoDebito = linha2.querySelector('#fazendario');
//                 if (campoTipoDebito) {
//                     campoTipoDebito.classList.add('selected');
//                 }

//                 // Preenche o campo Valor Principal
//                 const campoValorPrincipal = linha2.querySelector('.principal');
//                 if (campoValorPrincipal) {
//                     campoValorPrincipal.value = '20.000,00';
//                 }

//                 // Preenche o campo Multa
//                 const campoMulta = linha2.querySelector('.multa');
//                 if (campoMulta) {
//                     campoMulta.value = '10.000,00';
//                 }

//                 // Preenche o campo Juros
//                 const campoJuros = linha2.querySelector('.juros');
//                 if (campoJuros) {
//                     campoJuros.value = '10.000,00';
//                 }

//                 // Preenche o campo Total
//                 const campoTotal = linha2.querySelector('.total');
//                 if (campoTotal) {
//                     campoTotal.value = '40.000,00';
//                 }
//             }
//             if (linha3) {
//                 // Preenche o campo Nº Processo
//                 const campoNProcesso = linha3.querySelector('.nroProcesso');
//                 if (campoNProcesso) {
//                     campoNProcesso.value = '123456789098765';
//                 }

//                 // Seleciona a opção Fazendário no campo Tipo de Débito
//                 const campoTipoDebito = linha3.querySelector('#previdenciario');
//                 if (campoTipoDebito) {
//                     campoTipoDebito.classList.add('selected');
//                 }

//                 // Preenche o campo Valor Principal
//                 const campoValorPrincipal = linha3.querySelector('.principal');
//                 if (campoValorPrincipal) {
//                     campoValorPrincipal.value = '30.000,00';
//                 }

//                 // Preenche o campo Multa
//                 const campoMulta = linha3.querySelector('.multa');
//                 if (campoMulta) {
//                     campoMulta.value = '20.000,00';
//                 }

//                 // Preenche o campo Juros
//                 const campoJuros = linha3.querySelector('.juros');
//                 if (campoJuros) {
//                     campoJuros.value = '20.000,00';
//                 }

//                 // Preenche o campo Total
//                 const campoTotal = linha3.querySelector('.total');
//                 if (campoTotal) {
//                     campoTotal.value = '70.000,00';
//                 }
//             }
//             if (linha4) {
//                 // Preenche o campo Nº Processo
//                 const campoNProcesso = linha4.querySelector('.nroProcesso');
//                 if (campoNProcesso) {
//                     campoNProcesso.value = '123456789098765';
//                 }

//                 // Seleciona a opção Fazendário no campo Tipo de Débito
//                 const campoTipoDebito = linha4.querySelector('#previdenciario');
//                 if (campoTipoDebito) {
//                     campoTipoDebito.classList.add('selected');
//                 }

//                 // Preenche o campo Valor Principal
//                 const campoValorPrincipal = linha4.querySelector('.principal');
//                 if (campoValorPrincipal) {
//                     campoValorPrincipal.value = '40.000,00';
//                 }

//                 // Preenche o campo Multa
//                 const campoMulta = linha4.querySelector('.multa');
//                 if (campoMulta) {
//                     campoMulta.value = '30.000,00';
//                 }

//                 // Preenche o campo Juros
//                 const campoJuros = linha4.querySelector('.juros');
//                 if (campoJuros) {
//                     campoJuros.value = '30.000,00';
//                 }

//                 // Preenche o campo Total
//                 const campoTotal = linha4.querySelector('.total');
//                 if (campoTotal) {
//                     campoTotal.value = '100.000,00';
//                 }

//                 // Preenche o campo Total a Pagar
//                 const campoTotalGeral = document.querySelector('#totalGeral');
//                 if (campoTotalGeral) {
//                     campoTotalGeral.value = '230.000,00';
//                 }
                
//             }
//         }
//     }, 500); // Timeout para garantir que a linha foi adicionada
// });