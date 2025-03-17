// src/routes/paiementRoutes.js
const express = require('express');
const router = express.Router();
const paiementController = require('../controllers/paiementController');

router.post('/', paiementController.createPaiement);
router.get('/', paiementController.getAllPaiements);

module.exports = router;