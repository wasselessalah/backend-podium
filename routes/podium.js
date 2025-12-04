const express = require('express');
const router = express.Router();
const Podium = require('../models/Podium');

// GET /api/podium - Récupérer toutes les entrées du podium
router.get('/', async (req, res) => {
  try {
    const { category, limit = 10 } = req.query;
    
    let query = { isActive: true };
    if (category) query.category = category;
    
    const podiumEntries = await Podium.find(query)
      .sort({ position: 1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      count: podiumEntries.length,
      data: podiumEntries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des données',
      message: error.message
    });
  }
});

// GET /api/podium/top3 - Récupérer le top 3
router.get('/top3', async (req, res) => {
  try {
    const { category } = req.query;
    const top3 = await Podium.getTop3(category);
    
    res.json({
      success: true,
      data: top3
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du top 3',
      message: error.message
    });
  }
});

// GET /api/podium/:id - Récupérer une entrée spécifique
router.get('/:id', async (req, res) => {
  try {
    const podiumEntry = await Podium.findById(req.params.id);
    
    if (!podiumEntry) {
      return res.status(404).json({
        success: false,
        error: 'Entrée du podium non trouvée'
      });
    }
    
    res.json({
      success: true,
      data: podiumEntry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'entrée',
      message: error.message
    });
  }
});

// POST /api/podium - Créer une nouvelle entrée du podium
router.post('/', async (req, res) => {
  try {
    const { name, position, score, team, category } = req.body;
    
    // Vérifier si la position est déjà prise
    const existingEntry = await Podium.findOne({ position, isActive: true });
    if (existingEntry) {
      return res.status(400).json({
        success: false,
        error: `La position ${position} est déjà occupée par ${existingEntry.name}`
      });
    }
    
    const newPodiumEntry = new Podium({
      name,
      position,
      score,
      team,
      category
    });
    
    const savedEntry = await newPodiumEntry.save();
    
    res.status(201).json({
      success: true,
      data: savedEntry,
      message: 'Entrée du podium créée avec succès'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Erreur lors de la création de l\'entrée',
      message: error.message
    });
  }
});

// PUT /api/podium/:id - Mettre à jour une entrée
router.put('/:id', async (req, res) => {
  try {
    const { name, position, score, team, category } = req.body;
    
    // Si la position change, vérifier qu'elle n'est pas déjà prise
    if (position) {
      const existingEntry = await Podium.findOne({ 
        position, 
        isActive: true,
        _id: { $ne: req.params.id }
      });
      
      if (existingEntry) {
        return res.status(400).json({
          success: false,
          error: `La position ${position} est déjà occupée par ${existingEntry.name}`
        });
      }
    }
    
    const updatedEntry = await Podium.findByIdAndUpdate(
      req.params.id,
      { name, position, score, team, category },
      { new: true, runValidators: true }
    );
    
    if (!updatedEntry) {
      return res.status(404).json({
        success: false,
        error: 'Entrée du podium non trouvée'
      });
    }
    
    res.json({
      success: true,
      data: updatedEntry,
      message: 'Entrée mise à jour avec succès'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Erreur lors de la mise à jour',
      message: error.message
    });
  }
});

// DELETE /api/podium/:id - Supprimer une entrée (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const deletedEntry = await Podium.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!deletedEntry) {
      return res.status(404).json({
        success: false,
        error: 'Entrée du podium non trouvée'
      });
    }
    
    res.json({
      success: true,
      message: 'Entrée supprimée avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression',
      message: error.message
    });
  }
});

module.exports = router;