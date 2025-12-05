const mongoose = require("mongoose");
require("dotenv").config();
const Admin = require("./models/Admin");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/podium_dev";

async function seedAdmin() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connecté à MongoDB");

    // Vérifier si un superadmin existe déjà
    const existingAdmin = await Admin.findOne({ username: "superadmin" });
    if (existingAdmin) {
      console.log("⚠️  Le superadmin existe déjà");
      console.log("Username: superadmin");
      console.log(
        "Pour le mot de passe, consultez la documentation ou réinitialisez-le"
      );
      process.exit(0);
    }

    // Créer un superadmin par défaut
    const admin = new Admin({
      username: "superadmin",
      password: "Admin123!", // Sera hashé automatiquement par le model
      role: "superadmin",
      isActive: true,
    });

    await admin.save();

    console.log("✅ Superadmin créé avec succès!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📋 Informations de connexion:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Username: superadmin");
    console.log("Password: Admin123!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("⚠️  IMPORTANT: Changez ce mot de passe en production!");
    console.log("");
    console.log("🌐 Accédez au dashboard admin:");
    console.log("http://localhost:3001/admin/login");

    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur lors de la création de l'admin:", error.message);
    process.exit(1);
  }
}

seedAdmin();
