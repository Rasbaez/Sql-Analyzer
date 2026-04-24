// 🧠 src/hooks/useAutomation.js
import { useState } from 'react';

const defaultFormData = {
  V_ID_COMPANY: '0546',
  V_ID_USER: '',
  V_C_NAME_USER: '',
  V_C_EMAIL_USER: '',
  V_C_PASS_USER: '',
  V_X_DOMAIN: 'wtm.pepsico.mx',
  V_ID_PROJECT: '166',
  V_ID_PROFILE: '0',
  V_X_ENVIRONMENT: '51'
};

export const useAutomation = () => {
  const [templateContent, setTemplateContent] = useState('');
  const [emailsFound, setEmailsFound] = useState([]);
  const [placeholders, setPlaceholders] = useState([]);
  const [formData, setFormData] = useState(defaultFormData);

  const processTemplate = async (file) => {
    const text = await file.text();
    setTemplateContent(text);

    // 🔍 Extrai E-mails
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const foundEmails = [...new Set(text.match(emailRegex) || [])];
    setEmailsFound(foundEmails);

    // 🔍 Extrai Placeholders tipo {V_VARIAVEL}
    const placeholderRegex = /\{(\w+)\}/g;
    const foundPlaceholders = [...new Set([...text.matchAll(placeholderRegex)].map(m => m[1]))];
    setPlaceholders(foundPlaceholders);
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const clearTemplate = () => {
    setTemplateContent('');
    setEmailsFound([]);
    setPlaceholders([]);
    setFormData(defaultFormData);
  };

  return { 
    processTemplate, 
    emailsFound, 
    placeholders, 
    formData, 
    updateField, 
    templateContent,
    clearTemplate
  };
};