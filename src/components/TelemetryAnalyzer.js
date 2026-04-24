import React from 'react';
import { 
  UploadCloud, Activity, Clock, FileText, Database, Cloud, Search, Eye, X, Filter, Trash2, Zap, Settings, AlertTriangle, MessageSquare, MapPin, ChevronDown, ChevronRight 
} from 'lucide-react';
import { useTelemetry } from '../hooks/useTelemetry';
import { renderEventIcon, handleCopy, formatForClipboard } from '../utils/telemetryHelpers';
import './componentsCss/TelemetryAnalyzer.css';
import videoFundo from './assets/programing-tech.mp4';

const TelemetryAnalyzer = () => {
  const { state, computed, actions } = useTelemetry();

  // Handlers simplificados
  const handleKeyDown = (e) => { if (e.key === 'Enter') actions.handleApplyFilters(); };
  const handleDrop = (e) => { 
    e.preventDefault(); 
    actions.setIsDragging(false); 
    if (e.dataTransfer.files.length > 0) actions.handleProcessFiles(e.dataTransfer.files); 
  };

  return (
    <div className="telemetry-container">
      <div className="video-background-container">
        <video autoPlay loop muted playsInline className="video-background-element">
          <source src={videoFundo} type="video/mp4" />
        </video>
      </div>

      <header className="telemetry-header">
        <div className="telemetry-title-row">
          <h2>📟 Engenharia de Telemetria</h2>
          {state.logs.length > 0 && (
            <button className="clear-logs-btn" onClick={actions.handleClear}>
              <Trash2 size={18} /> Limpar
            </button>
          )}
        </div>

        {state.logs.length > 0 && (
          <div className="smart-filters-container">
            {/* GRID DE FILTROS AQUI (usando state.filters e actions.setFilters) */}
            <div className="search-bar-row">
               {/* BARRA DE BUSCA UNIVERSAL */}
               <button className="apply-filters-btn" onClick={actions.handleApplyFilters} disabled={state.loading}>
                 <Search size={18} /> Buscar Logs
               </button>
            </div>
          </div>
        )}
      </header>

      <main className="main-content">
        {state.loading ? (
          <div className="loading-overlay-massive">
             <Cloud size={64} className="bounce-anim" />
             <h3>{state.progress.total > 0 ? `Processando ${state.progress.current}/${state.progress.total}` : 'Carregando...'}</h3>
          </div>
        ) : state.logs.length === 0 ? (
          <div 
            className={`upload-zone ${state.isDragging ? 'dragging' : ''}`} 
            onDragOver={(e) => { e.preventDefault(); actions.setIsDragging(true); }}
            onDragLeave={() => actions.setIsDragging(false)}
            onDrop={handleDrop}
          >
            <UploadCloud size={48} />
            <h3>Arraste seus pacotes de logs aqui</h3>
            <input type="file" multiple onChange={(e) => actions.handleProcessFiles(e.target.files)} className="file-input-hidden" id="log-upload" />
            <label htmlFor="log-upload" className="upload-btn">Selecionar Arquivos</label>
          </div>
        ) : (
          <div className="timeline-panel">
            {computed.groupedWorkflows.slice(0, 100).map(group => (
              <div key={group.id} className="workflow-card">
                 {/* RENDERIZAÇÃO DOS CARDS USANDO computed.groupedWorkflows */}
                 {/* onClick={() => actions.toggleCard(group.id)} */}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL / INSPECTOR */}
      {state.selectedLog && (
        <div className="ide-modal-overlay" onClick={() => actions.setSelectedLog(null)}>
           {/* CONTEÚDO DO MODAL USANDO computed.highlightData.html */}
        </div>
      )}
    </div>
  );
};

export default TelemetryAnalyzer;