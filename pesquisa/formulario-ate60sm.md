# Formulário oficial "Discriminativo de Débitos – Transação Tributária Pequeno Valor" (Edital RFB 10/2026)

- **URL:** https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/formularios/impostos/transacao/transacao-2026/ate60sm.html
- **Fontes analisados:** `fontes-oficiais/formularios-2026/ate60sm.html`, `assets/js/negocio-60.js`, `assets/js/utils.js`.
  - Em 10/11/2026, os três arquivos publicados foram baixados e comparados com as cópias locais: são **idênticos byte a byte** (SHA-256 `684783ea…`, `f12bdd5a…`, `cfe50473…`).
  - O `govbr/core-min.js`, do Design System gov.br, não tem cópia local. Foi lido só para entender o componente de lista (`BRSelect`).
- **Método:** leitura do código e 5 sessões gravadas com o gravador do projeto (`testes/gravar-sessao.js`).
  - As sessões rodaram no Chrome real, contra o site **ao vivo**, clicando e digitando tecla a tecla.
  - Também houve uma varredura numérica em Node que replica as expressões do formulário e do motor, centavo a centavo, de R$ 10,00 a R$ 120.000,00 (11.999.001 valores por opção).
  - Por fim, os números do formulário foram comparados com `simulador-basico/motor-calculo.js` (`simular`, modo `POR_DEBITO`).

---

## 0. Resumo

1. **A conta central é a mesma do simulador** (FORMULAS.md §3). O desconto de 50/40/35/30% incide sobre o **total** de todos os processos (principal + multa + juros). O saldo é parcelado em até 12/24/36/55 vezes, com parcela mínima de R$ 200, sem entrada. Em 32 leituras comparadas, 23 bateram exatamente com o motor. Das 9 que divergem, 4 são por regra (`n_máx`) e 5 por 1 centavo.
2. **Diferenças de regra:**
   - **(a) Saldo abaixo de R$ 200.** Com saldo < R$ 200, o formulário calcula **0 parcelas** e **quebra** com um TypeError. O motor usa `máx(1, …)` e devolve 1 parcela abaixo do mínimo.
   - **(b) Débito acima de 60 SM.** O formulário **recusa a digitação** de um processo acima de R$ 97.260,00. O motor o **descarta em silêncio** e soma os demais.
   - **(c) Piso de DARF.** O formulário exige que **cada processo** valha pelo menos **R$ 10,00** (piso do DARF). O motor não tem esse piso.
   - **(d) Número de parcelas padrão.** O formulário começa sempre em **1 parcela**. O motor e o simulador começam no **máximo**.
3. **Diferenças de arredondamento (1 centavo):**
   - **(a) Saldo.** O formulário calcula `S = T − T·d`; o motor calcula `S = T·(1 − r/100)`. O resultado exibido difere nas opções III e IV.
   - **(b) Parcela.** O formulário divide o **saldo já arredondado e exibido** pelo número de parcelas; o motor divide o saldo não arredondado. Na amostra aleatória, ~3,3% dos casos diferem em 1 centavo.
4. **Bugs reproduzidos ao vivo:**
   - **PDF com parcela abaixo do mínimo.** O formulário gera o PDF "discriminativo" com parcela abaixo de R$ 200 e **sem nº de parcelas** (T = R$ 300, opções I a III).
   - **Débito de exatamente 60 SM recusado.** Um processo de **exatamente R$ 97.260,00** é recusado ou aceito conforme a divisão entre principal, multa e juros (erro de ponto flutuante). O motor tem o mesmo defeito.
   - **Total geral desatualizado** depois de uma recusa.
   - **Seções antigas visíveis.** Elas continuam na tela ao excluir o único débito; nesse estado, "Gerar Documento" falha em silêncio.
   - **Validação do nº do processo desligada.** O nº do processo é texto livre, e cada alteração gera um ReferenceError.
5. **Rede:** **nenhuma requisição que não seja GET, nenhum XHR/fetch.** O PDF é montado inteiramente no navegador (html2canvas + jsPDF). Depois do carregamento, só há GETs de folhas de estilo, fontes e imagens estáticas.

---

## 1. Evidências produzidas

| Sessão (em `testes/saida/sessoes/`) | O que cobre | PDF |
|---|---|---|
| `ate60sm-c0-exploracao.{json,md}` | Exploração inicial: modal, máscara de valores, lista de parcelas | — |
| `ate60sm-c1-tres-debitos-opcoes.{json,md}` + `-tela-final.png` | 3 débitos (T = 53.130,41); opções I→II→III→IV com 2 escolhas de parcelas cada; volta para a I; PDF | `ate60sm-c1-…-DISCRIMINATIVOTRANSACAOATE60SALARIOS.pdf` (4 págs.) |
| `ate60sm-c2-limite-60sm.{json,md}` + `-estado-desatualizado.png` | Débito de 97.260,01 (recusado); 97.260,00 aceito; 97.260,00 recusado por ponto flutuante; débito de 110.000 (recusado e excluído); estado desatualizado; PDF | `ate60sm-c2-…pdf` (4 págs.) |
| `ate60sm-c3-parcela-minima.{json,md}` + `-t300-opcao36-erro.png` | Piso de R$ 10 (DARF); T = 300 (opções I a III quebram; PDF gerado assim mesmo); T = 1.000; bordas T = 400,00 e 399,99 | `ate60sm-c3-…pdf` (4 págs., **estado de erro**) |
| `ate60sm-c4-doze-debitos-pdf.{json,md}` + `-tela-final.png` | 12 débitos (T = 250.009,75 > 60 SM no total); divergências de centavo; paginação do PDF | `ate60sm-c4-…pdf` (5 págs.) |
| `ate60sm-c5-validacoes-fluxo.{json,md}` | Mensagens de validação, máscara, letras e "-", nº de processo livre, reinícios de fluxo, exclusão do único débito, Ctrl+P | — (geração falha) |

- Cada `.json` traz a linha do tempo completa (rede, eventos, cada chamada de função com argumentos e retorno) mais as leituras de tela (`observacoes`). Cada `.md` traz o resumo legível.
- Os scripts e a análise numérica ficaram em `analise-ate60sm/` (pasta temporária da análise, fora do repositório):
  - `lib-ui.js` e `c1.js` … `c5.js`;
  - `bordas.js`, `bordas2.js` e `achar-t.js`;
  - `comparar-motor.js`, cujo resultado está em `resultados/comparacao-motor.json`.

**Dados fictícios:**
- O formulário **não tem campo de CPF, CNPJ ou nome**. A lista de campos da página contém só `op-1` e os 4 rádios de opção, mais os inputs da tabela de débitos. Por isso não havia onde usar CPF/CNPJ.
- Os números de processo são inventados, por exemplo `12345678901202637`, com DV válido pelo algoritmo de `validarProcesso`. O cenário 4 usa números com DV inválido e o cenário 5 usa o texto `processo qualquer`: ambos foram aceitos.

---

## 2. Fluxo do formulário

Seções `.secao`, em ordem (o `reiniciarFormulario` usa essa ordem):

| # | Seção (id) | Classe de página no PDF | Visível quando |
|---|---|---|---|
| 1 | `id-identificacao-do-contribuinte` | `pagina1` (com o cabeçalho) | sempre |
| 2 | `id-detalhamento-creditos-tributarios` | `pagina2` | depois de marcar o contribuinte |
| 3 | `id-detalhamento-entrada` | `pagina3` | **nunca** (código morto, §8.11) |
| 4 | `id-modalidade-transacao` | `pagina4` | depois de "Confirmar total de débitos" passar nas validações |
| 5 | `id-detalhamento-restante` | `pagina5` | depois de escolher uma opção |
| — | `id-btn-gerar-documento` (não é `.secao`) | — | junto com a seção 5 |

**Passo a passo:**

1. **Identificação.** Há um único rádio, `op-1` (`ate60sm.html:346`), com a declaração: "Certifico que o requerente se classifica como pessoa natural, MEI, empresário individual, ME ou EPP […] até sessenta salários-mínimos (R$ 97.260,00) a cada processo listado".
   - O `onclick` chama `reiniciarFormulario(this)` e depois `identificacaoContribuinte(this)` (`negocio-60.js:95-119`).
   - Como `data-contribuinte="contribuinte"`, cai no ramo das linhas 114-117: `valorMinimo = 200` e o modal "Atenção: O valor mínimo da parcela é de R$200,00".
   - O rádio `op-2` (MEI/EI/ME/EPP) está **comentado** (`ate60sm.html:351-354`). Os ramos `pessoa-natural` e `mei-ei-me-epp` (`negocio-60.js:105-113`) são inalcançáveis, e todos usariam o mesmo `valorMinimo = 200`.
   - `definirCondicaoContribuinte` (`:122-133`: falido, baixado, grupo econômico) não tem nenhum chamador.
   - Reclicar o rádio limpa a tabela de débitos (`:179-189`), o que foi confirmado no cenário 5.
2. **Débitos.** "Incluir novo débito" chama `incluirNovoDebito()` (`:141-157`), que clona o template das linhas 148-192 e insere a linha "Total R$" na primeira vez; depois chama `reiniciarFormulario(this)`, que esconde as seções 3 a 5.
   - Campos de cada linha: Nº Processo/Notificação (`onchange="handleValidarProcesso(this)"`, função inexistente; ver §8.5), Principal, Multa e Juros (`oninput` aplica a máscara; `onchange` recalcula), Total (somente leitura) e o botão de lixeira (`excluirLinha`, `:161-169`).
3. **Confirmar total de débitos:** `confirmarTotalDebitos` (`:270-297`), com as validações do §4.
4. **Modalidade.** São 4 rádios (`ate60sm.html:455-471`), com `data-transacao` = 12/24/36/55 e `data-desconto` = "0,5"/"0,4"/"0,35"/"0,3".
   - O `onclick` chama `reiniciarFormulario(this)` e depois `popularTabelaRestante(this)` (`negocio-60.js:390-443`).
5. **Detalhamento do valor a parcelar.** É uma linha com:
   - Total, Critério ("até N meses, redução X%"), Desconto (R$) e Saldo Devedor;
   - a lista "Nº parcelas" (`BRSelect`, de 1 até o máximo; começa em **1**);
   - a parcela e o "Código do Darf" fixo **6359** (`ate60sm.html:269`).
   - Trocar a parcela dispara `calcularValorParcelasRestante` (`:472-478`). O `change` nativo do rádio interno sobe até o `div.br-select`, que tem o `onchange` inline (`:415`). Na gravação, a classe `.selected` já está atualizada quando o handler roda, então o valor exibido corresponde ao item clicado.
6. **Gerar Documento:** `gerarDocumento()` (`utils.js:533-708`), descrito no §5.

**O que zera o fluxo** (`reiniciarFormulario`, `:172-212`): esconde e limpa todas as seções **depois** da seção do elemento que disparou.
- **Dispara:** incluir débito; mudar um valor que resulte num total válido, via `recalcularTotalGeral`, linha 266; escolher outra opção, que reinicia a seção 5 e volta a lista para 1 parcela; reclicar o contribuinte.
- **Não dispara:** recusa de valor acima de 60 SM e exclusão do único débito (bugs §8.3 e §8.4).

---

## 3. Fórmulas, exatamente como no código

**Notação:**

| Símbolo | Significado |
|---|---|
| `fmt(x)` | `converterNumeroEmMoeda` (`utils.js:1248-1256`) = `x.toLocaleString('pt-BR', {min/max 2 casas})`: arredonda o *double* com meio-centavo para cima (halfExpand) e põe separador de milhar |
| `num(s)` | `converterStringEmNumero` (`utils.js:1212-1228`) = remove tudo que não é dígito nem vírgula, troca a vírgula por ponto e aplica `parseFloat`; se der NaN, **lança** `Error('Valor inválido para conversão.')` |
| `⌊ ⌋` | arredondar para baixo (`Math.floor`) |

### 3.1 Máscara de valores (Principal, Multa, Juros)

`validarValorNaoNegativo` (`utils.js:237-248`), chamada a cada tecla por `handleValidarValorNaoNegativo` (`negocio-60.js:227-233`):

```
dígitos = valor.replace(/\D/g,'')
se dígitos ≠ '' :  campo = fmt( parseFloat(dígitos) / 100 )     ("centavos inteiros ÷ 100")
senão           :  modal "Valor inválido! Valor deve ser numérico e maior ou igual a zero."
```

- **Digitar "2000" dá 20,00.** Para obter R$ 2.000,00 é preciso digitar "2000,00" ou "200000". Visto no cenário 5.
- **Sinais e letras.** O sinal "-" e as letras são descartados quando há dígitos. Se o **primeiro** caractere não for dígito, o modal abre, rouba o foco e o caractere **fica no campo** (bug §8.6).

### 3.2 Total por processo e limite de 60 SM

`calcularValorTotalProcesso` (`negocio-60.js:236-253`), no `change`:

```
Tᵢ = num(Pᵢ) + num(Mᵢ) + num(Jᵢ)          (campo vazio conta 0)
se Tᵢ > 97.260   (limiteValor, :47 — comparação estrita, em ponto flutuante)
     totalᵢ = ''  e modal "Esta modalidade não se aplica a valores acima de 60 salários mínimos (R$ 97.260,00) por processo administrativo."
     (NÃO recalcula o total geral — bug §8.3)
senão
     totalᵢ = fmt(Tᵢ) ;  recalcularTotalGeral()
```

### 3.3 Total geral

`recalcularTotalGeral` (`:257-267`):

```
T = Σ num(totalᵢ)        (totais vazios contam 0)
totalGeral = fmt(T) ;  reiniciarFormulario(#totalGeral)
```

- **Não há limite para o total.** O limite de 60 SM é **por processo**. O cenário 4 aceitou T = 250.009,75, e o cenário 2 aceitou 200.519,99.

### 3.4 Validações de "Confirmar total de débitos"

As validações estão em `:270-297`; ver também o §4.

```
se não há linhas                         → "Insira pelo menos um débito para prosseguir."
se algum .br-input.obrigatorio vazio     → "Exclua linhas vazias e preencha todos os campos antes de prosseguir!"
para cada processo: se num(totalᵢ) < 10  → "Esta transação não é possível, pois o valor total dos débitos deve ser, no mínimo, de R$ 10,00 (DARF)."
```

- O piso usa `valorMinimoDarf = 10` (`:35`) e vale **por processo**, apesar de a mensagem falar em "valor total".

### 3.5 Desconto e saldo

`popularTabelaRestante` (`:390-443`):

```
T  = num(totalGeral)                                   (:401)  → total já arredondado a centavos
d  = num(data-desconto) ∈ {0,5 ; 0,4 ; 0,35 ; 0,3}      (:393, :402; HTML :455-471)
S  = T − (T × d)                                        (:402)
Desconto exibido = fmt(T × d)                           (:413)
Saldo exibido    = fmt(S)                               (:414)
Critério exibido = "até {meses} meses, redução {d×100}%" (:412)   → 50 / 40 / 35 / 30 (sem resíduo de ponto flutuante)
```

- O desconto vale "inclusive do montante principal" (rótulos do HTML), igual ao texto oficial ("valor total da dívida, incluídos principal, juros, multas e encargos").

### 3.6 Número máximo de parcelas

`calcularMaximoParcelasRestante` (`:447-468`):

```
n₀ = mín(meses, ⌊T ÷ 200⌋)               (:456)  ← usa T (antes do desconto)
se S ÷ n₀ < 200 :  n = ⌊S ÷ 200⌋         (:462-464)
senão           :  n = n₀
```

**Forma equivalente**, demonstrável e confirmada pela varredura de 4 × 11.999.001 valores, sem nenhuma exceção:

```
n_máx = mín(meses, ⌊S ÷ 200⌋)          — e vale 0 quando S < 200 (sem piso de 1)
```

Valores de T que dão `n_máx = 0`, com o erro descrito no §8.1:

| Opção | Faixa de T |
|---|---|
| I | 10,00 a 399,99 |
| II | 10,00 a 333,33 |
| III | 10,00 a 307,69 |
| IV | 10,00 a 285,71 |

A lista "Nº parcelas" é montada de 1 a `n_máx` (`:420-432`), e o item **1** vem marcado (`:436-438`).

### 3.7 Valor da parcela

```
ao escolher a opção (n = 1 selecionado):   parcela exibida = fmt(S)                        (:416, com parcelaAposDesconto = S, :461)
ao trocar o nº de parcelas para n:         parcela exibida = fmt( num( fmt(S) ) ÷ n )       (:472-478)
```

- A parcela vem do saldo **já arredondado e exibido** (é lido do HTML, linha 475), ou seja, há arredondamento duplo.
- Não existe ajuste de resíduo: a soma das parcelas pode diferir de S em centavos.
- Não há correção pela Selic. O texto em vermelho (`ate60sm.html:509-510`) só a informa.

### 3.8 Entrada (código morto)

`popularTabelaEntrada` / `calcularMaximoParcelasEntrada` / `calcularValorParcelasEntrada` (`:302-377`) e `prosseguir` (`:382-384`):

```
E = 5% × T ;  n_e = mín(5, ⌊E ÷ 200⌋) ;  parcela_e = E ÷ n_e        — NUNCA é chamado
```

- Nenhum elemento dispara essas funções. A seção 3 fica sempre oculta, e o botão "Prosseguir" está dentro dela.
- Nas gravações, nenhuma dessas funções aparece na contagem de chamadas.
- A modalidade é, de fato, **sem entrada**.

---

## 4. Validações e mensagens (todas vistas na gravação, salvo indicação)

| Gatilho | Código | Mensagem / efeito | Cenário |
|---|---|---|---|
| Marcar o contribuinte | `negocio-60.js:117` | "Atenção: O valor mínimo da parcela é de R$200,00" | todos |
| Tecla não numérica ou campo apagado | `:231` | "Valor inválido! Valor deve ser numérico e maior ou igual a zero." | c5 |
| Processo com Tᵢ > 97.260 | `:247` | "Esta modalidade não se aplica a valores acima de **60 salários mínimos** (R$ 97.260,00) por processo administrativo." O total da linha fica vazio | c2 |
| Confirmar sem linhas | `:273` | "Insira pelo menos um débito para prosseguir." | c5 |
| Confirmar com campo vazio (inclusive o total recusado) | `:295` | "Exclua linhas vazias e preencha todos os campos antes de prosseguir!" | c2, c5 |
| Processo com Tᵢ < 10 | `:284` | "Esta transação não é possível, pois o **valor total dos débitos** deve ser, no mínimo, de **R$ 10,00** (DARF)." | c3 (9,99) |
| Gerar documento com campo obrigatório vazio | `utils.js:728` | "Por favor preencha todos os campos obrigatórios" | c2 |
| Gerar documento com a tabela de débitos vazia | `utils.js:719-721` | **Nenhuma mensagem**: TypeError `Cannot read properties of null (reading 'replace')` | c5 |
| Ctrl+P | `ate60sm.html:594-606` | "Use o botão Gerar Documento na própria página. O documento impresso ou salvo por outros meios não tem validade." Também gera 2 ReferenceErrors (`modalComponente`) | c5 |
| Impressão pelo navegador | `ate60sm.html:122-139` | O CSS de impressão esconde tudo e mostra "Impressão desabilitada…" | (não testado) |
| PDF gerado | `utils.js:697-703` | "Discriminativo gerado com SUCESSO… NÃO altere o conteúdo do documento gerado, pois pode ocasionar RECUSA automática do pedido. Anexe o documento ao requerimento…" | c1–c4 |

**Validações que *não* existem:**
- nº de processo (o validador está desativado);
- tipo de contribuinte (é só a declaração);
- limite do **total**;
- saldo < R$ 200 (quebra em vez de avisar);
- teto de nenhum tipo além dos 60 SM por processo.

---

## 5. Geração do PDF ("Gerar Documento")

Implementação em `utils.js:533-708`:

- **Formato:** `jsPDF({orientation:'landscape', unit:'px', format:[1920,1080]})`.
- **Páginas:** cada classe `paginaN` visível vira uma página.
  - Normalmente são 4: pagina1 (cabeçalho e identificação), pagina2 (débitos), pagina4 (modalidade) e pagina5 (detalhamento).
  - A tabela de débitos é paginada de **10 em 10 linhas** (`linhasPorPagina: 10`), e a linha "Total R$" só aparece na última página dela. Com 12 débitos, o PDF teve **5 páginas**, e a página 3 mostra as linhas 11 e 12 mais o total 250.009,75 (imagem conferida).
  - Cada página é uma **imagem JPEG** gerada por `html2canvas` em escala 2, então o PDF não tem texto selecionável. O arquivo fica com cerca de 2 MB.
- **Nome do arquivo:** `DISCRIMINATIVOTRANSACAOATE60SALARIOS.pdf` (`negocio-60.js:9`).
- **Metadado `Keywords`:** contém o **JSON** de `gerarJSON` (`utils.js:887-940`). É o único conteúdo "legível por máquina" do PDF. Extraído do PDF do cenário 1:
  ```json
  {"versao":"1.0","data-de-criacao":"10/11/2026","identificacao_documento":"SUARA_CORAT_TRANSACAO_60SALARIOS_2026",
   "identificacao-do-contribuinte":{"contribuinte":"Certifico que o requerente se classifica como pessoa natural, … (HTML do rótulo)"},
   "tabela_detalhamento-creditos-tributarios":[{"nprocesso":"12345678901202637","valor_principal":"10.000,00","multa":"2.000,00","juros":"1.500,00","valor_total_processo":"13.500,00"}, …, {"total_geral":"53.130,41"}],
   "tabela_detalhamento-entrada":[],
   "modalidade-transacao":{"transacao-selecionada":"6.1 - IV - em até 55 (cinquenta e cinco) meses, com redução de 30% …"},
   "tabela_detalhamento-restante":[{"saldo_devedor_apos_entrada":"53.130,41","criterio_transacao":"até 55 meses, redução 30%","desconto":"15.939,12","saldo_apos_desconto":"37.191,29","valor_parcela_apos_desconto":"676,21","n_parcelas_restante":"55 parcelas"}]}
  ```
  - O "Total" sai com a chave `saldo_devedor_apos_entrada`, nome herdado de um formulário com entrada.
  - **Não há identificação do contribuinte**: nem CPF/CNPJ, nem nome.
- **Validações antes de gerar** (`prepararPdf`, `utils.js:714-742`): exigem só tabela `.obrigatorio` com linhas e campos `.obrigatorio` preenchidos. Não conferem se há nº de parcelas escolhido nem se a parcela é ≥ 200 (bug §8.1).

---

## 6. Cenários: formulário × motor

O motor foi chamado assim:

```js
simular({ tipoContribuinte: 'PN', modo: 'POR_DEBITO', debitos, escolhas: { RFB_PEQUENO_VALOR: { opcao, parcelas } } })
```

- `opcao` vale 0/1/2/3 para I/II/III/IV.
- `parcelas` é o mesmo nº escolhido na tela; nas linhas "padrão", foi passado 1, que é o padrão do formulário.
- Os tipos `PN_OBITO`, `MEI` e `ME_EPP` dão resultados idênticos ao `PN` (conferido no C1). `DEMAIS_PJ` é **inelegível** no motor; no formulário não existe essa checagem, só a declaração.

Cada célula mostra **formulário / motor**. Fonte: `resultados/comparacao-motor.json`.

| Cen. | Passo na tela | Total | Desconto | Saldo | n máx | n | Parcela | Diferença |
|---|---|---|---|---|---|---|---|---|
| C1 | opção I — padrão | 53.130,41 / 53.130,41 | 26.565,21 / 26.565,21 | 26.565,21 / 26.565,21 | 12 / 12 | 1 / 1 | 26.565,21 / 26.565,21 | igual |
| C1 | opção I — 12 parcelas | 53.130,41 / 53.130,41 | 26.565,21 / 26.565,21 | 26.565,21 / 26.565,21 | 12 / 12 | 12 / 12 | 2.213,77 / 2.213,77 | igual |
| C1 | opção I — 5 parcelas | 53.130,41 / 53.130,41 | 26.565,21 / 26.565,21 | 26.565,21 / 26.565,21 | 12 / 12 | 5 / 5 | 5.313,04 / 5.313,04 | igual |
| C1 | opção II — padrão | 53.130,41 / 53.130,41 | 21.252,16 / 21.252,16 | 31.878,25 / 31.878,25 | 24 / 24 | 1 / 1 | 31.878,25 / 31.878,25 | igual |
| C1 | opção II — 24 parcelas | 53.130,41 / 53.130,41 | 21.252,16 / 21.252,16 | 31.878,25 / 31.878,25 | 24 / 24 | 24 / 24 | 1.328,26 / 1.328,26 | igual |
| C1 | opção II — 10 parcelas | 53.130,41 / 53.130,41 | 21.252,16 / 21.252,16 | 31.878,25 / 31.878,25 | 24 / 24 | 10 / 10 | **3.187,83 / 3.187,82** | **parcela** (A) |
| C1 | opção III — padrão | 53.130,41 / 53.130,41 | 18.595,64 / 18.595,64 | 34.534,77 / 34.534,77 | 36 / 36 | 1 / 1 | 34.534,77 / 34.534,77 | igual |
| C1 | opção III — 36 parcelas | 53.130,41 / 53.130,41 | 18.595,64 / 18.595,64 | 34.534,77 / 34.534,77 | 36 / 36 | 36 / 36 | 959,30 / 959,30 | igual |
| C1 | opção III — 18 parcelas | 53.130,41 / 53.130,41 | 18.595,64 / 18.595,64 | 34.534,77 / 34.534,77 | 36 / 36 | 18 / 18 | 1.918,60 / 1.918,60 | igual |
| C1 | opção IV — padrão | 53.130,41 / 53.130,41 | 15.939,12 / 15.939,12 | 37.191,29 / 37.191,29 | 55 / 55 | 1 / 1 | 37.191,29 / 37.191,29 | igual |
| C1 | opção IV — 30 parcelas | 53.130,41 / 53.130,41 | 15.939,12 / 15.939,12 | 37.191,29 / 37.191,29 | 55 / 55 | 30 / 30 | 1.239,71 / 1.239,71 | igual |
| C1 | opção IV — 55 parcelas | 53.130,41 / 53.130,41 | 15.939,12 / 15.939,12 | 37.191,29 / 37.191,29 | 55 / 55 | 55 / 55 | 676,21 / 676,21 | igual |
| C2 | opção IV — 55 parcelas | 200.519,99 / 200.519,99 | 60.156,00 / 60.156,00 | 140.363,99 / 140.363,99 | 55 / 55 | 55 / 55 | 2.552,07 / 2.552,07 | igual |
| C2 | opção I — 12 parcelas | 200.519,99 / 200.519,99 | 100.260,00 / 100.260,00 | 100.260,00 / 100.260,00 | 12 / 12 | 12 / 12 | 8.355,00 / 8.355,00 | igual |
| C3 | T=300, opção I | 300,00 / 300,00 | 150,00 / 150,00 | 150,00 / 150,00 | **0 / 1** | **— / 1** | 150,00 / 150,00 | **n** (B) |
| C3 | T=300, opção II | 300,00 / 300,00 | 120,00 / 120,00 | 180,00 / 180,00 | **0 / 1** | **— / 1** | 180,00 / 180,00 | **n** (B) |
| C3 | T=300, opção III | 300,00 / 300,00 | 105,00 / 105,00 | 195,00 / 195,00 | **0 / 1** | **— / 1** | 195,00 / 195,00 | **n** (B) |
| C3 | T=300, opção IV | 300,00 / 300,00 | 90,00 / 90,00 | 210,00 / 210,00 | 1 / 1 | 1 / 1 | 210,00 / 210,00 | igual |
| C3 | T=1.000, opção I — 2 parcelas | 1.000,00 / 1.000,00 | 500,00 / 500,00 | 500,00 / 500,00 | 2 / 2 | 2 / 2 | 250,00 / 250,00 | igual |
| C3 | T=1.000, opção II — 3 parcelas | 1.000,00 / 1.000,00 | 400,00 / 400,00 | 600,00 / 600,00 | 3 / 3 | 3 / 3 | 200,00 / 200,00 | igual |
| C3 | T=1.000, opção III — 3 parcelas | 1.000,00 / 1.000,00 | 350,00 / 350,00 | 650,00 / 650,00 | 3 / 3 | 3 / 3 | 216,67 / 216,67 | igual |
| C3 | T=1.000, opção IV — 3 parcelas | 1.000,00 / 1.000,00 | 300,00 / 300,00 | 700,00 / 700,00 | 3 / 3 | 3 / 3 | 233,33 / 233,33 | igual |
| C3 | T=400,00, opção I | 400,00 / 400,00 | 200,00 / 200,00 | 200,00 / 200,00 | 1 / 1 | 1 / 1 | 200,00 / 200,00 | igual |
| C3 | T=399,99, opção I | 399,99 / 399,99 | 200,00 / 200,00 | 200,00 / 200,00 | **0 / 1** | **— / 1** | 200,00 / 200,00 | **n** (B) |
| C3 | T=399,99, opção IV | 399,99 / 399,99 | 120,00 / 120,00 | 279,99 / 279,99 | 1 / 1 | 1 / 1 | 279,99 / 279,99 | igual |
| C4 | opção III — padrão | 250.009,75 / 250.009,75 | 87.503,41 / 87.503,41 | 162.506,34 / 162.506,34 | 36 / 36 | 1 / 1 | 162.506,34 / 162.506,34 | igual |
| C4 | opção III — 36 parcelas | 250.009,75 / 250.009,75 | 87.503,41 / 87.503,41 | 162.506,34 / 162.506,34 | 36 / 36 | 36 / 36 | **4.514,07 / 4.514,06** | **parcela** (A) |
| C4 | opção III — 20 parcelas | 250.009,75 / 250.009,75 | 87.503,41 / 87.503,41 | 162.506,34 / 162.506,34 | 36 / 36 | 20 / 20 | 8.125,32 / 8.125,32 | igual |
| C4 | opção IV — padrão | 250.009,75 / 250.009,75 | **75.002,93 / 75.002,92** | **175.006,83 / 175.006,82** | 55 / 55 | 1 / 1 | **175.006,83 / 175.006,82** | **saldo** (C) |
| C4 | opção IV — 55 parcelas | 250.009,75 / 250.009,75 | **75.002,93 / 75.002,92** | **175.006,83 / 175.006,82** | 55 / 55 | 55 / 55 | 3.181,94 / 3.181,94 | **saldo** (C) |
| C4 | opção IV — 20 parcelas | 250.009,75 / 250.009,75 | **75.002,93 / 75.002,92** | **175.006,83 / 175.006,82** | 55 / 55 | 20 / 20 | 8.750,34 / 8.750,34 | **saldo** (C) |
| C5 | opção II — 5 parcelas | 1.800,50 / 1.800,50 | 720,20 / 720,20 | 1.080,30 / 1.080,30 | 5 / 5 | 5 / 5 | 216,06 / 216,06 | igual |

**Explicação de cada diferença:**

- **(A) Arredondamento duplo da parcela.** O formulário calcula `fmt(num(fmt(S)) ÷ n)`; o motor calcula `fmt(S ÷ n)`.
  - C1, opção II, 10 parcelas: S = 31.878,246, exibido como 31.878,25. O formulário faz 31.878,25 ÷ 10 = 3.187,825 e mostra **3.187,83**. O motor faz 31.878,246 ÷ 10 = 3.187,8246 e mostra **3.187,82**. Pela aritmética exata, o correto é 3.187,82.
  - C4, opção III, 36 parcelas: S = 162.506,3375, exibido como 162.506,34. O formulário faz 162.506,34 ÷ 36 = 4.514,065 e mostra **4.514,07**. O motor faz 162.506,3375 ÷ 36 = 4.514,0649 e mostra **4.514,06**. O correto é 4.514,06.
  - Numa amostra aleatória de 400.000 combinações (T, opção, n), **13.223 (3,3%)** diferem em 1 centavo.
- **(B) Saldo abaixo de R$ 200.** O formulário calcula `n_máx = ⌊S÷200⌋ = 0`, monta uma lista vazia e lança TypeError (§8.1). O motor aplica `máx(1, …)` e devolve 1 parcela de valor abaixo do mínimo, a mesma regra do simulador (FORMULAS.md §3).
  - Em T = 399,99, opção I: S = 199,995 é **exibido como 200,00** nas duas ferramentas, mas o formulário calcula `⌊199,995/200⌋ = 0`.
- **(C) Ordem das operações no saldo.** O formulário calcula `T − T·0,3`; o motor calcula `T·(1 − 30/100)`. Com T = 250.009,75, o valor exato é 175.006,825.
  - No formulário, o *double* fica em 175006,82500000001164, que é exibido como **,83**; no motor, fica em 175006,82499999998254, exibido como **,82**.
  - O desconto exibido acompanha: o formulário mostra `fmt(T·d)`, o motor mostra `D − S`.
  - Na varredura de R$ 10,00 a R$ 120.000,00:
    - na **opção IV**, o saldo exibido diverge em **387.769** valores de centavo, e em todos eles o formulário coincide com o arredondamento exato (meio-centavo para cima);
    - na **opção III**, diverge em **15.916** valores (o formulário acerta 4.681, o motor 11.235);
    - nas opções I e II, a exibição nunca diverge.
  - Nenhuma das duas ferramentas é sempre exata. Contra o valor exato, o formulário erra 43.657 (III) e 105.981 (IV); o motor erra mais na IV.
  - O `n_máx` nunca diverge por esse motivo.

**Outras divergências fora da tabela:**

- **(D) Padrão de parcelas.** O formulário começa em **1 parcela**. Gerar o PDF sem mexer na lista registra "1 parcelas". O motor com `parcelas` vazio usa o **máximo**: no C1, opção IV, dá **55× de 676,21**, enquanto o formulário mostra 1× de 37.191,29.
- **(E) Débito acima de 60 SM.**
  - Com os débitos do C2 **como digitados originalmente** (97.260,01; 55.850,17 + 35.454,37 + 5.955,46; 110.000; 6.000), o motor descarta três em silêncio e calcula `D = 6.000,00`, ou seja, **21× de 200,00** na opção IV.
  - O formulário não calcula nada nesse estado: recusa cada processo e bloqueia o "Confirmar". O usuário precisou corrigir para 97.260,00 e 97.259,99 e excluir o de 110.000. Só então formulário e motor bateram (linhas C2 da tabela).
- **(F) Piso de R$ 10 por processo.** Um processo de 9,99 bloqueia o formulário. O motor o aceita e, sozinho, ele dá 1 parcela de 6,99 na opção IV.
- **(G) Tipo de contribuinte.** O motor barra `DEMAIS_PJ`. O formulário depende só da declaração do rádio e não tem como distinguir.
- **(H) Modo agregado do motor.** Exige total ≤ 60 SM. O formulário é sempre "por processo" e não tem limite de total.

---

## 7. Requisições de rede e eventos

Contagem por sessão, a partir da linha do tempo do gravador:

| Sessão | Requisições | Não-GET | XHR/fetch | Depois do carregamento | Hosts |
|---|---|---|---|---|---|
| c0 | 20 | 0 | 0 | 2 (fontes) | www.gov.br, cdngovbr-ds.estaleiro.serpro.gov.br, fonts.googleapis.com, cdnjs.cloudflare.com |
| c1 | 77 | 0 | 0 | 59 (1 fonte ao marcar o contribuinte, 1 fonte na opção I, **57 na geração do PDF**) | idem |
| c2 | 77 | 0 | 0 | 59 (57 no PDF) | idem |
| c3 | 77 | 0 | 0 | 59 (57 no PDF) | idem |
| c4 | 91 | 0 | 0 | 73 (71 no PDF de 5 páginas) | idem |
| c5 | 20 | 0 | 0 | 2 | idem |

**Como interpretar:**
- As requisições durante "Gerar Documento" são **GETs de recursos estáticos**: `rawline*.woff2`, `fa-*.woff2`, `core-min.css`, `all.min.css`, `rawline.css`, a CSS do Google Fonts e os 3 logotipos PNG.
- O `html2canvas` clona o documento a cada página e recarrega folhas de estilo, fontes e imagens. São cerca de 14 GETs por página.
- Nenhuma URL carrega dados do formulário, e não houve `falhaRede`.
- **Conclusão:** nenhum valor digitado sai do navegador; o cálculo e o PDF são 100% locais.

**Erros de JavaScript capturados** (`pageerror`):

| Erro | Quando | Origem |
|---|---|---|
| `handleValidarProcesso is not defined` | a cada `change` do nº de processo (todos os cenários) | `ate60sm.html:153` chama uma função comentada em `negocio-60.js:214-223` |
| `Cannot read properties of null (reading 'closest')` | opções com `n_máx = 0` (c3: T=300 nas opções I, II e III; T=399,99 na opção I) | `negocio-60.js:436` |
| `Valor inválido para conversão.` (4×) | `change` de campo com "a" ou "-" (c5) | `utils.js:1224`, chamado por `negocio-60.js:241-243` |
| `Cannot read properties of null (reading 'replace')` | "Gerar Documento" com a tabela de débitos vazia (c5) | `utils.js:720-721`: a tabela não tem atributo `name`, e `formatarTexto(null)` falha |
| `modalComponente is not defined` (2×) | Ctrl+P (c5) | `utils.js:1196`; o handler é registrado 2 vezes, em `utils.js:1484-1488` e `negocio-60.js:70-72` |

**Cadeia de chamadas típica,** gravada no c3 ao escolher a opção I com T = 300 (argumentos → retorno):

```
popularTabelaRestante(<input#transacao-opcoes-12>)
  calcularMaximoParcelasRestante(300, "12", 150)  → [0, 150]
  ✖ erroFuncao popularTabelaRestante: Cannot read properties of null (reading 'closest')
```

---

## 8. Divergências, bugs e comportamentos estranhos

1. **Parcela abaixo do mínimo, sem nº de parcelas, com PDF gerado** (grave). Reproduzido no c3.
   - **Quando ocorre:** sempre que `S < 200`, ou seja, T ≤ 399,99 (I), ≤ 333,33 (II), ≤ 307,69 (III) ou ≤ 285,71 (IV).
   - **O que acontece:** `n_máx = 0`. A linha da tabela já foi inserida com saldo e parcela = S (< 200), mas a lista de parcelas fica **vazia** ("Selecione o item") e não aparece nenhum aviso; o código lança TypeError em `:436`.
   - **"Gerar Documento" funciona assim mesmo.** O PDF do c3 mostra "Total 300,00 · até 36 meses, redução 35% · Desconto 105,00 · Saldo 195,00 · Nº parcelas: *Selecione o item* · Parcela 195,00". O JSON não tem `n_parcelas_restante`.
   - Em T = 399,99 (opção I), a tela mostra "200,00" de saldo e de parcela, embora o valor real seja 199,995.
2. **Débito de exatamente R$ 97.260,00 recusado conforme a divisão** (formulário **e** motor).
   - A soma em *double* `P + M + J` pode dar 97.260,00000000001, maior que 97.260.
   - Ao vivo, 55.850,17 + 35.454,37 + 5.955,46 foi recusado ("acima de 60 salários mínimos"), enquanto 80.000,00 + 16.000,00 + 1.260,00 foi aceito.
   - Em 2.000.000 de divisões aleatórias de 97.260,00, **115.040 (5,75%)** são recusadas. O motor (`total = principal + multa + juros`, comparado com `<= LIMITE`) tem o mesmo comportamento: exclui o débito no modo por débito e torna a modalidade inelegível no modo agregado (conferido).
3. **Total geral desatualizado depois de uma recusa** (`:245-248` não chama `recalcularTotalGeral`).
   - O total geral continua mostrando a soma anterior: 96.000,00, depois 188.564,54, depois 284.519,99 no c2.
   - Se a opção já estava escolhida, as seções 4 e 5 e o botão continuam visíveis com valores antigos (screenshot `ate60sm-c2-limite-60sm-estado-desatualizado.png`: débito 3 sem total, mas "Total 200.519,99 · 12× de 8.355,00").
   - O PDF é barrado ("Por favor preencha todos os campos obrigatórios"), mas a tela engana.
4. **Excluir o único débito não reinicia o fluxo** (`:163-164` só esvazia o `tbody`).
   - Modalidade, detalhamento e botão continuam visíveis com os valores do débito excluído.
   - "Gerar Documento" lança TypeError e **não mostra nenhuma mensagem**. O "Aguarde" some, e o usuário fica sem saber o motivo.
5. **Nº do processo sem validação.** `handleValidarProcesso` está comentado (`:214-223`), mas o `onchange` do campo continua chamando a função: há um ReferenceError a cada alteração.
   - O campo aceita qualquer texto ("processo qualquer"), sem máscara e sem DV, apesar de `validarProcesso` (15 ou 17 dígitos com DV, `utils.js:77-146`) existir.
   - Não há verificação de processo repetido.
6. **Máscara de valores.**
   - Digitar "2000" gera **20,00**, porque a máscara trata os dígitos como centavos.
   - Se o primeiro caractere digitado não for dígito, o modal abre e rouba o foco, e o caractere ("a", "-") **permanece** no campo.
   - Ao sair do campo, `converterStringEmNumero` lança uma exceção não tratada e o total da linha não é calculado. O "Confirmar" acaba barrando pela regra de campo vazio.
7. **Ctrl+P.** O modal do HTML funciona, mas `desabilitarAtalhosImpressao` usa `modalComponente`, que não existe, e gera 2 ReferenceErrors.
8. **Mensagem do piso de DARF imprecisa.** Diz "valor total dos débitos", mas a regra vale **por processo** (`:281-287`). Um total de 309,99 foi barrado porque um processo valia 9,99.
9. **Desconto + saldo podem não somar o total exibido.** No C1, opção I: 26.565,21 + 26.565,21 = 53.130,42, contra um total de 53.130,41. Os dois valores vêm de 26.565,205, arredondado para cima.
10. **Arredondamento duplo da parcela** (§6, A) e **soma das parcelas ≠ saldo**. Não existe ajuste da última parcela.
11. **Código morto ou herdado:**
    - seção e cálculo de **entrada de 5% em até 5×** (`:302-377`) e o botão "Prosseguir";
    - rádio `op-2` comentado;
    - ramos `pessoa-natural` e `mei-ei-me-epp`;
    - `definirCondicaoContribuinte`;
    - variáveis `isFalido`, `isBaixado`, `isGrupoEconomico`, `isRatingD` e `totalFazendario` sem uso;
    - bloco de autopreenchimento comentado (`:515-698`).
12. **Cosmético:**
    - título da aba "Litígio Zero 2026" (`ate60sm.html:143`);
    - legenda da tabela "Detalhamento dos Créditos Tributários **Previdenciários**" (`:372`);
    - comentário "48 MESES" na opção de 55 (`:469`);
    - rótulo "1 parcelas";
    - a chave JSON `saldo_devedor_apos_entrada` designa o Total, embora não haja entrada;
    - o typo `mensaagem=` (`negocio-60.js:295`) cria uma variável global; a mensagem sai correta;
    - `totalGeral = totalGeral = …` (`:307`, código morto).
13. **Sem identificação do contribuinte.** Nem o formulário nem o PDF trazem CPF/CNPJ ou nome. O vínculo com o requerente fica só no pedido de adesão onde o PDF é anexado.
14. **Proteções cosméticas.** Os bloqueios de clique direito, F12 e Ctrl+Shift+I/J (`utils.js:1172-1187`) não impedem o DevTools: a análise foi feita normalmente.

---

## 9. O que deveria entrar no FORMULAS.md

Sugestão de nova seção (sem alterar a §3, que descreve o *simulador*):

```markdown
## 12. Formulário oficial "Discriminativo" da RFB 60 SM (ate60sm.html, Edital 10/2026)

Formulário client-side (negocio-60.js + utils.js) que gera o PDF a ser anexado ao pedido de adesão.
Não envia nada a servidor. Não identifica o contribuinte (sem CPF/CNPJ). Um único perfil
declaratório (PN, MEI, EI, ME, EPP). Sem entrada.

Por processo i:   Tᵢ = Pᵢ + Mᵢ + Jᵢ   (máscara: dígitos ÷ 100)
                  recusa se Tᵢ > 97.260 (comparação em ponto flutuante)  ·  exige Tᵢ ≥ 10 (piso do DARF)
Total:            T = Σ Tᵢ  (sem limite para o total)
Opção (meses, d): I (12; 0,5) · II (24; 0,4) · III (36; 0,35) · IV (55; 0,3)
Saldo:            S = T − T·d          Desconto exibido = T·d
Máx. parcelas:    n_máx = mín(meses, ⌊S ÷ 200⌋)       ← SEM piso de 1 (S < 200 ⇒ 0 ⇒ erro na página)
Parcela:          n escolhido (padrão = 1);  parcela = arred₂( arred₂(S) ÷ n )
Código do DARF exibido: 6359

Diferenças em relação ao simulador (§3):
- S < 200: o simulador dá 1 parcela de S; o formulário quebra (lista vazia), mas gera o PDF com parcela = S e sem nº de parcelas.
- Débito acima de 60 SM: o simulador descarta em silêncio; o formulário não deixa prosseguir.
- Piso de R$ 10 por processo: só no formulário.
- Padrão de parcelas: simulador = máximo; formulário = 1.
- Arredondamento: o saldo pode diferir em 1 centavo (opções III/IV: T·(1−r) × T − T·d);
  a parcela pode diferir em 1 centavo (o formulário divide o saldo já arredondado).
- Ambos recusam alguns débitos de exatamente R$ 97.260,00, conforme a divisão P/M/J (ponto flutuante).
```

E na lista de peculiaridades (§9), incluir:
- "Débito de exatamente 60 SM pode ser considerado acima do limite por erro de ponto flutuante na soma P + M + J. Ocorre no motor e no formulário oficial."
- "O motor aceita saldo < R$ 200 em 1 parcela. O formulário oficial não oferece nenhuma parcela nesse caso, então o comportamento oficial para saldo < R$ 200 é indefinido."

---

## 10. O que NÃO foi verificado

- **Uso do PDF pela RFB.** Não sei como o PDF é processado depois de anexado ao pedido (e-CAC/processo digital): se o JSON do metadado `Keywords` é lido, e se PDFs com parcela < 200 ou sem nº de parcelas são recusados.
- **Regras do edital.** O texto oficial disponível (`paginas-texto/03-pequeno-valor.txt`) não menciona o piso de R$ 10 por processo nem regra de arredondamento. O "valor exato" usado no §6 (meio-centavo para cima sobre o produto decimal) é uma referência minha, não uma regra oficial.
- **Comportamento oficial com saldo < R$ 200.** Não está claro se a modalidade é vedada, se o pagamento é feito à vista ou se a parcela é ajustada. Nem o edital extraído nem o formulário respondem.
- **Ramos mortos.** O rádio `op-2` e os ramos `pessoa-natural`/`mei-ei-me-epp` não foram exercitados, porque não existem na interface. Pelo código, dariam o mesmo `valorMinimo = 200`.
- **Ambientes e funções não testados:**
  - outros navegadores, celular e telas estreitas;
  - impressão pelo menu do navegador (só o atalho Ctrl+P foi testado);
  - o arquivo `rfb-pequeno-valor.js` do outro site (Simulador de Negociações). A comparação foi feita contra o **motor**, que o FORMULAS.md declara equivalente ao site.
- **Conteúdo visual do PDF.** Inspecionei só 2 das páginas JPEG: a página 4 do PDF do c3 e a página 3 do PDF do c4. As demais foram conferidas pelo JSON do metadado e pela contagem de páginas.
- **Selic.** A correção pela Selic não é calculada em nenhuma das duas ferramentas; não há o que comparar.
