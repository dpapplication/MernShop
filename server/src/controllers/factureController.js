// src/controllers/factureController.js
const Facture = require('../models/factureModel');
const Commande = require('../models/commandeModel');

exports.createFacture = async (req, res) => {
    const { commandeId } = req.body;

    try {
        // Vérifier si la commande existe
        const commande = await Commande.findById(commandeId).populate('client produits.produit');
        if (!commande) {
            return res.status(404).json({ message: 'Commande non trouvée' });
        }

        // Créer la facture
        const facture = new Facture({
            commande: commandeId,
            total: commande.total,
        });

        // Sauvegarder la facture
        const newFacture = await facture.save();
        res.status(201).json(newFacture);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAllFactures = async (req, res) => {
    try {
        const factures = await Facture.find().populate('commande');
        res.json(factures);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};