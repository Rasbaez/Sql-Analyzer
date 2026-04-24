// schema.js
const CONFIG_PEPSICO = {
    regions: {
        "0545": { name: "México WTM", canResetPwd: true },
        "0546": { name: "Brasil LSM", canResetPwd: true },
        "0152": { name: "Chile", canResetPwd: false },
        "0218": { name: "Equador", canResetPwd: false },
        "0214": { name: "Uruguai", canResetPwd: false },
        "0170": { name: "Região 0170", canResetPwd: false },
        "0604": { name: "Região 0604", canResetPwd: false }
    },
    campos: {
        "mc1enabled": { valores: ["0", "1"], obrigatorio: false },
        "cidcompany": { obrigatorio: false }, 
        "xordertype": { 
            pattern: /^(00[1-9]|WTM00[1-9]|WTM010)$/, 
            msg: "Padrão de Tipo de Ordem inválido (Ex: WTM002, 001)." 
        }
    },
    formats: {
        cIDOrder: /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]{4}-[0-9]{2}-[0-9]{2}/,
        cIDTerritory: /^[A-Z0-9]{5,10}$/i
    },
    sensitiveTables: [
         "MC1_FILEIMPORT", "MC1_LOGFILEIMPORT"
        
    ]
};

const validarConteudoNegocio = (params, sqlOriginal) => {
    const warnings = [];
    const sqlUpper = (sqlOriginal || "").toUpperCase();
    
    if (!params) return warnings;

    // Normalização dos parâmetros para a validação
    const p = Object.keys(params).reduce((acc, k) => {
        const key = k.toLowerCase();
        const valorOriginal = params[k];

        if (typeof valorOriginal === 'object' && valorOriginal !== null) {
            acc[key] = valorOriginal;
            return acc;
        }

        let val = String(valorOriginal).replace(/['"]/g, "").trim();
        if (key === 'cidcompany') val = val.replace(/\D/g, ""); 
        
        acc[key] = val.toUpperCase();
        return acc;
    }, {});

    // 1. Segurança de Tabelas Técnicas
    CONFIG_PEPSICO.sensitiveTables.forEach(tab => {
        if (sqlUpper.includes(tab) && (sqlUpper.includes("UPDATE") || sqlUpper.includes("DELETE"))) {
            warnings.push(`🚨 ALERTA DE SEGURANÇA: Alteração direta na tabela técnica ${tab}. Requer aprovação nível 2.`);
        }
    });

    // 2. Validação de Campos
    Object.entries(CONFIG_PEPSICO.campos).forEach(([campo, regra]) => {
        const valor = p[campo];
        if (typeof valor === 'object') return; 

        if (campo === 'mc1enabled' && valor && valor !== 'NULL') {
            if (!regra.valores.includes(valor)) {
                warnings.push(`🚨 ERRO CRÍTICO: O campo mc1Enabled só aceita 0 ou 1.`);
            }
        }
        if (regra.obrigatorio && (!valor || valor === 'NULL' || valor === '')) {
            warnings.push(`🚨 ERRO CRÍTICO: O campo ${campo} é obrigatório.`);
        }
        if (valor && valor !== 'NULL' && regra.pattern && !regra.pattern.test(valor)) {
            warnings.push(`⚠️ FORMATO: ${regra.msg}`);
        }
    });

    // 3. Regionalização
    if (p.cidcompany && typeof p.cidcompany === 'string' && !CONFIG_PEPSICO.regions[p.cidcompany]) {
        warnings.push(`⚠️ AVISO: cIDCompany '${p.cidcompany}' não está no dicionário padrão da América Latina.`);
    }

    // 4. Integridade de IDs Sensíveis
    const idsProibidosNull = ['ciduser', 'cidterritory', 'cidcompany', 'cidorder', 'cidliquidate', 'mc1enabled'];
    idsProibidosNull.forEach(campo => {
        if (p[campo] === 'NULL') {
            warnings.push(`🚨 SEGURANÇA: O campo '${campo}' não pode ser definido como 'NULL'.`);
        }
    });

    // 5. Segurança de Lógica SQL
    if (sqlUpper.includes("UPDATE") && !sqlUpper.includes("WHERE")) {
        warnings.push("🚨 BLOQUEIO: UPDATE sem cláusula WHERE detectado.");
    }

    return warnings;
};

module.exports = { CONFIG_PEPSICO, validarConteudoNegocio };