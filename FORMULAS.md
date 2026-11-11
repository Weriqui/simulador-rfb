# Fórmulas do Simulador de Negociações (RFB/PGFN)

Extraídas do código do simulador oficial
(`https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/`, versão 1.0.0, arquivos `js/core/*` e `js/modalidades/*`, idênticos aos publicados em 10/11/2026).

Todas as fórmulas abaixo estão implementadas em [simulador-basico/motor-calculo.js](simulador-basico/motor-calculo.js), na **mesma ordem de operações** do site. Elas foram validadas contra o código real do site rodando no Chrome:

- 9.000 cenários aleatórios, com igualdade exata de ponto flutuante;
- 8 simulações feitas clicando na interface;
- 40 roteiros digitados tecla por tecla nas duas interfaces.

Notação: `⌊x⌋` = arredondar para baixo; `D` = dívida elegível; `S` = saldo após a redução; `E` = entrada; `δ` = desconto teórico; `min` = parcela mínima.

### Cobertura

O código do site prevê **5 modalidades** (são as únicas chamadas em `recarregarTodasAsModalidades`, em `quadro-resumo.js`). Este documento cobre todas, com todas as opções de parcelamento:

| # | Modalidade | Opções de pagamento | Na tela do site? |
|---|---|---|---|
| §3 | RFB 60 SM (Edital 10/2026) | 4 opções: 12x/50%, 24x/40%, 36x/35%, 55x/30% | sim |
| §4 | RFB até 50M (Edital 9/2026) | fazendário e previdenciário; rating A/B ou C/D; com ou sem PF/BCN | sim |
| §5 | PGFN 60 SM (Edital 06/2026) | Art. 10.1 (MEI), à vista, com entrada em 7/12/30/55 meses | sim |
| §6 | PGFN Capacidade de Pagamento (Edital 06/2026) | com entrada ou à vista; fazendário ou previdenciário; rating A/B ou C/D | sim |
| §11 | RFB Controvérsia Jurídica (Edital 59/2025) | 5 opções: 12/24/36/48/60x, com PF/BCN | **não** (arquivo existe no servidor, mas a página não o carrega; prazo encerrado em 29/12/2025) |

Outras formas de parcelamento e transação existentes na legislação (parcelamento ordinário, transação excepcional, PERT etc.) **não existem no código do site**, então não há fórmula para extrair. O próprio site avisa que não contempla todas as modalidades.

**Além da calculadora:**
- **§10** confronta cada regra com as páginas oficiais, as FAQs e os roteiros (embasamento e divergências).
- **§12** documenta os **formulários oficiais de adesão** (os "discriminativos" de Pequeno Valor, Fazendários, Previdenciários e Controvérsia Jurídica). Eles calculam de forma diferente da calculadora; o principal é que o desconto é feito **por débito**. Essas contas estão num motor próprio, [simulador-basico/motor-formularios.js](simulador-basico/motor-formularios.js), validado contra o código oficial dos 4 formulários.

---

## 1. Entradas

| Campo | Observação |
|---|---|
| Tipo de contribuinte | `PN`, `PN_OBITO`, `MEI`, `ME_EPP`, `DEMAIS_PJ` |
| Situação cadastral | só para MEI, ME/EPP e Demais PJ: **falido/recuperação/liquidação** e **baixado/inapto/suspenso** |
| Modo | **Agregado** (soma de principal, multa e juros) ou **Por débito** (lista de débitos) |
| CAPAG | "Capacidade de pagamento em 60 meses" (vem do Regularize/PGFN) |
| Dívida PGFN+RFB | "Valor total da dívida na PGFN e RFB" (vem do Regularize/PGFN) |

- **Total dos débitos** `T` = Σ (principal + multa + juros).
- **Total a transacionar** = `T` arredondado a centavos **no momento do último clique em "Confirmar total de débitos"** (`composicao-divida.js:250`, campo somente-leitura). Editar débitos depois disso não atualiza o campo; ver §9, item 15.
- **CAPAG em uso** = valor do campo; se o campo for apagado depois de calculado, vale a última CAPAG calculada (`utils.js:90-95`).
- Valores monetários: a máscara do site transforma tudo em *centavos inteiros ÷ 100*. Sinais negativos são descartados.

Constantes fixas no código:

| Constante | Valor |
|---|---|
| salário-mínimo | R$ 1.621,00 |
| 60 SM | R$ 97.260,00 |
| 5 SM | R$ 8.105,00 |
| acréscimo da inscrição em Dívida Ativa (PGFN) | 10% |
| teto PGFN Capacidade de Pagamento | R$ 45.000.000,00 |
| teto RFB 50M | R$ 50.000.000,00 |

---

## 2. Classificação (Rating) e desconto teórico

O cálculo é o mesmo para os dois órgãos; o que muda é a **base**:

| Órgão | Base do rating |
|---|---|
| **PGFN** | `B = Dívida PGFN+RFB informada` (sem o acréscimo de 10%). Se 0, `B = 0`. |
| **RFB** | `B = Dívida PGFN+RFB informada + Total a transacionar` |

```
relação = B ÷ CAPAG            (se CAPAG = 0  →  relação = 0)

Rating = D  se PN_OBITO, ou falido/recuperação, ou baixado/inapto   (rating forçado)
       = A  se relação ≤ 0,5
       = B  se relação ≤ 1
       = C  se relação ≤ 2
       = D  caso contrário

descontoMáximo = 65%  se Demais PJ não falida
               = 70%  nos demais casos (PN, PN óbito, MEI, ME/EPP, Demais PJ falida)

δ (desconto teórico) = 0                               se A ou B
                     = descontoMáximo × (relação − 1)  se C
                     = descontoMáximo                  se D
```

---

## 3. RFB — Edital nº 10/2026 — Até 60 salários-mínimos

**Quem pode:** PN, PN óbito, MEI e ME/EPP. Prazo: 30/12/2026.

**Dívida elegível `D`:**
- Agregado: `D = T`, desde que `T ≤ 97.260`.
- Por débito: `D` = soma dos débitos com `0 < total ≤ 97.260` (o limite é **por débito**).

**Opções** (todas sem entrada, sem PF/BCN):

| Opção | Redução `r` | Parcelas máx. pelo edital |
|---|---|---|
| 6.1-I | 50% | 12 |
| 6.1-II | 40% | 24 |
| 6.1-III | 35% | 36 |
| 6.1-IV | 30% | 55 |

```
S              = D × (1 − r)
máx. parcelas  = mín( edital ; máx(1, ⌊S ÷ 200⌋) )          parcela mínima R$ 200
n              = mín( escolhido ou máx ; máx )
parcela        = S ÷ n
```

Saldo exibido = `S`. Redução exibida = `r`.

---

## 4. RFB — Edital nº 9/2026 — Até 50 milhões por processo

**Quem pode:** todos os tipos. Prazo: 30/12/2026.

**Dívida elegível:** `D = T` (todos os débitos). Fica inelegível se `T > 50.000.000`. No modo por débito, precisa haver pelo menos um débito com `0 < total ≤ 50M`.

**Redução (limitada a multa + juros):**

```
δ                 = desconto teórico do rating RFB
descontoCalculado = D × ((δ × 100) ÷ 100)   (ordem exata de 50milh.js:236-239; "D × δ" pode diferir no último bit)
descontoMáximo    = Σ (multa + juros)        (no modo por débito: débitos com total ≤ 50M)
descontoAplicado  = mín(descontoCalculado ; descontoMáximo)
S                 = D − descontoAplicado     ← "Saldo devedor" exibido
```

**Parâmetros:**

| Item | Regra |
|---|---|
| Parcela mínima | R$ 200 (PN, PN óbito) · R$ 300 (MEI, ME/EPP, Demais PJ) |
| Entrada fazendária `E_f` | 10% de `D` se rating A/B **ou** se usar PF/BCN fazendário; senão 5% de `D` |
| Entrada previdenciária `E_p` | 5% de `D` |
| Parcelas da entrada (limite do edital `L_e`) | 5 para Demais PJ com rating C/D; 10 nos demais casos |
| Demais prestações — fazendário `L_f` | rating A/B: 74 · rating C/D: 135 (PN, PN óbito, MEI, ME/EPP) ou 115 (Demais PJ) |
| Demais prestações — previdenciário `L_p` | 50 |
| PF/BCN (prejuízo fiscal / base negativa de CSLL) | só PJ/MEI (não PN) **e** rating C ou D; até 30% do saldo após a entrada |

```
parcelas da entrada (máx) = máx(1, mín(L_e, ⌊E_f ÷ min⌋, ⌊E_p ÷ min⌋))   → a mesma para as duas naturezas
valor da parcela da entrada = E ÷ n_entrada

saldo após entrada      = S − E
limite PF/BCN           = 30% × (S − E)
saldo remanescente      = S − E − PF/BCN
máx. demais prestações  = mín(L, máx(1, ⌊saldo remanescente ÷ min⌋))
n                       = mín(máx(escolhido ou máx, 1), máx)       (o mesmo número vale p/ fazendário e previdenciário)
valor da prestação      = saldo remanescente ÷ n
```

**Ao informar PF/BCN** (`recalcularCamposPfBcnRfb50m`):

1. O valor digitado é validado contra o limite **exibido naquele momento** (`quadro-resumo.js:473-481`).
   - Primeiro PF/BCN: o limite é calculado com a entrada de 5%.
   - Novo PF/BCN com outro já aplicado: o limite já reflete a entrada de 10%, que é menor.
   - Fora do limite, aparece o erro e o PF/BCN anterior continua.
2. Se o PF/BCN fazendário for maior que 0, a entrada fazendária passa a **10%** de `D`.
3. O limite de 30% é recalculado com a nova entrada, e o valor é truncado a esse novo limite.
4. As parcelas escolhidas são mantidas, limitadas ao novo máximo.
5. O número de parcelas do saldo resultante passa a ser a **escolha gravada** (`quadro-resumo.js:294/304`). Se o PF/BCN se perder num recálculo seguinte, esse número continua valendo, mesmo que o máximo volte a subir.

**Exibição:**
- Redução: "Até 70%" (PN, PN óbito, MEI, ME/EPP) ou "Até 65%" (Demais PJ) quando `δ > 0`; "0%" quando `δ = 0`.
- Memória de cálculo (página de detalhe): alíquota efetiva = descontoAplicado ÷ D.

---

## 5. PGFN — Edital 06/2026 — Até 60 salários-mínimos

Prazo: 29/01/2027.

**Dívida elegível (já com +10% de inscrição em Dívida Ativa):**
- Agregado: `D = T × 1,10`, exigindo `D ≤ 97.260`. **Não verifica o tipo de contribuinte** (Demais PJ também passa — ver §9).
- Por débito: só PN, PN óbito, MEI, ME/EPP. `D` = Σ (débito × 1,10) dos débitos com `débito × 1,10 ≤ 97.260`.

Parcela mínima: **R$ 25 (MEI)** · R$ 100 (demais).

| Opção | Regra |
|---|---|
| Art. 10.1 (só MEI e `D ≤ 8.105`) | `S = D × 50%`, sem entrada, até 60x: `máx = mín(60, máx(1, ⌊S÷min⌋))` |
| Art. 10.2 à vista | `S = D × 50%`, 1 pagamento |
| Art. 10.2 com entrada — 7 / 12 / 30 / 55 meses | redução de 50 / 45 / 40 / 30% |

**Opções com entrada:**

```
E                        = 5% × D        (sem desconto)
parcelas da entrada máx  = mín(5, máx(1, ⌊E ÷ min⌋))
S                        = (D − E) × (1 − r)
máx. parcelas do saldo   = mín(meses, máx(1, ⌊S ÷ min⌋))
n                        = mín(máx(escolhido, 1), máx)      (vazio = máx)
total pago               = E + S
redução exibida          = (D − total pago) ÷ D              ex.: 30% sobre 95% → 28,5%
```

Saldo devedor exibido = `S + E`.

---

## 6. PGFN — Edital 06/2026 — Conforme a Capacidade de Pagamento

**Quem pode:** todos os tipos. Prazo: 29/01/2027.

- `D = T × 1,10`, exigindo `D ≤ 45.000.000`.
- Rating e `δ` vêm da base **PGFN** (§2).
- Parcela mínima: R$ 25 (MEI) · R$ 100 (demais).
- Parcelas da entrada: até **12** (PN, PN óbito, MEI, ME/EPP) ou **6** (Demais PJ).
- `P₀` = principal original (soma dos principais, **sem** os 10%).

**Rating A ou B** (sem desconto; à vista indisponível):

```
E          = 6% × D
n_e(máx)   = mín(12|6, máx(1, ⌊E ÷ min⌋))
n_e        = mín(máx(escolhido ou n_e(máx), 1), n_e(máx))   ← parcelas da entrada ESCOLHIDAS
S          = D − E
máx. saldo = mín(60 − n_e, máx(1, ⌊S ÷ min⌋))     (vale também para os previdenciários)
```

**Rating C ou D — com entrada:**

```
E                        = 6% × D
principal amortizado     = E × P₀ ÷ D
principal restante       = P₀ − E × P₀ ÷ D
saldo após entrada  Sₑ   = D − E
juros/multas restantes J = Sₑ − principal restante        (= Sₑ × (1 − P₀/D); os 10% contam como "não principal")
teto                     = Sₑ × δ
desconto                 = mín(J ; teto)
S                        = Sₑ − desconto
máx. saldo               = previdenciário: 60 − n_e (n_e = parcelas da entrada escolhidas)
                           fazendário: 133 (PN, PN óbito, MEI, ME/EPP) ou 114 (Demais PJ)
                           (sempre limitado por ⌊S ÷ min⌋)
```

**Rating C ou D — à vista:** mesma conta com `E = 0`, ou seja, valor à vista = `D − mín(D − P₀ ; D × δ)`.

**Exibição:**
- Redução = `δ` teórico (não o efetivo).
- Saldo devedor exibido = `S + E`.
- A página de detalhe mostra a "economia real" = `D − (E + S)`.

---

## 7. Quadro-Resumo e "Vantagens"

Ordem das linhas: RFB 60 SM → RFB 50M → PGFN 60 SM → PGFN Capacidade de Pagamento.

| Vantagem | Regra |
|---|---|
| **Menor saldo devedor** | menor "saldo exibido" (RFB 50M: `S`; demais: `S + entrada`). Empates: todos ganham. |
| **Maior número de parcelas** | maior (parcelas da entrada + parcelas do saldo). Sem entrada conta 0; à vista conta 1. Empates: todos ganham. |
| **Possibilidade de utilização de PF/BCN** | modalidades em que o PF/BCN é permitido (só a RFB 50M com PJ e rating C/D) |

**Escolha da opção:**
- A opção padrão é a primeira.
- Se ela não for elegível, o site usa a primeira opção elegível, e o `<select>` só mostra as opções elegíveis. A troca **fica gravada** (§9, item 10).

**Escolha das parcelas:**

| Situação | Resultado |
|---|---|
| Parcelas nunca informadas | máximo permitido |
| Campo de parcelas **do saldo** apagado | não muda nada (o site ignora valor vazio e mantém o último) |
| Campo de parcelas **da entrada** apagado | volta ao máximo |
| Digitar `0` | máximo na RFB 60 SM, RFB 50M e PGFN Capacidade; **1** na PGFN 60 SM (`máx(parseInt, 1)`) |
| Parcelas acima do máximo | puxadas para o máximo, e o **valor puxado fica gravado** como nova escolha (`quadro-resumo.js:170`). Se o máximo subir depois (outra opção, outros débitos), o número não volta ao original |
| Trocar a natureza (PGFN Capacidade) | zera só as parcelas do saldo; as da entrada continuam |

---

## 8. Exemplo resolvido (o seu print)

Entradas: Demais PJ, agregado com principal 3.000.000 + multa 1.500.000 + juros 200.000 (`T` = 4.700.000), CAPAG = 4.000.000, dívida PGFN+RFB = 4.700.000.

**Ratings:**

| Órgão | Base | Relação | Rating | δ |
|---|---|---|---|---|
| PGFN | 4.700.000 | 1,175 | C | 0,65 × 0,175 = **11,375%** |
| RFB | 4.700.000 + 4.700.000 = 9.400.000 | 2,35 | D | **65%** |

**RFB 50M:**
- Desconto calculado 3.055.000; máximo (multa + juros) 1.700.000 → aplicado 1.700.000 → **S = 3.000.000**.
- Entrada 5% = 235.000 em 5x de 47.000.
- Saldo de 2.765.000 em 115x de **24.043,48**.
- Limite PF/BCN = 30% × 2.765.000 = **829.500**.

**PGFN Capacidade:**
- `D` = 5.170.000; `E` = 310.200 em 6x de 51.700.
- Principal amortizado = 310.200 × 3.000.000 ÷ 5.170.000 = 180.000 → principal restante 2.820.000.
- `Sₑ` = 4.859.800; `J` = 2.039.800; teto = 552.802,25 → desconto 552.802,25.
- `S` = **4.306.997,75** em 114x de **37.780,68**; saldo exibido = 4.617.197,75.

**Inelegíveis:** RFB 60 SM (Demais PJ) e PGFN 60 SM (5.170.000 > 97.260).

**Vantagens:**
- RFB 50M: menor saldo (3.000.000) e PF/BCN.
- Maior número de parcelas: empate em 5 + 115 = 6 + 114 = 120, e as duas ganham.

---

## 9. Peculiaridades do site oficial (reproduzidas pelo motor)

1. **Rating RFB conta a dívida duas vezes**: a base é "dívida PGFN+RFB" + "total a transacionar".
2. **CAPAG = 0 vira Rating A** (a relação é considerada 0), exceto quando o rating D é forçado.
3. **PGFN 60 SM no modo agregado não verifica o tipo**: uma Demais PJ com dívida pequena fica elegível. No modo por débito ela é barrada.
4. **Limites por débito**: no modo por débito, as modalidades de 60 SM somam débitos individualmente elegíveis, e a soma pode passar de 60 SM. Já a RFB 50M compara a **soma total** com 50M.
5. **"Até 65%" para Demais PJ falida**, embora o desconto usado seja de 70%.
6. **PGFN Capacidade mostra a redução teórica** (`δ`), não a efetivamente obtida, que pode ser menor por causa do teto de juros e multas.
7. **Valor da parcela de entrada desatualizado após o PF/BCN (RFB 50M)**: a entrada vai de 5% para 10%, mas o Quadro-Resumo continua mostrando o valor antigo por parcela. A página de "Detalhes" do site mostra o valor recalculado.
   - O motor e o simulador básico reproduzem as duas telas: `valorParcelaEntrada` = valor do Quadro-Resumo; `valorParcelaEntradaCorreto` = valor dos Detalhes.
   - Há também um aviso explicando a diferença.
8. **PF/BCN validado contra o limite exibido** e depois truncado ao novo limite.
   - No primeiro PF/BCN, o limite exibido é o da entrada de 5%. Por isso, um valor entre o novo limite (entrada de 10%) e o antigo é aceito e reduzido em silêncio.
   - Num segundo PF/BCN, o limite exibido já é o menor, e o mesmo valor dá erro.
9. **O PF/BCN é perdido em qualquer recálculo** (mudar parcelas, entrada ou opção da RFB 50M, ou qualquer dado do formulário). Por isso, no site o PF/BCN precisa ser informado **por último**.
10. **"Memória" de opção**: a troca automática para a primeira opção elegível fica gravada, mesmo que tenha ocorrido num valor intermediário da digitação. Exemplo: MEI por débito; ao digitar um débito grande, a soma passa momentaneamente de 5 SM e o site troca o Art. 10.1 por "à vista"; quando o débito sai do limite, a troca não é desfeita. O simulador básico reproduz isso. O motor puro (`simular()`) parte do estado "limpo", como se a página fosse recarregada.
11. **Mesmo número de parcelas** para fazendário e previdenciário na RFB 50M (um único campo).
12. **PGFN Capacidade com rating A/B** usa `60 − parcelas da entrada` também para os débitos fazendários.
13. A CAPAG e a dívida total só recalculam no `change` (ao sair do campo). Os débitos recalculam a cada tecla.
14. `assets/pdf/jspdf.umd.min.js` responde 404 no site.
15. **"Total a transacionar" antigo no rating RFB.**
    - O que acontece: o campo só é gravado em "Confirmar total de débitos". Se o usuário editar um débito depois e clicar direto em "Simular Modalidades" (o botão continua visível), o rating RFB usa o total **antigo**, enquanto a dívida e o saldo usam o total novo.
    - Exemplo real (Demais PJ, CAPAG 4M, dívida PGFN+RFB 1M): confirmar com T = 3M e depois mudar T para 5M dá rating **B** e saldo R$ 5.000.000. Reconfirmando, dá rating **C** e saldo R$ 3.375.000.
    - Reprodução no motor: entrada `totalDebitosTransacionar` (padrão = total atual).
    - No simulador básico o total é sempre o atual, como se o usuário reconfirmasse.
16. **A escolha de parcelas sobrevive ao PF/BCN perdido**: ver §4, "Ao informar PF/BCN", passo 5. Exemplo real: 20x máx; com PF/BCN cai para 11x; ao mudar a entrada, o PF/BCN some e o máximo volta a 20x, mas a escolha fica em **11x**.
17. **"Memória" de parcelas**: ver a tabela do §7. Redigitar um débito depois de escolher as parcelas pode deixá-las em 1x, porque durante a digitação o total passa por centavos e o máximo cai para 1.
18. **O erro do PF/BCN continua na tela** depois de mudar parcelas, entrada ou opção da RFB 50M. Ele só some num novo PF/BCN válido ou em mudança no formulário.
19. **CAPAG apagada depois de simular**:
    - O quadro continua visível, calculado com a **última CAPAG calculada**.
    - Se a dívida PGFN+RFB for apagada, ela passa a valer 0, e o rating PGFN vira A.
20. **Rating "congelado" da página de detalhe**:
    - `estadoGlobal.capag.pgfn/rfb` é usado pelos "Detalhes" e pelo resumo oculto. Ele só é recalculado no `change` da CAPAG ou da dívida.
    - Se o tipo ou a situação mudar depois, o Quadro-Resumo se atualiza, mas o detalhe pode mostrar o rating antigo. O motor segue o Quadro-Resumo.

---

## 10. Embasamento oficial — o que as páginas da RFB confirmam ou contradizem

Fontes:
- páginas oficiais da Transação Tributária (texto salvo em [fontes-oficiais/paginas-texto/](fontes-oficiais/paginas-texto/));
- [04-contencioso-geral](fontes-oficiais/paginas-texto/04-contencioso-geral.txt), com a tabela das opções 6.1 a 6.5 do Edital RFB 9/2026;
- [03-pequeno-valor](fontes-oficiais/paginas-texto/03-pequeno-valor.txt) (Edital RFB 10/2026);
- [05-grandes-teses](fontes-oficiais/paginas-texto/05-grandes-teses.txt) (Editais Conjuntos PGFN/RFB 4 e 5/2026);
- [02-transacao-tributaria](fontes-oficiais/paginas-texto/02-transacao-tributaria.txt) (resumo das modalidades).

Status de cada regra:
- ✅ = o simulador faz igual à página oficial;
- ⚠️ = o simulador faz **diferente** da página oficial (o motor segue o simulador, para dar os mesmos números);
- ➖ = regra oficial que o simulador não modela.

### RFB 60 SM (Edital 10/2026)

| Regra oficial | Simulador | Status |
|---|---|---|
| PF, MEI, ME e EPP; até 60 SM (R$ 97.260) **por processo** | por débito: limite por débito ✅. Agregado: exige **total** ≤ 60 SM, mais restritivo | ✅ / ⚠️ |
| Opções I a IV: 50%/12x, 40%/24x, 35%/36x, 30%/55x; desconto sobre o **total** (principal, juros, multas e encargos) | igual | ✅ |
| Parcela mínima R$ 200 | igual | ✅ |
| Desconto incondicionado (não depende de CAPAG) | igual | ✅ |
| Parcelas corrigidas pela **Selic** acumulada + 1% no mês do pagamento | parcelas nominais na consolidação | ➖ |
| Débitos do Simples Nacional excluídos (exceto multa por atraso de obrigação acessória) | não filtra | ➖ |
| Prazo de adesão 30/12/2026 | igual (a página-resumo diz 30/10/2026, inconsistente) | ✅ |

### RFB até R$ 50 milhões (Edital 9/2026)

| Opção oficial | Entrada (antes dos descontos) | Desconto | Parcelas do saldo | PF/BCN | Simulador | Status |
|---|---|---|---|---|---|---|
| **6.1-I**: demais PJ, rating C/D | 5% em até 5x | até 100% de multa, juros e encargos; pagamento mínimo de 35% da dívida | até 115 | não | 5% em até 5x, 115, desconto = mín(D×δ ; multa+juros) com δ ≤ 65% | ✅ |
| **6.1-II**: demais PJ, rating C/D | **10%** em até 5x | idem | até 115 | até 30% | entrada vai a 10% ao usar PF/BCN | ✅ |
| **6.2-I/II/III**: PN, ME, EPP, Santas Casas, cooperativas, ONGs, instituições de ensino, rating C/D | **5% em até 10x** | idem; pagamento mínimo de 30% | até 135 | **até 30%** | 5% em até 10x e 135 ✅; mas **sobe a entrada para 10% quando há PF/BCN** | ⚠️ |
| **6.3**: contribuições sociais (previdenciário), C/D | 5% em **até 10x** | idem | até 50 | até 30% | 5% e 50 ✅; mas para demais PJ C/D limita a entrada a **5x** (o mesmo campo do fazendário) | ⚠️ |
| **6.4**: rating A/B | 10% em até 10x | sem desconto | até 74 | não | igual | ✅ |
| **6.5**: contribuições sociais, A/B | 5% em até 10x | sem desconto | até 50 | não | igual | ✅ |

Outras regras do Edital 9/2026:

| Regra oficial | Simulador | Status |
|---|---|---|
| Parcela mínima R$ 200 (pessoa natural) e R$ 300 (demais) | igual | ✅ |
| PF/BCN limitado a 30% do saldo após descontos e entrada | 30% × (S − E) | ✅ |
| Até 145 parcelas no total (10 de entrada + 135) | 10 + 135 | ✅ |
| Santas Casas, cooperativas, ONGs e instituições de ensino têm as condições de PN/ME/EPP (70%, 135x, entrada em 10x) | não existem como perfil; caem em "Demais PJ" (65%, 115x, entrada em 5x) | ➖ |
| PJ falida/em recuperação **não** aparece no grupo de 70% da página oficial | o simulador dá teto de 70% para Demais PJ falida (e exibe "Até 65%") | ⚠️ não confirmado |
| Selic nas parcelas; Simples Nacional excluído | não modela | ➖ |

### PGFN (Edital 06/2026)

| Regra oficial | Simulador | Status |
|---|---|---|
| Encargo legal: a página RFB fala em "adicional de **até 20%**" na inscrição em Dívida Ativa | usa 10% (o tooltip do site cita o DL 1.025/1969 e o DL 1.569/1977: 10% quando pago antes do ajuizamento) | ✅ (10% é o caso pré-ajuizamento) |
| Demais regras PGFN | as páginas da RFB não detalham | — |

### Grandes Teses / Controvérsia Jurídica (Editais Conjuntos PGFN/RFB 4 e 5/2026)

| Regra oficial | Arquivo inativo `controversia-juridica.js` (§11) | Status |
|---|---|---|
| Opções I a V: 65/55/45/35/25% de desconto, entrada mínima de 30/25/20/15/10%, até 12/24/36/48/60 parcelas | igual | ✅ |
| PF/BCN até 30% do saldo após o desconto; parcela mínima R$ 500 | igual | ✅ |
| Débitos da Portaria RFB 568/2025: 40%/30%/12x, 20%/25%/24x, 5%/20%/36x | não existe no arquivo | ➖ |
| Edital e prazo vigentes: 4 e 5/2026, até 29/12/2026 | arquivo cita o Edital 59/2025 e o prazo 29/12/2025 | ⚠️ desatualizado |
| Entrada paga até o último dia útil do mês do requerimento; depósitos judiciais convertidos em renda antes do cálculo | não modela | ➖ |

### Achados das FAQs dos Editais 10 e 09/2026 e dos roteiros

Detalhes, perguntas citadas e exemplos rodados no motor: [pesquisa/embasamento-oficial.md](pesquisa/embasamento-oficial.md). Os textos integrais estão em `fontes-oficiais/paginas-texto/12b`, `12c` e `13-*`.

**Confirmados:**
- Edital 10: opções, desconto sobre o total, ausência de entrada e parcela mínima de R$ 200. O exemplo oficial do roteiro (R$ 574,53 → R$ 287,27 em 1x) bate com o simulador.
- Edital 9:
  - base do rating = dívida PGFN+RFB + total a transacionar;
  - faixas 0,5 / 1 / 2;
  - δ = máx × (relação − 1);
  - rating D forçado;
  - entradas de 5% e 10%;
  - prazos do saldo 74 / 135 / 115 / 50;
  - PF/BCN até 30% de (S − E);
  - parcela mínima R$ 200 / R$ 300.

**Divergências:**

| # | Regra oficial | Simulador | Status |
|---|---|---|---|
| D1 | Limite de R$ 50 milhões **por processo** (FAQ-09 P1) | compara a **soma** dos débitos; 2 processos de R$ 30 mi ficam inelegíveis | ⚠️ |
| D5 | Teto do desconto (multa + juros) **por crédito/processo** (FAQ-09 P12-I) | teto global. Exemplo: desconto de R$ 900 mil no simulador contra R$ 650 mil oficial | ⚠️ |
| D2 | CAPAG = 0 → o discriminativo oficial classifica como **D** | classifica como **A** | ⚠️ |
| D3 | Demais PJ falida: **65%** (discriminativo oficial) | 70% | ⚠️ |
| D6 | ME/EPP/MEI com PF/BCN: entrada continua **5% em até 10x** (FAQ-09 P12-II) | sobe para 10% | ⚠️ |
| D8/D9 | Entrada previdenciária da Demais PJ C/D em até **10x**, e a entrada fazendária não é limitada pela previdenciária | 5x, e o máximo de parcelas da entrada é o menor entre as duas naturezas | ⚠️ |
| D4 | Edital 10: 60 SM **por processo** | no modo agregado, aplica ao total | ⚠️ |
| D10 | Entrada nunca menor que uma parcela mínima | não eleva | ⚠️ |
| — | Prazo dos Editais 9 e 10 | as **FAQs dizem 30/10/2026**; as páginas das modalidades e o simulador dizem 30/12/2026. Conflito nas próprias fontes oficiais | ⚠️ |
| — | Selic + 1% nas parcelas; exclusão do Simples Nacional; multa isolada no campo "Principal"; exigência de contencioso; conversão do PF/BCN (montante × alíquota) | não modelados | ➖ |

---

## 11. RFB — Controvérsia Jurídica (Edital 59/2025) — modalidade inativa

**Situação:**
- O arquivo `assets/js/modalidades/controversia-juridica.js` está publicado no servidor (cópia em [js/modalidades-inativas/controversia-juridica.js](js/modalidades-inativas/controversia-juridica.js)), mas o `simulador.html` **não o carrega**, então ela não aparece no Quadro-Resumo.
- O `quadro-resumo.js` já tem todo o tratamento dela (saldo, PF/BCN e vantagens). Para reativá-la, bastaria incluir o `<script>`.
- Prazo de adesão no código: 29/12/2025 (encerrado).
- **Não está no motor** do simulador básico, para manter os resultados iguais aos do site.

**Quem pode:** MEI, ME/EPP e Demais PJ (débitos abrangidos pelo Edital 59/2025). Não há teto de valor: `D = T`.

**Opções** (todas com PF/BCN até 30%):

| Opção | Redução `r` | Entrada `e` | Parcelas máx. |
|---|---|---|---|
| 3.1-I | 65% | 30% | 12 |
| 3.1-II | 55% | 25% | 24 |
| 3.1-III | 45% | 20% | 36 |
| 3.1-IV | 35% | 15% | 48 |
| 3.1-V | 25% | 10% | 60 |

Diferente das outras modalidades, aqui a entrada é calculada **depois** da redução e do PF/BCN:

```
S                 = D × (1 − r)
limite PF/BCN     = 30% × S
PF                = mín(máx(informado, 0), limite)       (padrão na tela: 0)
saldo após PF     = S − PF
E                 = saldo após PF × e                    (paga em 1x)
saldo             = saldo após PF − E
máx. parcelas     = mín(edital, máx(1, ⌊saldo ÷ 500⌋))  parcela mínima R$ 500
n                 = ⌊escolhido⌋ limitado a [1, máx]      (vazio ou 0 = máx)
prestação         = saldo ÷ n
```

**Exibição no Quadro-Resumo (se fosse carregada):**
- Redução = `r`.
- **Saldo devedor exibido = saldo após a entrada e o PF/BCN.**
- Entrada = "R$ E em 1x".
- PF/BCN editável de 0 até o limite. Ao contrário da RFB 50M, aqui o valor **fica guardado** entre recálculos.
- Parcelas recalculam ao digitar.
- Para a vantagem "maior número de parcelas" conta `1 + n`.

---

## 12. Formulários oficiais de adesão ("discriminativos") — calculam DIFERENTE da calculadora

A página [Simular Transação](fontes-oficiais/paginas-texto/07-simular-transacao.txt) leva a 4 formulários que geram o PDF "discriminativo" anexado ao pedido de adesão (cópias em [fontes-oficiais/](fontes-oficiais/)):

| Formulário | Script | Relatório completo |
|---|---|---|
| Pequeno Valor (`ate60sm.html`) | `negocio-60.js` | [pesquisa/formulario-ate60sm.md](pesquisa/formulario-ate60sm.md) |
| Até R$ 50 mi, fazendários e previdenciários | `negocio-faz.js` e `negocio-pre.js` | [pesquisa/formularios-fazendarios-previdenciarios.md](pesquisa/formularios-fazendarios-previdenciarios.md) |
| Controvérsia Jurídica / Grandes Teses (`editais.html`) | scripts inline | [pesquisa/formulario-controversia-juridica.md](pesquisa/formulario-controversia-juridica.md) |

Em todos eles, as sessões gravadas no Chrome com [testes/gravar-sessao.js](testes/gravar-sessao.js) (gravações em `testes/saida/sessoes/`) mostram **zero POST, zero XHR/fetch**. O cálculo e o PDF são feitos no navegador, e o PDF leva os dados em JSON no metadado `/Keywords`.

**Importante:** a calculadora (o "Simulador de Negociações") e os formulários são programas diferentes e **não dão os mesmos números**. Por isso há dois motores:

| Reproduz | Motor | Interface | Validação |
|---|---|---|---|
| a calculadora (§1–§9) | [motor-calculo.js](simulador-basico/motor-calculo.js) | [index.html](simulador-basico/index.html) | [testes/comparar-com-site.js](testes/comparar-com-site.js), [testes/testar-interface.js](testes/testar-interface.js) |
| os 4 formulários de adesão (§12) | [motor-formularios.js](simulador-basico/motor-formularios.js) | [formularios.html](simulador-basico/formularios.html) | [testes/comparar-formularios.js](testes/comparar-formularios.js) |

O motor dos formulários repete a ordem das operações e os arredondamentos intermediários de cada formulário (eles releem da tela valores já formatados). Ele também reproduz as falhas que mudam números, sempre com um aviso:
- o total desatualizado depois de uma recusa;
- a entrada exibida sem o piso;
- o corte silencioso do PF/BCN;
- os créditos próprios ignorados na Controvérsia;
- o PF de exatamente 30% recusado por ponto flutuante.

O teste preenche cada cenário no **código oficial** do formulário, rodando offline no Chrome, e compara cada texto da tela com o motor por igualdade exata. As cópias do formulário e da biblioteca gov.br estão em `fontes-oficiais/`.

**Sobre os parâmetros de entrada:**
- **Parcelas:** quando não são informadas, valem os padrões do formulário. No Pequeno Valor e no de R$ 50 mi, o padrão é **1 parcela**. Na Controvérsia, o padrão é **nenhuma seleção**, e o valor da parcela aparece como "0,00".
- **Ordem de digitação:** a de cima para baixo (principal → multa → juros, linha a linha).

### 12.1 Pequeno Valor — Edital 10/2026

- **Limites por processo:** `Tᵢ = P + M + J`. O processo é **recusado** se `Tᵢ > 97.260` (com mensagem) e precisa ter `Tᵢ ≥ R$ 10` (piso do DARF). O total geral não tem limite.
- **Saldo:** `S = T − T·d`, com d = 50/40/35/30%. Na opção IV, isso difere em 1 centavo de `T × (1 − d)` para muitos valores.
- **Parcelas:** `máx = mín(meses, ⌊S ÷ 200⌋)`, **sem piso de 1**.
  - Com S < 200, o formulário chega a 0 parcelas, dá erro de JS e gera o PDF mesmo assim.
  - A lista começa em 1 parcela; a calculadora começa no máximo.
- **Valor da parcela:** `arred₂(S) ÷ n`, ou seja, divide o saldo já arredondado. Isso dá 1 centavo de diferença em cerca de 3% dos casos.
- **Total desatualizado:** o total geral é recalculado a cada campo digitado, mas não quando a linha passa do limite. Depois de uma recusa, a tela mostra um total antigo, que pode incluir valores parciais da linha recusada. O formulário não deixa prosseguir nesse estado.

### 12.2 Até R$ 50 milhões — Edital 9/2026

**Rating:**
- Base = total do contencioso + dívida PGFN+RFB.
- `r = base ÷ CAPAG`, arredondado a 4 casas (`(100·base/CAPAG).toFixed(2)` relido sem o ponto). Faixas: A ≤ 0,5; B ≤ 1; C ≤ 2; D acima.
- Óbito, falida ou baixada → D.
- CAPAG = 0: a "relação" vira o próprio total escrito como percentual (ex.: "4700000%" → r = 470), o que quase sempre dá D. Com centavos, porém, pode dar A, B ou C ("4000.5%" → r = 4,0005).
- O nº do processo deve ter 15 dígitos, ou 17 com 2 DVs módulo 11. Inválido ou repetido em outra linha: o campo é apagado e o "Confirmar" barra.

**Desconto teórico:** `δ_C = δmax·(r − 1)` e `δ_D = δmax`, arredondados a 0,01 p.p. `δmax` = **65% para toda Demais PJ, inclusive falida**, e 70% para os demais.

**Desconto aplicado — por débito:**

```
desconto = Σᵢ mín(multaᵢ + jurosᵢ ; δ × totalᵢ)
```

**Entrada** (sobre o total antes do desconto, nunca menor que uma parcela mínima de R$ 200 PN / R$ 300 demais):

| Natureza | Rating A/B | Rating C/D | Parcelas da entrada |
|---|---|---|---|
| Fazendário | 10% | 5%, ou 10% só para Demais PJ que escolhe PF/BCN | até 5 (Demais PJ C/D) ou até 10 (demais) |
| Previdenciário | 5% | 5% | até 10 (saldo em até 50) |

**PF/BCN e parcelas:**
- PF/BCN aplicado = `mín(30% × (saldo após desconto − entrada) ; PF·alíq + BCN·alíq)`. O excesso é cortado sem aviso. As alíquotas são inteiras de 0 a 100%.
- Parcelas do saldo: `mín(74 | 135 | 115 ; ⌊saldo ÷ mínimo⌋)` no fazendário e `mín(50 ; …)` no previdenciário, sem piso de 1.
- **Valores das parcelas:** `entrada ÷ n` e `saldo ÷ n`, sem arredondamento intermediário. O saldo após descontos é relido da tela, já arredondado.
- **Entrada exibida:** a coluna "Entrada" mostra `total × %` sem o piso (exceto PN A/B no fazendário), mas o cálculo usa o piso.

**Formulário × calculadora** (cenários reais gravados):

| Regra | Cenário | Formulário | Calculadora / motor |
|---|---|---|---|
| Desconto por débito × agregado | F03 | 529.324,57 | 708.024,57 |
| | F05 | 1.631.600 | 2.080.000 |
| Demais PJ falida | F07 | desconto 1.625.000 (65%) | 1.750.000 (70%) |
| CAPAG = 0 | F11 | rating D, desconto 500.000 | rating A, desconto 0 |
| ME/EPP com PF/BCN | F04 | entrada 50.000 (5%) | 100.000 (10%) |
| PF/BCN acima do limite | F06 | corta 1.090.000 para 946.200 | rejeita (erro) |
| Entrada previdenciária de Demais PJ C/D | P01 | até 10x | até 5x |
| Piso da entrada | F12 | 300 | 200 |
| Saldo abaixo da parcela mínima | F13 | 0 opções e erro de JS | 1 parcela |

### 12.3 Controvérsia Jurídica / Grandes Teses (Editais Conjuntos 4 e 5/2026)

Mesma conta e mesma ordem do §11, com estas diferenças:

```
S        = D − D·r
PF/BCN   ≤ 30% × S           (acima disso: RECUSA, não trunca)
E        = (S − PF/BCN) × e  (1 parcela)
saldo    = S − PF/BCN − E
n_máx    = 1 se saldo ≤ 500; senão o maior n ≤ N com saldo ÷ n ≥ 500
prestação = arred₂(saldo) ÷ n
```

- **Créditos de PF/BCN:** o teto de cada crédito é `montante × alíquota` (9, 15, 20 ou 25%, escolha livre); o usuário digita o valor. Acima do teto, ou sem montante ou alíquota, o valor é apagado.
- **Total de créditos:** é recalculado só quando muda o valor de um crédito **de terceiro**. Por isso os créditos **próprios** só entram quando há crédito de terceiro digitado depois deles, e mesmo assim sem conferir o teto. Sem terceiros, o total fica "0".
- **Exibição:** a entrada é sempre em 1 parcela. O valor da parcela da entrada e o da prestação aparecem como "0,00" até o usuário escolher no seletor.
- **8 opções:** I–V e a tabela da Portaria RFB 568/2025 (40%/30%/12x, 20%/25%/24x, 5%/20%/36x).
- **Bugs do formulário oficial:**
  - o PF/BCN **próprio é ignorado** (os handlers não são ligados);
  - 30% exatos são recusados por erro de ponto flutuante;
  - o PDF pode ser gerado sem calcular.
