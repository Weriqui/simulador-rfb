/**
 * composicao-divida.js
 * Gerencia os modos de simulação (Agregado x Detalhado) e os cálculos de débitos.
 */

const SITUACAO_DEBITO_PADRAO = "Contencioso Administrativo (em discussão administrativa)";

const TEXTOS_MODAL_MODO_SIMULACAO = {
    POR_DEBITO: "Na simulação por débito, você deve informar individualmente cada débito, com seus respectivos valores de principal, multa e juros.<br>Essa opção permite um cálculo mais detalhado e próximo da realidade, proporcionando uma estimativa mais precisa das condições das Transações.",
    AGREGADO: "Na simulação do valor total dos débitos, informe a soma total de todos os seus débitos. A opção de \"Simulação por débito\" reflete melhor as opções de negociações disponíveis."
};

// Controla se o modal de aviso já foi mostrado nesta sessão para não irritar o usuário
let modaisJaExibidos = { AGREGADO: false, POR_DEBITO: false };

/**
 * Alterna a visualização entre os dois modos, limpa a "sujeira" do estado do modo anterior
 * e exibe o modal explicativo na primeira vez.
 */
function selecionarModoSimulacao(modo) {
    estadoGlobal.modoSimulacaoDivida = modo;

    // Esconde as próximas etapas para forçar o fluxo
    estadoGlobal.interface.simulacaoLiberada = false;
    document.getElementById('id-classificacao-debitos')?.classList.add('d-none');
    document.getElementById('id-quadro-resumo')?.classList.add('d-none');

    const blocoPorDebito = document.getElementById('id-bloco-por-debito');
    const blocoAgregado = document.getElementById('id-bloco-agregado');

    if (modo === 'POR_DEBITO') {
        blocoPorDebito.classList.remove('d-none');
        blocoAgregado.classList.add('d-none');

        // Limpa o estado da tabela Agregada para não misturar os dados
        estadoGlobal.debitosAgregados = { principal: 0, multa: 0, juros: 0, total: 0 };
        document.getElementById('id-agregado-principal').value = '';
        document.getElementById('id-agregado-multa').value = '';
        document.getElementById('id-agregado-juros').value = '';
        document.getElementById('id-agregado-total').innerText = 'R$ 0,00';

        // Abre já com 1 linha vazia caso esteja vazio
        if (estadoGlobal.debitos.length === 0) {
            incluirLinhaDebito();
        }
    } 
    else if (modo === 'AGREGADO') {
        blocoAgregado.classList.remove('d-none');
        blocoPorDebito.classList.add('d-none');

        // Limpa o estado da tabela por Débito para não misturar dados
        estadoGlobal.debitos = [];
        document.getElementById('id-corpo-tabela-debitos').innerHTML = '';
    }

    atualizarTotalGeralDebitos();

    // Dispara o popup se for a primeira vez
    if (!modaisJaExibidos[modo]) {
        showModal(TEXTOS_MODAL_MODO_SIMULACAO[modo]);
        modaisJaExibidos[modo] = true;
    }
}

/**
 * Lida com o cálculo em tempo real da tabela de Débitos Agregados
 */
function atualizarValorAgregado(inputElement, campo) {
    // 1. Validar preenchimento bizarro (letras/símbolos)
    if (/[^\d.,\s]/.test(inputElement.value)) {
        showModal("Valor inválido! Valor deve ser numérico e maior ou igual a zero.");
    }

    // 2. Aplica a máscara utilitária
    validarValorNaoNegativo(inputElement);

    // 3. Converte para Number e joga no estado
    const valorPuro = inputElement.value ? converterStringEmNumero(inputElement.value) : 0;
    estadoGlobal.debitosAgregados[campo] = valorPuro;

    // 4. Recalcula o subtotal agregado
    estadoGlobal.debitosAgregados.total = estadoGlobal.debitosAgregados.principal + estadoGlobal.debitosAgregados.multa + estadoGlobal.debitosAgregados.juros;

    // 5. Atualiza o DOM e o Estado Global
    const tdTotalAgregado = document.getElementById('id-agregado-total');
    if (tdTotalAgregado) {
        tdTotalAgregado.innerText = 'R$ ' + converterNumeroEmMoeda(estadoGlobal.debitosAgregados.total);
    }
    
    atualizarTotalGeralDebitos();
}

/**
 * Adiciona uma nova linha de débito na tabela detalhada.
 */
function incluirLinhaDebito() {
    const id = "deb-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
    
    estadoGlobal.debitos.push({
        id: id,
        situacaoDebito: SITUACAO_DEBITO_PADRAO,
        principal: 0,
        multa: 0,
        juros: 0,
        total: 0
    });

    const index = estadoGlobal.debitos.length;
    const tbody = document.getElementById('id-corpo-tabela-debitos');
    const tr = document.createElement('tr');

    tr.innerHTML = `
        <td class="align-middle text-center label-debito text-weight-semi-bold">Débito ${index}</td>
        <td class="align-middle">
            <div class="br-input">
                <input type="text" inputmode="decimal" class="text-center" placeholder="0,00" data-debito-id="${id}" data-campo="principal" oninput="atualizarValorDebito(this)">
            </div>
        </td>
        <td class="align-middle">
            <div class="br-input">
                <input type="text" inputmode="decimal" class="text-center" placeholder="0,00" data-debito-id="${id}" data-campo="multa" oninput="atualizarValorDebito(this)">
            </div>
        </td>
        <td class="align-middle">
            <div class="br-input">
                <input type="text" inputmode="decimal" class="text-center" placeholder="0,00" data-debito-id="${id}" data-campo="juros" oninput="atualizarValorDebito(this)">
            </div>
        </td>
        <td class="align-middle text-center">
            <span data-total-debito-id="${id}" class="text-weight-semi-bold">R$ 0,00</span>
        </td>
        <td class="align-middle text-center">
            <button class="br-button circle small" type="button" aria-label="Excluir" onclick="removerLinhaDebito(this, '${id}')">
                <i class="fas fa-trash-alt" aria-hidden="true"></i>
            </button>
        </td>
    `;

    tbody.appendChild(tr);
    atualizarTotalGeralDebitos();
}

/**
 * Lida com o cálculo em tempo real da tabela Detalhada (Por Débito)
 */
function atualizarValorDebito(inputElement) {
    if (/[^\d.,\s]/.test(inputElement.value)) {
        showModal("Valor inválido! Valor deve ser numérico e maior ou igual a zero.");
    }

    validarValorNaoNegativo(inputElement);

    const id = inputElement.getAttribute('data-debito-id');
    const campo = inputElement.getAttribute('data-campo');
    const valorPuro = inputElement.value ? converterStringEmNumero(inputElement.value) : 0;

    const debito = estadoGlobal.debitos.find(d => d.id === id);
    if (debito) {
        debito[campo] = valorPuro;
        debito.total = debito.principal + debito.multa + debito.juros;

        const spanTotal = document.querySelector(`span[data-total-debito-id="${id}"]`);
        if (spanTotal) {
            spanTotal.innerText = 'R$' + converterNumeroEmMoeda(debito.total);
        }
    }

    atualizarTotalGeralDebitos();
}

/**
 * Exclui uma linha do DOM e do estadoGlobal na tabela Detalhada
 */
function removerLinhaDebito(botao, id) {
    botao.closest('tr').remove();
    estadoGlobal.debitos = estadoGlobal.debitos.filter(d => d.id !== id);

    // Reorganiza os labels sequenciais
    const tbody = document.getElementById('id-corpo-tabela-debitos');
    const linhas = tbody.querySelectorAll('tr');
    linhas.forEach((linha, index) => {
        const label = linha.querySelector('.label-debito');
        if (label) {
            label.innerText = `Débito ${index + 1}`;
        }
    });

    atualizarTotalGeralDebitos();
}

/**
 * Atualiza o Total da Dívida do Estado Global de acordo com a aba ativa.
 */
function atualizarTotalGeralDebitos() {
    if (estadoGlobal.modoSimulacaoDivida === 'AGREGADO') {
        estadoGlobal.totalDebitos = estadoGlobal.debitosAgregados.total;
    } else {
        estadoGlobal.totalDebitos = estadoGlobal.debitos.reduce((acc, d) => acc + d.total, 0);
    }

    // Só precisamos formatar o Total da tabela "Por Débitos", pois a tabela "Agregado" já faz isso nela mesma
    const tdTotalGeral = document.getElementById('id-total-geral-debitos');
    if (tdTotalGeral) {
        tdTotalGeral.innerText = 'R$ ' + converterNumeroEmMoeda(estadoGlobal.totalDebitos);
    }

    // Re-avalia os tetos da modalidade sempre que a grana mudar na mesa
    if (typeof recarregarTodasAsModalidades === 'function') {
        recarregarTodasAsModalidades();
    }

    // NOVA TRAVA: Se mexer no valor da dívida, esconde a simulação e exige nova confirmação
    estadoGlobal.interface.simulacaoLiberada = false;
    const secaoQuadro = document.getElementById('id-quadro-resumo');
    if (secaoQuadro) {
        secaoQuadro.classList.add('d-none');
    }
}

// FUNCAO ACIONADO AO CLICAR NO BOTAO CONFIRMAR TOTAL DEBITOS
function confirmarTotalDebitos(elemento) {
    // 1ª VALIDAÇÃO (NOVA): Bloqueia se o total da dívida for zero (tanto Agregado quanto Detalhado)
    if (estadoGlobal.totalDebitos <= 0) {
        showModal('O valor total dos débitos deve ser maior que zero para prosseguir. Preencha os valores antes de confirmar.');
        return;
    }

    // 2ª VALIDAÇÃO (EXISTENTE): Garante que a tabela detalhada tenha ao menos uma linha
    if (estadoGlobal.modoSimulacaoDivida === 'POR_DEBITO') {
        const tabelaDebitosBody = document.getElementById('id-corpo-tabela-debitos');

        if (tabelaDebitosBody.rows.length === 0) {
            showModal('Insira pelo menos um débito para prosseguir.');
            return;
        }
    }

    let secaoValida = false;

    if (estadoGlobal.modoSimulacaoDivida === 'POR_DEBITO') {
        secaoValida = validarCamposObrigatoriosPorSecao('id-composicao-divida');
    } else if (estadoGlobal.modoSimulacaoDivida === 'AGREGADO') {
        secaoValida = validarCamposObrigatoriosPorSecao('id-bloco-agregado');
    }

    if (secaoValida) {
        estadoGlobal.elementos.secaoClassificacaoDebitos?.classList.remove('d-none');

        document.getElementById('totalDebitos').value = converterNumeroEmMoeda(estadoGlobal.totalDebitos);
        document.getElementById('totalDebitosTransacionar').value = converterNumeroEmMoeda(estadoGlobal.totalDebitos);
    } else {
        showModal('Exclua linhas vazias e preencha todos os campos antes de prosseguir!');
        return;
    }
}