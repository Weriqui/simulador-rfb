
// EXCLUI LINHA DA TABELA AO CLICAR NO ICONE LIXEIRA
function excluirLinha(botao) {
    const linha = botao.closest('tr');
    const tabela = linha.closest('table');

    if (linha) {
        linha.remove();
    }

    atualizarContadorLinhas(tabela);
}


// Função para atualizar o contador de linhas após apagar uma linha
function atualizarContadorLinhas(tabela) {
    const linhas = tabela.rows;
    for (let i = 0; i < linhas.length; i++) {
        let contador = linhas[i].querySelector('.line-counter');
        if (contador) {
            contador.innerText = `Imóvel ${i}`;
        }
    }
    // Atualiza o contador global com base no número de linhas restantes
    linhaContador = linhas.length;
}


// VALIDA CAMPOS REQUIRED
//TODO adicionar mais campos como radiobuttons, checkboxes ...excluirLinha.
function validarCamposRequiredNaSecao(secaoId) {
    const secao = document.getElementById(secaoId);
    
    if (!secao) {
        console.error(`Seção com ID "${secaoId}" não encontrada.`);
        return;
    }
    
    // Obtém todos os inputs e textareas dentro da seção
    const inputComponents = secao.querySelectorAll('br-input-component[required]');
    const textareaComponents = secao.querySelectorAll('br-textarea-component[required]');
    const datepickerComponents = secao.querySelectorAll('br-datepicker-component[required]');
    const selectComponents = secao.querySelectorAll('br-select-component[required]');
    const radioComponents = secao.querySelectorAll('br-radio-horizontal-component[required]');

    let camposVazios = [];
    
    if (inputComponents.length > 0){
        inputComponents.forEach(inputComponent => {
            let inputWrapper = inputComponent.querySelector('.br-input');
            let input = inputComponent.querySelector('input');
            if (input.value.trim() === '') {
                inputWrapper.classList.add('danger');
                camposVazios.push(input);
            } else {
                inputWrapper.classList.remove('danger');
            }
        });
    }
    
    if (textareaComponents.length > 0){
        textareaComponents.forEach(textareaComponent => {
            let inputWrapper = textareaComponent.querySelector('.br-textarea')
            let textarea = textareaComponent.querySelector('textarea');
            if (textarea.value.trim() === '') {
                inputWrapper.classList.add('danger');
                camposVazios.push(textarea);
            } else {
                inputWrapper.classList.remove('danger');
            }
        });
    }

    if (datepickerComponents.length > 0){
        datepickerComponents.forEach(datepickerComponent => {
            let inputWrapper = datepickerComponent.querySelector('.br-input');
            let input = datepickerComponent.querySelector('input');
            if (input.value.trim() === '') {
                inputWrapper.classList.add('danger');
                camposVazios.push(input);
            } else {
                inputWrapper.classList.remove('danger');
            }
        });
    }

    if (selectComponents.length > 0){
        selectComponents.forEach(selectComponent => {
            let inputWrapper = selectComponent.querySelector('.br-select').querySelector('.br-input');
            let item = selectComponent.querySelector('.br-list');
            if (!selectComponent.querySelector('.br-item.selected')) {
                inputWrapper.classList.add('danger');
                camposVazios.push(item);
            } else {
                inputWrapper.classList.remove('danger');
            }
        });
    }
    //debugger;
    if (radioComponents.length > 0){
        const radiosByName = {};

        // Agrupa os radio buttons por 'name'
        radioComponents.forEach(radioComponent => {
            let radio = radioComponent.querySelector('input');
            let name = radio.getAttribute('name'); // Obtém o atributo 'name'

            if (name) { // Verifica se o 'name' existe
                // Inicializa o array para o 'name' se ainda não existir
                if (!radiosByName.hasOwnProperty(name)) {
                    radiosByName[name] = []; 
                }

                radiosByName[name].push(radio); // Adiciona o radio ao grupo correto
            }
        });


        // Para cada grupo de 'name', verifica se pelo menos um está marcado
        for (let name in radiosByName) {
            const radiosGroup = radiosByName[name];
            const isChecked = radiosGroup.some(radio => radio.checked); // Verifica se algum está marcado

            if (!isChecked) {
                camposVazios.push('radioButton'); // Se algum grupo não tem nenhum radio marcado, incrementa campos vazios
            }
        }

        // return true

    }

    if (camposVazios.length > 0) {
        return false
    }

    return true
}


// VALIDAR TABELA OBRIGATORIA
function validarTabelasObrigatorias(secaoId){
    const secao = document.getElementById(secaoId);
    let continuar = true;  // Variável de controle
    
    if (!secao) {
        console.error(`Seção com ID "${secaoId}" não encontrada.`);
        return;
    }

    const tabelas = secao.querySelectorAll('table[required]');

    if (tabelas.length > 0) {
        for (let tabela of tabelas) {
            const temLinhas = tabela.querySelectorAll('tbody tr').length > 0;
            if (!temLinhas) {
                continuar = false;
                break;
            }
        }
    
    }
    
    if (!continuar) return false;
    
    return true

}


// VALIDAR E APLICAR MASCARA AO TELEFONE
function validarTelefone(inputElement) {
    const telefoneInput = inputElement;
    let telefone = telefoneInput.value.replace(/\D/g, '');
    const inputWrapper = telefoneInput.closest('.br-input');

    if (telefone.length === 11) {
        telefoneInput.value = telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        inputWrapper.classList.remove('danger');
        return true;
    } else if (telefone.length === 10) {
        telefoneInput.value = telefone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        inputWrapper.classList.remove('danger');
        return true;
    } else {
        inputWrapper.classList.add('danger');
        telefoneInput.value = '';
        return false;
    }
}


// VALIDAR QUANTIDADE MAIOR QUE 0
function validarFloatPositivo(input) {
    // Remover caracteres não numéricos e converter para número
    let valorDigitado = input.value.replace(/\D/g, '');
    if (valorDigitado !== '' && valorDigitado > 0) {
        let numero = parseFloat(valorDigitado.replace(',', '.')) / 100;
        let numeroFormatado = numero.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        input.value = numeroFormatado;
        return true;
    } else {
        input.value = '';
        return false; // Valor inválido
    }
}


// VALIDAR INTEIRO POSITIVO
function validarInteiroPositivo(input) {
    // Remover caracteres não numéricos e converter para número
    let valorDigitado = input.value.replace(/\D/g, '');

    if (valorDigitado !== '' && valorDigitado > 0){
        let numero = parseInt(valorDigitado, 10);
        input.value = numero.toLocaleString('pt-BR');
        return true;
    } else {
        input.value = '';
        return false;
    }
}



// VALIDAR EMAIL
function validarEmail(inputElement) {
    const emailInput = inputElement;
    const email = emailInput.value;
    const inputWrapper = emailInput.closest('.br-input');
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (re.test(email)) {
        inputWrapper.classList.remove('danger');
        return true;
    } else {
        inputWrapper.classList.add('danger');
        emailInput.value = '';
        return false;
    }
}


// VALIDA VALORE EM R$
function validarValor(inputElement) {
    const valorInput = inputElement;
    const inputWrapper = valorInput.closest('.br-input');
    // Remover caracteres não numéricos e converter para número
    const valor = valorInput.value.replace(/\D/g, '');
    if (valor !== '' && valor > 0) {
        let numero = parseFloat(valor.replace(',', '.')) / 100;
        let numeroFormatado = numero.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        valorInput.value = numeroFormatado;
        inputWrapper.classList.remove('danger');
        return true;
    } else {
        inputWrapper.classList.add('danger');
        return false;
    }
}


//VALIDA CPF OU CNPJ
function validarCNPJCPF(input) {
    let valor = input.value.replace(/\D/g, '');

    if (valor.length !== 11 && valor.length !== 14) {
        modalComponente.showModal(
            'Atenção', 
            'CPF ou CNPJ inválido.', 
            null, 
            'Entendi', 
            null, 
            modalComponente.closeModal.bind(modalComponente)
        )
        input.value = '';
        return false
    }

    if (valor.length === 11) {
        if (!validarCPF(input)) input.value = '';
    } else if (valor.length === 14) {
        if (!validarCNPJ(input)) input.value = '';
    }
}


//FUNCAO AUX PARA VALIDAR CPF
function validarCPF(input) {
    let cpf = input.value? input.value.replace(/\D/g, '') : input;
    if (cpf === '') {
        modalComponente.showModal(
            'Atenção', 
            'CPF inválido.', 
            null, 
            'Entendi', 
            null, 
            modalComponente.closeModal.bind(modalComponente)
        )
        input.value = '';
        return false
    };
    // Elimina CPFs invalidos conhecidos
    if (
        cpf.length !== 11 ||
        cpf === '00000000000' ||
        cpf === '11111111111' ||
        cpf === '22222222222' ||
        cpf === '33333333333' ||
        cpf === '44444444444' ||
        cpf === '55555555555' ||
        cpf === '66666666666' ||
        cpf === '77777777777' ||
        cpf === '88888888888' ||
        cpf === '99999999999'
    ) {
        modalComponente.showModal(
            'Atenção', 
            'CPF inválido.', 
            null, 
            'Entendi', 
            null, 
            modalComponente.closeModal.bind(modalComponente)
        )
        input.value = '';
        return false;
    }
    // Valida 1o digito
    let add = 0;
    for (let i = 0; i < 9; i++) add += parseInt(cpf.charAt(i)) * (10 - i);
    let rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(9))) {
        modalComponente.showModal(
            'Atenção', 
            'CPF inválido.', 
            null, 
            'Entendi', 
            null, 
            modalComponente.closeModal.bind(modalComponente)
        )
        input.value = '';
        return false
    };
    // Valida 2o digito
    add = 0;
    for (let i = 0; i < 10; i++) add += parseInt(cpf.charAt(i)) * (11 - i);
    rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(10))) {
        modalComponente.showModal(
            'Atenção', 
            'CPF inválido.', 
            null, 
            'Entendi', 
            null, 
            modalComponente.closeModal.bind(modalComponente)
        )
        input.value = '';
        return false
    };
    return true;
}


//FUNCAO AUX PARA VALIDAR CNPJ
function validarCNPJ(input) {
    let cnpj = input.value? input.value.replace(/\D/g, '') : input;
    if (cnpj === '') {
        modalComponente.showModal(
            'Atenção', 
            'CNPJ inválido.', 
            null, 
            'Entendi', 
            null, 
            modalComponente.closeModal.bind(modalComponente)
        )
        input.value = '';
        return false
    };
    if (cnpj.length !== 14) {
        modalComponente.showModal(
            'Atenção', 
            'CNPJ inválido.', 
            null, 
            'Entendi', 
            null, 
            modalComponente.closeModal.bind(modalComponente)
        )
        input.value = '';
        return false
    };
    // Elimina CNPJs invalidos conhecidos
    if (
        cnpj === '00000000000000' ||
        cnpj === '11111111111111' ||
        cnpj === '22222222222222' ||
        cnpj === '33333333333333' ||
        cnpj === '44444444444444' ||
        cnpj === '55555555555555' ||
        cnpj === '66666666666666' ||
        cnpj === '77777777777777' ||
        cnpj === '88888888888888' ||
        cnpj === '99999999999999'
    ) {
        modalComponente.showModal(
            'Atenção', 
            'CNPJ inválido.', 
            null, 
            'Entendi', 
            null, 
            modalComponente.closeModal.bind(modalComponente)
        )
        input.value = '';
        return false;
    }
    // Valida DVs
    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    let digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
        soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
        if (pos < 2) pos = 9;
    }
    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(0))) {
        modalComponente.showModal(
            'Atenção', 
            'CNPJ inválido.', 
            null, 
            'Entendi', 
            null, 
            modalComponente.closeModal.bind(modalComponente)
        )
        input.value = '';
        return false
    };
    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
        soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
        if (pos < 2) pos = 9;
    }
    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(1))) {
        modalComponente.showModal(
            'Atenção', 
            'CNPJ inválido.', 
            null, 
            'Entendi', 
            null, 
            modalComponente.closeModal.bind(modalComponente)
        )
        input.value = '';
        return false
    };
    return true;
}


//VALIDA PROCESSO
function validarProcesso(numero) {
    const numeroLimpo = numero.value.replace(/\D/g, '');

    if (numeroLimpo.length !== 15 && numeroLimpo.length !== 17) {
        modalComponente.showModal(
            'Atenção', 
            'Número de Processo inválido. Certifique-se de inserir um número com 15 ou 17 dígitos.', 
            null, 
            'Entendi', 
            null, 
            modalComponente.closeModal.bind(modalComponente)
        )
        numero.value = '';
        return;
    }

    if (numeroLimpo.length == 17) {

        const numeros = numeroLimpo.substring(0, 15).split('').map(Number);
        const dv1 = parseInt(numeroLimpo.charAt(15));
        const dv2 = parseInt(numeroLimpo.charAt(16));

        let soma = 0;
        let peso = 2;

        for (let i = 14; i >= 0; i--) {
            soma += numeros[i] * peso;
            peso++;
            if (peso > 16) {
                peso = 2;
            }
        }

        let resto = soma % 11;
        if (resto === 0) {
            var digito1 = 1;
        } else if (resto === 1) {
            var digito1 = 0;
        } else {
            var digito1 = 11 - resto;
        }
        // const digito1 = resto === 0 ? 1 : 11 - resto;

        numeros.push(digito1);
        soma = 0;
        peso = 2;

        for (let i = 15; i >= 0; i--) {
            soma += numeros[i] * peso;
            peso++;
            if (peso > 17) {
                peso = 2;
            }
        }

        resto = soma % 11;
        if (resto === 0) {
            var digito2 = 1;
        } else if (resto === 1) {
            var digito2 = 0;
        } else {
            var digito2 = 11 - resto;
        }

        if (dv1 === digito1 && dv2 === digito2) {
            return true;
        } else {
            alert("Número de Processo inválido. Os dígitos verificadores estão incorretos.");
            numero.value = '';
            return
        }
    }

}


//AJUSTA TEXTAREAS PARA PDF
function ajustarTextareas() {

    const textareas = document.querySelectorAll('textarea');
                
    if (textareas){
        textareas.forEach(textarea => {
            const tempDiv = document.createElement('div');
            tempDiv.style.whiteSpace = 'pre-wrap'; // Preserva as quebras de linha
            tempDiv.style.width = textarea.offsetWidth + 'px';
            tempDiv.style.height = textarea.offsetHeight + 'px';
            tempDiv.style.border = '1px solid #ccc';
            tempDiv.style.padding = '4px';
            tempDiv.style.fontFamily = textarea.style.fontFamily;
            tempDiv.style.fontSize = textarea.style.fontSize;
            tempDiv.style.lineHeight = textarea.style.lineHeight;
            tempDiv.style.backgroundColor = '#fff';
    
            // Adiciona quebras de linha manualmente conforme necessário
            const content = textarea.value;
            const lines = content.split('\n');
            let formattedContent = '';
            const maxCharsPerLine = Math.floor(tempDiv.clientWidth / parseInt(getComputedStyle(tempDiv).fontSize)); 
            
            lines.forEach(line => {
                while (line.length > maxCharsPerLine) {
                    formattedContent += line.substring(0, maxCharsPerLine) + '\n';
                    line = line.substring(maxCharsPerLine);
                }
                formattedContent += line + '\n';
            });
            
            tempDiv.innerText = formattedContent.trim();
            
            // Substitui temporariamente o textarea pelo div
            textarea.style.display = 'none';
            textarea.parentNode.insertBefore(tempDiv, textarea.nextSibling);
            
            // Remova o div temporário após captura
            setTimeout(() => {
                tempDiv.remove();
                textarea.style.display = '';
            }, 1000); // 1 segundo é tempo suficiente para garantir que o canvas foi gerado
        });
    }
}


// OBTEM O VALOR DA OPCAO SELECIONADA NO SELECT
function getSelectedValue(inputId) {
    // Seleciona o <br-select-component> com o atributo inputid igual ao valor fornecido
    const selectComponent = document.querySelector(`[inputid="${inputId}"]`);
    
    if (!selectComponent) {
        console.error(`Componente com inputid="${inputId}" não encontrado.`);
        return null;
    }

    // Dentro do <br-select-component>, encontra o elemento com a classe 'br-item' e 'selected'
    const selectedItem = selectComponent.querySelector('.br-item.selected input[type="radio"]');
    
    if (!selectedItem) {
        console.error(`Nenhuma opção selecionada encontrada no componente com inputid="${inputId}".`);
        return null;
    }

    // Retorna o valor da opção selecionada
    return selectedItem.value;
}


// OBTEM O VALOR DO INPUT
function getInputField(inputId) {
    // Seleciona o <br-select-component> com o atributo inputid igual ao valor fornecido
    const inputComponent = document.querySelector(`[inputid="${inputId}"]`);
    
    if (!inputComponent) {
        console.error(`Componente com inputid="${inputId}" não encontrado.`);
        return null;
    }

    // Dentro do <br-select-component>, encontra o elemento com a classe 'br-item' e 'selected'
    const inputField = inputComponent.querySelector('input');
    
    if (!inputField) {
        console.error(`Nenhum campo input encontrado no componente com inputid="${inputId}".`);
        return null;
    }

    // Retorna o valor da opção selecionada
    return inputField;
}


// CONVERTE STRING EM REAIS R$
function converteStringEmNumero(valorStr) {
    // Remove qualquer caractere que não seja número ou vírgula
    const cleanStr = valorStr.replace(/[^\d,]/g, '');

    // Substitui a vírgula por ponto para conversão correta
    const numberStr = cleanStr.replace(',', '.');

    // Converte a string para número
    const numberValue = parseFloat(numberStr);

    // Verifica se o resultado é um número válido
    if (isNaN(numberValue)) {
        throw new Error('Valor inválido para conversão.');
    }

    return numberValue;
}


// CONVERTE NUMERO EM STRING REAIS
function converteNumeroEmReais(value) {
    // Verifica se o valor é um número
    if (typeof value !== 'number' || isNaN(value)) {
        throw new Error('O valor deve ser um número.');
    }

    // Formata o número como moeda no formato brasileiro sem o símbolo "R$"
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}


// COMPARA DOIS VALORES NUMERICOS
function compararDoisValoresNumericos(valorElemento1, valorElemento2, operador) {

    let valor1;
    let valor2;

    try {
        valor1 = converteStringEmNumero(valorElemento1);
    } catch (error) {
        // console.warn(`Erro ao obter o valor do componente 1: ${error.message}`);
        return false; // ou outro valor padrão
    }

    try {
        valor2 = converteStringEmNumero(valorElemento2);
    } catch (error) {
        // console.warn(`Erro ao obter o valor do componente 2: ${error.message}`);
        return false; // ou outro valor padrão
    }

    // Verifica se valor1 ou valor2 são válidos (não são undefined, null, ou NaN)
    if (isNaN(valor1) || isNaN(valor2)) {
        // console.warn('Um ou ambos os valores são inválidos para comparação.');
        return false; // ou qualquer valor padrão que faça sentido no seu caso
    }

    // Realiza a comparação com base no operador fornecido
    switch(operador) {
        case '>':
            return valor1 > valor2;
        case '<':
            return valor1 < valor2;
        case '>=':
            return valor1 >= valor2;
        case '<=':
            return valor1 <= valor2;
        case '===':
            return valor1 === valor2;
        case '!==':
            return valor1 !== valor2;
        default:
            throw new Error(`Operador "${operador}" não é válido.`);
    }
}


// INCLUIR LINHA SIMPLES EM TABELA
function incluirLinhaSimplesTabela() {
    var novaLinha = bdDetalhamentoImoveis.insertRow(-1);

    for (var i = 0; i < 7; i++) {
        var novaCelula = novaLinha.insertCell(i);
        novaCelula.classList.add('p-2');

        // GRUPO (select)
        if (i == 0) {
            let grupo = document.createElement('br-select-component');
            grupo.setAttribute('opcoes', 'getOpcoesGrupo');
            grupo.setAttribute('eName', 'Grupo');
            // grupo.setAttribute('inputClass', 'text-sm-down-01');
            grupo.setAttribute('required', 'required');
            novaCelula.appendChild(grupo);
        }

        // CODIGO (select)
        if (i == 1) {
            let codigo = document.createElement('br-select-component');
            codigo.setAttribute('opcoes', 'getOpcoesCodigo');
            codigo.setAttribute('eName', 'codigo');
            // codigo.setAttribute('inputClass', 'text-sm-down-01');
            codigo.setAttribute('required', 'required');
            novaCelula.appendChild(codigo);
        }

        // DESCRICAO (textarea)
        if (i == 2) {
            let descricao = document.createElement('br-textarea');
            descricao.setAttribute('eName', 'Descrição');
            descricao.setAttribute('maxlength', '500');
            descricao.setAttribute('rows', '5');
            descricao.setAttribute('required', 'required');
            novaCelula.appendChild(descricao);
        }

        // PAIS (select)
        if (i == 3) {
            let pais = document.createElement('br-select-component');
            pais.setAttribute('opcoes', 'getOpcoesPais');
            pais.setAttribute('eName', 'País');
            // pais.setAttribute('inputClass', 'text-sm-down-01');
            pais.setAttribute('required', 'required');
            novaCelula.appendChild(pais);
        }

        // CUSTO DE AQUISICAO (input)
        if (i == 4) {
            let custoAquisicao = document.createElement('br-input');
            custoAquisicao.setAttribute('eName', 'Custo de aquisição');
            // custoAquisicao.setAttribute('inputClass', 'text-sm-down-01');
            custoAquisicao.setAttribute('required', 'required');
            custoAquisicao.setAttribute('onchange', 'validarValor');
            novaCelula.appendChild(custoAquisicao);
        }
        
        // VALOR ATUALIZADO 2024 (input)
        if (i == 5) {
            let valorAtualizado = document.createElement('br-input');
            valorAtualizado.setAttribute('eName', 'Valor atualizado em 2024');
            // valorAtualizado.setAttribute('inputClass', 'text-sm-down-01');
            valorAtualizado.setAttribute('required', 'required');
            valorAtualizado.setAttribute('onchange', 'validarValor');
            novaCelula.appendChild(valorAtualizado);
        }
        
        // AÇÕES (botão)
        if (i == 6){
            novaCelula.classList.add('acoes');
            let btnExcluir = document.createElement('button');
            let iconeLixeira = document.createElement('i');
            btnExcluir.classList.add('br-button');
            iconeLixeira.classList.add('fa', 'fa-trash-alt');
            btnExcluir.appendChild(iconeLixeira);
            novaCelula.appendChild(btnExcluir);
            btnExcluir.addEventListener('click', function () {
                excluirLinha(this);
            });
        } 
    }
}


// DESABILITA CLIQUE BOTAO DIREITO
function desabilitarCliqueDireito() {
    document.addEventListener('contextmenu', function (e) {
        e.preventDefault();
    }, false);
}


// TENTA DESABILITAR INSPECTOOLS
function desabilitarAtalhosDevTools() {
    document.addEventListener('keydown', function (e) {
        const teclasDevTools = ['F12', 'I', 'J'];
        if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && teclasDevTools.includes(e.key.toUpperCase()))) {
            e.preventDefault();
        }
    });
}


// FORMATAR TEXTO TRANSFORMA _ EM ESPACO E RETORNA TUDO MAIUSCULO
function formatarTexto(texto) {
    // Substitui underscores por espaços e transforma em maiúsculas
    return texto.replace(/_/g, ' ').toUpperCase();
}


// PREPARA CONTEUDO PARA PDF
function prepararPdf(secoes){
    let continuar = true;  // Variável de controle

    for (let secao of secoes) {

        if(!validarTabelasObrigatorias(secao.id)){
            let tabelaNome = secao.querySelector('table[required]').getAttribute('name');
            tabelaNome = formatarTexto(tabelaNome);
            modalComponente.showModal(
                'Atenção', 
                `A tabela <span class="text-bold">${tabelaNome}</span> é de preenchimento obrigatório`, 
                null, 
                'Entendi', 
                null, 
                modalComponente.closeModal.bind(modalComponente)
            )
            continuar = false;
            break
        }
        
        if (!validarTabelasOpcionais(secao.id)){
            let tabelaNome = secao.querySelector('table[data-opcional="opcional"]').getAttribute('name');
            tabelaNome = formatarTexto(tabelaNome);
            modalComponente.showModal(
                'Atenção', 
                `A tabela <span class="text-bold">${tabelaNome}</span> é de preenchimento obrigatório`, 
                null, 
                'Entendi', 
                null, 
                modalComponente.closeModal.bind(modalComponente)
            )
            continuar = false;
            break
        }

        if(!validarCamposRequiredNaSecao(secao.id)){
            modalComponente.showModal(
                'Atenção', 
                'Existem campos obrigatórios não preenchidos', 
                null, 
                'Entendi', 
                null, 
                modalComponente.closeModal.bind(modalComponente)
            )
            continuar = false;
            break
        }
    }

    if (!continuar) return false;

    return true

}


// NOME DO DOCUMENTO GERADO
const NOME_DOCUMENTO_GERADO = "DISCRIMINATIVOTRANSACAOCONTROVERSIAJURIDICA";

// IDENTIFICAÇÃO DO HTML INCLUÍDA NOS METADADOS DO PDF
const IDENTIFICACAO_HTML = "SUARA_CORAT_TRANSACAO_CONTROVERSIAJURIDICA2026";

// FUNÇÃO QUE VALIDA DADOS E GERA PDF
function gerarDocumento(){
    let secoesToPdf = document.querySelectorAll('.toPdf');
    if (!prepararPdf(secoesToPdf)) return;

    ajustarTextareas(); // Ajusta os textareas com wrap antes de capturar o canvas

    // Exibe o "Aguarde" e desabilita o botão enquanto o documento é gerado
    const btnGerarDocumento = document.getElementById('id-btn-gerar-documento');
    const aguardeGerador = document.getElementById('id-aguarde-gerador');
    if (btnGerarDocumento) btnGerarDocumento.setAttribute('disabled', '');
    if (aguardeGerador) aguardeGerador.style.display = 'block';

    html2canvas(document.querySelector('body')).then(canvas => {
        const imgData = canvas.toDataURL('image/jpeg', 0.7);
        const pdf = new jspdf.jsPDF('landscape');
        
        // Define as dimensões da página
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        // Dimensões da imagem
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;

        // Proporção de redimensionamento da imagem
        const ratio = pageWidth / imgWidth;
        const scaledHeight = imgHeight * ratio;

        // Número total de páginas necessárias
        let totalPages = Math.ceil(scaledHeight / pageHeight);

        for (let i = 0; i < totalPages; i++) {
            const position = -(pageHeight * i);

            // Adiciona a imagem ao PDF, cortando a parte visível da página
            pdf.addImage(imgData, 'JPEG', 0, position, pageWidth, scaledHeight);

            // Adiciona uma nova página se não for a última
            if (i < totalPages - 1) {
                pdf.addPage();
            }
        }

        let json = gerarJSON(secoesToPdf);

        // Define metadados do PDF
        pdf.setProperties({
            keywords: IDENTIFICACAO_HTML + " | " + json,
        });

        pdf.save(NOME_DOCUMENTO_GERADO + ".pdf");

        // Esconde o "Aguarde" e reabilita o botão
        if (btnGerarDocumento) btnGerarDocumento.removeAttribute('disabled');
        if (aguardeGerador) aguardeGerador.style.display = 'none';

        // Exibe a mensagem de sucesso somente após o documento ser gerado
        modalComponente.showModal(
            'Mensagem',
            `<p><span class="text-bold">Discriminativo</span> gerado com SUCESSO.</p>
            <p>O documento</p>
            <p class="text-bold">"${NOME_DOCUMENTO_GERADO}.PDF"</p>
            <p>foi salvo em seu computador (verifique na pasta Downloads ou outra configurada para salvamento).</p>
            <p><span class="text-bold">NÃO</span> altere o conteúdo do documento gerado, pois pode ocasionar <span class="text-bold">RECUSA</span> automática do pedido.</p>
            <p>Anexe o documento ao requerimento que está preenchendo.</p>`,
            null,
            'Entendi',
            null,
            modalComponente.closeModal.bind(modalComponente)
        )
    });

}


// GERA JSON PARA INCLUIR NOS METADADOS DO PDF
function gerarJSON(secoes) {
    const jsonData = {};

    const dataAtual = new Date();
    const dia = dataAtual.getDate();
    const mes = dataAtual.getMonth() + 1; // Meses são indexados de 0 (Janeiro) a 11 (Dezembro), por isso adicionamos 1
    const ano = dataAtual.getFullYear();
    const dataFormatada = `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`;

    jsonData["versao"]= "1.0";
    jsonData["data-de-criacao"]= dataFormatada;

    for (let secao of secoes) {
        
        let tabela = secao.querySelector('table');

        // verificar se tem tabela na secao - criar objetos para cada linha da tabela
        // se não tiver, cada name pode ser chave
        if (!tabela){                        
            jsonData[secao.getAttribute('name')] = extrairValores(secao);

        }else{ // tem tabela
            let secaoTabela = [];
            let linhas = tabela.querySelectorAll('tbody tr');
            
            for (let linha of linhas){
                secaoTabela.push(extrairValores(linha));
            }

            jsonData['tabela_' + secao.getAttribute('name')] = secaoTabela;
        }
    }

    return JSON.stringify(jsonData, null, 2)

}


// EXTRAIR VALORES DOS FORMULARIOS PARA GERAR JSON
function extrairValores(elemento){
    let chaveSecao = {};
    // capturar os componentes de cada elemento (exemplo: secao, linha de tabela, div)
    const inputComponents = elemento.querySelectorAll('br-input-component');
    const switchComponents = elemento.querySelectorAll('.br-switch');
    const textareaComponents = elemento.querySelectorAll('br-textarea-component');
    const datepickerComponents = elemento.querySelectorAll('br-datepicker-component');
    const selectComponents = elemento.querySelectorAll('br-select-component');
    const radioComponents = elemento.querySelectorAll('br-radio-horizontal-component[required]');

    if (inputComponents.length > 0) {
        inputComponents.forEach(inputComponent => {
            const name = inputComponent.querySelector('input').getAttribute('name');
            const value = inputComponent.querySelector('input').value;
            chaveSecao[name] = value;
        });
    }

    if (switchComponents.length > 0) {
        switchComponents.forEach(switchComponent => {
            const name = switchComponent.getAttribute('ename');
            const value = switchComponent.hasAttribute('checked') ? 'Sim' : 'Não' ;
            chaveSecao[name] = value;
        });
    }    
    if (textareaComponents.length > 0) {
        textareaComponents.forEach(textareaComponent => {
            const name = textareaComponent.querySelector('textarea').getAttribute('name');
            const value = textareaComponent.querySelector('textarea').value;
            chaveSecao[name] = value;
        });
    }

    if (datepickerComponents.length > 0) {
        datepickerComponents.forEach(datepickerComponent => {
            const name = datepickerComponent.querySelector('input').getAttribute('name');
            const value = datepickerComponent.querySelector('input').value;
            chaveSecao[name] = value;
        });
    }

    if (selectComponents.length > 0) {
        selectComponents.forEach(selectComponent => {
            const name = selectComponent.querySelector('input').getAttribute('name');
            let value = '';
            if (selectComponent.querySelector('.br-item.selected input[type="radio"]')){
                value = selectComponent.querySelector('.br-item.selected input[type="radio"]').value;
            }
            chaveSecao[name] = value;
        })
    }

    if (radioComponents.length > 0) {
        radioComponents.forEach(radioComponent => {
            if (radioComponent.querySelector('input').checked) {
                const name = radioComponent.querySelector('input').getAttribute('name');
                const value = radioComponent.querySelector('label').innerHTML;
                chaveSecao[name] = value;
            }
        })
    }


    return chaveSecao;
}


// EXCLUI TODAS AS LINHAS DE UMA TABELA
function excluirTodasLinhasTabela(tabela) {
    var linhas = tabela.rows;
    // Começa do final para evitar problemas com o índice mudando durante a remoção
    for (var i = linhas.length - 1; i > 0; i--) {
        tabela.deleteRow(i);
    }
}


// DESABITAR ATALHOS IMPRESSAO
function desabilitarAtalhosImpressao() {
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
            e.preventDefault();
            e.stopPropagation();
            modalComponente.showModal(
                'Atenção', 
                'Utilize o botão Gerar Documento', 
                null, 
                'Entendi', 
                null, 
                modalComponente.closeModal.bind(modalComponente)
            )
        }
    });
}


// VALIDAR TABELA OPCIONAL
function validarTabelasOpcionais(secaoId) {
    const secao = document.getElementById(secaoId);
    let continuar = true;  // Variável de controle

    if (!secao) {
        console.error(`Seção com ID "${secaoId}" não encontrada.`);
        return;
    }

    const tabela = secao.querySelector('table[data-opcional="opcional"]');

    if (tabela) {
        const linhas = tabela.querySelectorAll('tbody tr');

        if (linhas) {
            for (let linha of linhas) {
                const inputComponents = linha.querySelectorAll('br-input-component[data-opcional="obrigatorio"]');
                const textareaComponents = linha.querySelectorAll('br-textarea-component[data-opcional="obrigatorio"]');
                const datepickerComponents = linha.querySelectorAll('br-datepicker-component[data-opcional="obrigatorio"]');
                const selectComponents = linha.querySelectorAll('br-select-component[data-opcional="obrigatorio"]');
                const radioComponents = linha.querySelectorAll('br-radio-horizontal-component[data-opcional="obrigatorio"]');
                
                let algumPreenchido = false;
                let todosPreenchidos = true;

    
                if (inputComponents.length > 0){
                    inputComponents.forEach(inputComponent => {
                        let inputWrapper = inputComponent.querySelector('.br-input');
                        let input = inputComponent.querySelector('input');
                        if (input.value.trim() !== '') {
                            algumPreenchido = true;
                            // inputWrapper.classList.add('danger');
                        } else {
                            todosPreenchidos = false;
                            // camposPreenchidos.push(input);
                            // inputWrapper.classList.remove('danger');
                        }
                    });
                }
                
                if (textareaComponents.length > 0){
                    textareaComponents.forEach(textareaComponent => {
                        let inputWrapper = textareaComponent.querySelector('.br-textarea')
                        let textarea = textareaComponent.querySelector('textarea');
                        if (textarea.value.trim() !== '') {
                            algumPreenchido = true;
                        } else {
                            todosPreenchidos = false;
                        }
                    });
                }

                if (datepickerComponents.length > 0){
                    datepickerComponents.forEach(datepickerComponent => {
                        let inputWrapper = datepickerComponent.querySelector('.br-input');
                        let input = datepickerComponent.querySelector('input');
                        if (input.value.trim() !== '') {
                            algumPreenchido = true;
                        } else {
                            todosPreenchidos = false;
                        }
                    });
                }

                if (selectComponents.length > 0){
                    selectComponents.forEach(selectComponent => {
                        let inputWrapper = selectComponent.querySelector('.br-select').querySelector('.br-input');
                        let item = selectComponent.querySelector('.br-list');
                        if (selectComponent.querySelector('.br-item.selected')) {
                            algumPreenchido = true;
                        } else {
                            todosPreenchidos = false;
                        }
                    });
                }

                if (radioComponents.length > 0){
                    const radiosByName = {};

                    // Agrupa os radio buttons por 'name'
                    radioComponents.forEach(radioComponent => {
                        let radio = radioComponent.querySelector('input');
                        let name = radio.getAttribute('name'); // Obtém o atributo 'name'

                        if (name) { // Verifica se o 'name' existe
                            // Inicializa o array para o 'name' se ainda não existir
                            if (!radiosByName.hasOwnProperty(name)) {
                                radiosByName[name] = []; 
                            }

                            radiosByName[name].push(radio); // Adiciona o radio ao grupo correto
                        }
                    });


                    // Para cada grupo de 'name', verifica se pelo menos um está marcado
                    for (let name in radiosByName) {
                        const radiosGroup = radiosByName[name];
                        const isChecked = radiosGroup.some(radio => radio.checked); // Verifica se algum está marcado

                        if (!isChecked) {
                            todosPreenchidos = false;
                            // camposVazios.push('radioButton'); // Se algum grupo não tem nenhum radio marcado, incrementa campos vazios
                        }
                    }
                }

                if (algumPreenchido && !todosPreenchidos) {
                    modalComponente.showModal(
                        'Atenção', 
                        'Se um campo estiver preenchido, todos os campos da linha devem ser preenchidos.', 
                        null, 
                        'Entendi', 
                        null, 
                        modalComponente.closeModal.bind(modalComponente)
                    )
                    continuar = false;
                    break;
                }


                // return true
            }
        }
    }

    return continuar;
}