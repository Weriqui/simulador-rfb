/* Interface do modo "formulários de adesão" (usa window.MotorFormularios). */
(function () {
    'use strict';
    const M = window.MotorFormularios;
    const $ = sel => document.querySelector(sel);
    const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    function estadoVazio(form) {
        if (form === 'ATE60SM') return { formulario: form, debitos: [{ principal: '', multa: '', juros: '' }], opcao: null, parcelas: null };
        if (form === 'CONTROVERSIA') return {
            formulario: form, debitos: [''], opcao: null,
            creditosProprios: { pf: { montante: '', aliquota: '', valor: '' }, bcn: { montante: '', aliquota: '', valor: '' } },
            creditosTerceiros: [], parcelasEntrada: null, parcelas: null, corrigirCreditosProprios: false
        };
        return {
            formulario: form, tipo: null, falido: false, baixado: false,
            debitos: [{ principal: '', multa: '', juros: '', processo: '' }], dividaPgfnRfb: '', capag: '',
            comPf: false, pf: { montante: '', aliquota: '' }, bcn: { montante: '', aliquota: '' }, parcelasEntrada: null, parcelas: null
        };
    }

    const estados = { ATE60SM: estadoVazio('ATE60SM'), FAZENDARIOS: estadoVazio('FAZENDARIOS'), PREVIDENCIARIOS: estadoVazio('PREVIDENCIARIOS'), CONTROVERSIA: estadoVazio('CONTROVERSIA') };
    let atual = 'ATE60SM';
    let ultimoResultado = null;

    // -------------------------------- leitura da URL --------------------------------------
    function carregarDaUrl() {
        const q = location.search.replace(/^\?/, '');
        if (!q) return;
        const e = M.entradaDeParametros(q);
        if (!estados[e.formulario]) return;
        const base = estadoVazio(e.formulario);
        const s = Object.assign(base, e);
        if (e.formulario === 'CONTROVERSIA') {
            s.debitos = (e.debitos && e.debitos.length) ? e.debitos : [''];
            s.creditosProprios = {
                pf: Object.assign({ montante: '', aliquota: '', valor: '' }, (e.creditosProprios || {}).pf || {}),
                bcn: Object.assign({ montante: '', aliquota: '', valor: '' }, (e.creditosProprios || {}).bcn || {})
            };
            s.creditosTerceiros = (e.creditosTerceiros || []).map(c => Object.assign({ tipo: 'PF' }, c));
        } else if (!s.debitos || !s.debitos.length) {
            s.debitos = base.debitos;
        }
        if (e.formulario !== 'ATE60SM' && e.formulario !== 'CONTROVERSIA') {
            s.pf = { montante: (e.pf && e.pf.montante) || '', aliquota: (e.pf && e.pf.aliquota) || '' };
            s.bcn = { montante: (e.bcn && e.bcn.montante) || '', aliquota: (e.bcn && e.bcn.aliquota) || '' };
        }
        ['parcelas', 'parcelasEntrada'].forEach(k => { s[k] = s[k] === null || s[k] === undefined || s[k] === '' ? null : parseInt(s[k], 10); });
        estados[e.formulario] = s;
        atual = e.formulario;
    }

    // ---------------------------------- entradas -----------------------------------------
    const exibirMoeda = valor => {
        if (valor === null || valor === undefined || valor === '') return '';
        const v = M.valorDeCampo(valor);
        return v === null ? String(valor) : M.fmt(v);
    };
    const campoMoeda = (caminho, valor, extra = '') => `<input type="text" class="moeda" inputmode="decimal" placeholder="0,00" data-caminho="${caminho}" value="${esc(exibirMoeda(valor))}" ${extra}>`;

    function htmlDebitosPmj(s, comProcesso) {
        const linhas = s.debitos.map((d, i) => `
            <tr>
                <td>${i + 1}</td>
                ${comProcesso ? `<td><input type="text" data-caminho="debitos.${i}.processo" value="${esc(d.processo)}" placeholder="opcional" style="width:150px"></td>` : ''}
                <td>${campoMoeda(`debitos.${i}.principal`, d.principal)}</td>
                <td>${campoMoeda(`debitos.${i}.multa`, d.multa)}</td>
                <td>${campoMoeda(`debitos.${i}.juros`, d.juros)}</td>
                <td><button type="button" class="pequeno" data-acao="remover-debito" data-i="${i}" title="Excluir débito">✕</button></td>
            </tr>`).join('');
        return `
            <div class="container-tabela"><table class="tabela tabela-entrada">
                <thead><tr><th>#</th>${comProcesso ? '<th>Nº do processo</th>' : ''}<th>Principal (R$)</th><th>Multa (R$)</th><th>Juros (R$)</th><th></th></tr></thead>
                <tbody>${linhas}</tbody>
            </table></div>
            <div class="barra-botoes"><button type="button" class="pequeno" data-acao="incluir-debito">+ Incluir débito</button></div>`;
    }

    function htmlAte60sm(s) {
        const opcoes = M.OPCOES_60SM.map((o, i) => `<label><input type="radio" name="opcao" value="${i}" data-caminho="opcao" ${String(s.opcao) === String(i) ? 'checked' : ''}> ${esc(o.rotulo)}</label>`).join('');
        return `
        <div class="grade">
            <div class="cartao">
                <h2>1. Débitos (um por processo)</h2>
                <p class="dica">O formulário recusa processo acima de 60 salários-mínimos (R$ 97.260,00) e abaixo de R$ 10,00 (DARF). Não há limite para a soma.</p>
                ${htmlDebitosPmj(s, false)}
            </div>
            <div class="cartao">
                <h2>2. Modalidade (Edital RFB 10/2026)</h2>
                <div class="opcoes">${opcoes}</div>
                <p class="dica">Parcela mínima R$ 200,00, sem entrada. O desconto incide sobre o total (inclusive o principal).</p>
            </div>
        </div>`;
    }

    function html50M(s) {
        const pj = s.tipo === 'ME_EPP' || s.tipo === 'DEMAIS_PJ';
        const tipos = Object.entries(M.TIPOS_50M).map(([k, v]) => `<label><input type="radio" name="tipo" value="${k}" data-caminho="tipo" ${s.tipo === k ? 'checked' : ''}> ${esc(v)}</label>`).join('');
        return `
        <div class="grade">
            <div class="cartao">
                <h2>1. Identificação do contribuinte</h2>
                <div class="opcoes">${tipos}</div>
                <div class="opcoes ${pj ? '' : 'oculto'}">
                    <h3>Situação</h3>
                    <label><input type="checkbox" data-caminho="falido" ${s.falido ? 'checked' : ''}> Falido, em recuperação judicial/extrajudicial, liquidação ou intervenção</label>
                    <label><input type="checkbox" data-caminho="baixado" ${s.baixado ? 'checked' : ''}> Baixado, inapto ou suspenso</label>
                    <p class="dica">Óbito, falência ou baixa forçam o rating D. No formulário, a Demais PJ falida tem desconto máximo de 65% (não 70%).</p>
                </div>
            </div>
            <div class="cartao">
                <h2>3. Classificação dos débitos</h2>
                <div class="linha-campo"><span>Valor total da dívida na PGFN e RFB, fora do contencioso (R$) *</span>${campoMoeda('dividaPgfnRfb', s.dividaPgfnRfb)}</div>
                <div class="linha-campo"><span>Capacidade de pagamento em 60 meses (R$) *</span>${campoMoeda('capag', s.capag)}</div>
                <p class="dica">O formulário soma esse valor ao total do contencioso. Não inclua de novo os débitos do contencioso.</p>
                <h3>Prejuízo fiscal / BCN (só ME/EPP e Demais PJ com rating C ou D)</h3>
                <label class="opcoes"><span style="display:flex;gap:8px"><input type="checkbox" data-caminho="comPf" ${s.comPf ? 'checked' : ''}> Escolher a opção <strong>com</strong> PF/BCN</span></label>
                <div class="${s.comPf ? '' : 'oculto'}">
                    <div class="linha-campo"><span>Montante do prejuízo fiscal (R$)</span>${campoMoeda('pf.montante', s.pf.montante)}</div>
                    <div class="linha-campo"><span>Alíquota do PF (% inteiro)</span><input type="text" class="moeda" data-caminho="pf.aliquota" value="${esc(s.pf.aliquota)}" placeholder="25"></div>
                    <div class="linha-campo"><span>Montante da BCN da CSLL (R$)</span>${campoMoeda('bcn.montante', s.bcn.montante)}</div>
                    <div class="linha-campo"><span>Alíquota da BCN (% inteiro)</span><input type="text" class="moeda" data-caminho="bcn.aliquota" value="${esc(s.bcn.aliquota)}" placeholder="9"></div>
                </div>
            </div>
        </div>
        <div class="cartao">
            <h2>2. Débitos do contencioso (um por processo, até R$ 50 milhões cada)</h2>
            ${htmlDebitosPmj(s, true)}
            <p class="dica">O nº do processo é opcional aqui. Se informado, é conferido como no formulário: 15 dígitos, ou 17 com dígitos verificadores, sem repetir em outra linha.</p>
        </div>`;
    }

    function htmlCredito(caminho, c, tipoFixo) {
        const aliq = ['', 9, 15, 20, 25].map(a => `<option value="${a}" ${String(c.aliquota) === String(a) ? 'selected' : ''}>${a === '' ? '—' : a + '%'}</option>`).join('');
        return `
            <td>${tipoFixo ? esc(tipoFixo) : `<select data-caminho="${caminho}.tipo"><option ${c.tipo === 'PF' ? 'selected' : ''}>PF</option><option ${c.tipo === 'BCN' ? 'selected' : ''}>BCN</option></select>`}</td>
            <td>${campoMoeda(caminho + '.montante', c.montante)}</td>
            <td><select data-caminho="${caminho}.aliquota">${aliq}</select></td>
            <td>${campoMoeda(caminho + '.valor', c.valor)}</td>`;
    }

    function htmlControversia(s) {
        const opcoes = M.OPCOES_CONTROVERSIA.map(o => `<label><input type="radio" name="opcao" value="${o.codigo}" data-caminho="opcao" ${String(s.opcao) === o.codigo ? 'checked' : ''}>
            ${esc(o.item)} — redução ${Math.round(o.reducao * 100)}%, entrada ${Math.round(o.entrada * 100)}% à vista, saldo em até ${o.parcelasSaldo}x</label>`).join('');
        const debitos = s.debitos.map((v, i) => `<tr><td>${i + 1}</td><td>${campoMoeda(`debitos.${i}`, v)}</td><td><button type="button" class="pequeno" data-acao="remover-debito" data-i="${i}">✕</button></td></tr>`).join('');
        const terceiros = s.creditosTerceiros.map((c, i) => `<tr><td>${i + 1}</td>${htmlCredito(`creditosTerceiros.${i}`, c)}<td><button type="button" class="pequeno" data-acao="remover-terceiro" data-i="${i}">✕</button></td></tr>`).join('');
        return `
        <div class="grade">
            <div class="cartao">
                <h2>1. Débitos a transacionar (valor atualizado)</h2>
                <div class="container-tabela"><table class="tabela tabela-entrada"><thead><tr><th>#</th><th>Valor (R$)</th><th></th></tr></thead><tbody>${debitos}</tbody></table></div>
                <div class="barra-botoes"><button type="button" class="pequeno" data-acao="incluir-debito">+ Incluir débito</button></div>
            </div>
            <div class="cartao">
                <h2>3. Opção de transação</h2>
                <div class="opcoes">${opcoes}</div>
                <p class="dica">Parcela mínima R$ 500,00. PF/BCN até 30% da dívida já reduzida; a entrada é calculada depois do abatimento.</p>
            </div>
        </div>
        <div class="cartao">
            <h2>2. Créditos de prejuízo fiscal e base negativa (opcional)</h2>
            <div class="container-tabela"><table class="tabela tabela-entrada">
                <thead><tr><th class="esq">Créditos próprios</th><th>Tipo</th><th>Montante (R$)</th><th>Alíquota</th><th>Valor do crédito (R$)</th></tr></thead>
                <tbody>
                    <tr><td class="esq">Próprio</td>${htmlCredito('creditosProprios.pf', s.creditosProprios.pf, 'Prejuízo fiscal')}</tr>
                    <tr><td class="esq">Próprio</td>${htmlCredito('creditosProprios.bcn', s.creditosProprios.bcn, 'BCN da CSLL')}</tr>
                </tbody>
            </table></div>
            <h3>Créditos de terceiros</h3>
            <div class="container-tabela"><table class="tabela tabela-entrada">
                <thead><tr><th>#</th><th>Tipo</th><th>Montante (R$)</th><th>Alíquota</th><th>Valor do crédito (R$)</th><th></th></tr></thead>
                <tbody>${terceiros || '<tr><td colspan="6" class="esq dica">Nenhum crédito de terceiro.</td></tr>'}</tbody>
            </table></div>
            <div class="barra-botoes"><button type="button" class="pequeno" data-acao="incluir-terceiro">+ Incluir crédito de terceiro</button></div>
            <label class="dica" style="display:flex;gap:6px;align-items:flex-start">
                <input type="checkbox" data-caminho="corrigirCreditosProprios" ${s.corrigirCreditosProprios ? 'checked' : ''}>
                <span>Corrigir a falha do formulário com créditos <strong>próprios</strong>. Por padrão o simulador reproduz o formulário oficial, que só soma os créditos próprios quando há crédito de terceiro digitado depois deles (e sem conferir o limite montante × alíquota).</span>
            </label>
        </div>`;
    }

    function renderizarEntradas() {
        document.querySelectorAll('#abas button').forEach(b => b.classList.toggle('ativa', b.dataset.form === atual));
        const s = estados[atual];
        const html = atual === 'ATE60SM' ? htmlAte60sm(s) : atual === 'CONTROVERSIA' ? htmlControversia(s) : html50M(s);
        $('#entradas').innerHTML = html;
    }

    // ---------------------------------- resultado ----------------------------------------
    const selectParcelas = (caminho, maximo, escolhido, placeholder) => {
        if (!maximo || maximo < 1) return '<em class="dica">nenhuma opção</em>';
        let h = `<select data-caminho="${caminho}" data-parcelas="1">`;
        if (placeholder) h += `<option value="" ${escolhido === null ? 'selected' : ''}>Selecione</option>`;
        for (let i = 1; i <= maximo; i++) h += `<option value="${i}" ${escolhido === i ? 'selected' : ''}>${i} parcela${i > 1 ? 's' : ''}</option>`;
        return h + '</select>';
    };

    function htmlMensagens(r) {
        let h = '';
        if (r.erros && r.erros.length) h += `<div class="erros"><strong>O formulário oficial não deixa prosseguir:</strong><ul>${r.erros.map(e => `<li>${esc(e)}</li>`).join('')}</ul></div>`;
        if (r.avisos && r.avisos.length) h += `<div class="avisos"><strong>Comportamento do formulário oficial:</strong><ul>${r.avisos.map(e => `<li>${esc(e)}</li>`).join('')}</ul></div>`;
        return h;
    }

    function resultadoAte60sm(r) {
        let h = htmlMensagens(r);
        h += `<div class="cartao"><h2>Total de débitos: R$ ${esc(r.totalGeral)}</h2>`;
        if (r.resultado) {
            const x = r.resultado;
            h += `<div class="item-edital">Opção ${esc(x.rotuloOpcao)}</div>
            <div class="container-tabela"><table class="tabela">
                <thead><tr><th>Total (R$)</th><th>Critério</th><th>Desconto (R$)</th><th>Saldo devedor (R$)</th><th>Nº parcelas</th><th>Valor da parcela (R$)</th><th>Código do DARF</th></tr></thead>
                <tbody><tr><td>${esc(x.total)}</td><td class="esq">${esc(x.criterio)}</td><td>${esc(x.desconto)}</td><td>${esc(x.saldo)}</td>
                <td>${selectParcelas('parcelas', x.parcelasMaximo, x.parcelas)}</td><td><strong>${esc(x.valorParcela)}</strong></td><td>${esc(x.darf)}</td></tr></tbody>
            </table></div>`;
        }
        return h + '</div>';
    }

    function resultado50M(r) {
        let h = htmlMensagens(r);
        if (r.classificacao) {
            const c = r.classificacao;
            h += `<div class="cartao"><h2>Classificação dos débitos</h2><div class="kpis">
                <div>Total de débitos a transacionar<strong>${esc(c.totalDebitosTransacionar)}</strong></div>
                <div>Total da dívida na PGFN e RFB<strong>${esc(c.dividaPgfnRfb)}</strong></div>
                <div>Total de débitos<strong>${esc(c.totalDebitos)}</strong></div>
                <div>Capacidade de pagamento<strong>${esc(c.capag || '—')}</strong></div>
                <div>Relação débitos / CAPAG<strong>${esc(c.relacao)}</strong></div>
                <div>Desconto teórico<strong>${esc(c.descontoTeorico)}</strong></div>
                <div>Rating<strong>${esc(c.rating)}</strong></div>
            </div></div>`;
        }
        if (!r.resultado) return h;
        const x = r.resultado;
        h += `<div class="item-edital">${esc(x.rotuloItem)}${x.comPf ? ' — com utilização de prejuízo fiscal / BCN' : ''} · parcela mínima R$ ${M.fmt(r.parcelaMinima)}</div>`;
        if (x.descontos) {
            const linha = (l, total) => `<tr class="${total ? 'total' : ''}"><td class="esq">${total ? 'Total' : esc(l.processo || l.numero)}</td><td>${esc(l.principal)}</td><td>${esc(l.multa)}</td><td>${esc(l.juros)}</td><td>${esc(l.total)}</td><td>${esc(l.descontoMaximo)}</td><td>${esc(l.descontoAplicado)}</td><td>${esc(l.saldo)}</td></tr>`;
            h += `<div class="cartao"><h2>Detalhamento dos descontos (por débito)</h2><div class="container-tabela"><table class="tabela">
                <thead><tr><th class="esq">Processo</th><th>Principal</th><th>Multa</th><th>Juros</th><th>Total</th><th>Desconto máximo permitido</th><th>Desconto obtido</th><th>Saldo devedor</th></tr></thead>
                <tbody>${x.descontos.linhas.map(l => linha(l)).join('')}${linha(x.descontos.total, true)}</tbody></table></div>
                <p class="dica">Desconto obtido = menor valor entre multa + juros e o desconto teórico × total, débito a débito.</p></div>`;
        }
        const e = x.entrada;
        h += `<div class="cartao"><h2>Detalhamento da entrada</h2><div class="container-tabela"><table class="tabela">
            <thead><tr><th>Total devido${x.descontos ? ' (antes dos descontos)' : ''} (R$)</th><th>Entrada (R$)</th><th>Nº parcelas</th><th>Valor da parcela (R$)</th><th>Código do DARF</th></tr></thead>
            <tbody><tr><td>${esc(e.totalDevido)}</td><td>${esc(e.entradaExibida)}</td><td>${selectParcelas('parcelasEntrada', e.parcelasMaximo, e.parcelas)}</td><td><strong>${esc(e.valorParcela)}</strong></td><td>${esc(e.darf)}</td></tr></tbody>
        </table></div></div>`;
        if (x.prejuizoFiscal) {
            const p = x.prejuizoFiscal;
            h += `<div class="cartao"><h2>Utilização de prejuízo fiscal / BCN</h2><div class="container-tabela"><table class="tabela">
                <thead><tr><th>Saldo devedor (R$)</th><th>Limite PF/BCN — 30% (R$)</th><th>Abatimento proposto (R$)</th><th>Abatimento aplicado (R$)</th><th>Saldo a pagar (R$)</th></tr></thead>
                <tbody><tr><td>${esc(p.saldoDevedor)}</td><td>${esc(p.limite)}</td><td>${esc(p.proposto)}</td><td>${esc(p.aplicado)}</td><td>${esc(p.saldoAPagar)}</td></tr></tbody>
            </table></div></div>`;
        }
        if (x.restante) {
            const s = x.restante;
            h += `<div class="cartao"><h2>Detalhamento do valor restante a pagar</h2><div class="container-tabela"><table class="tabela">
                <thead><tr><th>Critério</th><th>Saldo a pagar (R$)</th><th>Nº parcelas</th><th>Valor da parcela (R$)</th><th>Código do DARF</th></tr></thead>
                <tbody><tr><td class="esq">${esc(s.criterio)}</td><td>${esc(s.saldo)}</td><td>${selectParcelas('parcelas', s.parcelasMaximo, s.parcelas)}</td><td><strong>${esc(s.valorParcela)}</strong></td><td>1124</td></tr></tbody>
            </table></div><p class="dica">Parcelas nominais: o formulário só avisa que há correção pela Selic + 1% no mês do pagamento.</p></div>`;
        }
        return h;
    }

    function resultadoControversia(r) {
        let h = htmlMensagens(r);
        h += `<div class="cartao"><div class="kpis"><div>Total de débitos a transacionar<strong>${esc(r.totalDebitos)}</strong></div><div>Total de créditos de PF e BCN<strong>${esc(r.totalCreditos)}</strong></div></div></div>`;
        if (!r.resultado) return h;
        const x = r.resultado;
        const linhas = [
            ['Dívida consolidada sem redução', x.dividaConsolidada], ['Redução (%)', x.percentualReducao], ['Valor da redução', x.valorReducao],
            ['Dívida consolidada com redução', x.dividaComReducao], ['Percentual máximo a ser amortizado com PF/BCN', x.percentualMaximoPfBcn],
            ['Valor amortizado com PF/BCN', x.valorAmortizadoPfBcn], ['Saldo devedor', x.saldoDevedor], ['Percentual de entrada', x.percentualEntrada],
            ['Valor da entrada', x.entrada],
            ['Parcelas da entrada', selectParcelas('parcelasEntrada', x.parcelasEntradaMaximo, x.parcelasEntrada, true), true],
            ['Valor da parcela de entrada', `<strong>${esc(x.valorParcelaEntrada)}</strong>`, true],
            ['Saldo devedor após pagamento da entrada', x.saldoAposEntrada],
            ['Quantidade de prestações', selectParcelas('parcelas', x.parcelasMaximo, x.parcelas, true), true],
            ['Valor da prestação', `<strong>${esc(x.valorParcela)}</strong>`, true]
        ];
        h += `<div class="cartao"><h2>Dívida consolidada — opção ${esc(x.item)}</h2><table class="tabela"><tbody>
            ${linhas.map(([k, v, html]) => `<tr><td class="esq">${esc(k)}</td><td>${html ? v : esc(v)}</td></tr>`).join('')}
        </tbody></table><p class="dica">Entrada até o último dia útil do mês do requerimento; 1ª prestação no mês seguinte, com Selic acumulada + 1%.</p></div>`;
        return h;
    }

    function recalcular() {
        const s = estados[atual];
        const r = M.simularFormulario(s);
        ultimoResultado = r;
        window.__resultadoFormulario = r;   // usado pelos testes automáticos
        // o formulário só permite escolher parcelas que existem: grava de volta o que foi usado
        if (r.resultado) {
            if (atual === 'ATE60SM') s.parcelas = r.resultado.parcelas;
            else if (atual === 'CONTROVERSIA') { s.parcelas = r.resultado.parcelas; s.parcelasEntrada = r.resultado.parcelasEntrada; }
            else {
                s.parcelasEntrada = r.resultado.entrada.parcelas;
                s.parcelas = r.resultado.restante ? r.resultado.restante.parcelas : null;
            }
        }
        $('#resultado').innerHTML = atual === 'ATE60SM' ? resultadoAte60sm(r) : atual === 'CONTROVERSIA' ? resultadoControversia(r) : resultado50M(r);
        history.replaceState(null, '', '?' + M.parametrosDeEntrada(s));
    }

    // ----------------------------------- eventos ------------------------------------------
    function definir(obj, caminho, valor) {
        const partes = caminho.split('.');
        let o = obj;
        for (let i = 0; i < partes.length - 1; i++) o = o[partes[i]];
        o[partes[partes.length - 1]] = valor;
    }

    function valorDoCampo(el) {
        if (el.type === 'checkbox') return el.checked;
        if (el.dataset.parcelas) return el.value === '' ? null : parseInt(el.value, 10);
        return el.value;
    }

    function aoMudar(ev) {
        const el = ev.target;
        const caminho = el.dataset && el.dataset.caminho;
        if (!caminho) return;
        const s = estados[atual];
        definir(s, caminho, valorDoCampo(el));
        if (!el.dataset.parcelas) {
            // como no formulário oficial, qualquer alteração acima reinicia as escolhas de parcelas
            s.parcelas = null;
            if ('parcelasEntrada' in s) s.parcelasEntrada = null;
        }
        const estrutural = el.type === 'checkbox' || el.type === 'radio' || caminho === 'tipo';
        if (estrutural && ev.type === 'change') renderizarEntradas();
        recalcular();
    }

    function formatarAoSair(ev) {
        const el = ev.target;
        if (!el.classList || !el.classList.contains('moeda') || /aliquota/.test(el.dataset.caminho || '')) return;
        const v = M.valorDeCampo(el.value);
        if (v !== null) { el.value = M.fmt(v); definir(estados[atual], el.dataset.caminho, el.value); }
    }

    function aoClicar(ev) {
        const b = ev.target.closest('button');
        if (!b) return;
        const s = estados[atual];
        if (b.dataset.form) { atual = b.dataset.form; renderizarEntradas(); recalcular(); return; }
        const acao = b.dataset.acao;
        if (!acao) return;
        const i = parseInt(b.dataset.i, 10);
        if (acao === 'incluir-debito') s.debitos.push(atual === 'CONTROVERSIA' ? '' : { principal: '', multa: '', juros: '', processo: '' });
        if (acao === 'remover-debito') s.debitos.splice(i, 1);
        if (acao === 'incluir-terceiro') s.creditosTerceiros.push({ tipo: 'PF', montante: '', aliquota: '', valor: '' });
        if (acao === 'remover-terceiro') s.creditosTerceiros.splice(i, 1);
        s.parcelas = null;
        if ('parcelasEntrada' in s) s.parcelasEntrada = null;
        renderizarEntradas();
        recalcular();
    }

    function toast(msg) {
        const t = $('#toast');
        t.textContent = msg;
        t.classList.add('visivel');
        setTimeout(() => t.classList.remove('visivel'), 2200);
    }

    function copiar(texto, msg) {
        (navigator.clipboard ? navigator.clipboard.writeText(texto) : Promise.reject()).then(() => toast(msg)).catch(() => { window.prompt('Copie:', texto); });
    }

    document.addEventListener('input', ev => { if (ev.target.tagName !== 'SELECT' && ev.target.type !== 'radio' && ev.target.type !== 'checkbox') aoMudar(ev); });
    document.addEventListener('change', ev => {
        // campo de texto: o valor já foi tratado no evento "input"; aqui só formata, sem redesenhar
        // o resultado (senão o clique que tirou o foco, por exemplo num seletor de parcelas, se perde)
        if (ev.target.type === 'text') {
            formatarAoSair(ev);
            history.replaceState(null, '', '?' + M.parametrosDeEntrada(estados[atual]));
            return;
        }
        aoMudar(ev);
    });
    document.addEventListener('click', aoClicar);
    $('#btn-copiar-link').addEventListener('click', () => copiar(location.href, 'Link copiado'));
    $('#btn-copiar-json').addEventListener('click', () => copiar(JSON.stringify(ultimoResultado, null, 2), 'Resultado copiado'));
    $('#btn-limpar').addEventListener('click', () => { estados[atual] = estadoVazio(atual); renderizarEntradas(); recalcular(); });

    carregarDaUrl();
    renderizarEntradas();
    recalcular();
})();
