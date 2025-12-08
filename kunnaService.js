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
  // CAMBIO: Pedir 7 días atrás en lugar de 1 hora
  const timeStart = new Date(timeEnd.getTime() - 7 * 24 * 60 * 60 * 1000); 

  const rawResult = await fetchKunna(timeStart, timeEnd);
  // ... resto igual ...

  // 3. TRANSFORMACIÓN
  // Tu server.js espera devolver { features, rawData }.
  // Aquí debes extraer los datos numéricos que te interesen para 'features'.
  
  const features = rawResult.values.map(row => row[2]); 
  //creo que tengo que coger la columna de los datos en la que este el consumo, lo miro en postman
  return {
    features: features, 
    rawData: rawResult
  };
}

// 4. CAMBIO: Exportar con module.exports (CommonJS)
module.exports = { acquireData };
