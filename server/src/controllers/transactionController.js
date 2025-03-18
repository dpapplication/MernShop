const Transaction = require('../models/Transaction');
const Caisse = require('../models/caisseModel');

// Créer une transaction
exports.createTransaction = async (req, res) => {
    try {
        const caisse=await Caisse.findOne().sort({dateOuverture:-1})
        if(!caisse)
            return res.status(404).json({message:"caisse n'exite pas"})

        const { type, montant,motif } = req.body;
        const nouvelleTransaction = new Transaction({ type, montant,motif, idCaisse:caisse._id });
        await nouvelleTransaction.save();
        let total
        if(type=="depot")
        total=caisse.soldefinale+parseFloat(montant)
    else
    total=caisse.soldefinale-parseFloat(montant)
        caisse.soldefinale=total
        caisse.save()
        res.status(201).json(nouvelleTransaction);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la création de la transaction', error });
    }
};

// Lire toutes les transactions
exports.getTransactions = async (req, res) => {
    try {
        const caisse=await Caisse.findOne().sort({dateOuverture:-1})
        if(!caisse)
            return res.status(404).json({message:"caisse n'exite pas"})

        const transactions = await Transaction.find({idCaisse:caisse._id}).populate('idCaisse'); // Populate pour récupérer les détails de la caisse
        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des transactions', error });
    }
};

// Lire une transaction par ID
exports.getTransactionById = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id).populate('idCaisse');
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction non trouvée' });
        }
        
        res.status(200).json(transaction);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération de la transaction', error });
    }
};

// Supprimer une transaction
exports.deleteTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findByIdAndDelete(req.params.id);
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction non trouvée' });
        }
        let total=0
        const caisse=await Caisse.findById(transaction.idCaisse._id)
        if(transaction.type=='depot')
            total=caisse.soldefinale-transaction.montant
        else
        total=caisse.soldefinale+transaction.montant
        caisse.soldefinale=total
        caisse.save()
        res.status(200).json({ message: 'Transaction supprimée avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la suppression de la transaction', error });
    }
};

exports.getTransactionByIdCaisse = async (req, res) => {
    try {
        
        const transaction = await Transaction.find({idCaisse:req.params.id})
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction non trouvée' });
        }
        
        res.status(200).json(transaction);
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération de la transaction', error });
    }
};