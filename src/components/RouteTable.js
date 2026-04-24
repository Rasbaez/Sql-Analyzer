// 🛒 src/components/RouteTable.js - Componente isolado para as tabelas
import React from 'react';
import { ShoppingCart, TextSearch, Database } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDate } from '../utils/data';

const RouteTables = ({ routeData, isPVV, itemVariants, onVerMuid, isMuidLoading }) => {
  // Verifica se tem dados para renderizar
  const hasPedidos = isPVV && routeData?.listaPedidos && routeData.listaPedidos.length > 0;
  const hasNotas = !isPVV && routeData?.listaNotas && routeData.listaNotas.length > 0;

  // Se não tiver nem pedido nem nota, não renderiza nada
  if (!hasPedidos && !hasNotas) return null;

  return (
    <>
      {/* 🛒 TABELA DE PEDIDOS (PVV) */}
      {hasPedidos && (
        <motion.div className="bi-table-panel card-white" variants={itemVariants}>
          <div className="table-header-title">
            <h3>
              <ShoppingCart size={20} strokeWidth={1.5} color="#0284c7" style={{marginRight: '8px', verticalAlign: 'middle'}} /> 
              Pedidos PVV (Hoje)
            </h3>
            <span className="badge">{routeData.listaPedidos.length} Registros</span>
          </div>
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Pedido</th>
                  <th>Tipo</th>
                  <th>Cliente</th>
                  <th>Exportação</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {routeData.listaPedidos.map((p, index) => {
                  const isExp = p.dExport != null;
                  const isFin = p.StatusPedido === 'Finalizado';
                  const badgeClass = isFin ? 'badge-success' : (p.StatusPedido === 'Cancelado' ? 'badge-danger' : 'badge-info');

                  return (
                    <tr key={index}>
                      <td className="col-index">{index + 1}</td>
                      <td className="col-highlight">{p.cIDOrder}</td>
                      <td><span className="tag-serie tag-bg-light">{p.TipoPedido}</span></td>
                      <td className="col-customer">{p.cCustomerShortName || 'Desconhecido'}</td>
                      <td>{isExp ? <span className="text-success font-bold">✅ {formatDate(p.dExport)}</span> : <span className="text-danger font-bold">⏳ Pendente</span>}</td>
                      <td><span className={`status-badge ${badgeClass}`}>{p.StatusPedido}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* 📄 TABELA DE NOTAS FISCAIS (DTS/PRONTA ENTREGA) */}
      {hasNotas && (
        <motion.div className="bi-table-panel card-white" variants={itemVariants}>
          <div className="table-header-title">
            <h3>
              <TextSearch size={20} strokeWidth={1.5} color="#0284c7" style={{marginRight: '8px', verticalAlign: 'middle'}} /> 
              Notas Fiscais (Hoje)
            </h3>
            <span className="badge">{routeData.listaNotas.length} Registros</span>
          </div>
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Invoice</th>
                  <th>Série</th>
                  <th>Cliente</th>
                  <th>Fila (Queue)</th>
                  <th>Exportação</th>
                  <th>SEFAZ</th>
                  <th style={{ textAlign: 'center' }}>Ações</th> {/* 🔥 Coluna Nova */}
                </tr>
              </thead>
              <tbody>
                {routeData.listaNotas.map((n, index) => {
                  const stText = n.cInvoiceStatus || 'Sem Status';
                  const isAut = stText.includes('Autorizado');
                  const isCont = stText.includes('Contingência');
                  const badgeClass = isAut ? 'badge-success' : (isCont ? 'badge-warning' : 'badge-danger');

                  return (
                    <tr key={index}>
                      <td className="col-index">{index + 1}</td>
                      <td className="col-highlight">{n.cIDInvoice}</td>
                      <td><span className="tag-serie">{n.cSerie}</span></td>
                      <td className="col-customer">{n.cCustomerShortName}</td>
                      <td className="text-muted">{n.dQueue ? formatDate(n.dQueue) : '-'}</td>
                      <td>
                        {n.dQueue != null && n.dExport != null ? 
                          <span className="text-success font-bold">✅ {formatDate(n.dExport)}</span> : 
                          <span className="text-danger font-bold">⏳ Pendente</span>
                        }
                      </td>
                      <td><span className={`status-badge ${badgeClass}`}>{stText}</span></td>
                      
                      {/* 🔥 BOTÃO verMUID INTEGRADO */}
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          className="ver-muid-btn-table"
                          title="Consultar MUID no MongoDB"
                          disabled={isMuidLoading}
                          onClick={() => onVerMuid(n.cIDInvoice, n.cSerie, n.cidbranchinvoice || routeData.cidbranchinvoice)}
                        >
                          <Database size={12} style={{marginRight: '4px'}} />
                          {isMuidLoading ? '...' : 'verMUID'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default RouteTables;