// SECOES, TABELAS, MODAL
let secaoDebitos;
let secaoModalidadeTransacao;
let secaoDetalhamentoEntrada;
let secaoDetalhamentoRestante;
let tabelaDebitos;
let tabelaDebitosBody;
let modal;
window.nomePdf = "DISCRIMINATIVOTRANSACAOATE60SALARIOS.pdf";

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
let isContribuinte;

// CONDICAO CONTRIBUINTE
let isFalido;
let isBaixado;
let isGrupoEconomico;

// CALCULO ENTRADA E PARCELAMENTO
let totalFazendario;

let limiteValor = 97260;

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
    secaoModalidadeTransacao = document.querySelector('#id-modalidade-transacao');
    secaoDetalhamentoEntrada = document.querySelector('#id-detalhamento-entrada');
    secaoDetalhamentoRestante = document.querySelector('#id-detalhamento-restante');

    //Chamada das funções de desabilitação
    desabilitarAtalhosImpressao();
    desabilitarAtalhosDevTools();
    desabilitarCliqueDireito();

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

    // Mostra a seção de débitos
    secaoDebitos.classList.remove('d-none');

    if (elemento.getAttribute('data-contribuinte') == 'pessoa-natural') {
        valorMinimo = 200;
        isPessoaNatural = true;
        showModal(mensagem="O valor mínimo de qualquer parcela <strong>(entrada ou valor restante)</strong> para Pessoa Natural é de <strong>R$200,00</strong>");
    } else if (elemento.getAttribute('data-contribuinte') == 'mei-ei-me-epp') {
        valorMinimo = 200;
        isPessoaObito = true;
        isRatingD = true;
        showModal(mensagem="O valor mínimo de qualquer parcela <strong>(entrada ou valor restante)</strong> para Microempreendedor Individual, Empresário Individual, ME e EPP com indicativo de óbito é de <strong>R$200,00</strong>");
    } else if (elemento.getAttribute('data-contribuinte') == 'contribuinte') {
        valorMinimo = 200;
        isContribuinte = true;
        showModal(mensagem="Atenção: O valor mínimo da parcela é de <strong>R$200,00</strong>");
    }
}

// DEFINE CONDICAO CONTRIBUINTE
function definirCondicaoContribuinte(elemento) {
    if (elemento.getAttribute('data-condicao') == 'falido') {
        isRatingD = true;
        isFalido = true;
    } else if (elemento.getAttribute('data-condicao') == 'baixado') {
        isRatingD = true;
        isBaixado = true;
    } else if (elemento.getAttribute('data-condicao') == 'grupoEconomico') {
        isGrupoEconomico = true;
        showModal(mensagem="Junto com o pedido de adesão deverá ser apresentado o reconhecimento expresso de que o contribuinte integra gupo econômico, de direito ou de fato, reconhecido ou não em decisão administrativa ou judicial. Deverá listar todas as partes relacionadas, admitindo a inserção destes como corresponsáveis tributário nos sistemas da RFB.")
    }
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
    // Obtém todas as seções em ordem
    const secoes = Array.from(document.querySelectorAll('.secao'));
    // Encontra a seção atual (a mais próxima do elemento)
    const secaoAtual = elemento.closest('.secao');
    const idxAtual = secoes.indexOf(secaoAtual);

    if (secaoAtual.id === 'id-identificacao-do-contribuinte') {
        // Limpa os campos de identificação do contribuinte
        const contribuinteInputs = secaoAtual.querySelectorAll('input');
        contribuinteInputs.forEach(input => {
            if (input.type === 'checkbox') {
                input.checked = false;
            }
        });
        tabelaDebitosBody.innerHTML = '';
        secaoDebitos.classList.remove('d-none');
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

    document.querySelector('#id-btn-gerar-documento').classList.add('d-none');

}

/*
// LIDA COM VALIDAÇÃO DE PROCESSO
function handleValidarProcesso(element) {
    const isValid = validarProcesso(element);
    // Se o retorno for falso, exibe o modal
    if (!isValid) {
        showModal(mensagem="Número do processo inválido! O número do processo deve conter 15 ou 17 dígitos.");
    }
}
*/


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
        showModal(mensagem=`Esta modalidade não se aplica a valores acima de <strong>60 salários mínimos</strong> (R$ ${converterNumeroEmMoeda(limiteValor)}) por processo administrativo.`);
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

        // MOSTRA A SEÇÃO DE CLASSIFICAÇÃO DOS DEBITOS
        secaoModalidadeTransacao.classList.remove('d-none');

    }
    else {
        showModal(mensaagem='Exclua linhas vazias e preencha todos os campos antes de prosseguir!');
    }
}


//---------------FUNCOES PARA CALCULAR ENTRADA-------------------//
// FUNCAO QUE CALCULA ENTRADA E PARCELAS DA ENTRADA
function popularTabelaEntrada(elemento) {
    let tabelaEntradaBody = document.querySelector('#bd-tabela-calculo-entrada');
    
    document.querySelector('#id-detalhamento-entrada').classList.remove('d-none'); // Exibe a seção de detalhamentos de entrada

    totalGeral = totalGeral = document.querySelector('#totalGeral').value ? converterStringEmNumero(document.querySelector('#totalGeral').value) : 0;
    [valorEntrada, nParcelasEntrada, parcelaAposEntrada, saldoDevedorAposEntrada] = calcularMaximoParcelasEntrada(totalGeral);

    if (totalGeral > 0) {
        contadorParcelasEntrada = 0;

        // Popula a tabela de entrada
        let template = document.querySelector('#id-linha-tabela-entrada').content.cloneNode(true);
        template.querySelector('#saldoDevedor').innerHTML = converterNumeroEmMoeda(totalGeral);
        template.querySelector('#valorEntrada').innerHTML = converterNumeroEmMoeda(totalGeral * 0.05) + ' (5%)';
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



// FUNCAO QUE CALCULA O MAXIMO DE PARCELAS DE ENTRADA
function calcularMaximoParcelasEntrada(totalGeral) {
    nParcelasEntrada = 0;
    valorEntrada = 0;
    saldoDevedorAposEntrada = 0;
    parcelaAposEntrada = 0;

    if (totalGeral > 0) {
        valorEntrada = totalGeral * 0.05; // 5% de entrada
        saldoDevedorAposEntrada = totalGeral - valorEntrada;

        // Calcula o número máximo de parcelas para a entrada
        nParcelasEntrada = Math.min(5, Math.floor(valorEntrada / valorMinimo));
        if (valorEntrada / nParcelasEntrada < valorMinimo) {
            nParcelasEntrada = Math.floor(valorEntrada / valorMinimo);
        }

        parcelaAposEntrada = valorEntrada;
    }

    return [valorEntrada, nParcelasEntrada, parcelaAposEntrada, saldoDevedorAposEntrada];
}

// FUNCAO QUE CALCULA O PARCELAMENTO DA ENTRADA
function calcularValorParcelasEntrada(elemento, valorEntrada) {
    reiniciarFormulario(elemento)
    let parcelas = elemento.querySelector('.selected').querySelector('label').innerHTML.split(' ')[0]; // Captura o número de parcelas selecionadas
    document.querySelector('#parcelaAposEntrada').innerHTML = converterNumeroEmMoeda(valorEntrada / converterStringEmNumero(parcelas)); // Atualiza o valor da parcela
}


//---------------FUNCOES PARA CALCULAR PREJUIZO FISCAL E BASE DE CALCULO NEGATIVA-------------------//
// FUNCAO ACIONADA PELO BOTAO PROSSEGUIR
function prosseguir() {
    secaoModalidadeTransacao.classList.remove('d-none'); // Exibe a seção de modalidades de transação
}



//---------------FUNCOES PARA CALCULAR VALOR RESTANTE A PAGAR--------------------//
// FUNCAO QUE CALCULA RESTANTE A PAGAR OU PARCELAR
function popularTabelaRestante(elemento) {
    let tabelaRestanteBody = document.querySelector('#bd-tabela-calculo-restante');
    let transacaoSelecionada = elemento.getAttribute('data-transacao'); // Captura o número de parcelas selecionadas
    let descontoTransacao = elemento.getAttribute('data-desconto'); // Captura o desconto da transação selecionada  
    let totalGeral = document.getElementById('totalGeral');
    let meses = elemento.getAttribute('data-transacao'); // Captura o número de meses da transação selecionada
    let reducao = converterStringEmNumero(elemento.getAttribute('data-desconto'))*100; // Captura a redução da transação selecionada

    document.querySelector('#id-detalhamento-restante').classList.remove('d-none'); // Exibe a seção de detalhamentos de parcelas
    document.querySelector('#id-btn-gerar-documento').classList.remove('d-none'); // Esconde a seção de detalhamentos de prejuízo fiscal

    saldoParaCalculoRestante = converterStringEmNumero(totalGeral.value); // Captura o valor total geral
    let saldoAposDesconto = saldoParaCalculoRestante - (saldoParaCalculoRestante * converterStringEmNumero(descontoTransacao)); // Calcula o saldo após o desconto

    [nParcelasRestante, parcelaAposDesconto] = calcularMaximoParcelasRestante(saldoParaCalculoRestante, transacaoSelecionada, saldoAposDesconto);
    if (saldoParaCalculoRestante > 0) {
        contadorParcelasRestante = 0;


        // Popula a tabela de restante
        let template = document.querySelector('#id-linha-tabela-restante').content.cloneNode(true);
        template.querySelector('#saldoParaCalculoRestante').innerHTML = converterNumeroEmMoeda(saldoParaCalculoRestante);
        template.querySelector('#criterioTransacao').innerHTML = `até ${meses} meses, redução ${reducao}%`; // Exibe o critério de transação
        template.querySelector('#desconto').innerHTML = converterNumeroEmMoeda(saldoParaCalculoRestante * converterStringEmNumero(descontoTransacao)); // Exibe o desconto aplicado
        template.querySelector('#saldoAposDesconto').innerHTML = converterNumeroEmMoeda(saldoAposDesconto); // Exibe o saldo após o desconto
        template.querySelector('.br-select').setAttribute('onchange', 'calcularValorParcelasRestante(this)');
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


// FUNCAO QUE CALCULA O MAXIMO DE PARCELAS RESTANTE
function calcularMaximoParcelasRestante(saldoParaCalculoRestante, transacaoSelecionada, saldoAposDesconto) {

    nParcelasRestante = 0;
    parcelaAposDesconto = 0;
    transacaoSelecionada = converterStringEmNumero(transacaoSelecionada);

    if (saldoParaCalculoRestante > 0) {

        // Calcula o número máximo de parcelas para o restante a pagar
        nParcelasRestante = Math.min(transacaoSelecionada, Math.floor(saldoParaCalculoRestante / valorMinimo));
        // if (saldoParaCalculoRestante / nParcelasRestante < valorMinimo) {
        //     nParcelasRestante = Math.floor(saldoParaCalculoRestante / valorMinimo);
        // }

        parcelaAposDesconto = saldoAposDesconto
        if (parcelaAposDesconto / nParcelasRestante < valorMinimo) {
            nParcelasRestante = Math.floor(parcelaAposDesconto / valorMinimo);
        }
    }

    return [nParcelasRestante, parcelaAposDesconto];
}


// FUNCAO QUE CALCULA O VALOR PARCELAS RESTANTE
function calcularValorParcelasRestante(elemento) {
    let parcelas = elemento.querySelector('.selected').querySelector('label').innerHTML.split(' ')[0]; // Captura o número de parcelas selecionadas
    parcelas = converterStringEmNumero(parcelas); // Converte o número de parcelas para número
    let saldoAposDesconto = document.querySelector('#saldoAposDesconto').innerHTML; // Captura o saldo após o desconto
    saldoAposDesconto = converterStringEmNumero(saldoAposDesconto); //
    document.querySelector('#parcelaAposDesconto').innerHTML = converterNumeroEmMoeda(saldoAposDesconto / parcelas); // Atualiza o valor da parcela
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