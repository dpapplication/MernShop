import Service from "../models/serviceModel.js";

// Get all services
export const getAllServices = async (req, res) => {
    try {
        const services = await Service.find({});
        res.status(200).json(services);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new service
export const createService = async (req, res) => {
    try {
        const { nom, prix } = req.body;

        if (!nom || typeof nom !== 'string' || nom.trim().length === 0) {
            return res.status(400).json({ message: 'Invalid service name' });
        }
        if (!prix || typeof prix !== 'number' || prix <= 0) {
            return res.status(400).json({ message: 'Invalid service price' });
        }

        const newService = new Service({ nom, prix });
        const savedService = await newService.save();
        res.status(201).json(savedService);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a service by ID
export const getServiceById = async (req, res) => {
    try {
        const { id } = req.params; // Get ID from route parameters
        if (!id) {
            return res.status(400).json({ message: 'Invalid service ID' });
        }

        const service = await Service.findById(id);
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }
        res.status(200).json(service);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a service
export const updateService = async (req, res) => {
    try {
        const { id } = req.params; // Get ID from route parameters

        if (!id) {
            return res.status(400).json({ message: 'Invalid service ID' });
        }

        const { nom, prix } = req.body;

        if (!nom || typeof nom !== 'string' || nom.trim().length === 0) {
            return res.status(400).json({ message: 'Invalid service name' });
        }

        if (!prix || typeof prix !== 'number' || prix <= 0) {
            return res.status(400).json({ message: 'Invalid service price' });
        }

        const updatedService = await Service.findByIdAndUpdate(
            id,
            { nom, prix },
            { new: true, runValidators: true } // Return updated doc, run validations
        );

        if (!updatedService) {
            return res.status(404).json({ message: 'Service not found' });
        }

        res.status(200).json(updatedService);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a service
export const deleteService = async (req, res) => {
    try {
        const { id } = req.params; // Get ID from route parameters
        if (!id) {
            return res.status(400).json({ message: 'Invalid service ID' });
        }

        const deletedService = await Service.findByIdAndDelete(id);

        if (!deletedService) {
            return res.status(404).json({ message: 'Service not found' });
        }

        res.status(200).json({ message: 'Service deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};