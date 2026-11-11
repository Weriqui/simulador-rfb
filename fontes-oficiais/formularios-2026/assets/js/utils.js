//------------------------VALIDAÇÕES----------------------------//

// VALIDAR DATA MAIOR QUE HOJE
function validarDataMaiorQueHoje(inputElement){
    let dataHoje =  new Date();
    const dataString = inputElement.value;
    const [dia, mes, ano] = dataString.split('/');

    let dataInformada = new Date(`${ano}-${mes}-${dia}T00:00:00`);
    dataInformada.setHours(dataInformada.getHours() + 3); // Corrige para o fuso horário do Brasil (UTC-3)
    
    // Zerar horas para comparar só a data
    dataHoje.setHours(0, 0, 0, 0);
    dataInformada.setHours(0, 0, 0, 0);

    if (dataInformada >= dataHoje) {
        return true;
    } else {
        return false;
    }
}


// VALIDAR NUMERO PROCESSO
function validarNumeroProcesso(numeroLimpo) {
    // Extrai os campos da numeração única
    let NNNNNNN = numeroLimpo.substring(0, 7);
    let DD = numeroLimpo.substring(7, 9);
    let AAAA = numeroLimpo.substring(9, 13);
    let J = numeroLimpo.substring(13, 14);
    let TR = numeroLimpo.substring(14, 16);
    let OOOO = numeroLimpo.substring(16, 20);

    let R1 = BigInt(NNNNNNN) % BigInt(97);

    let concatenadoR2 = `${R1.toString()}${AAAA}${J}${TR}`;
    let R2 = BigInt(concatenadoR2) % BigInt(97);

    let concatenadoR3 = `${R2.toString()}${OOOO}00`;
    let R3 = BigInt(concatenadoR3) % BigInt(97);

    // Cálculo final do dígito verificador
    let digitoCalculado = (BigInt(98) - R3).toString().padStart(2, '0');

    // Verifica se o dígito calculado bate com o do processo
    if (digitoCalculado !== DD) {
        return false;
    }

    // Passo extra: validação final com o número completo + dígito verificador
    return BigInt(`${NNNNNNN}${AAAA}${J}${TR}${OOOO}${DD}`) % BigInt(97) === BigInt(1);
}


// VALIDAR ACAO JUDICIAL
function validarAcaoJudicialOuMedidaCautelar(inputElement){
    const numeroLimpo = inputElement.value.replace(/\D/g, '');

    if (numeroLimpo.length !== 20) {
        inputElement.value = '';
        return false;
    }

    aplicarMascaraAcaoJudicialOuMedidaCautelar(inputElement);
    
    // Valida o dígito verificador
    if (!validarNumeroProcesso(numeroLimpo)) {
        // inputElement.value = ''; // Limpa o campo se for inválido
        return false;
    }

    return true;
}


//VALIDA PROCESSO
function validarProcesso(inputElement) {
    const numeroLimpo = inputElement.value.replace(/\D/g, '');

    if (numeroLimpo.length !== 15 && numeroLimpo.length !== 17) {
        inputElement.value = '';
        return false;
    }

    if (numeroLimpo.length == 15) {
        aplicarMascaraProcesso(inputElement);
        return true;
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
            aplicarMascaraProcesso(inputElement)
            return true;
        } else {
            inputElement.value = '';
            return false
        }
    }

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
        // inputWrapper.classList.remove('danger');
        return true;
    } else {
        // inputWrapper.classList.add('danger');
        emailInput.value = '';
        return false;
    }
}


// VALIDA VALORES EM R$ > 0
function validarValorPositivo(inputElement) {
    // Remover caracteres não numéricos e converter para número
    const valor = inputElement.value.replace(/\D/g, '');
    if (valor !== '' && valor > 0) {
        let numero = parseFloat(valor.replace(',', '.')) / 100;
        let numeroFormatado = numero.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        inputElement.value = numeroFormatado;
        return true;
    } else {
        return false;
    }
}


// VALIDA VALORES EM R$ >= 0
function validarValorNaoNegativo(inputElement) {
    // Remover caracteres não numéricos e converter para número
    const valor = inputElement.value.replace(/\D/g, '');
    if (valor !== '') {
        let numero = parseFloat(valor) / 100;
        let numeroFormatado = numero.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        inputElement.value = numeroFormatado;
        return true;
    } else {
        return false;
    }
}


// VALIDAR PERCENTUAL (mostra valor em porcentagem, ex: 5,00%)
function validarPercentual(inputElement) {
    // Permite apenas dígitos (valor inteiro) e formata como porcentagem sem decimais
    // Limita o valor entre 0 e 100 (inclusive)
    const clean = inputElement.value.replace(/\D/g, '');

    if (clean !== '') {
        let num = parseInt(clean, 10);
        if (isNaN(num)) {
            inputElement.value = '';
            return false;
        }

        if (num < 0) num = 0;
        if (num > 100) num = 100;

        inputElement.value = num.toString() + '%';
        return true;
    } else {
        inputElement.value = '';
        return false;
    }
}


//VALIDA CPF OU CNPJ
function validarCNPJCPF(inputElement) {
    let valor = inputElement.value.replace(/\D/g, '');

    if (valor.length !== 11 && valor.length !== 14) {
        inputElement.value = '';
        return false
    }

    if (valor.length === 11) {
        if (!validarCPF(inputElement)) {
            inputElement.value = '';
        }
        else {
            aplicarMascaraCpfCnpj(inputElement);
            return true;
        }
    } 
    else if (valor.length === 14) {
        if (!validarCNPJ(inputElement)) {
            inputElement.value = '';
        }
        else {
            aplicarMascaraCpfCnpj(inputElement);
            return true;
        }
    }
}


//FUNCAO AUX PARA VALIDAR CPF
function validarCPF(inputElement) {
    let cpf = inputElement.value ? inputElement.value.replace(/\D/g, '') : inputElement;
    if (cpf === '') {
        inputElement.value = '';
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
        inputElement.value = '';
        return false;
    }
    // Valida 1o digito
    let add = 0;
    for (let i = 0; i < 9; i++) add += parseInt(cpf.charAt(i)) * (10 - i);
    let rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(9))) {
        inputElement.value = '';
        return false
    };
    // Valida 2o digito
    add = 0;
    for (let i = 0; i < 10; i++) add += parseInt(cpf.charAt(i)) * (11 - i);
    rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(10))) {
        inputElement.value = '';
        return false
    };
    return true;
}


//FUNCAO AUX PARA VALIDAR CNPJ
function validarCNPJ(input) {
    let cnpj = input.value? input.value.replace(/\D/g, '') : input;
    if (cnpj === '') {
        input.value = '';
        return false
    };
    if (cnpj.length !== 14) {
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
        input.value = '';
        return false
    };
    return true;
}


function validarNovoCNPJ(input){
    
    const isInputElement = input && typeof input === 'object' && 'value' in input;
    let cnpj = isInputElement ? input.value : input;

    if(!cnpj){
        if (isInputElement) input.value = '';
        return false;
    }
    
    // Remove outros caracteres
    cnpj = String(cnpj).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(cnpj)) {
        if (isInputElement) input.value = '';
        return false;
    }
    
    // CNPJ invalidos conhecidos (numeros e letras repetidos)
    if (/^([A-Z0-9])\1{13}$/.test(cnpj)) {
        if (isInputElement) input.value = '';
        return false;
    }

    // Faz a conversao necessaria para o valor ascii e ja subtrai 48
    function convert_to_ascii(caractere){
        return caractere.charCodeAt(0) - 48;
    }

    // Faz o calculo de DV de acordo com a base que foi passada
    function calculo_dv(base){
        let dv;
        let soma = 0;   // Variavel de controle de soma
        let peso = 2;   // Variavel de controle de peso

        for(let i=base.length - 1; i>=0; i--){

            // Converte para o valor ascii - 48 e ja faz a multiplicacao do peso
            soma += convert_to_ascii(base.charAt(i)) * peso;
            // Incrementa o peso
            peso++;
            // Reinicia o peso se necessario
            if(peso>9){
                peso = 2;
            }
        }

        // Pega o resto para validacao
        let resto = soma%11;

        if(resto === 0 || resto === 1){
            dv = 0;
        } else{
            dv = 11-resto;
        }

        return dv;
    }

    // Pega apenas os caracteres usados no calculo
    const base = cnpj.substring(0, 12);
    // Pega os caracteres para validacao
    const digitosValidacao = cnpj.substring(12, 14);

    let dv1 = calculo_dv(base);
    let dv2 = calculo_dv(base + dv1);
    // Converte para string
    let digitosCalculados = `${dv1}${dv2}`;

    if(digitosCalculados !== digitosValidacao){
        if (isInputElement) input.value = '';
        return false;
    }

    return true;
}



//----------------------------GERAR PDF------------------//



//Funcao Aux para renderizar container 
async function renderizarContainerNoPdf(container, pdf, isFirstPage) {
    document.body.appendChild(container);

    const canvas = await html2canvas(container, { scale: 2, useCORS: true });

    document.body.removeChild(container);

    const imgWidth = 1920;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (!isFirstPage) pdf.addPage();

    pdf.addImage(
        canvas.toDataURL("image/jpeg", 1.0),
        "JPEG",
        0,
        0,
        imgWidth,
        imgHeight,
        undefined,
        "FAST"
    );

    return false;
}


//Funcao para obter linhas 
function obterLinhasTabela(tbody) {
    const linhas = Array.from(tbody.querySelectorAll('tr'));

    const linhaTotal = linhas.find(tr => tr.querySelector('#totalGeral'));
    const linhasDados = linhas.filter(tr => tr !== linhaTotal);

    return { linhasDados, linhaTotal };
}


async function gerarDocumento() {
    const TABELAS_PAGINADAS = {
        'id-detalhamento-creditos-tributarios': {
            tbodySelector: '#tabelaDebitosBody',
            linhasPorPagina: 10,
            removeSelectors: ['th.acoes', '.acoes', '.justify-content-around']
        },

        'id-detalhamentos-descontos': {
            tbodySelector: '#bd-tabela-calculo-descontos',
            linhasPorPagina: 10,
            removeSelectors: []
        }
    };

    const alerta = document.getElementById('id-aguardar');
    if (alerta) alerta.classList.remove('d-none');

    try {
        const pdf = new jspdf.jsPDF({
            orientation: "landscape",
            unit: "px",
            format: [1920, 1080]
        });

        const secoesToPdf = document.querySelectorAll('.toPdf');

        if (!prepararPdf(secoesToPdf)) return;

        pdf.setProperties({
            keywords: gerarJSON(secoesToPdf)
        });

        const elementos = document.querySelectorAll('[class*="pagina"]:not(.d-none)');
        const classesPagina = new Set();

        elementos.forEach(elemento => {
            elemento.classList.forEach(classe => {
                if (classe.startsWith('pagina')) {
                    classesPagina.add(classe);
                }
            });
        });

        const paginas = Array.from(classesPagina).sort();

        let isFirstPage = true;

        const copiarValoresInputs = (origem, destino) => {
            const inputsOriginais = origem.querySelectorAll('input, select, textarea');
            const inputsClonados = destino.querySelectorAll('input, select, textarea');

            for (let k = 0; k < inputsOriginais.length; k++) {
                if (!inputsClonados[k]) continue;

                if (
                    inputsOriginais[k].type === 'checkbox' ||
                    inputsOriginais[k].type === 'radio'
                ) {
                    inputsClonados[k].checked = inputsOriginais[k].checked;
                } else {
                    inputsClonados[k].value = inputsOriginais[k].value;
                    inputsClonados[k].setAttribute('value', inputsOriginais[k].value);
                }
            }
        };

        for (let i = 0; i < paginas.length; i++) {
            const className = paginas[i];
            const secoesDaPagina = document.querySelectorAll(`.${className}:not(.d-none)`);

            const secaoPaginavel = Array.from(secoesDaPagina).find(secao => {
                return TABELAS_PAGINADAS[secao.id];
            });

            if (secaoPaginavel) {
                const config = TABELAS_PAGINADAS[secaoPaginavel.id];
                const tbodyOriginal = secaoPaginavel.querySelector(config.tbodySelector);

                if (!tbodyOriginal) {
                    console.warn(`tbody não encontrado para a seção ${secaoPaginavel.id}`);
                    continue;
                }

                const { linhasDados, linhaTotal } = obterLinhasTabela(tbodyOriginal);

                for (let j = 0; j < linhasDados.length; j += config.linhasPorPagina) {
                    const container = document.createElement("div");
                    container.style.width = "1920px";
                    container.style.position = "absolute";
                    container.style.top = "-9999px";
                    container.style.left = "-9999px";
                    container.style.background = "white";

                    secoesDaPagina.forEach(secao => {
                        const cloneSecao = secao.cloneNode(true);
                        copiarValoresInputs(secao, cloneSecao);

                        if (secao.id === secaoPaginavel.id) {
                            const tbodyClone = cloneSecao.querySelector(config.tbodySelector);

                            if (tbodyClone) {
                                tbodyClone.innerHTML = '';

                                for (let k = j; k < j + config.linhasPorPagina; k++) {
                                    if (k >= linhasDados.length) break;

                                    const linhaOriginal = linhasDados[k];
                                    const linhaClone = linhaOriginal.cloneNode(true);

                                    copiarValoresInputs(linhaOriginal, linhaClone);

                                    tbodyClone.appendChild(linhaClone);
                                }

                                const ehUltimaPaginaDessaTabela =
                                    (j + config.linhasPorPagina) >= linhasDados.length;

                                if (linhaTotal && ehUltimaPaginaDessaTabela) {
                                    const linhaTotalClone = linhaTotal.cloneNode(true);
                                    copiarValoresInputs(linhaTotal, linhaTotalClone);
                                    tbodyClone.appendChild(linhaTotalClone);
                                }
                            }

                            config.removeSelectors.forEach(selector => {
                                cloneSecao.querySelectorAll(selector).forEach(el => el.remove());
                            });
                        }

                        container.appendChild(cloneSecao);
                    });

                    isFirstPage = await renderizarContainerNoPdf(
                        container,
                        pdf,
                        isFirstPage
                    );
                }
            } else {
                const container = document.createElement("div");
                container.style.width = "1920px";
                container.style.position = "absolute";
                container.style.top = "-9999px";
                container.style.left = "-9999px";
                container.style.background = "white";

                secoesDaPagina.forEach(secao => {
                    const cloneSecao = secao.cloneNode(true);
                    copiarValoresInputs(secao, cloneSecao);
                    container.appendChild(cloneSecao);
                });

                isFirstPage = await renderizarContainerNoPdf(
                    container,
                    pdf,
                    isFirstPage
                );
            }
        }

        const nomePdf = window.nomePdf || "documento.pdf";
        pdf.save(nomePdf);

        const mensagemSucesso = `
            <strong>Discriminativo</strong> gerado com SUCESSO.<br><br>
            O documento "<strong>${nomePdf.toUpperCase()}</strong>" foi salvo em seu computador (verifique na pasta Downloads ou outra configurada para salvamento).<br><br>
            <strong>NÃO</strong> altere o conteúdo do documento gerado, pois pode ocasionar <strong>RECUSA</strong> automática do pedido.<br><br>
            Anexe o documento ao requerimento que está preenchendo.
        `;
        showModal(mensagemSucesso);

    } finally {
        if (alerta) alerta.classList.add('d-none');
    }
}




// PREPARA CONTEUDO PARA PDF
function prepararPdf(secoes){
    let continuar = true;  // Variável de controle

    for (let secao of secoes) {

        if(!validarTabelasObrigatorias(secao.id)){
            let tabelaNome = secao.querySelector('table.obrigatorio').getAttribute('name');
            tabelaNome = formatarTexto(tabelaNome);
            modal.showScrim();
            continuar = false;
            break
        }

        if(!validarCamposObrigatoriosPorSecao(secao.id)){
            let mensagem = 'Por favor preencha todos os campos obrigatórios';
            let elementoDaMensagem = document.querySelector('#id-elemento-mensagem');
            elementoDaMensagem.innerHTML = mensagem;
            modal.showScrim();
            continuar = false;
            break
        }

    }

    if (!continuar) return false;

    return true

}


// VERIFICA SE TODAS TABELAS OBRIGATORIOS TEM PELO MENOS UMA LINHA
function validarTabelasObrigatorias(secaoId){
    const secao = document.getElementById(secaoId);
    let continuar = true;  // Variável de controle
    
    if (!secao) {
        console.error(`Seção com ID "${secaoId}" não encontrada.`);
        return;
    }

    const tabelas = secao.querySelectorAll('table.obrigatorio');

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


// VALIDAR CAMPOS OBRIGATORIOS POR SECAO
function validarCamposObrigatoriosPorSecao(secaoId) {
    const secao = document.getElementById(secaoId);
    
    if (!secao) {
        console.error(`Seção com ID "${secaoId}" não encontrada.`);
        return;
    }
    
    // Obtém todos os inputs e textareas dentro da seção
    const inputComponents = secao.querySelectorAll('.br-input.obrigatorio');
    const textareaComponents = secao.querySelectorAll('.br-textarea.obrigatorio');
    const datepickerComponents = secao.querySelectorAll('.br-datetimepicker.obrigatorio');
    const selectComponents = secao.querySelectorAll('.br-select.obrigatorio');
    const radioComponents = secao.querySelectorAll('.br-radio.obrigatorio');

    let camposVazios = [];
    
    if (inputComponents.length > 0){
        inputComponents.forEach(inputComponent => {
            let input = inputComponent.querySelector('input');
            if (input.value.trim() === '') {
                inputComponent.classList.add('danger');
                camposVazios.push(input);
            } else {
                inputComponent.classList.remove('danger');
            }
        });
    }
    
    if (textareaComponents.length > 0){
        textareaComponents.forEach(textareaComponent => {
            let textarea = textareaComponent.querySelector('textarea');
            if (textarea.value.trim() === '') {
                textareaComponent.classList.add('danger');
                camposVazios.push(textarea);
            } else {
                textareaComponent.classList.remove('danger');
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
            let inputWrapper = selectComponent.querySelector('.br-input');
            let item = selectComponent.querySelector('.br-list');
            if (!selectComponent.querySelector('.br-item.selected')) {
                inputWrapper.classList.add('danger');
                camposVazios.push(item);
            } else {
                inputWrapper.classList.remove('danger');
            }
        });
    }

    if (radioComponents.length > 0){
        const radiosByName = {};

        // Agrupa os radio buttons por 'name'
        radioComponents.forEach(radioComponent => {
            let inputWrapper = radioComponent.querySelector('.br-radio');
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

            if (!isChecked) { // se nenhum estiver marcado atualiza camposVazios e coloca a classe invalid em todos os radios do grupo
                radiosGroup.forEach( input => {
                    input.parentElement.classList.add('invalid')
                });
                camposVazios.push('radioButton'); // Se algum grupo não tem nenhum radio marcado, incrementa campos vazios
            }
        }

    }

    if (camposVazios.length > 0) {
        return false
    }

    return true
}


// GERAR JSON
function gerarJSON(secoes) {
    const jsonData = {};

    const dataAtual = new Date();
    const dia = dataAtual.getDate();
    const mes = dataAtual.getMonth() + 1; // Meses são indexados de 0 (Janeiro) a 11 (Dezembro), por isso adicionamos 1
    const ano = dataAtual.getFullYear();
    const dataFormatada = `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`;

    const caminhoAtual = window.location.pathname.toLowerCase();

    const mapDocumentos = {
        'previdenciarios.html': 'SUARA_CORAT_TRANSACAO_PREVIDENCIARIOSATE50MILHOES_2026',
        'fazendarios.html': 'SUARA_CORAT_TRANSACAO_FAZENDARIOSATE50MILHOES_2026',
        'ate60sm.html': 'SUARA_CORAT_TRANSACAO_60SALARIOS_2026'
    };

    let identificacaoDocumento = '';

    for (const [arquivo, identificacao] of Object.entries(mapDocumentos)) {
        if (caminhoAtual.includes(arquivo)) {
            identificacaoDocumento = identificacao;
            break;
        }
    }

    jsonData["versao"] = "1.0";
    jsonData["data-de-criacao"] = dataFormatada;
    jsonData["identificacao_documento"] = identificacaoDocumento;

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
    // Obtém todos os valores de campos
    const isNotComponents = elemento.querySelectorAll('.is-not-component');
    const inputComponents = elemento.querySelectorAll('.br-input');
    const textareaComponents = elemento.querySelectorAll('.br-textarea');
    const datepickerComponents = elemento.querySelectorAll('.br-datetimepicker');
    const selectComponents = elemento.querySelectorAll('.br-select');
    const selectMultipleComponents = elemento.querySelectorAll('.br-select[multiple="multiple"]');
    const radioComponents = elemento.querySelectorAll('.br-radio');
    const checkboxComponents = elemento.querySelectorAll('.br-checkbox');

    if (isNotComponents.length > 0) {
        isNotComponents.forEach(isNotComponent => {
            const name = isNotComponent.getAttribute('name');
            const value = isNotComponent.innerHTML;
            if (name) {
                chaveSecao[name] = value;
            }
        });
    }

    if (inputComponents.length > 0) {
        inputComponents.forEach(inputComponent => {
            const name = inputComponent.querySelector('input').getAttribute('name');
            const value = inputComponent.querySelector('input').value;
            if (name) {
                chaveSecao[name] = value;
            }
        });
    }
    
    if (textareaComponents.length > 0) {
        textareaComponents.forEach(textareaComponent => {
            const name = textareaComponent.querySelector('textarea').getAttribute('name');
            const value = textareaComponent.querySelector('textarea').value;
            if (name) {
                chaveSecao[name] = value;
            }
        });
    }

    if (datepickerComponents.length > 0) {
        datepickerComponents.forEach(datepickerComponent => {
            const name = datepickerComponent.querySelector('input').getAttribute('name');
            const value = datepickerComponent.querySelector('input').value;
            if (name) {
                chaveSecao[name] = value;
            }
        });
    }

    if (selectComponents.length > 0) {
        selectComponents.forEach(selectComponent => {
            const name = selectComponent.getAttribute('name');
            let value = '';
            if (selectComponent.querySelector('.br-item.selected input[type="radio"]')){
                value = selectComponent.querySelector('.br-item.selected input[type="radio"]').value;
            }
            if (name) {
                chaveSecao[name] = value;
            }
        })
    }

    if (selectMultipleComponents.length > 0) {
        selectMultipleComponents.forEach(selectComponent => {
            const name = selectComponent.getAttribute('name');
            let valoresSelecionados = [];
    
            let opcoesSelecionadas = selectComponent.querySelectorAll('.br-item.selected input[type="checkbox"]');
            opcoesSelecionadas.forEach(opcao => {
                const valor = opcao.getAttribute('data-valor');
                if (valor) {
                    valoresSelecionados.push(valor);
                }
            });
    
            if (name) {
                chaveSecao[name] = valoresSelecionados;
            }
        });
    }

    if (radioComponents.length > 0) {
        radioComponents.forEach(radioComponent => {
            if (radioComponent.querySelector('input').checked) {
                const name = radioComponent.querySelector('input').getAttribute('name');
                const value = radioComponent.querySelector('label').innerHTML;
                if (name) {
                    chaveSecao[name] = value;
                }
            }
        })
    }

    if (checkboxComponents.length > 0) {
        checkboxComponents.forEach(checkboxComponent => {
            // Verifica se o checkbox está marcado
            if (checkboxComponent.querySelector('input').checked) {
                const name = checkboxComponent.querySelector('input').getAttribute('name');
                const value = checkboxComponent.querySelector('input').checked ? 'Sim' : 'Não';
                if (name) {
                    chaveSecao[name] = value;
                }
            }
        })
    }

    return chaveSecao;
}









//------------------FORMATACOES------------------//

// APLICAR MASCARA ACAO JUDICIAL
function aplicarMascaraAcaoJudicialOuMedidaCautelar(inputElement) {
    let valor = inputElement.value.replace(/\D/g, ''); // Remove tudo que não for número

    // Aplica a máscara no formato NNNNNNN-NN.AAAA.N.NN.NNNN
    valor = valor.replace(/(\d{7})(\d{2})(\d{4})(\d{1})(\d{2})(\d{4})/, '$1-$2.$3.$4.$5.$6');

    inputElement.value = valor;
}


// FORMATAR TEXTO TRANSFORMA _ EM ESPACO E RETORNA TUDO MAIUSCULO
function formatarTexto(texto) {
    // Substitui underscores por espaços e transforma em maiúsculas
    return texto.replace(/_/g, ' ').toUpperCase();
}


// APLICA MÁSCARA DE CPF OU CNPJ
function aplicarMascaraCpfCnpj(inputElement) {
    let valor = inputElement.value.replace(/\D/g, '');

    if (valor.length <= 11) {
        // Máscara para CPF
        valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
        valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
        valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
        // Máscara para CNPJ
        valor = valor.replace(/(\d{2})(\d)/, '$1.$2');
        valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
        valor = valor.replace(/(\d{3})(\d)/, '$1/$2');
        valor = valor.replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    }

    inputElement.value = valor;
}


// APLICA MASCARA PROCESSO
function aplicarMascaraProcesso(inputElement) {
    let valor = inputElement.value.replace(/\D/g, ''); // Remove tudo que não for número

    if (valor.length === 15) {
        // Máscara para 15 dígitos: NNNNN.NNNNNN/NN-NN
        valor = valor.replace(/(\d{5})(\d{6})(\d{2})(\d{2})?/, '$1.$2/$3-$4');
    } else {
        // Máscara para 17 dígitos: NNNNN.NNNNNN/NNNN-NN
        valor = valor.replace(/(\d{5})(\d{6})(\d{4})(\d{2})?/, '$1.$2/$3-$4');
    }

    inputElement.value = valor;
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


//-------------------CONTROLE DE IMPRESSAO------------------//

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


// DESABILITAR ATALHOS IMPRESSAO
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


//-------------------CONVERSOES------------------//

// CONVERTE STRING EM NUMERO
function converterStringEmNumero(valorStr) {
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


function converterNumeroEmString(valor) {
    // Verifica se o valor é um número
    if (typeof valor !== 'number' || isNaN(valor)) {
        throw new Error('O valor deve ser um número.');
    }

    // Converte o número para string
    let valorString = valor.toString();

    // Adiciona a vírgula como separador decimal e formata com duas casas decimais
    valorString = valorString.replace('.', ',');

    return valorString;
}


// CONVERTE NUMERO EM STRING REAIS
function converterNumeroEmMoeda(value) {
    // Verifica se o valor é um número
    if (typeof value !== 'number' || isNaN(value)) {
        throw new Error('O valor deve ser um número.');
    }

    // Formata o número como moeda no formato brasileiro sem o símbolo "R$"
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}


// CONVERTE STRING EM MOEDA
function converterStringEmMoeda(valorStr) {
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

    return numberValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

}


//--------------------FUNCOES PARA TABELAS------------------//

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


// EXCLUI LINHA DA TABELA AO CLICAR NO ICONE LIXEIRA
function excluirLinhaTabela(botao) {
    const linha = botao.closest('tr');

    if (linha) {
        linha.remove();
    }
}


// EXCLUI TODAS AS LINHAS DE UMA TABELA
function excluirTodasLinhasTabela(tabela) {
    var linhas = tabela.rows;
    // Começa do final para evitar problemas com o índice mudando durante a remoção
    for (var i = linhas.length - 1; i > 0; i--) {
        tabela.deleteRow(i);
    }
}


//-------------------DIVERSAS------------------//

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


// COMPARA DOIS VALORES NUMERICOS
function compararDoisValoresNumericos(valorElemento1, valorElemento2, operador) {

    let valor1;
    let valor2;

    try {
        valor1 = converterStringEmNumero(valorElemento1);
    } catch (error) {
        // console.warn(`Erro ao obter o valor do componente 1: ${error.message}`);
        return false; // ou outro valor padrão
    }

    try {
        valor2 = converterStringEmNumero(valorElemento2);
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

//-------------------INICIALIZACAO------------------//

// ATIVA PROTEÇÃO DE IMPRESSÃO AO CARREGAR A PÁGINA

document.addEventListener('DOMContentLoaded', function() {
    desabilitarAtalhosImpressao();
    desabilitarAtalhosDevTools();
    desabilitarCliqueDireito();
});

