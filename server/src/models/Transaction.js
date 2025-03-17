const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['depot', 'retrait'] // Exemple de types de transaction
    },
    montant: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now // Date actuelle par défaut
    },
    idCaisse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Caisse', // Référence à une entité Caisse (si nécessaire)
        required: true
    },
    motif:{
type:String
    }
});

module.exports = mongoose.model('Transaction', transactionSchema);