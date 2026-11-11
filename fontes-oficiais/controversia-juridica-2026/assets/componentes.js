/* ==========================================================================
   COMPONENTES.JS
   Todos os web components (br-*) consolidados em um único arquivo.
   Os templates HTML de cada componente ficam embutidos no próprio
   editais.html (dentro de <template id="tpl-...">), evitando o uso de
   fetch() para carregar arquivos externos - isso resolve o problema de
   componentes que não carregavam dependendo de como a página era aberta
   (protocolo file://, CORS, estrutura de pastas no servidor, etc.).

   Nenhuma lógica, cálculo ou atributo dos componentes originais foi
   alterado - apenas a forma de obter o template (de fetch para
   document.getElementById().content.cloneNode(true)).
   ========================================================================== */


/* ============================== CABEÇALHO =============================== */
class BRCabecalho extends HTMLElement {

    static get observedAttributes() {
        return ['titulo', 'subtitulo'];
    }

    constructor() {
        super();
    }

    loadTemplate() {
        try {
            const template = document.getElementById('tpl-br-cabecalho').content.cloneNode(true);
            this.appendChild(template);
            this.updateAttributes();
        } catch (error) {
            console.error('Erro ao carregar o template (br-cabecalho):', error);
        }
    }

    connectedCallback() {
        if (!this.templateLoaded) {
            this.loadTemplate();
            this.templateLoaded = true;
        } else {
            this.updateAttributes();
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name !== null) {
            if (['titulo', 'subtitulo'].includes(name)) {
                this.updateAttributes();
            }
        }
    }

    updateAttributes() {
        this.updateTitulo();
        this.updateSubtitulo();
    }

    updateTitulo(){
        const titulo = this.getAttribute('titulo') || '';
        const tituloElement = this.querySelector('#id-titulo');

        if (tituloElement) {
            tituloElement.innerHTML = titulo;
        }
    }

    updateSubtitulo(){
        const subtitulo = this.getAttribute('subtitulo') || '';
        const subtituloElement = this.querySelector('#id-subtitulo');

        if (subtituloElement) {
            subtituloElement.innerHTML = subtitulo;
        }
    }
}

customElements.define('br-cabecalho-component', BRCabecalho);


/* =============================== RODAPÉ ================================= */
class BRRodape extends HTMLElement{

    constructor() {
        super();
    }

    loadTemplate() {
        try {
            const template = document.getElementById('tpl-br-rodape').content.cloneNode(true);
            this.appendChild(template);
        } catch (error) {
            console.error('Erro ao carregar o template (br-rodape):', error);
        }
    }

    connectedCallback() {
        if (!this.templateLoaded) {
            this.loadTemplate();
            this.templateLoaded = true;
        }
    }
}

customElements.define('br-rodape-component', BRRodape);


/* ============================== TEXTAREA ================================= */
class BRTextareaComponente extends HTMLElement {

    static get observedAttributes() {
        return ['eName', 'label', 'rows', 'textareaClass', 'placeholder', 'required', 'maxlength'];
    }

    constructor() {
        super();
    }

    loadTemplate() {
        try {
            this.template = document.getElementById('tpl-br-textarea').content.cloneNode(true);
            this.appendChild(this.template);

            this.updateAttributes();

            requestAnimationFrame(() => this.limitLines());
        } catch (error) {
            console.error('Erro ao carregar o template (br-textarea):', error);
        }
    }

    connectedCallback() {
        if (!this.templateLoaded) {
            this.loadTemplate();
            this.templateLoaded = true;
        } else {
            this.updateAttributes();
            requestAnimationFrame(() => this.limitLines());
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name !== null) {
            if (['eName', 'label', 'rows', 'placeholder', 'required', 'maxlength'].includes(name)) {
                this.updateAttributes();
            }
        }
    }

    updateAttributes() {
        this.updateName();
        this.updateLabel();
        this.updateClass();
        this.updateRows();
        this.updatePlaceholder();
        this.updateRequired();
        this.updateMaxLength();
    }

    updateName(){
        const name = this.getAttribute('eName') || '';
        const textareaElement = this.querySelector('textarea');

        if (textareaElement) {
            textareaElement.name = name;
        }
    }

    updateLabel() {
        const label = this.getAttribute('label') || '';
        const labelElement = this.querySelector('label');

        if (labelElement) {
            labelElement.textContent = label;
        }
    }

    updateClass() {
        const classes = this.getAttribute('textareaClass') || '';
        this.setAttribute('class', classes);
    }

    updateRows() {
        const rows = this.getAttribute('rows') || '';
        const textareaElement = this.querySelector('textarea');

        if (textareaElement) {
            textareaElement.rows = rows;
        }
    }

    updatePlaceholder() {
        const placeholder = this.getAttribute('placeholder') || '';
        const textareaElement = this.querySelector('textarea');

        if (textareaElement) {
            textareaElement.placeholder = placeholder;
        }
    }

    updateRequired() {
        const textareaElement = this.querySelector('textarea');

        if (textareaElement) {
            if (this.hasAttribute('required')) {
                textareaElement.setAttribute('required', '');
            } else {
                textareaElement.removeAttribute('required');
            }
        }
    }

    updateMaxLength() {
        const maxlength = this.getAttribute('maxlength') || '';
        const textareaElement = this.querySelector('textarea');

        if (textareaElement) {
            if (maxlength) {
                textareaElement.setAttribute('maxlength', maxlength);
            } else {
                textareaElement.removeAttribute('maxlength');
            }
        }
    }

    limitLines() {
        const textareaElement = this.querySelector('textarea');
        if (!textareaElement) return;

        textareaElement.addEventListener('input', function () {
            const maxLines = parseInt(textareaElement.getAttribute('rows'));
            const lines = textareaElement.value.split('\n').length;

            // Limita o número de linhas ao máximo permitido
            if (lines > maxLines) {
                const trimmedText = textareaElement.value.split('\n').slice(0, maxLines).join('\n');
                textareaElement.value = trimmedText;  // Limita o texto às linhas permitidas
            }

            // Ajusta a altura dinamicamente para impedir a barra de rolagem
            textareaElement.style.height = 'auto';
            textareaElement.style.height = textareaElement.scrollHeight + 'px';
        });
    }
}

customElements.define('br-textarea-component', BRTextareaComponente);


/* ================================ SELECT ================================= */
class BRSelectComponent extends HTMLElement {
	constructor() {
	  super();
	  this.idPrefix = 'rb';
	  this.isOptionsLoaded = false; // Flag para garantir que as opções sejam carregadas
	}

	connectedCallback() {
	  this.render();
	  this.initializeSelect();
	}

	render() {
	  const label = this.getAttribute('label') || '';
	  const opcoesFuncName = this.getAttribute('opcoes');
	  const opcoesList = this.getAttribute('listaOpcoes') || null;
	  const onchange = this.getAttribute('onchangeFunc') || '';
	  const name = this.getAttribute('eName') || "";
	  const required = this.getAttribute('required');
	  const classes = this.getAttribute('inputClass') || "";
	  const id = this.getAttribute('inputId') || '';

	  // Verifica se a função de opções está definida globalmente
	  const opcoes = window[opcoesFuncName] ? eval(window[opcoesFuncName]()) : [];
	  const optionsHTML = opcoesList? this.createOptions(opcoesList.split(',')/*.map(Number)*/): this.createOptions(opcoes);

	  this.innerHTML = `
		<div class="br-select" style="max-width:unset" onchange="${onchange}">
		  <div class="br-input">
			<label for="select-simple">${label}</label>
			<input id="${id}" type="text" class="${classes}" name="${name}" ${required} placeholder="Selecione o item"/>
			<button class="br-button" type="button" aria-label="Exibir lista" tabindex="-1" data-trigger="data-trigger">
			  <i class="fas fa-angle-down" aria-hidden="true"></i>
			</button>
		  </div>
		  <div class="br-list" tabindex="0">
			${optionsHTML}
		  </div>
		</div>
	  `;
	}

	createOptions(opcoes) {
	  return opcoes.map((opcao, index) => {
		  const uniqueId = this.generateUniqueId(index);
		  return `
			<div class="br-item" tabindex="-1">
			  <div class="br-radio">
				<input id="${uniqueId}" type="radio" name="" value="${opcao}"/>
				<label for="${uniqueId}">${opcao}</label>
			  </div>
			</div>
		  `;
	  }).join('');
	}

	generateUniqueId(index) {
	  return `${this.idPrefix}${index}_${Math.random().toString(36).substr(2, 9)}`;
	}

	initializeSelect() {
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
		`;

		const brSelect = this.querySelector('.br-select');
		if (brSelect) {
			new core.BRSelect('br-select', brSelect, notFoundElement)
            brSelect.addEventListener('onChange', window[this.getAttribute('onchangeFunc')]);
		}

	}

	// Método para atualizar as opções dinamicamente
	updateOptions(opcoes) {
	  const optionsHTML = this.createOptions(opcoes);
	  this.querySelector('.br-list').innerHTML = optionsHTML;
	}

}

customElements.define('br-select-component', BRSelectComponent);


/* ================================ INPUT =================================== */
class BRInputComponente extends HTMLElement {

    static get observedAttributes() {
        return ['inputId', 'eName', 'inputClass', 'inputStyle', 'label', 'placeholder', 'required', 'maxlength', 'initValue', 'isDisabled'];
    }

    constructor() {
        super();
    }

    loadTemplate() {
        try {
            this.template = document.getElementById('tpl-br-input').content.cloneNode(true);
            this.appendChild(this.template);

            this.updateAttributes();
            this.addEventListeners();
        } catch (error) {
            console.error('Erro ao carregar o template (br-input):', error);
        }
    }

    connectedCallback() {
        if (!this.templateLoaded) {
            this.loadTemplate();
            this.templateLoaded = true;
        } else {
            this.updateAttributes();
            this.addEventListeners();
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name !== null) {
            if (['inputId', 'eName', 'inputClass', 'inputStyle', 'label', 'placeholder', 'required', 'maxlength', 'initValue', 'isDisabled'].includes(name)) {
                this.updateAttributes();
            }
            this.addEventListeners();
        }
    }

    updateAttributes() {
        this.updateId();
        this.updateName();
        this.updateClass();
        this.updateStyle();
        this.updateLabel();
        this.updatePlaceholder();
        this.updateRequired();
        this.updateMaxLength();
        this.updateInitValue();
        this.updateDisabled();
    }

    updateId() {
        const id = this.getAttribute('inputId') || '';
        const inputElement = this.querySelector('input');
        const labelElement = this.querySelector('label');

        if (inputElement && labelElement) {
            inputElement.id = id;
            labelElement.setAttribute('for', id);
        }
    }

    updateName(){
        const name = this.getAttribute('eName') || '';
        const inputElement = this.querySelector('input');

        if (inputElement) {
            inputElement.name = name;
        }
    }

    updateClass() {
        const classes = this.getAttribute('inputClass') || '';
        const inputElement = this.querySelector('input');

        if (inputElement) {
            inputElement.setAttribute('class', classes);
        }
    }

    updateStyle() {
        const style = this.getAttribute('inputStyle') || '';
        const inputElement = this.querySelector('input');

        if (inputElement) {
            inputElement.setAttribute('style', style);
        }
    }

    updateLabel() {
        const label = this.getAttribute('label') || '';
        const labelElement = this.querySelector('label');

        if (labelElement) {
            labelElement.innerHTML = label;
        }
    }

    updatePlaceholder() {
        const placeholder = this.getAttribute('placeholder') || '';
        const inputElement = this.querySelector('input');

        if (inputElement) {
            inputElement.placeholder = placeholder;
        }
    }

    updateRequired() {
        const inputElement = this.querySelector('input');

        if (inputElement) {
            if (this.hasAttribute('required')) {
                inputElement.setAttribute('required', '');
            } else {
                inputElement.removeAttribute('required');
            }
        }
    }

    updateMaxLength() {
        const maxlength = this.getAttribute('maxlength') || '';
        const inputElement = this.querySelector('input');

        if (inputElement) {
            if (maxlength) {
                inputElement.setAttribute('maxlength', maxlength);
            } else {
                inputElement.removeAttribute('maxlength');
            }
        }
    }

    updateInitValue() {
        const value = this.getAttribute('initValue') || '';
        const inputElement = this.querySelector('input');

        if (inputElement) {
            inputElement.value = value;
        }
    }

    updateDisabled() {
        const inputElement = this.querySelector('input');
        if (inputElement) {
            if (this.hasAttribute('isDisabled')) {
                inputElement.setAttribute('disabled', '');
            } else {
                inputElement.removeAttribute('disabled');
            }
        }

    }

    addEventListeners() {
        const inputElement = this.querySelector('input');

        if (inputElement) {
            const attributes = this.getAttributeNames();
            attributes.forEach(attr => {
                if (attr.startsWith('on')) {
                    const eventName = attr.substring(2);
                    const eventHandlers = this.getAttribute(attr).split(',');

                    eventHandlers.forEach(eventHandlerName => {
                        eventHandlerName = eventHandlerName.trim();
                        if (typeof window[eventHandlerName] === 'function') {
                            inputElement.addEventListener(eventName, () => {
                                window[eventHandlerName](inputElement);
                            });
                        }
                    });
                }
            });
        }
    }
}

customElements.define('br-input-component', BRInputComponente);


/* =============================== DATEPICKER =============================== */
class BRDatepickerComponent extends HTMLElement {
  static get observedAttributes() {
    return ['mindate', 'maxdate', 'label', 'eName', 'inputClass', 'placeholder', 'required'];
  }

  constructor() {
    super();
  }

  loadTemplate() {
    try {
      this.template = document.getElementById('tpl-br-datepicker').content.cloneNode(true);
      this.appendChild(this.template);

      this.updateAttributes();
    } catch (error) {
      console.error('Erro ao carregar o template (br-datepicker):', error);
    }
  }

  connectedCallback() {
    if (!this.templateLoaded) {
      this.loadTemplate();
      this.templateLoaded = true;
    } else {
      this.updateAttributes();
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if(name !== null){
      if (['mindate', 'maxdate', 'label', 'eName', 'inputClass', 'placeholder', 'required'].includes(name)) {
        this.updateAttributes();
      }
    }
  }

  updateAttributes() {
    this.updateLabel();
    this.updateName();
    this.updateClass();
    this.updatePlaceholder();
    this.updateRequired();
    this.initializeDatepicker();
  }

  updateLabel() {
    const labelElement = this.querySelector('label');
    const label = this.getAttribute('label') || '';
    if (labelElement) {
      labelElement.innerHTML = label;
    }
  }

  updateName() {
    const name = this.getAttribute('eName') || '';
    const inputElement = this.querySelector('input');
    if (inputElement) {
      inputElement.name = name;
    }
  }

  updateClass() {
    const classes = this.getAttribute('inputClass') || '';
    const inputElement = this.querySelector('input');

    if (inputElement) {
        inputElement.setAttribute('class', classes);
    }
  }

  updatePlaceholder() {
    const placeholder = this.getAttribute('placeholder') || 'exemplo: 02/02/2024';
    const inputElement = this.querySelector('input');
    if (inputElement) {
      inputElement.placeholder = placeholder;
    }
  }

  updateRequired() {
    const inputElement = this.querySelector('input');
    if (inputElement) {
      if (this.hasAttribute('required')) {
        inputElement.setAttribute('required', '');
      } else {
        inputElement.removeAttribute('required');
      }
    }
  }

  initializeDatepicker() {
    const minDate = this.getAttribute('mindate') || '';
    const maxDate = this.getAttribute('maxdate') || '';

    // Garanta que o template esteja carregado antes de tentar inicializar o DateTimePicker
    if (this.template) {
      new core.BRDateTimePicker('br-datetimepicker', this.querySelector('.br-datetimepicker'), {
        minDate: minDate,
        maxDate: maxDate
      });
    }
  }
}

customElements.define('br-datepicker-component', BRDatepickerComponent);


/* ============================== MODAL SIMPLES ============================== */
class BRModalSimples extends HTMLElement {

    constructor() {
        super();
    }

    loadTemplate() {
        try {
            this.template = document.getElementById('tpl-br-modal-simples').content.cloneNode(true);
            this.appendChild(this.template);

            // Referências ao modal e seus elementos
            this.modal = this.querySelector('.br-modal');
            this.modalTitle = this.querySelector('.modal-title');
            this.modalMessage = this.querySelector('.modal-message');
            this.modalBtn1 = this.querySelector('.btn-1');
            this.modalBtn2 = this.querySelector('.btn-2');

            // Botão de fechar
            this.querySelector('.close').addEventListener('click', () => this.closeModal());

        } catch (error) {
            console.error('Erro ao carregar o template (br-modal-simples):', error);
        }
    }

    connectedCallback() {
        if (!this.templateLoaded) {
            this.loadTemplate();
            this.templateLoaded = true;
        }
    }

    // Método para exibir o modal com título, mensagem e botões opcionais
    showModal(titulo, mensagem, btn1Text, btn2Text, btn1OnClick = null, btn2OnClick = null) {
        // Configurações de estilo para posicionar o modal no centro
        this.modal.style.display = 'block';
        this.modal.style.position = 'absolute';
        this.modal.style.top = `${window.scrollY + window.innerHeight / 2}px`;
        this.modal.style.left = "50%";
        this.modal.style.transform = "translate(-50%, -50%)";
        this.modal.style.zIndex = '1000';

        // Atualiza o título e a mensagem do modal
        this.modalTitle.innerHTML = titulo;
        this.modalMessage.innerHTML = mensagem;

        // Configuração do Botão 1
        if (btn1Text) {
            this.modalBtn1.innerHTML = btn1Text;
            this.modalBtn1.style.display = 'inline-block';
            this.modalBtn1.onclick = btn1OnClick ? btn1OnClick : null; // Define a ação do botão ou deixa vazio
        } else {
            this.modalBtn1.style.display = 'none'; // Oculta o botão se não for passado
        }

        // Configuração do Botão 2
        if (btn2Text) {
            this.modalBtn2.innerHTML = btn2Text;
            this.modalBtn2.style.display = 'inline-block';
            this.modalBtn2.onclick = btn2OnClick ? btn2OnClick : null; // Define a ação do botão ou deixa vazio
        } else {
            this.modalBtn2.style.display = 'none'; // Oculta o botão se não for passado
        }

        // Remove a classe de ocultação, se existir
        this.modal.classList.remove('d-none');
    }

    // Método para exibir um modal de confirmação de forma assíncrona
    showConfirmationModal(titulo, mensagem, btn1Text = 'Sim', btn2Text = 'Cancelar') {
        return new Promise((resolve, reject) => {
            // Configurações de estilo para posicionar o modal no centro
            this.modal.style.display = 'block';
            this.modal.style.position = 'absolute';
            this.modal.style.top = `${window.scrollY + window.innerHeight / 2}px`;
            this.modal.style.left = "50%";
            this.modal.style.transform = "translate(-50%, -50%)";
            this.modal.style.zIndex = '1000';

            // Atualiza o título e a mensagem do modal
            this.modalTitle.innerHTML = titulo;
            this.modalMessage.innerHTML = mensagem;

            // Configuração do Botão 1 (Sim)
            this.modalBtn1.innerHTML = btn1Text;
            this.modalBtn1.style.display = 'inline-block';
            this.modalBtn1.onclick = () => {
                resolve(true);  // Resolve a promessa com "true" se clicar no botão "Sim"
                this.closeModal();
            };

            // Configuração do Botão 2 (Cancelar)
            this.modalBtn2.innerHTML = btn2Text;
            this.modalBtn2.style.display = 'inline-block';
            this.modalBtn2.onclick = () => {
                resolve(false); // Resolve a promessa com "false" se clicar no botão "Cancelar"
                this.closeModal();
            };

            // Remove a classe de ocultação, se existir
            this.modal.classList.remove('d-none');
        });
    }

    // Método para fechar o modal
    closeModal() {
        this.modal.classList.add('d-none');
    }

}

customElements.define('br-modal-simples-component', BRModalSimples);


/* ================================ CHECKBOX ================================= */
class BRCheckboxComponent extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.render();
      this.initializeCheckbox();
    }

    render() {
      const checkboxId = this.getAttribute('checkbox-id') || 'checkbox-1';
      const labelText = this.getAttribute('label') || '';

      this.innerHTML = `
        <div class="br-checkbox">
          <input id="${checkboxId}" name="${checkboxId}" type="checkbox" aria-label="${labelText}" />
          <label for="${checkboxId}">${labelText}</label>
        </div>
      `;
    }

    initializeCheckbox() {
      const brCheckbox = this.querySelector('.br-checkbox');
      if (brCheckbox) {
        new core.BRCheckbox('br-checkbox', brCheckbox);
      }
    }
  }

customElements.define('br-checkbox-component', BRCheckboxComponent);


/* ============================ RADIO HORIZONTAL ============================= */
class BRRadioHorizontalComponente extends HTMLElement {

    static get observedAttributes() {
        return ['inputId', 'eName', 'inputClass', 'inputStyle', 'label', 'required', 'isDisabled'];
    }

    constructor() {
        super();
    }

    loadTemplate() {
        try {
            this.template = document.getElementById('tpl-br-radio-horizontal').content.cloneNode(true);
            this.appendChild(this.template);

            this.updateAttributes();
            this.addEventListeners();
        } catch (error) {
            console.error('Erro ao carregar o template (br-radio-horizontal):', error);
        }
    }

    connectedCallback() {
        if (!this.templateLoaded) {
            this.loadTemplate();
            this.templateLoaded = true;
        } else {
            this.updateAttributes();
            this.addEventListeners();
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name !== null) {
            if (['inputId', 'eName', 'inputClass', 'inputStyle', 'label', 'required', 'isDisabled'].includes(name)) {
                this.updateAttributes();
            }
            this.addEventListeners();
        }
    }

    updateAttributes() {
        this.updateId();
        this.updateName();
        this.updateClass();
        this.updateStyle();
        this.updateLabel();
        this.updateRequired();
        this.updateDisabled();
    }

    updateId() {
        const id = this.getAttribute('inputId') || '';
        const inputElement = this.querySelector('input');
        const labelElement = this.querySelector('label');

        if (inputElement && labelElement) {
            inputElement.id = id;
            labelElement.setAttribute('for', id);
        }
    }

    updateName(){
        const name = this.getAttribute('eName') || '';
        const inputElement = this.querySelector('input');

        if (inputElement) {
            inputElement.name = name;
        }
    }

    updateClass() {
        const classes = this.getAttribute('inputClass') || '';
        const inputElement = this.querySelector('input');

        if (inputElement) {
            inputElement.setAttribute('class', classes);
        }
    }

    updateStyle() {
        const style = this.getAttribute('inputStyle') || '';
        const inputElement = this.querySelector('input');

        if (inputElement) {
            inputElement.setAttribute('style', style);
        }
    }

    updateLabel() {
        const label = this.getAttribute('label') || '';
        const labelElement = this.querySelector('label');

        if (labelElement) {
            labelElement.innerHTML = label;
        }
    }

    updateRequired() {
        const inputElement = this.querySelector('input');

        if (inputElement) {
            if (this.hasAttribute('required')) {
                inputElement.setAttribute('required', '');
            } else {
                inputElement.removeAttribute('required');
            }
        }
    }

    updateDisabled() {
        const inputElement = this.querySelector('input');
        if (inputElement) {
            if (this.hasAttribute('isDisabled')) {
                inputElement.setAttribute('disabled', '');
            } else {
                inputElement.removeAttribute('disabled');
            }
        }

    }

    addEventListeners() {
        const inputElement = this.querySelector('input');

        if (inputElement) {
            const attributes = this.getAttributeNames();
            attributes.forEach(attr => {
                if (attr.startsWith('on')) {
                    const eventName = attr.substring(2);
                    const eventHandlers = this.getAttribute(attr).split(',');

                    eventHandlers.forEach(eventHandlerName => {
                        eventHandlerName = eventHandlerName.trim();
                        if (typeof window[eventHandlerName] === 'function') {
                            inputElement.addEventListener(eventName, () => {
                                window[eventHandlerName](inputElement);
                            });
                        }
                    });
                }
            });
        }
    }
}

customElements.define('br-radio-horizontal-component', BRRadioHorizontalComponente);
