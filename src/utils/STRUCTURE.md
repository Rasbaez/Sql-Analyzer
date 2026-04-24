# 📁 Utils - Estrutura Reorganizada

## Objetivo
Organizar funções utilitárias por responsabilidade, melhorando legibilidade, manutenção e reutilização de código.

## Estrutura

```
utils/
├── sql/                    # Processamento e validação SQL
│   ├── sqlProcessor.js     # Parse e extração de parâmetros
│   ├── schemaRules.js      # Validações de negócio
│   └── index.js            # Re-exports
│
├── data/                   # Transformação e formatação de dados
│   ├── dataFormatter.ts    # Formatação de valores
│   ├── telemetryHelpers.js # Helpers de telemetria
│   └── index.js            # Re-exports
│
├── export/                 # Geração e exportação de documentos
│   ├── pdfGenerator.js     # Geração de PDFs
│   └── index.js            # Re-exports
│
├── services/               # Parsing de arquivos e serviços complexos
│   ├── logParserService.js # Parse de logs
│   ├── nfParserService.js  # Parse de Notas Fiscais
│   └── index.js            # Re-exports
│
├── helpers/                # Funções auxiliares gerais
│   ├── errorTranslator.js  # Tradução de erros
│   ├── connectionUtils.js  # Utilitários de conexão
│   └── index.js            # Re-exports
│
└── STRUCTURE.md            # Este arquivo
```

## Guia de Uso

### Importação Direta (Específica)
```javascript
import { processSqlData } from '../utils/sql/sqlProcessor';
import { validarConteudoNegocio } from '../utils/sql/schemaRules';
```

### Importação via Index (Recomendado)
```javascript
import { processSqlData, validarConteudoNegocio } from '../utils/sql';
import { formatSqlValue } from '../utils/data';
import { exportarRelatorioPDF } from '../utils/export';
```

## Categorias

### 🔤 `sql/` - SQL Processing
- **Responsabilidade**: Parse, validação e processamento de queries SQL
- **Inclui**: 
  - Extração de parâmetros
  - Validação de sintaxe
  - Regras de negócio SQL
  
### 📊 `data/` - Data Transformation
- **Responsabilidade**: Formatação, conversão e transformação de dados
- **Inclui**:
  - Formatadores de valores (dates, currency, etc)
  - Helpers de telemetria
  - Conversores de tipos

### 📄 `export/` - Document Generation
- **Responsabilidade**: Geração e exportação de documentos
- **Inclui**:
  - PDF generation
  - CSV export (futuro)
  - Excel export (futuro)

### ⚙️ `services/` - Complex Services
- **Responsabilidade**: Lógica complexa de parsing e processamento
- **Inclui**:
  - Parse de arquivos (XML, TXT, PDF)
  - Integração com serviços externos
  - Processamento de dados estruturados

### 🛠️ `helpers/` - General Utilities
- **Responsabilidade**: Funções auxiliares genéricas
- **Inclui**:
  - Tradução de mensagens de erro
  - Utilitários de conexão
  - Funções de conveniência

## Exemplos de Refatoração

### Antes
```javascript
import { processSqlData } from '../utils/sqlProcessor';
import { validarConteudoNegocio } from '../utils/schemaRules';
import { formatSqlValue } from '../utils/dataFormatter';
import { exportarRelatorioPDF } from '../utils/pdfGenerator';
import { parseLog } from '../utils/logParserService';
```

### Depois (Limpo)
```javascript
import { processSqlData, validarConteudoNegocio } from '../utils/sql';
import { formatSqlValue } from '../utils/data';
import { exportarRelatorioPDF } from '../utils/export';
import { parseLog } from '../utils/services';
```

## Adição de Novos Utilitários

1. **Determine a categoria** do novo utilitário
2. **Crie o arquivo** na subpasta apropriada
3. **Exporte** o arquivo em `index.js` da pasta
4. **Documente** em um comentário JSDoc

Exemplo:
```javascript
// src/utils/sql/myNewUtil.js
/**
 * Descrição da função
 * @param {type} param - Descrição
 * @returns {type} Retorno
 */
export const myFunction = (param) => {
  // Implementação
};
```

## Notas
- Cada subpasta tem um `index.js` que re-exporta seus módulos
- Isso permite importações limpas e evita paths profundos
- Manutenção futura é mais fácil com estrutura clara
