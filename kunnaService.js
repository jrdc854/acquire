require("dotenv").config();

const KUNNA_URL = process.env.KUNNA_URL;

// alias fijo del contador (ya no usamos uid)
const ALIAS = process.env.KUNNA_ALIAS;

/**
 * Llama a Kunna con un rango [timeStart, timeEnd]
 * y devuelve el objeto { columns, values }.
 */
async function fetchKunna(timeStart, timeEnd) {
  const url = KUNNA_URL;

  const headers = {
    "Content-Type": "application/json"
  };

  const body = {
    time_start: timeStart.toISOString(),
    time_end: timeEnd.toISOString(),
    filters: [
      { filter: "name", values: ["1d"] },
      { filter: "alias", values: [ALIAS] }
    ],
    limit: 100,
    count: false,
    order: "DESC"
  };

  const response = await fetch(url, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`KUNNA_BAD_STATUS:${response.status}`);
  }

  const json = await response.json();
  
  const result = json.result;

  if (!result || !Array.isArray(result.columns) || !Array.isArray(result.values)) {
    throw new Error("KUNNA_INVALID_RESULT");
  }

  return result; 
}

async function acquireData() {
  const timeEnd = new Date();

  const timeStart = new Date(timeEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
  const rawResult = await fetchKunna(timeStart, timeEnd);

  const values = rawResult.values;

  if (values.length < 3) {
    throw new Error("KUNNA_INSUFFICIENT_DATA: Se requieren al menos 3 días de datos históricos.")
  }

  const consumptionIndex = 2; 

  const features = [
    values[0][consumptionIndex], //consumo  (t)
    values[1][consumptionIndex], //consumo  (t -1)
    values[2][consumptionIndex], //consumo  (t - 2)

    //features de tiempo
    new Date().getHours(), 
    new Date().getDay(),  
    new Date().getMonth() + 1, 
    new Date().getDate()   
  ];

  if (features.length !== 7) {
    throw new Error("INTERNAL_FEATURE_ERROR: La extracción no produjo 7 elementos.");
  }
  return {
    features: features,
    rawData: rawResult,
    featureCount: features.length 
  };

}

module.exports = { acquireData };
