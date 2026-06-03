/**
 * UI — Calculadora IRPF
 */

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const pct = v => (v * 100).toFixed(2).replace('.', ',') + '%';

// ── Utilitários ──────────────────────────────────────────────────────────────

function val(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  const n = parseFloat(el.value.replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

function intVal(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  const n = parseInt(el.value, 10);
  return isNaN(n) ? 0 : n;
}

function strVal(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

function pill(label, value, cls = '') {
  return `<div class="pill ${cls}"><span class="pill-label">${label}</span><span class="pill-value">${value}</span></div>`;
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('pane-' + btn.dataset.tab).classList.add('active');
    document.getElementById('resultado').innerHTML = '';
  });
});

// ── INSS automático ───────────────────────────────────────────────────────────

document.getElementById('calcular-inss').addEventListener('click', () => {
  const salario = val('salario-bruto-mensal');
  if (salario <= 0) { alert('Informe o salário bruto mensal.'); return; }
  const inss = calcularINSS(salario);
  document.getElementById('inss-mensal').value = inss.toFixed(2);
});

// ── INSS anual automático ────────────────────────────────────────────────────

document.getElementById('calcular-inss-anual').addEventListener('click', () => {
  const salario = val('salario-bruto-mensal-anual');
  if (salario <= 0) { alert('Informe o salário bruto mensal.'); return; }
  const inss = calcularINSS(salario);
  document.getElementById('inss-anual').value = (inss * 12).toFixed(2);
});

// ── Calcular Mensal ───────────────────────────────────────────────────────────

document.getElementById('form-mensal').addEventListener('submit', e => {
  e.preventDefault();

  const r = calcularMensal({
    rendimentoBruto: val('rendimento-bruto-mensal'),
    inss: val('inss-mensal'),
    numeroDependentes: intVal('dependentes-mensal'),
    pensaoAlimenticia: val('pensao-mensal'),
    outrasDeducoes: val('outras-deducoes-mensal'),
    ano: strVal('ano-mensal'),
  });

  exibirResultadoMensal(r);
});

// ── Calcular Anual ────────────────────────────────────────────────────────────

document.getElementById('form-anual').addEventListener('submit', e => {
  e.preventDefault();

  const r = calcularAnual({
    rendimentoTributavelAnual: val('rendimento-anual'),
    inssAnual: val('inss-anual'),
    numeroDependentes: intVal('dependentes-anual'),
    despesasMedicas: val('despesas-medicas'),
    despesasInstrucao: val('despesas-instrucao'),
    pessoasInstrucao: Math.max(1, intVal('pessoas-instrucao')),
    pensaoAlimenticia: val('pensao-anual'),
    outrasDeducoes: val('outras-deducoes-anual'),
    impostoRetidoFonte: val('ir-retido'),
    ano: strVal('ano-anual'),
  });

  exibirResultadoAnual(r);
});

// ── Renderização ──────────────────────────────────────────────────────────────

function renderFaixas(faixas, tipo) {
  if (!faixas.length) return '';

  const linhas = faixas.map(f => {
    const ate = f.ate ? fmt.format(f.ate) : 'acima';
    return `<tr>
      <td>${fmt.format(f.de)} – ${ate}</td>
      <td class="text-right">${pct(f.aliquota)}</td>
      <td class="text-right">${fmt.format(f.base)}</td>
      <td class="text-right">${fmt.format(f.imposto)}</td>
    </tr>`;
  }).join('');

  return `
    <div class="faixas-wrap">
      <h3>Detalhamento por faixa</h3>
      <table class="faixas-table">
        <thead>
          <tr>
            <th>Faixa de renda (${tipo})</th>
            <th class="text-right">Alíquota</th>
            <th class="text-right">Base na faixa</th>
            <th class="text-right">Imposto na faixa</th>
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>`;
}

function exibirResultadoMensal(r) {
  const isentoClass = r.imposto === 0 ? 'isento' : '';
  const faixaAliquota = r.faixasAplicadas.length
    ? r.faixasAplicadas[r.faixasAplicadas.length - 1].aliquota
    : 0;

  document.getElementById('resultado').innerHTML = `
    <div class="resultado-card">
      <div class="resultado-header">
        <span class="badge badge-mensal">Mensal</span>
        <h2>Resultado do Cálculo</h2>
      </div>

      <div class="pills-grid">
        ${pill('Rendimento bruto', fmt.format(r.rendimentoBruto))}
        ${pill('INSS', fmt.format(r.inss))}
        ${pill('Dedução dependentes', fmt.format(r.deducaoDependentes))}
        ${pill('Pensão alimentícia', fmt.format(r.pensaoAlimenticia))}
        ${pill('Outras deduções', fmt.format(r.outrasDeducoes))}
        ${pill('Total deduções', fmt.format(r.totalDeducoes), 'pill-deducao')}
        ${pill('Base de cálculo', fmt.format(r.baseCalculo), 'pill-base')}
        ${pill('Alíquota marginal', pct(faixaAliquota))}
        ${pill('Alíquota efetiva', pct(r.aliquotaEfetiva))}
      </div>

      <div class="destaque ${isentoClass}">
        <div class="destaque-label">IR retido na fonte</div>
        <div class="destaque-valor">${fmt.format(r.imposto)}</div>
        ${r.imposto === 0 ? '<div class="destaque-obs">Isento de IR</div>' : ''}
      </div>

      <div class="liquido-wrap">
        ${pill('Rendimento líquido (bruto − INSS − IR)', fmt.format(r.rendimentoLiquido), 'pill-liquido')}
      </div>

      ${renderFaixas(r.faixasAplicadas, 'mensal')}
    </div>`;

  document.getElementById('resultado').scrollIntoView({ behavior: 'smooth' });
}

function exibirResultadoAnual(r) {
  const isRestituicao = r.saldo < 0;
  const destaqueClass = isRestituicao ? 'restituicao' : r.impostoDevido === 0 ? 'isento' : 'devido';
  const faixaAliquota = r.faixasAplicadas.length
    ? r.faixasAplicadas[r.faixasAplicadas.length - 1].aliquota
    : 0;

  const instrucaoAlert = r.despesasInstrucaoInformadas > r.limiteInstrucaoTotal
    ? `<p class="alert-info">⚠️ Despesas com instrução informadas (${fmt.format(r.despesasInstrucaoInformadas)}) excedem o limite legal de ${fmt.format(r.limiteInstrucaoTotal)}. Foram aceitos ${fmt.format(r.despesasInstrucaoAceitas)}.</p>`
    : '';

  document.getElementById('resultado').innerHTML = `
    <div class="resultado-card">
      <div class="resultado-header">
        <span class="badge badge-anual">Anual</span>
        <h2>Resultado do Cálculo</h2>
      </div>

      ${instrucaoAlert}

      <div class="pills-grid">
        ${pill('Rendimentos tributáveis', fmt.format(r.rendimentoTributavelAnual))}
        ${pill('INSS anual', fmt.format(r.inssAnual))}
        ${pill('Dedução dependentes', fmt.format(r.deducaoDependentes))}
        ${pill('Despesas médicas', fmt.format(r.despesasMedicas))}
        ${pill('Despesas instrução (aceitas)', fmt.format(r.despesasInstrucaoAceitas))}
        ${pill('Pensão alimentícia', fmt.format(r.pensaoAlimenticia))}
        ${pill('Outras deduções', fmt.format(r.outrasDeducoes))}
        ${pill('Total deduções', fmt.format(r.totalDeducoes), 'pill-deducao')}
        ${pill('Base de cálculo', fmt.format(r.baseCalculo), 'pill-base')}
        ${pill('Alíquota marginal', pct(faixaAliquota))}
        ${pill('Alíquota efetiva', pct(r.aliquotaEfetiva))}
        ${pill('IR calculado', fmt.format(r.imposto))}
        ${pill('IR retido na fonte', fmt.format(r.impostoRetidoFonte))}
      </div>

      <div class="destaque ${destaqueClass}">
        ${isRestituicao ? `
          <div class="destaque-label">Imposto a restituir</div>
          <div class="destaque-valor">${fmt.format(r.impostoRestituir)}</div>
          <div class="destaque-obs">Você tem direito a restituição</div>
        ` : r.impostoDevido === 0 ? `
          <div class="destaque-label">Saldo</div>
          <div class="destaque-valor">${fmt.format(0)}</div>
          <div class="destaque-obs">Sem imposto a pagar nem a restituir</div>
        ` : `
          <div class="destaque-label">Imposto a pagar (DARF)</div>
          <div class="destaque-valor">${fmt.format(r.impostoDevido)}</div>
          <div class="destaque-obs">Recolher via DARF até o prazo da declaração</div>
        `}
      </div>

      ${renderFaixas(r.faixasAplicadas, 'anual')}
    </div>`;

  document.getElementById('resultado').scrollIntoView({ behavior: 'smooth' });
}
