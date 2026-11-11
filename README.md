# Simulador RFB/PGFN — análise e versão básica

**Testar no navegador:** https://weriqui.github.io/simulador-rfb/ (calculadora) e https://weriqui.github.io/simulador-rfb/formularios.html (formulários de adesão).

> **Ferramenta não oficial**, sem vínculo com a Receita Federal ou a PGFN. Os cálculos rodam só no navegador; nenhum dado é enviado.

## O que foi descoberto sobre o site oficial

Calculadora: `https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/`

- **Não existe API nem cálculo no servidor.** A página é estática (HTML + 9 arquivos JS) e todo o cálculo roda no navegador.
- **A URL não aceita parâmetros.** Nenhum script lê `location.search`/`hash`; o servidor devolve a mesma página com ou sem querystring. Por isso não dá para "requisitar" uma simulação pela URL do site.
- **Mapeamento com Chrome real** ([testes/saida/mapeamento-requisicoes.md](testes/saida/mapeamento-requisicoes.md)):
  - Carregar a página faz 32 requisições GET, todas estáticas.
  - Durante as simulações: **0 XHR/fetch, 0 POST, 0 WebSocket**.
- **Os formulários oficiais de adesão** (Pequeno Valor, Fazendários, Previdenciários e Controvérsia Jurídica) também são 100% locais: zero POST e zero XHR em mais de 40 sessões gravadas. Mas **calculam de forma diferente** da calculadora (ver [FORMULAS.md §12](FORMULAS.md)).
- Os arquivos salvos em `js/` são **idênticos** aos publicados (conferido byte a byte em 10/11/2026).
- O servidor tem uma 5ª modalidade não carregada pela página (Controvérsia Jurídica), salva em `js/modalidades-inativas/`.

**Consequência:** a única forma de "simular por URL" é reproduzir as fórmulas localmente, que é o que esta pasta faz.

## Estrutura

| Caminho | Conteúdo |
|---|---|
| [FORMULAS.md](FORMULAS.md) | **Todas as fórmulas**, peculiaridades do site, embasamento oficial (§10), modalidade inativa (§11) e formulários de adesão (§12) |
| [simulador-basico/](simulador-basico/) | Simulador da calculadora: `index.html` (interface) e `motor-calculo.js` (motor). Simulador dos formulários de adesão: `formularios.html` e `motor-formularios.js`. Linha de comando para os dois: `simular-cli.js` |
| [pesquisa/](pesquisa/) | Relatórios detalhados: embasamento oficial (FAQs e roteiros) e análise de cada formulário oficial |
| [fontes-oficiais/](fontes-oficiais/) | Cópias dos formulários oficiais (HTML/JS, inclusive a biblioteca gov.br `govbr/core*.js` usada nos testes offline) e texto integral das páginas, FAQs e roteiros |
| [testes/](testes/) | Gravador de sessões, mapeamento de rede e testes de equivalência contra o site |
| `simulador.html`, `js/` | Cópia da calculadora oficial (referência) |

## Usar o simulador básico

Abra `simulador-basico/index.html` no navegador; não precisa de servidor nem de internet.

**Ele dá exatamente os mesmos números da calculadora oficial.** Reproduz inclusive os comportamentos de estado do site:
- a opção e as parcelas que ficam "memorizadas";
- o PF/BCN perdido em recálculos;
- a validação do segundo PF/BCN;
- o valor desatualizado da parcela de entrada após o PF/BCN (o aviso nos Detalhes mostra o valor recalculado).

### Simulação pela URL

O botão **"Copiar link desta simulação"** gera um link como este:

```
index.html?tipo=DEMAIS_PJ&modo=AGREGADO&principal=3000000&multa=1500000&juros=200000&capag=4000000&divida=4700000
```

| Parâmetro | Valores |
|---|---|
| `tipo` | `PN`, `PN_OBITO`, `MEI`, `ME_EPP`, `DEMAIS_PJ` |
| `falido=1`, `baixado=1` | situação cadastral (MEI, ME/EPP e Demais PJ) |
| `modo` | `AGREGADO` (padrão) ou `POR_DEBITO` |
| `principal`, `multa`, `juros` | modo agregado |
| `debitos` | modo por débito: `p;m;j\|p;m;j` (ex.: `debitos=20000;4000;3000\|150000;30000;20000`) |
| `capag` | capacidade de pagamento em 60 meses |
| `divida` | valor total da dívida na PGFN e RFB |
| `transacionar` | opcional: total "confirmado" antigo, para reproduzir o site quando os débitos foram editados sem clicar em Confirmar ([FORMULAS.md §9](FORMULAS.md), item 15) |
| `rfbpv_opcao` (0–3), `rfbpv_parcelas` | RFB até 60 SM |
| `rfb50_opcao` (`FAZENDARIO`/`PREVIDENCIARIO`), `rfb50_parcelas`, `rfb50_entrada`, `rfb50_pfbcn` | RFB até 50 milhões |
| `pgfnpv_opcao` (0–5), `pgfnpv_parcelas`, `pgfnpv_entrada` | PGFN até 60 SM |
| `pgfncp_opcao` (`COM_ENTRADA`/`AVISTA`), `pgfncp_natureza`, `pgfncp_parcelas`, `pgfncp_entrada` | PGFN Capacidade de Pagamento |

Formatos aceitos para valores: `3000000`, `3000000.50`, `3.000.000` ou `3.000.000,50`. Parcelas omitidas = máximo permitido (como no site).

### Linha de comando / Node

```bash
node simulador-basico/simular-cli.js "tipo=DEMAIS_PJ&principal=3000000&multa=1500000&juros=200000&capag=4000000&divida=4700000"
node simulador-basico/simular-cli.js "...mesmos parâmetros..." --json
```

```js
const { simular } = require('./simulador-basico/motor-calculo.js');
const r = simular({
  tipoContribuinte: 'DEMAIS_PJ',
  modo: 'AGREGADO',
  agregado: { principal: 3000000, multa: 1500000, juros: 200000 },
  capag: 4000000,
  dividaTotalPgfnRfb: 4700000,
  escolhas: { RFB_GERAL_50M: { opcao: 'FAZENDARIO', parcelas: 60, valorPfBcn: 100000 } }
});
// r.classificacao.{pgfn,rfb}.{rating, descontoTeorico, dividaBase}
// r.modalidades[i].{elegivel, motivo, resultado, exibicao, vantagens, avisos}
```

## Simulador dos formulários de adesão (discriminativos)

Abra `simulador-basico/formularios.html` (há um link no topo do `index.html`). Os 4 formulários oficiais que geram o PDF do pedido de adesão **calculam diferente da calculadora**. Esta página dá **exatamente os números do formulário oficial**:

| Aba | Formulário oficial |
|---|---|
| Pequeno Valor | `ate60sm.html` (Edital RFB 10/2026) |
| Até R$ 50 mi — fazendários | `fazendarios.html` (Edital RFB 9/2026) |
| Até R$ 50 mi — previdenciários | `previdenciarios.html` (Edital RFB 9/2026) |
| Controvérsia jurídica | `controversia-juridica-2026/editais.html` (Editais Conjuntos 4 e 5/2026) |

A principal diferença está no formulário de R$ 50 mi, que aplica o desconto **débito a débito**: `Σ mín(multa + juros ; δ × total)`. Há outras:
- **Demais PJ falida:** 65% no formulário, 70% na calculadora.
- **CAPAG = 0:** no formulário, a "relação" vira o próprio total, o que quase sempre dá rating D; na calculadora, dá rating A.
- **Entrada de ME/EPP com PF/BCN:** 5% no formulário, 10% na calculadora.
- **PF/BCN acima do limite:** o formulário corta sem avisar; a calculadora recusa.
- **Entrada previdenciária:** até 10x no formulário, 5x na calculadora.
- **Piso da entrada:** só o formulário aplica.

As falhas dos formulários que mudam números são reproduzidas e aparecem como aviso, por exemplo os créditos próprios de PF/BCN ignorados no de Controvérsia. Detalhes em [FORMULAS.md §12](FORMULAS.md).

Como nos formulários, qualquer alteração reinicia a escolha de parcelas. O padrão é 1 parcela; na Controvérsia, nenhuma seleção.

### Parâmetros de URL (formularios.html e simular-cli.js)

| Formulário | Parâmetros |
|---|---|
| todos | `form` = `ATE60SM`, `FAZENDARIOS`, `PREVIDENCIARIOS` ou `CONTROVERSIA`; `parcelas` |
| `ATE60SM` | `debitos=p;m;j\|p;m;j`, `opcao` (0–3 ou I–IV) |
| `FAZENDARIOS` / `PREVIDENCIARIOS` | `tipo` (`PN`, `PN_OBITO`, `ME_EPP`, `DEMAIS_PJ`); `falido=1`; `baixado=1`; `debitos=p;m;j[;processo]\|…`; `divida`; `capag`; `pf=1` (opção com PF/BCN); `pf_montante`; `pf_aliquota`; `bcn_montante`; `bcn_aliquota`; `entrada` (parcelas da entrada) |
| `CONTROVERSIA` | `debitos=v\|v`; `opcao` (1–8); `proprio_pf=montante;alíquota;valor`; `proprio_bcn=…`; `terceiros=montante;alíquota;valor\|…`; `entrada`; `corrigir=1` (corrige a falha dos créditos próprios) |

```bash
node simulador-basico/simular-cli.js "form=FAZENDARIOS&tipo=ME_EPP&debitos=400000;300000;300000|950000;30000;20000&divida=1200000&capag=2111111.11&entrada=7&parcelas=100"
```

## Testes e gravação de sessões

Requer Google Chrome ou Edge instalado (usa `playwright-core`, sem baixar navegador).

```bash
cd testes
npm install
node comparar-com-site.js --n=3000          # cenários aleatórios: código real do site × motor (igualdade exata)
node testar-interface.js --aleatorios=30    # roteiros digitados tecla a tecla no site e no simulador básico
node mapear-requisicoes.js                  # simulações clicando na interface + log de todas as requisições
node gravar-sessao.js <url> <nome>          # grava rede, eventos e chamadas de função JS de qualquer página
node comparar-formularios.js --n=500        # código oficial dos 4 formulários de adesão × motor-formularios.js (sempre offline)
node comparar-formularios.js --fixos        # os 16 cenários gravados ao vivo nos relatórios de pesquisa/
```

- **`--local`** (recomendado): roda **100% offline** com os arquivos salvos em `simulador.html` e `js/`. Só a biblioteca visual do gov.br é trocada por um stub, porque não tem cálculo. Sem esse parâmetro, os testes usam o site ao vivo.
- **Atenção:** o gov.br passou a recusar conexões desta máquina depois de milhares de carregamentos automatizados. Prefira `--local` e use o modo ao vivo com moderação.
- **Quando o site mudar:** baixe os JS de novo para `js/`, rode `node comparar-com-site.js --local` e veja quais campos divergem.
- **Conferência rápida sem navegador:** `node testes/verificar-motores.js` confere os dois motores contra cenários vistos nas telas oficiais. Roda no GitHub Actions antes de cada publicação do site.
- **Fora do repositório:** as gravações de sessão (`testes/saida/sessoes/`, 34 MB, citadas nos relatórios de `pesquisa/`) e as demais saídas dos testes. São recriadas pelos scripts de `testes/`.

### Site (GitHub Pages)

O fluxo [.github/workflows/pages.yml](.github/workflows/pages.yml) publica **somente** a pasta `simulador-basico/` a cada push na branch `main`. As cópias das páginas oficiais (`simulador.html`, `js/`, `fontes-oficiais/`) ficam no repositório só como referência para os testes e não são publicadas como site.

## Resultados (10 e 11/11/2026)

| Teste | Resultado |
|---|---|
| `comparar-com-site.js` (site ao vivo): 9.000 cenários, sementes 42 e 7 | **9.000 idênticos** (igualdade exata de ponto flutuante); 36 deles explicados pela "memória" de opção do site |
| `comparar-com-site.js --local` depois das correções finais (semente 2026) | **3.000/3.000 idênticos** |
| `testar-interface.js` (site ao vivo): 40 roteiros tecla a tecla | **40/40 idênticos** na tela |
| `testar-interface.js --local` depois das correções finais (comparação estrita, incluindo a parcela de entrada após PF/BCN) | **40/40 idênticos**, 0 erros de JS |
| Teste do PF/BCN duplo (site ao vivo) | igual ao site nos 3 passos (aceita e trunca; recusa; aceita) |
| `mapear-requisicoes.js`: 8 casos pela interface | 8/8 idênticos; 0 requisições de cálculo |
| `comparar-formularios.js` (código oficial dos 4 formulários, offline, 11/11/2026): 1.000 cenários por formulário, semente 20261111, com `--interface` | **4.000/4.000 idênticos** (todos os textos da tela). Incluem 722 cenários que o formulário recusa (débito acima do limite, abaixo de R$ 10, processo inválido ou repetido, PF acima de 30% etc.). `formularios.html` aberto pela URL de cada cenário: 4.000/4.000 iguais ao motor, 0 erros de JS |
| `comparar-formularios.js --fixos`: os 16 cenários gravados ao vivo nos relatórios de `pesquisa/` | **16/16 idênticos** |
| Auditoria independente (29 agentes) | 22 achados confirmados, todos de comportamento de estado, documentação ou interface (nenhum erro de fórmula no caminho normal), **todos corrigidos/documentados** |

> Aviso: assim como o simulador oficial, os cálculos têm caráter informativo e não geram direito à transação. O salário-mínimo (R$ 1.621,00) e os editais estão fixos no código e precisam ser atualizados quando o site mudar. Há divergências entre a calculadora oficial e os editais/formulários de adesão, documentadas em [FORMULAS.md §10 e §12](FORMULAS.md). `index.html` segue a calculadora; `formularios.html` segue os formulários de adesão.
