import fs from 'fs';
import path from 'path';
import { 
  flattenXmlValue, 
  formatXmlDate, 
  formatXmlNumber, 
  parseExternalXml 
} from '@torre/shared';

const DATA_DIR = path.join(process.cwd(), 'data');

/**
 * Reads and parses a local XML file using shared utilities.
 */
async function readLocalXml(fileName: string) {
  const filePath = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf-8');
  return await parseExternalXml(content);
}

/**
 * BOARDING - Precise logic replication
 */
export async function getUnifiedBoardingList() {
  const data = await readLocalXml('BoardingList.xml');
  if (!data) return [];
  const list = data.ExternalWarehouses?.Shipments?.BoardingItem || [];
  const items = Array.isArray(list) ? list : [list];

  const currentYear = new Date().getFullYear().toString();

  const processed = items.map(item => {
    let wh = flattenXmlValue(item.Warehouse);
    if (wh === 'ANVERS') wh = 'VAN MOER';

    return {
      Origin: flattenXmlValue(item.Origin),
      'Customer Order': flattenXmlValue(item.CustomerOrder),
      'Warehouse': wh,
      'POL': flattenXmlValue(item.POL),
      'Final Destination': flattenXmlValue(item.FinalDestination),
      'Fecha Lim. Carga': formatXmlDate(item.BoardingDate),
      'Delivery Date': formatXmlDate(item.DeliveryDate),
      'Forecast Arrival': formatXmlDate(item.ForecastArrivalDate),
      'Bultos': flattenXmlValue(item.ReelsCount),
      'Weight (Tons)': formatXmlNumber(item.Weight, 3),
      'Ext. Addr. Number': flattenXmlValue(item.ExtAddrNumber)
    };
  }).filter(i => {
    return i['Customer Order'] && i['Fecha Lim. Carga'].endsWith(currentYear);
  });

  return processed.sort((a, b) => {
    const parseDate = (d: string) => {
      const parts = d.split('/');
      if (parts.length < 3) return 0;
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).getTime();
    };
    return parseDate(b['Fecha Lim. Carga']) - parseDate(a['Fecha Lim. Carga']);
  });
}

/**
 * RECEPTIONS - Precise logic replication
 */
export async function getUnifiedPendingReceptions() {
  const data = await readLocalXml('PendingReceptionsList.xml');
  if (!data) return [];
  const list = data.ExternalWarehouses?.Receptions?.ReceptionItem || [];
  const items = Array.isArray(list) ? list : [list];

  return items.map(item => {
    let wh = flattenXmlValue(item.Warehouse);
    if (wh === 'ANVERS') wh = 'VAN MOER';

    let extAddr = flattenXmlValue(item.ExtAddrNumber);
    if (extAddr === '767') extAddr = '298901';

    let finalDest = flattenXmlValue(item.FinalDestination);
    if (finalDest.includes('VOGT')) finalDest = 'SAICA PACK HAMILTON';

    return {
      Origin: flattenXmlValue(item.Origin),
      'Warehouse': wh,
      'Status': flattenXmlValue(item.Status),
      'Load Code': flattenXmlValue(item.LoadCode),
      'Plate Number': flattenXmlValue(item.PlateNumber),
      'Estimated Arrival at WH': formatXmlDate(item.ForecastArrivalDate),
      'Ext. Addr. Number': extAddr,
      'Final Destination': finalDest,
      'Customer Order': flattenXmlValue(item.CustomerOrder),
      'Item Number': flattenXmlValue(item.ItemNumber),
      'Reel Year': flattenXmlValue(item.ReelYear),
      'Paper Code': flattenXmlValue(item.PaperCode),
      'Product Description': flattenXmlValue(item.ProductDescription),
      'Grammage (GM)': flattenXmlValue(item.Grammage),
      'Diameter (CM)': flattenXmlValue(item.Diameter),
      'Roll Width (CM)': flattenXmlValue(item.RollWidth),
      'Roll Length (CM)': flattenXmlValue(item.RollLength),
      'Weight (Kgs)': formatXmlNumber(item.Weight, 0)
    };
  });
}

/**
 * STOCK - Precise logic replication
 */
export async function getUnifiedStock() {
  const data = await readLocalXml('Stock.xml');
  if (!data) return [];
  const list = data.ExternalWarehouses?.Stock?.StockItem || [];
  const items = Array.isArray(list) ? list : [list];

  const processed = items.map(item => {
    let wh = flattenXmlValue(item.WarehouseID);
    if (wh === 'ANVERS') wh = 'VAN MOER';

    return {
      Origin: flattenXmlValue(item.Origin),
      'Warehouse': wh,
      'Ext. Addr. Number': flattenXmlValue(item.CustomerCode),
      'Product Code': flattenXmlValue(item.ProductCode),
      'Item Number': flattenXmlValue(item.ReelCode || item.ID),
      'Description': flattenXmlValue(item.ProductDescription || item.Quality),
      'Grammage': flattenXmlValue(item.Grammage || item.BasisWeight),
      'Diameter': formatXmlNumber(item.Diameter, 0),
      'Roll Width': formatXmlNumber(item.RollWidth, 1),
      'Weight': formatXmlNumber(item.Weight || item.ReelWeight, 3),
      'Load Code': flattenXmlValue(item.LoadCode),
      'Customer Name': flattenXmlValue(item.CustomerName)
    };
  });

  return processed.sort((a, b) => {
    return (a.Warehouse || '').localeCompare(b.Warehouse || '') || 
           (a['Ext. Addr. Number'] || '').localeCompare(b['Ext. Addr. Number'] || '') || 
           (a['Product Code'] || '').localeCompare(b['Product Code'] || '') || 
           (a['Item Number'] || '').localeCompare(b['Item Number'] || '');
  });
}
