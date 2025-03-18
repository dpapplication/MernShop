// src/routes/commandeRoutes.js
const express = require('express');
const router = express.Router();
const commandeController = require('../controllers/commandeController');

router.post('/', commandeController.createCommande);
router.get('/:id', commandeController.getByIdCommandes);
router.put('/:id', commandeController.updateCommande);
router.delete('/:id', commandeController.deleteByIdCommandes);
router.put('/active/:id', commandeController.payerCommande);
router.put('/desactive/:id', commandeController.desactiverCommande);
router.get('/', commandeController.getAllCommandes);

module.exports = router;