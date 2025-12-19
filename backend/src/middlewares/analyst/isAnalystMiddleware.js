const isAnalyst = async (req, res, next) => {
    const user = req.user;
    if(!user){
        return res.status(401).json({ success: false, message: "Unauthorized: No user found" });
    }
    const role = user.role;
    if(role !== 'analyst'){
        return res.status(403).json({ success: false, message: "Forbidden: You do not have the required permissions because your role is not analyst" });
    }
    next();
}

const ticketOwnership = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user._id;
    
    const ticket = await Ticket.findById(ticketId);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }
    
    // Check if the ticket is assigned to this user
    if (!ticket.assignedTo.equals(userId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to modify this ticket'
      });
    }
    
    req.ticket = ticket;
    next();
  } catch (error) {
    console.error('Ticket authorization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify ticket authorization'
    });
  }
};
export default isAnalyst;
