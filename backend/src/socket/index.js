const authenticateSocket = require('./auth');
const { registerMessageHandlers, getUserRoom } = require('./message.handlers');
const notificationService = require('../services/notification.service');

module.exports = function initSocket(io) {
  notificationService.setSocketIo(io);
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    socket.join(getUserRoom(userId));

    registerMessageHandlers(io, socket);

    socket.on('disconnect', () => {
      socket.leave(getUserRoom(userId));
    });
  });
};
