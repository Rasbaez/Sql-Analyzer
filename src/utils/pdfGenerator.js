export const exportarRelatorioPDF = async (response, tabelas, affectedRows, checklist) => {
    // 1. Remove laudo anterior da memória se existir
    let printDiv = document.getElementById('print-only-report');
    if (printDiv) printDiv.remove();

    // 2. Cria o container do Laudo
    printDiv = document.createElement('div');
    printDiv.id = 'print-only-report';

    // 3. Monta as Tabelas de Parâmetros
    const buildTable = (title, data) => {
        if (!data || Object.keys(data).length === 0) return '';
        let rows = Object.entries(data).map(([k, v]) => {
            let valorRenderizado = v;
            if (typeof v === 'object' && v !== null) {
                valorRenderizado = v.tipo === 'SUBQUERY' ? v.valorOriginal : (v.tipo === 'LIST' ? v.valor : JSON.stringify(v));
            }
            return `<tr><td class="col-key">${k}</td><td class="col-val">${valorRenderizado}</td></tr>`;
        }).join('');

        return `
            <div class="pdf-table-container">
                <h4 class="pdf-table-title">${title}</h4>
                <table class="pdf-table">
                    <thead><tr><th>Coluna</th><th>Valor Detectado</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    };

    let paramsHtml = '';
    if (tabelas.deleteFields) paramsHtml += buildTable('🗑️ Parâmetros de DELETE', tabelas.deleteFields);
    if (tabelas.insertFields) paramsHtml += buildTable('📥 Parâmetros de INSERT', tabelas.insertFields);
    if (tabelas.updateFields) paramsHtml += buildTable('📝 Parâmetros de UPDATE (SET)', tabelas.updateFields);
    if (tabelas.whereFields) paramsHtml += buildTable('🎯 Parâmetros de WHERE (Filtros)', tabelas.whereFields);

    // 4. Lógica de Impacto
    const impactoHtml = (affectedRows !== null && affectedRows !== undefined)
        ? `<div class="pdf-box impact-known">
             <strong>🎯 Impacto Estimado:</strong> Exatamente <strong>${affectedRows}</strong> registro(s) serão afetados no banco de dados.
           </div>`
        : `<div class="pdf-box impact-unknown">
             <strong>⚠️ Impacto Desconhecido:</strong> O teste de impacto não foi validado no banco antes da geração deste laudo.
           </div>`;

    // 5. Checklist do Analista
    const checks = checklist || { syntaxOk: false, tableOk: false, whereOk: false };
    const checklistHtml = `
        <div class="pdf-checklist">
            <h3>📋 Termo de Validação Manual (Analista)</h3>
            <ul>
                <li><strong>${checks.syntaxOk ? '[ ✔ ]' : '[ ✖ ]'}</strong> Sintaxe e Regras de Negócio avaliadas.</li>
                <li><strong>${checks.tableOk ? '[ ✔ ]' : '[ ✖ ]'}</strong> Tabela de impacto confirmada.</li>
                <li><strong>${checks.whereOk ? '[ ✔ ]' : '[ ✖ ]'}</strong> Filtros (WHERE) checados e aprovados.</li>
            </ul>
        </div>
    `;

    // 6. Relatório da IA (NOVIDADE!)
    const auditReportHtml = response.auditReport ? `
        <div class="pdf-ai-report">
            <h3>🤖 Relatório de Auditoria da IA (Gemini)</h3>
            <p>${response.auditReport.replace(/\n/g, '<br/>')}</p>
        </div>
    ` : '';

    // 7. Status
    const isApproved = !(response.warnings && response.warnings.some(w => w.includes('🚨')));
    const statusHtml = isApproved 
        ? '<span class="badge badge-success">✅ APROVADO</span>' 
        : '<span class="badge badge-danger">❌ REPROVADO (Avisos Críticos)</span>';

    // 8. O "Coração" do Estilo (CSS Exclusivo para o PDF)
    const pdfStyles = `
        <style>
            @media screen {
                #print-only-report { display: none; }
            }
            @media print {
                body * { visibility: hidden; }
                #print-only-report, #print-only-report * { visibility: visible; }
                #print-only-report { 
                    position: absolute; left: 0; top: 0; width: 100%; 
                    font-family: 'Segoe UI', Arial, sans-serif; 
                    color: #1e293b; padding: 20px; box-sizing: border-box;
                }
                .pdf-header { border-bottom: 3px solid #0ea5e9; padding-bottom: 15px; margin-bottom: 25px; }
                .pdf-header h1 { margin: 0; color: #0f172a; font-size: 24px; text-transform: uppercase; letter-spacing: 1px; }
                .pdf-meta { font-size: 14px; color: #64748b; margin-top: 5px; display: flex; justify-content: space-between; }
                
                .badge { padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 14px; }
                .badge-success { background: #dcfce7; color: #166534; border: 1px solid #166534; }
                .badge-danger { background: #fee2e2; color: #991b1b; border: 1px solid #991b1b; }

                .pdf-ai-report { background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 15px; margin-bottom: 20px; border-radius: 0 8px 8px 0; }
                .pdf-ai-report h3 { margin: 0 0 10px 0; color: #0369a1; font-size: 16px; }
                .pdf-ai-report p { margin: 0; font-size: 14px; color: #334155; }

                .pdf-checklist { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                .pdf-checklist h3 { margin: 0 0 10px 0; font-size: 16px; color: #334155; }
                .pdf-checklist ul { list-style: none; padding: 0; margin: 0; font-size: 14px; line-height: 1.6; }

                .pdf-section-title { font-size: 16px; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; margin-top: 25px; margin-bottom: 15px; }
                
                .pdf-code { background: #f1f5f9; padding: 15px; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 12px; white-space: pre-wrap; border: 1px solid #e2e8f0; color: #0f172a;}
                
                .pdf-box { padding: 12px; border-radius: 6px; font-size: 14px; margin-bottom: 20px; }
                .impact-known { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
                .impact-unknown { background: #fef9c3; color: #854d0e; border: 1px solid #fde047; }

                .pdf-table-container { margin-bottom: 15px; page-break-inside: avoid; }
                .pdf-table-title { margin: 0 0 8px 0; font-size: 14px; color: #475569; }
                .pdf-table { width: 100%; border-collapse: collapse; font-size: 12px; }
                .pdf-table th { background: #e2e8f0; padding: 8px; text-align: left; border: 1px solid #cbd5e1; }
                .pdf-table td { padding: 8px; border: 1px solid #cbd5e1; }
                .col-key { font-weight: bold; color: #0369a1; width: 30%; }
                
                .pdf-footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
            }
        </style>
    `;

    // 9. Injeta HTML Final
    printDiv.innerHTML = `
        ${pdfStyles}
        <div class="pdf-header">
            <h1>Laudo de Auditoria SQL</h1>
            <div class="pdf-meta">
                <span><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</span>
                <span>${statusHtml}</span>
            </div>
        </div>

        ${auditReportHtml}
        ${checklistHtml}

        <h3 class="pdf-section-title">💎 Script SQL Principal (Higienizado)</h3>
        <pre class="pdf-code">${response.autoFix.fixed}</pre>

        <h3 class="pdf-section-title">🔍 Script de Teste de Impacto (SELECT)</h3>
        <pre class="pdf-code">${response.selectPreview || '-- Não gerado.'}</pre>

        ${impactoHtml}

        <h3 class="pdf-section-title">📊 Mapeamento de Parâmetros</h3>
        ${paramsHtml || '<p style="font-size: 12px; color: #64748b;">Nenhum parâmetro mapeado pela IA.</p>'}
        
        <div class="pdf-footer">
            <p><strong>MC1 Enterprise Analyzer - Compliance & Confiabilidade</strong></p>
            <p>Desenvolvido por Roberto Baez 🚀</p>
        </div>
    `;

    document.body.appendChild(printDiv);

    // 10. Chama a impressão
    try {
        if (window.electronAPI && window.electronAPI.generatePDF) {
            await window.electronAPI.generatePDF();
        } else if (window.electronAPI && window.electronAPI.generatePdf) {
            await window.electronAPI.generatePdf();
        } else {
            window.print();
        }
    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
    }
};