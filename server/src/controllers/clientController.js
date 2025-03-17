// src/controllers/clientController.js
const Client = require('../models/clientModel');

// Récupérer tous les clients
exports.getAllClients = async (req, res) => {
    try {
        const clients = await Client.find();
        res.status(200).json(clients);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Récupérer un client par son ID
exports.getClientById = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) {
            return res.status(404).json({ message: 'Client non trouvé' });
        }
        res.json(client);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Créer un nouveau client
exports.createClient = async (req, res) => {
    const { nom, adresse, telephone } = req.body;

    const client = new Client({
        nom,
        adresse,
        telephone,
    });

    try {
        const newClient = await client.save();
        res.status(201).json(newClient);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Mettre à jour un client
exports.updateClient = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) {
            return res.status(404).json({ message: 'Client non trouvé' });
        }

        if (req.body.nom != null) {
            client.nom = req.body.nom;
        }
        if (req.body.adresse != null) {
            client.adresse = req.body.adresse;
        }
        if (req.body.telephone != null) {
            client.telephone = req.body.telephone;
        }

        const updatedClient = await client.save();
        res.json(updatedClient);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Supprimer un client
exports.deleteClient = async (req, res) => {
    try {
        const client = await Client.findByIdAndDelete(req.params.id);
        if (!client) {
            return res.status(404).json({ message: 'Client non trouvé' });
        }

        
        res.json({ message: 'Client supprimé avec succès' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};