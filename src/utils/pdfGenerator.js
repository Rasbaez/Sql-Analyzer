export const exportarRelatorioPDF = async (response, tabelas, affectedRows, checklist) => {
    // 1. Remove laudo anterior da memória se existir
    let printDiv = document.getElementById('print-only-report');
    if (printDiv) printDiv.remove();

    // 2. Cria o container do Laudo (invisível na tela, visível no PDF)
    printDiv = document.createElement('div');
    printDiv.id = 'print-only-report';

    // 3. Função auxiliar para desenhar as tabelas de parâmetros
    const buildTable = (title, data) => {
        if (!data || Object.keys(data).length === 0) return '';
        
        let rows = Object.entries(data).map(([k, v]) => {
            let valorRenderizado = v;
            if (typeof v === 'object' && v !== null) {
                valorRenderizado = v.tipo === 'SUBQUERY' ? v.valorOriginal : (v.tipo === 'LIST' ? v.valor : JSON.stringify(v));
            }
            return `<tr><td><strong>${k}</strong></td><td>${valorRenderizado}</td></tr>`;
        }).join('');

        return `
            <h3 class="report-section-title">${title}</h3>
            <table class="report-table">
                <thead><tr><th>Coluna</th><th>Valor Detectado</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    };

    let paramsHtml = '';
    if (tabelas.deleteFields) paramsHtml += buildTable('🗑️ Parâmetros de DELETE', tabelas.deleteFields);
    if (tabelas.insertFields) paramsHtml += buildTable('📥 Parâmetros de INSERT', tabelas.insertFields);
    if (tabelas.updateFields) paramsHtml += buildTable('📝 Parâmetros de UPDATE (SET)', tabelas.updateFields);
    if (tabelas.whereFields) paramsHtml += buildTable('🎯 Parâmetros de WHERE (Filtros)', tabelas.whereFields);

    // 4. Lógica Inteligente do Impacto (Agora 100% via CSS classes)
    let impactoHtml = '';
    if (affectedRows !== null && affectedRows !== undefined) {
        impactoHtml = `
            <div class="report-impact-box impact-known">
                <h3 class="report-impact-title">🎯 Impacto Estimado no Banco</h3>
                <p class="report-impact-text">
                    A validação indicou que exatamente <strong>${affectedRows}</strong> registro(s) serão afetados por esta instrução.
                </p>
            </div>`;
    } else {
        impactoHtml = `
            <div class="report-impact-box impact-unknown">
                <h3 class="report-impact-title">⚠️ Impacto Desconhecido</h3>
                <p class="report-impact-text">
                    O Select de validação não foi executado pelo usuário antes da geração deste laudo. Impacto de linhas não mensurado.
                </p>
            </div>`;
    }

    // 🔥 4.5 LÓGICA DO CHECKLIST (NO LUGAR CERTO)
    const checks = checklist || { syntaxOk: false, tableOk: false, whereOk: false };

    const checklistHtml = `
        <div style="background-color: #f8fafc; border-left: 4px solid #0284c7; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 class="report-section-title" style="margin-top: 0; color: #0f172a;">📋 Termo de Validação do Analista</h3>
            <ul style="list-style-type: none; padding-left: 0; margin: 0; font-size: 14px; color: #334155; line-height: 1.8;">
                <li><strong>${checks.syntaxOk ? '[ SIM ]' : '[ NÃO ]'}</strong> Eu validei a sintaxe e as regras de negócio da query.</li>
                <li><strong>${checks.tableOk ? '[ SIM ]' : '[ NÃO ]'}</strong> Confirmei que a TABELA de impacto está correta.</li>
                <li><strong>${checks.whereOk ? '[ SIM ]' : '[ NÃO ]'}</strong> Validei os filtros do WHERE (Impacto de registros).</li>
            </ul>
        </div>
    `;

    // 5. Verifica se há erros críticos
    const isApproved = !(response.warnings && response.warnings.some(w => w.includes('🚨')));
    const statusHtml = isApproved 
        ? '<span class="status-approved">✅ APROVADO (Sintaxe Validada)</span>' 
        : '<span class="status-rejected">❌ REPROVADO (Contém Erros Críticos)</span>';

    // 6. Monta o HTML Final do Laudo
    printDiv.innerHTML = `
        <h1 class="report-main-title">Laudo de Validação SQL</h1>
        
        <div class="report-header-info">
            <p><strong>Data da Emissão:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            <p><strong>Status da Sintaxe:</strong> ${statusHtml}</p>
        </div>

        ${checklistHtml}

        <h3 class="report-section-title">💎 Comando SQL Principal (Padronizado)</h3>
        <pre class="report-query-block">${response.autoFix.fixed}</pre>

        <h3 class="report-section-title">🔍 Select de Validação (Apoio DBA)</h3>
        <pre class="report-query-block query-preview-block">${response.selectPreview || '-- O motor não gerou um select para esta instrução.'}</pre>

        ${impactoHtml}

        <div class="report-params-container">
            ${paramsHtml}
        </div>
        
        <div class="report-footer">
            <p class="report-footer-title">MC1 SQL Analyzer - Edição PepsiCo</p>
            <p class="report-footer-text">Engenharia de Dados & Confiabilidade</p>
            <p class="report-footer-dev">
                Desenvolvido por <strong>Roberto Baez</strong> 🚀
            </p>
        </div>
    `;

    document.body.appendChild(printDiv);

    // 7. Dispara o salvamento do PDF via Electron
    try {
        if (window.electronAPI && window.electronAPI.generatePDF) {
            await window.electronAPI.generatePDF();
        } else if (window.electronAPI && window.electronAPI.generatePdf) {
            await window.electronAPI.generatePdf();
        } else {
            window.print(); // Fallback pro navegador padrão
        }
    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
    }
};