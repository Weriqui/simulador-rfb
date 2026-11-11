/**
 * assets/js/core/vantagens-comparativas.js
 */

const DEFINICOES_VANTAGENS = [
    {
        chave: 'MENOR_SALDO_DEVEDOR',
        rotulo: 'Menor saldo devedor',
        tipo: 'MENOR',
        // Passamos a modalidade inteira para a função ter acesso às flags de exibição
        obterValor: (modalidade) => obterValorSaldoVisivel(modalidade)
    },
    {
        chave: 'MAIOR_NUMERO_PARCELAS',
        rotulo: 'Maior número de parcelas',
        tipo: 'MAIOR',
        obterValor: (modalidade) => obterValorTotalParcelas(modalidade)
    },
    {
        chave: 'USO_PF_BCN',
        rotulo: 'Possibilidade de utilização de PF/BCN',
        tipo: 'BOOLEANO',
        obterValor: (modalidade) => modalidade.resultadoAtual.usoPfBcn === true
    }
];

/**
 * Calcula o Saldo Devedor EXATAMENTE como ele é renderizado na tela,
 * respeitando a flag 'exibirSaldoComEntrada' da modalidade.
 */
function obterValorSaldoVisivel(modalidade) {
    if (typeof obterSaldoDevedorVisivelModalidade === 'function') {
        return obterSaldoDevedorVisivelModalidade(modalidade);
    }

    const r = modalidade.resultadoAtual;
    const incluirEntradaNoSaldo = modalidade.exibirSaldoComEntrada !== false;

    return (r.saldoDevedorAposReducao || 0) + (incluirEntradaNoSaldo ? (r.entrada || 0) : 0);
}

/**
 * CORREÇÃO: o "número de parcelas" precisa somar as parcelas da ENTRADA com as
 * parcelas do SALDO — senão uma modalidade com entrada parcelada (ex.: 12 + 133 = 145)
 * fica injustamente em desvantagem contra outra que soma o mesmo total de um jeito
 * diferente, como aconteceu com a PGFN Capacidade de Pagamento.
 *
 * CORREÇÃO 2 (causa raiz da "vantagem errada"): na modalidade RFB 50 milhões,
 * `resultadoAtual.numeroParcelas` já vem sincronizado (ver sincronizarResultadoOpcaoAtivaRfb50m,
 * em quadro-resumo.js) a partir de `numeroParcelasFazendarias`/`numeroParcelasPrevidenciarias`,
 * que JÁ incluem a entrada somada (numeroParcelasEntrada + parcelasSelecionadas — ver 50milh.js).
 * Se somássemos `numeroParcelasEntrada` de novo aqui, a entrada seria contada em DOBRO só
 * para essa modalidade, inflando o total e fazendo ela "ganhar" a vantagem indevidamente
 * (ou quebrando empates que deveriam existir). Por isso, para o RFB 50M usamos o valor
 * "Selecionadas" (apenas o saldo, sem a entrada) — exatamente o mesmo número mostrado na
 * coluna de parcelas da tabela — e só então somamos a entrada, uma única vez.
 */
function obterValorTotalParcelas(modalidade) {
    const r = modalidade.resultadoAtual;
    const parcelasEntrada = r.entradaDesabilitada ? 0 : (r.numeroParcelasEntrada || 0);

    let parcelasSaldo;
    if (modalidade.chaveModalidade === 'RFB_GERAL_50M') {
        const codigoOpcaoAtiva = obterCodigoOpcaoAtivaModalidade(modalidade);
        parcelasSaldo = codigoOpcaoAtiva === 'PREVIDENCIARIO'
            ? (r.parcelasPrevidenciariasSelecionadas || 0)
            : (r.parcelasFazendariasSelecionadas || 0);
    } else {
        parcelasSaldo = r.numeroParcelas || 0;
    }

    return parcelasEntrada + parcelasSaldo;
}

function calcularVantagensComparativas() {
    const modalidadesElegiveis = estadoGlobal.modalidades.filter(m => m.elegivel && m.resultadoAtual);

    // Zera as vantagens calculadas de todas antes de recalcular (evita dados fantasmas)
    estadoGlobal.modalidades.forEach(m => { m.vantagensCalculadas = []; });

    if (modalidadesElegiveis.length === 0) return;

    DEFINICOES_VANTAGENS.forEach(definicao => {
        if (definicao.tipo === 'BOOLEANO') {
            modalidadesElegiveis.forEach(m => {
                if (definicao.obterValor(m) === true) {
                    m.vantagensCalculadas.push(definicao.rotulo);
                }
            });
            return;
        }

        const valores = modalidadesElegiveis.map(m => definicao.obterValor(m));
        const valorVencedor = definicao.tipo === 'MENOR' ? Math.min(...valores) : Math.max(...valores);

        // Empate: distribui a vantagem para todos que empataram no valor vencedor
        modalidadesElegiveis.forEach((m, i) => {
            if (valores[i] === valorVencedor) {
                m.vantagensCalculadas.push(definicao.rotulo);
            }
        });
    });
}