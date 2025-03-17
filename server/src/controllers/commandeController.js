// src/controllers/commandeController.js
const Commande = require('../models/commandeModel');
const Produit = require('../models/produitModel');
const Client = require('../models/clientModel');
const Transaction =require('../models/Transaction')
const Caisse =require('../models/caisseModel');
const caisseModel = require('../models/caisseModel');

exports.createCommande = async (req, res) => {
    const { clientId, produits , payments ,remiseGlobale} = req.body;
    console.log(req.body)
    try {
        // Vérifier si le client existe
        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({ message: 'Client non trouvé' });
        }   
const isCaisse=await caisseModel.findOne({isOpen:true}).sort({dateOuverture:-1})
        if(!isCaisse){
           return res.status(404).json({message:'not caisse'})
        }
        const commande = new Commande({
            client: clientId,
            produits,
            payments,
            remiseGlobale,
            caisse:isCaisse._id
        });

        // Sauvegarder la commande
        const newCommande = await commande.save();

        // Mettre à jour le stock des produits
       

        res.status(201).json(newCommande);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAllCommandes = async (req, res) => {
    try {
        const commandes = await Commande.find().populate('client produits.produit');
        res.json(commandes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getByIdCommandes = async (req, res) => {
    try {
        const commandes = await Commande.findById(req.params.id).populate('client produits.produit');
        res.json(commandes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


exports.updateCommande = async (req, res) => {
    
    
    try {
        const { clientId, produits , payments ,remiseGlobale} = req.body;
        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(404).json({ message: 'Client non trouvé' });
        }   

        const commande = await Commande.findByIdAndUpdate(req.params.id,{ clientId, produits , payments ,remiseGlobale},{new:true})

        // Mettre à jour le stock des produits
       

        res.status(201).json(commande);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteByIdCommandes = async (req, res) => {
    try {
        const commande = await Commande.findByIdAndDelete(req.params.id).populate('client produits.produit');
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
        const commande = await Commande.findById(req.params.id).populate('client produits.produit');
        if (!commande) {
            return res.status(404).json({ message: 'commande non trouvé' });
        }  
        console.log(commande)
       let montant=0
       commande.payments.map((e)=>{
        if(e.typePaiement=='Espèces') montant+=e.montant
       })
      console.log(montant)
        const caisse=await Caisse.findOne().sort({dateOuverture:-1})
        if(!caisse)
            return res.status(404).json({message:"caisse n'exite pas"})

        if(montant>0){
            const nouvelleTransaction = new Transaction({ type:'depot', montant,motif:'payer facture', idCaisse:caisse._id });
            await nouvelleTransaction.save();
            
            
            let total=caisse.soldefinale+parseFloat(montant)
    
            caisse.soldefinale=total
            caisse.save()
        }
        commande.status=true
        commande.save()
        res.json(commande);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.payenemt = async (req, res) => {
    try {
        const isCaisse=await caisseModel.findOne({isOpen:true}).sort({dateOuverture:-1})
        if(!isCaisse){
           return res.status(404).json({message:'not caisse'})
        }
        const commandes = (await Commande.find({caisse:isCaisse._id , status:true}).populate('client produits.produit')).map(e=>e.payments)
        const data=[]
        
        commandes.forEach(e=>{
            e.forEach(Element=>data.push(Element))
        })
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};