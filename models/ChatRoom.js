const { ObjectId } = require('mongoose');
const mongoose = require('mongoose');

module.exports.CHAT_ROOM_TYPES = {
    USER_TO_USER: "user-to-user",
    USER_TO_ADMIN: "user-to-admin",
  };
  
  const chatRoomSchema = new mongoose.Schema(
    {
      userIds: Array,
      type: String,
      chatInitiator: ObjectId,
    },
    {
      timestamps: true,
    }
  );

  /**
 * @param {ObjectId} userId - id of user
 * @return {Array} array of all chatroom that the user belongs to
 */
chatRoomSchema.statics.getChatRoomsByUserId = async function (userId) {
    try {
      const rooms = await this.find({ userIds: { $all: [userId] } });
      return rooms;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * @param {ObjectId} roomId - id of chatroom
   * @return {Object} chatroom
   */
  chatRoomSchema.statics.getChatRoomByRoomId = async function (roomId) {
    try {
      const room = await this.findOne({ _id: roomId });
      return room;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * @param {Array} userIds - array of strings of userIds
   * @param {ObjectId} chatInitiator - user who initiated the chat
   * @param {CHAT_ROOM_TYPES} type
   */
  chatRoomSchema.statics.initiateChat = async function (userIds, type, chatInitiator) {
    try {
      const availableRoom = await this.findOne({
        userIds: {
          $size: userIds.length,
          $all: [...userIds],
        },
        type,
      });
      if (availableRoom) {
        return {
          isNew: false,
          message: 'retrieving an old chat room',
          chatRoomId: availableRoom._doc._id,
          type: availableRoom._doc.type,
        };
      }
  
      const newRoom = await this.create({ userIds, type, chatInitiator });
      return {
        isNew: true,
        message: 'creating a new chatroom',
        chatRoomId: newRoom._doc._id,
        type: newRoom._doc.type,
      };
    } catch (error) {
      console.log('error on start chat method', error);
      throw error;
    }
  }
  
const ChatRoom = mongoose.model('chatRoom', chatRoomSchema);

module.exports = ChatRoom;