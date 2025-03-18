// src/controllers/paiementController.js
const Paiement = require('../models/paiementModel');
const Facture = require('../models/factureModel');
const Caisse = require('../models/caisseModel');
const Transaction = require('../models/Transaction');

exports.createPaiement = async (req, res) => {
    const { commande, montant, methode } = req.body;

    try {


       const isCaisse=await Caisse.findOne({isOpen:true})

       if(!isCaisse){
                   
                  return res.status(201).json({message:'not found'})
               }
           if(methode=="Espèces"){
            const transaction=await Transaction.create({type:'depot',montant,motif:"payement facture",idCaisse:isCaisse._id})
           }    
        const payement=await Paiement.create({ commande, montant, methode ,caisse:isCaisse._id })
        total=isCaisse.soldefinale+montant
        isCaisse.soldefinale=total
        isCaisse.save()
        res.status(201).json(payement);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAllPaiementsByCommande = async (req, res) => {
    try {
        const paiements = await Paiement.find({commande:req.params.id})
        res.json(paiements);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deletePaiementsByiD = async (req, res) => {
    try {
        const paiements = await Paiement.findByIdAndDelete(req.params.id)
        if(!paiements)
            return res.status(404).json({message:'erreur'})
        const isCaisse=await Caisse.findOne({isOpen:true})

        if(!isCaisse){
                    
                   return res.status(201).json({message:'not found'})
                }
            if(paiements.methode=="Espèces"){
             await Transaction.create({type:'retrait',montant:paiements.montant,motif:"Annuler un facture",idCaisse:isCaisse._id})
            }    
         total=isCaisse.soldefinale-paiements.montant
         isCaisse.soldefinale=total
         isCaisse.save()
        res.json(paiements);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


exports.getPaiementByCaisse = async (req, res) => {
    try {
        const isCaisse=await Caisse.findOne({isOpen:true})
        if(!isCaisse){
          return res.status(201).json({message:'not found'})
           }
        const paiements = await Paiement.find({caisse:isCaisse._id}).select('methode montant -_id')
        res.json(paiements);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.editerPaiement = async (req, res) => {
    try {
       
        const paiements = await Paiement.findByIdAndUpdate(req.params.id,req.body)
        if(!paiements)
           return res.status(404).json({message:'not found'})
        res.json(paiements);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};