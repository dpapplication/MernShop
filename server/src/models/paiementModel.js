// src/models/paiementModel.js
const mongoose = require('mongoose');

const paiementSchema = new mongoose.Schema({
    facture: { type: mongoose.Schema.Types.ObjectId, ref: 'Facture', required: true },
    montant: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    methode: { type: String, required: true }, // Ex: "Carte", "Espèces"
});

module.exports = mongoose.model('Paiement', paiementSchema);