const mongoose = require('mongoose');

const podiumSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom est obligatoire'],
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  position: {
    type: Number,
    required: [true, 'La position est obligatoire'],
    min: [1, 'La position doit être au minimum 1'],
    max: [10, 'La position ne peut pas dépasser 10']
  },
  score: {
    type: Number,
    default: 0,
    min: [0, 'Le score ne peut pas être négatif']
  },
  team: {
    type: String,
    trim: true,
    maxlength: [50, 'Le nom de l\'équipe ne peut pas dépasser 50 caractères']
  },
  category: {
    type: String,
    enum: ['individual', 'team', 'mixed'],
    default: 'individual'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true // Ajoute createdAt et updatedAt automatiquement
});

// Index pour améliorer les performances des requêtes
podiumSchema.index({ position: 1 });
podiumSchema.index({ category: 1, position: 1 });

// Méthode pour obtenir le rang en format texte
podiumSchema.methods.getRankText = function() {
  const ranks = {
    1: '🥇 Premier',
    2: '🥈 Deuxième', 
    3: '🥉 Troisième'
  };
  return ranks[this.position] || `${this.position}ème place`;
};

// Méthode statique pour obtenir le top 3
podiumSchema.statics.getTop3 = function(category = null) {
  const query = { position: { $lte: 3 }, isActive: true };
  if (category) query.category = category;
  
  return this.find(query).sort({ position: 1 }).limit(3);
};

const Podium = mongoose.model('Podium', podiumSchema);

module.exports = Podium;