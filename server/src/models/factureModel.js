// src/models/factureModel.js
const mongoose = require('mongoose');

const factureSchema = new mongoose.Schema({
    commande: { type: mongoose.Schema.Types.ObjectId, ref: 'Commande', required: true },
    date: { type: Date, default: Date.now },
    total: { type: Number, required: true },
    remise:{ type: Number, required: true },
});

module.exports = mongoose.model('Facture', factureSchema);