import container from '../../container.js';
import { generateAccessToken, verifyAccessToken, generateRefreshToken } from '../../utils/tokenManager.js';
import { requireObjectId } from '../../utils/safeObjectId.js';

export default async function refreshToken(req, res) {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    // Find active session
    const sessionModel = container.make('models/session');
    const session = await sessionModel.findActiveSession(refreshToken);
    
    if (!session) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    // Get user
    const userModel = container.make('models/user');
    const user = await userModel.findById(session.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken({
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      roleSubtype: user.roleSubtype
    });

    const newRefreshToken = generateRefreshToken();

    // Rotate refresh token
    await sessionModel.revokeSession(session._id);
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      ip: req.ip
    };
    await sessionModel.createSession(user._id, newRefreshToken, deviceInfo);

    res.json({
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          roleSubtype: user.roleSubtype
        }
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ message: 'Failed to refresh token' });
  }
}
