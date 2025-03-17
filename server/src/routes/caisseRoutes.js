// src/routes/caisseRoutes.js
const express = require('express');
const router = express.Router();
const caisseController = require('../controllers/caisseController');

router.get('/', caisseController.getAllCaisse)
router.get('/open', caisseController.getopenCaisse);

module.exports = router;