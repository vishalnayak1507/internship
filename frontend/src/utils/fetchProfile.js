export const fetchProfile = async () => {
  try {
    const res = await fetch('http://localhost:8000/api/auth/profile', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
            
     if (data.data.role === "analyst") {
        return {
          name: data.data.name,
          email: data.data.email,
          role: data.data.role,
          department: data.data.department,
          avgResolutionTime: data.data.avgResolutionTime,
          resolvedTicketCount: data.data.resolvedTicketCount,
        };
      }
      // For other roles, return basic info
      return {
        name: data.data.name,
        email: data.data.email,
        role: data.data.role,
        department: data.data.department,
      };
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    return null;
  }
};