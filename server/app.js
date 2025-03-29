// server.js
const express = require('express');
const agenda = require('./src/config/db');
//const connectDB =require('./src/config/db')
require('dotenv').config()
const cron = require('node-cron');
const cors =require('cors')
const app = express();

// Middleware
app.use(cors())
app.use(express.json());
const Caisse = require('./src/models/caisseModel');
const clientRoutes = require('./src/routes/clientRoutes');
const produitRoutes = require('./src/routes/produitRoutes');
const commandeRoutes = require('./src/routes/commandeRoutes');
const factureRoutes = require('./src/routes/factureRoutes');
const paiementRoutes = require('./src/routes/paiementRoutes');
const caisseRoutes = require('./src/routes/caisseRoutes');
const auth=require('./src/routes/authRoutes')
const transactionRoutes = require('./src/routes/transactionRoutes');
const servie =require('./src/routes/serviceRoutes')








// Routes
app.use('/api/user', auth);
app.use('/api/clients', clientRoutes);
app.use('/api/produits', produitRoutes);
app.use('/api/commandes', commandeRoutes);
app.use('/api/factures', factureRoutes);
app.use('/api/paiements', paiementRoutes);
app.use('/api/caisse', caisseRoutes);
app.use('/api/services', servie);
app.use('/api/transaction', transactionRoutes);


// Démarrer le serveur
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});