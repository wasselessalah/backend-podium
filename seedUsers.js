const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

// Données de test pour les utilisateurs
const usersData = [
  {
    username: "john_doe",
    email: "john@example.com",
    password: "User123!",
    name: "John Doe",
    score: 950,
    category: "Tech",
  },
  {
    username: "jane_smith",
    email: "jane@example.com",
    password: "User123!",
    name: "Jane Smith",
    score: 880,
    category: "Design",
  },
  {
    username: "mike_wilson",
    email: "mike@example.com",
    password: "User123!",
    name: "Mike Wilson",
    score: 820,
    category: "Tech",
  },
  {
    username: "sarah_jones",
    email: "sarah@example.com",
    password: "User123!",
    name: "Sarah Jones",
    score: 765,
    category: "Marketing",
  },
  {
    username: "david_brown",
    email: "david@example.com",
    password: "User123!",
    name: "David Brown",
    score: 710,
    category: "Business",
  },
  {
    username: "emma_davis",
    email: "emma@example.com",
    password: "User123!",
    name: "Emma Davis",
    score: 680,
    category: "Tech",
  },
  {
    username: "chris_martin",
    email: "chris@example.com",
    password: "User123!",
    name: "Chris Martin",
    score: 625,
    category: "Design",
  },
  {
    username: "lisa_taylor",
    email: "lisa@example.com",
    password: "User123!",
    name: "Lisa Taylor",
    score: 590,
    category: "Marketing",
  },
  {
    username: "robert_white",
    email: "robert@example.com",
    password: "User123!",
    name: "Robert White",
    score: 540,
    category: "Business",
  },
  {
    username: "amy_garcia",
    email: "amy@example.com",
    password: "User123!",
    name: "Amy Garcia",
    score: 495,
    category: "Tech",
  },
];

async function seedUsers() {
  try {
    console.log("🔄 Connexion à MongoDB...");
    const MONGODB_URI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/podium";
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connecté à MongoDB\n");

    // Supprimer les utilisateurs existants
    console.log("🗑️  Suppression des utilisateurs existants...");
    await User.deleteMany({});
    console.log("✅ Utilisateurs supprimés\n");

    // Insérer les nouveaux utilisateurs (avec .save() pour déclencher le hash du password)
    console.log("📝 Insertion des nouveaux utilisateurs...");
    const users = [];
    for (const userData of usersData) {
      const user = new User(userData);
      await user.save(); // Déclenche le pre-save hook pour hasher le password
      users.push(user);
    }
    console.log(`✅ ${users.length} utilisateurs créés avec succès!\n`);

    // Recalculer les positions
    console.log("🔄 Recalcul des positions...");
    await User.recalculatePositions();
    console.log("✅ Positions recalculées!\n");

    // Afficher le classement
    const sortedUsers = await User.find({ isActive: true })
      .sort({ score: -1 })
      .select("-password");

    console.log("🏆 CLASSEMENT DES UTILISATEURS:");
    console.log("═".repeat(80));
    sortedUsers.forEach((user, index) => {
      const medal =
        index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "  ";
      console.log(
        `${medal} #${user.position} | ${user.name.padEnd(
          20
        )} | Score: ${user.score.toString().padEnd(4)} | ${user.category.padEnd(
          10
        )} | ${user.team}`
      );
    });
    console.log("═".repeat(80));

    console.log("\n📋 IDENTIFIANTS DE TEST:");
    console.log("═".repeat(80));
    console.log("Username: john_doe     | Password: User123!");
    console.log("Username: jane_smith   | Password: User123!");
    console.log("Username: mike_wilson  | Password: User123!");
    console.log("═".repeat(80));
    console.log("\n💡 Utilisez ces identifiants pour vous connecter!\n");

    console.log("👋 Déconnexion de MongoDB...");
    await mongoose.disconnect();
    console.log("✅ Script terminé avec succès!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedUsers();
