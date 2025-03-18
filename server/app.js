// server.js
const express = require('express');
const connectDB =require('./src/config/db')
require('dotenv').config()
const cron = require('node-cron');
const cors =require('cors')
const app = express();
connectDB()
// Middleware
app.use(cors())
app.use(express.json());
const clientRoutes = require('./src/routes/clientRoutes');
const produitRoutes = require('./src/routes/produitRoutes');
const commandeRoutes = require('./src/routes/commandeRoutes');
const factureRoutes = require('./src/routes/factureRoutes');
const paiementRoutes = require('./src/routes/paiementRoutes');
const caisseRoutes = require('./src/routes/caisseRoutes');
const auth=require('./src/routes/authRoutes')
const transactionRoutes = require('./src/routes/transactionRoutes');
const tran=require('./src/controllers/caisseController')


// Fonction pour ouvrir la caisse
function ouvrirCaisse() {
    console.log('La caisse est ouverte à', new Date().toLocaleTimeString());
   
}

// Fonction pour fermer la caisse
function fermerCaisse() {
    console.log('La caisse est fermée à', new Date().toLocaleTimeString());
    
}

// Planifier l'ouverture de la caisse à 8h00 chaque jour
cron.schedule('5 23 8 * * *', () => {
    tran.ouvrirCaisse()
    console.log('La caisse est ouverte à', new Date().toLocaleTimeString());
}, {
    timezone: "Europe/Paris" // Remplacez par votre fuseau horaire
});

// Planifier la fermeture de la caisse à 18h00 chaque jour
cron.schedule('0 23 8 * * *', () => {
    tran.fermeCaisse();
    console.log('La caisse est FERME  à', new Date().toLocaleTimeString());
}, {
    timezone: "Europe/Paris" // Remplacez par votre fuseau horaire
});

console.log('Le système de gestion de caisse est en cours d\'exécution...');





// Routes
app.use('/api/user', auth);
app.use('/api/clients', clientRoutes);
app.use('/api/produits', produitRoutes);
app.use('/api/commandes', commandeRoutes);
app.use('/api/factures', factureRoutes);
app.use('/api/paiements', paiementRoutes);
app.use('/api/caisse', caisseRoutes);
app.use('/api/transaction', transactionRoutes);


// Démarrer le serveur
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});