const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config(); // Para cargar MONGO_URI del .env
const { acquireData } = require('./kunnaService'); // El script que obtiene datos de Kunna
const DataModel = require('./dataModel'); // El esquema de Mongoose

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || "mongodb://mongo:27017/prediction";

app.use(express.json()); // Middleware para parsear JSON en el cuerpo de las peticiones

// --- CONEXIÓN A MONGODB ---
mongoose.connect(MONGO_URI)
    .then(() => console.log('[MONGODB] Conexión a la base de datos establecida'))
    .catch(err => console.error('[MONGODB] Error de conexión:', err.message));

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

// --- LEVANTAR SERVIDOR ---
app.listen(PORT, () => {
    console.log(`[ACQUIRE] Servicio escuchando en el puerto ${PORT}`);
});

// Dentro de acquire/server.js, después de la conexión a DB

app.post('/data', async (req, res) => {
    try {
        console.log('[ACQUIRE] Iniciando adquisición de datos...');
        
        // 1. ADQUISICIÓN Y TRANSFORMACIÓN DE DATOS (llama a tu kunnaService)
        // kunnService.js debe devolver un objeto { features: [num1, num2, ...], rawData: {...} }
        const data = await acquireData(); // Llama a la lógica Kunna
        
        // 2. CREACIÓN DE DOCUMENTO CON EL MODELO DE MONGOOSE
        const newData = new DataModel({
            features: data.features,
            rawData: data.rawData,
            timestamp: new Date()
        });
        
        // 3. PERSISTENCIA DE DATOS (Guardar en MongoDB)
        await newData.save();
        console.log(`[ACQUIRE] Datos guardados con ID: ${newData._id}`);

        // 4. CUMPLIMIENTO DEL CONTRATO (Respuesta)
        // Devolvemos el vector de features y el ID del registro al orchestrator.
        return res.status(200).json({
            dataId: newData._id,
            features: newData.features
        });

    } catch (error) {
        console.error('[ACQUIRE] Error en la ruta /data:', error.message);
        // Si falla, siempre devolver un 500 para notificar al orchestrator.
        return res.status(500).json({ error: 'Fallo al adquirir y guardar datos.' });
    }
});