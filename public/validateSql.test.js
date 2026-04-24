const { validateSql } = require('./validateSql'); // Ajuste o caminho

describe('SQL Analyzer - Unidade de Validação', () => {

    test('Deve extrair cIDCompany sem aspas para o Schema validar', () => {
        const sql = "UPDATE mc1_user SET cIDCompany = '0546' WHERE cIDUser = '1'";
        const result = validateSql(sql);
        expect(result.params.cidcompany).toBe('0546'); // Sem aspas!
        expect(result.success).toBe(true);
    });

    test('Deve proteger GETDATE() de receber aspas na query fixa', () => {
        const sql = "INSERT INTO t (d) VALUES (GETDATE())";
        const result = validateSql(sql);
        expect(result.autoFix.fixed).toContain('VALUES (GETDATE())');
        expect(result.autoFix.fixed).not.toContain("('GETDATE()')");
    });

    test('Deve disparar erro crítico para UPDATE sem WHERE', () => {
        const sql = "UPDATE mc1_user SET mc1Enabled = 0";
        const result = validateSql(sql);
        expect(result.success).toBe(false);
        expect(result.warnings[0]).toContain('🚨 PERIGO CRÍTICO');
    });

    test('Deve limpar params para o Schema quando receber NULL em campo crítico', () => {
        const sql = "UPDATE mc1_user SET mc1Enabled = NULL WHERE id = 1";
        const result = validateSql(sql);
        // O params deve ser "" para o Schema disparar o erro de negócio
        expect(result.params.mc1enabled).toBe("");
    });

    test('Deve formatar corretamente listas no operador IN', () => {
        const sql = "SELECT * FROM t WHERE id IN (1, 2)";
        const result = validateSql(sql);
        expect(result.autoFix.fixed).toContain("IN ('1', '2')");
    });

});

const { validateSql } = require('./validateSql');
const { validarConteudoNegocio } = require('./schemaRules');

test('Integração: Valor proibido deve gerar erro de negócio no Schema', () => {
    const sql = "UPDATE mc1_user SET mc1Enabled = 9 WHERE id = 1";
    const res = validateSql(sql);
    const businessErrors = validarConteudoNegocio(res.params);
    
    expect(businessErrors[0]).toContain("🚨 ERRO DE NEGÓCIO: mc1Enabled deve ser 0 ou 1");
});