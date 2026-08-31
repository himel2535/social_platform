const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function authenticateSocket(socket, next) {
  try {
    let token = socket.handshake.auth?.token;

    if (!token && socket.handshake.headers.authorization?.startsWith('Bearer ')) {
      token = socket.handshake.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new Error('Unauthorized'));
    }

    if (!process.env.JWT_SECRET) {
      return next(new Error('Unauthorized'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(new Error('Unauthorized'));
    }

    socket.user = user;
    next();
  } catch {
    next(new Error('Unauthorized'));
  }
}

module.exports = authenticateSocket;
