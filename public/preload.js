// 💻 public/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // 1. Envia a query para o validador
    extractParams: (sql) => ipcRenderer.invoke('extract-params', sql),
    
    // 2. Chama a geração do PDF
    generatePdf: () => ipcRenderer.invoke('generate-pdf'),
    
    // 3. 🔥 TESTE DE CONEXÃO (SQL)
    testConnection: (server, database, user, pass) => ipcRenderer.invoke('test-connection', server, database, user, pass),
    
    // 4. Executa a Query e o Cancelamento
    executeSelect: (query, database, server) => ipcRenderer.invoke('execute-select', query, database, server),
    cancelSelect: () => ipcRenderer.send('cancel-select'), 
    
    // 5. Funções da Automação Hypercare
    saveAutomationFile: (filePath, content) => ipcRenderer.invoke('save-automation-file', filePath, content),
    runExecutable: (exeCommand) => ipcRenderer.invoke('run-executable', exeCommand),
    onExeLog: (callback) => ipcRenderer.on('exe-log', (_event, value) => callback(value)),
    removeExeLogListeners: () => ipcRenderer.removeAllListeners('exe-log'),
    
    // 6. 🍃 MONGO DB
    testMongodb: (config) => ipcRenderer.invoke('test-mongodb', config),
    getMongoInvoices: (config, filtros, collectionName) => ipcRenderer.invoke('get-mongo-invoices', config, filtros, collectionName),
    listMongoCollections: (config) => ipcRenderer.invoke('list-mongo-collections', config), 

    // 🔥 A NOVA de EODs:
    getMongoEods: (config, query, collectionName) => ipcRenderer.invoke('get-mongo-eods', config, query, collectionName),
  
    // 💰 7. ANALISADOR DE PREÇOS (SQL)
    analyzeSqlPrices: (payload) => ipcRenderer.invoke('analyze-sql-prices', payload),
});