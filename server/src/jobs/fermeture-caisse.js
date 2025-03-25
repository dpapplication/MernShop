const Caisse =require('../models/caisseModel')

module.exports= async ({ workerData }) => {
  try {
    console.log(`🔓 Ouverture en cours (${workerData.type})`);
    const caisseOuverte = await Caisse.findOne({ isOpen: true });
    
    if (!caisseOuverte) {
      console.log(`❌ Aucune caisse ouverte trouvée à ${new Date().toLocaleTimeString()}`);
      return { success: false, message: 'Aucune caisse ouverte trouvée' };
    }

    caisseOuverte.isOpen = false;
   // caisseOuverte.dateFermeture = new Date();
    await caisseOuverte.save();
    
    console.log(`🔒 Caisse fermée à ${new Date().toLocaleTimeString()}`);
    return { success: true, caisse: caisseOuverte };
  } catch (error) {
    console.error('Erreur fermeture caisse:', error);
    throw error;
  }
};