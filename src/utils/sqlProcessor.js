export const processSqlData = (sql, resParams) => {
  if (!resParams || Object.keys(resParams).length === 0) {
    return { updateFields: {}, whereFields: {}, insertFields: {}, deleteFields: {}, customWarnings: [] };
  }

  const sqlUpper = sql.toUpperCase();
  const updateFields = {};  
  const whereFields = {};
  
  if (sqlUpper.includes("INSERT")) {
    return { updateFields: {}, whereFields: {}, insertFields: resParams, deleteFields: {}, customWarnings: [] };
  } 
  
  if (sqlUpper.includes("UPDATE")) {
    const posSet = sqlUpper.indexOf("SET");
    const posWhere = sqlUpper.indexOf("WHERE");

    const trechoSet = posWhere !== -1 ? sqlUpper.substring(posSet, posWhere) : sqlUpper.substring(posSet);
    const trechoWhere = posWhere !== -1 ? sqlUpper.substring(posWhere) : "";

    for (const key in resParams) {
      const keyUpper = key.toUpperCase();
      const valor = resParams[key];
      const regex = new RegExp(`\\b${keyUpper}\\b`, 'i');

      if (trechoWhere && regex.test(trechoWhere)) {
        whereFields[key] = valor;
      } else if (trechoSet && regex.test(trechoSet)) {
        updateFields[key] = (valor === "" || valor === "''") ? "''" : valor;
      }
    }
    return { updateFields, whereFields, insertFields: {}, deleteFields: {}, customWarnings: [] };
  } 
  
  if (sqlUpper.includes("DELETE")) {
    // ✅ CORREÇÃO: whereFields agora vai vazio ({}). Assim o React só desenha a tabela vermelha de DELETE.
    return { updateFields: {}, whereFields: {}, insertFields: {}, deleteFields: resParams, customWarnings: [] };
  }

  // Se for apenas um SELECT puro, vai para o WHERE
  return { updateFields: {}, whereFields: resParams, insertFields: {}, deleteFields: {}, customWarnings: [] };
};