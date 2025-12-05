const mongoose = require("mongoose");
const User = require("./models/User");
const Team = require("./models/Team");

require("dotenv").config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/podium";

async function seedDatabase() {
  try {
    console.log("📦 Connexion à MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connecté à MongoDB\n");

    // 1. Supprimer la collection "podiums" si elle existe
    console.log("🗑️ Nettoyage de la base de données...");
    try {
      await mongoose.connection.db.dropCollection("podiums");
      console.log("✅ Collection 'podiums' supprimée");
    } catch (error) {
      if (error.message.includes("ns not found")) {
        console.log("ℹ️ Collection 'podiums' n'existe pas");
      } else {
        throw error;
      }
    }

    // 2. Supprimer toutes les équipes existantes
    await Team.deleteMany({});
    console.log("✅ Anciennes équipes supprimées\n");

    // 3. Récupérer tous les users
    const users = await User.find({}).limit(10);
    console.log(`📊 ${users.length} utilisateurs trouvés\n`);

    if (users.length === 0) {
      console.log(
        "⚠️ Aucun utilisateur trouvé. Créez des utilisateurs d'abord."
      );
      process.exit(0);
    }

    // 4. Créer des équipes de test
    const teams = [
      {
        name: "Les Innovateurs Tech",
        description:
          "Équipe spécialisée dans l'innovation technologique et le développement web moderne",
        category: "Tech",
        maxMembers: 15,
        creator: users[0]?._id,
        members: users.slice(0, 3).map((u) => u._id),
        totalScore: 1250,
        invites: [
          { name: "Marie Dupont", email: "marie.dupont@email.com" },
          { name: "Pierre Martin", email: "pierre.martin@email.com" },
        ],
      },
      {
        name: "Creative Design Studio",
        description: "Experts en design UI/UX et création graphique",
        category: "Design",
        maxMembers: 12,
        creator: users[1]?._id,
        members: users.slice(1, 4).map((u) => u._id),
        totalScore: 980,
        invites: [
          { name: "Sophie Bernard", email: "sophie.bernard@email.com" },
        ],
      },
      {
        name: "Marketing Masters",
        description: "Stratégies marketing digitales et growth hacking",
        category: "Marketing",
        maxMembers: 10,
        creator: users[2]?._id,
        members: users.slice(2, 5).map((u) => u._id),
        totalScore: 850,
        invites: [
          { name: "Luc Petit", email: "luc.petit@email.com" },
          { name: "Emma Rousseau", email: "emma.rousseau@email.com" },
          { name: "Tom Lefebvre", email: "tom.lefebvre@email.com" },
        ],
      },
      {
        name: "Business Ninjas",
        description: "Développement business et stratégie d'entreprise",
        category: "Business",
        maxMembers: 20,
        creator: users[3]?._id,
        members: users.slice(3, 6).map((u) => u._id),
        totalScore: 1100,
        invites: [],
      },
      {
        name: "Full Stack Warriors",
        description:
          "Développeurs full-stack passionnés par les nouvelles technologies",
        category: "Tech",
        maxMembers: 8,
        creator: users[4]?._id,
        members: users.slice(4, 7).map((u) => u._id),
        totalScore: 1420,
        invites: [{ name: "Alice Moreau", email: "alice.moreau@email.com" }],
      },
      {
        name: "Brand Builders",
        description:
          "Construction de marques fortes et identités visuelles impactantes",
        category: "Design",
        maxMembers: 10,
        creator: users[5]?._id,
        members: users.slice(5, 8).map((u) => u._id),
        totalScore: 720,
        invites: [
          { name: "Hugo Blanc", email: "hugo.blanc@email.com" },
          { name: "Léa Garnier", email: "lea.garnier@email.com" },
        ],
      },
    ];

    console.log("🌱 Création des équipes...\n");

    for (const teamData of teams) {
      const team = new Team(teamData);
      await team.save();
      team.calculateAverageScore();
      await team.save();

      // Mettre à jour les utilisateurs membres
      await User.updateMany(
        { _id: { $in: teamData.members } },
        { $set: { team: team._id } }
      );

      console.log(`✅ Équipe créée: "${team.name}"`);
      console.log(`   - Membres: ${team.members.length}`);
      console.log(`   - Invités: ${team.invites.length}`);
      console.log(`   - Score: ${team.totalScore}`);
      console.log("");
    }

    console.log("\n🎉 Base de données initialisée avec succès!");
    console.log(`📊 ${teams.length} équipes créées`);
    console.log("\n✨ Collections conservées:");
    console.log("   - users");
    console.log("   - admins");
    console.log("   - teams");

    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur:", error);
    process.exit(1);
  }
}

seedDatabase();
