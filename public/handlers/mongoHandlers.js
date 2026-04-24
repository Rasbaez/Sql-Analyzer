// 💻 public/handlers/mongoHandlers.js

const { MongoClient } = require('mongodb');

// Função auxiliar para injetar usuário e senha dinamicamente na string
function buildMongoUri(server, user, password) {
  const crypto = require('crypto');
  if (typeof global.crypto === 'undefined') {
    global.crypto = crypto.webcrypto || crypto;
  }

  // Limpa protocolos se o usuário tiver colado sem querer
  const cleanServer = server.replace(/^mongodb:\/\//, '').replace(/^mongodb\+srv:\/\//, '');
  
  // Verifica se tem uma porta especificada (ex: :28040) ou se é localhost
  const hasPort = /:\d+/.test(cleanServer);
  const isLocalhost = cleanServer.includes('localhost') || cleanServer.includes('127.0.0.1');
  
  // Se tiver porta ou localhost, usa o padrão clássico. Senão, usa o moderno (Atlas)
  const protocol = (hasPort || isLocalhost || cleanServer.includes('replicaSet')) 
    ? 'mongodb://' 
    : 'mongodb+srv://';
  
  const userName = (user || '').trim();
  const pass = password || '';

  if (userName && pass) {
    return `${protocol}${encodeURIComponent(userName)}:${encodeURIComponent(pass)}@${cleanServer}`;
  }
  return `${protocol}${cleanServer}`;
}

module.exports = function registerMongoHandlers(ipcMain) {
  
  // ==========================================
  // 1. TESTE DE CONEXÃO
  // ==========================================
  ipcMain.handle('test-mongodb', async (event, config) => {
    const { server, database, user, password } = config;
    const uri = buildMongoUri(server, user, password);
    console.log(`[Mongo] Testando conexão dinâmica...`);

    // 🔥 Adicionado Timeout de 5s
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000 });

    try {
      await client.connect();
      await client.db(database.trim()).command({ ping: 1 });
      return { connected: true, success: true };
    } catch (error) {
      console.error('🚨 [Mongo Erro - Teste]:', error.message);
      return { connected: false, success: false, error: error.message };
    } finally {
      // 🔥 O Zelador: Fecha a conexão em sucesso ou falha
      await client.close();
    }
  });

  // ==========================================
  // 2. LISTAR COLLECTIONS
  // ==========================================
  ipcMain.handle('list-mongo-collections', async (event, config) => {
    const { server, database, user, password } = config;
    const uri = buildMongoUri(server, user, password);
    
    // 🔥 Adicionado Timeout de 5s
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000 });

    try {
      await client.connect();
      const db = client.db(database.trim());
      // Pega todas as collections e retorna só os nomes ordenados
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name).sort();
      
      return { success: true, data: collectionNames };
    } catch (error) {
      console.error('🚨 [Mongo Erro - Collections]:', error.message);
      return { success: false, error: error.message };
    } finally {
      await client.close();
    }
  });

  // ==========================================
  // 3. INVOICE ANALYZER (Apenas Notas Fiscais)
  // ==========================================
  ipcMain.handle('get-mongo-invoices', async (event, config, filtros, collectionName) => {
    const { server, database, user, password } = config;
    const uri = buildMongoUri(server, user, password);
    
    // 🔥 Adicionado Timeout de 5s
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000 });

    try {
      await client.connect();
      const db = client.db(database.trim() || 'MDB_PEPSICO_BR');
      const collection = db.collection(collectionName || 'InvoiceSapExport');

      // Proteção de Arrays
      const seriesArray = Array.isArray(filtros.cSerie) ? filtros.cSerie : [filtros.cSerie];
      const branchesArray = Array.isArray(filtros.cIDBranchInvoice) ? filtros.cIDBranchInvoice : [filtros.cIDBranchInvoice];
      const invoicesArray = Array.isArray(filtros.cIDInvoice) ? filtros.cIDInvoice : [filtros.cIDInvoice];

      const queryMongo = {
        cIDCompany: '0546',
        cSerie: { $in: seriesArray },
        cIDBranchInvoice: { $in: branchesArray },
        cIDInvoice: { $in: invoicesArray }
      };

      const resultado = await collection.find(queryMongo).toArray();
      return { success: true, data: resultado };

    } catch (error) {
      console.error(`🚨 [Mongo Erro - Invoices]:`, error.message);
      return { success: false, error: error.message };
    } finally {
      // 🔥 Blindagem: Se o client existe, garante que vai fechar
      if (client) await client.close();
    }
  });

  // ==========================================
  // 4. EOD ANALYZER (Apenas Fechamentos)
  // ==========================================
  ipcMain.handle('get-mongo-eods', async (event, config, filtros, collectionName) => {
    const { server, database, user, password } = config;
    const uri = buildMongoUri(server, user, password);
    
    // 🔥 Adicionado Timeout de 5s
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000 });

    try {
      await client.connect();
      const db = client.db(database.trim() || 'MDB_PEPSICO_BR');
      const collection = db.collection(collectionName || 'EndofDayExport');

      // Proteção de Arrays para o Liquidate
      const liquidatesArray = Array.isArray(filtros.cIDLiquidate) ? filtros.cIDLiquidate : [filtros.cIDLiquidate];

      const queryMongo = {
        cIDLiquidate: { $in: liquidatesArray },
        cIDCompany: filtros.cIDCompany || '0546'
      };

      const resultado = await collection.find(queryMongo).toArray();
      return { success: true, data: resultado };

    } catch (error) {
      console.error(`🚨 [Mongo Erro - EODs]:`, error.message);
      return { success: false, error: error.message };
    } finally {
      // 🔥 Blindagem final
      if (client) await client.close();
    }
  });

 // 🚀 NOVO: EXTRATOR MASSIVO (Bulk Query)
  ipcMain.handle('get-massive-mongo-invoices', async (event, config, queryArray, collectionName = 'InvoiceSapExport') => {
    const { MongoClient } = require('mongodb');
    
    // 🔥 CORREÇÃO WEBPACK: Força o Electron a expor o 'crypto' pro driver do MongoDB não chorar
    const crypto = require('crypto');
    if (typeof global.crypto === 'undefined') {
      global.crypto = crypto;
    }
    
    const userSeguro = encodeURIComponent(config.user);
    const passSegura = encodeURIComponent(config.password);
    const url = `mongodb://${userSeguro}:${passSegura}@${config.server}`;
    
    const client = new MongoClient(url, { serverSelectionTimeoutMS: 15000 });

    try {
      await client.connect();
      const db = client.db(config.database);
      const collection = db.collection(collectionName);

      console.log(`[Mongo Backend] Executando Bulk Query com ${queryArray.length} condições OR...`);

      const notas = await collection.find({ $or: queryArray }).toArray();

      console.log(`[Mongo Backend] Retornando ${notas.length} notas massivas.`);
      
      return { success: true, data: notas };
    } catch (error) {
      console.error('[Mongo Backend Erro Massivo]:', error);
      // 🔥 IMPORTANTE: Retorna só a mensagem de erro pro Frontend não dar erro de IPC (null is not iterable)
      return { success: false, error: error.message || "Erro desconhecido no MongoDB" };
    } finally {
      await client.close();
    }
  });
  
};