// 🧠 src/utils/logParserService.js

export const parseLogFiles = async (files) => {
  let allEvents = [];
  
  const uniqueFiles = new Set();
  const uniqueForms = new Set();
  const uniqueWorkflows = new Set();
  const uniqueDataSources = new Set(); 

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    uniqueFiles.add(file.name);
    const text = await file.text();
    
    // Corta o texto pelo timestamp
    const logBlocks = text.split(/(?=\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\])/g);

    let currentForm = 'N/A';
    let currentDataSource = 'Query Avulsa';
    
    // 🔥 O SEGREDO DO SUCESSO: Memória de Curto Prazo!
    let lastWorkflowName = 'Tarefas de Background / Avulsas'; 

    logBlocks.forEach(block => {
      if (block.trim() === '') return;

      const timeMatch = block.match(/\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3})\]/);
      if (!timeMatch) return;
      
      const timestamp = timeMatch[1];
      const levelMatch = block.match(/\]\[(INFO|DEBUG|WARN|ERROR|FATAL)\]/);
      const level = levelMatch ? levelMatch[1] : 'INFO';
      const idLogBase = Math.random().toString(36).substr(2, 9);

      const formMatch = block.match(/cFormName=(.*?)$/m) || block.match(/Form:\s*([^\s]+)/);
      if (formMatch) currentForm = formMatch[1].trim();

      const pushEvent = (eventData) => {
        const hasInfo = 
          (eventData.workflowName && eventData.workflowName !== 'N/A') || 
          (eventData.variables && eventData.variables.length > 0) ||
          (eventData.rawDetails && eventData.rawDetails.trim().length > 10); 

        if (!hasInfo) return;

        if (eventData.formName && eventData.formName !== 'N/A' && eventData.formName !== 'System') {
          uniqueForms.add(eventData.formName);
        }
        if (eventData.workflowName && eventData.workflowName !== 'N/A' && eventData.workflowName !== 'Tarefas de Background / Avulsas') {
          uniqueWorkflows.add(eventData.workflowName);
        }
        
        // 🧠 A cada evento salvo, ele atualiza a memória para "costurar" eventos órfãos!
        lastWorkflowName = eventData.workflowName;

        allEvents.push(eventData);
      };

      // 🚨 1. Erros Críticos (Agora ficam DENTRO do fluxo que quebrou)
      if (level === 'ERROR' || level === 'FATAL') {
        return pushEvent({ id: idLogBase, fileName: file.name, timestamp, level, eventType: 'Crash/Erro Crítico', formName: currentForm, workflowName: lastWorkflowName, elapsedTime: null, variables: [], rawDetails: block });
      }

      // 🗄️ 2. BANCO DE DADOS 
      const dsMatch = block.match(/DataSource = (.*?),/);
      if (dsMatch) {
        currentDataSource = dsMatch[1].trim();
      }

      const isQuery = /\]\s*(?:\[.*?\]\s*)?(SELECT|INSERT|UPDATE|DELETE|WITH|CREATE|PRAGMA|COMMIT|BEGIN)\b/i.test(block);

      if (isQuery || dsMatch) {
        const elMatch = block.match(/Elapsed: (\d+) ms/);
        const cleanSql = block.replace(/\[\d{4}.*?\](?:\[.*?\])*\s*(?:\[.*?\])?/g, '').trim();
        
        const dsName = dsMatch ? dsMatch[1].trim() : currentDataSource;
        if (dsName && dsName !== 'Query Avulsa') {
          uniqueDataSources.add(dsName); 
        }

        const eventType = dsMatch && !isQuery ? 'Database Result' : 'Database Query';

        return pushEvent({
          id: idLogBase, 
          fileName: file.name, 
          timestamp, 
          level, 
          eventType: eventType, 
          formName: currentForm, 
          workflowName: dsName, 
          elapsedTime: elMatch ? parseInt(elMatch[1]) : null, 
          variables: [], 
          rawDetails: cleanSql || block
        });
      }

      // 🔥 3. TRIGGERS E EVENTOS GERAIS DO APP
      if (block.includes('Event fired:')) {
        const evMatch = block.match(/Event fired: (.*)/);
        return pushEvent({ id: idLogBase, fileName: file.name, timestamp, level, eventType: 'Event Fired', formName: currentForm, workflowName: evMatch ? evMatch[1].trim() : lastWorkflowName, elapsedTime: null, variables: [], rawDetails: block });
      }

      // Quando o Workflow finaliza, nós quebramos o elo de memória para não vazar pro próximo evento
      if (block.includes('Finished workflow of event')) {
         const evMatch = block.match(/Finished workflow of event (.*)/);
         pushEvent({ id: idLogBase, fileName: file.name, timestamp, level, eventType: 'Workflow:Finished', formName: currentForm, workflowName: evMatch ? evMatch[1].trim() : lastWorkflowName, elapsedTime: null, variables: [], rawDetails: block });
         lastWorkflowName = 'Tarefas de Background / Avulsas'; // Reseta o contexto
         return;
      }

      if (block.includes('Executing workflow of event')) {
         const evMatch = block.match(/Executing workflow of event (.*)/);
         return pushEvent({ id: idLogBase, fileName: file.name, timestamp, level, eventType: 'Executing Event', formName: currentForm, workflowName: evMatch ? evMatch[1].trim() : lastWorkflowName, elapsedTime: null, variables: [], rawDetails: block });
      }

      // 🧩 4. JSONs ESTRUTURADOS (Agora com adoção de fluxo!)
      if (block.includes('LogEvent {')) {
        const idLogMatch = block.match(/cIDLog=(.*)/);
        const eventNameMatch = block.match(/cEventName=(.*)/);
        const formNameMatch = block.match(/cFormName=(.*)/);
        
        let parsedContent = {};
        let rawJsonData = '';
        const contentIndex = block.indexOf('cContent=');
        
        if (contentIndex !== -1) {
          let rawJson = block.substring(contentIndex + 9).trim();
          if (rawJson.endsWith('}')) rawJson = rawJson.substring(0, rawJson.lastIndexOf('}')).trim();
          rawJsonData = rawJson;
          try { parsedContent = JSON.parse(rawJson); } catch (e) {}
        }

        const eventType = eventNameMatch ? eventNameMatch[1].trim() : 'Log System';
        
        // 🔥 A MÁGICA: Se não houver nome no JSON, ele herda o `lastWorkflowName` (Ex: a Query que acabou de rodar)
        const wfNameFromJson = parsedContent.name || parsedContent.workflow || parsedContent.datasource;
        const workflowName = wfNameFromJson || lastWorkflowName;

        let extractedVariables = parsedContent.controls || [];

        if (parsedContent.targets) {
          Object.keys(parsedContent.targets).forEach(key => {
            const tgt = parsedContent.targets[key];
            extractedVariables.push({ target: tgt.target || key, value: tgt.value });
          });
        }

        if (parsedContent.parameters) {
          Object.keys(parsedContent.parameters).forEach(key => {
            const prm = parsedContent.parameters[key];
            extractedVariables.push({ target: `Param: ${key}`, value: prm.value || prm.src || 'Vazio' });
          });
        }

        let finalEventType = eventType;
        let finalRawDetails = rawJsonData || block;

        if (parsedContent.query) {
           finalEventType = 'Database Query'; 
           finalRawDetails = parsedContent.query; 
        }

        return pushEvent({
          id: idLogMatch ? idLogMatch[1].trim() : idLogBase,
          fileName: file.name, 
          timestamp, 
          level,
          eventType: finalEventType, 
          formName: formNameMatch ? formNameMatch[1].trim() : currentForm, 
          workflowName: workflowName, 
          elapsedTime: parsedContent.elapsedTime !== undefined ? parsedContent.elapsedTime : null,
          variables: extractedVariables, 
          rawDetails: finalRawDetails
        });
      }
    });

    await new Promise(resolve => setTimeout(resolve, 20));
  }

  allEvents.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  return {
    logs: allEvents,
    meta: {
      files: Array.from(uniqueFiles).sort(),
      forms: Array.from(uniqueForms).sort(),
      workflows: Array.from(uniqueWorkflows).sort(),
      dataSources: Array.from(uniqueDataSources).sort()
    }
  };
};