const { ipcMain } = require('electron');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

//ENXUTO (Direto ao ponto para ser mais rápido)
const SYSTEM_PROMPT = `
Você é Engenheiro DBA MC1/PepsiCo. Prioridade: SINTAXE PERFEITA.
NUNCA omita '=' em WHERE/SET. Ex: [campo] = 'valor'.
Se "IN" tiver só 1 valor, mude para "=". (Ex: IN ('A') -> = 'A').

### 🔄 LOTE (BATCH) E TESTE DE IMPACTO:
- Analise TODAS as queries (;). Retorne tudo consolidado.
- REGRA DE OURO DO SELECT PREVIEW: Para CADA instrução de UPDATE ou DELETE no lote, você DEVE gerar um SELECT testando os mesmos filtros. Ex: 5 comandos = 5 SELECTs separados por (;). NÃO RESUMA.

### REGRAS PEPSICO:
1. SENSÍVEIS: "MC1_FILEIMPORT", "MC1_LOGFILEIMPORT" -> "🚨 ALERTA: Tabela técnica."
2. mc1enabled: DEVE ser 0 ou 1. Outros -> "🚨 CRÍTICO: mc1Enabled inválido."
3. cIDCompany: 0545, 0546, 0152, 0218, 0214, 0170, 0604. Se outro -> "⚠️ cIDCompany fora do padrão."

### SINTAXE MC1:
- Prefixos: [MC1_Tabela] (Corrija mc1tabela -> MC1_tabela). Use colchetes.

### RESPOSTA JSON:
- "auditReport": Resumo detalhado de TODAS as correções de sintaxe e avisos de melhoria.
- "criticalErrors": Apenas violações graves das regras PepsiCo (tabelas sensíveis, mc1enabled inválido, etc).

### 🎯 MAPEAMENTO DE PARÂMETROS (MUITO IMPORTANTE):
Você DEVE obrigatoriamente preencher o objeto "parsedData" mapeando as chaves como nome da coluna e o valor.
EXEMPLO EXATO de como você deve montar o JSON:
"parsedData": {
  "update": { "mc1Enabled": "1", "mc1LastUpdate": "getdate()" },
  "where": { "cIDCompany": "'0170'", "cIDTour": "'100013342750'" },
  "delete": {},
  "insert": {}
}
`;

// 🔥 OBRIGA A IA A ENTREGAR OS CAMPOS DO RELATÓRIO
const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    isSyntaxOk: { type: "boolean" },
    fixedQuery: { type: "string" },
    selectPreview: { type: "string" },
    auditReport: { type: "string" },
    criticalErrors: { type: "array", items: { type: "string" } },
    parsedData: {
      type: "object",
      properties: {
        update: { type: "object" },
        where: { type: "object" },
        delete: { type: "object" },
        insert: { type: "object" }
      }
    }
  },
  required: ["isSyntaxOk", "fixedQuery", "selectPreview", "auditReport", "criticalErrors", "parsedData"]
};

const delay = ms => new Promise(res => setTimeout(res, ms));

async function callGeminiWithFallback(prompt) {
  // 🚀 A ORDEM SUPREMA (Do mais estável para o mais livre)
const cascade = [
    "gemini-2.5-flash",         // O seu principal (Inteligente e atual)
    "gemini-2.0-flash",         // O backup perfeito (Segura a onda se o 2.5 cair)
    "gemini-flash-latest",      // O alias genérico do Google para a versão mais estável
    "gemini-flash-lite-latest"  // O salva-vidas leve
  ];

  let lastErr;

  for (const modelName of cascade) {
    try {
      console.log(`📡 Acionando: ${modelName}...`);
      
      const model = genAI.getGenerativeModel({ 
        model: modelName, 
        systemInstruction: SYSTEM_PROMPT,
        generationConfig: { 
          responseMimeType: "application/json",
      
        }
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      console.log(`\n--- JSON RECEBIDO DA IA (${modelName}) ---\n`, text, `\n-----------------------------------\n`);
      return { text, usedModel: modelName };

    } catch (err) {
      lastErr = err;
      const errorMsg = err.message || "";
      
      // Se for erro de cota ou sobrecarga, esperamos e pulamos pro próximo
      if (errorMsg.includes("429") || errorMsg.includes("503") || errorMsg.includes("high demand")) {
        console.warn(`🚨 ${modelName} falhou (Cota/Lentidão). Próximo em 2s...`);
        await delay(2000); 
        continue;
      }
      break; // Erro de segurança ou prompt não tenta os outros
    }
  }
  throw lastErr;
}

function setupAIHandlers() {
  ipcMain.handle('ask-gemini', async (event, prompt) => {
    try {
      const response = await callGeminiWithFallback(prompt);
      return { success: true, data: response.text, modelUsed: response.usedModel };
    } catch (error) {
      let friendlyError = error.message;
      if (error.message.includes("429")) friendlyError = "Cota de API Grátis Excedida. Aguarde 60 segundos.";
      return { success: false, error: friendlyError };
    }
  });
}

module.exports = { setupAIHandlers };