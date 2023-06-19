const { Router } = require('express');
const chatRoomController = require('../controllers/chatRoomController');
const chatRoom = require('../models/ChatRoom');
const { cookieAuth } = require('../middleware/authMiddleware');
const { checkUsersExist } = require('../middleware/chatMiddleware');
const router = Router();

router.get('/all-conversations', cookieAuth, chatRoomController.getRecentConversations);
router.get('/:roomId/room', cookieAuth, chatRoomController.getConversationByRoomId);
router.post('/initiate-chatroom', cookieAuth, checkUsersExist, chatRoomController.initiate);
router.post('/:roomId/message', cookieAuth, chatRoomController.postMessage);
router.put('/:roomId/mark-read', cookieAuth, chatRoomController.markConversationReadByRoomId);
router.delete('/room/:roomId', cookieAuth, chatRoomController.deleteRoomById);
router.delete('/message/:messageId', cookieAuth, chatRoomController.deleteMessageById);

module.exports = router;
