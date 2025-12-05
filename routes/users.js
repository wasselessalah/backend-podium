const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Team = require("../models/Team");
const jwt = require("jsonwebtoken");

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Middleware d'authentification pour les routes protégées
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Token manquant",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Utilisateur non trouvé",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: "Token invalide",
    });
  }
};

// POST /api/users/register - Inscription d'un nouvel utilisateur
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, name, team, category } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "Nom d'utilisateur ou email déjà utilisé",
      });
    }

    // Gérer le champ team : si c'est une chaîne, chercher l'équipe par nom
    let teamId = null;
    if (team) {
      if (typeof team === "string") {
        // Chercher l'équipe par nom
        const foundTeam = await Team.findOne({ name: team });
        if (foundTeam) {
          teamId = foundTeam._id;
        }
      } else {
        // Si c'est déjà un ObjectId
        teamId = team;
      }
    }

    // Créer le nouvel utilisateur
    const user = new User({
      username,
      email,
      password,
      name,
      team: teamId,
      category: category || "Tech",
    });

    await user.save();

    // Recalculer les positions
    await User.recalculatePositions();

    // Générer un token JWT
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      message: "Utilisateur créé avec succès",
      data: {
        user: user.toPublicJSON(),
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Erreur lors de l'inscription",
      message: error.message,
    });
  }
});

// POST /api/users/login - Connexion utilisateur
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Trouver l'utilisateur
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Identifiants incorrects",
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Identifiants incorrects",
      });
    }

    // Mettre à jour la dernière connexion
    user.lastLogin = new Date();
    await user.save();

    // Générer un token JWT
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Connexion réussie",
      data: {
        user: user.toPublicJSON(),
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Erreur lors de la connexion",
      message: error.message,
    });
  }
});

// GET /api/users/me - Obtenir les informations de l'utilisateur connecté
router.get("/me", authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.user.toPublicJSON(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération du profil",
      message: error.message,
    });
  }
});

// GET /api/users - Obtenir tous les utilisateurs (classement)
router.get("/", async (req, res) => {
  try {
    const { category, limit = 100 } = req.query;

    let query = { isActive: true };
    if (category) query.category = category;

    const users = await User.find(query)
      .sort({ score: -1, createdAt: 1 })
      .limit(parseInt(limit))
      .select("-password")
      .populate("team", "name");

    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des utilisateurs",
      message: error.message,
    });
  }
});

// GET /api/users/top3 - Obtenir le top 3
router.get("/top3", async (req, res) => {
  try {
    const { category } = req.query;
    const top3 = await User.getTop3(category);

    res.json({
      success: true,
      data: top3,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération du top 3",
      message: error.message,
    });
  }
});

// PUT /api/users/:id/score - Mettre à jour le score (protégé - admin uniquement pour l'instant)
router.put("/:id/score", authMiddleware, async (req, res) => {
  try {
    const { score } = req.body;

    if (typeof score !== "number" || score < 0) {
      return res.status(400).json({
        success: false,
        error: "Score invalide",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { score },
      { new: true, runValidators: true }
    )
      .select("-password")
      .populate("team");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Utilisateur non trouvé",
      });
    }

    // Recalculer les positions des utilisateurs
    await User.recalculatePositions();

    // Si l'utilisateur appartient à une équipe, recalculer le score de l'équipe
    if (user.team) {
      const Team = require("../models/Team");
      const team = await Team.findById(user.team._id).populate(
        "members",
        "score"
      );
      if (team) {
        await team.calculateTotalScore();
        await team.save();
      }
    }

    res.json({
      success: true,
      message: "Score mis à jour avec succès",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Erreur lors de la mise à jour du score",
      message: error.message,
    });
  }
});

// PUT /api/users/me - Mettre à jour son profil
router.put("/me", authMiddleware, async (req, res) => {
  try {
    const { name, email, team, category, avatar } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (team) updates.team = team;
    if (category) updates.category = category;
    if (avatar) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json({
      success: true,
      message: "Profil mis à jour avec succès",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Erreur lors de la mise à jour du profil",
      message: error.message,
    });
  }
});

// PUT /api/users/me/join-team - Rejoindre une équipe
router.put("/me/join-team", authMiddleware, async (req, res) => {
  try {
    const { teamId } = req.body;

    if (!teamId) {
      return res.status(400).json({
        success: false,
        error: "ID de l'équipe requis",
      });
    }

    // Vérifier que l'équipe existe
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        error: "Équipe non trouvée",
      });
    }

    // Vérifier que l'équipe n'est pas pleine
    if (team.members.length >= team.maxMembers) {
      return res.status(400).json({
        success: false,
        error: "L'équipe est complète",
      });
    }

    // Mettre à jour l'utilisateur
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { team: teamId },
      { new: true, runValidators: true }
    )
      .select("-password")
      .populate("team", "name");

    // Ajouter l'utilisateur aux membres de l'équipe s'il n'y est pas déjà
    if (
      !team.members.some(
        (memberId) => memberId.toString() === user._id.toString()
      )
    ) {
      team.members.push(user._id);
      await team.save();
    }

    res.json({
      success: true,
      message: "Vous avez rejoint l'équipe avec succès",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Erreur lors de la jonction à l'équipe",
      message: error.message,
    });
  }
});

// PUT /api/users/me/leave-team - Quitter son équipe
router.put("/me/leave-team", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.team) {
      return res.status(400).json({
        success: false,
        error: "Vous n'êtes pas dans une équipe",
      });
    }

    const teamId = user.team;

    // Retirer l'utilisateur de l'équipe
    const team = await Team.findById(teamId);
    if (team) {
      team.members = team.members.filter(
        (memberId) => memberId.toString() !== user._id.toString()
      );
      await team.save();
    }

    // Mettre à jour l'utilisateur
    user.team = null;
    await user.save();

    const updatedUser = await User.findById(user._id).select("-password");

    res.json({
      success: true,
      message: "Vous avez quitté l'équipe",
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Erreur lors de la sortie de l'équipe",
      message: error.message,
    });
  }
});

// PUT /api/users/:userId/assign-team - Admin assigne un user à une team
router.put("/:userId/assign-team", async (req, res) => {
  try {
    const { teamId } = req.body;
    const { userId } = req.params;

    if (!teamId) {
      return res.status(400).json({
        success: false,
        error: "ID de l'équipe requis",
      });
    }

    // Vérifier que l'équipe existe
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        error: "Équipe non trouvée",
      });
    }

    // Vérifier que l'équipe n'est pas pleine
    if (team.members.length >= team.maxMembers) {
      return res.status(400).json({
        success: false,
        error: "L'équipe est complète",
      });
    }

    // Vérifier que l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Utilisateur non trouvé",
      });
    }

    // Si l'utilisateur était dans une autre équipe, le retirer
    if (user.team) {
      const oldTeam = await Team.findById(user.team).populate(
        "members",
        "score"
      );
      if (oldTeam) {
        oldTeam.members = oldTeam.members.filter(
          (memberId) => memberId.toString() !== user._id.toString()
        );
        await oldTeam.calculateTotalScore();
        await oldTeam.save();
      }
    }

    // Mettre à jour l'utilisateur
    user.team = teamId;
    await user.save();

    // Ajouter l'utilisateur aux membres de l'équipe s'il n'y est pas déjà
    if (
      !team.members.some(
        (memberId) => memberId.toString() === user._id.toString()
      )
    ) {
      team.members.push(user._id);
      await team.populate("members", "score");
      await team.calculateTotalScore();
      await team.save();
    }

    const updatedUser = await User.findById(userId)
      .select("-password")
      .populate("team", "name");

    res.json({
      success: true,
      message: `${user.name} a été assigné à l'équipe ${team.name}`,
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Erreur lors de l'assignation",
      message: error.message,
    });
  }
});

// DELETE /api/users/:id - Supprimer un utilisateur (soft delete)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Utilisateur non trouvé",
      });
    }

    // Recalculer les positions
    await User.recalculatePositions();

    res.json({
      success: true,
      message: "Utilisateur supprimé avec succès",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Erreur lors de la suppression",
      message: error.message,
    });
  }
});

// POST /api/users/:id/friend-request - Envoyer une demande d'ami
router.post("/:id/friend-request", authMiddleware, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: "Utilisateur non trouvé",
      });
    }

    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: "Vous ne pouvez pas vous ajouter comme ami",
      });
    }

    // Vérifier si déjà amis
    if (currentUser.friends.includes(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Vous êtes déjà amis",
      });
    }

    // Vérifier si une demande existe déjà
    const existingRequest = targetUser.friendRequests.find(
      (req) => req.from.toString() === currentUser._id.toString()
    );

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        error: "Demande déjà envoyée",
      });
    }

    // Ajouter la demande
    targetUser.friendRequests.push({
      from: currentUser._id,
      status: "pending",
    });

    await targetUser.save();

    res.json({
      success: true,
      message: "Demande d'ami envoyée",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Erreur lors de l'envoi de la demande",
      message: error.message,
    });
  }
});

// PUT /api/users/friend-requests/:requestId - Accepter/Rejeter une demande d'ami
router.put("/friend-requests/:requestId", authMiddleware, async (req, res) => {
  try {
    const { action } = req.body; // "accept" ou "reject"
    const user = await User.findById(req.user._id);

    const request = user.friendRequests.id(req.params.requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        error: "Demande non trouvée",
      });
    }

    if (action === "accept") {
      // Ajouter aux amis des deux utilisateurs
      user.friends.push(request.from);
      await user.save();

      const friendUser = await User.findById(request.from);
      friendUser.friends.push(user._id);
      await friendUser.save();

      // Retirer la demande
      request.remove();
      await user.save();

      return res.json({
        success: true,
        message: "Demande d'ami acceptée",
      });
    } else if (action === "reject") {
      request.remove();
      await user.save();

      return res.json({
        success: true,
        message: "Demande d'ami rejetée",
      });
    }

    res.status(400).json({
      success: false,
      error: "Action invalide",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Erreur lors du traitement de la demande",
      message: error.message,
    });
  }
});

// GET /api/users/me/friends - Obtenir la liste de ses amis
router.get("/me/friends", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "friends",
      "username name score position category"
    );

    res.json({
      success: true,
      data: user.friends,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des amis",
      message: error.message,
    });
  }
});

// GET /api/users/me/friend-requests - Obtenir ses demandes d'ami
router.get("/me/friend-requests", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "friendRequests.from",
      "username name category"
    );

    res.json({
      success: true,
      data: user.friendRequests.filter((req) => req.status === "pending"),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des demandes",
      message: error.message,
    });
  }
});

// DELETE /api/users/friends/:friendId - Retirer un ami
router.delete("/friends/:friendId", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const friend = await User.findById(req.params.friendId);

    if (!friend) {
      return res.status(404).json({
        success: false,
        error: "Ami non trouvé",
      });
    }

    // Retirer des deux côtés
    user.friends = user.friends.filter(
      (id) => id.toString() !== req.params.friendId
    );
    friend.friends = friend.friends.filter(
      (id) => id.toString() !== req.user._id.toString()
    );

    await user.save();
    await friend.save();

    res.json({
      success: true,
      message: "Ami retiré",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Erreur lors de la suppression de l'ami",
      message: error.message,
    });
  }
});

module.exports = router;
module.exports.authMiddleware = authMiddleware;
