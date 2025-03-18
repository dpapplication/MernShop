// src/models/paiementModel.js
const mongoose = require('mongoose');

const paiementSchema = new mongoose.Schema({
    commande: { type: mongoose.Schema.Types.ObjectId, ref: 'commande', required: true },
    caisse: { type: mongoose.Schema.Types.ObjectId, ref: 'caisse', required: true },
    montant: { type: Number, required: true },
    methode: { type: String, required: true }, // Ex: "Carte", "Espèces"
});

module.exports = mongoose.model('Paiement', paiementSchema);