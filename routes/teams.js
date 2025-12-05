const express = require("express");
const router = express.Router();
const Team = require("../models/Team");
const User = require("../models/User");
const { authenticateToken } = require("../middleware/auth");

// GET /api/teams - Récupérer toutes les équipes
router.get("/", async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = { isActive: true };

    if (category && category !== "all") {
      query.category = category;
    }

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const teams = await Team.find(query)
      .populate("creator", "username name")
      .populate("members", "username name score");

    // Recalculer les scores de chaque équipe basés sur les scores des membres
    for (const team of teams) {
      await team.calculateTotalScore();
      await team.save();
    }

    // Trier après le recalcul
    teams.sort((a, b) => b.totalScore - a.totalScore);

    res.json({
      success: true,
      data: teams,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des équipes",
      message: error.message,
    });
  }
});

// GET /api/teams/:id - Récupérer une équipe spécifique
router.get("/:id", async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate("creator", "username name email")
      .populate("members", "username name score category")
      .populate("joinRequests.user", "username name");

    if (!team) {
      return res.status(404).json({
        success: false,
        error: "Équipe non trouvée",
      });
    }

    // Recalculer le score total basé sur les membres
    await team.calculateTotalScore();
    await team.save();

    res.json({
      success: true,
      data: team,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération de l'équipe",
      message: error.message,
    });
  }
});

// POST /api/teams - Créer une équipe (authentification requise)
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { name, description, category, maxMembers, invites, isAdminCreate } =
      req.body;

    // Si c'est une création admin, ne pas ajouter le créateur comme membre
    if (isAdminCreate) {
      const team = new Team({
        name,
        description,
        category,
        maxMembers: maxMembers || 10,
        creator: req.user.id,
        members: [], // Pas de membres au début pour admin
        invites: invites || [],
      });

      await team.save();
      await team.populate("creator", "username name");

      return res.status(201).json({
        success: true,
        data: team,
        message: "Équipe créée avec succès",
      });
    }

    // Création normale par utilisateur
    const user = await User.findById(req.user.id);
    if (user.team) {
      return res.status(400).json({
        success: false,
        error: "Vous êtes déjà dans une équipe",
      });
    }

    // Créer l'équipe avec invités
    const team = new Team({
      name,
      description,
      category,
      maxMembers: maxMembers || 10,
      creator: req.user.id,
      members: [req.user.id],
      invites: invites || [],
    });

    await team.save();

    // Mettre à jour l'utilisateur
    user.team = team._id;
    await user.save();

    await team.populate("creator", "username name");
    await team.populate("members", "username name score");

    res.status(201).json({
      success: true,
      data: team,
      message: "Équipe créée avec succès",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Ce nom d'équipe existe déjà",
      });
    }
    res.status(500).json({
      success: false,
      error: "Erreur lors de la création de l'équipe",
      message: error.message,
    });
  }
});

// PUT /api/teams/:id - Modifier une équipe (créateur uniquement)
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { name, description, category, maxMembers, invites } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        error: "Équipe non trouvée",
      });
    }

    // Vérifier si l'utilisateur est le créateur
    if (team.creator.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "Seul le créateur peut modifier l'équipe",
      });
    }

    // Mettre à jour les champs
    if (name) team.name = name;
    if (description !== undefined) team.description = description;
    if (category) team.category = category;
    if (maxMembers) team.maxMembers = maxMembers;
    if (invites !== undefined) team.invites = invites;

    await team.save();
    await team.populate("creator", "username name");
    await team.populate("members", "username name score");

    res.json({
      success: true,
      data: team,
      message: "Équipe modifiée avec succès",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Ce nom d'équipe existe déjà",
      });
    }
    res.status(500).json({
      success: false,
      error: "Erreur lors de la modification de l'équipe",
      message: error.message,
    });
  }
});

// POST /api/teams/:id/join - Demander à rejoindre une équipe
router.post("/:id/join", authenticateToken, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    const user = await User.findById(req.user.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        error: "Équipe non trouvée",
      });
    }

    if (user.team) {
      return res.status(400).json({
        success: false,
        error: "Vous êtes déjà dans une équipe",
      });
    }

    // Vérifier si une demande existe déjà
    const existingRequest = team.joinRequests.find(
      (req) => req.user.toString() === user._id.toString()
    );

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        error: "Vous avez déjà une demande en attente",
      });
    }

    // Ajouter la demande
    team.joinRequests.push({
      user: user._id,
      status: "pending",
    });

    await team.save();

    res.json({
      success: true,
      message: "Demande envoyée avec succès",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Erreur lors de l'envoi de la demande",
      message: error.message,
    });
  }
});

// PUT /api/teams/:id/requests/:requestId - Accepter/Rejeter une demande (créateur uniquement)
router.put("/:id/requests/:requestId", authenticateToken, async (req, res) => {
  try {
    const { status } = req.body; // "approved" ou "rejected"
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        error: "Équipe non trouvée",
      });
    }

    // Vérifier si l'utilisateur est le créateur
    if (team.creator.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "Seul le créateur peut gérer les demandes",
      });
    }

    const request = team.joinRequests.id(req.params.requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        error: "Demande non trouvée",
      });
    }

    if (status === "approved") {
      // Ajouter le membre
      await team.addMember(request.user);

      // Mettre à jour l'utilisateur
      await User.findByIdAndUpdate(request.user, { team: team._id });

      // Retirer la demande
      request.remove();
      await team.save();

      return res.json({
        success: true,
        message: "Membre ajouté avec succès",
      });
    } else if (status === "rejected") {
      request.remove();
      await team.save();

      return res.json({
        success: true,
        message: "Demande rejetée",
      });
    }

    res.status(400).json({
      success: false,
      error: "Statut invalide",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Erreur lors du traitement de la demande",
      message: error.message,
    });
  }
});

// DELETE /api/teams/:id/leave - Quitter une équipe
router.delete("/:id/leave", authenticateToken, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    const user = await User.findById(req.user.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        error: "Équipe non trouvée",
      });
    }

    // Vérifier si l'utilisateur est dans l'équipe
    if (!team.members.includes(user._id)) {
      return res.status(400).json({
        success: false,
        error: "Vous n'êtes pas membre de cette équipe",
      });
    }

    // Le créateur ne peut pas quitter
    if (team.creator.toString() === user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: "Le créateur ne peut pas quitter l'équipe. Supprimez-la plutôt.",
      });
    }

    // Retirer le membre
    await team.removeMember(user._id);

    // Mettre à jour l'utilisateur
    user.team = null;
    await user.save();

    res.json({
      success: true,
      message: "Vous avez quitté l'équipe",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Erreur lors de la sortie de l'équipe",
      message: error.message,
    });
  }
});

// DELETE /api/teams/:id - Supprimer une équipe (créateur uniquement)
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        error: "Équipe non trouvée",
      });
    }

    if (team.creator.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "Seul le créateur peut supprimer l'équipe",
      });
    }

    // Retirer l'équipe de tous les membres
    await User.updateMany({ team: team._id }, { $set: { team: null } });

    await team.deleteOne();

    res.json({
      success: true,
      message: "Équipe supprimée avec succès",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Erreur lors de la suppression de l'équipe",
      message: error.message,
    });
  }
});

// PUT /api/teams/:id/score - Mettre à jour le score d'une équipe (admin uniquement)
router.put("/:id/score", authenticateToken, async (req, res) => {
  try {
    const { score } = req.body;

    // Vérifier si l'utilisateur est admin (à implémenter selon votre logique)
    // Pour l'instant, on suppose que c'est dans req.user.role

    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        error: "Équipe non trouvée",
      });
    }

    team.totalScore = score;
    team.calculateAverageScore();
    await team.save();

    res.json({
      success: true,
      data: team,
      message: "Score mis à jour avec succès",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Erreur lors de la mise à jour du score",
      message: error.message,
    });
  }
});

module.exports = router;
