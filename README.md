
# 🚀  SQL & Mongo Analyzer - Enterprise Edition

O SQL & Mongo Analyzer é uma ferramenta de desktop de alta performance construída com Electron e React, desenhada para ser a "War Room" de analistas de suporte, DBAs e equipas de Hypercare. O foco principal é a governança de dados, garantindo que modificações em massa em ambientes produtivos (SQL Server e MongoDB) sejam auditadas, corrigidas e documentadas antes de qualquer execução.

## ✨ Principais Funcionalidades

🛡️ Auditoria de Compliance & Prevenção de Desastres
AI-Powered SQL Refinement: Mecanismo rigoroso que intercepta e realiza o parsing de queries UPDATE e DELETE. A IA não apenas valida a sintaxe, mas corrige automaticamente operadores em falta, formata identificadores e garante o padrão CamelCase da empresa.

Regras de Negócio PepsiCo: Auditoria nativa de campos críticos como mc1enabled (apenas 0 ou 1), integridade de IDs não-nulos e dicionário de regionalização para cIDCompany (LATAM).

Prevenção de Execuções Órfãs: Bloqueio automático de qualquer instrução sem a cláusula WHERE, eliminando o risco de atualizações acidentais em massa.


📊 RouteAnalyzer — Dashboard de Telemetria e BI
O RouteAnalyzer é o "Coração" e a "War Room" da aplicação. Ele foi desenvolvido para centralizar diagnósticos complexos de logística, permitindo que um analista entenda a saúde de uma rota em segundos, cruzando dados de infraestruturas completamente diferentes.

✨ Funcionalidades Principais
🔗 Integração Híbrida (SQL + NoSQL): O módulo realiza o cruzamento dinâmico entre dados mestres de servidores SQL Server e logs de telemetria/fechamentos (EOD) armazenados em MongoDB, utilizando o cMessageUniqueID como ponte.

🎭 Status Overlay System: A interface é viva! Através de um sistema de overlays dinâmicos, o dashboard muda suas cores e alertas (Finalizado, Iniciado, Bloqueado) em tempo real, baseando-se na telemetria capturada.

🔍 Visualizador de JSON (IDE Style): Inclui um inspetor de payloads integrado com funcionalidade de busca e syntax highlighting, permitindo analisar notas fiscais e eventos de telemetria sem sair do app.

🚀 Diagnóstico de Bloqueios: Identifica automaticamente usuários com acesso restrito (mc1enabled), evitando chamados desnecessários para o suporte.



https://github.com/user-attachments/assets/b91c7ca7-00a6-4f1c-b925-08661e45bb38


* **💰 Analisador de Preços (SQL):** * Consulta de Preço Base (I007) e Condições ZBDC/ZBDI rodando em paralelo no backend Node.js e renderizando em tabelas dinâmicas fluídas no frontend.

* **🍃 Integração MongoDB:** * Leitura de Invoices e rotinas de End of Day (EOD) diretamente de coleções NoSQL com filtros avançados.



https://github.com/user-attachments/assets/b4637f82-6792-4f9d-a0e4-6edb846cba2e


* **🔌 Gerenciador de Conexões Seguras:** * Interface centralizada para salvar, testar e persistir histórico de credenciais de banco de dados (SQL Server e Mongo) localmente.

* **🤖 Automação Hypercare:** * Execução de scripts locais e manipulação de arquivos executáveis direto pelo aplicativo, com captura de logs de sistema em tempo real (via `child_process`).

* **📄 Geração de Laudos:** * Exportação de resultados de consultas e logs de diagnóstico diretamente para PDF para envio imediato a clientes ou equipes de suporte.

## 🏗️ Padrões de Arquitetura e Design (Design Patterns)

Este projeto foi desenhado focando em escalabilidade, segurança e código limpo, aplicando os seguintes padrões:

* **Arquitetura IPC (Inter-Process Communication):** Separação estrita de responsabilidades entre o *Renderer Process* (Frontend/React) e o *Main Process* (Backend/Node.js). O frontend nunca acessa o banco de dados diretamente, operando em um ambiente isolado por segurança (*Context Isolation*).
* **Bridge Pattern:** Utilizado no arquivo `preload.js` para criar uma ponte segura e controlada entre o navegador e o sistema operacional, expondo apenas funções estritamente necessárias.
* **Singleton & Facade Pattern:** A classe `ElectronAPIService` atua como uma *Facade*, envelopando todas as chamadas do frontend para o backend. Ela implementa o padrão *Singleton* para garantir uma instância única em toda a aplicação, centralizando o tratamento de erros (`try/catch` global) e logs sistêmicos.
* **Modularização (Separation of Concerns):** A lógica do servidor Node.js é fatiada em controladores específicos (`sqlHandlers.js`, `mongoHandlers.js`), mantendo o arquivo `main.js` limpo e focado apenas no ciclo de vida da janela do Electron.
* **Custom Hooks & Componentização:** Regras de negócio complexas do frontend foram extraídas dos componentes visuais e encapsuladas em *Custom Hooks* (ex: `useConnectionModal`), promovendo alta reutilização e facilitando testes. O estado global é gerenciado nativamente através da **Context API**.

## 🛠️ Tecnologias Utilizadas
* **Frontend:** React, Context API, Custom Hooks, CSS Grid/Flexbox, Lucide Icons.
* **Backend (Desktop):** Electron, Node.js.
* **Bancos de Dados:** SQL Server (`mssql/msnodesqlv8` com Windows Authentication Fallback) e MongoDB (`mongodb`).
* **Segurança:** Parser customizado para validação semântica de SQL.

## ⚙️ Como rodar o projeto localmente
1. Clone este repositório: `git clone https://github.com/SEU_USUARIO/NOME_DO_REPO.git`
2. Instale as dependências: `npm install`
3. Inicie o app em modo de desenvolvimento: `npm run electron-dev`
