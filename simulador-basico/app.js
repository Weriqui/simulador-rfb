/**
 * app.js — interface do simulador básico.
 * Toda a matemática está em motor-calculo.js; aqui só há formulário, estado e renderização.
 *
 * Comportamentos copiados do site oficial para que os números fiquem iguais:
 *  - a opção/parcelas escolhidas em cada modalidade ficam "memorizadas" entre recálculos
 *    (inclusive a troca automática de opção quando ela deixa de ser elegível);
 *  - trocar a natureza (PGFN) zera as parcelas escolhidas;
 *  - o PF/BCN da RFB 50M é zerado quando qualquer outro dado do formulário ou da própria
 *    modalidade muda (no site ele é perdido em qualquer recálculo).
 */
(function () {
    'use strict';
    const M = window.MotorSimulador;
    const fm = M.formatarMoeda;
    const $ = sel => document.querySelector(sel);
    const $$ = sel => Array.from(document.querySelectorAll(sel));

    const PREFIXO_URL = { RFB_PEQUENO_VALOR: 'rfbpv', RFB_GERAL_50M: 'rfb50', PGFN_PEQUENO_VALOR: 'pgfnpv', PGFN_CAPACIDADE_PAGAMENTO: 'pgfncp' };

    const estado = {
        tipoContribuinte: null,
        situacao: { falidoRecuperacao: false, baixadoInapto: false },
        modo: 'AGREGADO',
        agregado: { principal: null, multa: null, juros: null },
        debitos: [{ principal: null, multa: null, juros: null }],
        capag: null,
        dividaTotalPgfnRfb: null,
        totalTransacionarFixo: null,   // null = acompanha o total (como reconfirmar no site)
        escolhas: {}
    };
    const detalhesAbertos = new Set();
    let ultimoResultado = null;
    let erroPfBcn = '';

    // ------------------------------------------------------------ máscara R$
    function valorDaMascara(input) {
        const digitos = input.value.replace(/\D/g, '');
        if (digitos === '') { input.value = ''; return null; }
        const valor = parseFloat(digitos) / 100;
        input.value = fm(valor);
        return valor;
    }
    function escreverMoeda(input, valor) {
        input.value = (valor === null || valor === undefined || valor === '') ? '' : fm(M.normalizarValor(valor));
    }

    // ------------------------------------------------------------ escolhas
    function escolha(chave) {
        if (!estado.escolhas[chave]) estado.escolhas[chave] = {};
        return estado.escolhas[chave];
    }
    // manterErro: no site a mensagem de erro do PF/BCN continua visível quando a própria
    // modalidade é recalculada (parcelas/entrada/opção); só some quando o formulário muda.
    function zerarPfBcn(manterErro) {
        if (estado.escolhas.RFB_GERAL_50M) {
            delete estado.escolhas.RFB_GERAL_50M.valorPfBcn;
            delete estado.escolhas.RFB_GERAL_50M._pfValido;
        }
        if (!manterErro) erroPfBcn = '';
    }

    // Equivalentes de estadoGlobal.capag e estadoGlobal.interface.simulacaoLiberada do site
    let capagJaCalculada = false;   // já houve um "change" com a CAPAG preenchida
    let ultimaCapagValida = null;   // o site usa a última CAPAG calculada quando o campo é apagado
    let simulacaoLiberada = false;  // CAPAG e dívida preenchidas (equivale a "Simular Modalidades")

    // ------------------------------------------------------------ formulário
    function totalDebitos() {
        if (estado.modo === 'AGREGADO') {
            const a = estado.agregado;
            return (a.principal || 0) + (a.multa || 0) + (a.juros || 0);
        }
        return estado.debitos.reduce((acc, d) => acc + ((d.principal || 0) + (d.multa || 0) + (d.juros || 0)), 0);
    }

    function renderizarDebitos() {
        const corpo = $('#corpo-debitos');
        corpo.innerHTML = estado.debitos.map((d, i) => `
            <tr>
                <td data-rotulo="Débito">${i + 1}</td>
                <td data-rotulo="Principal (R$)"><input class="moeda" type="text" inputmode="decimal" placeholder="0,00" data-debito="${i}" data-campo="principal" aria-label="Principal do débito ${i + 1} (R$)"></td>
                <td data-rotulo="Multa (R$)"><input class="moeda" type="text" inputmode="decimal" placeholder="0,00" data-debito="${i}" data-campo="multa" aria-label="Multa do débito ${i + 1} (R$)"></td>
                <td data-rotulo="Juros (R$)"><input class="moeda" type="text" inputmode="decimal" placeholder="0,00" data-debito="${i}" data-campo="juros" aria-label="Juros do débito ${i + 1} (R$)"></td>
                <td data-rotulo="Total (R$)" data-total-debito="${i}">${fm((d.principal || 0) + (d.multa || 0) + (d.juros || 0))}</td>
                <td><button type="button" class="pequeno" data-remover="${i}" aria-label="Excluir o débito ${i + 1}">✕</button></td>
            </tr>`).join('');
        estado.debitos.forEach((d, i) => {
            ['principal', 'multa', 'juros'].forEach(c => escreverMoeda(corpo.querySelector(`input[data-debito="${i}"][data-campo="${c}"]`), d[c]));
        });
    }

    function preencherFormulario() {
        $$('input[name="tipo"]').forEach(r => { r.checked = r.value === estado.tipoContribuinte; });
        $('#sit-falido').checked = !!estado.situacao.falidoRecuperacao;
        $('#sit-baixado').checked = !!estado.situacao.baixadoInapto;
        $$('input[name="modo"]').forEach(r => { r.checked = r.value === estado.modo; });
        $$('input[data-agregado]').forEach(inp => escreverMoeda(inp, estado.agregado[inp.dataset.agregado]));
        renderizarDebitos();
        escreverMoeda($('#capag'), estado.capag);
        escreverMoeda($('#divida-total'), estado.dividaTotalPgfnRfb);
        if (estado.totalTransacionarFixo !== null) escreverMoeda($('#total-transacionar'), estado.totalTransacionarFixo);
    }

    function atualizarVisibilidade() {
        const pj = ['MEI', 'ME_EPP', 'DEMAIS_PJ'].includes(estado.tipoContribuinte);
        $('#bloco-situacao').classList.toggle('oculto', !pj);
        if (!pj) {
            // como o site: para PN os checkboxes de situação são desmarcados
            estado.situacao = { falidoRecuperacao: false, baixadoInapto: false };
            $('#sit-falido').checked = false;
            $('#sit-baixado').checked = false;
        }
        $('#bloco-agregado').classList.toggle('oculto', estado.modo !== 'AGREGADO');
        $('#bloco-por-debito').classList.toggle('oculto', estado.modo !== 'POR_DEBITO');
        const total = totalDebitos();
        $('#total-debitos').value = fm(total);
        $('#total-agregado').textContent = 'R$ ' + fm(total);
        $('#linha-total-debitos').classList.toggle('oculto', estado.modo !== 'POR_DEBITO');
        const fixo = estado.totalTransacionarFixo !== null;
        $('#fixar-transacionar').checked = fixo;
        $('#total-transacionar').readOnly = !fixo;
        if (!fixo) $('#total-transacionar').value = fm(total);
    }

    // ------------------------------------------------------------ simulação
    function montarEntrada() {
        return {
            tipoContribuinte: estado.tipoContribuinte,
            situacao: estado.situacao,
            modo: estado.modo,
            agregado: estado.agregado,
            debitos: estado.debitos,
            capag: estado.capag !== null ? estado.capag : (ultimaCapagValida || 0),
            dividaTotalPgfnRfb: estado.dividaTotalPgfnRfb || 0,
            totalDebitosTransacionar: estado.totalTransacionarFixo !== null ? estado.totalTransacionarFixo : undefined,
            escolhas: JSON.parse(JSON.stringify(estado.escolhas))
        };
    }

    function esconderResultado(mensagem) {
        ultimoResultado = null;
        $('#container-quadro').classList.add('oculto');
        $('#resultado-vazio').classList.remove('oculto');
        $('#resultado-vazio').textContent = mensagem;
        $('#resumo-rating').innerHTML = '';
    }

    function recalcular() {
        atualizarVisibilidade();
        // Como no site: as modalidades são recalculadas a cada digitação dos débitos, mesmo antes
        // de a CAPAG ser preenchida (isso afeta a "memória" de opção/parcelas de cada modalidade).
        if (!estado.tipoContribuinte || !(totalDebitos() > 0)) {
            esconderResultado('Preencha o tipo de contribuinte e os débitos (total maior que zero).');
            return;
        }
        if (estado.capag !== null && estado.dividaTotalPgfnRfb !== null) simulacaoLiberada = true;
        const classificacaoPreenchida = simulacaoLiberada;

        let r = M.simular(montarEntrada());

        // PF/BCN inválido: como no site, mantém o último valor válido e mostra o erro
        const m50 = r.modalidades.find(m => m.chave === 'RFB_GERAL_50M');
        if (m50 && m50.exibicao && m50.exibicao.pfBcn.erro) {
            erroPfBcn = m50.exibicao.pfBcn.erro;
            const anterior = estado.escolhas.RFB_GERAL_50M && estado.escolhas.RFB_GERAL_50M._pfValido;
            if (anterior !== undefined) estado.escolhas.RFB_GERAL_50M.valorPfBcn = anterior;
            else delete estado.escolhas.RFB_GERAL_50M.valorPfBcn;
            r = M.simular(montarEntrada());
        }
        // Guarda o PF/BCN efetivamente aplicado (já truncado ao limite), como o input do site exibe
        if (estado.escolhas.RFB_GERAL_50M) {
            const e50 = estado.escolhas.RFB_GERAL_50M;
            const m = r.modalidades.find(x => x.chave === 'RFB_GERAL_50M');
            if (e50.valorPfBcn !== undefined && m && m.exibicao && m.exibicao.pfBcn.permitido && m.exibicao.pfBcn.valor !== undefined) {
                e50.valorPfBcn = m.exibicao.pfBcn.valor;
                e50._pfValido = e50.valorPfBcn;
            } else delete e50._pfValido;
        }

        // "Memória" do site: opção e parcelas (já ajustadas ao máximo) ficam guardadas
        r.modalidades.forEach(m => {
            if (!m.elegivel) return;
            // Sem CAPAG calculada o site considera a PGFN-Capacidade inelegível (não mexe nas escolhas)
            if (m.chave === 'PGFN_CAPACIDADE_PAGAMENTO' && !capagJaCalculada) return;
            const e = escolha(m.chave);
            e.opcao = m.opcaoIndex;
            if (m.numeroParcelasPersonalizado !== null && m.numeroParcelasPersonalizado !== undefined) e.parcelas = m.numeroParcelasPersonalizado;
            if (m.natureza) e.natureza = m.natureza;
        });

        if (!classificacaoPreenchida) {
            esconderResultado('Preencha a CAPAG e o valor total da dívida na PGFN e RFB (campos obrigatórios) para ver a comparação.');
            return;
        }
        ultimoResultado = r;
        renderizarRating(r);
        renderizarQuadro(r);
    }

    function renderizarRating(r) {
        const c = r.classificacao;
        const bloco = (titulo, x) => `
            <div>${titulo}<strong>Rating ${x.rating}</strong>
                Base: R$ ${fm(x.dividaBase)}<br>
                Dívida/CAPAG: ${r.entrada.capag > 0 ? (x.relacao * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + '%' : '— (CAPAG zero)'}<br>
                Desconto teórico: ${(x.descontoTeorico * 100).toLocaleString('pt-BR', { maximumFractionDigits: 4 })}%
            </div>`;
        $('#resumo-rating').innerHTML = bloco('PGFN', c.pgfn) + bloco('RFB', c.rfb) +
            (r.entrada.ratingForcadoD ? '<p class="dica" style="grid-column:1/-1;margin:0">Rating D forçado pela situação do contribuinte.</p>' : '');
    }

    // ------------------------------------------------------------ quadro-resumo
    function celulaEntrada(m) {
        const e = m.exibicao.entrada;
        if (e.semEntrada) return '<td class="centro" style="color:#777">Sem Entrada</td>';
        if (!m.permiteEditarParcelasEntrada) return `<td class="centro">R$ ${fm(e.valor)}${e.parcelas ? ' em ' + e.parcelas + 'x' : ''}</td>`;
        return `<td class="centro">R$ ${fm(e.valor)} em
            <input class="parc" type="number" min="1" ${e.maximo ? `max="${e.maximo}"` : ''} value="${e.parcelas}" data-acao="entrada" data-chave="${m.chave}" aria-label="Parcelas da entrada — ${m.nome}"> x
            <div class="sub">R$ ${fm(e.valorParcela)}/parcela</div>
            ${e.maximo ? `<div class="sub">Máx: ${e.maximo}x</div>` : ''}</td>`;
    }

    function celulaParcelas(m) {
        const p = m.exibicao.parcelas;
        return `<td class="centro">R$ ${fm(p.saldo)} em
            <input class="parc" type="number" min="1" max="${p.maximo}" value="${p.quantidade}" data-acao="parcelas" data-chave="${m.chave}" aria-label="Número de parcelas — ${m.nome}"> x
            <div class="sub">R$ ${fm(p.valorParcela)}/parcela</div>
            <div class="sub">Máx: ${p.maximo}x</div></td>`;
    }

    function celulaPfBcn(m) {
        const pf = m.exibicao.pfBcn;
        if (m.chave !== 'RFB_GERAL_50M' || !pf.permitido) return `<td class="centro">${pf.texto || 'NÃO'}</td>`;
        return `<td class="centro">
            <input class="pf moeda ${erroPfBcn ? 'erro' : ''}" type="text" inputmode="decimal" value="${fm(pf.valor)}" data-acao="pfbcn" data-chave="${m.chave}" aria-label="Valor de PF/BCN a utilizar (R$) — ${m.nome}">
            <div class="sub">Limite: R$ ${fm(pf.limite)}</div>
            ${erroPfBcn ? `<div class="erro-texto">${erroPfBcn}</div>` : ''}</td>`;
    }

    function celulaOpcoes(m) {
        let html = '';
        if (m.possuiSeletorNatureza) {
            html += `<select data-acao="natureza" data-chave="${m.chave}" aria-label="Natureza dos débitos — ${m.nome}">
                <option value="FAZENDARIO" ${m.natureza === 'FAZENDARIO' ? 'selected' : ''}>Débitos Fazendários</option>
                <option value="PREVIDENCIARIO" ${m.natureza === 'PREVIDENCIARIO' ? 'selected' : ''}>Débitos Previdenciários</option>
            </select><br>`;
        }
        html += `<select data-acao="opcao" data-chave="${m.chave}" aria-label="Modalidade — ${m.nome}">${m.opcoesDisponiveis.map(o =>
            `<option value="${o.index}" ${o.index === m.opcaoIndex ? 'selected' : ''}>${o.rotulo}</option>`).join('')}</select>`;
        return `<td>${html}</td>`;
    }

    function linhaMemoria(pares) {
        return '<dl>' + pares.filter(Boolean).map(([k, v, destaque]) => `<dt>${k}</dt><dd class="${destaque ? 'destaque' : ''}">${v}</dd>`).join('') + '</dl>';
    }
    const R = v => 'R$ ' + fm(v);
    const P = (v, casas = 2) => Number(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: casas }) + '%';

    function memoriaCalculo(m, r) {
        const x = m.resultado;
        const ex = m.exibicao;
        const blocos = [];
        if (m.chave === 'RFB_PEQUENO_VALOR') {
            blocos.push(['Cálculo', linhaMemoria([
                ['Dívida elegível (débitos ≤ 60 SM)', R(x.dividaSemReducao)],
                ['Redução da opção', P(x.reducaoPercentual)],
                ['Saldo = dívida × (1 − redução)', R(x.saldoDevedorAposReducao)],
                ['Parcela mínima', 'R$ 200,00'],
                ['Máx. parcelas = mín(edital; ⌊saldo ÷ 200⌋)', x.parcelasMaximasReais + 'x'],
                ['Valor da parcela = saldo ÷ nº parcelas', R(x.valorParcela), true],
                ['Economia', R(x.dividaSemReducao - x.saldoDevedorAposReducao)]
            ])]);
        } else if (m.chave === 'RFB_GERAL_50M') {
            const c = r.classificacao.rfb;
            blocos.push(['Desconto (RFB)', linhaMemoria([
                ['Rating RFB (base PGFN+RFB ÷ CAPAG)', `${c.rating} (${R(c.dividaBase)})`],
                ['Desconto teórico', P(x.reducaoPercentual, 4)],
                ['Desconto calculado = dívida × teórico', R(x.descontoCalculado)],
                ['Desconto máximo = multa + juros', R(x.descontoMaximoPermitido)],
                ['Desconto aplicado = menor dos dois', R(x.descontoAplicado), true],
                ['Alíquota efetiva', P(x.dividaSemReducao > 0 ? x.descontoAplicado / x.dividaSemReducao * 100 : 0)],
                ['Saldo após redução', R(x.saldoDevedorAposReducao)],
                ['Parcela mínima', R(x.valorMinimoParcela)]
            ])]);
            const bloco = (nome, ent, pctEnt, valEnt, aposEnt, pf, lim, rem, max, sel, prest) => [nome, linhaMemoria([
                [`Entrada (${pctEnt} da dívida, sem desconto)`, R(ent)],
                ['Parcelas da entrada', `${x.numeroParcelasEntrada}x de ${R(valEnt)} (máx ${x.numeroParcelasEntradaMaximas}x)`],
                ['Saldo após entrada = saldo − entrada', R(aposEnt)],
                x.usoPfBcn ? ['PF/BCN utilizado (limite 30%)', `${R(pf)} (limite ${R(lim)})`] : ['PF/BCN', 'não permitido'],
                ['Saldo remanescente', R(rem)],
                ['Demais prestações', `${sel}x (máx ${max}x)`],
                ['Valor da prestação', R(prest), true]
            ])];
            const pctFaz = (x.dividaSemReducao > 0 ? Math.round(x.entradaFazendaria / x.dividaSemReducao * 100) : 0) + '%';
            blocos.push(bloco('Débitos fazendários', x.entradaFazendaria, pctFaz, x.valorPrestacaoEntradaFazendaria, x.saldoAposEntradaFazendaria, x.valorPfBcnFazendario, x.limitePfBcnFazendario, x.saldoRemanescenteFazendario, x.parcelasFazendariasMaximas, x.parcelasFazendariasSelecionadas, x.valorPrestacaoFazendaria));
            blocos.push(bloco('Débitos previdenciários', x.entradaPrevidenciaria, '5%', x.valorPrestacaoEntradaPrevidenciaria, x.saldoAposEntradaPrevidenciaria, x.valorPfBcnPrevidenciario, x.limitePfBcnPrevidenciario, x.saldoRemanescentePrevidenciario, x.parcelasPrevidenciariasMaximas, x.parcelasPrevidenciariasSelecionadas, x.valorPrestacaoPrevidenciaria));
        } else if (m.chave === 'PGFN_PEQUENO_VALOR') {
            blocos.push(['Cálculo', linhaMemoria([
                ['Dívida elegível (+10% de inscrição em DAU)', R(x.dividaSemReducao)],
                ['Opção', m.opcaoCodigo],
                !x.entradaDesabilitada ? ['Entrada (5%, sem desconto)', `${R(x.entrada)} em ${x.numeroParcelasEntrada}x de ${R(x.valorParcelaEntrada)}`] : ['Entrada', 'sem entrada'],
                ['Saldo após desconto', R(x.saldoDevedorAposReducao)],
                ['Parcelas do saldo', `${x.numeroParcelas}x de ${R(x.valorParcela)} (máx ${x.parcelasMaximasReais}x)`, true],
                ['Parcela mínima', r.entrada.tipoContribuinte === 'MEI' ? 'R$ 25,00' : 'R$ 100,00'],
                ['Total pago', R(x.totalPago)],
                ['Economia real', `${R(ex.economia)} (${P(x.dividaSemReducao > 0 ? ex.economia / x.dividaSemReducao * 100 : 0)})`]
            ])]);
        } else if (m.chave === 'PGFN_CAPACIDADE_PAGAMENTO') {
            const c = r.classificacao.pgfn;
            const mm = x.memoria || {};
            blocos.push(['Classificação (PGFN)', linhaMemoria([
                ['Rating PGFN (dívida PGFN/RFB ÷ CAPAG)', `${c.rating} (${R(c.dividaBase)})`],
                ['Desconto teórico', P(c.descontoTeorico * 100, 4)],
                ['Dívida elegível (+10% DAU)', R(x.dividaSemReducao)],
                ['Principal original', R(mm.principalOriginal)]
            ])]);
            const linhas = [
                !x.entradaDesabilitada ? ['Entrada (6%, sem desconto)', `${R(x.entrada)} em ${x.numeroParcelasEntrada}x de ${R(x.valorParcelaEntrada)} (máx ${x.parcelasEntradaMaximasReais}x)`] : ['Entrada', 'sem entrada (à vista)']
            ];
            if (mm.saldoDevedorAposEntrada !== undefined) {
                linhas.push(
                    ['Principal amortizado na entrada', R(mm.principalAmortizadoNaEntrada)],
                    ['Saldo após entrada', R(mm.saldoDevedorAposEntrada)],
                    ['Juros/multas restantes', R(mm.saldoJurosMultasRestantes)],
                    ['Teto = saldo após entrada × desconto', R(mm.tetoDescontoRating)],
                    ['Desconto concedido = menor dos dois', R(mm.descontoConcedido), true]
                );
            } else {
                linhas.push(['Desconto', 'Rating A/B — sem desconto']);
            }
            linhas.push(
                ['Saldo a parcelar', R(x.saldoDevedorAposReducao)],
                ['Parcelas do saldo', `${x.numeroParcelas}x de ${R(x.valorParcela)} (máx ${x.parcelasMaximasReais}x)`, true],
                ['Total pago', R(x.totalPago)],
                ['Economia real', `${R(ex.economia)} (${P(x.dividaSemReducao > 0 ? ex.economia / x.dividaSemReducao * 100 : 0)})`]
            );
            blocos.push(['Pagamento', linhaMemoria(linhas)]);
        }
        const avisos = (m.avisos || []).length ? `<div class="avisos">${m.avisos.map(a => '⚠ ' + a).join('<br>')}</div>` : '';
        return `<div class="memoria">${blocos.map(([t, h]) => `<section><h4>${t}</h4>${h}</section>`).join('')}</div>${avisos}`;
    }

    function renderizarQuadro(r) {
        $('#resultado-vazio').classList.add('oculto');
        $('#container-quadro').classList.remove('oculto');
        const linhas = r.modalidades.map(m => {
            const nome = `${m.nome}<span class="prazo">Prazo para adesão: ${m.prazoAdesao}</span>`;
            if (!m.elegivel) {
                return `<tr><td>${nome}</td><td colspan="9" class="inelegivel">Não elegível — ${m.motivo || 'motivo não informado'}</td></tr>`;
            }
            const ex = m.exibicao;
            const notaPgfn = m.orgao === 'PGFN' ? '<div class="sub">inclui 10% de encargo (DAU)</div>' : '';
            const aberto = detalhesAbertos.has(m.chave);
            const temAviso = (m.avisos || []).length > 0;
            return `<tr>
                    <td>${nome}</td>
                    <td class="vantagens">${(m.vantagens || []).join('<br>') || '—'}</td>
                    <td class="centro">R$ ${fm(ex.dividaElegivel)}${notaPgfn}</td>
                    ${celulaOpcoes(m)}
                    <td class="centro">${ex.reducaoTexto}</td>
                    <td class="centro saldo">R$ ${fm(ex.saldoDevedor)}</td>
                    ${celulaEntrada(m)}
                    ${celulaParcelas(m)}
                    ${celulaPfBcn(m)}
                    <td class="centro"><button type="button" class="pequeno" data-acao="detalhes" data-chave="${m.chave}" aria-expanded="${aberto ? 'true' : 'false'}" aria-label="Memória de cálculo — ${m.nome}">${aberto ? '− Ocultar' : '+ Detalhes'}${temAviso ? ' ⚠' : ''}</button></td>
                </tr>
                <tr class="linha-detalhe ${aberto ? '' : 'oculto'}"><td colspan="10"><div class="detalhe-fixo"><h4>Memória de cálculo — ${m.nome}</h4>${memoriaCalculo(m, r)}</div></td></tr>`;
        }).join('');
        $('#corpo-quadro').innerHTML = linhas;
    }

    // ------------------------------------------------------------ eventos
    // Perfil, débitos ou modo: no site isso reexecuta registrarModalidade (perde PF/BCN e o erro)
    // e zera simulacaoLiberada (exige "Simular Modalidades" de novo, com CAPAG e dívida preenchidas).
    function aoMudarFormulario() { zerarPfBcn(); simulacaoLiberada = false; recalcular(); }
    // CAPAG/dívida (calcularRating no site): recalcula tudo, mas mantém a simulação liberada.
    function aoMudarClassificacao() { zerarPfBcn(); recalcular(); }

    $('#tipos').addEventListener('change', e => {
        estado.tipoContribuinte = e.target.value;
        aoMudarFormulario();
    });
    $('#sit-falido').addEventListener('change', e => { estado.situacao.falidoRecuperacao = e.target.checked; aoMudarFormulario(); });
    $('#sit-baixado').addEventListener('change', e => { estado.situacao.baixadoInapto = e.target.checked; aoMudarFormulario(); });
    // "Nenhuma das anteriores" (simulador.html, #sit-nenhuma): ao MARCAR, desmarca falido e baixado e
    // chama atualizarPerfilContribuinte (= aoMudarFormulario); ao DESMARCAR, o site não faz nada.
    // Ela não entra no estado do site: marcar falido/baixado depois não a desmarca, e trocar para
    // pessoa natural desmarca só falido/baixado. A interface repete esse comportamento.
    $('#sit-nenhuma').addEventListener('change', e => {
        if (!e.target.checked) return;
        $('#sit-falido').checked = false;
        $('#sit-baixado').checked = false;
        estado.situacao = { falidoRecuperacao: false, baixadoInapto: false };
        aoMudarFormulario();
    });
    $$('input[name="modo"]').forEach(r => r.addEventListener('change', e => {
        estado.modo = e.target.value;
        // Como no site (selecionarModoSimulacao): os dados do outro modo são apagados
        if (estado.modo === 'POR_DEBITO') {
            estado.agregado = { principal: null, multa: null, juros: null };
            $$('input[data-agregado]').forEach(i => { i.value = ''; });
        } else {
            estado.debitos = [{ principal: null, multa: null, juros: null }];
            renderizarDebitos();
        }
        aoMudarFormulario();
    }));
    $$('input[data-agregado]').forEach(inp => inp.addEventListener('input', () => {
        estado.agregado[inp.dataset.agregado] = valorDaMascara(inp);
        aoMudarFormulario();
    }));
    $('#corpo-debitos').addEventListener('input', e => {
        const inp = e.target;
        if (!inp.dataset.debito) return;
        const i = +inp.dataset.debito;
        estado.debitos[i][inp.dataset.campo] = valorDaMascara(inp);
        const d = estado.debitos[i];
        $(`[data-total-debito="${i}"]`).textContent = fm((d.principal || 0) + (d.multa || 0) + (d.juros || 0));
        aoMudarFormulario();
    });
    $('#corpo-debitos').addEventListener('click', e => {
        const btn = e.target.closest('[data-remover]');
        if (!btn) return;
        estado.debitos.splice(+btn.dataset.remover, 1);
        if (!estado.debitos.length) estado.debitos.push({ principal: null, multa: null, juros: null });
        renderizarDebitos();
        aoMudarFormulario();
    });
    $('#btn-incluir-debito').addEventListener('click', () => {
        estado.debitos.push({ principal: null, multa: null, juros: null });
        renderizarDebitos();
        aoMudarFormulario();
    });
    // "Fixar total a transacionar" (reproduz o total antigo usado pelo site sem reconfirmar)
    $('#fixar-transacionar').addEventListener('change', e => {
        estado.totalTransacionarFixo = e.target.checked ? totalDebitos() : null;
        escreverMoeda($('#total-transacionar'), estado.totalTransacionarFixo !== null ? estado.totalTransacionarFixo : totalDebitos());
        aoMudarFormulario();
    });
    $('#total-transacionar').addEventListener('input', e => {
        if (estado.totalTransacionarFixo === null) return;
        estado.totalTransacionarFixo = valorDaMascara(e.target) || 0;
        aoMudarFormulario();
    });

    // No site estes dois campos só recalculam no "change" (ao sair do campo / Enter)
    ['#capag', '#divida-total'].forEach(sel => {
        const campo = sel === '#capag' ? 'capag' : 'dividaTotalPgfnRfb';
        $(sel).addEventListener('input', e => { estado[campo] = valorDaMascara(e.target); });
        $(sel).addEventListener('change', e => {
            estado[campo] = valorDaMascara(e.target);
            if (estado.capag !== null) { capagJaCalculada = true; ultimaCapagValida = estado.capag; }
            aoMudarClassificacao();
        });
        $(sel).addEventListener('keydown', e => { if (e.key === 'Enter') e.target.blur(); });
    });

    // Controles do Quadro-Resumo (mesma semântica das funções alterar* do site)
    const corpoQuadro = $('#corpo-quadro');
    corpoQuadro.addEventListener('change', e => {
        const el = e.target;
        const acao = el.dataset.acao, chave = el.dataset.chave;
        if (!acao || !chave) return;
        const esc = escolha(chave);
        if (acao === 'natureza') { esc.natureza = el.value; esc.parcelas = null; }
        else if (acao === 'opcao') { esc.opcao = parseInt(el.value, 10); }
        else if (acao === 'parcelas') { if (String(el.value).trim() === '') return; esc.parcelas = parseInt(el.value, 10); }
        else if (acao === 'entrada') { esc.parcelasEntrada = parseInt(el.value, 10); }
        else if (acao === 'pfbcn') {
            erroPfBcn = '';
            // O site valida o novo valor contra o limite exibido agora (que já reflete o PF anterior)
            if (esc._pfValido > 0) esc.valorPfBcnAnterior = esc._pfValido;
            esc.valorPfBcn = el.value === '' ? 0 : M.normalizarValor(el.value);
            recalcular();
            delete esc.valorPfBcnAnterior;
            return;
        }
        if (chave === 'RFB_GERAL_50M') zerarPfBcn(true);
        recalcular();
    });
    corpoQuadro.addEventListener('input', e => {
        if (e.target.dataset.acao === 'pfbcn') valorDaMascara(e.target);
    });
    corpoQuadro.addEventListener('click', e => {
        const btn = e.target.closest('[data-acao="detalhes"]');
        if (!btn) return;
        const chave = btn.dataset.chave;
        if (detalhesAbertos.has(chave)) detalhesAbertos.delete(chave); else detalhesAbertos.add(chave);
        if (ultimoResultado) renderizarQuadro(ultimoResultado);
    });

    // Botões
    function toast(msg) {
        const t = $('#toast');
        t.textContent = msg;
        t.classList.add('visivel');
        setTimeout(() => t.classList.remove('visivel'), 2200);
    }
    function copiar(texto, msg) {
        const ok = () => toast(msg);
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texto).then(ok, () => prompt('Copie:', texto));
        else prompt('Copie:', texto);
    }
    function entradaParaUrl() {
        const e = montarEntrada();
        const escolhas = {};
        Object.entries(e.escolhas).forEach(([k, v]) => {
            const limpo = {};
            ['opcao', 'parcelas', 'parcelasEntrada', 'natureza', 'valorPfBcn'].forEach(c => { if (v[c] !== undefined && v[c] !== null) limpo[c] = v[c]; });
            escolhas[k] = limpo;
        });
        e.escolhas = escolhas;
        e.capag = estado.capag; e.dividaTotalPgfnRfb = estado.dividaTotalPgfnRfb;
        e.totalDebitosTransacionar = estado.totalTransacionarFixo;
        return e;
    }
    $('#btn-copiar-link').addEventListener('click', () => {
        if (!estado.tipoContribuinte) { toast('Escolha o tipo de contribuinte primeiro.'); return; }
        const url = location.href.split('?')[0].split('#')[0] + '?' + M.parametrosDeEntrada(entradaParaUrl());
        history.replaceState(null, '', url);
        copiar(url, 'Link copiado!');
    });
    $('#btn-copiar-json').addEventListener('click', () => {
        if (!ultimoResultado) { toast('Nada para copiar ainda.'); return; }
        const semFuncoes = JSON.stringify(ultimoResultado, (k, v) => (typeof v === 'function' ? undefined : v), 2);
        copiar(semFuncoes, 'Resultado copiado (JSON)!');
    });
    $('#btn-reiniciar-escolhas').addEventListener('click', () => { estado.escolhas = {}; erroPfBcn = ''; recalcular(); toast('Escolhas do quadro reiniciadas.'); });
    $('#btn-limpar').addEventListener('click', () => {
        Object.assign(estado, {
            tipoContribuinte: null, situacao: { falidoRecuperacao: false, baixadoInapto: false }, modo: 'AGREGADO',
            agregado: { principal: null, multa: null, juros: null }, debitos: [{ principal: null, multa: null, juros: null }],
            capag: null, dividaTotalPgfnRfb: null, totalTransacionarFixo: null, escolhas: {}
        });
        detalhesAbertos.clear();
        erroPfBcn = '';
        capagJaCalculada = false; ultimaCapagValida = null; simulacaoLiberada = false;
        $('#sit-nenhuma').checked = false;
        history.replaceState(null, '', location.href.split('?')[0]);
        preencherFormulario();
        recalcular();
    });

    // ------------------------------------------------------------ carga via URL
    function carregarDaUrl() {
        const params = new URLSearchParams(location.search);
        if (!params.get('tipo')) return false;
        const e = M.entradaDeParametros(params);
        const valor = v => (v === null || v === undefined || v === '') ? null : M.normalizarValor(v);
        estado.tipoContribuinte = M.TIPOS_CONTRIBUINTE[e.tipoContribuinte] ? e.tipoContribuinte : null;
        estado.situacao = e.situacao;
        estado.modo = e.modo === 'POR_DEBITO' ? 'POR_DEBITO' : 'AGREGADO';
        if (e.agregado) estado.agregado = { principal: valor(e.agregado.principal), multa: valor(e.agregado.multa), juros: valor(e.agregado.juros) };
        if (e.debitos && e.debitos.length) estado.debitos = e.debitos.map(d => ({ principal: valor(d.principal), multa: valor(d.multa), juros: valor(d.juros) }));
        estado.capag = valor(e.capag);
        estado.dividaTotalPgfnRfb = valor(e.dividaTotalPgfnRfb);
        if (estado.capag !== null) { capagJaCalculada = true; ultimaCapagValida = estado.capag; }
        estado.totalTransacionarFixo = valor(e.totalDebitosTransacionar);
        estado.escolhas = {};
        Object.entries(e.escolhas || {}).forEach(([k, v]) => {
            const x = {};
            if (v.opcao !== undefined) x.opcao = v.opcao;
            if (v.parcelas !== undefined) x.parcelas = parseInt(v.parcelas, 10);
            if (v.parcelasEntrada !== undefined) x.parcelasEntrada = parseInt(v.parcelasEntrada, 10);
            if (v.natureza !== undefined) x.natureza = String(v.natureza).toUpperCase();
            if (v.valorPfBcn !== undefined) x.valorPfBcn = M.normalizarValor(v.valorPfBcn);
            estado.escolhas[k] = x;
        });
        return true;
    }

    carregarDaUrl();
    preencherFormulario();
    recalcular();
})();
