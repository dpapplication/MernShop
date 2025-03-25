const Caisse =require('../models/caisseModel')

module.exports= async ({ workerData }) => {
  try {
    console.log(`🔓 Ouverture en cours (${workerData.type})`);
    const lastCaisse = await Caisse.findOne().sort({ dateOuverture: -1 });
    
    if (!lastCaisse) {
      const newCaisse = await Caisse.create({
        soldeinitiale: 0,
        soldefinale: 0,
        isOpen: true,
        dateOuverture: new Date()
      });
      console.log(`✅ Caisse ouverte à ${new Date().toLocaleTimeString()}`);
      return { success: true, caisse: newCaisse };
    }

    const newCaisse = await Caisse.create({
      soldeinitiale: lastCaisse.soldefinale,
      soldefinale: lastCaisse.soldefinale,
      isOpen: true,
      dateOuverture: new Date()
    });
    
    console.log(`✅ Caisse ouverte à ${new Date().toLocaleTimeString()}`);
    return { success: true, caisse: newCaisse };
  } catch (error) {
    console.error('Erreur ouverture caisse:', error);
    throw error;
  }
};