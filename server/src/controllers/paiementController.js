// src/controllers/paiementController.js
const Paiement = require('../models/paiementModel');
const Facture = require('../models/factureModel');
const Caisse = require('../models/caisseModel');

exports.createPaiement = async (req, res) => {
    const { factureId, montant, methode } = req.body;

    try {
        // Vérifier si la facture existe
        const facture = await Facture.findById(factureId);
        if (!facture) {
            return res.status(404).json({ message: 'Facture non trouvée' });
        }

        // Créer le paiement
        const paiement = new Paiement({
            facture: factureId,
            montant,
            methode,
        });

        // Sauvegarder le paiement
        const newPaiement = await paiement.save();

        // Mettre à jour la caisse
        await Caisse.findOneAndUpdate({}, { $inc: { solde: montant } }, { upsert: true });

        res.status(201).json(newPaiement);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAllPaiements = async (req, res) => {
    try {
        const paiements = await Paiement.find().populate('facture');
        res.json(paiements);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};