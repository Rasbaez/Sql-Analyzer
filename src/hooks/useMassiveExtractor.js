import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { electronAPIService } from '../services/ElectronAPIService'; 

export const useMassiveExtractor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [removeScript, setRemoveScript] = useState('');
  const [error, setError] = useState(null);

  const cancelRef = useRef(false);

  const handleCancel = () => {
    cancelRef.current = true;
  };

  const processMassiveFile = async (file, companyId = '0546') => {
    setIsProcessing(true);
    setIsDone(false);
    setProgress(0);
    setResults([]);
    setRemoveScript('');
    setError(null);
    cancelRef.current = false; 

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null });

      if (!jsonData || jsonData.length === 0) {
        throw new Error("A planilha está vazia!");
      }

      const headerMatrix = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        range: 0,
        blankrows: false
      });

      const headerRow = headerMatrix && headerMatrix[0] ? headerMatrix[0] : [];
      const colunasLidas = headerRow.filter(Boolean).join(', ');

      const normalize = (str) =>
        str ? str.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '') : '';

      const headerMap = {};
      headerRow.forEach((colName) => {
        const norm = normalize(colName);
        if (norm) headerMap[norm] = colName;
      });

      const findCol = (...aliases) => {
        for (var i = 0; i < aliases.length; i++) {
          const normAlias = normalize(aliases[i]);
          if (normAlias && headerMap[normAlias]) {
            return headerMap[normAlias];
          }
        }
        return null;
      };

      // Identifica os nomes REAIS das colunas no arquivo
      const realColSerie = findCol('cSerie', 'serie', 'Serie');
      const realColBranch = findCol('cIDBranchinvoice', 'cdv', 'CDV', 'filial');
      const realColInvoice = findCol('cIDInvoice', 'nfe', 'Nfe', 'nf', 'nota');

      if (!realColSerie || !realColBranch || !realColInvoice) {
        throw new Error(
          'Não foi possível identificar as colunas obrigatórias.\n' +
          'Colunas lidas: [ ' + colunasLidas + ' ]'
        );
      }

      // 2. Mapeia usando os nomes de colunas IDENTIFICADOS dinamicamente
      const mappedInput = jsonData.map(row => {
        // Função interna para limpar sujeira (' , " etc)
        const clean = (val) => val ? String(val).replace(/['",]/g, '').trim() : null;

        // Pega o dado usando o nome real da coluna descoberto pelo findCol
        const rawNota = row[realColInvoice];
        const rawCdv = row[realColBranch];
        const rawSerie = row[realColSerie];

        const cleanNota = clean(rawNota);
        const cleanCdv = clean(rawCdv);
        const cleanSerie = clean(rawSerie);

        return {
          cSerie: cleanSerie ? cleanSerie.padStart(3, '0') : null,
          cidbranchinvoice: cleanCdv,
          cidinvoice: cleanNota
        };
      }).filter(item => item.cidinvoice && item.cSerie && item.cidbranchinvoice);

      const totalRows = mappedInput.length;
      let accumulatedResults = [];
      let accumulatedRemoveQueries = [];

      for (let i = 0; i < totalRows; i += 100) {
        if (cancelRef.current) {
          setError('🛑 Processamento interrompido.');
          break; 
        }

        const chunk = mappedInput.slice(i, i + 100);
        const queryArray = chunk.map(item => ({
          $and: [
            { cIDCompany: companyId },
            { cSerie: item.cSerie },
            { cIDBranchInvoice: item.cidbranchinvoice },
            { cIDInvoice: item.cidinvoice }
          ]
        }));

        const scriptStrings = chunk.map(item => 
          `\n{ $and: [{ cIDCompany: '${companyId}', cSerie:'${item.cSerie}', cIDBranchInvoice:'${item.cidbranchinvoice}' }, { cIDInvoice:'${item.cidinvoice}' } ] }`
        );

        accumulatedRemoveQueries.push(...scriptStrings);

        const mongoConfig = {
          server: localStorage.getItem('mongo_server'),
          database: localStorage.getItem('mongo_db') || 'MDB_PEPSICO_BR',
          user: localStorage.getItem('mongo_user'),
          password: localStorage.getItem('mongo_pass')
        };

        const res = await electronAPIService.getMassiveMongoInvoices(mongoConfig, queryArray, 'InvoiceSapExport');

        if (res && res.success && res.data) {
          const mappedChunk = res.data.map(nf => ({
            cIDInvoice: nf.cIDInvoice || 'N/A',
            cIDBranchInvoice: nf.cIDBranchInvoice || 'N/A',
            cSerie: nf.cSerie || 'N/A',
            TIMESTAMP: nf.mc1LastUpdate ? new Date(nf.mc1LastUpdate).toISOString() : 'N/A',
            MUID: nf.cMessageUniqueID || 'N/A'
          }));
          
          accumulatedResults = accumulatedResults.concat(mappedChunk);
          setResults([...accumulatedResults]);
        }

        setProgress(Math.round(((i + chunk.length) / totalRows) * 100));
      }

      setRemoveScript('db.InvoiceSapExport.remove( { $or: [ ' + accumulatedRemoveQueries.join(',') + '\n] } )');

    } catch (err) {
      console.error(err);
      setError(err?.message || 'Erro ao processar arquivo.');
    } finally {
      setIsProcessing(false);
      setIsDone(true); 
    }
  };

  const downloadResultsCSV = () => {
    if (!results.length) return alert('Sem dados.');
    const header = 'Nfe;CDV;Serie;TimeStamp;MUID\n';
    const rows = results.map(nf => [nf.cIDInvoice, nf.cIDBranchInvoice, nf.cSerie, nf.TIMESTAMP, nf.MUID].join(';')).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Extracao_Massiva_${Date.now()}.csv`;
    a.click();
  };

  const downloadRemoveScript = () => {
    const blob = new Blob([removeScript], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `nfsMassiveRemove_${Date.now()}.txt`;
    a.click();
  };

  return { isProcessing, isDone, progress, results, removeScript, error, processMassiveFile, handleCancel, downloadResultsCSV, downloadRemoveScript };
};