// src/models/caisseModel.js
const mongoose = require('mongoose');

const caisseSchema = new mongoose.Schema({
    soldeinitiale: { type: Number, default: 0 },
    soldefinale: { type: Number},
    dateOuverture:{type:Date, default:Date.now()},
    isOpen:{type:Boolean,default:true}
});

module.exports = mongoose.model('Caisse', caisseSchema);