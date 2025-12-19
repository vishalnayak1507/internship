import User from '../../models/User.js';

// PATCH /api/users/:id/status
export async function updateUserStatus(req, res) {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ message: 'isActive must be a boolean.' });
        }
        const user = await User.findByIdAndUpdate(
            id,
            { $set: { isActive } },
            { new: true }
        );
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.json({ message: 'User status updated.', user });
    } catch (err) {
        res.status(500).json({ message: 'Error updating user status.', error: err.message });
    }
}
