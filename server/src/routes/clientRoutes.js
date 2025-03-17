// src/routes/clientRoutes.js
const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');

// Récupérer tous les clients
router.get('/', clientController.getAllClients);

// Récupérer un client par son ID
router.get('/:id', clientController.getClientById);

// Créer un nouveau client
router.post('/', clientController.createClient);

// Mettre à jour un client
router.put('/:id', clientController.updateClient);

// Supprimer un client
router.delete('/:id', clientController.deleteClient);

module.exports = router;