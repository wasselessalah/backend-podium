// Script pour peupler la base de données avec des données de test
require("dotenv").config();
const mongoose = require("mongoose");
const Podium = require("./models/Podium");

// Données de test pour le podium
const testData = [
  {
    name: "Les Innovateurs",
    position: 1,
    score: 950,
    team: "Team Alpha",
    category: "team",
  },
  {
    name: "Code Warriors",
    position: 2,
    score: 890,
    team: "Team Beta",
    category: "team",
  },
  {
    name: "Tech Pioneers",
    position: 3,
    score: 850,
    team: "Team Gamma",
    category: "team",
  },
  { name: "Marie Dupont", position: 4, score: 820, category: "individual" },
  {
    name: "Digital Ninjas",
    position: 5,
    score: 800,
    team: "Team Delta",
    category: "team",
  },
  { name: "Jean Martin", position: 6, score: 780, category: "individual" },
  {
    name: "Full Stack Heroes",
    position: 7,
    score: 750,
    team: "Team Epsilon",
    category: "mixed",
  },
  { name: "Sophie Bernard", position: 8, score: 720, category: "individual" },
  {
    name: "Agile Masters",
    position: 9,
    score: 700,
    team: "Team Zeta",
    category: "team",
  },
  { name: "Pierre Dubois", position: 10, score: 680, category: "individual" },
];

// Fonction principale
async function seedDatabase() {
  try {
    console.log("🔄 Connexion à MongoDB...");
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/podium"
    );
    console.log("✅ Connecté à MongoDB");

    // Supprimer les données existantes
    console.log("🗑️  Suppression des données existantes...");
    await Podium.deleteMany({});
    console.log("✅ Données supprimées");

    // Insérer les nouvelles données
    console.log("📝 Insertion des données de test...");
    const inserted = await Podium.insertMany(testData);
    console.log(`✅ ${inserted.length} entrées insérées avec succès`);

    // Afficher les données
    console.log("\n📊 Données du podium:");
    inserted.forEach((entry) => {
      console.log(
        `  ${entry.position}. ${entry.name} - ${entry.score} pts (${entry.category})`
      );
    });

    console.log("\n✨ Base de données initialisée avec succès!");
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation:", error);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Déconnecté de MongoDB");
  }
}

// Exécution
seedDatabase();
