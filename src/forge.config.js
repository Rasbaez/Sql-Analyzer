// forge.config.js
module.exports = {
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        // Caminho para o certificado da empresa
        certificateFile: './certificados/pepsico_internal.pfx',
        certificatePassword: process.env.CERT_PASSWORD, 
        setupExe: 'SQLAnalyzer_Setup.exe'
      }
    }
  ]
};