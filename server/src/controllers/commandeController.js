// src/controllers/commandeController.js
const Commande = require('../models/commandeModel');
const Produit = require('../models/produitModel');
const Client = require('../models/clientModel');
const Transaction =require('../models/Transaction')
const Caisse =require('../models/caisseModel');
const caisseModel = require('../models/caisseModel');

exports.createCommande = async (req, res) => {
    const { clientId, produits ,remiseGlobale,services,description} = req.body;
    console.log(req.body)
    try {
        // Vérifier si le client existe
        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({ message: 'Client non trouvé' });
        }   

        const commande = new Commande({
            client: clientId,
            produits,
            services,
            remiseGlobale,
            description
            
        });

        
        const newCommande = await commande.save();

        produits.forEach(async(element) => {
            const produit = await Produit.findById(element.produit)
            const total =produit.stock
            produit.stock=total-element.quantite
            produit.save()
        });
       

        res.status(201).json(newCommande);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAllCommandes = async (req, res) => {
    try {
        const commandes = await Commande.find().populate('client produits.produit services.service').sort({date:-1});
        res.json(commandes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getByIdCommandes = async (req, res) => {
    try {
        const commandes = await Commande.findById(req.params.id).populate('client produits.produit services.service')
        res.json(commandes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


exports.updateCommande = async (req, res) => {
    
    
    try {
        const { clientId, produits ,services ,remiseGlobale} = req.body;
        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({ message: 'Client non trouvé' });
        }   
        const commande = await Commande.findById(req.params.id)
        commande.produits.forEach(async(element) => {
            const produit = await Produit.findById(element.produit)
            const total =produit.stock
            produit.stock=total+element.quantite
            produit.save()
        });
        await Commande.findByIdAndUpdate(req.params.id,req.body,{new:true})
        produits.forEach(async(element) => {
            const produit = await Produit.findById(element.produit)
            const total =produit.stock
            produit.stock=total-element.quantite
            produit.save()
        });
        
       

        res.status(200).json(commande);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteByIdCommandes = async (req, res) => {
    try {
        const commande = await Commande.findByIdAndDelete(req.params.id).populate('client produits.produit services.service');
        if (!commande) {
            return res.status(404).json({ message: 'commande non trouvé' });
        }  
        res.json(commande);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.payerCommande = async (req, res) => {
    try {
        const commande = await Commande.findById(req.params.id).populate('client produits.produit services.service');
        if (!commande) {
            return res.status(404).json({ message: 'commande non trouvé' });
        }  
        
        
        commande.status=true
        commande.save()
        res.json(commande);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


exports.desactiverCommande = async (req, res) => {
    try {
        const commande = await Commande.findById(req.params.id).populate('client produits.produit services.service');
        if (!commande) {
            return res.status(404).json({ message: 'commande non trouvé' });
        }  
        
        
        commande.status=false
        commande.save()
        res.json(commande);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};