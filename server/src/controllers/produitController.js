// src/controllers/produitController.js
const Produit = require('../models/produitModel');

// Récupérer tous les produits
exports.getAllProduits = async (req, res) => {
    try {
        const produits = await Produit.find();
        res.json(produits);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}
exports.ProduitMoinsZero = async (req, res) => {
    try {
        const produits = await Produit.find({stock:{$lte:0}});
        res.json(produits);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}
// Récupérer un produit par son ID
exports.getProduitById = async (req, res) => {
    try {
        const produit = await Produit.findById(req.params.id);
        if (!produit) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }
        res.json(produit);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Créer un nouveau produit
exports.createProduit = async (req, res) => {
    const { nom, prix, stock } = req.body;

    const produit = new Produit({
        nom,
        prix,
        stock,
    });

    try {
        const newProduit = await produit.save();
        res.status(201).json(newProduit);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Mettre à jour un produit
exports.updateProduit = async (req, res) => {
    try {
        const produit = await Produit.findById(req.params.id);
        if (!produit) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }

        if (req.body.nom != null) {
            produit.nom = req.body.nom;
        }
        if (req.body.prix != null) {
            produit.prix = req.body.prix;
        }
        if (req.body.stock != null) {
            produit.stock = req.body.stock;
        }

        const updatedProduit = await produit.save();
        res.json(updatedProduit);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Supprimer un produit
exports.deleteProduit = async (req, res) => {
    try {
        const produit = await Produit.findByIdAndDelete(req.params.id);
        if (!produit) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }
        res.json({ message: 'Produit supprimé avec succès' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// retirer du stock 
// Supprimer un produit
exports.retirerStock = async (req, res) => {
    try {
        const {quantite}=req.body
        const produit = await Produit.findById(req.params.id);
        if (!produit) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }
        const total=produit.stock-quantite
        produit.stock=total
        produit.save()
        res.json({ message: 'Produit supprimé avec succès' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

//ajouter au stock

exports.akouterStock = async (req, res) => {
    try {
        const {quantite}=req.body
        const produit = await Produit.findById(req.params.id);
        if (!produit) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }
        const total=produit.stock+quantite
        produit.stock=total
        produit.save()
        res.json({ message: 'Produit supprimé avec succès' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};