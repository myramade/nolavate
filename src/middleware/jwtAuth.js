
export default function jwtAuth(requiredRole, optional = false, subRole = null) {
  return (req, res, next) => {
    // Mock JWT validation - replace with actual JWT validation
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token && !optional) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (token) {
      // Mock token payload - replace with actual JWT verification
      req.token = {
        sub: 'mock-user-id',
        name: 'Mock User',
        role: requiredRole,
        roleSubtype: subRole
      };
    }
    
    next();
  };
}
