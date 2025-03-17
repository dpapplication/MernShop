// src/models/commandeModel.js
const mongoose = require('mongoose');

const commandeSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    caisse:{
        type: mongoose.Schema.Types.ObjectId, ref: 'Caisse'
    },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    produits: [
        {
            produit: { type: mongoose.Schema.Types.ObjectId, ref: 'Produit', required: true },
            prix:{ type: Number, required: true },
            quantite: { type: Number, required: true },
            remise:{ type: Number },
        },

    ],
    payments:[
        {
            
            typePaiement:String,
            montant:Number
        }
    ],
    remiseGlobale:Number,
    status:{
        type:Boolean,
        defaut:false
        
    }
  
});

module.exports = mongoose.model('Commande', commandeSchema);