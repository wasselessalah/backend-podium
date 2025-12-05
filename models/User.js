const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Le nom d'utilisateur est obligatoire"],
      unique: true,
      trim: true,
      minlength: [
        3,
        "Le nom d'utilisateur doit contenir au moins 3 caractères",
      ],
      maxlength: [
        50,
        "Le nom d'utilisateur ne peut pas dépasser 50 caractères",
      ],
    },
    email: {
      type: String,
      required: [true, "L'email est obligatoire"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Email invalide"],
    },
    password: {
      type: String,
      required: [true, "Le mot de passe est obligatoire"],
      minlength: [6, "Le mot de passe doit contenir au moins 6 caractères"],
    },
    name: {
      type: String,
      required: [true, "Le nom est obligatoire"],
      trim: true,
      maxlength: [100, "Le nom ne peut pas dépasser 100 caractères"],
    },
    score: {
      type: Number,
      default: 0,
      min: [0, "Le score ne peut pas être négatif"],
    },
    position: {
      type: Number,
      default: null,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    friendRequests: [
      {
        from: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        status: {
          type: String,
          enum: ["pending", "accepted", "rejected"],
          default: "pending",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    category: {
      type: String,
      enum: ["Tech", "Design", "Marketing", "Business"],
      default: "Tech",
    },
    avatar: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour améliorer les performances
userSchema.index({ score: -1 });
userSchema.index({ category: 1, score: -1 });
userSchema.index({ team: 1 });
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });

// Hash du mot de passe avant sauvegarde
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Méthode pour obtenir le rang en format texte
userSchema.methods.getRankText = function () {
  if (!this.position) return "Non classé";

  const ranks = {
    1: "🥇 Premier",
    2: "🥈 Deuxième",
    3: "🥉 Troisième",
  };
  return ranks[this.position] || `${this.position}ème place`;
};

// Méthode pour obtenir les données publiques (sans mot de passe)
userSchema.methods.toPublicJSON = function () {
  return {
    _id: this._id,
    username: this.username,
    name: this.name,
    email: this.email,
    score: this.score,
    position: this.position,
    team: this.team,
    category: this.category,
    avatar: this.avatar,
    isActive: this.isActive,
    createdAt: this.createdAt,
  };
};

// Méthode statique pour obtenir le top 3
userSchema.statics.getTop3 = function (category = null) {
  let query = { isActive: true };
  if (category) query.category = category;

  return this.find(query).sort({ score: -1 }).limit(3).select("-password");
};

// Méthode statique pour recalculer les positions
userSchema.statics.recalculatePositions = async function () {
  const users = await this.find({ isActive: true }).sort({ score: -1 });

  for (let i = 0; i < users.length; i++) {
    users[i].position = i + 1;
    await users[i].save();
  }

  return users;
};

module.exports = mongoose.model("User", userSchema);
