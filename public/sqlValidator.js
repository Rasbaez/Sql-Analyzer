const { Parser } = require('node-sql-parser');
const parser = new Parser();

// 💼 Nossas Regras de Negócio
const camposStringObrigatorios = [
    'cIDCompany', 'cIDUser', 'cIDGroup', 'cIDBranch', 'cIDSession', 'cIDOrder', 'cIDTourID', 'cIDCheckInOut'
];

function validateSql(sqlInput, topCount = null) {
    console.log("🚀 [MOTOR SÊNIOR] Recebendo SQL para validação:", sqlInput);
    
    const warnings = [];
    let params = {};
    let originalSql = (sqlInput || "").trim().replace(/;+$/, ''); 

    // =========================================================================
    // 1. PRÉ-PROCESSAMENTO LEVE E AUTO-FIXES (String)
    // =========================================================================
    let queryPre = originalSql;
    
    // 🧹 LIXEIRO INTELIGENTE: Remove lixo de CTRL+C/CTRL+V fora de aspas!
    let sqlSemLixo = "";
    let inAspasLixo = false;
    let achouLixo = false;
    
    for (let i = 0; i < queryPre.length; i++) {
        const char = queryPre[i];
        if (char === "'") inAspasLixo = !inAspasLixo;
        
        if (!inAspasLixo && /[!@#\$%¨§?]/.test(char)) {
            achouLixo = true;
            continue; 
        }
        sqlSemLixo += char;
    }
    
    if (achouLixo) {
        queryPre = sqlSemLixo;
        warnings.push("✨ AUTO-FIX: Lixo de formatação (!, @, #, $, %, etc) removido automaticamente da query.");
    }

    const correcoes = { "CAS(": "CAST(", "CONVER(": "CONVERT(", "ISNUL(": "ISNULL(", "COALESC(": "COALESCE(" };
    for (let [erro, correto] of Object.entries(correcoes)) {
        let regex = new RegExp("\\b" + erro.replace("(", "\\("), "gi");
        if (regex.test(queryPre)) {
            queryPre = queryPre.replace(regex, correto);
            warnings.push(`✨ AUTO-FIX: Função corrigida automaticamente para '${correto.replace('(','')}'`);
        }
    }

    // 🛡️ AUTO-FIX: ASPA ÓRFÃ NO MEIO DA QUERY
    const queryAntesDasAspasPre = queryPre;
    queryPre = queryPre.replace(/(=|<>|>|<|>=|<=)\s*'([^'\n\r]+?)(?=\s+(?:AND|OR)\b|[\r\n]|$)/gi, "$1 '$2'");
    if (queryAntesDasAspasPre !== queryPre) {
        warnings.push("⚠️ AUTO-FIX: Aspa simples (') fechada automaticamente antes de um operador lógico.");
    }

    // Auto-fix: aspas ímpares no final
    if ((queryPre.match(/'/g) || []).length % 2 !== 0) {
        queryPre += "'";
        warnings.push("⚠️ AUTO-FIX: Aspa simples (') fechada automaticamente no final da instrução.");
    }
    
    // Auto-fix: parênteses abertos
    let abertos = (queryPre.match(/\(/g) || []).length;
    let fechados = (queryPre.match(/\)/g) || []).length;
    if (abertos > fechados) {
        queryPre += ")".repeat(abertos - fechados);
        warnings.push("⚠️ AUTO-FIX: Parêntese ')' fechado automaticamente no final da instrução.");
    }

    // =========================================================================
    // 2. O JUIZ FINAL: PARSER AST
    // =========================================================================
    let astList;
    try {
        const sqlLimpoParaAst = queryPre.replace(/WITH\s*\(\s*NOLOCK\s*\)/gi, "");
        
        astList = parser.astify(sqlLimpoParaAst, { database: 'transactsql' });
        
        if (!Array.isArray(astList)) astList = [astList];
        
    } catch (err) {
        console.error("🚨 [MOTOR] A Lib bloqueou a query por erro de sintaxe:", err.message);
        return {
            success: false,
            params: {},
            warnings: [`🚨 ERRO FATAL: O validador estrutural reprovou a sua query.`],
            autoFix: { fixed: originalSql, isDifferent: false },
            selectPreview: null,
            parserError: `Erro de Sintaxe: O comando está quebrado. Verifique se não faltam operadores (ex: '='), aspas simples ou vírgulas.\n\nDetalhe Técnico: ${err.message}`
        };
    }

    if (astList.length > 1) {
        warnings.push("⚠️ AVISO TÉCNICO: Múltiplos comandos detectados. Analisando apenas o primeiro.");
    }

    const ast = astList[0]; 
    
    if (!ast.where && (ast.type === 'update' || ast.type === 'delete')) {
        warnings.push("🚨 ERRO FATAL: Comando bloqueado! Você esqueceu a cláusula WHERE. NUNCA dê UPDATE/DELETE sem WHERE.");
        return {
            success: false,
            params: {},
            warnings,
            autoFix: { fixed: originalSql, isDifferent: false },
            selectPreview: null,
            parserError: "Comando bloqueado por segurança extrema. Adicione um WHERE."
        };
    }

    // =========================================================================
    // 3. APLICANDO AS REGRAS DE NEGÓCIO NOS NÓS DA AST
    // =========================================================================
    
    const isSubqueryNode = (node) => {
        return node && typeof node === 'object' && (
            node.type === 'select' ||
            node.type === 'select_stmt' ||
            node.type === 'subquery' ||
            (node.ast && node.ast.type === 'select')
        );
    };

    const formatSubqueryNode = (node) => {
        if (node.ast && node.ast.type === 'select') {
            return parser.sqlify(node.ast, { database: 'transactsql' });
        }
        return parser.sqlify(node, { database: 'transactsql' });
    };

    const aplicarRegrasNoValor = (coluna, nodeValor) => {
        if (!nodeValor) return;

        if (isSubqueryNode(nodeValor)) {
            params[coluna] = {
                tipo: 'SUBQUERY',
                valorOriginal: formatSubqueryNode(nodeValor)
            };
            return;
        }

        // 🔥 CAÇADOR DE COLUNAS FALSAS (O BUG DO NUL)
        if (nodeValor.type === 'column_ref' && nodeValor.column) {
            const colName = nodeValor.column.toLowerCase();
            if (colName === 'nul' || colName === 'nulll') {
                nodeValor.type = 'null'; 
                nodeValor.value = null;
                delete nodeValor.column;
                delete nodeValor.table;
                warnings.push(`✨ AUTO-FIX: Falsa coluna '${colName}' corrigida para o valor 'NULL' no campo '${coluna}'.`);
            }
        }

        // Se o nó for do tipo primitivo NULL
        if (nodeValor.type === 'null') {
            params[coluna] = 'NULL';
            return; 
        }

        // Prevenção de quebra: Se for uma coluna real, a gente não mexe
        if (nodeValor.value === undefined) return;

        let originalVal = String(nodeValor.value);
        let cleanVal = originalVal;
        const colLower = coluna.toLowerCase();

        const isStringReq = camposStringObrigatorios.map(c => c.toLowerCase()).includes(colLower);
        const isNumeric = colLower.startsWith('n') && colLower !== 'mc1lastupdate';

        if (nodeValor.type === 'string' || nodeValor.type === 'single_quote_string' || nodeValor.type === 'number') {
            if (isStringReq) {
                cleanVal = originalVal.replace(/[^a-zA-Z0-9]/g, ''); 
                nodeValor.type = 'single_quote_string'; 
                nodeValor.value = cleanVal;
            } else {
                cleanVal = originalVal.replace(/[!@#$%&*¨"§\/\\+;\(\)]/g, ''); 
                if (isNumeric) {
                    nodeValor.type = 'number'; 
                    nodeValor.value = Number(cleanVal) || cleanVal;
                } else {
                    nodeValor.type = 'single_quote_string';
                    nodeValor.value = cleanVal;
                }
            }
        }
        params[coluna] = cleanVal; 
    };

    let countFiltrosWhere = 0;

    const investigarWhere = (node) => {
        if (!node) return;

        if (node.type === 'binary_expr') {
            if (node.operator === 'AND' || node.operator === 'OR') {
                investigarWhere(node.left);
                investigarWhere(node.right);
                return;
            } else {
                countFiltrosWhere++; 
                if (node.left && node.left.type === 'column_ref') {
                    if (node.operator === 'IN' && node.right) {
                        if (node.right.value && Array.isArray(node.right.value)) {
                            node.right.value.forEach(item => {
                                if (isSubqueryNode(item)) {
                                    params[node.left.column] = {
                                        tipo: 'SUBQUERY',
                                        valorOriginal: formatSubqueryNode(item)
                                    };
                                } else {
                                    aplicarRegrasNoValor(node.left.column, item);
                                }
                            });
                        } else if (isSubqueryNode(node.right)) {
                            params[node.left.column] = {
                                tipo: 'SUBQUERY',
                                valorOriginal: formatSubqueryNode(node.right)
                            };
                        } else {
                            aplicarRegrasNoValor(node.left.column, node.right);
                        }
                    } else if (isSubqueryNode(node.right)) {
                        params[node.left.column] = {
                            tipo: 'SUBQUERY',
                            valorOriginal: formatSubqueryNode(node.right)
                        };
                    } else {
                        aplicarRegrasNoValor(node.left.column, node.right);
                    }
                }
            }
        } else if (node.type === 'in' || node.type === 'is_null' || node.type === 'is_not_null') {
            countFiltrosWhere++;
            
            if (node.type === 'in' && node.left && node.left.type === 'column_ref' && node.right) {
                if (node.right.value && Array.isArray(node.right.value)) {
                    node.right.value.forEach(item => {
                        if (isSubqueryNode(item)) {
                            params[node.left.column] = {
                                tipo: 'SUBQUERY',
                                valorOriginal: formatSubqueryNode(item)
                            };
                        } else {
                            aplicarRegrasNoValor(node.left.column, item);
                        }
                    });
                } else if (isSubqueryNode(node.right)) {
                    params[node.left.column] = {
                        tipo: 'SUBQUERY',
                        valorOriginal: formatSubqueryNode(node.right)
                    };
                }
            }
        }
    };

    investigarWhere(ast.where);

    if (countFiltrosWhere === 1) {
        warnings.push("⚠️ REGRA DE NEGÓCIO: O WHERE possui apenas 1 filtro. Verifique se não está omitindo o cIDCompany ou chaves primárias.");
    }

    if (ast.type === 'update' && ast.set) {
        ast.set.forEach(s => {
            if (s.column && s.value) {
                aplicarRegrasNoValor(s.column, s.value);
            }
        });
    }

    // =========================================================================
    // 4. RECONSTRUÇÃO PADRONIZADA E BLINDADA
    // =========================================================================
    let queryFinal = parser.sqlify(ast, { database: 'transactsql' });
    let selectPreview = null;

    if (ast.type === 'update' || ast.type === 'delete') {
        const nomeTabela = ast.table && ast.table[0] ? ast.table[0].table : '';
        
        try {
            const astSelect = {
                type: 'select',
                options: null,
                distinct: null,
                columns: '*',
                from: ast.table,
                where: ast.where,
                groupby: null,
                having: null,
                orderby: null,
                limit: null
            };
            selectPreview = parser.sqlify(astSelect, { database: 'transactsql' });
            
            selectPreview = selectPreview.replace(/(FROM\s+[a-zA-Z0-9_\[\]"`']+)/i, "$1 WITH (NOLOCK)");
            
        } catch (e) {
            selectPreview = `SELECT * FROM ${nomeTabela} WITH (NOLOCK) ...`;
        }
    }

    if (topCount && (ast.type === 'update' || ast.type === 'delete')) {
        queryFinal = queryFinal.replace(new RegExp(`^${ast.type}`, 'i'), `${ast.type.toUpperCase()} TOP (${topCount})`);
    }

    const q1 = originalSql.replace(/\s+/g, " ").toUpperCase();
    const q2 = queryFinal.replace(/\s+/g, " ").toUpperCase();

    return {
        success: !warnings.some(w => w.includes("🚨")),
        params: params, 
        warnings,
        autoFix: { 
            fixed: queryFinal, 
            isDifferent: q1 !== q2
        },
        selectPreview 
    };
}

module.exports = { validateSql };