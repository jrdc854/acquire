const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config(); 
const { acquireData } = require('./kunnaService'); 
const DataModel = require('./dataModel');

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || "mongodb://mongo:27017/prediction";

app.use(express.json()); 

mongoose.connect(MONGO_URI)
    .then(() => console.log('[MONGODB] Conexión a la base de datos establecida'))
    .catch(err => console.error('[MONGODB] Error de conexión:', err.message));

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

app.listen(PORT, () => {
    console.log(`[ACQUIRE] Servicio escuchando en el puerto ${PORT}`);
});



app.post('/data', async (req, res) => {
    
    try {
        console.log('[ACQUIRE] Iniciando adquisición de datos...');
        
        
        const { features, rawData, featureCount } = await acquireData();

        const newData = new DataModel({
            features: features,
            rawData: rawData,
            timestamp: new Date()
        });
        
        await newData.save();
        console.log(`[ACQUIRE] Datos guardados con ID: ${newData._id}`);

        return res.status(201).json({ //created
            dataId: newData._id,
            features: newData.features,
            featureCount: newData.features.length,
        });

    } catch (error) {
        console.error('[ACQUIRE] Error en la ruta /data:', error.message);
        return res.status(500).json({ error: 'Fallo al adquirir y guardar datos.' });
    }
});