// src/routes/factureRoutes.js
const express = require('express');
const router = express.Router();
const factureController = require('../controllers/factureController');

router.post('/', factureController.createFacture);
router.get('/', factureController.getAllFactures);

module.exports = router;