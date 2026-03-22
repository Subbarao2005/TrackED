import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  const headerToken = req.header('Authorization');
  if (!headerToken) {
    return res.status(401).json({ message: 'No token found in Authorization header. Access Denied.' });
  }

  try {
    const tokenOptions = headerToken.startsWith('Bearer ') ? headerToken.split(' ')[1] : headerToken;
    const decoded = jwt.verify(tokenOptions, process.env.JWT_SECRET || 'secret');
    req.user = decoded; // Append the verified user { id, role } to the request object!
    next(); // Pass to the actual controller
  } catch (err) {
    res.status(401).json({ message: 'Token is invalid or expired. Access Denied.' });
  }
};

export default authMiddleware;
