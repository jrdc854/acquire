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
  
  // 1. PRIMERO DEFINIMOS LA VARIABLE (Esto debe ir antes de usarla)
  const result = json.result;

  if (!result || !Array.isArray(result.columns) || !Array.isArray(result.values)) {
    throw new Error("KUNNA_INVALID_RESULT");
  }

  return result; 
}

// 2. NUEVA FUNCIÓN: acquireData
// Tu server.js llama a "acquireData()" sin argumentos.
// Aquí definimos el tiempo y formateamos la respuesta.
async function acquireData() {
  const timeEnd = new Date();

  const timeStart = new Date(timeEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
  const rawResult = await fetchKunna(timeStart, timeEnd);

  const values = rawResult.values;

  //1. validar que ehay suficientes datos (t-2, t-1, 1)
  if (values.length < 3) {
    throw new Error("KUNNA_INSUFFICIENT_DATA: Se requieren al menos 3 días de datos históricos.")
  }

  //odentificar el índice de la columna de consumo
  const consumptionIndex = 2; //col en la que está el consumo

  //extraer 7 features
  const features = [
    values[0][consumptionIndex], //consumo hoy (t)
    values[1][consumptionIndex], //consumo ayer (t -1)
    values[2][consumptionIndex], //consumo anteayer (t - 2)

    //features de tiempo
    new Date().getHours(), //hora del dia
    new Date().getDay(),  //día de la semana
    new Date().getMonth() + 1, //mes
    new Date().getDate()   //dia del mes
  ];

  //forzar la validación
  if (features.length !== 7) {
    throw new Error("INTERNAL_FEATURE_ERROR: La extracción no produjo 7 elementos.");
  }
  return {
    features: features,
    rawData: rawResult,
    featureCount: features.length //incluir el conteo
  };

}

// 4. CAMBIO: Exportar con module.exports (CommonJS)
module.exports = { acquireData };
