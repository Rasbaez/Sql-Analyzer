// 💻 public/handlers/sqlHandlers.js
const sql = require('mssql/msnodesqlv8'); 
const { traduzirErroSql } = require('../../src/utils/errorTranslator');
const { buildZbdcQuery, buildZbdiQuery, buildBaseQuery } = require('../../src/utils/sql/priceQueryBuilder');

let activeSqlRequest = null;
let activePool = null;
let isQueryCancelled = false;

module.exports = function registerSqlHandlers(ipcMain) {
  
  // 🔌 1. TESTE DE CONEXÃO SQL
  ipcMain.handle('test-connection', async (event, server, database) => {
    try {
      console.log(`[Backend] Testando conexão: Server=${server}, DB=${database}`);
      const dbName = database.trim(); 
      const serverName = server.trim(); 
      const strConexao17 = `Driver={ODBC Driver 17 for SQL Server};Server=${serverName};Database=${dbName};Trusted_Connection=yes;Encrypt=yes;TrustServerCertificate=yes;`;

      try {
        const pool = new sql.ConnectionPool({ connectionString: strConexao17, requestTimeout: 10000 });
        await pool.connect();
        await pool.close(); 
        return { connected: true, success: true };
      } catch (err) {
        if (err.message.includes('não encontrado') || err.message.includes('not found') || err.message.includes('driver')) {
          console.log("[Backend] Teste de Conexão: Tentando driver genérico...");
          const strConexaoGenerica = `Driver={SQL Server};Server=${serverName};Database=${dbName};Trusted_Connection=yes;Encrypt=yes;TrustServerCertificate=yes;`;
          const poolGen = new sql.ConnectionPool({ connectionString: strConexaoGenerica, requestTimeout: 10000 });
          await poolGen.connect();
          await poolGen.close();
          return { connected: true, success: true };
        } else {
          throw err;
        }
      }
    } catch (error) {
      console.error('[Backend] Erro no teste de conexão:', error.message);
      return { connected: false, success: false, error: traduzirErroSql(error) };
    }
  });

  // 🛑 2. CANCELAR SELECT
  ipcMain.on('cancel-select', async () => {
    isQueryCancelled = true; 
    if (activeSqlRequest) {
        try { activeSqlRequest.cancel(); } catch (err) {}
        activeSqlRequest = null;
    }
    if (activePool) {
        try { await activePool.close(); } catch (err) {}
        activePool = null;
    }
  });

  // 📡 3. EXECUTAR SELECT PADRÃO (SqlAnalyzer)
  ipcMain.handle('execute-select', async (event, query, database, server) => {
    if (!database || !server) return { success: false, error: "Servidor ou Banco não informados." };
    isQueryCancelled = false; 

    try {
        const dbName = database.trim(); 
        const serverName = server.trim(); 
        const strConexao17 = `Driver={ODBC Driver 17 for SQL Server};Server=${serverName};Database=${dbName};Trusted_Connection=yes;Encrypt=yes;TrustServerCertificate=yes;`;

        try {
            activePool = new sql.ConnectionPool({ connectionString: strConexao17, requestTimeout: 30000 });
            await activePool.connect();
            if (isQueryCancelled) throw new Error("CANCELADO_PELO_USUARIO");

            activeSqlRequest = new sql.Request(activePool);
            const result = await activeSqlRequest.query(query);
            if (isQueryCancelled) throw new Error("CANCELADO_PELO_USUARIO");

            if (activePool) await activePool.close();
            activeSqlRequest = null; activePool = null;
            return { success: true, data: result.recordset };
        } catch (err) {
            if (isQueryCancelled || err.name === 'CancelError' || err.message.includes('Canceled') || err.message === 'CANCELADO_PELO_USUARIO') {
                activeSqlRequest = null; activePool = null;
                return { success: false, error: "Consulta interrompida com segurança pelo usuário." };
            }
            if (err.message.includes('não encontrado') || err.message.includes('not found') || err.message.includes('driver')) {
                const strConexaoGenerica = `Driver={SQL Server};Server=${serverName};Database=${dbName};Trusted_Connection=yes;Encrypt=yes;TrustServerCertificate=yes;`;
                activePool = new sql.ConnectionPool({ connectionString: strConexaoGenerica, requestTimeout: 30000 });
                await activePool.connect();
                if (isQueryCancelled) throw new Error("CANCELADO_PELO_USUARIO");

                activeSqlRequest = new sql.Request(activePool);
                const resultFallback = await activeSqlRequest.query(query);
                if (isQueryCancelled) throw new Error("CANCELADO_PELO_USUARIO");

                if (activePool) await activePool.close();
                activeSqlRequest = null; activePool = null;
                return { success: true, data: resultFallback.recordset };
            } else {
                throw err; 
            }
        }
    } catch (err) {
        if (isQueryCancelled || err.message === 'CANCELADO_PELO_USUARIO') {
            activeSqlRequest = null; activePool = null;
            return { success: false, error: "Consulta interrompida com segurança pelo usuário." };
        }
        activeSqlRequest = null; activePool = null;
        return { success: false, error: traduzirErroSql(err) };
    }
  });

  // 💰 4. NOVO! ANALISADOR DE PREÇOS (PriceAnalyzer)
  ipcMain.handle('analyze-sql-prices', async (event, payload) => {
    const { credenciais, filtros } = payload;
    
    // Configura a string usando a autenticação do Windows do próprio usuário
    const dbName = credenciais.database.trim(); 
    const serverName = credenciais.server.trim(); 
    const strConexao = `Driver={ODBC Driver 17 for SQL Server};Server=${serverName};Database=${dbName};Trusted_Connection=yes;Encrypt=yes;TrustServerCertificate=yes;`;

    try {
      const pool = new sql.ConnectionPool({ connectionString: strConexao, requestTimeout: 15000 });
      await pool.connect();
      console.log('✅ [Backend] Conectado ao SQL Server para analisar preços.');

      // Monta as 3 queries usando o Utils
      const qBase = buildBaseQuery(filtros);
      const qZbdc = buildZbdcQuery(filtros);
      const qZbdi = buildZbdiQuery(filtros);

      // Roda as 3 queries PARALELAMENTE (o banco chora, mas o Node ama)
      console.log('⏳ [Backend] Disparando 3 queries SQL em paralelo...');
      const [resBase, resZbdc, resZbdi] = await Promise.all([
        pool.request().query(qBase),
        pool.request().query(qZbdc),
        pool.request().query(qZbdi)
      ]);

      await pool.close();
      console.log('🏁 [Backend] Consultas finalizadas. Retornando os dados...');

      return { 
        success: true, 
        data: {
          base: resBase.recordset,
          zbdc: resZbdc.recordset,
          zbdi: resZbdi.recordset
        }
      };
    } catch (error) {
      console.error('🚨 [Backend Erro SQL Prices]:', error.message);
      return { success: false, error: traduzirErroSql(error) };
    }
  });
};