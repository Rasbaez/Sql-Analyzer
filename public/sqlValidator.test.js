const { validateSql } = require('./sqlValidator');

/**
 * Suite de Testes do SQL Analyzer
 * Objetivo: Cobrir todos os cenários críticos e de negócio.
 */

const suiteDeTestes = [
  {
    nome: "Cenário 1: Sucesso Total (Verde)",
    sql: "UPDATE mc1_user SET mc1Enabled = 1 WHERE cIDUser = 'B001'",
    validar: (res) => res.success === true && res.warnings.length === 0
  },
  {
    nome: "Cenário 2: Aviso Técnico (Azul) - Aspas Duplas",
    sql: "UPDATE mc1_user SET mc1Enabled = ''0'' WHERE cIDUser = 'B001'",
    validar: (res) => res.autoFix.isDifferent === true && res.success === false
  },
  {
    nome: "Cenário 3: Proteção cIDCompany (Preservar Zeros)",
    sql: "UPDATE mc1_order SET cIDCompany = 0546 WHERE cIDOrder = 'PED-100'",
    validar: (res) => res.autoFix.fixed.includes("'0546'") && res.autoFix.isDifferent === true
  },
  {
    nome: "Cenário 4: Erro Crítico - UPDATE sem WHERE",
    sql: "UPDATE mc1_user SET mc1Enabled = 1",
    validar: (res) => res.warnings.some(w => w.includes("🚨 CRÍTICO"))
  },
  {
    nome: "Cenário 5: Erro de Estrutura - Parênteses",
    sql: "INSERT INTO tabela (col1 VALUES ('val1'",
    validar: (res) => res.parserError !== undefined
  },
  {
    nome: "Cenário 6: Consistência de '=' (Falta de Aspas Crítica)",
    // Aqui simulamos o erro da imagem image_4ea8ca.png onde o SQL se perde
    sql: "UPDATE mc1_user SET cIDCompany = 0546 WHERE cIDUser = 'B001'",
    validar: (res) => res.params.cIDCompany === '0546' && res.autoFix.isDifferent === true
  },
  {
    nome: "Cenário 7: INSERT com cIDCompany",
    sql: "INSERT INTO mc1_user (cIDCompany, mc1Enabled) VALUES (0546, 1)",
    validar: (res) => res.autoFix.fixed.includes("'0546'")
  }
];

console.log("🚀 Iniciando Testes de Validação SQL...\n");

let falhas = 0;
suiteDeTestes.forEach((teste, i) => {
  try {
    const resultado = validateSql(teste.sql);
    const passou = teste.validar(resultado);

    if (passou) {
      console.log(`✅ [PASSOU] ${teste.nome}`);
    } else {
      falhas++;
      console.error(`❌ [FALHOU] ${teste.nome}`);
      console.log(`   - SQL: ${teste.sql}`);
      console.log(`   - Resultado:`, JSON.stringify(resultado, null, 2));
    }
  } catch (err) {
    falhas++;
    console.error(`💥 [ERRO NO SCRIPT] ${teste.nome}: ${err.message}`);
  }
});

console.log(`\n--- Resumo ---`);
console.log(`Total: ${suiteDeTestes.length} | Sucessos: ${suiteDeTestes.length - falhas} | Falhas: ${falhas}`);

if (falhas > 0) {
  process.exit(1);
} else {
  console.log("✨ Tudo pronto para o deploy!");
}