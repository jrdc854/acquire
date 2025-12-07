const mongoose = require('mongoose');

// Definimos la estructura (Schema) de los datos que vamos a guardar
const DataSchema = new mongoose.Schema({
    features: {
        type: Array, // Aquí guardaremos el array de números [num1, num2...]
        required: true
    },
    rawData: {
        type: Object, // Aquí guardamos la respuesta cruda de Kunna por si acaso
        required: false
    },
    timestamp: {
        type: Date,
        default: Date.now // Guarda la fecha y hora actual automáticamente
    }
});

// Exportamos el modelo
module.exports = mongoose.model('Data', DataSchema);