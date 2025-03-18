const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// Créer une transaction
router.post('/', transactionController.createTransaction);

// Lire toutes les transactions
router.get('/', transactionController.getTransactions);
router.get('/caisse/:id', transactionController.getTransactionByIdCaisse);
// Lire une transaction par ID
router.get('/:id', transactionController.getTransactionById);

// Supprimer une transaction
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;