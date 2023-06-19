const ChatRoom = require('../models/ChatRoom')
const Message = require('../models/Message');
const User = require('../models/User');
const mongoose = require('mongoose');
const app = require('../app');
const assert = require('assert');
const {ObjectId} = require('mongodb');

module.exports.initiate = async (req, res) => {
    try {
        const chatInitiator = req.userId;
        const { userIds, type} = req.body;
        const allUserIds = [...userIds, chatInitiator].map( x => ObjectId(x));
        const chatRoom = await ChatRoom.initiateChat(allUserIds, type, chatInitiator);
        return res.status(200).json({ success: true, chatRoom });
    }
    catch(error) {
        return res.status(500).json({ success: false, error: error });
    }
}

module.exports.deleteRoomById = async (req, res) => {
  try {
    const {roomId} = req.params;
    const room = await ChatRoom.deleteOne({_id: ObjectId(roomId)});
    const messages = await Message.deleteMany({chatRoomId: ObjectId(roomId)});
    return res.status(200).json({
      success: true,
      message: "Deleted room and related messages",
      deletedRoomsCount: room.deletedCount,
      deletedMessagesCount: messages.deletedCount
    });
  }
  catch (error) {
    return res.status(500).json({success: false, error: error});
  }
}

module.exports.deleteMessageById = async (req, res) => {
 try {
   const {messageId} = req.params;
   const message = await Message.deleteOne({_id: ObjectId(messageId) });
   return res.status(200).json({
      success:true,
      deleteMessagesCount: message.deletedCount
   });
 } catch(error) {
  return res.status(500).json({success: false, error: error})
 }
}


module.exports.getRecentConversations = async (req, res) => {
    try {
        const _currentLoggedInUser = req.userId;
        assert(_currentLoggedInUser, "no signed in user id provided.");
        const currentLoggedInUser = ObjectId(_currentLoggedInUser);

        const options = {
          page: parseInt(req.query.page) || 0,
          limit: parseInt(req.query.limit) || 10,
        };

        const rooms = await ChatRoom.getChatRoomsByUserId(currentLoggedInUser);
        const roomIds = rooms.map(room => ObjectId(room._id));
        const recentConversation = await Message.getRecentConversation(
          roomIds, options, currentLoggedInUser
        );
        return res.status(200).json({ success: true, conversation: recentConversation });
      } catch (error) {
        return res.status(500).json({ success: false, error: error });
      }
}

module.exports.getConversationByRoomId = async (req, res) => {
  try {
      const { roomId } = req.params;
      const room = await ChatRoom.getChatRoomByRoomId(roomId);

      if (!room) {
        return res.status(400).json({success: false, message: 'No room exists for this id', });
      }
      const users = await User.getUsersByIds(room.userIds);

      const options = {
        page: parseInt(req.query.page) || 0,
        limit: parseInt(req.query.limit) || 10,
      };

      const conversation = await Message.getConversationByRoomId(ObjectId(roomId), options);

      return res.status(200).json({success: true, conversation, users});
    } catch (error) {
      return res.status(500).json({ success: false, error });
    }
}

module.exports.postMessage = async (req, res) => {
    try {
        const roomId = req.params.roomId;

        const messagePayload = {
          messageText: req.body.messageBody
        };
        const currentLoggedInUser = req.userId;

        if (!ObjectId.isValid(currentLoggedInUser)){
          return res.status({success: false, error: "User id is not valid."});
        }

        const post = await Message.createMessageInChatRoom(ObjectId(roomId), messagePayload, ObjectId(currentLoggedInUser));
        //to every socket in the room, emit a new message
        global.io.sockets.in(roomId).emit('new message', {
          message: post,
          sentBy: currentLoggedInUser
        });
        return res.status(200).json({ success: true, post });
      } catch (error) {
        return res.status(500).json({ success: false, error: error })
      }
},

module.exports.markConversationReadByRoomId = async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.userId;
        const room = await ChatRoom.getChatRoomByRoomId(ObjectId(roomId))

        if (!room) {
          return res.status(400).json({success: false, message: 'No room exists for this id'})
        }

        const result = await Message.markMessageRead(ObjectId(roomId), ObjectId(userId));
        return res.status(200).json({ success: true, data: result });
      } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, error });
      }
}
