// src/routes/produitRoutes.js
const express = require('express');
const router = express.Router();
const produitController = require('../controllers/produitController');

// Récupérer tous les produits
router.get('/', produitController.getAllProduits);

// Récupérer un produit par son ID
router.get('/:id', produitController.getProduitById);

// Créer un nouveau produit
router.post('/', produitController.createProduit);

// Mettre à jour un produit
router.put('/:id', produitController.updateProduit);

// Supprimer un produit
router.delete('/:id', produitController.deleteProduit);

//retirer du stock

router.put('/:id/retirer',produitController.retirerStock)
router.put('/:id/ajouter',produitController.akouterStock)
module.exports = router;