// 💻 public/main.js
const { app, BrowserWindow, ipcMain, shell, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');
const registerMongoHandlers = require('./handlers/mongoHandlers');
const registerSqlHandlers = require('./handlers/sqlHandlers');

const { setupAIHandlers } = require('./handlers/aiHandlers');


registerMongoHandlers(ipcMain);
registerSqlHandlers(ipcMain);

//  Ativando os ouvintes do Gemini
setupAIHandlers();

try { if (require('electron-squirrel-startup')) app.quit(); } catch (e) {}
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

const { validateSql } = require('./sqlValidator'); 

let mainWindow;
  
function createWindow() {
  const iconPath = path.join(__dirname, 'logo-mc1.ico');

  mainWindow = new BrowserWindow({
    width: 1200, height: 900,
    title: "MC1 SQL Analyzer - Enterprise Edition",
    autoHideMenuBar: true, icon: iconPath, show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), 
      nodeIntegration: false, contextIsolation: true, 
    }
  });

  mainWindow.on('page-title-updated', (e) => e.preventDefault());

  if (process.env.ELECTRON_START_URL) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL);
    mainWindow.webContents.openDevTools();
  } else {
    let indexPath = path.join(app.getAppPath(), 'build', 'index.html');
    if (!fs.existsSync(indexPath)) indexPath = path.join(__dirname, '..', 'build', 'index.html');
    mainWindow.loadFile(indexPath).catch(err => {
      console.error("Erro HTML:", err);
      mainWindow.webContents.openDevTools();
    });
  }
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.setTitle("MC1 SQL Analyzer - Enterprise Edition");
  });
}

// AUTOMAÇÃO HYPERCARE 
ipcMain.handle('save-automation-file', async (event, filePath, content) => {
  try { fs.writeFileSync(filePath, content, 'utf8'); return { success: true }; } 
  catch (err) { return { success: false, error: err.message }; }
});

ipcMain.handle('run-executable', async (event, exeCommand) => {
  return new Promise((resolve) => {
    event.sender.send('exe-log', `[SISTEMA] Iniciando comando: ${exeCommand}`);
    const childProcess = exec(exeCommand);
    childProcess.stdout.on('data', (data) => { if (data.toString().trim()) event.sender.send('exe-log', `[INFO] ${data.toString().trim()}`); });
    childProcess.stderr.on('data', (data) => { if (data.toString().trim()) event.sender.send('exe-log', `[ERRO] ${data.toString().trim()}`); });
    childProcess.on('close', (code) => {
      event.sender.send('exe-log', `[SISTEMA] Processo finalizado com código ${code}`);
      resolve({ success: code === 0, code });
    });
  });
});

// PDF
ipcMain.handle('generate-pdf', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  try {
    const data = await win.webContents.printToPDF({ printBackground: true, pageSize: 'A4' });
    const fileName = `Laudo_SQL_${Date.now()}.pdf`;
    const filePath = path.join(os.homedir(), 'Downloads', fileName);
    fs.writeFileSync(filePath, data);
    clipboard.writeText(filePath);
    shell.showItemInFolder(filePath);
    return { success: true, path: filePath };
  } catch (error) { return { success: false, error: error.message }; }
});

// VALIDADOR
ipcMain.handle('extract-params', async (event, sql, topCount) => {
  try { return validateSql(sql, topCount); } 
  catch (err) { return { success: false, parserError: err.message }; }
});

app.whenReady().then(async () => {
  if (!app.isPackaged) {
    try {
      const installer = require('electron-devtools-installer');
      const name = await installer.default(installer.REACT_DEVELOPER_TOOLS, { loadExtensionOptions: { allowFileAccess: true }, forceDownload: false });
      console.log(`🚀 Extensão Adicionada: ${name}`);
    } catch (err) { console.log('⚠️ Aviso do React DevTools:', err.message); }
  }
  createWindow();
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });