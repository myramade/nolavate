
export default function validateRequest(req, res, next) {
  // Basic request validation - expand as needed
  if (req.body && typeof req.body !== 'object') {
    return res.status(400).json({ message: 'Invalid request body' });
  }
  next();
}
