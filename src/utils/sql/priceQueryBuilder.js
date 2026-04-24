// 💻 src/utils/priceQueryBuilder.js

const buildProductFilter = (produtosArray, tableAlias = 'a') => {
  if (!produtosArray || produtosArray.length === 0) return '';
  const likes = produtosArray.map(p => `${tableAlias}.cIDProduct LIKE '%${p}%'`).join(' OR ');
  return `AND (${likes})`;
};

module.exports = {
  buildZbdcQuery: (filtros) => {
    const prodFilter = buildProductFilter(filtros.produtos, 'a');
    return `
      SELECT TOP 100 a.mc1enabled, a.MC1LastUpdate, a.nDiscountValue, a.nLowerLimit, a.nUperLimit,
             a.cConditionType, a.xRouteType, a.cIDProduct, a.dStartDateValidity, a.dEndDateValidity, a.cIDCustomer
      FROM MC1_PriceA751 a WITH(NOLOCK)
      WHERE a.cConditionType IN ('ZBDC') 
      AND a.cidcompany = '0546' 
      AND a.xSalesOrganization = 'BR01'
      ${filtros.tipoRota ? `AND a.xRouteType = '${filtros.tipoRota}'` : ''}
      ${filtros.segmento ? `AND a.xCustomerSegment2 = '${filtros.segmento}'` : ''}
      ${filtros.classificacao ? `AND a.xCustomerClassification = '${filtros.classificacao}'` : ''}
      ${filtros.uf ? `AND a.cJurisdicionTax IN ('${filtros.uf}')` : ''}
      ${prodFilter}
      AND a.mc1enabled = '1'
      ORDER BY a.MC1LastUpdate DESC
    `;
  },

  buildZbdiQuery: (filtros) => {
    const prodFilter = buildProductFilter(filtros.produtos, 'a');
    return `
      SELECT TOP 100 a.MC1LastUpdate, a.cIDRecordNumber, a.nDiscountValue, a.nLowerLimit, a.nUperLimit,
             a.cConditionType, a.xRouteType, a.cIDProduct, a.xCustomerSegment2, a.xcustomerClassification,
             a.dStartDateValidity, a.dEndDateValidity, a.cIDCustomer, a.mc1enabled
      FROM MC1_PriceA751x a WITH(NOLOCK)
      WHERE a.cConditionType IN ('ZBDI') 
      AND a.xSalesOrganization = 'BR01'
      ${filtros.tipoRota ? `AND a.xRouteType = '${filtros.tipoRota}'` : ''}
      ${filtros.segmento ? `AND a.xCustomerSegment2 = '${filtros.segmento}'` : ''}
      ${filtros.uf ? `AND a.cJurisdicionTax IN ('${filtros.uf}')` : ''}
      ${prodFilter}
      AND a.mc1enabled = '1'
      ORDER BY a.MC1LastUpdate DESC
    `;
  },

  buildBaseQuery: (filtros) => {
    const prodFilter = buildProductFilter(filtros.produtos, 'I007');
    
    // 🔥 Lógica da Rota via MC1_StockBalance
    const rotaFilter = filtros.rota ? `AND I007.cIDProduct IN (SELECT cIDProduct FROM MC1_StockBalance WITH(NOLOCK) WHERE cIDTrip LIKE '${filtros.rota}%')` : '';

    return `
      SELECT TOP 100 MC1LastUpdate, cIDProduct, nDiscountValue, dStartDateValidity, dEndDateValidity, cIDBranchInvoice, XROUTETYPE
      FROM MC1_PriceI007 I007 WITH(NOLOCK)
      WHERE MC1Enabled = 1
      ${filtros.filial ? `AND cIDBranchInvoice = '${filtros.filial}'` : ''}
      ${filtros.tipoRota ? `AND XROUTETYPE = '${filtros.tipoRota}'` : ''}
      ${rotaFilter}
      ${prodFilter}
      ORDER BY MC1LastUpdate DESC
    `;
  }
};