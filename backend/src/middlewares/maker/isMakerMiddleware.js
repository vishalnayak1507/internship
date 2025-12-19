const isMaker = async (req, res, next) => {
    const user = req.user;
    if(!user){
        return res.status(401).json({ success: false, message: "Unauthorized: No user found" });
    }
    const role = user.role;
    if(role !== 'maker'){
        return res.status(403).json({ success: false, message: "Forbidden: You do not have the required permissions because your role is not maker" });
    }
    next();
}

export default isMaker;