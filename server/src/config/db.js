// src/db.js

//process.env.MONGO_URI
//mongodb://localhost:27017/shopyassine

const Agenda = require('agenda');
const mongoose = require('mongoose');

// Connexion MongoDB
mongoose.connect(process.env.MONGO_URI);

const agenda = new Agenda({
  db: { address: process.env.MONGO_URI, collection: 'agendaJobs' },
  defaultLockLifetime: 60000 // Verrou des jobs (60s)
});

// Définition des jobs
agenda.define('ouvrir caisse', async (job) => {
  try {
    const isCaisse = await mongoose.model('Caisse').findOne().sort({ dateOuverture: -1 });
    
    if (!isCaisse) {
      const newCaisse = await mongoose.model('Caisse').create({
        soldeinitiale: 0,
        soldefinale: 0,
        isOpen: true,
        dateOuverture: new Date()
      });
      console.log(`✅ Caisse ouverte à ${new Date().toLocaleTimeString()}`);
      return newCaisse;
    }

    const newCaisse = await mongoose.model('Caisse').create({
      soldeinitiale: isCaisse.soldefinale,
      soldefinale: isCaisse.soldefinale,
      isOpen: true,
      dateOuverture: new Date()
    });
    console.log(`✅ Caisse ouverte (solde initial: ${isCaisse.soldefinale})`);
    return newCaisse;
  } catch (error) {
    console.error('❌ Erreur ouverture:', error);
    throw error;
  }
});

agenda.define('fermer caisse', async (job) => {
  try {
    const isCaisse = await mongoose.model('Caisse').findOne({ isOpen: true });
    
    if (!isCaisse) {
      console.log('ℹ️ Aucune caisse ouverte à fermer');
      return;
    }

    isCaisse.isOpen = false;
    isCaisse.dateFermeture = new Date();
    await isCaisse.save();
    console.log(`🔒 Caisse fermée à ${new Date().toLocaleTimeString()}`);
    return isCaisse;
  } catch (error) {
    console.error('❌ Erreur fermeture:', error);
    throw error;
  }
});

// Démarrer Agenda après connexion MongoDB
mongoose.connection.once('open', async () => {
  await agenda.start();
  console.log('🔄 Agenda démarré');

  // Planification des jobs
  await agenda.every('5 5 6 * * *', 'ouvrir caisse', {}, {
    timezone: 'Europe/Paris'
  });

  await agenda.every('0 5 6 * * *', 'fermer caisse', {}, {
    timezone: 'Europe/Paris'
  });

  console.log('⏰ Ouverture programmée à 00h00');
  console.log('⏰ Fermeture programmée à 00h00');
});

module.exports = agenda;