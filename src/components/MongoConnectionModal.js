// 💻 src/components/MongoConnectionModal.js

import React, { useState } from 'react';
import { Database, Server, Zap, X, Activity, Key, User } from 'lucide-react';
import './componentsCss/ConnectionModal.css'; // Usando o seu CSS padrão de modais

const MongoConnectionModal = ({ isOpen, onClose, onSave }) => {
const [server, setServer] = useState(
  localStorage.getItem('mongo_server') || 
  'awsbr9pdmongo01.aws.mc1.br:28040/?authSource=admin&replicaSet=ag_pps_mongo_casa&readPreference=secondaryPreferred&ssl=false'
);
  const [database, setDatabase] = useState(localStorage.getItem('mongo_db') || 'MDB_PEPSICO_BR');
  const [user, setUser] = useState(localStorage.getItem('mongo_user') || '');
  const [password, setPassword] = useState(localStorage.getItem('mongo_pass') || '');
  
  // Estados de controle da interface
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  if (!isOpen) return null;

  // 🧪 Função para testar a conexão no Backend
  const handleTest = async (e) => {
    e.preventDefault();
    setIsTesting(true);
    setTestResult(null); // Limpa o resultado anterior

    const config = { server, database, user, password };
    
    try {
      // Chama a nossa ponte no preload.js -> electronAPIService
      const res = await window.electronAPI.testMongodb(config);
      setTestResult(res);
    } catch (error) {
      setTestResult({ success: false, error: 'Erro de comunicação com o backend.' });
    } finally {
      setIsTesting(false);
    }
  };

  // 💾 Função para salvar no LocalStorage e fechar o modal
  const handleSave = (e) => {
    e.preventDefault();
    
    // Salva no cache do navegador (Electron)
    localStorage.setItem('mongo_server', server);
    localStorage.setItem('mongo_db', database);
    localStorage.setItem('mongo_user', user);
    localStorage.setItem('mongo_pass', password);
    
    // Devolve a configuração para o componente pai (MongoInvoiceAnalyzer)
    onSave({ server, database, user, password });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* Impede que o clique dentro do modal feche ele */}
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}><X size={22} /></button>
        
        <div className="modal-header">
          <div className="modal-icon-wrapper"><Database size={32} color="#10b981" /></div>
          <h2 className="modal-title">Conexão MongoDB</h2>
        </div>

        <form>
          <div className="input-group">
            <label className="input-label"><Server size={14} color="#10b981" /> Cluster (Servidor)</label>
            <input 
              type="text" 
              className="input-field" 
              value={server} 
              onChange={e => setServer(e.target.value)} 
              placeholder="Ex: cluster0.mongodb.net" 
            />
          </div>
          
          <div className="input-group">
            <label className="input-label"><Database size={14} color="#10b981" /> Database</label>
            <input 
              type="text" 
              className="input-field" 
              value={database} 
              onChange={e => setDatabase(e.target.value)} 
              placeholder="MDB_PEPSICO_BR" 
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label"><User size={14} color="#10b981" /> Usuário</label>
              <input 
                type="text" 
                className="input-field" 
                value={user} 
                onChange={e => setUser(e.target.value)} 
                placeholder="Seu usuário"
              />
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label className="input-label"><Key size={14} color="#10b981" /> Senha</label>
              <input 
                type="password" 
                className="input-field" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Área de Resposta do Teste de Conexão */}
          {testResult && (
            <div className={testResult.success ? "modal-success" : "modal-error"} style={{ marginTop: '15px', padding: '10px', borderRadius: '5px', fontSize: '13px' }}>
              {testResult.success ? '✅ Conexão MongoDB estabelecida!' : `❌ ${testResult.error}`}
            </div>
          )}

          <div className="modal-footer" style={{ marginTop: '20px' }}>
            <button type="button" className="btn-test" onClick={handleTest} disabled={isTesting}>
              <Activity size={18} /> {isTesting ? 'Testando...' : 'Testar Conexão'}
            </button>
            <button type="button" className="btn-save" onClick={handleSave} style={{ background: '#10b981', color: '#fff' }}>
              <Zap size={18} /> Salvar & Conectar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MongoConnectionModal;