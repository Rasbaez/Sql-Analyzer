// errorTranslator.js (ou utils/errorTranslator.js)

function traduzirErroSql(err) {
    const msg = err.message || "";
    const msgLower = msg.toLowerCase();

    console.log("Erro SQL Original:", msg);
    // 1. O ERRO DO 'WITH'
    if (msgLower.includes("incorrect syntax near the keyword 'with'") || msgLower.includes("previous statement must be terminated with a semicolon")) {
        return "🚨 Erro de Sintaxe (WITH): Se você está usando CTE (Common Table Expression), o SQL Server exige que o comando anterior termine com um ponto-e-vírgula (;). Ex: ';WITH CTE AS...'";
    }

    // 2. ERRO DE SINTAXE GERAL
    if (msgLower.includes('incorrect syntax near')) {
        const match = msg.match(/Incorrect syntax near '([^']+)'/i) || msg.match(/Incorrect syntax near the keyword '([^']+)'/i);
        const palavra = match ? match[1] : "algum termo";
        return `🚨 Erro de Sintaxe: Existe algo escrito errado perto de '${palavra}'. Verifique vírgulas, aspas não fechadas ou parênteses.`;
    }

    // 3. TABELA NÃO ENCONTRADA
    if (msgLower.includes('invalid object name')) {
        const match = msg.match(/Invalid object name '([^']+)'/i);
        const tabela = match ? match[1] : "a tabela";
        return `🚨 Tabela Não Encontrada: O objeto '${tabela}' não existe no banco de dados selecionado. Verifique o nome ou troque a base de dados.`;
    }

    // 4. COLUNA NÃO ENCONTRADA
    if (msgLower.includes('invalid column name')) {
        const match = msg.match(/Invalid column name '([^']+)'/i);
        const coluna = match ? match[1] : "a coluna";
        return `🚨 Coluna Inválida: A coluna '${coluna}' não existe nesta tabela.`;
    }

    // 5. TIMEOUT (Tempo limite excedido)
    if (msgLower.includes('timeout')) {
        return "⏳ Tempo Limite Atingido: O banco demorou muito para responder (mais de 30s). A consulta é muito pesada. Tente aplicar filtros mais restritivos no WHERE.";
    }

    // 6. ERRO DE CONVERSÃO DE TIPO
    if (msgLower.includes('conversion failed') || msgLower.includes('error converting data type')) {
        return "🚨 Erro de Conversão: Você está tentando comparar ou inserir um texto em um campo que aceita apenas Números ou Datas (ou vice-versa).";
    }

    // 7. FALHA DE LOGIN/PERMISSÃO
    if (msgLower.includes('login failed') || msgLower.includes('permission was denied')) {
        return "🔒 Acesso Negado: O seu usuário de rede não tem permissão para logar ou ler dados neste banco específico.";
    }
    // 🛡️ 8. ERRO DE REDE / FALTA DE VPN
  // Ocorre quando o PC do usuário não acha o servidor da AWS (ag_pps_list.aws.mc1.br)
  if (
      msg.includes('network-related') || 
      msg.includes('timeout') || 
      msg.includes('Tempo limite') || 
      msg.includes('named pipes') || 
      msg.includes('not found') || 
      msg.includes('não encontrado')
  ) {
      return "⚠️ Servidor Inacessível: O banco de dados não foi encontrado. Verifique se sua internet está ativa e se você está conectado à VPN Corporativa.";
  }

    // SE FOR UM ERRO DESCONHECIDO: Limpa o prefixo feio do ODBC
    let cleanMsg = msg.replace(/\[Microsoft\]\[ODBC Driver .*?\]\[SQL Server\]/i, '').trim();
    return `🚨 Erro SQL: ${cleanMsg}`;
}

// Exportando no padrão Node.js
module.exports = { traduzirErroSql };