# Formulário oficial "Discriminativo de Débitos da Transação – Relevante e Disseminada Controvérsia Jurídica – 2026" (Editais Conjuntos PGFN/RFB 4/2026 e 5/2026, "Grandes Teses")

- **URL (com a barra final, como publicada):** https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/formularios/impostos/transacao/controversia-juridica-2026/editais.html/
- **Arquivos analisados:** `fontes-oficiais/controversia-juridica-2026/editais.html` (2 blocos `<script>` inline: linhas 112–137 e 640–1737), `assets/componentes.js` e `assets/utils.js`.
  - Em 10/11/2026 os três arquivos publicados foram baixados de novo e comparados com a cópia local. São **idênticos byte a byte**:
    - `editais.html`: SHA-256 `8a2b80da…`;
    - `componentes.js`: `9d49786b…`;
    - `utils.js`: `3539f226…`.
  - A URL **sem** a barra final devolve o mesmo HTML (mesmo hash).
  - Com a barra, os caminhos relativos (`./assets/…`, `./govbr/…`) resolvem para `…/editais.html/assets/…`. O Plone responde 200 a eles.
  - `govbr/core.js` (Design System gov.br, SHA-256 `053f9d28…`) não tem cópia local. Li só o necessário para entender os componentes `BRSelect` e `BRDateTimePicker`.
- **Método:**
  - leitura integral do código;
  - **10 sessões gravadas** com `testes/gravar-sessao.js`, no Chrome real contra o site **ao vivo**, digitando tecla a tecla (dados fictícios com dígitos verificadores válidos);
  - inspeção dos listeners via CDP;
  - extração do JSON embutido nos 2 PDFs gerados;
  - comparação numérica com o arquivo inativo `js/modalidades-inativas/controversia-juridica.js`, carregado de verdade no Node.
- **Numeração do FORMULAS.md:** o pedido cita a seção "§10". No FORMULAS.md atual, a seção "RFB — Controvérsia Jurídica (Edital 59/2025) — modalidade inativa" passou a ser a **§11** (a §10 virou "Embasamento oficial"). Neste relatório, "§10" significa essa seção, qualquer que seja o número.
- **Scripts:** todos ficam em `analise-controversia/` (pasta temporária da análise, fora do repositório):
  - `lib.js` — utilitários de preenchimento;
  - `c1.js`, `c2.js`, `c3.js`, `cenarios.js` — cenários;
  - `comparar.js` — formulário × §10 e varredura;
  - `lerpdf.js` — lê o JSON dos metadados do PDF;
  - `res-*.json` — resultados.

---

## 0. Resumo

1. **A conta é a mesma da §10, na mesma ordem:**
   - primeiro o desconto;
   - depois o teto de PF/BCN, de 30% da dívida **com desconto**;
   - depois o abatimento do PF/BCN;
   - por último a entrada, calculada sobre o saldo **depois** do PF/BCN.

   Em fórmulas: `S = D − D·r`; `PF ≤ 0,30·S`; `E = (S − PF)·e`; `saldo = S − PF − E`; `n_máx = maior n ≤ N com saldo/n ≥ 500`; `prestação = saldo/n`.

   Em **21 de 26** leituras de tela (c1–c10), o resultado bate com a §10 ao centavo. As 5 diferenças:
   - o bug B1 (c2);
   - recusa no formulário × truncamento na §10 (c4 e c10a);
   - 1 centavo de diferença (c10b e c10c).
2. **O formulário tem 8 opções, não 5.** As opções 6, 7 e 8 são a tabela da **Portaria RFB 568/2025** (40%/30%/12x, 20%/25%/24x, 5%/20%/36x), também com PF/BCN até 30%. Não há seletor de edital nem de tema: um único formulário atende os Editais 4 e 5/2026.
3. **Bug grave (B1): PF/BCN PRÓPRIOS não entram na conta.**
   - **Causa.** Os campos "Montante" e "Valor" dos créditos próprios estão escritos no HTML. Por isso os web components se conectam **antes** de o script do fim da página definir `calcularLimiteValor` e `atualizarValorTotalCreditos`. Resultado: o `change` desses campos não tem listener.
   - **Efeitos.** O "Total de Créditos de PF e BCN" fica em **0**. O limite montante × alíquota não é verificado. O PDF sai com os créditos próprios preenchidos, mas com "Valor amortizado com PF/BCN 0,00".
   - **Exemplo (gravação c2).** D = 350.000, opção II, créditos próprios de 30.000 + 9.000. O formulário calcula entrada de **39.375,00** e 24 × **4.921,88**. O correto (§10) é entrada de 29.625,00 e 24 × 3.703,12/13.
   - **Quando os próprios entram.** Só quando alguma ação na tabela de terceiros recalcula o total. Aí eles entram **sem** verificação de limite (c3: 40.000 aceitos com limite de 25.000).
4. **Outras divergências com a §10:**

   | Situação | Formulário | §10 |
   |---|---|---|
   | PF acima de 30% | **recusa** e não calcula | **trunca** no limite |
   | PF igual a exatamente 30% | recusa por erro de ponto flutuante em **67%** dos casos (369/547) | aceita |
   | PF não informado (`undefined`) | — | assume **o teto** como PF |
   | Prestação | calculada sobre o saldo **já arredondado**: ~2% dos casos diferem em 1 centavo | calculada sobre o saldo não arredondado |
   | Saldo com desconto | `D − D·r` | `D·(1 − r/100)`: 77 em 200 mil diferem em 1 centavo na entrada |

   O número máximo de parcelas foi igual nos 200 mil casos.
5. **Outros bugs:**
   - o total de créditos fica desatualizado depois de reduzir o montante;
   - trocar a alíquota não revalida o valor;
   - "Calcular" sem opção escolhida gera TypeError;
   - **o PDF pode ser gerado sem ter calculado** (seção "Dívida Consolidada" vazia);
   - as mensagens de validação são enganosas.
6. **Rede:** **0 requisições** durante o preenchimento e o cálculo. Não houve nenhuma requisição que não fosse GET, nenhum XHR/fetch/beacon e **nenhuma requisição de Google Tag Manager/Analytics**: o snippet do GTM está **comentado** no HTML (linhas 8–19). O PDF é gerado no navegador (html2canvas + jsPDF) e salvo por download. Na geração, só há 14 GETs de CSS e fontes, feitos pelo html2canvas.

---

## 1. Evidências produzidas (gravações)

Todas em `testes/saida/sessoes/` (`.json` com a linha do tempo completa e `.md` legível).

| Sessão | O que cobre | Resultado-chave |
|---|---|---|
| `controversia-c1-opcao1-simples` | 1 débito de 100.000,00, opção I, sem PF; escolhe 12 parcelas e depois 5 | S 35.000; E 10.500; saldo 24.500; 12 × 2.041,67 / 5 × 4.900,00 |
| `controversia-c2-multiplos-proprios-pdf` + `…-DISCRIMINATIVOTRANSACAOCONTROVERSIAJURIDICA.pdf` | 3 débitos (CNPJ, CPF com "Agrupar", CNPJ; total 350.000,00); PF próprio 200.000 × 25% → 30.000; BCN próprio 100.000 × 9% → 9.000; opção II; 1 + 24 parcelas; **PDF** | **Total de créditos = "0"**, "Valor amortizado 0,00"; E 39.375; 24 × 4.921,88; PDF de 4 páginas com o JSON nos metadados (§5) |
| `controversia-c3-terceiros-pf-bcn` | PF próprio 40.000 (acima do limite de 25.000); terceiro PF 100.000 × 25% com 30.000 (recusado) e depois 25.000; terceiro BCN 50.000 × 9% → 4.500; 3ª linha com valor sem montante, sem alíquota, CNPJ inválido, excluída; listeners via CDP; opção III | Próprio ignorado até a 1ª ação em terceiros; total 69.500 (inclui os 40.000 próprios sem validação); E 41.100; 36 × 4.566,67 |
| `controversia-c4-limite-30pct` | D 100.000; PF 10.500,01 com as opções I e V; PF 10.500,00 com a opção I | Opção I com 10.500,01 → modal e **sem tabela**; opção V → 60 × 967,50; 10.500,00 → 12 × 1.429,17 |
| `controversia-c5-parcela-minima` | D 25.000 (op. III), 24.999,99 (op. III), 1.000 (op. I), 2.000 (op. V), 500.000 (op. I), 0,01 (op. V) | 22 × 500,00; **21** × 523,81 com saldo exibido de 11.000,00; 1 × 245,00; 2 × 675,00; 12 × 10.208,33; 1 × 0,01 |
| `controversia-c6-portaria-568` | D 100.000 + PF terceiro 5.000; opções 6, 7 e 8 | 12 × 3.208,33; 24 × 2.343,75; 36 × 2.000,00 |
| `controversia-c7-opcoes-I-a-V` | D 1.234.567,89, opções I a V, n máximo | Todas iguais à §10 ao centavo (§4) |
| `controversia-c8-bugs-calculo` | Calcular sem opção; total zero; montante reduzido depois do valor; troca de alíquota | TypeError; tabela toda em 0,00; total fica em 20.000 com o campo vazio; BCN de 25.000 aceito com alíquota de 9% |
| `controversia-c9-validacoes-pdf` + PDF | Gerar sem débitos, com débito incompleto, com PF próprio parcial, sem opção, **sem calcular**, sem escolher parcelas | Todas as mensagens (§1.5); **PDF gerado sem a dívida consolidada** |
| `controversia-c10-arredondamentos` | Casos indicados pela varredura | PF 2.880,09 (= 30% exato) **recusado**; prestação 502,92 (§10: 502,91); entrada 26.583,48 (§10: 26.583,47) |

Para as tabelas da tela, o porte em Node do código oficial (`comparar.js`, função `formulario`) reproduz **23 de 23** leituras ao centavo.

---

## 2. Fluxo do formulário

### 2.1 Carregamento e arquitetura

- **No `<head>`** (`editais.html:37-56`), nesta ordem:
  - `govbr/core.css` e `govbr/core.js` (Design System);
  - `assets/componentes.js` (web components `br-*`);
  - `assets/utils.js`;
  - html2canvas 1.4.1 e jsPDF 2.5.1, do cdnjs.
- **Script inline 1** (`editais.html:112-137`): listas de opções.
  - `getOpcoesTipoDeclaracao`;
  - `getOpcoesCodReceita` — código morto (o select de receita está comentado em `:977-984`);
  - `getOpcoesAliquotasPF` e `getOpcoesAliquotasBCN`, ambas `['9%','15%','20%','25%']`.
- **Templates dos componentes** embutidos em `<template>` (`editais.html:143-384`).
- **Script inline 2** (`editais.html:640-1737`), no fim do `<body>`: variáveis, `MODELO_EDITAL = 2` (`:671`), `OPCOES_TRANSACAO` (`:672-753`) e todas as funções de cálculo.
- **Ligação dos handlers.** Os componentes `br-input-component` e `br-radio-horizontal-component` percorrem os atributos `on*` e ligam `window[nome](input)` **somente se a função já existir** no momento em que o componente se conecta (`componentes.js:500-521` e `:908-929`). Essa é a causa do bug B1 (§6).
- **Selects (`br-select-component`).** Só usam `onchangeFunc`, ouvindo o evento customizado `onChange` do `core.BRSelect` (`componentes.js:267`, `:327`).
  - O atributo `onchange="calcularLimiteValor"` dos selects de alíquota (`editais.html:466`, `:488` e `:1165`) vira apenas um handler inline no elemento. Esse handler **avalia a expressão sem chamá-la**: é um no-op.
  - O mesmo vale para o `onchange="calcularLimiteValor, atualizarValorTotalCreditos"` escrito nos `br-input-component`: como handler inline, é uma expressão com vírgula, sem chamada. Só funciona a ligação feita pelo componente.

### 2.2 Editais e temas

- **Não há escolha de edital nem de tema.** O título é "… Controvérsia Jurídica – 2026". Segundo o roteiro oficial, o mesmo documento serve aos Editais 4/2026 (IRRF de não residentes) e 5/2026 (multas substitutivas do perdimento).
- **`MODELO_EDITAL = 2`** (`:671`) define as colunas da tabela de débitos (`:780-832`) e o ramo de `incluirDebito` (`:942-1046`). O ramo `MODELO_EDITAL == 1` (`:838-940`, com tipo de declaração e data de entrega) é código morto nesta página.
- **As opções** são 8 rádios criados por `cria_opcoes_transacao()` (`:1282-1301`), a partir de `OPCOES_TRANSACAO`:

| id | Rótulo (resumo) | `reducao` r | `entrada` e | `parcelas_entrada` | `parcelas_do_saldo` N | `percentual_pfbcn` |
|---|---|---|---|---|---|---|
| 1 | 3.1.1-I | 0,65 | 0,30 | 1 | 12 | 0,30 |
| 2 | 3.1.1-II | 0,55 | 0,25 | 1 | 24 | 0,30 |
| 3 | 3.1.1-III | 0,45 | 0,20 | 1 | 36 | 0,30 |
| 4 | 3.1.1-IV | 0,35 | 0,15 | 1 | 48 | 0,30 |
| 5 | 3.1.1-V | 0,25 | 0,10 | 1 | 60 | 0,30 |
| 6 | 3.1.2-I (Portaria RFB 568/2025 – autorregularização) | 0,40 | 0,30 | 1 | 12 | 0,30 |
| 7 | 3.1.2-II (Portaria 568) | 0,20 | 0,25 | 1 | 24 | 0,30 |
| 8 | 3.1.2-III (Portaria 568) | 0,05 | 0,20 | 1 | 36 | 0,30 |

Os valores conferem com a página oficial (`fontes-oficiais/paginas-texto/05-grandes-teses.txt`). A página oficial não diz se o PF/BCN se aplica aos débitos da Portaria 568; o formulário permite.

### 2.3 Seções e campos

| Seção (classe `.toPdf`) | Campos | Código |
|---|---|---|
| **Débitos a Transacionar** (`table[required]`) | Por linha: CPF/CNPJ (`validarCNPJCPF`), Nº processo/DEBCAD (`validarProcesso`), chave "Agrupar por processo", Código de receita (máscara de 4 dígitos), Período de apuração (data ≤ hoje − 1 mês), Vencimento (data ≤ hoje), Valor atualizado (máscara de centavos; `change` → `atualizarValorTotalDebitos`), lixeira | `editais.html:394-417`, `:942-1046` |
| Total de débitos a transacionar (somente leitura) | `#total-debitos-transacionar`, valor inicial "0" | `:420-431`, `:1079-1100` |
| **PF/BCN PRÓPRIOS** (`data-opcional`) — "Exclusivo para Pessoa Jurídica" | 2 linhas fixas (PF; BCN da CSLL): Montante, Alíquota (select 9/15/20/25%), Valor, Data de entrega da ECF | `:434-506` |
| **PF/BCN TERCEIROS** (`data-opcional`) | Linhas dinâmicas ("Incluir novo Crédito – PF/BCN"): CNPJ (`validarCNPJ`), Tipo (fixo), Montante, Alíquota, Valor, Data ECF, lixeira | `:509-543`, `:1103-1207` |
| Total de créditos de PF e BCN (somente leitura) | `#total-creditos-pf-bcn`, valor inicial "0" | `:546-557`, `:1259-1279` |
| **Opções de Transação** | 8 rádios `name="opcao"`, `required`; clicar em um deles limpa a tabela de resultado | `:560-569`, `:1282-1301` |
| Botão **Calcular** (fora do PDF) | `calcularDividaConsolidada()` | `:572-582`, `:1304-1648` |
| **Dívida Consolidada** (resultado) | 17 linhas, incluindo 2 selects obrigatórios (parcelas da entrada; parcelas do saldo) | `:585-605`, `:1352-1646` |
| Botão **Gerar Documento** | `gerarDocumento()` | `:608-621`, `utils.js:889-961` |

**Chave "Agrupar por processo"** (`alterarAgruparProcesso`, `:1051-1075`). Ligada, ela **apaga e desabilita** código, PA e vencimento da linha e retira o `required` deles. O valor continua obrigatório. No JSON do PDF o campo vai como `"Agrupar": "Sim"/"Não"`.

### 2.4 Eventos e funções (cadeia observada nas gravações)

| Ação | Função chamada | Observação |
|---|---|---|
| tecla em campo de valor | `validarValor(input)` (`utils.js:245-260`) | máscara de centavos |
| `change` no valor do débito | `atualizarValorTotalDebitos` → `limparTabelaDividaConsolidada` | |
| `change` no CPF/CNPJ do débito | `validarCNPJCPF` → `validarCPF` ou `validarCNPJ` | |
| `change` no processo | `validarProcesso` | 15 ou 17 dígitos; com 17, verifica os DVs |
| clique em "Agrupar" | `alterarAgruparProcesso(div)` | |
| `change` no montante (terceiros) | `calcularLimiteValor` | **não** recalcula o total |
| `change` no valor (terceiros) | `calcularLimiteValor`, depois `atualizarValorTotalCreditos` (→ `limparTabelaDividaConsolidada`) | |
| `change` no montante ou valor (**próprios**) | **nenhuma** (só há listener de `input`) | B1: nas gravações c2 e c3, 0 chamadas; CDP: os campos próprios têm só `input`; os de terceiros têm `input` + 1 ou 2 `change` |
| troca de alíquota (próprios e terceiros) | **nenhuma** | B3 |
| clique em uma opção | `limparTabelaDividaConsolidada` | |
| Calcular | `calcularDividaConsolidada` → `converteStringEmNumero` ×2 → `calcularMaximoParcelas(E, 1)` → `calcularMaximoParcelas(saldo, N)` → `converteNumeroEmReais` ×N | |
| escolha nos selects de parcelas | `atualizarParcelasEntrada` / `atualizarParcelasSaldo` | |
| Gerar Documento | `gerarDocumento` → `prepararPdf` → (`validarTabelasObrigatorias`, `validarTabelasOpcionais`, `validarCamposRequiredNaSecao`) por seção → `ajustarTextareas` → html2canvas → `gerarJSON` → `extrairValores` | |
| lixeira em linha de terceiros / "Limpar" (com confirmação) | `excluirLinha` + `atualizarValorTotalCreditos` | |

### 2.5 Validações e mensagens (texto exato)

| Mensagem | Condição | Código | Visto em |
|---|---|---|---|
| "Selecione uma das Opções de transação" (e logo em seguida um **TypeError**) | Calcular sem opção | `editais.html:1316-1321` | c8 |
| "Valor da PF e BCN para amortização superior ao valor permitido da modadlidade selecionada. Deve-se alterar o valor do PF e BCN ou a modalidade selecionada" (sic) | `totalCreditos > S × 0,30` | `:1332-1337` | c4, c10 |
| "Por favor, insira um montante e selecione uma alíquota válidos." | montante = 0 e alíquota = 0 | `:1224-1230` | c3 |
| "Por favor, insira um montante válido." | montante = 0 e alíquota ≠ 0 | `:1232-1238` | (código) |
| "Por favor, insira uma aliquota válida." | valor > 0 com alíquota 0 | `:1243-1248` | c3 |
| "O valor não pode exceder 25000.00." (formato americano, via `toFixed(2)`) | valor > montante × alíquota/100; o campo é apagado | `:1240-1255` | c3, c8 |
| "CPF ou CNPJ inválido." / "CPF inválido." / "CNPJ inválido." | tamanho ou DV inválido; o campo é apagado | `utils.js:264-462` | c3 |
| "Número de Processo inválido. Certifique-se de inserir um número com 15 ou 17 dígitos." | outro tamanho (um **DEBCAD** de 9 dígitos é recusado, apesar do nome da coluna) | `utils.js:469-480` | (código) |
| `alert("Número de Processo inválido. Os dígitos verificadores estão incorretos.")` — alerta nativo | DV errado em processo de 17 dígitos | `utils.js:533` | (código) |
| "A tabela TABELA DÉBITOS A AUTORREGULARIZAR é de preenchimento obrigatório" | nenhuma linha de débito | `utils.js:831-844` | c9 |
| "Existem campos obrigatórios não preenchidos" | campo `required` vazio, nenhuma opção marcada ou selects de parcelas sem escolha | `utils.js:861-872` | c9 |
| "Se um campo estiver preenchido, todos os campos da linha devem ser preenchidos." | linha de PF/BCN parcial; **é substituída na hora** por "A tabela TABELA PF E BCN PRÓPRIOS é de preenchimento obrigatório" | `utils.js:1209-1220` e `:846-858` | c9 (só a 2ª aparece) |
| "Tem certeza que deseja apagar todos dados dessa tabela?" | botão Limpar | `editais.html:760` | (código) |
| "Discriminativo gerado com SUCESSO. … NÃO altere o conteúdo do documento gerado, pois pode ocasionar RECUSA automática do pedido. Anexe o documento ao requerimento…" | PDF salvo | `utils.js:946-958` | c2, c9 |

---

## 3. Fórmulas, exatamente como no código

**Notação:**
- `D` = total de débitos;
- `r` = redução;
- `S` = dívida consolidada com redução;
- `C` = total de créditos de PF/BCN;
- `e` = percentual de entrada;
- `E` = entrada;
- `N` = parcelas do saldo no edital;
- `fmt(x)` = `x.toLocaleString('pt-BR', {min:2, max:2})`, arredondamento half-expand;
- `parse(s)` = remove tudo que não é dígito ou vírgula, troca a vírgula por ponto e aplica `parseFloat`.

**3.1 Máscara de valores** (`utils.js:245-260`). Ao digitar, `valor = (somente dígitos) / 100`, exibido com `fmt`. Valor 0 ou vazio marca o campo como "danger" e não muda o texto.

**3.2 Totais**
```
D = parse( fmt( Σ parse(valor_débito_i) ) )                       editais.html:1079-1100 (valor lido de volta em :1324)
C = parse( fmt( Σ parse(valorCredito_j) ) )   para TODOS os .valorCredito com texto, próprios e terceiros
                                                                    editais.html:1259-1279 (lido em :1325)
```
- O total de créditos **só é recalculado** quando:
  - muda o valor de uma linha de **terceiros**;
  - uma linha de terceiros é excluída;
  - alguém clica em "Limpar".
- Ele **não** é recalculado quando muda um campo próprio (B1), o montante ou a alíquota (B2/B3).

**3.3 Teto de cada crédito (conversão PF/BCN → crédito)** (`editais.html:1210-1256`)
```
limite_linha = montante × (alíquota% / 100)          alíquota ∈ {9, 15, 20, 25} para PF e para BCN, à escolha
se valor > limite_linha → modal "O valor não pode exceder {limite.toFixed(2)}." e valor := ''
```
- O formulário **não calcula** o valor do crédito: o usuário digita o "Valor", e o código só verifica se `valor ≤ montante × alíquota`.
- Nada amarra a alíquota ao tipo de crédito. PF a 9% e BCN a 25% são aceitos.
- Para os créditos próprios essa verificação **nunca roda** (B1).

**3.4 Cálculo** (`calcularDividaConsolidada`, `editais.html:1304-1348`)
```
valorReducao = D × r                                      :1328
S            = D − valorReducao                           :1329
se C > S × percentual_pfbcn (0,30) → modal e PARA         :1332-1337   (comparação estrita, em ponto flutuante)
saldoDevedor = S − C                                      :1339
E            = saldoDevedor × e                           :1341   ← entrada DEPOIS do PF/BCN, sobre a dívida COM desconto
qtdEntrada   = calcularMaximoParcelas(E, 1)  = 1          :1343   (entrada "à vista")
saldo        = saldoDevedor − E                           :1346
qtdPrest     = calcularMaximoParcelas(saldo, N)           :1347
```

**3.5 Número máximo de parcelas** (`calcularMaximoParcelas`, `:1651-1667`)
```
se valorTotal ≤ 500 → 1
senão n = N; enquanto valorTotal / n < 500: n−−; devolve n
```
- Equivale a `mín(N, máx(1, ⌊saldo/500⌋))`: zero diferenças em 200 mil casos.
- O cálculo usa o saldo **não arredondado**. Por isso a tela pode mostrar um saldo de 11.000,00 permitindo só 21 parcelas (c5b, D = 24.999,99, opção III: saldo real 10.999,9956).
- Com saldo ≤ 500, fica **1 parcela abaixo do mínimo** (c5c: 1 × 245,00).

**3.6 Valores das parcelas** (`:1669-1695`)
```
parcela_entrada = fmt( parse(fmt(E)) / n_entrada )          (n_entrada sempre 1)
prestação       = fmt( parse(fmt(saldo)) / n_escolhido )    ← divide o saldo JÁ ARREDONDADO e exibido
```
- A lista do select vai de 1 a `qtdPrest`. Ela começa **sem seleção**, e as parcelas aparecem como "0,00" até o usuário escolher.
- O PDF exige a escolha (selects `required`).

**3.7 Exibição** (`:1352-1646`)
- Percentuais: `(r×100).toFixed(0) + " %"`.
- Valores: `fmt(...)`.
- "Valor amortizado com PF/BCN" = `fmt(C)`.
- "Saldo devedor" = `fmt(S − C)`.
- "Saldo devedor após pagamento da entrada" = `fmt(saldo)`.
- Os rodapés trazem as regras textuais:
  - entrada até o último dia útil do mês do requerimento;
  - 1ª parcela no mês seguinte;
  - Selic acumulada + 1%.
- **Nenhum juro é calculado.**

**3.8 Multa qualificada, depósitos e débitos da Portaria 568**
- **Multa qualificada:** não há campo nem tratamento próprio. Todo débito recebe o mesmo desconto, o que coincide com a página oficial ("multas qualificadas … receberão os mesmos descontos").
- **Depósitos judiciais:** a conversão em renda não é modelada.
- **Débitos da Portaria 568:** **não há como misturá-los** com os demais. Uma única opção vale para o total do documento.

---

## 4. Formulário × §10 (`controversia-juridica.js`)

A §10 foi carregada **do arquivo real**, via `vm` com `estadoGlobal = { perfil: { tipoContribuinte: 'DEMAIS_PJ' }, totalDebitos: D }`, e chamada com `calcularOpcaoControversiaJuridica(opção, n, PF)`.

Do lado do formulário:
- os números vêm das **gravações** (tela real);
- nos casos marcados com *, do porte `formulario()`, que bateu com a tela em 23/23 leituras.

Abreviações: "E" = entrada; "saldo" = saldo após a entrada.

| # | Entradas | Formulário (tela) | §10 (Node) | Diferença e causa |
|---|---|---|---|---|
| A (c1) | D 100.000,00; op. I; PF 0 | E 10.500,00; saldo 24.500,00; máx. 12; 12 × 2.041,67 | igual (2.041,666…) | nenhuma |
| B (c2) | D 350.000,00 (3 débitos); op. II; PF **próprio** 30.000 + BCN próprio 9.000 | **C = 0,00**; E **39.375,00**; saldo **118.125,00**; 24 × **4.921,88** | C 39.000; E 29.625,00; saldo 88.875,00; 24 × 3.703,12 (bruto 3.703,1249999…) | **B1**: o formulário ignora os créditos próprios. Mesmo que eles entrassem (B′*), daria 24 × 3.703,13 contra 3.703,12: 88.875/24 = 3.703,125 exato, e a §10 chega a 3.703,1249999 por ponto flutuante |
| C (c3) | D 500.000,00; op. III; C 69.500 (terceiros 25.000 + 4.500, mais um próprio de 40.000 puxado sem verificação) | E 41.100,00; saldo 164.400,00; 36 × 4.566,67 | igual | números iguais. Mas o crédito próprio de 40.000 passa do seu teto de 25.000 (100.000 × 25%) e foi aceito |
| D (c4) | D 100.000,00; op. I; PF 10.500,01 (limite 10.500,00) | **recusa** (modal), sem tabela | PF truncado em 10.500,00: E 7.350,00; saldo 17.150,00; 12 × 1.429,17 | o formulário recusa; a §10 trunca em silêncio. Com PF = 10.500,00, os dois dão 12 × 1.429,17 |
| E (c10) | D 21.334,00; op. II; PF 2.880,09 (= 30% exato de 9.600,30) | **recusa** (modal) | aceita (truncado em 2.880,0899999999997): E 1.680,05; saldo 5.040,16; 10 × 504,02 | ponto flutuante: `9600,3 × 0,3 = 2880,0899999999997 < 2880,09`. Com 2.880,08 o formulário calcula E 1.680,05 e 10 × 504,02 |
| F (c10) | D 10.316,36; op. III; PF 644,85; n = 8 | 8 × **502,92** | 8 × **502,91** (502,9148) | o formulário divide o saldo **exibido** (4.023,32) e não o real (4.023,3184) |
| G (c10) | D 265.703,80; op. II; PF 13.232,81 | E **26.583,48** | E **26.583,47** (26.583,474999…) | `D − D·r` (formulário) contra `D·(1−r/100)` (§10): o resíduo de ponto flutuante cai no meio-centavo |
| H (c5) | D 24.999,99; op. III | E 2.750,00; saldo exibido **11.000,00**; máx. **21**; 21 × 523,81 | igual (saldo 10.999,9956) | nenhuma, mas a tela é inconsistente: 11.000/22 = 500 |
| I (c5) | D 1.000,00; op. I | 1 × 245,00 (abaixo de R$ 500) | igual | nenhuma; os dois aceitam uma parcela única abaixo do mínimo |
| J (c6) | D 100.000; PF 5.000; ops. 6/7/8 (Portaria 568) | 12 × 3.208,33; 24 × 2.343,75; 36 × 2.000,00 | a §10 **não tem** essas opções. Injetando r/e/N da 568 em `calcularOpcaoControversiaJuridica`, dá o mesmo | falta a tabela 568 na §10 |
| K (c7) | D 1.234.567,89; ops. I–V; n máx. | 12 × 25.205,76; 24 × 17.361,11; 36 × 15.089,16; 48 × 14.210,39; 60 × 13.888,89 | iguais nas 5 | nenhuma |
| L* | D 100.000; op. I; PF **não informado** | C "0" → 12 × 2.041,67 | `Number(undefined)` = NaN ⇒ **PF = teto (10.500)** ⇒ 12 × 1.429,17 | armadilha da §10: só `null` vira 0; `undefined` vira o teto |
| M (c8) | D 1.000.000; op. V; crédito de terceiro de 20.000 apagado pelo teto, mas o total ficou em 20.000 | C 20.000 (campo vazio); 60 × 10.950,00 | — | B2: o formulário usa um total desatualizado |

**Varredura aleatória** (`comparar.js`, 200.000 casos):
- **Geração dos casos:** D em centavos (até R$ 50 mil ou R$ 5 milhões), opções I–V e PF aleatório dentro do teto.
- **Número máximo de parcelas:** 0 diferenças.
- **Prestação exibida:** 4.113 casos (2,1%) diferem em ±1 centavo (causa do caso F).
- **Entrada exibida:** 77 casos diferem; o saldo exibido, 114 (causa do caso G).
- **PF igual ao teto de 30% exato** (quando o teto cai em centavos inteiros): o formulário **recusa 369 de 547** (67%). A §10 aceita todos.

**Diferenças de regra:**
- **Ordem do cálculo:** idêntica.
- **Elegibilidade:**
  - a §10 aceita só MEI, ME/EPP e Demais PJ, com D > 0;
  - o formulário aceita CPF no débito e créditos de PF/BCN mesmo para CPF (o aviso "Exclusivo para PJ" não é verificado);
  - o formulário aceita D = 0 (tabela toda em 0,00; c8);
  - o formulário aceita débitos de CPFs/CNPJs diferentes no mesmo documento (c2).
- **Montante × alíquota:** o formulário verifica (só para terceiros, na prática); a §10 não tem o conceito.
- **Créditos próprios versus de terceiros:** o formulário os distingue; a §10 só conhece um valor único de PF/BCN.

---

## 5. Requisições e eventos

| Sessão | Requisições | Não-GET | XHR/fetch | Eventos de interface | Chamadas JS | Erros JS | Downloads |
|---|---|---|---|---|---|---|---|
| c1 | 19 | 0 | 0 | 122 | 46 | 0 | 0 |
| c2 | 33 (19 + 14 no PDF) | 0 | 0 | 329 | 159 | 0 | 1 |
| c3 | 19 | 0 | 0 | 341 | 183 | 0 | 0 |
| c4 | 19 | 0 | 0 | 212 | 109 | 0 | 0 |
| c5 | 19 | 0 | 0 | 273 | 187 | 0 | 0 |
| c6 | 19 | 0 | 0 | 214 | 106 | 0 | 0 |
| c7 | 19 | 0 | 0 | 201 | 117 | 0 | 0 |
| c8 | 19 | 0 | 0 | 304 | 155 | **2** (TypeError) | 0 |
| c9 | 33 (19 + 14 no PDF) | 0 | 0 | 160 | 158 | 0 | 1 |
| c10 | 19 | 0 | 0 | 278 | 181 | 0 | 0 |

**No carregamento** (19 GETs, todos na fase "carregamento"):
- **www.gov.br (5):** o HTML, `govbr/core.css`, `govbr/core.js`, `assets/componentes.js` e `assets/utils.js`.
- **cdngovbr-ds.estaleiro.serpro.gov.br (8):** `rawline.css` e 7 fontes woff2.
- **cdnjs.cloudflare.com (5):** font-awesome 6.6.0 (CSS e 2 fontes), html2canvas 1.4.1 e jsPDF 2.5.1.
- **fonts.googleapis.com (1):** CSS da fonte Raleway.

**Durante o preenchimento e o cálculo:** **zero requisições** em todas as sessões. Nenhum dado de cálculo sai do navegador.

**Em "Gerar Documento"** (14 GETs): o html2canvas clona o documento e rebaixa 4 folhas de estilo (rawline, Raleway, font-awesome, core.css) e 10 fontes. Não houve POST nem upload. O PDF é salvo por `pdf.save()`, como download.

**Google Tag Manager/Analytics:** **0 requisições** em todas as sessões. O snippet GTM-NHZSKTD / G-WGZPDK4DH1 existe, mas está **dentro de um comentário HTML** (`editais.html:8-19`). Não há outros rastreadores. A única requisição a um domínio Google é o CSS da fonte Raleway, que não é analytics.

**PDF gerado** (`utils.js:889-961`):
- **Montagem:** `html2canvas(document.body)` → JPEG com qualidade 0,7 → jsPDF em paisagem, com a imagem fatiada em páginas (c2: 4 páginas; imagem de 1600 × 4181 px).
- **Nome do arquivo:** `DISCRIMINATIVOTRANSACAOCONTROVERSIAJURIDICA.pdf`.
- **Metadado `/Keywords`:** `SUARA_CORAT_TRANSACAO_CONTROVERSIAJURIDICA2026 | {JSON}`, montado por `gerarJSON`/`extrairValores` (`utils.js:965-1068`).
  - O JSON tem `versao` "1.0", `data-de-criacao` e uma chave por seção (`tabela_<name da seção>` para seções com tabela).
  - Ele inclui os débitos (CPF/CNPJ, processo, código, valor, `Agrupar` Sim/Não, PA, vencimento), os créditos próprios e de terceiros, os totais, o rótulo da opção e as linhas da dívida consolidada.
  - **Na c2**, o JSON mostra `"Total Créditos PF e BCN": "0"` e `"Valor amortizado com PF/BCN" … "0,00"`, ao lado de `"Valor Prejuízo Fiscal": "30.000,00"` e `"Valor BCN CSLL": "9.000,00"`. A imagem da página confirma o mesmo.
  - **Na c9**, `"tabela_Seção Dívida Consolidada": []`.

---

## 6. Divergências e bugs

| # | Gravidade | Descrição | Evidência |
|---|---|---|---|
| **B1** | **Alta** | **PF/BCN próprios não entram no total nem são verificados contra o teto.** As linhas estáticas (`editais.html:455-498`) têm `onchange="calcularLimiteValor"` e `"calcularLimiteValor, atualizarValorTotalCreditos"`. O componente só liga handlers que já existem em `window` quando se conecta (`componentes.js:500-521`). Essas funções só são definidas no script do fim da página (`editais.html:1210`, `:1259`), executado depois. `validarValor`, que vem do `utils.js` no `<head>`, é ligada, e por isso só existe o listener de `input`. **Efeitos:** (a) total "0" e "Valor amortizado 0,00", com entrada e parcelas **superestimadas** no discriminativo — e o roteiro manda informar no e-CAC "o valor da primeira parcela indicado no discriminativo"; (b) nenhum teto montante × alíquota para os próprios; (c) os próprios entram de carona, sem verificação, quando uma linha de terceiros é alterada ou excluída. | c2 (PDF e JSON), c3 (CDP: próprio = `[input]`, terceiro = `[input, change, change]`; o total salta para 40.000 ao recusar o terceiro) |
| B2 | Média | Reduzir o **montante** de uma linha de terceiros apaga o valor acima do novo teto, mas **não** recalcula o total nem limpa o resultado. O total continua com o valor antigo e é usado no Calcular. | c8: campo vazio, total 20.000, 60 × 10.950,00 |
| B3 | Média | **Trocar a alíquota não revalida nada.** O `onchange` do select é um no-op (§2.1). Um BCN de 25.000 com montante de 100.000 a 9% (teto 9.000) é aceito. | c8 |
| B4 | Baixa | Calcular sem opção mostra o modal, mas **não retorna** (`:1316-1321`). Em seguida ocorre `TypeError: Cannot read properties of undefined (reading 'reducao')`. | c8 (erroJS) |
| **B5** | **Média/Alta** | **O PDF pode ser gerado sem clicar em Calcular.** A seção de resultado está vazia e não tem campos `required`, então `prepararPdf` aprova. O PDF sai sem entrada nem parcelas. | c9: PDF de 3 páginas, `Dívida Consolidada: []` |
| B6 | Baixa | O teto de 30% é comparado com `>` em ponto flutuante. Um PF exatamente igual a 30% é recusado em 67% dos casos exatos (ex.: D 21.334, op. II, PF 2.880,09). | c10 e a varredura |
| B7 | Baixa | Duplo arredondamento: a prestação é calculada sobre o saldo exibido (±1 centavo em ~2% dos casos), e o saldo exibido pode contradizer o número máximo de parcelas (11.000,00 com só 21×). | c10, c5 |
| B8 | Info | Saldo ≤ R$ 500 → 1 parcela abaixo do mínimo de R$ 500, sem aviso (a §10 faz o mesmo). | c5 (245,00; 0,01) |
| B9 | Info | Alíquotas 9/15/20/25% livres para PF e para BCN. O código não amarra PF a 25% nem BCN a 9/15/20%. | código `:129-135` |
| B10 | Baixa | Mensagens: a linha opcional incompleta mostra "A tabela … é de preenchimento obrigatório", o que é enganoso. Há "modadlidade" (sic), "Prejuío" (sic, nome do campo e chave do JSON), teto exibido como "25000.00" e `alert()` nativo para DV de processo. | c9, c3 |
| B11 | Info | A coluna se chama "Número do processo/DEBCAD", mas só 15 ou 17 dígitos são aceitos. Um DEBCAD (8 + 1 dígitos) seria recusado. | `utils.js:469` |
| B12 | Info | Uma opção por documento: não é possível discriminar débitos da Portaria 568 e débitos gerais no mesmo PDF. Também não há marcação de multa qualificada nem de depósitos. | código |
| B13 | Info | Créditos de terceiros: só CNPJ (`validarCNPJ`). CNPJ repetido ou curto gera "CNPJ inválido.". Apagar o CNPJ também deve gerar o modal, porque `validarCNPJ` recebe o elemento em vez do texto quando o valor é vazio (`utils.js:368`). | c3 (repetido e curto); vazio: só pelo código |
| B14 | Info | Débitos de CPF e de CNPJ diferentes são aceitos no mesmo documento, e créditos de PF/BCN também são aceitos quando o débito é de CPF. O aviso "Exclusivo para Pessoa Jurídica" não é verificado. | c2 |
| B15 | Info | Código morto: `getOpcoesCodReceita` (lista de 64 códigos de receita, não usada), o ramo `MODELO_EDITAL == 1`, `switchLigado` vazio e `desabilitarCliqueDireito`, `desabilitarAtalhosDevTools` e `desabilitarAtalhosImpressao` (definidas em `utils.js` e nunca chamadas). A impressão é bloqueada só por CSS (`@media print`, `editais.html:71-79`). | código |

---

## 7. O que deve entrar no FORMULAS.md

Sugestão de texto para uma nova subseção da seção de Controvérsia Jurídica (hoje §11), mais as correções na tabela "Grandes Teses" da seção de Embasamento.

```markdown
### Formulário oficial "Discriminativo" (Editais Conjuntos PGFN/RFB 4 e 5/2026)

URL: …/formularios/impostos/transacao/controversia-juridica-2026/editais.html/
(o cálculo é todo no navegador; o PDF leva os dados em JSON no metadado /Keywords).

A conta é a mesma desta seção, na mesma ordem: desconto → teto de PF/BCN → abatimento → entrada → saldo → parcelas.
O formulário tem **8 opções** (I–V e a tabela da Portaria RFB 568/2025, também com PF/BCN até 30%):

| Opção | r | e | N |
|---|---|---|---|
| 3.1.1-I…V | 65/55/45/35/25% | 30/25/20/15/10% | 12/24/36/48/60 |
| 3.1.2-I (568) | 40% | 30% | 12 |
| 3.1.2-II (568) | 20% | 25% | 24 |
| 3.1.2-III (568) | 5% | 20% | 36 |

    S          = D − D·r
    se C > 0,30·S → recusa (não trunca)          C = soma dos créditos de PF/BCN digitados
    E          = (S − C)·e                        (1 parcela)
    saldo      = S − C − E
    n_máx      = 1 se saldo ≤ 500; senão maior n ≤ N com saldo/n ≥ 500
    prestação  = arred2(saldo)/n                  (divide o saldo exibido)
    crédito de cada linha ≤ montante × alíquota   (alíquota 9/15/20/25%, livre para PF e para BCN; o usuário digita o valor)

Peculiaridades do formulário oficial:
- os créditos PRÓPRIOS não entram no total (bug de ordem de carga): o discriminativo sai com "amortizado 0,00";
- PF exatamente igual a 30% pode ser recusado (ponto flutuante);
- o total de créditos não é recalculado quando muda o montante ou a alíquota;
- o PDF pode ser gerado sem calcular;
- prestação e entrada podem diferir 1 centavo do cálculo sem arredondamento intermediário.
```

**Correções na tabela "Grandes Teses / Controvérsia Jurídica" da seção de Embasamento:**
- **Linha da Portaria 568:** acrescentar "o formulário oficial tem as opções 3.1.2-I a III, com PF/BCN até 30%".
- **Nova linha:** "Ordem entrada × PF/BCN: o formulário oficial calcula a entrada depois do PF/BCN, sobre a dívida com desconto (= §11) ✅".
- **Nova linha:** "PF/BCN acima de 30%: o formulário recusa e a §11 trunca ⚠️".
- **Na própria §11, anotar:**
  - `valorPfBcnPersonalizado === undefined` assume o **teto** como PF (só `null` vira 0);
  - a prestação da §11 usa o saldo não arredondado (±1 centavo em relação ao formulário).

---

## 8. O que NÃO foi verificado

- **Texto integral dos Editais Conjuntos 4/2026 e 5/2026.** Só tive a página-resumo e o roteiro. Ficam sem confirmação no texto legal:
  - que a entrada mínima incide sobre o saldo **após** o PF/BCN;
  - que o PF/BCN vale para os débitos da Portaria 568;
  - quais alíquotas de conversão o edital admite para PF e para BCN;
  - se é permitida uma parcela única abaixo de R$ 500.
- **O que a RFB faz com o PDF.** Não verifiquei se ela lê o JSON dos metadados, se recalcula ou se rejeita discriminativos incoerentes (como o da c2). O aviso de "RECUSA automática" sugere leitura automatizada, mas isso está fora do alcance.
- **Outros navegadores.** Só testei o Chrome (headless, via playwright-core). A causa do B1 decorre da ordem de execução padronizada (custom elements definidos no `<head>`, funções no fim do `<body>`), então deve se repetir em qualquer navegador, mas isso não foi testado.
- **Datas.** Os limites `maxdate` dos datepickers (PA ≤ hoje − 1 mês; vencimento e ECF ≤ hoje) não foram exercitados com datas fora do limite.
- **PDF.** A imagem foi conferida visualmente só na c2 (2 recortes). Nas demais, conferi o JSON dos metadados e o número de páginas.
- **Analytics.** Não houve nenhuma requisição de GTM/Analytics, porque o snippet está comentado. Se a RFB descomentá-lo numa versão futura, essas requisições passarão a existir. A descrição da tarefa dizia que a página carrega GTM/GA; **na versão de 10/11/2026 isso não acontece**.
