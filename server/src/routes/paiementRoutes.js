// src/routes/paiementRoutes.js
const express = require('express');
const router = express.Router();
const paiementController = require('../controllers/paiementController');

router.post('/', paiementController.createPaiement);
router.get('/',paiementController.getPaiementByCaisse)
router.delete('/:id', paiementController.deletePaiementsByiD);
router.get('/caisse/:id', paiementController.getPaiementByIdCaisse);
router.get('/commande/:id', paiementController.getAllPaiementsByCommande);
router.put('/:id', paiementController.editerPaiement);

module.exports = router;