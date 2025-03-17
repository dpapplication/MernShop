// src/models/produitModel.js
const mongoose = require('mongoose');

const produitSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    prix: { type: Number, required: true },
    stock: { type: Number, required: true },
});

module.exports = mongoose.model('Produit', produitSchema);