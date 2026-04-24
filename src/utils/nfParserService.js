// 🧠 src/utils/nfParserService.js

export const parseNFLogs = async (files) => {
  let allBlocks = [];
  const uniqueInvoices = new Set();
  const uniqueOrders = new Set();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const text = await file.text();
    
    // ✂️ CORTA O ARQUIVO NO DELIMITADOR
    const rawBlocks = text.split(/<<<!!![-!]+!!!>>>/g);

    rawBlocks.forEach((blockContent, index) => {
      const content = blockContent.trim();
      if (content.length < 100) return; 

      // 🔍 PESCA AS INFORMAÇÕES BÁSICAS
      const timeMatch = content.match(/(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2})/);
      const orderMatch = content.match(/(?:Order saved|Order Number|Pedido)[:\s]+(\d+)/i);
      const payMatch = content.match(/(?:Selected Payment Type|Condição de Pagamento)[:\s]+([^\n]+)/i);

      const timestamp = timeMatch ? timeMatch[1] : 'Data Oculta';
      const orderId = orderMatch ? orderMatch[1] : 'Pendente/Falha';
      const payment = payMatch ? payMatch[1].trim() : 'Não registrado';
      const isB2B = /Updating status for digital order BEES/i.test(content);

      // 🔥 1. A MÁGICA DA CLONAGEM (Regex BLINDADO contra BranchInvoice)
      const allInvoiceMatches = [...content.matchAll(/(?:Invoice Number|NumeroNF|\bInvoice\b)[:\s]+(\d+)/ig)];
      let uniqueInvoicesInBlock = [...new Set(allInvoiceMatches.map(m => m[1].replace(/^0+/, '')))];

      if (uniqueInvoicesInBlock.length === 0) {
         uniqueInvoicesInBlock = ['Pendente/Falha'];
      }

      // 🔥 2. MÁQUINA DE STATUS
      let baseStatus = 'ERROR'; 
      let isCancelled = false;
      let cancellationStatus = '';
      let isEdit = false;

      // 🚨 REGRAS DE CANCELAMENTO E EDIÇÃO
      const cancelSuccessMatch = content.match(/status:\s*(Cancelamento de NF-e homologado)/i) || 
                                 content.match(/Cancelling response:\s*(.*)/i);
      
      const isEditMatch = /Starting NFe Edit for Invoice/i.test(content);

      if (isEditMatch) {
         baseStatus = 'EDITING';
         isEdit = true;
         isCancelled = true; 
         cancellationStatus = 'Edição Solicitada (A NF original será cancelada)';
      }
      else if (cancelSuccessMatch) {
         baseStatus = 'CANCELLED';
         isCancelled = true;
         cancellationStatus = cancelSuccessMatch[1].trim(); 
      } 
      else if (/Processing NFe cancellation/i.test(content)) {
         baseStatus = 'CANCELLING'; 
         isCancelled = true;
         cancellationStatus = 'Cancelamento Solicitado...';
      }
      else if (/Invoice Cancel Status for Edit:\s*Cancelled/i.test(content)) {
         baseStatus = 'CANCELLED_EDIT';
         isCancelled = true;
         cancellationStatus = 'Cancelada para Edição (Edit Mode)';
      }
      // REGRAS ORIGINAIS
      else if (/conting[êe]ncia com sucesso/i.test(content) || /sending invoice in contingency/i.test(content)) {
         baseStatus = 'CONTINGENCY';
      } 
      else if (/autorizado/i.test(content)) {
         baseStatus = 'SUCCESS';
      }
      else if (/autoriza[çc][ãa]o solicitada/i.test(content)) {
         baseStatus = 'INACTIVE';
      }

      // 🔥 3. PROCESSA CADA NOTA ÚNICA ENCONTRADA
      uniqueInvoicesInBlock.forEach((invId, idx) => {
         let finalStatus = baseStatus;

         if (uniqueInvoicesInBlock.length > 1 && idx < uniqueInvoicesInBlock.length - 1) {
             finalStatus = 'INACTIVE';
         }

         if (invId !== 'Pendente/Falha') uniqueInvoices.add(invId);
         if (orderId !== 'Pendente/Falha') uniqueOrders.add(orderId);

         if (orderId !== 'Pendente/Falha' || invId !== 'Pendente/Falha' || isCancelled || isEdit || content.includes('cIDCompany')) {
           allBlocks.push({
             id: `nf-${i}-${index}-${idx}`,
             timestamp,
             invoiceId: invId,
             orderId,
             payment,
             isB2B,
             status: finalStatus, 
             isCancelled,         
             isEdit,              
             cancellationStatus,  
             rawDetails: content, 
             fileName: file.name
           });
         }
      });

    });
  }

  return {
    logs: allBlocks,
    meta: {
      invoices: Array.from(uniqueInvoices).sort(),
      orders: Array.from(uniqueOrders).sort()
    }
  };
};