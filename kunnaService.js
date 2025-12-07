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

  return result; // { columns, values }
}

// 2. NUEVA FUNCIÓN: acquireData
// Tu server.js llama a "acquireData()" sin argumentos.
// Aquí definimos el tiempo y formateamos la respuesta.
async function acquireData() {
  // Definimos un rango de tiempo por defecto (ej. última hora)
  const timeEnd = new Date();
  const timeStart = new Date(timeEnd.getTime() - 60 * 60 * 1000); // Restar 1 hora

  // Llamamos a la lógica de Kunna
  const rawResult = await fetchKunna(timeStart, timeEnd);

  // 3. TRANSFORMACIÓN
  // Tu server.js espera devolver { features, rawData }.
  // Aquí debes extraer los datos numéricos que te interesen para 'features'.
  // Por ahora, pongo un ejemplo genérico tomando la primera columna de valores.
  
  const features = rawResult.values.map(row => row[1]); // Ejemplo: Tomar el valor de la columna 1
  //creo que tengo que coger la columna de los datos en la que este el consumo, lo miro en postman
  return {
    features: features, 
    rawData: rawResult
  };
}

// 4. CAMBIO: Exportar con module.exports (CommonJS)
module.exports = { acquireData };
