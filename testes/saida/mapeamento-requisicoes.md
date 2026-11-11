# Mapeamento de requisições — Simulador de Negociações (RFB/PGFN)

- Gerado em: 2026-11-10T23:30:38.960Z
- Origem: site ao vivo — https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/
- Total de requisições: **259** | métodos ≠ GET: **0** | XHR/fetch: **0** | WebSockets: **0**

## Requisições por fase

| Fase | Requisições |
|---|---|
| carregamento | 32 |
| caso-1:simulacao | 3 |
| caso-2:recarregar-pagina | 32 |
| caso-3:recarregar-pagina | 32 |
| caso-4:recarregar-pagina | 32 |
| caso-5:recarregar-pagina | 32 |
| caso-6:recarregar-pagina | 32 |
| caso-7:recarregar-pagina | 32 |
| caso-8:recarregar-pagina | 32 |

## Requisições por servidor

| Servidor | Requisições |
|---|---|
| www.gov.br | 136 |
| cdngovbr-ds.estaleiro.serpro.gov.br | 64 |
| cdnjs.cloudflare.com | 24 |
| vlibras.gov.br | 24 |
| fonts.googleapis.com | 8 |
| cdn.jsdelivr.net | 3 |

## XHR / fetch / não-GET (qualquer fase)

_Nenhuma._

## Casos simulados pela interface

### Caso 1 — Print do usuário — Demais PJ, valor agregado

- Requisições disparadas durante a simulação: **3**
  - GET font https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-700.woff2
  - GET font https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-400i.woff2
  - GET font https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-500i.woff2
- Comparação site × motor local: **idêntico** ✔

| Modalidade | Redução | Saldo devedor | Entrada | Parcelas | PF/BCN |
|---|---|---|---|---|---|
| RFB – Edital nº 10/2026 – Até 60 salários-mínimos | Não elegível — Modalidade disponível apenas para Pessoa Natural, MEI, ME ou EPP. | | | | |
| RFB - Edital nº 9/2026 - Até 50 milhões por Processo | Até 65% | R$ 3.000.000,00 | R$ 235.000,00 em x R$ 47.000,00/parcela Máx: 5x | R$ 2.765.000,00 em x R$ 24.043,48/parcela Máx: 115x | Limite: R$ 829.500,00 |
| PGFN – Edital 06/2026 - Até 60 salários-mínimos | Não elegível — O valor total agregado, já acrescido de 10% (inscrição em Dívida Ativa), supera o limite de R$ 97260.00 (60 salários-mínimos). | | | | |
| PGFN – Edital 06/2026 - Conforme a Capacidade de Pagamento | 11,38% | R$ 4.617.197,75 | R$ 310.200,00 em x R$ 51.700,00/parcela Máx: 6x | R$ 4.306.997,75 em x R$ 37.780,68/parcela Máx: 114x | NÃO |

![caso 1](caso-1.png)

### Caso 2 — Demais PJ — mesmo caso + interações (natureza, opção, parcelas, entrada, PF/BCN)

- Requisições disparadas durante a simulação: **0**
- Comparação site × motor local: **idêntico** ✔

| Modalidade | Redução | Saldo devedor | Entrada | Parcelas | PF/BCN |
|---|---|---|---|---|---|
| RFB – Edital nº 10/2026 – Até 60 salários-mínimos | Não elegível — Modalidade disponível apenas para Pessoa Natural, MEI, ME ou EPP. | | | | |
| RFB - Edital nº 9/2026 - Até 50 milhões por Processo | Até 65% | R$ 3.000.000,00 | R$ 470.000,00 em x R$ 78.333,33/parcela Máx: 5x | R$ 2.430.000,00 em x R$ 40.500,00/parcela Máx: 115x | Limite: R$ 759.000,00 |
| PGFN – Edital 06/2026 - Até 60 salários-mínimos | Não elegível — O valor total agregado, já acrescido de 10% (inscrição em Dívida Ativa), supera o limite de R$ 97260.00 (60 salários-mínimos). | | | | |
| PGFN – Edital 06/2026 - Conforme a Capacidade de Pagamento | 11,38% | R$ 4.617.197,75 | R$ 310.200,00 em x R$ 77.550,00/parcela Máx: 6x | R$ 4.306.997,75 em x R$ 76.910,67/parcela Máx: 56x | NÃO |

![caso 2](caso-2.png)

### Caso 3 — ME/EPP — simulação por débito (3 débitos)

- Requisições disparadas durante a simulação: **0**
- Comparação site × motor local: **idêntico** ✔

| Modalidade | Redução | Saldo devedor | Entrada | Parcelas | PF/BCN |
|---|---|---|---|---|---|
| RFB – Edital nº 10/2026 – Até 60 salários-mínimos | 30% | R$ 64.400,00 | Sem Entrada | R$ 64.400,00 em x R$ 1.610,00/parcela Máx: 55x | NÃO |
| RFB - Edital nº 9/2026 - Até 50 milhões por Processo | Até 70% | R$ 230.000,00 | R$ 14.600,00 em x R$ 1.460,00/parcela Máx: 10x | R$ 215.400,00 em x R$ 1.595,56/parcela Máx: 135x | Limite: R$ 64.620,00 |
| PGFN – Edital 06/2026 - Até 60 salários-mínimos | 28,5% | R$ 72.358,00 | R$ 5.060,00 em x R$ 2.530,00/parcela Máx: 5x | R$ 67.298,00 em x R$ 3.364,90/parcela Máx: 55x | NÃO |
| PGFN – Edital 06/2026 - Conforme a Capacidade de Pagamento | 70% | R$ 235.472,00 | R$ 19.272,00 em x R$ 1.606,00/parcela Máx: 12x | R$ 216.200,00 em x R$ 1.625,56/parcela Máx: 133x | NÃO |

![caso 3](caso-3.png)

### Caso 4 — MEI — débito pequeno (até 5 salários-mínimos)

- Requisições disparadas durante a simulação: **0**
- Comparação site × motor local: **idêntico** ✔

| Modalidade | Redução | Saldo devedor | Entrada | Parcelas | PF/BCN |
|---|---|---|---|---|---|
| RFB – Edital nº 10/2026 – Até 60 salários-mínimos | 40% | R$ 3.480,00 | Sem Entrada | R$ 3.480,00 em x R$ 348,00/parcela Máx: 17x | NÃO |
| RFB - Edital nº 9/2026 - Até 50 milhões por Processo | Até 70% | R$ 5.069,20 | R$ 290,00 em x R$ 290,00/parcela Máx: 1x | R$ 4.779,20 em x R$ 318,61/parcela Máx: 15x | Limite: R$ 1.433,76 |
| PGFN – Edital 06/2026 - Até 60 salários-mínimos | 50% | R$ 3.190,00 | Sem Entrada | R$ 3.190,00 em x R$ 265,83/parcela Máx: 60x | NÃO |
| PGFN – Edital 06/2026 - Conforme a Capacidade de Pagamento | 0% | R$ 6.380,00 | R$ 382,80 em x R$ 31,90/parcela Máx: 12x | R$ 5.997,20 em x R$ 124,94/parcela Máx: 48x | NÃO |

![caso 4](caso-4.png)

### Caso 5 — Pessoa Natural com indicativo de óbito (rating D forçado)

- Requisições disparadas durante a simulação: **0**
- Comparação site × motor local: **idêntico** ✔

| Modalidade | Redução | Saldo devedor | Entrada | Parcelas | PF/BCN |
|---|---|---|---|---|---|
| RFB – Edital nº 10/2026 – Até 60 salários-mínimos | 50% | R$ 40.000,00 | Sem Entrada | R$ 40.000,00 em x R$ 3.333,33/parcela Máx: 12x | NÃO |
| RFB - Edital nº 9/2026 - Até 50 milhões por Processo | Até 70% | R$ 60.000,00 | R$ 4.000,00 em x R$ 400,00/parcela Máx: 10x | R$ 56.000,00 em x R$ 414,81/parcela Máx: 135x | NÃO |
| PGFN – Edital 06/2026 - Até 60 salários-mínimos | 50% | R$ 44.000,00 | Sem Entrada | R$ 44.000,00 em x R$ 44.000,00/parcela Máx: 1x | NÃO |
| PGFN – Edital 06/2026 - Conforme a Capacidade de Pagamento | 70% | R$ 60.000,00 | Sem Entrada | R$ 60.000,00 em x R$ 60.000,00/parcela Máx: 1x | NÃO |

![caso 5](caso-5.png)

### Caso 6 — Pessoa Natural — rating A (sem desconto na transação por capacidade)

- Requisições disparadas durante a simulação: **0**
- Comparação site × motor local: **idêntico** ✔

| Modalidade | Redução | Saldo devedor | Entrada | Parcelas | PF/BCN |
|---|---|---|---|---|---|
| RFB – Edital nº 10/2026 – Até 60 salários-mínimos | 50% | R$ 25.000,00 | Sem Entrada | R$ 25.000,00 em x R$ 2.083,33/parcela Máx: 12x | NÃO |
| RFB - Edital nº 9/2026 - Até 50 milhões por Processo | 0% | R$ 50.000,00 | R$ 5.000,00 em x R$ 500,00/parcela Máx: 10x | R$ 45.000,00 em x R$ 608,11/parcela Máx: 74x | NÃO |
| PGFN – Edital 06/2026 - Até 60 salários-mínimos | 50% | R$ 27.500,00 | Sem Entrada | R$ 27.500,00 em x R$ 27.500,00/parcela Máx: 1x | NÃO |
| PGFN – Edital 06/2026 - Conforme a Capacidade de Pagamento | 0% | R$ 55.000,00 | R$ 3.300,00 em x R$ 275,00/parcela Máx: 12x | R$ 51.700,00 em x R$ 1.077,08/parcela Máx: 48x | NÃO |

![caso 6](caso-6.png)

### Caso 7 — Demais PJ falida/em recuperação — 15 milhões

- Requisições disparadas durante a simulação: **0**
- Comparação site × motor local: **idêntico** ✔

| Modalidade | Redução | Saldo devedor | Entrada | Parcelas | PF/BCN |
|---|---|---|---|---|---|
| RFB – Edital nº 10/2026 – Até 60 salários-mínimos | Não elegível — Modalidade disponível apenas para Pessoa Natural, MEI, ME ou EPP. | | | | |
| RFB - Edital nº 9/2026 - Até 50 milhões por Processo | Até 65% | R$ 10.000.000,00 | R$ 750.000,00 em x R$ 150.000,00/parcela Máx: 5x | R$ 8.750.000,00 em x R$ 175.000,00/parcela Máx: 50x | Limite: R$ 2.775.000,00 |
| PGFN – Edital 06/2026 - Até 60 salários-mínimos | Não elegível — O valor total agregado, já acrescido de 10% (inscrição em Dívida Ativa), supera o limite de R$ 97260.00 (60 salários-mínimos). | | | | |
| PGFN – Edital 06/2026 - Conforme a Capacidade de Pagamento | 70% | R$ 10.390.000,00 | R$ 990.000,00 em x R$ 165.000,00/parcela Máx: 6x | R$ 9.400.000,00 em x R$ 82.456,14/parcela Máx: 114x | NÃO |

![caso 7](caso-7.png)

### Caso 8 — Demais PJ — acima de R$ 50 milhões (inelegível em quase tudo)

- Requisições disparadas durante a simulação: **0**
- Comparação site × motor local: **idêntico** ✔

| Modalidade | Redução | Saldo devedor | Entrada | Parcelas | PF/BCN |
|---|---|---|---|---|---|
| RFB – Edital nº 10/2026 – Até 60 salários-mínimos | Não elegível — Modalidade disponível apenas para Pessoa Natural, MEI, ME ou EPP. | | | | |
| RFB - Edital nº 9/2026 - Até 50 milhões por Processo | Não elegível — O valor total informado supera o limite de R$ 50000000.00 por processo. | | | | |
| PGFN – Edital 06/2026 - Até 60 salários-mínimos | Não elegível — O valor total agregado, já acrescido de 10% (inscrição em Dívida Ativa), supera o limite de R$ 97260.00 (60 salários-mínimos). | | | | |
| PGFN – Edital 06/2026 - Conforme a Capacidade de Pagamento | Não elegível — O valor total consolidado supera o limite de R$ 45 milhões. | | | | |

![caso 8](caso-8.png)

## Todas as requisições

| # | t (ms) | Fase | Método | Tipo | Status | URL |
|---|---|---|---|---|---|---|
| 1 | 162 | carregamento | GET | document | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/ |
| 2 | 305 | carregamento | GET | stylesheet | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/css/rawline.css |
| 3 | 305 | carregamento | GET | stylesheet | 200 | https://fonts.googleapis.com/css?family=Raleway:300,400,500,600,700,800,900&display=swap |
| 4 | 305 | carregamento | GET | stylesheet | 200 | https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css |
| 5 | 305 | carregamento | GET | stylesheet | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/govbr/core.min.css |
| 6 | 305 | carregamento | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/govbr/core.min.js |
| 7 | 305 | carregamento | GET | script | 200 | https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js |
| 8 | 305 | carregamento | GET | script | 404 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/pdf/jspdf.umd.min.j… |
| 9 | 305 | carregamento | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/core/utils.js |
| 10 | 305 | carregamento | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/core/estado_glob… |
| 11 | 305 | carregamento | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/core/composicao-… |
| 12 | 305 | carregamento | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/core/quadro-resu… |
| 13 | 305 | carregamento | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/core/vantagens-c… |
| 14 | 305 | carregamento | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/modalidades/rfb-… |
| 15 | 305 | carregamento | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/modalidades/50mi… |
| 16 | 305 | carregamento | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/modalidades/pgfn… |
| 17 | 305 | carregamento | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/modalidades/pgfn… |
| 18 | 306 | carregamento | GET | image | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/img/logo_govbr_bran… |
| 19 | 306 | carregamento | GET | image | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/img/logo_rfb_branco… |
| 20 | 306 | carregamento | GET | image | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/img/logo_redesim_br… |
| 21 | 306 | carregamento | GET | image | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/img/logo_acesso_inf… |
| 22 | 306 | carregamento | GET | script | 302 | https://vlibras.gov.br/app/vlibras-plugin.js |
| 23 | 792 | carregamento | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-400.woff2 |
| 24 | 792 | carregamento | GET | font | 200 | https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/webfonts/fa-solid-900.woff2 |
| 25 | 792 | carregamento | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-600.woff2 |
| 26 | 792 | carregamento | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-300.woff2 |
| 27 | 793 | carregamento | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-500.woff2 |
| 28 | 878 | carregamento | GET | script | 200 | https://cdn.jsdelivr.net/gh/spbgovbr-vlibras/vlibras-portal@v7.12.2/app/vlibras-plugin.js |
| 29 | 1127 | carregamento | GET | image | 302 | https://vlibras.gov.br/app/assets/images/vlibras-popup.webp |
| 30 | 1127 | carregamento | GET | image | 302 | https://vlibras.gov.br/app/assets/images/vlibras-access.svg |
| 31 | 1186 | carregamento | GET | image | 200 | https://cdn.jsdelivr.net/gh/spbgovbr-vlibras/vlibras-portal@v7.12.2/app/assets/images/vlibras-access.svg |
| 32 | 1186 | carregamento | GET | image | 200 | https://cdn.jsdelivr.net/gh/spbgovbr-vlibras/vlibras-portal@v7.12.2/app/assets/images/vlibras-popup.webp |
| 33 | 6282 | caso-1:simulacao | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-700.woff2 |
| 34 | 6282 | caso-1:simulacao | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-400i.woff2 |
| 35 | 22689 | caso-1:simulacao | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-500i.woff2 |
| 36 | 26866 | caso-2:recarregar-pagina | GET | document | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/ |
| 37 | 27367 | caso-2:recarregar-pagina | GET | stylesheet | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/css/rawline.css |
| 38 | 27367 | caso-2:recarregar-pagina | GET | stylesheet | 200 | https://fonts.googleapis.com/css?family=Raleway:300,400,500,600,700,800,900&display=swap |
| 39 | 27367 | caso-2:recarregar-pagina | GET | stylesheet | 200 | https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css |
| 40 | 27367 | caso-2:recarregar-pagina | GET | stylesheet | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/govbr/core.min.css |
| 41 | 27367 | caso-2:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/govbr/core.min.js |
| 42 | 27367 | caso-2:recarregar-pagina | GET | script | 200 | https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js |
| 43 | 27368 | caso-2:recarregar-pagina | GET | script | 404 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/pdf/jspdf.umd.min.j… |
| 44 | 27368 | caso-2:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/core/utils.js |
| 45 | 27368 | caso-2:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/core/estado_glob… |
| 46 | 27368 | caso-2:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/core/composicao-… |
| 47 | 27368 | caso-2:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/core/quadro-resu… |
| 48 | 27368 | caso-2:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/core/vantagens-c… |
| 49 | 27368 | caso-2:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/modalidades/rfb-… |
| 50 | 27368 | caso-2:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/modalidades/50mi… |
| 51 | 27368 | caso-2:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/modalidades/pgfn… |
| 52 | 27368 | caso-2:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/modalidades/pgfn… |
| 53 | 27368 | caso-2:recarregar-pagina | GET | image | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/img/logo_govbr_bran… |
| 54 | 27368 | caso-2:recarregar-pagina | GET | image | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/img/logo_rfb_branco… |
| 55 | 27369 | caso-2:recarregar-pagina | GET | image | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/img/logo_redesim_br… |
| 56 | 27369 | caso-2:recarregar-pagina | GET | image | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/img/logo_acesso_inf… |
| 57 | 27369 | caso-2:recarregar-pagina | GET | script | 200 | https://vlibras.gov.br/app/vlibras-plugin.js |
| 58 | 27370 | caso-2:recarregar-pagina | GET | image | 200 | https://vlibras.gov.br/app/assets/images/vlibras-popup.webp |
| 59 | 27370 | caso-2:recarregar-pagina | GET | image | 200 | https://vlibras.gov.br/app/assets/images/vlibras-access.svg |
| 60 | 27370 | caso-2:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-300.woff2 |
| 61 | 27370 | caso-2:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-400.woff2 |
| 62 | 27370 | caso-2:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-400i.woff2 |
| 63 | 27370 | caso-2:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-500.woff2 |
| 64 | 27370 | caso-2:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-500i.woff2 |
| 65 | 27370 | caso-2:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-600.woff2 |
| 66 | 27370 | caso-2:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-700.woff2 |
| 67 | 27370 | caso-2:recarregar-pagina | GET | font | 200 | https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/webfonts/fa-solid-900.woff2 |
| 68 | 35385 | caso-3:recarregar-pagina | GET | document | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/ |
| 69 | 35773 | caso-3:recarregar-pagina | GET | stylesheet | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/css/rawline.css |
| 70 | 35773 | caso-3:recarregar-pagina | GET | stylesheet | 200 | https://fonts.googleapis.com/css?family=Raleway:300,400,500,600,700,800,900&display=swap |
| 71 | 35780 | caso-3:recarregar-pagina | GET | stylesheet | 200 | https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css |
| 72 | 35781 | caso-3:recarregar-pagina | GET | stylesheet | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/govbr/core.min.css |
| 73 | 35781 | caso-3:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/govbr/core.min.js |
| 74 | 35781 | caso-3:recarregar-pagina | GET | script | 200 | https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js |
| 75 | 35782 | caso-3:recarregar-pagina | GET | script | 404 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/pdf/jspdf.umd.min.j… |
| 76 | 35815 | caso-3:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/core/utils.js |
| 77 | 35815 | caso-3:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/core/estado_glob… |
| 78 | 35902 | caso-3:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/core/composicao-… |
| 79 | 35902 | caso-3:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/core/quadro-resu… |
| 80 | 35902 | caso-3:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/core/vantagens-c… |
| 81 | 35902 | caso-3:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/modalidades/rfb-… |
| 82 | 35902 | caso-3:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/modalidades/50mi… |
| 83 | 35902 | caso-3:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/modalidades/pgfn… |
| 84 | 35902 | caso-3:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/modalidades/pgfn… |
| 85 | 35903 | caso-3:recarregar-pagina | GET | image | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/img/logo_govbr_bran… |
| 86 | 35903 | caso-3:recarregar-pagina | GET | image | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/img/logo_rfb_branco… |
| 87 | 35962 | caso-3:recarregar-pagina | GET | image | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/img/logo_redesim_br… |
| 88 | 35962 | caso-3:recarregar-pagina | GET | image | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/img/logo_acesso_inf… |
| 89 | 35962 | caso-3:recarregar-pagina | GET | script | 200 | https://vlibras.gov.br/app/vlibras-plugin.js |
| 90 | 35962 | caso-3:recarregar-pagina | GET | image | 200 | https://vlibras.gov.br/app/assets/images/vlibras-popup.webp |
| 91 | 35962 | caso-3:recarregar-pagina | GET | image | 200 | https://vlibras.gov.br/app/assets/images/vlibras-access.svg |
| 92 | 35962 | caso-3:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-300.woff2 |
| 93 | 35962 | caso-3:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-400.woff2 |
| 94 | 35963 | caso-3:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-400i.woff2 |
| 95 | 35963 | caso-3:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-500.woff2 |
| 96 | 35987 | caso-3:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-500i.woff2 |
| 97 | 35987 | caso-3:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-600.woff2 |
| 98 | 35987 | caso-3:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-700.woff2 |
| 99 | 35988 | caso-3:recarregar-pagina | GET | font | 200 | https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/webfonts/fa-solid-900.woff2 |
| 100 | 47507 | caso-4:recarregar-pagina | GET | document | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/ |
| 101 | 47940 | caso-4:recarregar-pagina | GET | stylesheet | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/css/rawline.css |
| 102 | 47940 | caso-4:recarregar-pagina | GET | stylesheet | 200 | https://fonts.googleapis.com/css?family=Raleway:300,400,500,600,700,800,900&display=swap |
| 103 | 47940 | caso-4:recarregar-pagina | GET | stylesheet | 200 | https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css |
| 104 | 47940 | caso-4:recarregar-pagina | GET | stylesheet | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/govbr/core.min.css |
| 105 | 47940 | caso-4:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/govbr/core.min.js |
| 106 | 47940 | caso-4:recarregar-pagina | GET | script | 200 | https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js |
| 107 | 47940 | caso-4:recarregar-pagina | GET | script | 404 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/pdf/jspdf.umd.min.j… |
| 108 | 47940 | caso-4:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/core/utils.js |
| 109 | 47940 | caso-4:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/core/estado_glob… |
| 110 | 47940 | caso-4:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/core/composicao-… |
| 111 | 47941 | caso-4:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/core/quadro-resu… |
| 112 | 47941 | caso-4:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/core/vantagens-c… |
| 113 | 47941 | caso-4:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/modalidades/rfb-… |
| 114 | 47941 | caso-4:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/modalidades/50mi… |
| 115 | 47941 | caso-4:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/modalidades/pgfn… |
| 116 | 47941 | caso-4:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/modalidades/pgfn… |
| 117 | 47941 | caso-4:recarregar-pagina | GET | image | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/img/logo_govbr_bran… |
| 118 | 47949 | caso-4:recarregar-pagina | GET | image | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/img/logo_rfb_branco… |
| 119 | 47949 | caso-4:recarregar-pagina | GET | image | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/img/logo_redesim_br… |
| 120 | 47949 | caso-4:recarregar-pagina | GET | image | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/img/logo_acesso_inf… |
| 121 | 47950 | caso-4:recarregar-pagina | GET | script | 200 | https://vlibras.gov.br/app/vlibras-plugin.js |
| 122 | 47950 | caso-4:recarregar-pagina | GET | image | 200 | https://vlibras.gov.br/app/assets/images/vlibras-popup.webp |
| 123 | 47950 | caso-4:recarregar-pagina | GET | image | 200 | https://vlibras.gov.br/app/assets/images/vlibras-access.svg |
| 124 | 47989 | caso-4:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-300.woff2 |
| 125 | 47989 | caso-4:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-400.woff2 |
| 126 | 47989 | caso-4:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-400i.woff2 |
| 127 | 47989 | caso-4:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-500.woff2 |
| 128 | 47989 | caso-4:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-500i.woff2 |
| 129 | 47989 | caso-4:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-600.woff2 |
| 130 | 47989 | caso-4:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-700.woff2 |
| 131 | 47989 | caso-4:recarregar-pagina | GET | font | 200 | https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/webfonts/fa-solid-900.woff2 |
| 132 | 57624 | caso-5:recarregar-pagina | GET | document | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/ |
| 133 | 58172 | caso-5:recarregar-pagina | GET | stylesheet | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/css/rawline.css |
| 134 | 58172 | caso-5:recarregar-pagina | GET | stylesheet | 200 | https://fonts.googleapis.com/css?family=Raleway:300,400,500,600,700,800,900&display=swap |
| 135 | 58172 | caso-5:recarregar-pagina | GET | stylesheet | 200 | https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css |
| 136 | 58172 | caso-5:recarregar-pagina | GET | stylesheet | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/govbr/core.min.css |
| 137 | 58172 | caso-5:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/govbr/core.min.js |
| 138 | 58172 | caso-5:recarregar-pagina | GET | script | 200 | https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js |
| 139 | 58172 | caso-5:recarregar-pagina | GET | script | 404 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/pdf/jspdf.umd.min.j… |
| 140 | 58172 | caso-5:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/core/utils.js |
| 141 | 58172 | caso-5:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/core/estado_glob… |
| 142 | 58172 | caso-5:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/core/composicao-… |
| 143 | 58173 | caso-5:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/core/quadro-resu… |
| 144 | 58173 | caso-5:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/core/vantagens-c… |
| 145 | 58173 | caso-5:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/modalidades/rfb-… |
| 146 | 58173 | caso-5:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/modalidades/50mi… |
| 147 | 58173 | caso-5:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/modalidades/pgfn… |
| 148 | 58173 | caso-5:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/modalidades/pgfn… |
| 149 | 58173 | caso-5:recarregar-pagina | GET | image | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/img/logo_govbr_bran… |
| 150 | 58173 | caso-5:recarregar-pagina | GET | image | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/img/logo_rfb_branco… |
| 151 | 58173 | caso-5:recarregar-pagina | GET | image | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/img/logo_redesim_br… |
| 152 | 58173 | caso-5:recarregar-pagina | GET | image | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/img/logo_acesso_inf… |
| 153 | 58173 | caso-5:recarregar-pagina | GET | script | 200 | https://vlibras.gov.br/app/vlibras-plugin.js |
| 154 | 58174 | caso-5:recarregar-pagina | GET | image | 200 | https://vlibras.gov.br/app/assets/images/vlibras-popup.webp |
| 155 | 58174 | caso-5:recarregar-pagina | GET | image | 200 | https://vlibras.gov.br/app/assets/images/vlibras-access.svg |
| 156 | 58174 | caso-5:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-300.woff2 |
| 157 | 58174 | caso-5:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-400.woff2 |
| 158 | 58174 | caso-5:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-400i.woff2 |
| 159 | 58174 | caso-5:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-500.woff2 |
| 160 | 58174 | caso-5:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-500i.woff2 |
| 161 | 58174 | caso-5:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-600.woff2 |
| 162 | 58174 | caso-5:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-700.woff2 |
| 163 | 58174 | caso-5:recarregar-pagina | GET | font | 200 | https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/webfonts/fa-solid-900.woff2 |
| 164 | 67609 | caso-6:recarregar-pagina | GET | document | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/ |
| 165 | 67680 | caso-6:recarregar-pagina | GET | stylesheet | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/css/rawline.css |
| 166 | 67680 | caso-6:recarregar-pagina | GET | stylesheet | 200 | https://fonts.googleapis.com/css?family=Raleway:300,400,500,600,700,800,900&display=swap |
| 167 | 67682 | caso-6:recarregar-pagina | GET | stylesheet | 200 | https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css |
| 168 | 67682 | caso-6:recarregar-pagina | GET | stylesheet | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/govbr/core.min.css |
| 169 | 67682 | caso-6:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/govbr/core.min.js |
| 170 | 67708 | caso-6:recarregar-pagina | GET | script | 200 | https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js |
| 171 | 67708 | caso-6:recarregar-pagina | GET | script | 404 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/pdf/jspdf.umd.min.j… |
| 172 | 67709 | caso-6:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/core/utils.js |
| 173 | 67709 | caso-6:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/core/estado_glob… |
| 174 | 67709 | caso-6:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/core/composicao-… |
| 175 | 67709 | caso-6:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/core/quadro-resu… |
| 176 | 67709 | caso-6:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/core/vantagens-c… |
| 177 | 67717 | caso-6:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/modalidades/rfb-… |
| 178 | 67717 | caso-6:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/modalidades/50mi… |
| 179 | 67717 | caso-6:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/modalidades/pgfn… |
| 180 | 67718 | caso-6:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/modalidades/pgfn… |
| 181 | 67718 | caso-6:recarregar-pagina | GET | image | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/img/logo_govbr_bran… |
| 182 | 67718 | caso-6:recarregar-pagina | GET | image | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/img/logo_rfb_branco… |
| 183 | 67718 | caso-6:recarregar-pagina | GET | image | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/img/logo_redesim_br… |
| 184 | 67718 | caso-6:recarregar-pagina | GET | image | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/img/logo_acesso_inf… |
| 185 | 67718 | caso-6:recarregar-pagina | GET | script | 200 | https://vlibras.gov.br/app/vlibras-plugin.js |
| 186 | 67733 | caso-6:recarregar-pagina | GET | image | 200 | https://vlibras.gov.br/app/assets/images/vlibras-popup.webp |
| 187 | 67734 | caso-6:recarregar-pagina | GET | image | 200 | https://vlibras.gov.br/app/assets/images/vlibras-access.svg |
| 188 | 67748 | caso-6:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-300.woff2 |
| 189 | 67748 | caso-6:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-400.woff2 |
| 190 | 67749 | caso-6:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-400i.woff2 |
| 191 | 67749 | caso-6:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-500.woff2 |
| 192 | 67758 | caso-6:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-500i.woff2 |
| 193 | 67758 | caso-6:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-600.woff2 |
| 194 | 67758 | caso-6:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-700.woff2 |
| 195 | 67758 | caso-6:recarregar-pagina | GET | font | 200 | https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/webfonts/fa-solid-900.woff2 |
| 196 | 74356 | caso-7:recarregar-pagina | GET | document | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/ |
| 197 | 75248 | caso-7:recarregar-pagina | GET | stylesheet | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/css/rawline.css |
| 198 | 75248 | caso-7:recarregar-pagina | GET | stylesheet | 200 | https://fonts.googleapis.com/css?family=Raleway:300,400,500,600,700,800,900&display=swap |
| 199 | 75248 | caso-7:recarregar-pagina | GET | stylesheet | 200 | https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css |
| 200 | 75291 | caso-7:recarregar-pagina | GET | stylesheet | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/govbr/core.min.css |
| 201 | 75291 | caso-7:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/govbr/core.min.js |
| 202 | 75291 | caso-7:recarregar-pagina | GET | script | 200 | https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js |
| 203 | 75291 | caso-7:recarregar-pagina | GET | script | 404 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/pdf/jspdf.umd.min.j… |
| 204 | 75291 | caso-7:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/core/utils.js |
| 205 | 75291 | caso-7:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/core/estado_glob… |
| 206 | 75291 | caso-7:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/core/composicao-… |
| 207 | 75291 | caso-7:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/core/quadro-resu… |
| 208 | 75291 | caso-7:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/core/vantagens-c… |
| 209 | 75291 | caso-7:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/modalidades/rfb-… |
| 210 | 75291 | caso-7:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/modalidades/50mi… |
| 211 | 75291 | caso-7:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/modalidades/pgfn… |
| 212 | 75292 | caso-7:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/modalidades/pgfn… |
| 213 | 75292 | caso-7:recarregar-pagina | GET | image | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/img/logo_govbr_bran… |
| 214 | 75292 | caso-7:recarregar-pagina | GET | image | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/img/logo_rfb_branco… |
| 215 | 75292 | caso-7:recarregar-pagina | GET | image | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/img/logo_redesim_br… |
| 216 | 75292 | caso-7:recarregar-pagina | GET | image | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/img/logo_acesso_inf… |
| 217 | 75292 | caso-7:recarregar-pagina | GET | script | 200 | https://vlibras.gov.br/app/vlibras-plugin.js |
| 218 | 75356 | caso-7:recarregar-pagina | GET | image | 200 | https://vlibras.gov.br/app/assets/images/vlibras-popup.webp |
| 219 | 75376 | caso-7:recarregar-pagina | GET | image | 200 | https://vlibras.gov.br/app/assets/images/vlibras-access.svg |
| 220 | 75379 | caso-7:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-300.woff2 |
| 221 | 75380 | caso-7:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-400.woff2 |
| 222 | 75380 | caso-7:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-400i.woff2 |
| 223 | 75380 | caso-7:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-500.woff2 |
| 224 | 75380 | caso-7:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-500i.woff2 |
| 225 | 75380 | caso-7:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-600.woff2 |
| 226 | 75380 | caso-7:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-700.woff2 |
| 227 | 75381 | caso-7:recarregar-pagina | GET | font | 200 | https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/webfonts/fa-solid-900.woff2 |
| 228 | 81213 | caso-8:recarregar-pagina | GET | document | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/ |
| 229 | 81292 | caso-8:recarregar-pagina | GET | stylesheet | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/css/rawline.css |
| 230 | 81293 | caso-8:recarregar-pagina | GET | stylesheet | 200 | https://fonts.googleapis.com/css?family=Raleway:300,400,500,600,700,800,900&display=swap |
| 231 | 81293 | caso-8:recarregar-pagina | GET | stylesheet | 200 | https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css |
| 232 | 81293 | caso-8:recarregar-pagina | GET | stylesheet | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/govbr/core.min.css |
| 233 | 81293 | caso-8:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/govbr/core.min.js |
| 234 | 81313 | caso-8:recarregar-pagina | GET | script | 200 | https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js |
| 235 | 81313 | caso-8:recarregar-pagina | GET | script | 404 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/pdf/jspdf.umd.min.j… |
| 236 | 81313 | caso-8:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/core/utils.js |
| 237 | 81313 | caso-8:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/core/estado_glob… |
| 238 | 81313 | caso-8:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/core/composicao-… |
| 239 | 81314 | caso-8:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/core/quadro-resu… |
| 240 | 81314 | caso-8:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/core/vantagens-c… |
| 241 | 81320 | caso-8:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/modalidades/rfb-… |
| 242 | 81331 | caso-8:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/modalidades/50mi… |
| 243 | 81331 | caso-8:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/modalidades/pgfn… |
| 244 | 81331 | caso-8:recarregar-pagina | GET | script | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/js/modalidades/pgfn… |
| 245 | 81369 | caso-8:recarregar-pagina | GET | image | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/img/logo_govbr_bran… |
| 246 | 81369 | caso-8:recarregar-pagina | GET | image | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/img/logo_rfb_branco… |
| 247 | 81369 | caso-8:recarregar-pagina | GET | image | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/img/logo_redesim_br… |
| 248 | 81369 | caso-8:recarregar-pagina | GET | image | 200 | https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/assets/img/logo_acesso_inf… |
| 249 | 81369 | caso-8:recarregar-pagina | GET | script | 200 | https://vlibras.gov.br/app/vlibras-plugin.js |
| 250 | 81642 | caso-8:recarregar-pagina | GET | image | 200 | https://vlibras.gov.br/app/assets/images/vlibras-popup.webp |
| 251 | 81643 | caso-8:recarregar-pagina | GET | image | 200 | https://vlibras.gov.br/app/assets/images/vlibras-access.svg |
| 252 | 81649 | caso-8:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-300.woff2 |
| 253 | 81649 | caso-8:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-400.woff2 |
| 254 | 81664 | caso-8:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-400i.woff2 |
| 255 | 81677 | caso-8:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-500.woff2 |
| 256 | 81677 | caso-8:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-500i.woff2 |
| 257 | 81677 | caso-8:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-600.woff2 |
| 258 | 81677 | caso-8:recarregar-pagina | GET | font | 200 | https://cdngovbr-ds.estaleiro.serpro.gov.br/design-system/fonts/rawline/font/rawline-700.woff2 |
| 259 | 81677 | caso-8:recarregar-pagina | GET | font | 200 | https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/webfonts/fa-solid-900.woff2 |