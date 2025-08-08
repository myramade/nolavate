
import jwt from 'jsonwebtoken';

export default function jwtAuth(requiredRole, optional = false, subRole = null) {
  return (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token && !optional) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        // Validate role if required
        if (requiredRole && decoded.role !== requiredRole) {
          return res.status(403).json({ message: 'Insufficient permissions' });
        }
        
        // Validate sub-role if specified
        if (subRole && decoded.roleSubtype !== subRole) {
          return res.status(403).json({ message: 'Insufficient permissions' });
        }
        
        req.token = decoded;
        next();
      } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
      }
    } else {
      next();
    }
  };
}
