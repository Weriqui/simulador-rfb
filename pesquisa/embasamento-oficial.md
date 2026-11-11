# Embasamento oficial das regras de cálculo: transação tributária na RFB

Conferência do [FORMULAS.md](../FORMULAS.md) (o que o "Simulador de Negociações" calcula) contra as perguntas frequentes, as páginas de modalidade e os roteiros oficiais da Receita Federal. Levantamento feito em 10/11/2026.

## 0. Fontes e siglas

| Sigla | Fonte | Arquivo de texto |
|---|---|---|
| **FAQ-S** | FAQ "Transação Tributária (Sobre)": a pergunta é citada entre aspas | `fontes-oficiais/paginas-texto/12a-faq-sobre.txt` |
| **FAQ-10 Pn** | FAQ "Edital de Transação por Adesão RFB nº 10/2026", pergunta n (20 perguntas) | `12b-faq-edital-10-2026.txt` |
| **FAQ-09 Pn** | FAQ "Edital de Transação por Adesão RFB nº 09/2026", pergunta n (34 perguntas) | `12c-faq-edital-09-2026.txt` |
| **PORTAL** | Página "Transação Tributária", cartões "Modalidades" | `02-transacao-tributaria.txt` |
| **PV** | Página "Transação de Pequeno Valor" | `03-pequeno-valor.txt` |
| **CG** | Página "Transação Contencioso Geral" (Edital 9/2026) | `04-contencioso-geral.txt` |
| **GT** | Página "Transação de Grandes Teses" (Editais conjuntos PGFN/RFB 4 e 5/2026) | `05-grandes-teses.txt` |
| **ROT-PV / ROT-50M / ROT-GT** | Roteiros em PDF "Como aderir" (pequeno valor, até R$ 50 milhões, grandes teses) | `13-roteiro-pequeno-valor.txt`, `13-roteiro-ate-50-milhoes.txt`, `13-roteiro-grandes-teses.txt` |
| **DISC-FAZ / DISC-PREV** | Discriminativo oficial de débitos do Edital 9 (fazendários / previdenciários), para o qual o ROT-50M remete no passo 7. Usado só como **fonte auxiliar**, para detalhes numéricos que a FAQ não explicita | `fontes-oficiais/formularios-2026/assets/js/negocio-faz.js`, `negocio-pre.js` |

Como as fontes foram obtidas:
- **FAQ-10 e FAQ-09:** abertas no Chrome pelo `testes/gravar-sessao.js` (sessões `testes/saida/sessoes/faq-edital-10.*` e `faq-edital-09.*`). Os acordeões (`a.toggle`) não responderam ao clique, mas as respostas já estavam no DOM (`div.conteudo`) e foram extraídas inteiras.
- **Roteiros:** baixados com `curl` simples, sem cabeçalhos alterados, em `…pdf/@@download/file` (HTTP 200). O texto deles é só procedimental. Por isso, as capturas de tela da **página 4** do ROT-PV (tela do e-CAC) e do ROT-50M (discriminativo preenchido) foram lidas visualmente, porque trazem números.

Legenda de status:
- **CONFIRMADA:** a fonte oficial diz o mesmo que o simulador.
- **DIVERGENTE:** o simulador calcula diferente da fonte oficial (com exemplo numérico rodado no motor `simulador-basico/motor-calculo.js`).
- **NÃO COBERTA:** regra oficial que o simulador ignora.
- **CONFLITO:** as próprias fontes oficiais se contradizem.
- **NÃO VERIFICÁVEL:** nenhuma das fontes lidas trata do item (ex.: Edital PGFN 06/2026).

---

## 1. Regras oficiais extraídas, por modalidade

### 1.1 Edital RFB nº 10/2026: pequeno valor

| # | Regra | Fonte |
|---|---|---|
| R10.1 | Podem aderir: pessoa natural, MEI, empresário individual, ME e EPP. | FAQ-10 P1, P10; PV |
| R10.2 | Limite de 60 SM **por processo administrativo** (R$ 97.260,00 em 2026). O valor é a soma de principal, multa de ofício e juros do processo, na data da adesão. O limite é verificado "individualmente para cada processo". | FAQ-10 P2, P7, P8; FAQ-09 P34; PV; FAQ-S "Quais débitos posso incluir" |
| R10.3 | Débitos em contencioso **ou ainda no prazo de impugnação**. Também entram processos de despacho decisório (DCOMP não homologada). | FAQ-10 P3, P4, P13, P15; PV |
| R10.4 | É obrigatório incluir **todos** os débitos do mesmo processo (inclusão parcial é vedada). | FAQ-10 P14 |
| R10.5 | Opções: I 50% em até 12x; II 40% em até 24x; III 35% em até 36x; IV 30% em até 55x. | FAQ-10 P10; PV; FAQ-09 P33; PORTAL |
| R10.6 | A redução incide sobre o **valor total** (principal, juros, multas e encargos). É "incondicionada" (não depende de CAPAG). | FAQ-10 P10; PV; FAQ-S "Como saber se a dívida…" |
| R10.7 | Não há entrada. A 1ª prestação deve ser paga até o último dia útil do mês da adesão (condição de deferimento). | FAQ-10 P10, P16; ROT-PV p.4 |
| R10.8 | Parcela mínima de R$ 200 para qualquer modalidade, com o nº de prestações "ajustado ao valor". | FAQ-10 P11; PV |
| R10.9 | Prestações acrescidas da **Selic acumulada** (do mês seguinte à consolidação até o mês anterior ao pagamento) **+ 1%** no mês do pagamento. | PV |
| R10.10 | Não prevê PF/BCN. | FAQ-S "Como utilizar prejuízo fiscal…"; PORTAL |
| R10.11 | Excluídos os débitos do Simples Nacional, exceto multa por atraso de obrigação acessória. | FAQ-10 P2; PV |
| R10.12 | Prazo de adesão: **30/10/2026, 20h59min59s** (FAQ-10 P6, FAQ-09 P33, PORTAL) **ou 30/12/2026, 20h59min59seg** (PV). Ver conflito C1. | — |
| R10.13 | Exemplo oficial do e-CAC: principal 186,12, multa 139,59, juros 248,82, total 574,53. A redução de 50% é aplicada **por componente** (93,06 + 69,79 + 124,41 = 287,26), o saldo é **287,27** e sai em **1 parcela**. | ROT-PV p.4 (captura) |
| R10.14 | DTE obrigatório. | FAQ-10 P9; ROT-PV |

### 1.2 Edital RFB nº 9/2026: contencioso geral até R$ 50 milhões

| # | Regra | Fonte |
|---|---|---|
| R9.1 | Podem aderir PF e PJ. Limite de **R$ 50 milhões por contencioso/processo**. | FAQ-09 P1, P2; CG; DISC-FAZ (soma por nº de processo) |
| R9.2 | O débito tem de estar **em contencioso** (impugnação, manifestação de inconformidade ou recurso). O prazo de impugnação em curso **não** basta. DCOMP só entra com manifestação apresentada. | FAQ-09 P3, P16, P19, P31 |
| R9.3 | Inclusão total do processo (inclusão parcial é vedada). | FAQ-09 P18 |
| R9.4 | Rating A/B/C/D por recuperabilidade, calculado a partir da CAPAG do Regularize (Portaria PGFN 6.757/2022). Faixas numéricas só aparecem no DISC-FAZ: relação ≤ 0,5 → A; ≤ 1 → B; ≤ 2 → C; > 2 → D. | FAQ-09 P5, P23, P24; FAQ-S "Como saber se a dívida…"; DISC-FAZ `calcularRating` |
| R9.5 | Irrecuperáveis (rating D) por situação: falido; recuperação judicial ou extrajudicial; liquidação judicial ou extrajudicial; intervenção; PJ baixada, inapta ou suspensa; PF com indicativo de óbito. | FAQ-09 P6; DISC-FAZ |
| R9.6 | Campo "Valor total da dívida na PGFN e na RFB": **não** incluir os débitos do contencioso, que entram em campo próprio e "são utilizados para a determinação do desconto". | FAQ-09 P17; FAQ-S (o desconto considera "o valor do crédito tributário efetivamente incluído") |
| R9.7 | O desconto considera a CAPAG, a recuperabilidade, o "desconto teórico" e o total listado. Incide **só sobre juros, multas e encargos legais**. | FAQ-09 P13; CG |
| R9.8 | **Regra geral (C/D):** até 100% de juros, multas e encargos, **limitado a 65% do valor total de cada crédito**. Opção 1: entrada de 5% (antes dos descontos) em até 5x + saldo em até 115x. Opção 2: entrada de 10% em até 5x + PF/BCN até 30% + saldo em até 115x. | FAQ-09 P12-I; CG 6.1 |
| R9.9 | **PN, ME, EPP, Santas Casas, cooperativas, OSC e instituições de ensino (C/D):** até 70% do valor total de cada crédito. Entrada de **5%** em até **10x**, PF/BCN até 30% e saldo em até 135x. | FAQ-09 P12-II; CG 6.2; DISC-FAZ (opção "ME, EPP, Santas Casas…") |
| R9.10 | **Previdenciário (art. 195, I, a, e II, CF), C/D:** prazo máximo de 60 meses. Entrada de 5% em até **10x** (para todos os perfis), PF/BCN "quando cabível" e saldo em até 50x. | FAQ-09 P12-III; CG 6.3; DISC-PREV; FAQ-S "O que não pode…" |
| R9.11 | **A/B:** fazendário com entrada de 10% em até 10x e saldo em até 74x. Previdenciário com entrada de 5% em até 10x e saldo em até 50x. Sem desconto e sem PF/BCN. | FAQ-09 P12-IV; CG 6.4/6.5 |
| R9.12 | Parcela mínima de R$ 200 (pessoa natural) e R$ 300 (demais casos), valendo para **qualquer** prestação, inclusive a entrada. O nº de parcelas é reduzido para respeitar o mínimo. | FAQ-09 P11; CG; DISC-FAZ (entrada menor que o mínimo vira o próprio mínimo) |
| R9.13 | PF/BCN: até 30% do saldo **após descontos e entrada**. Pode amortizar principal, multa, juros e encargos. Créditos apurados e declarados até 31/12/2025, com certificação contábil. Valor = montante × alíquota (DISC-FAZ). | FAQ-09 P9, P14; FAQ-S; CG; PORTAL |
| R9.14 | Prestações com Selic acumulada + 1% no mês do pagamento. | FAQ-09 P12; CG |
| R9.15 | Simples Nacional excluído, exceto multa por atraso de obrigação acessória. | FAQ-09 P2; CG |
| R9.16 | Multas isoladas devem ser lançadas no campo **"Principal"** (logo, sem desconto). | FAQ-09 P32 |
| R9.17 | Fazendário e previdenciário em **processos distintos**. | FAQ-S "Como aderir…"; ROT-50M passo 6 |
| R9.18 | 1ª prestação até o último dia útil do mês da adesão (condição de deferimento). | FAQ-09 P22, P29 |
| R9.19 | Prazo: **30/10/2026, 23h59min59s** (FAQ-09 P7, P28; PORTAL) **ou 30/12/2026** (CG). Ver C1. | — |
| R9.20 | Captura oficial do discriminativo: processo 1.000.000 + 50.000 + 20.000 = 1.070.000; dívida PGFN/RFB 200.000; total 1.270.000; CAPAG 150.000; relação 846,67%; **rating D, δ = 65%**; desconto máximo permitido = desconto obtido = 70.000; saldo 1.000.000. | ROT-50M p.4 (captura) |

### 1.3 Grandes Teses: Editais conjuntos PGFN/RFB 4/2026 e 5/2026

| # | Regra | Fonte |
|---|---|---|
| RGT.1 | Pessoa física ou jurídica, com débito ligado ao tema do edital (IRRF de não residentes; multas substitutivas do perdimento). Sem limite de valor. | GT; PORTAL; ROT-GT |
| RGT.2 | Opções I a V: desconto sobre o débito de 65/55/45/35/25%; entrada mínima de 30/25/20/15/10%; 12/24/36/48/60 parcelas após a entrada; total de 13/25/37/49/61 prestações. | GT; PORTAL ("até 61 parcelas") |
| RGT.3 | Débitos da Portaria RFB 568/2025: 40/20/5% de desconto, entrada de 30/25/20% e 12/24/36 parcelas. | GT |
| RGT.4 | PF/BCN até 30% do saldo remanescente **após o desconto**. Parcela mínima de R$ 500. Selic + 1%. Depósitos vinculados são convertidos em renda e as condições incidem sobre o saldo. | GT |
| RGT.5 | Prazo: 29/12/2026, 19h. | GT; PORTAL |

### 1.4 Regras gerais

| # | Regra | Fonte |
|---|---|---|
| RG.1 | É vedado: reduzir multa penal; dar desconto ao Simples Nacional sem lei; devedor contumaz; acumular com outros benefícios; parcelar acima de 60 meses as contribuições do art. 195, I, a, e II; reduzir o principal (salvo pequeno valor). | FAQ-S "O que não pode ser feito…" |
| RG.2 | A e B: em regra sem desconto. C e D: descontos e prazos maiores. | FAQ-S "Como saber se a dívida…" |
| RG.3 | No pequeno valor e na controvérsia jurídica, o desconto **não** depende da CAPAG. | FAQ-S "Como saber se a dívida…" |
| RG.4 | Inscrição em Dívida Ativa: "adicional de **até 20%** relativo aos encargos legais". | PORTAL |
| RG.5 | Transação individual: simplificada (≥ R$ 1 mi e < R$ 5 mi) e ordinária (> R$ 5 mi). | FAQ-S "Quem pode propor…"; PORTAL |
| RG.6 | Rescisão impede nova transação por 2 anos. | FAQ-S |

---

## 2. Conferência item por item do FORMULAS.md

| FORMULAS.md | O que o simulador faz | Fonte oficial | Status |
|---|---|---|---|
| §1 salário-mínimo / 60 SM | 1.621,00 / 97.260,00 | FAQ-S; FAQ-10 P2; PV | **CONFIRMADA** |
| §1 5 SM = 8.105 (PGFN art. 10.1) | — | só edital PGFN | NÃO VERIFICÁVEL |
| §1 acréscimo de 10% da Dívida Ativa (PGFN) | +10% fixo | PORTAL fala em "até 20%" | **DIVERGENTE (parcial)**: fonte RFB indica até 20%; o edital PGFN não foi lido |
| §1 teto PGFN de 45 mi | — | só edital PGFN | NÃO VERIFICÁVEL |
| §1 teto RFB de 50 mi | valor 50.000.000 | FAQ-09 P1; CG | valor **CONFIRMADO**; aplicação **DIVERGENTE** (ver D1) |
| §1 tipos de contribuinte | PN, PN_OBITO, MEI, ME_EPP, DEMAIS_PJ | FAQ-09 P12-II; CG 6.2; DISC-FAZ | **NÃO COBERTA**: faltam Santas Casas, cooperativas, OSC e instituições de ensino (grupo de 70%). Ver D7. |
| §1 situação cadastral (falido/recuperação/liquidação; baixado/inapto/suspenso) | força rating D | FAQ-09 P6; DISC-FAZ | **CONFIRMADA** |
| §2 base do rating RFB = dívida PGFN+RFB + total a transacionar | idem | FAQ-09 P17; FAQ-S; ROT-50M p.4 (1.270.000 = 1.070.000 + 200.000); DISC-FAZ | **CONFIRMADA** (ver nota N-a) |
| §2 faixas A ≤ 0,5 / B ≤ 1 / C ≤ 2 / D | idem | DISC-FAZ `calcularRating`; ROT-50M p.4 (846,67% → D). As FAQs só remetem à Portaria PGFN 6.757/2022 | **CONFIRMADA** (pelo discriminativo oficial) |
| §2 rating D forçado (óbito, falência/RJ, baixado/inapto) | idem | FAQ-09 P6; DISC-FAZ | **CONFIRMADA** |
| §2 / §9.2 CAPAG = 0 → rating A | relação = 0 → A | DISC-FAZ: com CAPAG 0, a relação passa a ser o total em reais ÷ 10.000, o que dá D para totais acima de R$ 20.000 | **DIVERGENTE** (D2) |
| §2 desconto máximo de 65% para Demais PJ não falida | 0,65 | FAQ-09 P12-I; CG ("não pode ser menor que 35%") | **CONFIRMADA** |
| §2 70% para PN, PN óbito, MEI, ME/EPP | 0,70 | FAQ-09 P12-II; CG 6.2; PORTAL "até 70%" | **CONFIRMADA** |
| §2 / §9.5 70% para **Demais PJ falida** | 0,70 | FAQ-09 P12 (70% só para o grupo PN/ME/EPP/Santas Casas…); DISC-FAZ (Demais PJ sempre 0,65) | **DIVERGENTE** (D3) |
| §2 δ = 0 (A/B); máx × (relação − 1) (C); máx (D) | idem | DISC-FAZ (fórmula idêntica); FAQ-09 P13; FAQ-S | **CONFIRMADA** (nota N-b) |
| §3 Ed. 10: quem pode (PN, PN óbito, MEI, ME/EPP) | idem | FAQ-10 P1; PV | **CONFIRMADA**; "empresário individual" não tem opção (NÃO COBERTA, menor) |
| §3 Ed. 10: limite "por débito" no modo por débito | soma os débitos de até 97.260 | FAQ-10 P7, P8 (limite por processo, não por contribuinte) | **CONFIRMADA**, desde que cada "débito" = um processo |
| §3 Ed. 10: limite no modo agregado (T ≤ 97.260) | aplica ao total | FAQ-10 P7 ("verificado individualmente para cada processo") | **DIVERGENTE** (D4) |
| §3 opções 50/40/35/30% em 12/24/36/55x | idem | FAQ-10 P10; PV | **CONFIRMADA** |
| §3 S = D × (1 − r): redução sobre o total, incluindo principal | idem | FAQ-10 P10; PV | **CONFIRMADA** (nota N-c: o e-CAC aplica e trunca por componente) |
| §3 sem entrada e sem PF/BCN | idem | FAQ-10 P10; FAQ-S | **CONFIRMADA** |
| §3 parcela mínima de R$ 200 e máx = mín(edital, ⌊S/200⌋) | idem | FAQ-10 P11; PV; ROT-PV p.4 (287,27 → 1 parcela; o motor dá 287,265, exibido como 287,27, também em 1 parcela) | **CONFIRMADA** |
| §3 parcela = S ÷ n (fixa) | sem juros | PV (Selic + 1%) | **NÃO COBERTA** (NC1) |
| §3 prazo 30/12/2026 | 30/12/2026 | PV = 30/12; FAQ-10 P6, FAQ-09 P33 e PORTAL = 30/10/2026 | **CONFLITO** (C1) |
| §4 Ed. 9: quem pode (todos) | idem | FAQ-09 P1; CG | **CONFIRMADA** |
| §4 limite de 50 mi comparado à **soma total** | inelegível se T > 50 mi | FAQ-09 P1; CG ("por processo"); DISC-FAZ (soma por nº de processo) | **DIVERGENTE** (D1) |
| §4 desconto = mín(D × δ ; Σ(multa + juros)) **global** | teto global | FAQ-09 P12-I ("de cada crédito"); DISC-FAZ (mín por processo); ROT-50M p.4 (coluna "Desconto máximo permitido" por processo) | **DIVERGENTE** (D5) |
| §4 desconto só sobre multa e juros | idem | FAQ-09 P13; CG | **CONFIRMADA** (o campo de encargos não existe; irrelevante para débito ainda na RFB). Multa isolada: ver NC6 |
| §4 parcela mínima de 200 (PN, óbito) / 300 (demais) | idem | FAQ-09 P11; CG; DISC-FAZ | **CONFIRMADA** |
| §4 entrada fazendária de 10% (A/B) / 5% (C/D) | idem | FAQ-09 P12; CG | **CONFIRMADA** |
| §4 entrada fazendária de 10% com PF/BCN, **para qualquer PJ/MEI** | 10% para Demais PJ **e** ME/EPP/MEI | FAQ-09 P12-I (10% só na regra geral); P12-II e CG 6.2 (ME/EPP: 5%); DISC-FAZ | Demais PJ **CONFIRMADA**; ME/EPP/MEI **DIVERGENTE** (D6) |
| §4 entrada previdenciária de 5% | idem | FAQ-09 P12-III/IV; CG; DISC-PREV | **CONFIRMADA** |
| §4 parcelas da entrada: 5 (Demais PJ C/D) / 10 (demais), **iguais para as duas naturezas** | o previdenciário da Demais PJ C/D também fica em 5 | FAQ-09 P12-III; CG 6.3 ("5% em até 10 vezes"); DISC-PREV (10 em todos os casos) | fazendário **CONFIRMADA**; previdenciário **DIVERGENTE** (D8) |
| §4 máx. da entrada limitado também por ⌊E_p/mín⌋ | o fazendário é limitado pela entrada previdenciária | DISC-FAZ (só usa a entrada fazendária); FAQ-S (processos distintos) | **DIVERGENTE** (D9) |
| §4 entrada menor que a parcela mínima | mantém 5%/10% (ex.: R$ 100 em 1x) | FAQ-09 P11 (mínimo vale para "qualquer prestação"); DISC-FAZ (entrada elevada ao mínimo) | **DIVERGENTE** (D10, pequeno) |
| §4 demais prestações: fazendário A/B 74; C/D 135 (PN/óbito/MEI/ME/EPP) ou 115 (Demais PJ); previdenciário 50 | idem | FAQ-09 P12; CG; PORTAL ("até 145" = 10 + 135); DISC-FAZ / DISC-PREV | **CONFIRMADA** |
| §4 PF/BCN: só PJ/MEI, C/D, até 30% de (S − E) | idem | FAQ-09 P14; FAQ-S; CG; PORTAL; DISC-FAZ | **CONFIRMADA**. A conversão "montante × alíquota" e o corte em 31/12/2025 ficam de fora (NC7) |
| §4 prestações = saldo ÷ n | sem juros | FAQ-09 P12; CG (Selic + 1%) | **NÃO COBERTA** (NC1) |
| §4 prazo 30/12/2026 | 30/12/2026 | CG = 30/12; FAQ-09 P7, P28 e PORTAL = 30/10/2026 | **CONFLITO** (C1) |
| §5 PGFN 60 SM (Edital 06/2026) | — | nenhuma fonte RFB trata | NÃO VERIFICÁVEL |
| §6 PGFN Capacidade de Pagamento | — | idem; só a CAPAG vem da PGFN (FAQ-S) | NÃO VERIFICÁVEL |
| §7 Quadro-Resumo / Vantagens | critério do site | não é regra oficial | n/a. Nota: a Grandes Teses 2026 também admite PF/BCN (GT), mas não está no simulador |
| §9.1 "rating RFB conta a dívida duas vezes" | — | FAQ-09 P17: é **o desenho oficial**, desde que o campo PGFN+RFB exclua o contencioso | ver nota N-a |
| §9.4 limites por débito × soma total | — | ver D1 e D4 | — |
| §9.11 mesmo n para fazendário e previdenciário | — | FAQ-S (processos distintos); DISC-FAZ e DISC-PREV são formulários separados | ver D8 e D9 |
| §10 Controvérsia Jurídica (Ed. 59/2025, inativa): tabela 65/55/45/35/25%, entrada 30…10% em 1x, 12…60 parcelas, mínimo R$ 500, PF/BCN 30% sobre S | idem | GT (Editais 4 e 5/2026 têm a mesma tabela, mínimo R$ 500 e PF/BCN de 30% "após o desconto"; total de prestações 13…61 = 1 + n) | estrutura **CONFIRMADA** pela modalidade vigente equivalente; a base da entrada (após o PF) não é detalhada na GT. **DIVERGENTE**: o simulador exclui PN, mas a GT 2026 admite "Pessoa Física ou Jurídica". **NÃO COBERTA**: tabela da Portaria RFB 568/2025 e conversão de depósitos. Prazo do código (29/12/2025) ≠ editais vigentes (29/12/2026) |

### Notas

**N-a. Base do rating RFB.** A FAQ-09 P17 manda **não** incluir no campo "Valor total da dívida na PGFN e na RFB" os débitos que vão para a transação, porque eles entram em campo próprio e "são utilizados para a determinação do desconto total". A soma `PGFN+RFB + total a transacionar` é, portanto, a regra oficial. Ela aparece também no discriminativo da captura do ROT-50M: 200.000 + 1.070.000 = 1.270.000. A "dupla contagem" do §9.1 só acontece quando o usuário preenche errado.

O exemplo do §8 do FORMULAS (4.700.000 nos dois campos) contraria essa orientação. Se esses 4,7 mi forem os próprios débitos do contencioso, o campo deveria ser 0. Rodando no motor, o resultado muda bastante:

| | Campo PGFN+RFB = 4.700.000 (§8) | Campo PGFN+RFB = 0 (orientação da FAQ) |
|---|---|---|
| Relação | 2,35 | 1,175 |
| Rating | D | C |
| δ | 65% | 11,375% |
| Desconto | 1.700.000 | 534.625 |
| Saldo S | 3.000.000 | **4.165.375** |

**N-b. Arredondamento da relação.** O discriminativo arredonda a relação a 2 casas em % (4 casas na razão) antes de calcular δ. O simulador usa o valor exato. O efeito máximo em δ é de 0,00325 p.p., desprezível.

**N-c. Arredondamento no Edital 10.** O e-CAC aplica a redução a cada componente e trunca no centavo (69,795 → 69,79). O simulador arredonda o saldo total. No exemplo oficial os dois dão 287,27. Em outros casos pode haver diferença de 1 a 2 centavos.

---

## 3. Divergências (com números rodados no motor do simulador)

| # | Divergência | Simulador | Regra oficial | Fonte |
|---|---|---|---|---|
| **D1** | Limite de R$ 50 mi aplicado à soma, e não a cada processo | 2 processos de R$ 30 mi (20 mi + 5 mi + 5 mi cada): **inelegível** ("O valor total informado supera o limite…") | Cada processo ≤ 50 mi: **elegível** | FAQ-09 P1, P2; CG; DISC-FAZ (soma por nº de processo) |
| **D2** | CAPAG = 0 | Demais PJ, 1.070.000 a transacionar + 200.000: **rating A**, δ 0, S = 1.070.000, entrada de 10% (107.000) em até 10x, 74 parcelas | Discriminativo: relação = 1.270.000 ÷ 10.000 = 127 → **rating D**, δ 65%, desconto 70.000, S = 1.000.000, entrada de 5% em até 5x, 115 parcelas. É coerente com o conceito (sem capacidade de pagamento, o crédito é irrecuperável). O discriminativo também tem uma peculiaridade: com CAPAG 0 e total ≤ R$ 20 mil, dá A/B/C | DISC-FAZ `calcularRating`; FAQ-09 P5 |
| **D3** | Demais PJ falida com 70% | P 1 mi, M 2 mi, J 1 mi, rating D: δ **70%**, desconto 2.800.000, **S = 1.200.000** (e exibe "Até 65%") | 65%: desconto 2.600.000, **S = 1.400.000** (o saldo do simulador fica R$ 200 mil menor). Os 70% valem só para PN, ME, EPP, Santas Casas, cooperativas, OSC e instituições de ensino | FAQ-09 P12-I/II; CG 6.1 × 6.2; DISC-FAZ |
| **D4** | Edital 10 no modo agregado | ME/EPP com 2 processos de 75.000 (total 150.000): **inelegível** no agregado. No modo por débito: elegível, D = 150.000 | Limite por processo: elegível | FAQ-10 P7, P8 |
| **D5** | Teto do desconto global, e não por processo | Processos (1.000.000; 0; 0) e (100.000; 600.000; 300.000), rating D 65%: desconto = mín(1.300.000; 900.000) = **900.000**, S = 1.100.000 | Por processo: mín(0; 650.000) + mín(900.000; 650.000) = **650.000**, S = 1.350.000. O simulador superestima o desconto em R$ 250 mil | FAQ-09 P12-I ("65% do valor total de cada crédito"); DISC-FAZ; ROT-50M p.4 |
| **D6** | ME/EPP/MEI com PF/BCN: entrada sobe para 10% | P 1 mi, M 0,5 mi, J 0,5 mi, rating D, PF/BCN 100.000: entrada **200.000**, limite de PF/BCN 240.000 | Entrada de **5% = 100.000** em até 10x; limite de PF/BCN = 30% × (1.000.000 − 100.000) = **270.000** | FAQ-09 P12-II; CG 6.2; DISC-FAZ |
| **D7** | Santas Casas, cooperativas, OSC e instituições de ensino (usuário escolhe "Demais PJ") | P/M/J de 1 mi cada, rating D: δ 65%, desconto 1.950.000, S = 1.050.000, entrada 150.000 em até 5x, saldo 900.000 em até **115x** | Grupo de 70%: desconto 2.100.000, **S = 900.000**, entrada 150.000 em até 10x, saldo 750.000 em até **135x**; parcela mínima R$ 300 | FAQ-09 P12-II; CG 6.2; DISC-FAZ |
| **D8** | Entrada previdenciária da Demais PJ C/D limitada a 5 parcelas | 5x (total 5 + 50 = 55 meses) | Em até **10x** (10 + 50 = 60 meses, o limite constitucional) | FAQ-09 P12-III; CG 6.3; DISC-PREV |
| **D9** | Parcelas da entrada fazendária limitadas pela entrada previdenciária | ME/EPP rating A, D = 40.000: entrada fazendária de 4.000 em até **6x** (porque ⌊2.000/300⌋ = 6) | ⌊4.000/300⌋ = 13, limitado a **10x** | DISC-FAZ; FAQ-S (processos distintos) |
| **D10** | Entrada abaixo do mínimo | PN rating D, D = 2.000: entrada R$ 100 em 1x | Entrada elevada a **R$ 200** (mínimo de "qualquer prestação") | FAQ-09 P11; DISC-FAZ |
| **D11** | Encargo legal PGFN | +10% fixo | PORTAL: "adicional de **até 20%**". Não foi possível confirmar no edital PGFN qual percentual se aplica | PORTAL |

---

## 4. Regras oficiais que o simulador não cobre

| # | Regra | Efeito no cálculo | Fonte |
|---|---|---|---|
| **NC1** | **Selic acumulada + 1%** sobre cada prestação (Editais 9, 10 e Grandes Teses) | O simulador mostra a parcela nominal S/n. A parcela real do mês k ≈ (S/n) × (1 + Σ Selic do mês seguinte à consolidação até o mês anterior + 1%). Exemplo apenas ilustrativo, com Selic **hipotética** de 1% a.m.: a 55ª parcela do Edital 10 sairia cerca de 55% acima do valor mostrado | PV; CG; FAQ-09 P12; GT |
| **NC2** | Exclusão do **Simples Nacional** (exceto multa por atraso de obrigação acessória) | O simulador aceita qualquer débito | FAQ-10 P2; FAQ-09 P2; PV; CG; FAQ-S |
| **NC3** | Perfis especiais (Santas Casas, cooperativas, OSC da Lei 13.019/2014, instituições de ensino) | Ver D7 | FAQ-09 P12-II; CG; DISC-FAZ |
| **NC4** | Empresário individual (Edital 10) | Não há opção explícita | FAQ-10 P1 |
| **NC5** | Exigência de contencioso: o Edital 9 exige; o Edital 10 aceita prazo de impugnação em curso; DCOMP só com manifestação apresentada | O simulador não pergunta a situação processual | FAQ-09 P16, P19, P31; FAQ-10 P3, P13, P15 |
| **NC6** | Multas isoladas devem ir no campo "Principal" | Se forem informadas como "multa", o simulador as descontaria | FAQ-09 P32 |
| **NC7** | PF/BCN: valor = montante × alíquota; apurado até 31/12/2025; certificação contábil | O simulador pede o valor já convertido | FAQ-09 P9, P14; DISC-FAZ |
| **NC8** | Fazendário e previdenciário em processos distintos, cada um com sua entrada e seu número de parcelas | Ver D8 e D9 | FAQ-S "Como aderir…" |
| **NC9** | Inclusão obrigatória de todos os débitos do processo | O simulador não tem o conceito de processo | FAQ-10 P14; FAQ-09 P18 |
| **NC10** | 1ª prestação/entrada até o último dia útil do mês da adesão | Afeta só o cronograma | FAQ-10 P16; FAQ-09 P22, P29; GT |
| **NC11** | Grandes Teses 2026 (Editais conjuntos 4 e 5/2026), **aberta até 29/12/2026** | Não existe no simulador. A única modalidade parecida (§10, Edital 59/2025) está inativa e exclui PN | GT; PORTAL; ROT-GT |
| **NC12** | Tabela da Portaria RFB 568/2025 (40/20/5%) e conversão de depósitos em renda | — | GT |
| **NC13** | Transação individual (simplificada e ordinária) | Fora do simulador (o FORMULAS já avisa) | FAQ-S; PORTAL |
| **NC14** | Vedações gerais (acúmulo de benefícios, devedor contumaz, multa penal) e DTE obrigatório | Elegibilidade formal | FAQ-S; FAQ-10 P9; FAQ-09 P10 |

---

## 5. Conflitos e erros nas próprias fontes oficiais

- **C1. Prazo dos Editais 9 e 10.** FAQ-10 P6, FAQ-09 P7, P28 e P33 e os cartões do PORTAL dizem **30/10/2026**. As páginas PV e CG dizem **30/12/2026** (mesmos horários: 20h59min59s no Edital 10, 23h59min59s no Edital 9). O simulador usa 30/12/2026. Hoje é 10/11/2026: se valer 30/10, as duas modalidades RFB do simulador já estão encerradas. Pode ter havido prorrogação não refletida na FAQ (ou o contrário). Só o texto do edital (ou de um edital de prorrogação) resolve. O cabeçalho do discriminativo cita "Edital de Transação nº 9 / nº 10, de 13 de julho de 2026".
- **C2. Erro de digitação na CG.** A página escreve "35% (sessenta e cinco por cento)" e "30% (setenta por cento)". A leitura correta é pagamento mínimo de 35% (desconto máximo de 65%) e de 30% (desconto máximo de 70%).
- **C3. Respostas trocadas na FAQ-10.** A P9 (DTE) repete o texto da P8, e a P20 repete o da P19. Não afeta o cálculo.
- **C4. Encargo legal.** O PORTAL fala em "até 20%"; o simulador usa 10% (ver D11).

## 6. O que não foi acessado ou verificado

- Todas as fontes pedidas foram acessadas: FAQ-S (texto já existente), FAQ-10 e FAQ-09 (Chrome via gravador) e os 3 roteiros em PDF (curl simples, HTTP 200). Nada foi bloqueado.
- Os roteiros são passo a passo de adesão. Fora as capturas da p.4 (e-CAC e discriminativo), não trazem regras de cálculo.
- **Não lidos** (fora do escopo): os textos dos Editais RFB 9/2026 e 10/2026, dos Editais conjuntos 4 e 5/2026 e do Edital PGFN 06/2026, além da Portaria PGFN 6.757/2022 e da Portaria RFB 555/2025. Consequências:
  - os itens PGFN (§5, §6) ficaram **não verificáveis**;
  - as faixas numéricas do rating e o tratamento de CAPAG = 0 foram conferidos pelo **discriminativo oficial** (código JS publicado pela RFB), não por texto normativo;
  - o conflito de prazo C1 não pôde ser resolvido.
