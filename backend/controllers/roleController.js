import Role from "../models/role.js";
import { parseJDIntelligence } from "../services/jdIntelligenceService.js";
import { getEmbedding } from "../services/semanticMatchingService.js";

export const getRoles = async (req, res) => {
  try {
    const roles = await Role.find({ isActive: true });
    res.status(200).json({ success: true, count: roles.length, data: roles });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error fetching roles' });
  }
};

export const createRole = async (req, res) => {
  console.log("📥 Received create role request:", req.body);
  try {
    const { title, description } = req.body;
    if (!title) {
      console.log("❌ Missing role title");
      return res.status(400).json({ success: false, error: 'Title is required' });
    }
    
    let role = await Role.findOne({ title });
    if (role) {
      console.log(`⚠️ Role "${title}" already exists`);
      return res.status(400).json({ success: false, error: 'Role already exists' });
    }
    
    console.log("🔍 Parsing JD...");
    const intelligence = await parseJDIntelligence(description || title);
    
    console.log("🧠 Generating embeddings...");
    const embedding = await getEmbedding(description || title);
    
    console.log("💾 Saving role...");
    role = await Role.create({ 
      title, 
      description,
      ...intelligence,
      embedding
    });

    console.log("✅ Role saved successfully:", role.title);
    res.status(201).json({ success: true, data: role });
  } catch (error) {
    console.error("🔥 Create Role Error:", error);
    res.status(500).json({ success: false, error: error.message || "An unexpected error occurred while creating the role." });
  }
};

export const deleteRole = async (req, res) => {
    try {
        await Role.findOneAndDelete({ title: req.params.title });
        res.status(200).json({ success: true, data: {} });
    } catch(err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

export const deleteRoleById = async (req, res) => {
    try {
        const deleted = await Role.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ success: false, error: "Role not found" });
        res.status(200).json({ success: true, message: "Role deleted successfully" });
    } catch(err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

export const deleteAllRoles = async (req, res) => {
    try {
        await Role.deleteMany({});
        res.status(200).json({ success: true, message: "All roles cleared" });
    } catch(err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
