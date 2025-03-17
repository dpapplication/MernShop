// src/controllers/caisseController.js
const Caisse = require('../models/caisseModel');

exports.getAllCaisse = async (req, res) => {
    try {
        const caisse=await Caisse.findOne().sort({dateOuverture:-1})
        res.json(caisse);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getopenCaisse= async (req, res) => {
    try {
        const caisse=await Caisse.findOne({isOpen:true}).sort({dateOuverture:-1})
        res.json(caisse);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.ouvrirCaisse=async()=>{
    try {
        const isCaisse=await Caisse.findOne().sort({dateOuverture:-1})
        if(!isCaisse){
            const newCaisse=await Caisse.create({soldeinitiale:0,soldefinale:0})
           return res.status(201).json(newCaisse)
        }

        const newCaisse=await Caisse.create({soldeinitiale:isCaisse.soldefinale,soldefinale:isCaisse.soldefinale})
           return res.status(201).json(newCaisse)
    } catch (error) {
        
    }
}
exports.fermeCaisse=async()=>{
    try {
        const isCaisse=await Caisse.findOne({isOpen:true}).sort({dateOuverture:-1})
        if(!isCaisse){
            const newCaisse=await Caisse.create({soldeinitiale:0,soldefinale:0})
           return res.status(201).json(newCaisse)
        }
        caisse.isOpen=false
        caisse.save()
        
           return res.status(201).json(newCaisse)
    } catch (error) {
        
    }
}