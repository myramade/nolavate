import container from '../../container.js';

export default async function logout(req, res) {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const sessionModel = container.make('models/session');
    const session = await sessionModel.findActiveSession(refreshToken);
    
    if (session) {
      await sessionModel.revokeSession(session._id);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Failed to logout' });
  }
}
