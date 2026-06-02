/**
 * Tabelas do IRPF — Imposto de Renda da Pessoa Física
 * Fonte: Receita Federal do Brasil
 */

const TABELAS = {
  2024: {
    anual: [
      { limite: 26963.20,  aliquota: 0,     deducao: 0        },
      { limite: 33919.80,  aliquota: 0.075, deducao: 2022.24  },
      { limite: 45012.60,  aliquota: 0.15,  deducao: 4566.23  },
      { limite: 55976.16,  aliquota: 0.225, deducao: 7942.18  },
      { limite: Infinity,  aliquota: 0.275, deducao: 10740.99 },
    ],
    mensal: [
      { limite: 2259.20,  aliquota: 0,     deducao: 0      },
      { limite: 2826.65,  aliquota: 0.075, deducao: 169.44 },
      { limite: 3751.05,  aliquota: 0.15,  deducao: 381.44 },
      { limite: 4664.68,  aliquota: 0.225, deducao: 662.77 },
      { limite: Infinity, aliquota: 0.275, deducao: 896.00 },
    ],
    deducaoDependente: { mensal: 189.59, anual: 2275.08 },
    limiteInstrucao: 3561.50, // por pessoa, anual
  },
  2023: {
    anual: [
      { limite: 24751.74,  aliquota: 0,     deducao: 0        },
      { limite: 33919.80,  aliquota: 0.075, deducao: 1856.38  },
      { limite: 45012.60,  aliquota: 0.15,  deducao: 4400.37  },
      { limite: 55976.16,  aliquota: 0.225, deducao: 7578.66  },
      { limite: Infinity,  aliquota: 0.275, deducao: 10376.77 },
    ],
    mensal: [
      { limite: 2112.00,  aliquota: 0,     deducao: 0      },
      { limite: 2826.65,  aliquota: 0.075, deducao: 158.40 },
      { limite: 3751.05,  aliquota: 0.15,  deducao: 370.40 },
      { limite: 4664.68,  aliquota: 0.225, deducao: 651.73 },
      { limite: Infinity, aliquota: 0.275, deducao: 884.96 },
    ],
    deducaoDependente: { mensal: 189.59, anual: 2275.08 },
    limiteInstrucao: 3561.50,
  },
};

/**
 * Alíquotas do INSS (empregado) — 2024
 * Tabela progressiva conforme Portaria MPS/MF nº 3/2023
 */
const TABELA_INSS_2024 = [
  { limite: 1412.00,  aliquota: 0.075 },
  { limite: 2666.68,  aliquota: 0.09  },
  { limite: 4000.03,  aliquota: 0.12  },
  { limite: 7786.02,  aliquota: 0.14  },
];

/**
 * Calcula a contribuição ao INSS sobre o salário bruto (empregado CLT).
 * @param {number} salarioBruto
 * @returns {number} valor do INSS
 */
function calcularINSS(salarioBruto) {
  let inss = 0;
  let base = salarioBruto;
  let faixaAnterior = 0;

  for (const faixa of TABELA_INSS_2024) {
    if (base <= 0) break;
    const teto = Math.min(base, faixa.limite - faixaAnterior);
    inss += teto * faixa.aliquota;
    base -= teto;
    faixaAnterior = faixa.limite;
    if (salarioBruto <= faixa.limite) break;
  }

  return inss;
}
