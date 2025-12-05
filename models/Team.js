const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Le nom de l'équipe est obligatoire"],
      unique: true,
      trim: true,
      minlength: [3, "Le nom doit contenir au moins 3 caractères"],
      maxlength: [50, "Le nom ne peut pas dépasser 50 caractères"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "La description ne peut pas dépasser 500 caractères"],
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    invites: [
      {
        email: {
          type: String,
          required: true,
          trim: true,
          lowercase: true,
        },
        name: {
          type: String,
          required: true,
          trim: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    category: {
      type: String,
      enum: ["Tech", "Design", "Marketing", "Business"],
      required: true,
    },
    totalScore: {
      type: Number,
      default: 0,
      min: [0, "Le score ne peut pas être négatif"],
    },
    averageScore: {
      type: Number,
      default: 0,
    },
    maxMembers: {
      type: Number,
      default: 10,
      min: [2, "Une équipe doit avoir au moins 2 membres"],
      max: [50, "Une équipe ne peut pas avoir plus de 50 membres"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    joinRequests: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        requestedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Calculer le score total à partir des scores des membres
teamSchema.methods.calculateTotalScore = async function () {
  if (this.members.length === 0) {
    this.totalScore = 0;
    this.averageScore = 0;
  } else {
    // Populate les membres pour accéder à leurs scores
    await this.populate("members");

    // Calculer la somme des scores des membres
    const total = this.members.reduce((sum, member) => {
      return sum + (member.score || 0);
    }, 0);

    this.totalScore = total;
    this.averageScore = total / this.members.length;
  }
  return this.totalScore;
};

// Calculer le score moyen automatiquement
teamSchema.methods.calculateAverageScore = function () {
  if (this.members.length === 0) {
    this.averageScore = 0;
  } else {
    this.averageScore = this.totalScore / this.members.length;
  }
  return this.averageScore;
};

// Ajouter un membre
teamSchema.methods.addMember = async function (userId) {
  if (!this.members.includes(userId)) {
    if (this.members.length >= this.maxMembers) {
      throw new Error("L'équipe est complète");
    }
    this.members.push(userId);
    await this.save();
  }
};

// Retirer un membre
teamSchema.methods.removeMember = async function (userId) {
  this.members = this.members.filter(
    (member) => member.toString() !== userId.toString()
  );
  await this.save();
};

module.exports = mongoose.model("Team", teamSchema);
