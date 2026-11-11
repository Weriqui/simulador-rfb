/**
 * site-driver.js
 * Abre o simulador oficial num Chrome real (playwright-core), registra TODAS as
 * requisições de rede e expõe utilitários para ler o estado interno do site.
 *
 * Modo "live"  : usa o site ao vivo (gov.br).
 * Modo "local" : navega na mesma URL, mas serve simulador.html e assets/js/** a partir
 *                dos arquivos salvos neste projeto (../simulador.html e ../js/**).
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const URL_SITE = 'https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/transacao-tributaria/calculadora/simulador/';
const RAIZ_PROJETO = path.resolve(__dirname, '..');

function localizarChrome() {
    const candidatos = [
        process.env.CHROME_PATH,
        'C:/Program Files/Google/Chrome/Application/chrome.exe',
        'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
        path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe'),
        'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
        'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
        '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    ].filter(Boolean);
    const achado = candidatos.find(p => fs.existsSync(p));
    if (!achado) throw new Error('Chrome/Edge não encontrado. Defina a variável CHROME_PATH.');
    return achado;
}

async function abrirSite({ local = false, headless = true } = {}) {
    const browser = await chromium.launch({ executablePath: localizarChrome(), headless });
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, locale: 'pt-BR' });
    const page = await context.newPage();

    const inicio = Date.now();
    const log = { fase: 'carregamento', requisicoes: [], errosPagina: [], console: [], websockets: [] };

    page.on('request', req => {
        log.requisicoes.push({
            id: log.requisicoes.length + 1,
            t_ms: Date.now() - inicio,
            fase: log.fase,
            metodo: req.method(),
            tipo: req.resourceType(),
            url: req.url(),
            corpo: req.postData() || null,
            status: null,
            servidoLocalmente: false
        });
        req._registro = log.requisicoes[log.requisicoes.length - 1];
    });
    page.on('response', res => {
        const reg = res.request()._registro;
        if (reg) { reg.status = res.status(); reg.contentType = res.headers()['content-type'] || null; }
    });
    page.on('requestfailed', req => {
        const reg = req._registro;
        if (reg) reg.falha = req.failure() && req.failure().errorText;
    });
    page.on('websocket', ws => log.websockets.push({ fase: log.fase, url: ws.url() }));
    page.on('pageerror', err => log.errosPagina.push({ fase: log.fase, mensagem: String(err && err.message || err) }));
    page.on('console', msg => {
        if (msg.type() === 'error' || msg.type() === 'warning') log.console.push({ fase: log.fase, tipo: msg.type(), texto: msg.text() });
    });

    if (local) {
        // Sem o CSS do gov.br a classe d-none não esconde nada: reinjeta só ela (e esconde o modal)
        // em todo carregamento, inclusive após reload.
        await context.addInitScript(() => {
            document.addEventListener('DOMContentLoaded', () => {
                const st = document.createElement('style');
                st.textContent = '.d-none{display:none!important}#modal-scrim{display:none!important}';
                document.head.appendChild(st);
            });
        });
        await page.route('**/*', async route => {
            const url = route.request().url().split('#')[0].split('?')[0];
            if (url === URL_SITE || url === URL_SITE + 'index.html') {
                route.request()._registro && (route.request()._registro.servidoLocalmente = true);
                return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: fs.readFileSync(path.join(RAIZ_PROJETO, 'simulador.html')) });
            }
            const marcador = '/simulador/assets/js/';
            const pos = url.indexOf(marcador);
            if (pos >= 0) {
                const rel = url.slice(pos + marcador.length);
                const arquivo = path.join(RAIZ_PROJETO, 'js', rel);
                if (fs.existsSync(arquivo)) {
                    route.request()._registro && (route.request()._registro.servidoLocalmente = true);
                    return route.fulfill({ status: 200, contentType: 'application/javascript; charset=utf-8', body: fs.readFileSync(arquivo) });
                }
            }
            // Modo local = 100% offline. A biblioteca visual do gov.br (core.min.js) só controla
            // modais/estilos; é trocada por um stub mínimo. Todo o resto (CSS, fontes, imagens,
            // VLibras, CDNs) é cancelado para não gerar nenhum acesso ao gov.br.
            if (/\/govbr\/core(\.min)?\.js$/.test(url)) {
                route.request()._registro && (route.request()._registro.servidoLocalmente = true);
                return route.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.core={Scrim:function(){this.showScrim=function(){};this.hideScrim=function(){};}};' });
            }
            return route.abort();
        });
    }

    await page.goto(URL_SITE, { waitUntil: 'load', timeout: 90000 });
    await page.waitForFunction(() => typeof estadoGlobal !== 'undefined' && typeof recarregarTodasAsModalidades === 'function', null, { timeout: 30000 });
    await page.waitForTimeout(local ? 200 : 1500); // deixa terminar widgets de terceiros (VLibras etc.)

    return {
        browser, context, page, log,
        definirFase(nome) { log.fase = nome; },
        async fechar() { await browser.close(); }
    };
}

/**
 * Lê o estado do site (roda dentro da página). Retorna as modalidades exatamente
 * como estão em estadoGlobal + o texto renderizado de cada linha do Quadro-Resumo.
 */
function lerEstadoNoSite() {
    const semFuncoes = (k, v) => (typeof v === 'function' ? undefined : v);
    const corpo = document.getElementById('id-corpo-quadro-resumo');
    const linhas = [...corpo.rows].map(tr => [...tr.cells].map(td => (td.innerText || '').trim().replace(/\s+/g, ' ')));
    const ctx = typeof obterContextoCalculo === 'function' ? obterContextoCalculo() : null;
    const mods = estadoGlobal.modalidades.map(m => {
        const ativa = !!(m.elegivel && m.resultadoAtual);
        return {
            chave: m.chaveModalidade,
            elegivel: m.elegivel,
            ativa,
            motivo: m.motivoInelegibilidade || null,
            dividaSemReducao: m.dividaSemReducao,
            opcaoSelecionadaIndex: m.opcaoSelecionadaIndex,
            naturezaSelecionada: m.naturezaSelecionada,
            numeroParcelasPersonalizado: m.numeroParcelasPersonalizado,
            erroPfBcn: m.erroPfBcnPrincipal || '',
            resultado: m.resultadoAtual ? JSON.parse(JSON.stringify(m.resultadoAtual, semFuncoes)) : null,
            vantagens: m.vantagensCalculadas || [],
            opcoesVisiveis: ativa ? m.opcoes.map((op, i) => (op.calcular(ctx, null, null, m.naturezaSelecionada).elegivel ? i : -1)).filter(i => i >= 0) : [],
            saldoVisivel: ativa ? obterSaldoDevedorVisivelModalidade(m) : null,
            totalParcelas: ativa ? obterValorTotalParcelas(m) : null
        };
    });
    return {
        mods,
        linhas,
        quadroVisivel: !document.getElementById('id-quadro-resumo').classList.contains('d-none'),
        capag: estadoGlobal.capag ? JSON.parse(JSON.stringify(estadoGlobal.capag)) : null
    };
}

// ---------------------------------------------------------------------------
// Comparação site x motor
// ---------------------------------------------------------------------------
const CAMPOS_TEXTO_IGNORADOS = /^descricao/;

function iguais(a, b) {
    if (typeof a === 'number' && typeof b === 'number') return Object.is(a, b) || a === b;
    return a === b;
}

/**
 * Compara o estado lido do site com o resultado de MotorSimulador.simular().
 * Retorna a lista de divergências (vazia = idêntico).
 */
function compararSiteComMotor(site, motor, { formatarMoeda }) {
    const difs = [];
    const add = (chave, campo, valorSite, valorMotor) => difs.push({ chave, campo, site: valorSite, motor: valorMotor });

    // Classificação (rating) por órgão
    if (site.capag) {
        for (const org of ['pgfn', 'rfb']) {
            const s = site.capag[org], m = motor.classificacao[org];
            for (const k of ['dividaBase', 'rating', 'descontoTeorico']) {
                if (!iguais(s[k], m[k])) add('CLASSIFICACAO_' + org.toUpperCase(), k, s[k], m[k]);
            }
        }
    }

    site.mods.forEach((s, i) => {
        const m = motor.modalidades.find(x => x.chave === s.chave);
        if (!m) { add(s.chave, 'existe', true, false); return; }
        if (motor.modalidades.indexOf(m) !== i) add(s.chave, 'ordem', i, motor.modalidades.indexOf(m));
        if (s.ativa !== m.elegivel) { add(s.chave, 'elegivel', s.ativa, m.elegivel); return; }
        if (!iguais(s.dividaSemReducao || 0, m.dividaSemReducao || 0)) add(s.chave, 'dividaSemReducao', s.dividaSemReducao, m.dividaSemReducao);

        if (!s.ativa) {
            if (s.motivo !== m.motivo) add(s.chave, 'motivo', s.motivo, m.motivo);
            const linha = site.linhas[i];
            if (linha && linha[1] !== `Não elegível — ${m.motivo || 'motivo não informado'}`) add(s.chave, 'textoLinhaInelegivel', linha[1], m.motivo);
            return;
        }

        if (s.opcaoSelecionadaIndex !== m.opcaoIndex) add(s.chave, 'opcaoSelecionadaIndex', s.opcaoSelecionadaIndex, m.opcaoIndex);
        if (m.possuiSeletorNatureza && s.naturezaSelecionada !== m.natureza) add(s.chave, 'naturezaSelecionada', s.naturezaSelecionada, m.natureza);
        if ((s.numeroParcelasPersonalizado ?? null) !== (m.numeroParcelasPersonalizado ?? null)) add(s.chave, 'numeroParcelasPersonalizado', s.numeroParcelasPersonalizado ?? null, m.numeroParcelasPersonalizado ?? null);
        if (JSON.stringify(s.opcoesVisiveis) !== JSON.stringify(m.opcoesDisponiveis.map(o => o.index))) add(s.chave, 'opcoesVisiveis', s.opcoesVisiveis, m.opcoesDisponiveis.map(o => o.index));
        if (JSON.stringify(s.vantagens) !== JSON.stringify(m.vantagens)) add(s.chave, 'vantagens', s.vantagens, m.vantagens);
        if (!iguais(s.saldoVisivel, m.exibicao.saldoDevedor)) add(s.chave, 'saldoVisivel', s.saldoVisivel, m.exibicao.saldoDevedor);
        if (!iguais(s.totalParcelas, m.exibicao.totalParcelas)) add(s.chave, 'totalParcelas', s.totalParcelas, m.exibicao.totalParcelas);
        if ((s.erroPfBcn || '') !== ((m.exibicao.pfBcn && m.exibicao.pfBcn.erro) || '')) add(s.chave, 'erroPfBcn', s.erroPfBcn, m.exibicao.pfBcn && m.exibicao.pfBcn.erro);

        // Todos os campos numéricos/booleanos/texto do resultadoAtual do site
        const rs = s.resultado || {}, rm = m.resultado || {};
        for (const k of Object.keys(rs)) {
            if (CAMPOS_TEXTO_IGNORADOS.test(k)) continue;
            const valorMotor = rm[k];
            if (!iguais(rs[k], valorMotor)) add(s.chave, 'resultado.' + k, rs[k], valorMotor);
        }

        // Texto renderizado das colunas Redução e Saldo Devedor
        const linha = site.linhas[i] || [];
        if (linha[4] !== m.exibicao.reducaoTexto) add(s.chave, 'textoReducao', linha[4], m.exibicao.reducaoTexto);
        const saldoTexto = 'R$ ' + formatarMoeda(m.exibicao.saldoDevedor);
        if (linha[5] !== saldoTexto) add(s.chave, 'textoSaldoDevedor', linha[5], saldoTexto);
    });
    return difs;
}

module.exports = { URL_SITE, RAIZ_PROJETO, abrirSite, lerEstadoNoSite, compararSiteComMotor, localizarChrome };
