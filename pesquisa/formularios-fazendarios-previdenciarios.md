# Formulários oficiais "Transação até R$ 50 milhões por contencioso" (Edital RFB nº 9/2026): débitos fazendários e previdenciários

Análise do código e da execução real dos dois formulários que geram o PDF "discriminativo" anexado ao pedido de adesão:

- Fazendários: `https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/formularios/impostos/transacao/transacao-2026/fazendarios.html` (script `assets/js/negocio-faz.js`)
- Previdenciários: `.../transacao-2026/previdenciarios.html` (script `assets/js/negocio-pre.js`)
- Código comum: `assets/js/utils.js` (validação, conversões, PDF)

**Fontes.** Em 10/11/2026 baixei os 5 arquivos publicados e comparei byte a byte com `fontes-oficiais/formularios-2026/`: são **idênticos**. Todas as referências `arquivo:linha` abaixo apontam para essa cópia local.

**Método.**
1. Leitura integral de `negocio-faz.js` (2.820 linhas), do `diff` com `negocio-pre.js` e das funções usadas de `utils.js`.
2. **23 sessões gravadas** com `testes/gravar-sessao.js`, no Chrome real, clicando e digitando como um usuário: 18 cenários de cálculo (F01–F13 e P01–P05) e 5 sessões de validação ou bug (E01, E01b, E02, E03, E04). As gravações estão em `testes/saida/sessoes/` e cada uma tem um `.json` e um `.md`.
3. Uma réplica executável das fórmulas ([modelo-formulario.js](#anexo--arquivos)) foi comparada com a tela em todos os cenários. Os 18 cenários conferem campo a campo: 16 de 16 valores por cenário, 288 valores ao todo.
4. **Fuzz com os handlers oficiais**: os mesmos `onclick`/`onchange` da página foram disparados com entradas aleatórias, e o número de parcelas foi escolhido com clique real. Foram 150 casos fazendários, **150 de 150 idênticos à réplica** (§4.1). O fuzz previdenciário não rodou porque o gov.br passou a recusar conexões.
5. O motor `simulador-basico/motor-calculo.js` (`simular()`, escolhas `RFB_GERAL_50M`) foi rodado com as mesmas entradas e comparado número a número (§4.2).

Os dados usados são fictícios. **Os formulários não têm campo de CPF/CNPJ** (o HTML só pede o tipo de contribuinte), por isso não houve CPF/CNPJ a preencher. Os números de processo também são inventados: os de 17 dígitos têm DV válido, gerado com o próprio algoritmo de `utils.js:90-145`.

---

## 0. Resumo: respostas diretas

| Pergunta | Como os formulários fazem |
|---|---|
| Base do rating | `B = Σ totais do contencioso + "Valor total da dívida na PGFN e RFB"`. É a mesma base do simulador. |
| Relação | `r = B ÷ CAPAG`, arredondada a 4 casas: o código faz `toFixed(2)` do percentual e depois relê o resultado tirando o ponto. **CAPAG = 0 ou vazia não vira rating A**: a "relação" passa a ser o próprio valor `B` escrito como percentual, o que quase sempre dá rating D. |
| Faixas | Rating D forçado para PN com indicativo de óbito e para falida ou baixada. Nos demais casos: A se r ≤ 0,5; B se r ≤ 1; C se r ≤ 2; D acima disso. |
| Desconto teórico δ | A/B: 0. C: `δmax·(r−1)`. D: `δmax`. **δmax = 65% para "Demais PJ" (inclusive falida ou baixada)** e 70% para PN, PN óbito e o grupo ME/EPP/Santas Casas/cooperativas/OSC/ensino. O resultado é arredondado a 2 casas do percentual. |
| Desconto aplicado | **Por débito (por processo)**: `min(multa_i + juros_i ; δ·total_i)`. O total é a soma dessas parcelas. Não há campo de encargos. |
| Piso de 35%/30% | Não existe uma checagem separada. O piso é implícito: como `δ ≤ 65%/70%` de cada débito, cada débito paga pelo menos 35%/30% do seu total. |
| Entrada | Calculada sobre o **total do contencioso antes do desconto**. Fazendário: 10% (A/B); 5% (C/D); **10% só para Demais PJ C/D que escolhe a opção com PF/BCN**. Previdenciário: sempre 5%. Piso: a entrada nunca é menor que uma parcela mínima (R$ 200 PN, R$ 300 demais). |
| Parcelas da entrada | `mín(L, ⌊E ÷ mín⌋)`. No fazendário, L = 5 para Demais PJ C/D e 10 nos demais casos. No previdenciário, L = 10 sempre. |
| PF/BCN | Só para ME/EPP e Demais PJ com rating C/D, nos dois formulários. Limite = `30% × (saldo após descontos − entrada)`. Aplicado = `mín(limite, PF×alíq% + BCN×alíq%)`: **um valor acima do limite é aceito e cortado em silêncio**. |
| Saldo e parcelas | `mín(L, ⌊saldo ÷ mín⌋)`. No fazendário: 74 (A/B), 135 (PN/óbito/ME-EPP C/D), 115 (Demais PJ C/D). No previdenciário: 50 sempre. Cada parcela vale `saldo ÷ n`. Sem `máx(1, …)`: se o saldo for menor que a parcela mínima, o formulário quebra. |
| Rede | **Nenhuma requisição de cálculo.** Em 23 sessões houve 768 requisições, todas GET de arquivos estáticos (0 POST, 0 XHR/fetch). O PDF é gerado no navegador (html2canvas + jsPDF) e traz os dados em JSON no metadado `/Keywords`. |
| Igual ao simulador? | Coincide em A/B, em D com débitos "homogêneos" e em PN. **Diverge em 8 regras**, listadas na §4.3: desconto por débito × agregado; Demais PJ falida 65% × 70%; CAPAG 0; entrada de ME/EPP com PF 5% × 10%; PF acima do limite cortado × rejeitado; entrada previdenciária de Demais PJ em 10x × 5x; piso da entrada; saldo menor que a parcela mínima. Há ainda pequenos arredondamentos. |

---

## 1. Fluxo dos formulários

As seções estão em `fazendarios.html`. A ordem do array `.secao` define o que `reiniciarFormulario` limpa: tudo o que vem **depois** do elemento clicado.

| # | Seção (id) · HTML | Campos | Ação → função (negocio-faz.js) |
|---|---|---|---|
| 1 | `id-identificacao-do-contribuinte` · 261-297 | rádio: Pessoa Natural (`op-1`), PN com indicativo de óbito (`op-2`), "ME, EPP, Santas Casas, Cooperativas, OSC (Lei 13.019) ou instituições de ensino" (`op-3`), Demais PJ (`op-4`) | `reiniciarFormulario` (224-285) + `identificacaoContribuinte` (95-129): define `valorMinimo` = 200 (PN e óbito) ou 300 (demais) e abre um modal com esse valor. Óbito ⇒ `isRatingD`. |
| 2 | `id-opcoes-contribuintes` · 300-320 (só op-3/op-4) | checkboxes "Falidos, em recuperação judicial…" (`falido`), "Baixado/Inapto/Suspenso…" (`baixado`), "integra grupo econômico" | `definirCondicaoContribuinte` (132-171): `isRatingD = óbito ∨ falido ∨ baixado ∨ RJ` (170). Grupo econômico só abre um modal (162-167) e não muda nenhum cálculo. Marcar falido ou baixado **apaga a tabela de débitos** (252-264). |
| 3 | `id-detalhamento-creditos-tributarios` · 323-359 | linhas com Nº processo, Principal, Multa, Juros e Total (somente leitura); botões "Incluir novo débito" e "Confirmar total de débitos" | `incluirNovoDebito` (179-209), `handleValidarProcesso` → `validarProcesso` (utils 77-147), `verificarProcessoUnico` (307-322), `calcularValorTotalProcesso` (334-351), `recalcularTotalGeral` (355-365), `confirmarTotalDebitos` (368-419) |
| 4 | `id-classificacao-debitos` · 362-448 | Total de débitos (somente leitura), Total a transacionar (somente leitura), **Valor total da dívida na PGFN e RFB\***, **Capacidade de pagamento em 60 meses\***, Relação, Desconto teórico, Rating; botão "Selecionar modalidade" | `calcularRating` (428-486) no `change` dos dois campos; `selecionarModalidade` (489-564) |
| 5 | `id-modalidade-transacao` · 451-637 | rádios por perfil e rating (tabela abaixo) | sem PF: `reiniciarFormulario` + `popularTabelaDescontos` (só C/D) + `popularTabelaEntrada` + `popularTabelaRestante`. Com PF: só exibe a seção 6. |
| 6 | `id-detalhamentos-pf-bcn` · 640-694 | montante e alíquota de PF; montante e alíquota de BCN (alíquota inteira 0–100%); botão "Prosseguir" | `prosseguir` (1726-1760) → descontos, entrada, `popularTabelaPrejuizoFiscal` (1764-1809), restante |
| 7 | `id-detalhamentos-descontos` · 697-722 | tabela por processo: principal, multa, juros, total, **desconto máximo permitido**, (oculto) desconto calculado, **desconto obtido**, saldo devedor | `popularTabelaDescontos` (569-652) |
| 8 | `id-detalhamento-entrada` · 725-747 | Total devido, Entrada, **Nº parcelas (seletor)**, Valor da parcela, Código DARF "1124" | `popularTabelaEntrada` (656-1439), `calcularMaximoParcelasEntrada` (1443-1715), `calcularValorParcelasEntrada` (1718-1721, no `change` do seletor) |
| 9 | `id-detalhamento-utilizacao-pf-bcn` · 750-771 | Saldo devedor, Limite 30%, Abatimento proposto, Abatimento aplicado, Saldo a pagar | `popularTabelaPrejuizoFiscal` |
| 10 | `id-detalhamento-restante` · 774-801 | Critério ("Até N meses"), Saldo a pagar, **Nº parcelas (seletor)**, Valor da parcela, DARF "1124"; avisos sobre vencimento e Selic | `popularTabelaRestante` (1814-2388), `calcularMaximoParcelasRestante` (2392-2594), `calcularValorParcelasRestante` (2598-2601) |
| 11 | `id-btn-gerar-documento` · 804-813 | botão "Gerar Documento" | `gerarDocumento` (utils 533-711) |

**Rádios da seção 5** (o texto do item do edital vem do `<label>`). O fazendário usa os itens 6.1, 6.2 e 6.4; o previdenciário usa 6.3 e 6.5 (§3).

| Perfil | Rating A/B | Rating C/D sem PF | Rating C/D com PF |
|---|---|---|---|
| PN (`id-ab/cd-pessoa-natural`) | 6.4: 10% em 10x + 74 | 6.2: 5% em 10x + 135 | não há |
| PN óbito (`id-d-pessoa-obtito`) | rating sempre D | 6.2: 5% em 10x + 135 | não há |
| ME/EPP… sem falência (`id-ab/cd-me-epp-not-check`) | 6.4 | 6.2 | 6.2: mín. **5%** em 10x, PF ≤ 30%, 135 |
| ME/EPP… falida ou baixada (`id-d-me-epp-check`) | rating sempre D | 6.2 | 6.2 com PF |
| Demais PJ sem falência (`id-ab/cd-demais-pj-no-check`) | 6.4 | 6.1-I: 5% em **5x** + 115 | 6.1-II: mín. **10%** em 5x, PF ≤ 30%, 115 |
| Demais PJ falida ou baixada (`id-d-demais-pj-check`) | rating sempre D | 6.1-I | 6.1-II |

Os dois seletores de parcelas começam sempre em **"1 parcelas"**, o que equivale a pagamento à vista. O usuário escolhe de 1 até o máximo.

**Validações e mensagens.** Todas foram observadas nas sessões E01, E01b e E03.

| Gatilho | Mensagem | Onde |
|---|---|---|
| Escolher o tipo | "O valor mínimo de qualquer parcela (entrada ou valor restante) para … é de R$200,00 / R$300,00" | 111-127 |
| Processo com tamanho diferente de 15 ou 17 dígitos, ou 17 dígitos com DV errado (o campo é limpo) | "Número do processo inválido! O número do processo deve conter 15 ou 17 dígitos." | 302; utils 77-147. Com 15 dígitos **não há DV**: a máscara é `NNNNN.NNNNNN/NN-NN`. Com 17 dígitos o DV é módulo 11, com pesos 2..16 e depois 2..17. |
| Processo repetido em outra linha (o campo é limpo) | "O número do processo informado já existe em outra linha…" | 317 |
| Valor sem dígitos (campo vazio, "-", letras) | "Valor inválido! Valor deve ser numérico e maior ou igual a zero." | 329; utils 237-249 |
| Total da linha acima de R$ 50 milhões (o total é limpo) | "Esta modalidade não se aplica a valores acima de R$ 50.000.000,00 por contencioso." | 343-346 |
| Confirmar sem linhas | "Insira pelo menos um débito para prosseguir." | 371 |
| Confirmar com campo vazio | "Exclua linhas vazias e preencha todos os campos antes de prosseguir!" | 417 (o código grava em `mensaagem=`, com erro de digitação; não faz diferença) |
| Total **de um débito** abaixo de R$ 10 | "Esta transação não é possível, pois o valor total dos débitos deve ser, no mínimo, de R$ 10,00 (DARF)." | 379-386 (`valorMinimoDarf = 10`, l. 38) |
| Soma de linhas com o **mesmo** processo acima de 50M | "O processo X acumula o total de R$ …, que excede o limite…" | 388-408 |
| Dívida PGFN/RFB vazia | "O valor Total dos débitos não incluídos no contencioso administrativo fiscal deve ser preenchido" | 445 |
| "Selecionar modalidade" sem a dívida ou a CAPAG | "Preencha todos os campos antes de prosseguir!" | 562 |
| "Prosseguir" com PF vazio (só a partir do 2º clique; ver bug B6) | "Preencha todos os campos antes de prosseguir!" | 1750-1752 |
| Marcar grupo econômico | "Junto com o pedido de adesão deverá ser apresentado o reconhecimento expresso de que o contribuinte integra gupo econômico…" | 166 |
| Gerar Documento com sucesso | "Discriminativo gerado com SUCESSO… NÃO altere o conteúdo do documento gerado, pois pode ocasionar RECUSA automática do pedido. Anexe o documento ao requerimento…" | utils 697-703 |
| Gerar Documento com campo obrigatório vazio, inclusive em seção oculta | "Por favor preencha todos os campos obrigatórios" | utils 714-743 |

---

## 2. Fórmulas (formulário fazendário) com arquivo:linha

Notação: débito `i` com principal `Pᵢ`, multa `Mᵢ` e juros `Jᵢ`. `G` = "Valor total da dívida na PGFN e RFB". `K` = CAPAG. `mín` = parcela mínima (200 para PN e PN óbito; 300 para os demais). `⌊x⌋` = arredondar para baixo.

### 2.1 Conversões que mudam números (utils.js)

- **Máscara de moeda** (`validarValorNaoNegativo`, 237-249): `valor = dígitos ÷ 100`, ou seja, centavos inteiros. O sinal "-" é descartado. Se o campo não tiver nenhum dígito, o texto cru fica no campo (bug B10).
- `converterStringEmNumero` (1212-1228) remove **tudo que não for dígito ou vírgula**, inclusive o ponto, e troca a vírgula por ponto. Por isso `"157.81%"` vira **15781**. É esse o motivo da divisão por 10.000 no rating.
- `converterNumeroEmMoeda` (1248-1257) usa `toLocaleString('pt-BR', 2 casas)`. Os valores só são arredondados **na exibição**. Exceções relidas da tela (e portanto arredondadas a centavos): total de cada linha, total geral, total de débitos e o saldo após descontos (1450-1452).
- Alíquotas de PF/BCN (`validarPercentual`, 252-274): **inteiro de 0 a 100**, seguido de "%".

### 2.2 Totais

```
Tᵢ = Pᵢ + Mᵢ + Jᵢ                         (342)    bloqueia se Tᵢ > 50.000.000 (343)
T  = Σ Tᵢ        → #totalGeral → #totalDebitosTransacionar   (355-365, 414)
Validação: cada Tᵢ ≥ 10,00 (379-386); Σ Tᵢ do mesmo nº de processo ≤ 50M (388-408)
```

O limite de 50M é **por processo, não sobre a soma**. Na sessão E01, dois processos de 50M e 40M passaram juntos (90M).

### 2.3 Rating e desconto teórico (`calcularRating`, 428-486)

```
B = T + G                                                   (442-443)  "Total de débitos"
se K ∈ {"", "0", "0,00"}:  rel$ = String(B) + "%"           (450-451)
senão:                     rel$ = (100·B/K).toFixed(2) + "%" (453)
r = conv(rel$) / 10000      → na prática r = round(B/K; 4 casas)
                              com K = 0: r = (dígitos de B) / 10000   (ver bug B4)

rating = D                  se PN óbito ∨ falido ∨ baixado        (457-458, 170)
       = A se r ≤ 0,5 ; B se r ≤ 1 ; C se r ≤ 2 ; D caso contrário (460-468)

δmax = 0,65 se Demais PJ (falida ou não) ; 0,70 caso contrário    (472-476)

δ$ = "0,00%"                         se A ou B                     (479-480)
   = (100·δmax).toFixed(2)+"%"       se D                          (481-482)
   = (100·δmax·(r − 1)).toFixed(2)+"%"   se C                      (483-484)
δ  = parseFloat(δ$)/100   → δ arredondado a 0,01 ponto percentual (572)
```

Exemplos medidos em E02 e no cenário F03:

- B = 3.381.481,35 e K = 2.111.111,11 dão `rel$ = "160.18%"`, r = 1,6018 e δ = 0,7 × 0,6018 = 42,126%, exibido como **"42.13%"**.
- O motor, sem arredondar, usa r = 1,601754 e δ = 42,1228%.

### 2.4 Desconto (só rating C/D; `popularTabelaDescontos`, 569-652)

```
para cada débito i:
  Dmaxᵢ  = Mᵢ + Jᵢ                     "Desconto máximo permitido"   (604)
  Dcalcᵢ = Tᵢ · δ                      coluna oculta "Desconto calculado" (605)
  Daplᵢ  = mín(Dmaxᵢ ; Dcalcᵢ)         "Desconto obtido"             (606)
  Sᵢ     = Tᵢ − Daplᵢ                  "Saldo devedor"               (607)
S = Σ Sᵢ   (linha Total, id saldo-devedor-apos-descontos; relida arredondada a centavos em 1450-1452)
```

- O desconto é **por processo**. O texto da tela confirma isso: "…observado o limite de até X% sobre o valor total de **cada crédito** objeto da negociação" (524, 528, 532, 542, 547, 557).
- **Piso de pagamento**: `Sᵢ ≥ (1 − δmax)·Tᵢ ≥ 35% (Demais PJ) ou 30% (demais perfis) de Tᵢ`. Não existe outra verificação além dessa.
- Rating A/B: a tabela de descontos não é criada, e o saldo usado é `T`.

### 2.5 Entrada (`calcularMaximoParcelasEntrada`, 1443-1715; exibição em `popularTabelaEntrada`)

```
p   = 10%  se A/B                                   (1457, 1517, 1617)
    = 10%  se Demais PJ C/D e escolheu o rádio "com PF" (1657, 1697)
    = 5%   nos demais C/D (PN, óbito, ME/EPP com ou sem PF, Demais PJ sem PF)
E0  = T · p                     (T = total do contencioso ANTES do desconto)
E   = máx(E0 ; mín)             piso = parcela mínima      (1458-1460 e repetições)
L_E = 5  se Demais PJ C/D (com ou sem PF, falida ou não)   (1644, 1664, 1684, 1704)
    = 10 nos demais casos
n_E,máx = mín(L_E ; ⌊E ÷ mín⌋)  (o "if" seguinte é redundante)
valor da parcela da entrada = E ÷ n_E    (1720; n_E escolhido no seletor, padrão 1)
saldo após entrada = T − E (A/B)  |  S − E (C/D)        (1461 | 1481…)
```

Na tabela, a célula "Entrada (R$)" mostra `T·p` **sem o piso** (719, 762, 808, 851…). A exceção é PN A/B, que mostra `E` (677). Por isso, em dívidas pequenas, a tela mostra uma entrada e calcula com outra (bug B3).

### 2.6 PF/BCN (`popularTabelaPrejuizoFiscal`, 1764-1809)

```
X          = S − E                                       "Saldo Devedor"        (1787)
limite     = 0,30 · X                                    "Limite PF/BCN (30%)"  (1788)
proposto   = PF·aPF/100 + BCN·aBCN/100                   "Abatimento proposto"  (1789)
aplicado   = mín(limite ; proposto)                      "Abatimento aplicado"  (1790)
R          = X − aplicado                                "Saldo a pagar"        (1791)
```

- Só é oferecido quando o rating é C/D e o contribuinte é ME/EPP ou Demais PJ: os rádios `*-check2` / `*-no-check2` só existem nesses blocos (HTML 539, 565, 604, 630).
- O valor de PF/BCN **não muda a entrada**. A entrada depende só do rádio escolhido.

### 2.7 Saldo e parcelas (`popularTabelaRestante` 1814-2388; `calcularMaximoParcelasRestante` 2392-2594)

```
R = T − E (A/B, 1823/1953/2172) | S − E (C/D sem PF, 1865/1909/1997/2041/2215/2303) | X − aplicado (com PF, 2085/2129/2259/2347)
L_R = 74 (A/B) | 135 (PN, óbito, ME/EPP C/D) | 115 (Demais PJ C/D)
se R ≤ 0: a linha não é criada
n_R,máx = mín(L_R ; ⌊R ÷ mín⌋)     sem máx(1, …): se R < mín, n_R,máx = 0 → TypeError (bug B2)
parcela = R ÷ n_R    (2600; n_R escolhido no seletor, padrão 1 = R à vista)
```

- Não há ajuste de última parcela nem arredondamento além da exibição: `n·parcela` pode diferir de `R` em centavos.
- As parcelas são nominais. A Selic + 1% só aparece como aviso de texto (HTML 798).

### 2.8 Resumo por perfil (fazendário)

| Perfil / rating | δmax | Desconto | Entrada | n_E máx | Saldo | n_R máx |
|---|---|---|---|---|---|---|
| PN A/B (6.4) | — | 0 | 10%·T (mín. 200) | ≤10 | T−E | ≤74 |
| PN C/D (6.2) | 70% | por débito | 5%·T (mín. 200) | ≤10 | S−E | ≤135 |
| PN óbito (sempre D) | 70% | por débito | 5% | ≤10 | S−E | ≤135 |
| ME/EPP… A/B (6.4) | — | 0 | 10% (mín. 300) | ≤10 | T−E | ≤74 |
| ME/EPP… C/D, falida ou baixada (6.2) | 70% | por débito | 5% | ≤10 | S−E | ≤135 |
| ME/EPP… C/D com PF (6.2) | 70% | por débito | **5%** | ≤10 | S−E−PF | ≤135 |
| Demais PJ A/B (6.4) | — | 0 | 10% | ≤10 | T−E | ≤74 |
| Demais PJ C/D, falida ou baixada (6.1-I) | **65%** | por débito | 5% | **≤5** | S−E | ≤115 |
| Demais PJ C/D com PF (6.1-II) | 65% | por débito | **10%** | ≤5 | S−E−PF | ≤115 |

### 2.9 PDF "discriminativo" (utils.js 533-711, 887-1063)

- Gerado com jsPDF em paisagem, 1920×1080 px. Cada página é um JPEG feito pelo html2canvas (escala 2) das seções visíveis `.paginaN`, de 1 a 9. As tabelas de débitos e de descontos são quebradas a cada 10 linhas.
- Medido: o cenário F01 gerou 6 páginas, o F06 9 páginas e o P01 7 páginas.
- Nome do arquivo: `DISCRIMINATIVOTRANSACAODEBITOSFAZENDARIOS.pdf` ou `…PREVIDENCIARIOS.pdf`.
- **O JSON com todos os campos vai embutido em `/Keywords`** (`gerarJSON`). Ele inclui `identificacao_documento` = `SUARA_CORAT_TRANSACAO_FAZENDARIOSATE50MILHOES_2026` ou `…PREVIDENCIARIOSATE50MILHOES_2026`, `versao` 1.0 e `data-de-criacao`. Também inclui a coluna oculta `desconto_calculado`, tags `<strong>` nos totais e seções ocultas (PF vazio).
- O conteúdo foi conferido extraindo esse JSON dos 3 PDFs e lendo as imagens das páginas de desconto e de PF do F06: os valores são os mesmos da tela.
- Antes de gerar, `prepararPdf` valida **todas** as seções `.toPdf`, inclusive as ocultas (ver bug B7).

---

## 3. Diferenças entre o previdenciário e o fazendário (todas)

Obtidas pelo `diff` de `negocio-faz.js` × `negocio-pre.js` (≈275 linhas) e de `fazendarios.html` × `previdenciarios.html`.

| # | Regra | Fazendário | Previdenciário (negocio-pre.js / previdenciarios.html) |
|---|---|---|---|
| 1 | Entrada A/B | 10% | **5%** (1464, 1524, 1628). Item **6.5** (HTML 467, 517, 583). |
| 2 | Entrada C/D sem PF | 5% | 5% (sem mudança). Item **6.3** (HTML 484, 502, 536, 563, 602, 628). |
| 3 | Entrada Demais PJ C/D com PF | 10% | **5%** (1668, 1708; exibição 1226, 1319, 1412) |
| 4 | Máximo de parcelas da entrada para Demais PJ C/D | 5 | **10** (1655, 1675, 1695, 1715). Todos os perfis ficam com 10. |
| 5 | Máximo de parcelas do saldo | 74 / 135 / 115 | **50 em todos os casos** (2410…2590); critério "Até 50 meses" (1837…2362) |
| 6 | Rating, δmax (65/70), desconto por débito, PF 30%, piso da entrada, parcelas mínimas 200/300 | — | **iguais** (`calcularRating` 437-495 sem mudança de regra; `popularTabelaDescontos` 578; `popularTabelaPrejuizoFiscal` 1775, limite 1799) |
| 7 | PF/BCN disponível | ME/EPP e Demais PJ, rating C/D | igual (o rótulo 6.3 menciona PF ≤ 30%) |
| 8 | Rádios A/B de ME/EPP e Demais PJ | `onclick="reiniciarFormulario(this), popularTabelaEntrada…"` | **sem `reiniciarFormulario`** (HTML 516, 582): cada clique duplica as linhas (bug B8) |
| 9 | PN A/B: cabeçalho da tabela de entrada | alterna para "Total devido" (671-672) | as duas linhas foram removidas: o cabeçalho "antes dos descontos" fica de um uso anterior (bug B9) |
| 10 | Checkbox de recuperação judicial (inexistente no HTML) | `recuperacaoJudicialCheckbox.checked` (140) | protegido com `?.` / `if (…)` (144-161). Não muda nada: o checkbox não existe em nenhum dos dois. |
| 11 | CAPAG zero | `capag == '0,00'` | `capag === '0,00'` (459). Mesmo efeito. |
| 12 | Nome do PDF e id no JSON | `…FAZENDARIOS.pdf`, `…FAZENDARIOSATE50MILHOES_2026` | `…PREVIDENCIARIOS.pdf`, `…PREVIDENCIARIOSATE50MILHOES_2026` |
| 13 | Variável não usada | — | `divDemaisOpcoesContribuintes` (8, 76) |
| 14 | Linha duplicada em `popularTabelaPrejuizoFiscal` | `saldoDevedorAposPf = …` repetida (1794) | removida. Mesmo efeito. |
| 15 | Código do DARF exibido | "1124" | **também "1124"** (HTML 167, 197, igual). Não verifiquei se é o código correto para contribuição previdenciária. |
| 16 | HTML | `<div class="row">` da identificação não é fechada | fechada (HTML 297-298); títulos e legendas trocados para "Previdenciários" |

Resumo da regra previdenciária: rating, desconto e PF iguais aos do fazendário; **entrada de 5% em até 10x para todos**; **saldo em até 50 parcelas**. Isso confere com a tabela oficial (6.3: 5% em até 10 vezes, até 50, PF até 30%; 6.5: 5% em até 10 vezes, até 50, sem PF).

---

## 4. Cenários: formulário × réplica × motor

### 4.1 Prova de que as fórmulas extraídas reproduzem os formulários

**Cenários de interface.** Os 18 cenários foram feitos com cliques e digitação reais e comparados em 16 campos cada: rating, relação, δ, desconto total, saldo após desconto, entrada exibida, máximo e valor das parcelas da entrada, limite, proposto e aplicado do PF, saldo a parcelar, máximo, quantidade e valor das parcelas do saldo. O resultado foi **288 de 288 valores idênticos à réplica**, incluindo os casos-limite F12 e F13.

**Rating.** Nas 16 combinações dívida/CAPAG de E02 (CAPAG 0 e fronteiras), o rating e o δ exibidos são idênticos aos da réplica.

**Fuzz com os handlers oficiais** (`fuzz.js`, gravado em `fazendarios-fuzz-funcoes-oficiais`):

- **Fazendário: 150 de 150 casos idênticos à réplica**, em todos os 13 campos comparados.
- Cobertura:
  - 378 débitos;
  - perfis: PN 41, PN óbito 31, ME/EPP 31 + 10 falida ou baixada, Demais PJ 22 + 15 falida ou baixada;
  - ratings: A 9, B 14, C 29, C com PF 14, D 57, D com PF 27;
  - 5 casos com CAPAG 0;
  - 105 trocas do número de parcelas da entrada e 133 do saldo, escolhidas com clique real no seletor;
  - 5 casos com saldo menor que a parcela mínima, que deram os 5 TypeErrors do bug B2.
- Rede no fuzz: 20 GETs, 0 não-GET.
- Os casos variam de dívida de R$ 2 mil a R$ 25 milhões por débito, com centavos aleatórios.

**Previdenciário: o fuzz não rodou.** Depois de cerca de 25 sessões (3 delas gerando PDF, com 85 a 130 GETs cada), o caminho `…/formularios/…/transacao-2026/` passou a responder `ERR_CONNECTION_RESET`, tanto no Chrome quanto no curl. A raiz `www.gov.br` continuou respondendo 301, o que indica um provável bloqueio por volume. Não insisti.

A cobertura do previdenciário são os 5 cenários de interface (P01–P05) mais a sessão E04, todos idênticos à réplica. As funções de cálculo do previdenciário são as mesmas do fazendário, com as constantes trocadas listadas na §3.

### 4.2 Tabela formulário × motor

O motor foi chamado com `modo: 'POR_DEBITO'` e os mesmos débitos, CAPAG e dívida, mais `escolhas.RFB_GERAL_50M = {opcao, parcelas, parcelasEntrada, valorPfBcn}`. As parcelas são as escolhidas na tela. `valorPfBcn` recebeu o **abatimento aplicado pelo formulário**; a variante com o valor proposto está comentada.

Legenda: **=** igual; **≈** só arredondamento; **≠** regra diferente. "Form" vem da tela (gravação); "Motor" vem de `simular()`.

| Cenário (gravação) | Entradas | Item | Form | Motor | |
|---|---|---|---|---|---|
| **F01** PN, A, 2 débitos, PDF | 105.000 (m+j 25.000) + 50.000 (m+j 10.000); G 45.000; K 500.000 → r 0,40 | desconto · entrada · saldo · parcelas | 0 · 15.500 (10× 1.550,00) · 139.500 (74× 1.885,14) | idem | = |
| **F02** ME/EPP, B, troca de parcelas 7/30 → 4/60 | 400.000 (m+j 100.000); G 350.000; K 1.000.000 → r 0,75 | entrada · saldo | 40.000 (4× 10.000) · 360.000 (60× 6.000) | idem | = |
| **F03** ME/EPP, C, 3 débitos | 1.000.000 (m+j 600.000) + 1.000.000 (m+j 50.000) + 181.481,35 (m+j 58.024,57); G 1.200.000; K 2.111.111,11 | δ | 42.13% | 42,1228% | ≈ |
| | | desconto | **529.324,57** (421.300 + 50.000 + 58.024,57) | **708.024,57** | ≠ |
| | | saldo após desconto / entrada | 1.652.156,78 / 109.074,07 (7× 15.582,01) | 1.473.456,78 / idem | ≠ / = |
| | | saldo a parcelar (100x) | 1.543.082,71 → **15.430,83** | 1.364.382,71 → **13.643,83** | ≠ |
| **F04** ME/EPP, C, **com PF** | 1.000.000 (m+j 500.000); G 600.000; K 1.000.000 → r 1,6 (δ 42%); PF 300.000×25% + BCN 200.000×9% = 93.000 | desconto | 420.000 | 420.000 | = |
| | | entrada (10x) | **50.000** (5.000) | **100.000** (10.000) | ≠ |
| | | limite PF / aplicado | 159.000 / 93.000 | 144.000 / 93.000 | ≠ |
| | | saldo (135x) | 437.000 → **3.237,04** | 387.000 → **2.866,67** | ≠ |
| **F05** Demais PJ, C | 4.000.000 (m+j 2.000.000) + 1.580.000 (m+j 80.000); G 4.000.000; K 6.000.000 | δ | 38.79% | 38,7833% | ≈ |
| | | desconto | **1.631.600** | **2.080.000** | ≠ |
| | | entrada | 279.000 (5× 55.800) | idem | = |
| | | saldo (115x) | 3.669.400 → 31.907,83 | 3.221.000 → 28.008,70 | ≠ |
| **F06** Demais PJ, D, com PF acima do limite, PDF | 5.500.000 (m+j 2.500.000) + 960.000 (m+j 160.000); G 3.000.000; K 2.500.000 → r 3,784; PF 4.000.000×25% + BCN 1.000.000×9% = 1.090.000 | desconto · entrada | 2.660.000 · 646.000 (3× 215.333,33) | idem | = |
| | | PF (limite / proposto / aplicado) | 946.200 / 1.090.000 / **946.200** | com 946.200 informado: igual | = |
| | | saldo (80x) | 2.207.800 → 27.597,50 | idem | = |
| | | mesmo cenário informando ao motor o **proposto** 1.090.000 | aceito e cortado para 946.200 | **rejeitado**: "Informe um valor entre R$ 0,00 e R$ 1.043.100,00"; PF 0; entrada 323.000; saldo 3.477.000 → 43.462,50 | ≠ |
| **F07** Demais PJ **falida** | 2.500.000 (m+j 2.000.000); G 100.000; K 10.000.000 (r 0,26, mas D forçado) | δ | **65%** | **70%** | ≠ |
| | | desconto | 1.625.000 | 1.750.000 | ≠ |
| | | entrada | 125.000 (5× 25.000) | idem | = |
| | | saldo (115x) | 750.000 → 6.521,74 | 625.000 → 5.434,78 | ≠ |
| **F08** ME/EPP **baixada**, com PF | 400.000 (m+j 200.000); G 0; K 5.000.000 (D forçado); PF 100.000×15% + BCN 50.000×9% = 19.500 | desconto | 200.000 | 200.000 | = |
| | | entrada | **20.000** (10× 2.000) | **40.000** (10× 4.000) | ≠ |
| | | limite PF | 54.000 | 48.000 | ≠ |
| | | saldo (135x) | 160.500 → 1.188,89 | 140.500 → 1.040,74 | ≠ |
| **F09** PN óbito | 100.000 (m+j 50.000); K 1.000.000 (D forçado) | tudo | 50.000 · 5.000 (10× 500) · 45.000 (135× 333,33) | idem | = |
| **F10** PN, C | 100.000 (m+j 30.000); G 50.000; K 100.000 → r 1,5 (δ 35%) | tudo | 30.000 · 5.000 (10× 500) · 65.000 (135× 481,48) | idem | = |
| **F11** Demais PJ, **CAPAG 0** | 1.500.000 (m+j 500.000); G 500.000; K 0 | rating / δ | **D / 65%** (relação "2000000%") | **A / 0** | ≠ |
| | | desconto · entrada | 500.000 · 75.000 (máx. 5x) | 0 · 150.000 (máx. 10x) | ≠ |
| | | saldo | 925.000 (máx. 115; 115× 8.043,48) | 1.350.000 (máx. 74; 74× 18.243,24) | ≠ |
| **F12** ME/EPP, D, dívida pequena | 4.000 (m+j 2.000); K 100 | desconto | 2.000 | 2.000 | = |
| | | entrada | **300** (tela mostra **200,00**; 1× 300) | 200 (1× 200, abaixo do mínimo) | ≠ |
| | | saldo | 1.700 (máx. **5**) | 1.800 (máx. **6**) | ≠ |
| **F13** ME/EPP, D, saldo menor que a parcela mínima | 1.000 (m+j 500); K 100 | entrada | 300 (tela: 50,00) | 50 | ≠ |
| | | saldo | 200, **0 opções + TypeError** | 450 (1× 450) | ≠ |
| **P01** previdenciário, Demais PJ, C, PDF (mesmos débitos de F05) | idem F05 | desconto | 1.631.600 | 2.080.000 | ≠ |
| | | entrada | 279.000, **máx. 10x** (10× 27.900) | máx. **5x** (5× 55.800) | ≠ |
| | | saldo (50x) | 3.669.400 → 73.388,00 | 3.221.000 → 64.420,00 | ≠ |
| **P02** previdenciário, ME/EPP, A | 115.000; G 85.000; K 1.000.000 | entrada · saldo | 5.750 (10× 575) · 109.250 (50× 2.185) | idem | = |
| **P03** previdenciário, Demais PJ, D, com PF (mesmo de F06) | idem F06 | entrada | 323.000 (5%), máx. **10x** | 323.000, máx. **5x** | = / ≠ |
| | | PF | limite 1.043.100, proposto 1.090.000, aplicado 1.043.100 | com 1.043.100: igual; com 1.090.000: **rejeitado** | = / ≠ |
| | | saldo (50x) | 2.433.900 → 48.678,00 | idem (informando o aplicado) | = |
| **P04** previdenciário, PN, B | 25.000; G 50.000; K 100.000 → r 0,75 | entrada · saldo | 1.250 (máx. 6; 6× 208,33) · 23.750 (50× 475) | idem | = |
| **P05** previdenciário, ME/EPP falida | 600.000 (m+j 300.000); K 9.000.000 (D forçado) | tudo | 300.000 · 30.000 (10× 3.000) · 270.000 (50× 5.400) | idem | = |

No cenário F11, o motor limita a escolha a 74 parcelas, o máximo de A/B.

### 4.3 Por que diverge (regra por regra)

| # | Divergência | Formulário | Motor (`motor-calculo.js`) | Cenários e impacto |
|---|---|---|---|---|
| D1 | **Desconto por débito × agregado** | `Σ mín(Mᵢ+Jᵢ ; δ·Tᵢ)` (negocio-faz.js:604-606) | `mín(δ·ΣTᵢ ; Σ(Mᵢ+Jᵢ))` (`calcularResultadoRfb50Milhoes`, l. 409) | Diverge quando há débitos com acessórios acima e abaixo de δ. O motor dá **sempre ≥** (soma dos mínimos ≤ mínimo das somas). F03: +178.700,00. F05/P01: +448.400,00. |
| D2 | **δmax de Demais PJ falida ou baixada** | 65% (472-476: só olha `isdemaisPJ`) | 70% (`obterClassificacaoPorBase`, l. 242-245) | F07: desconto +125.000. O formulário bate com a página oficial: o grupo de 70% não inclui "falida". |
| D3 | **CAPAG = 0 ou vazia** | relação = número `B` lido como %, o que costuma dar D (F11) mas também A/B/C conforme a magnitude e os centavos (E02) | relação = 0, rating A (l. 233) | F11: o formulário dá desconto de 500.000 e entrada de 5% em 5x/115; o motor dá 0, 10% e 74. |
| D4 | **Entrada com PF de ME/EPP (e falida ou baixada)** | 5% (1577, 1597; edital 6.2 "no mínimo 5%") | 10% sempre que houver PF fazendário > 0 (`obterPercentualEntradaFazendariaRfb50m`, l. 334-336) | F04 e F08: entrada em dobro e limite de PF menor no motor. |
| D5 | **PF acima do limite** | aceito e cortado: `mín(limite, proposto)` (1790) | rejeitado se `valor > limite` (limite calculado com a entrada de 5%), e o PF fica 0 (`aplicarPfBcnRfb50m`, l. 951) | F06/P03 com 1.090.000. Além disso, no formulário a entrada de 10% da Demais PJ vem do **rádio** "com PF", mesmo com PF 0 (E03); no motor, só se PF > 0. |
| D6 | **Parcelas da entrada previdenciária para Demais PJ C/D** | até 10 (negocio-pre.js:1655-1715) | até 5, mesmo campo do fazendário (`obterLimiteParcelasEntradaRfb50m`, l. 390-392, aplicado às duas naturezas) | P01, P03. O edital 6.3 diz "5% em até 10 vezes", como o formulário. |
| D7 | **Piso da entrada** | `E = máx(T·p ; mín)` | sem piso: a parcela da entrada pode ficar abaixo de R$ 200/300 (n = máx(1, …)) | F12, F13. O formulário avisa: "valor mínimo de qualquer parcela (entrada ou valor restante)". |
| D8 | **Saldo menor que a parcela mínima** | n_R,máx = 0, a tela quebra (bug B2) | `máx(1, …)`: 1 parcela abaixo do mínimo (l. 394-397) | F13 |
| D9 | **Arredondamentos** | r a 4 casas e δ a 0,01 p.p. (toFixed); diferença em δ de até cerca de 0,01 p.p. | sem arredondar | F03, F05, P01 (≈). Quando δ é o limite efetivo, muda o desconto: por exemplo, 0,0072 p.p. × 1.000.000 = R$ 72. Na fronteira B/C (1 < r < 1,00005), o formulário dá **B** (10% e 74x) e o motor dá **C** (5% e 135/115x, δ≈0) (E02: K 999.990). |
| D10 | Padrão de parcelas | 1 (à vista) nos dois seletores | máximo | Não é uma diferença de cálculo. Nas comparações foram usadas as mesmas escolhas. |

**Iguais nos dois:**

- base do rating `T + G`;
- faixas A/B/C/D;
- fórmula de C `δmax·(r−1)`;
- rating D forçado para óbito, falida ou baixada;
- parcela mínima 200/300;
- limites 74/135/115 (fazendário) e 50 (previdenciário);
- entrada de 10% (A/B) e 5% (C/D) no fazendário e de 5% no previdenciário;
- limite de 5x para a entrada fazendária de Demais PJ C/D;
- limite de PF `30%·(S−E)`;
- PF não permitido para PN.

Com essas regras, o motor reproduziu **exatamente** F01, F02, F06 (com o PF aplicado), F09, F10, P02, P04 e P05.

---

## 5. Requisições de rede e eventos

Resumo das 23 sessões (`rede.js`):

| Sessões | Requisições | não-GET | XHR/fetch | Hosts | Eventos de UI | Chamadas JS registradas |
|---|---|---|---|---|---|---|
| 23 (18 cenários + E01, E01b, E02, E03, E04) | 768 | **0** | **0** | www.gov.br (272), cdngovbr-ds.estaleiro.serpro.gov.br (312), cdnjs.cloudflare.com (139), fonts.googleapis.com (45) | 3.488 | 5.446 |

- **No carregamento** (17 a 19 requisições): HTML, `core-min.css/js`, `utils.js`, `negocio-*.js`, html2canvas 1.4.1, jsPDF 2.5.1, fontes e logotipos.
- **Durante o preenchimento e o cálculo**: só 0 a 3 GETs de **fonte** carregada sob demanda (rawline-700, rawline-400i, fa-solid-900). **Nenhum dado digitado sai do navegador.** Nenhum POST, nenhum corpo de requisição, nenhum analytics.
- **"Gerar Documento"**: 85 a 130 GETs, porque o html2canvas clona o documento num iframe para cada página e busca de novo CSS, fontes e logos. São 6 vezes no F01 e 9 no F06, só estáticos. O PDF é salvo por download local; nenhuma requisição leva o PDF ou o JSON.
- Uma falha transitória de rede: `logo_govbr_branco.png net::ERR_NO_BUFFER_SPACE` (F02, no carregamento), do ambiente e não do site.

**Cadeia de chamadas registrada** (exemplo F03, `fazendarios-F03-…md`): o clique no rádio `radio-cd-me-epp-no-check1` dispara `reiniciarFormulario`, depois `popularTabelaDescontos` (com `converterStringEmNumero` de cada célula), `popularTabelaEntrada` → `calcularMaximoParcelasEntrada(2181481.35)` e `popularTabelaRestante` → `calcularMaximoParcelasRestante(…)`. Trocar o seletor dispara `calcularValorParcelasEntrada(<div.br-select>, 109074.0675)` e `calcularValorParcelasRestante`. O `change` da dívida ou da CAPAG chama `calcularRating`.

**Erros JS registrados:**

| Erro | Sessões |
|---|---|
| `selecionarModalidade: Cannot read properties of null (reading 'classList')` | F07, F08, P05 |
| `popularTabelaRestante: Cannot read properties of null (reading 'closest')` | F13 |
| `converterStringEmNumero: Valor inválido para conversão.` | E01, E01b |
| `modalComponente is not defined` | E01, ao apertar Ctrl+P |

---

## 6. Divergências e bugs dos formulários

| # | Bug ou comportamento estranho | Evidência | Código |
|---|---|---|---|
| B1 | ME/EPP ou Demais PJ falida ou baixada: `selecionarModalidade` lança TypeError ao procurar `#id-e-tb-principal-meep` / `#id-e-tb-principal-demais-pj`, que não existem. Restos de uma opção de recuperação judicial que não está no HTML. A modalidade aparece porque o erro ocorre depois. | F07, F08, P05; fuzz | faz 533-537, 548-552; pre 545, 560 |
| B2 | Saldo após entrada maior que 0 e menor que a parcela mínima: o seletor fica sem opções, `querySelector('#parcela-restante-1')` é nulo e dá TypeError. A linha mostra "Valor da parcela" = saldo, sem número de parcelas, e o botão "Gerar Documento" fica visível. | F13 | faz 1853 e repetições; 2392-2594 |
| B3 | A entrada exibida não tem o piso, mas o cálculo usa o piso. Exemplo: Entrada "200,00" com parcela 300,00, e saldo calculado com 300. Fica inconsistente no PDF. | F12 (200/300), F13 (50/300) | 719, 851… × 1458-1460 |
| B4 | **CAPAG 0 ou vazia** gera relação = `B` escrito como %. Com PN e débito de 3.000: dívida 1.000 dá "4000%", **A**; dívida 1.000,50 dá "4000.5%" = 4,0005, **D 70%**; dívida 6.000 dá **B**; dívida 13.000 dá **C 42%**. O rating depende dos centavos. | E02, F11 | 450-451 |
| B5 | Fronteiras arredondadas: K 999.990 (r real 1,00001) aparece como "100.00%", **B**; K 499.999 (r 2,000004) aparece como "200.00%", C (δ igual ao de D, 65%). | E02 | 453, 460-468 |
| B6 | No **1º "Prosseguir" com PF vazio** não há validação: os campos só ganham a classe `obrigatorio` dentro de `popularTabelaEntrada`. Resultado: abatimento 0 e entrada de 10% para Demais PJ. O 2º clique já bloqueia. | E03 | 887-890, 1206-1209… × 1750 |
| B7 | Escolher "com PF", depois voltar para "sem PF" e clicar em "Gerar Documento" dá **bloqueio permanente**: "Por favor preencha todos os campos obrigatórios". Os campos ocultos continuam obrigatórios e foram limpos, e `prepararPdf` valida também as seções ocultas. Só recarregar a página resolve. | E03 (nenhum download) | utils 714-743 |
| B8 | **Previdenciário**: clicar de novo no rádio A/B de ME/EPP ou Demais PJ **duplica** as linhas de entrada e saldo (IDs repetidos; seletores com 20 e 100 itens; 2ª linha com "1 parcela"). Elas iriam para o PDF. | P02 (clique repetido) | previdenciarios.html 516, 582 |
| B9 | **Previdenciário**: PN passa de C/D para A/B e o cabeçalho continua "Total devido **antes dos descontos**". | E04 | negocio-pre.js (linhas 671-673 da versão faz removidas) |
| B10 | Valor sem dígitos ("-", letras, campo apagado) abre o modal "Valor inválido!" e deixa o texto cru no campo. No `change`, `converterStringEmNumero` lança "Valor inválido para conversão." e o total da linha não é atualizado. Apagar o campo com Backspace também abre o modal. | E01, E01b | utils 237-249, 1212-1228; faz 339-341 |
| B11 | Linha acima de 50M: o total da linha é limpo, mas o **total geral não é recalculado** e fica com o valor antigo. O "Confirmar" ainda bloqueia por campo vazio. | E01b | 343-346 |
| B12 | O teto de 50M por processo pode ser burlado: o mesmo processo digitado com 15 dígitos (sem DV) e com 17 dígitos conta como dois processos. Números de 15 dígitos não têm nenhuma checagem de DV. | E01 (50M + 40M aceitos) | 307-322, 388-408; utils 77-88 |
| B13 | Ctrl+P lança `ReferenceError: modalComponente is not defined`. A impressão continua bloqueada pelo CSS `@media print`. | E01 | utils 1191-1207 |
| B14 | Marcar falido ou baixado **depois** de digitar os débitos apaga a tabela (2 linhas → 0) sem aviso. | E01 | 239-264 |
| B15 | O rótulo "Valor total da dívida na PGFN e RFB" é somado ao total do contencioso. Se o usuário seguir o rótulo e incluir o contencioso, a dívida é **contada duas vezes**. O modal de erro fala em "débitos não incluídos no contencioso". | código | HTML 389; faz 443, 445 |
| B16 | A regra do mínimo de "R$ 10,00 do valor total" é checada **por débito**. | código | 379-386 |
| B17 | Relação e δ aparecem com ponto decimal ("42.13%"), enquanto os valores em reais usam vírgula. "gupo econômico". Variável `mensaagem`. | todas | 453, 482-484, 166, 417 |
| B18 | DARF "1124" fixo nas duas telas, inclusive no previdenciário. Não verificado. | P01 | HTML 167, 197 |
| B19 | O botão "Confirmar total de débitos" não aparece antes de escolher o tipo. Trocar o tipo apaga a tabela. | E01 | 252-264 |

---

## 7. O que deve entrar no FORMULAS.md

Sugiro uma seção nova, **"§4-A RFB 50M: formulários oficiais do discriminativo (fazendarios.html / previdenciarios.html)"**. Esse é o documento anexado ao pedido de adesão e, por isso, a referência mais forte de "como a RFB calcula". A seção deve ter:

1. **Desconto por processo**: `Daplᵢ = mín(Mᵢ+Jᵢ ; δ·Tᵢ)`, `S = Σ(Tᵢ − Daplᵢ)`. Avisar que o motor agrega e superestima o desconto quando os débitos são heterogêneos (F03: +178.700; F05: +448.400).
2. **δmax = 65% para toda Demais PJ**, inclusive falida ou baixada (o motor usa 70%). Atualizar o item 5 da §9 e a linha "PJ falida" da §11, que estão marcados "⚠️ não confirmado". O formulário oficial usa 65%.
3. **Arredondamentos**: `r = round(B/K, 4)` e `δ = round(100·δmax·(r−1), 2)/100`. Na fronteira, r = 1,00004 é B.
4. **CAPAG 0 ou vazia**: o formulário não dá A. Ele usa `r = dígitos(B)/10000`. Registrar como peculiaridade, já que o motor segue o outro site.
5. **Entrada**: `E = máx(T·p ; mín)`, com p = 10% (A/B), 5% (C/D) ou 10% (Demais PJ C/D com PF, fazendário). **ME/EPP com PF (inclusive falida ou baixada): 5%**; PN não tem opção de PF. No previdenciário, 5% em todos os casos. Parcelas da entrada: fazendário 5 (Demais PJ C/D) ou 10; **previdenciário 10 para todos**. Revisar as linhas 6.2 e 6.3 da §11: o formulário confirma o edital e contradiz o motor.
6. **PF/BCN**: `aplicado = mín(30%·(S−E), PF·a% + BCN·b%)`, sem rejeitar valor acima do limite. Disponível no previdenciário também. A entrada depende do rádio e não do valor.
7. **Parcelas**: `n_máx = mín(L, ⌊R/mín⌋)`, sem `máx(1, …)`; L = 74/135/115 (fazendário) e 50 (previdenciário); parcela = `R/n`, sem ajuste de centavos.
8. Santas Casas, cooperativas, OSC e instituições de ensino ficam **no mesmo rádio que ME/EPP** (op-3): 70%, 135x, entrada em 10x. Isso resolve o "➖" da §11.
9. Uma tabela-resumo por perfil, como a §2.8 e a §3 deste relatório.
10. Registrar que os formulários não fazem nenhuma chamada de rede: o cálculo e o PDF são 100% locais, e o JSON vai em `/Keywords` com o `identificacao_documento`.

---

## 8. O que não foi verificado / limitações

- **O que a RFB faz depois com o PDF**: se o JSON de `/Keywords` é relido, se o cálculo é refeito no servidor, como os números são conferidos. Os formulários não enviam nada; só o requerimento (outro sistema) recebe o PDF.
- Se o **DARF 1124** está correto para o previdenciário (ou para o fazendário).
- O caminho de **recuperação judicial**: há código, mas não há checkbox no HTML publicado, então ele é inalcançável. O mesmo vale para MEI como categoria própria (o formulário não tem).
- Correção pela Selic e regras do Simples Nacional: os formulários só mostram texto.
- Só testei no Chrome (playwright-core, headless). Não testei outros navegadores, leitores de tela nem a impressão real.
- Do PDF, verifiquei o JSON embutido dos 3 arquivos e olhei 2 imagens de página do F06 (descontos e PF). Não revisei visualmente todas as páginas.
- **O `motor-calculo.js` foi alterado por outra pessoa durante a análise**: duas vezes, às 22:21 e às 22:42 de 10/11/2026. `aplicarPfBcnRfb50m` ganhou o parâmetro `valorAnterior` e os textos de aviso mudaram. Recalculei a tabela da §4.2 com a versão das 22:42, e os números não mudaram, só os avisos. As linhas citadas do motor (233, 242, 334, 390, 394, 409, 951) são dessa versão e podem mudar.
- **Fuzz do previdenciário não executado**: o gov.br passou a recusar conexões (ver §4.1).

---

## Anexo: arquivos

**Gravações** (em `testes/saida/sessoes/`):

- `fazendarios-F01…F13-*.{json,md}` e `previdenciarios-P01…P05-*.{json,md}`
- validações e bugs: `fazendarios-E01-validacoes`, `fazendarios-E01b-validacoes-valores`, `fazendarios-E02-rating-capag-zero-e-limites`, `fazendarios-E03-pf-vazio-e-troca-para-sem-pf`, `previdenciarios-E04-cabecalho-e-reinicio`
- fuzz: `fazendarios-fuzz-funcoes-oficiais` (150 casos)
- sondagem inicial: `fazendarios-sonda`, `fazendarios-explorar`
- PDFs gerados: `fazendarios-F01-…-DISCRIMINATIVOTRANSACAODEBITOSFAZENDARIOS.pdf`, `fazendarios-F06-…pdf`, `previdenciarios-P01-…-DISCRIMINATIVOTRANSACAODEBITOSPREVIDENCIARIOS.pdf`

**Scripts** (em `analise-50m/`, pasta temporária da análise, fora do repositório):

| Script | O que faz |
|---|---|
| `driver.js` | controle da interface |
| `cenarios.js` | cenários F e P, com o motor |
| `especiais.js` | sessões E01–E04 |
| `modelo-formulario.js` | réplica executável das fórmulas |
| `comparar.js` | comparação tela × réplica × motor; gera `comparacao.txt/json` |
| `fuzz.js` | fuzz com os handlers oficiais |
| `rede.js` | resumo de rede e erros |
| `extrair-pdf.js` | extrai o JSON de `/Keywords` |

Os resultados ficam em `resultados/*.json`.
