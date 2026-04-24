// 🔌 src/services/ElectronAPIService.js
// Camada de abstração centralizada para todas as chamadas Electron
// Benefícios: Logging, tratamento de erros unificado, mock para testes

class ElectronAPIService {
  constructor() {
    this.api = window.electronAPI;
    this.logLevel = 'debug'; // 'debug' | 'info' | 'warn' | 'error'
  }

  /**
   * Log interno com prefixo
   */
  _log(level, method, data) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    if (levels[level] >= levels[this.logLevel]) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [${level.toUpperCase()}] ElectronAPIService.${method}:`, data);
    }
  }

  /**
   * Wrapper para tratamento centralizado de erros
   */
  async _call(methodName, ...args) {
    try {
      this._log('debug', methodName, { args });
      
      if (!this.api || !this.api[methodName]) {
        throw new Error(`❌ Método ElectronAPI.${methodName} não disponível`);
      }

      const result = await this.api[methodName](...args);
      this._log('debug', methodName, { result });
      return result;
    } catch (error) {
      this._log('error', methodName, { error: error.message });
      throw error;
    }
  }

  // ============ SQL ANALYZER ============

  async extractParams(sql, limit = undefined) {
    this._log('info', 'extractParams', { sqlLength: sql.length, limit });
    return this._call('extractParams', sql, limit);
  }

  async executeSelect(query, database, server) {
    this._log('info', 'executeSelect', { queryLength: query.length, database, server });
    return this._call('executeSelect', query, database, server);
  }

  async cancelSelect() {
    this._log('info', 'cancelSelect', {});
    return this._call('cancelSelect');
  }

  // ============ ROUTE ANALYZER ============

  async getRouteData(database, server) {
    this._log('info', 'getRouteData', { database, server });
    return this._call('getRouteData', database, server);
  }

  // ============ TELEMETRY ANALYZER ============

  async getTelemetryData() {
    this._log('info', 'getTelemetryData', {});
    return this._call('getTelemetryData');
  }

  async saveTelemetryData(filePath, data) {
    this._log('info', 'saveTelemetryData', { filePath, dataSize: JSON.stringify(data).length });
    return this._call('saveTelemetryData', filePath, data);
  }

  // ============ INVOICE ANALYZER ============

  async analyzeInvoice(file) {
    this._log('info', 'analyzeInvoice', { fileName: file.name, size: file.size });
    return this._call('analyzeInvoice', file);
  }

  async exportInvoiceReport(filePath, data) {
    this._log('info', 'exportInvoiceReport', { filePath });
    return this._call('exportInvoiceReport', filePath, data);
  }

  // ============ MONGO DB ANALYZERS ============

  /**
   * Busca notas fiscais no MongoDB baseando-se em filtros
   * @param {Object} config - { server, database, user, password }
   * @param {Object} filtros - { series, branches, invoices }
   * @returns {Promise<Object>} { success, data, error? }
   */
  async getMongoInvoices(config, filtros) {
    this._log('info', 'getMongoInvoices', { server: config.server, invoicesCount: filtros?.invoices?.length });
    return this._call('getMongoInvoices', config, filtros);
  }

  /**
   * Busca fechamentos (EOD) no MongoDB
   * @param {Object} config - { server, database, user, password }
   * @param {Object} filtros - { cIDLiquidate, cIDCompany }
   * @param {string} collectionName - Opcional
   */
  async getMongoEods(config, filtros, collectionName) {
    this._log('info', 'getMongoEods', { server: config.server, collectionName });
    return this._call('getMongoEods', config, filtros, collectionName);
  }

  // ============ PRICE ANALYZER (SQL) ============
  
  /**
   * Busca preços e condições (I007, ZBDC, ZBDI)
   */
  async analyzeSqlPrices(payload) {
    this._log('info', 'analyzeSqlPrices', { server: payload?.credenciais?.server });
    return this._call('analyzeSqlPrices', payload);
  }

  // ============ AUTOMATION MANAGER ============

  async saveAutomationFile(filePath, content) {
    this._log('info', 'saveAutomationFile', { filePath, contentSize: content.length });
    return this._call('saveAutomationFile', filePath, content);
  }

  async runExecutable(command) {
    this._log('info', 'runExecutable', { command: command.substring(0, 50) + '...' });
    return this._call('runExecutable', command);
  }

  // ============ CONNECTION SETUP ============

  async testConnection(server, database, username = '', password = '') {
    this._log('info', 'testConnection', { server, database });
    return this._call('testConnection', server, database, username, password);
  }

  /**
   * Testa conexão com banco de dados MongoDB
   * @param {Object} config - { server, database, user, password }
   * @returns {Promise<Object>} { connected, success, error? }
   */
  async testMongodb(config) {
    this._log('info', 'testMongodb', { server: config.server, database: config.database });
    return this._call('testMongodb', config);
  }

  async listDatabases(server) {
    this._log('info', 'listDatabases', { server });
    return this._call('listDatabases', server);
  }

  async listServers() {
    this._log('info', 'listServers', {});
    return this._call('listServers');
  }

  // ============ FILE OPERATIONS ============

  async openFileDialog(options = {}) {
    this._log('info', 'openFileDialog', { options });
    return this._call('openFileDialog', options);
  }

  async openFolderDialog(options = {}) {
    this._log('info', 'openFolderDialog', { options });
    return this._call('openFolderDialog', options);
  }

  // ============ UTILITIES ============

  async copyToClipboard(text) {
    this._log('debug', 'copyToClipboard', { textLength: text.length });
    return this._call('copyToClipboard', text);
  }

  async readFile(filePath) {
    this._log('info', 'readFile', { filePath });
    return this._call('readFile', filePath);
  }

  setLogLevel(level) {
    this.logLevel = level;
    this._log('info', 'setLogLevel', { level });
  }

  async getSystemInfo() {
    this._log('info', 'getSystemInfo', {});
    return this._call('getSystemInfo');
  }


  // ============ MONGO DB ANALYZERS ============
  
  // (Adicione junto com os outros métodos do Mongo)
  async getMassiveMongoInvoices(config, queryArray, collectionName) {
    this._log('info', 'getMassiveMongoInvoices', { 
      server: config.server, 
      queryBlockSize: queryArray?.length 
    });
    return this._call('getMassiveMongoInvoices', config, queryArray, collectionName);
  }

  
}

// Exporta singleton
export const electronAPIService = new ElectronAPIService();

// Para testes/mocks (opcional)
export default ElectronAPIService;