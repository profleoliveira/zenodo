/**
 * Lógica de cálculo do IRPF
 */

/**
 * Aplica a tabela progressiva sobre a base de cálculo.
 * Retorna imposto bruto, alíquota efetiva e detalhamento por faixa.
 */
function aplicarTabela(baseCalculo, faixas) {
  if (baseCalculo <= 0) return { imposto: 0, aliquotaEfetiva: 0, faixasAplicadas: [] };

  // Encontra a faixa correspondente
  const faixaAplicavel = faixas.find(f => baseCalculo <= f.limite);
  const imposto = Math.max(0, baseCalculo * faixaAplicavel.aliquota - faixaAplicavel.deducao);

  // Detalhamento por faixa para exibição
  const faixasAplicadas = [];
  let limiteAnterior = 0;

  for (const faixa of faixas) {
    if (baseCalculo <= limiteAnterior) break;

    const inicioFaixa = limiteAnterior;
    const fimFaixa = Math.min(baseCalculo, faixa.limite);
    const valorNaFaixa = fimFaixa - inicioFaixa;
    const impostoFaixa = valorNaFaixa * faixa.aliquota;

    if (valorNaFaixa > 0) {
      faixasAplicadas.push({
        de: inicioFaixa,
        ate: faixa.limite === Infinity ? null : faixa.limite,
        aliquota: faixa.aliquota,
        base: valorNaFaixa,
        imposto: impostoFaixa,
      });
    }

    limiteAnterior = faixa.limite;
    if (baseCalculo <= faixa.limite) break;
  }

  const aliquotaEfetiva = baseCalculo > 0 ? imposto / baseCalculo : 0;

  return { imposto, aliquotaEfetiva, faixasAplicadas };
}

/**
 * Cálculo MENSAL — retenção na fonte (carnê-leão ou empregado CLT).
 *
 * @param {object} params
 * @param {number}  params.rendimentoBruto       - Rendimento bruto mensal
 * @param {number}  params.inss                  - Contribuição INSS (ou 0 para autônomo)
 * @param {number}  params.numeroDependentes      - Número de dependentes
 * @param {number}  params.pensaoAlimenticia      - Pensão alimentícia mensal paga
 * @param {number}  params.outrasDeducoes         - Outras deduções mensais
 * @param {string}  params.ano                   - Ano-calendário
 * @returns {object} resultado completo do cálculo
 */
function calcularMensal({ rendimentoBruto, inss, numeroDependentes, pensaoAlimenticia, outrasDeducoes, ano }) {
  const tabela = TABELAS[ano] || TABELAS[2024];

  const deducaoDependentes = numeroDependentes * tabela.deducaoDependente.mensal;
  const totalDeducoes = inss + deducaoDependentes + pensaoAlimenticia + outrasDeducoes;
  const baseCalculo = Math.max(0, rendimentoBruto - totalDeducoes);

  const { imposto, aliquotaEfetiva, faixasAplicadas } = aplicarTabela(baseCalculo, tabela.mensal);

  return {
    tipo: 'mensal',
    rendimentoBruto,
    inss,
    deducaoDependentes,
    pensaoAlimenticia,
    outrasDeducoes,
    totalDeducoes,
    baseCalculo,
    imposto,
    aliquotaEfetiva,
    rendimentoLiquido: rendimentoBruto - inss - imposto,
    faixasAplicadas,
  };
}

/**
 * Cálculo ANUAL — declaração de ajuste anual.
 *
 * @param {object} params
 * @param {number}  params.rendimentoTributavelAnual  - Total de rendimentos tributáveis no ano
 * @param {number}  params.inssAnual                  - Total de INSS pago no ano
 * @param {number}  params.numeroDependentes           - Número de dependentes
 * @param {number}  params.despesasMedicas             - Despesas médicas (sem limite)
 * @param {number}  params.despesasInstrucao           - Despesas com instrução (sujeito a limite)
 * @param {number}  params.pessoasInstrucao            - Quantidade de pessoas (para limite de instrução)
 * @param {number}  params.pensaoAlimenticia            - Pensão alimentícia anual
 * @param {number}  params.outrasDeducoes              - Outras deduções legais
 * @param {number}  params.impostoRetidoFonte          - IR já retido na fonte durante o ano
 * @param {string}  params.ano                        - Ano-calendário
 * @returns {object} resultado completo do cálculo
 */
function calcularAnual({
  rendimentoTributavelAnual,
  inssAnual,
  numeroDependentes,
  despesasMedicas,
  despesasInstrucao,
  pessoasInstrucao,
  pensaoAlimenticia,
  outrasDeducoes,
  impostoRetidoFonte,
  ano,
}) {
  const tabela = TABELAS[ano] || TABELAS[2024];

  const deducaoDependentes = numeroDependentes * tabela.deducaoDependente.anual;

  // Despesas de instrução: limite por pessoa
  const limiteInstrucaoTotal = pessoasInstrucao * tabela.limiteInstrucao;
  const despesasInstrucaoAceitas = Math.min(despesasInstrucao, limiteInstrucaoTotal);

  const totalDeducoes =
    inssAnual +
    deducaoDependentes +
    despesasMedicas +
    despesasInstrucaoAceitas +
    pensaoAlimenticia +
    outrasDeducoes;

  const baseCalculo = Math.max(0, rendimentoTributavelAnual - totalDeducoes);

  const { imposto, aliquotaEfetiva, faixasAplicadas } = aplicarTabela(baseCalculo, tabela.anual);

  const impostoDevido = Math.max(0, imposto - impostoRetidoFonte);
  const impostoRestituir = Math.max(0, impostoRetidoFonte - imposto);
  const saldo = imposto - impostoRetidoFonte; // negativo = restituição

  return {
    tipo: 'anual',
    rendimentoTributavelAnual,
    inssAnual,
    deducaoDependentes,
    despesasMedicas,
    despesasInstrucaoInformadas: despesasInstrucao,
    despesasInstrucaoAceitas,
    limiteInstrucaoTotal,
    pensaoAlimenticia,
    outrasDeducoes,
    totalDeducoes,
    baseCalculo,
    imposto,
    aliquotaEfetiva,
    impostoRetidoFonte,
    impostoDevido,
    impostoRestituir,
    saldo,
    faixasAplicadas,
  };
}
