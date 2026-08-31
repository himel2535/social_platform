function buildConversationId(userIdA, userIdB) {
  return [userIdA.toString(), userIdB.toString()].sort().join('_');
}

function getOtherParticipantId(conversationId, userId) {
  const userIdStr = userId.toString();
  const [first, second] = conversationId.split('_');

  if (first === userIdStr) {
    return second;
  }

  if (second === userIdStr) {
    return first;
  }

  return null;
}

function isParticipant(conversationId, userId) {
  return getOtherParticipantId(conversationId, userId) !== null;
}

module.exports = {
  buildConversationId,
  getOtherParticipantId,
  isParticipant,
};
