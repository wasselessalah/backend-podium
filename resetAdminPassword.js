const mongoose = require("mongoose");
require("dotenv").config();
const Admin = require("./models/Admin");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb+srv://smootmri_db_user:mJ2bGkGp5GtRsULN@cluster1.jlxlx6j.mongodb.net/podium";

async function resetAdminPassword() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connecté à MongoDB");

    // Trouver l'admin
    const admin = await Admin.findOne({ username: "superadmin" });

    if (!admin) {
      console.log("❌ Superadmin introuvable. Exécutez seedAdmin.js d'abord.");
      process.exit(1);
    }

    // Réinitialiser le mot de passe
    admin.password = "Admin123!"; // Sera hashé automatiquement par le pre-save hook
    await admin.save();

    console.log("✅ Mot de passe réinitialisé avec succès!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📋 Informations de connexion:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Username: superadmin");
    console.log("Password: Admin123!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");
    console.log("🌐 Accédez au dashboard admin:");
    console.log("http://localhost:3001/admin/login");

    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    process.exit(1);
  }
}

resetAdminPassword();
