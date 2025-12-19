import User from '../../models/User.js';

export const updateAnalystPermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { canUpload } = req.body;

    // Only allow updating canUpload for analysts
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.role !== "analyst") {
      return res.status(400).json({ success: false, message: "Only analysts can have upload permission" });
    }

    user.canUpload = !!canUpload;
    await user.save();

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};