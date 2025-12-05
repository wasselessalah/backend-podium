const mongoose = require("mongoose");
const Admin = require("./models/Admin");

async function checkAdmins() {
  try {
    console.log("🔄 Connexion à MongoDB...");
    await mongoose.connect("mongodb://localhost:27017/podium");
    console.log("✅ Connecté à MongoDB\n");

    const admins = await Admin.find();

    if (admins.length === 0) {
      console.log("❌ Aucun admin trouvé dans la base de données");
    } else {
      console.log(`✅ ${admins.length} admin(s) trouvé(s):\n`);
      admins.forEach((admin, index) => {
        console.log(`📌 Admin ${index + 1}:`);
        console.log(`   Username: ${admin.username}`);
        console.log(`   Role: ${admin.role}`);
        console.log(`   Active: ${admin.isActive}`);
        console.log(`   Créé le: ${admin.createdAt}`);
        console.log(
          `   Mot de passe hashé: ${admin.password.substring(0, 20)}...`
        );
        console.log("");
      });
    }

    await mongoose.disconnect();
    console.log("👋 Déconnecté de MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    process.exit(1);
  }
}

checkAdmins();
