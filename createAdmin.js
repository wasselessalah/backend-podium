require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("./models/Admin");

// Données du super admin
const superAdminData = {
  username: "superadmin",
  password: "Admin@2025",
  role: "superadmin",
};

// Fonction pour créer le super admin
async function createSuperAdmin() {
  try {
    console.log("🔄 Connexion à MongoDB...");
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb+srv://smootmri_db_user:mJ2bGkGp5GtRsULN@cluster1.jlxlx6j.mongodb.net/podium"
    );
    console.log("✅ Connecté à MongoDB");

    // Vérifier si le super admin existe déjà
    const existingAdmin = await Admin.findOne({
      username: superAdminData.username,
    });

    if (existingAdmin) {
      console.log("⚠️  Le super admin existe déjà");
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Role: ${existingAdmin.role}`);
    } else {
      // Créer le super admin
      const admin = new Admin(superAdminData);
      await admin.save();

      console.log("✅ Super admin créé avec succès!");
      console.log("");
      console.log("📝 Identifiants de connexion:");
      console.log(`   Username: ${superAdminData.username}`);
      console.log(`   Password: ${superAdminData.password}`);
      console.log("");
      console.log(
        "⚠️  IMPORTANT: Changez le mot de passe après la première connexion!"
      );
    }
  } catch (error) {
    console.error("❌ Erreur:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Déconnecté de MongoDB");
  }
}

// Exécution
createSuperAdmin();
