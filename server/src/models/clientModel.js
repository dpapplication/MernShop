// src/models/clientModel.js
const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    adresse: { type: String, required: true },
    telephone: { type: String, required: true },
});

module.exports = mongoose.model('Client', clientSchema);