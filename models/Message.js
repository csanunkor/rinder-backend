const { ObjectId } = require('mongoose');
const mongoose = require('mongoose');

const MESSAGE_TYPES = {
    TYPE_TEXT: "text",
  };
  
  const readByRecipientSchema = new mongoose.Schema(
    {
      _id: false,
      readByUserId: ObjectId,
    },
    {
      timestamps: true,
    }
  );

const messageSchema = new mongoose.Schema( 
    { 
        sender: ObjectId,
        messageBody: mongoose.Schema.Types.Mixed,
        chatRoomId: ObjectId,
        type: {
            type: String,
            default: () => MESSAGE_TYPES.TYPE_TEXT,
        },
        readByRecipients: [readByRecipientSchema],
    },
    {timestamps: true}
);

/**
 * Create a message in chat room
 * @param {ObjectId} roomId - id of chat room
 * @param {Object} messageBody - message you want to post in the chat room
 * @param {ObjectId} sender - user who is posting the message
 */
messageSchema.statics.createMessageInChatRoom = async function (chatRoomId, messageBody, sender) {
  try {
    const post = await this.create({
      chatRoomId,
      messageBody,
      sender,
      readByRecipients: { readByUserId: sender }
    });

    const aggregate = await this.aggregate([
      {
        $match: {_id: post._id }
      },
      {
        '$lookup': {
          'from': 'users', 
          'let': {
            'myId': '$sender'
          }, 
          'pipeline': [
            {
              '$match': {
                '$expr': {
                  '$eq': [
                    '$_id', '$$myId'
                  ]
                }
              }
            }, {
              '$project': {
                'password': 0
              }
            }
          ], 
          'as': 'sender'
        }
      },
      {
        $unwind: '$sender'
      }
    ]);
    return aggregate[0]; //will always return 1 item, so just return the first item.
}
catch (error) {
  throw error;
}
}

/*
 messageSchema.statics.createMessageInChatRoom = async function (chatRoomId, messageBody, sender) {
    try {
      const post = await this.create({
        chatRoomId,
        messageBody,
        sender,
        readByRecipients: { readByUserId: sender }
      });

      const aggregate = await this.aggregate([
        {
          $match: {_id: post._id }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'sender',
            foreignField: '_id',
            as: 'postedByUser'
          }
        },
        {
          $unwind: '$postedByUser'
        },
        {
          $lookup: {
            from: 'chatrooms',
            localField: 'chatRoomId',
            foreignField: '_id',
            as: 'chatRoomInfo'
          }
        },
        {
          $unwind: '$chatRoomInfo' 
        },
        {
          $unwind: '$chatRoomInfo.userIds'
        },
        {
          $lookup: {
            from: 'users',
            localField: 'chatRoomInfo.userIds',
            foreignField: '_id',
            as: 'chatRoomInfo.userProfile',
          }
        },
        { 
          $unwind: '$chatRoomInfo.userProfile'
        },
        //chatRoomInfo, show the user information that are in the chat room
        //also show the readByUser information
        {
          $group: {
            _id: '$chatRoomInfo._id',
            postId: { $last: '$_id' },
            chatRoomId: { $last: '$chatRoomInfo._id' },
            messageBody: { $last: '$messageBody' },
            type: { $last: '$type' },
            sender: { $last: '$sender' },
            readByRecipients: { $last: '$readByRecipients' },
            chatRoomInfo: { $addToSet: '$chatRoomInfo.userProfile' },
            createdAt: { $last: '$createdAt' },
            updatedAt: { $last: '$updatedAt' },
          }
        }
      ]);
      return aggregate[0]; //will always return 1 item, so just return the first item.
  }
  catch (error) {
    throw error;
  }
}
*/

  /**
 * @param {ObjectId} chatRoomId - chat room id
 */
messageSchema.statics.getConversationByRoomId = async function (chatRoomId, options = {}) {
    try {
      const aggregate = this.aggregate([
        { $match: { chatRoomId } },
        
        { $sort: { createdAt: -1 } },
        // do a join on another table called users, and 
        // get me a user whose _id = sender
        {
          $lookup: {
            from: 'users',
            localField: 'sender',
            foreignField: '_id',
            as: 'sender',
          }
        },
        { $unwind: "$sender" },
        // apply pagination
        { $skip: options.page * options.limit },
        { $limit: options.limit },
        { $sort: { createdAt: 1 } },
        
      ]);

      return aggregate;
    } catch (error) {
      throw error;
    }
  }

/**
 * @param {ObjectId} chatRoomId - chat room id
 * @param {ObjectId} loggedOnUserId - user id
 */
 messageSchema.statics.markMessageRead = async function (chatRoomId, loggedOnUserId) {
    try {
      return this.updateMany(
        {
          chatRoomId,
          'readByRecipients.readByUserId': { $ne: loggedOnUserId }
        },
        {
          $addToSet: {
            readByRecipients: { readByUserId: loggedOnUserId }
          }
        },
        {
          multi: true
        }
      );
    } catch (error) {
      throw error;
    }
  }

  /**
 * @param {Array} chatRoomIds - chat room ids
 * @param {{ page, limit }} options - pagination options
 * @param {ObjectId} loggedOnUserId - user id
 */
messageSchema.statics.getRecentConversation = async function (chatRoomIds, options, loggedOnUserId) {
    try {
      return this.aggregate([
        { $match: { chatRoomId: { $in: chatRoomIds } } },
        {
          $group: {
            _id: '$chatRoomId',
            messageId: { $last: '$_id' },
            chatRoomId: { $last: '$chatRoomId' },
            messageBody: { $last: '$messageBody' },
            type: { $last: '$type' },
            sender: { $last: '$sender' },
            createdAt: { $last: '$createdAt' },
            readByRecipients: { $last: '$readByRecipients' },
          }
        },
        { $sort: { createdAt: -1 } },
        // do a join on another table called users, and 
        // get me a user whose _id = sender
        {
          $lookup: {
            from: 'users',
            localField: 'sender',
            foreignField: '_id',
            as: 'sender',
          }
        },
        { $unwind: "$sender" },
        // do a join on another table called chatrooms, and 
        // get room details
        {
          $lookup: {
            from: 'chatrooms',
            localField: '_id',
            foreignField: '_id',
            as: 'roomInfo',
          }
        },
        { $unwind: "$roomInfo" },
        { $unwind: "$roomInfo.userIds" },
        // do a join on another table called users 
        {
          $lookup: {
            from: 'users',
            localField: 'roomInfo.userIds',
            foreignField: '_id',
            as: 'roomInfo.userProfile',
          }
        },
        { $unwind: "$readByRecipients" },
        // do a join on another table called users 
        {
          $lookup: {
            from: 'users',
            localField: 'readByRecipients.readByUserId',
            foreignField: '_id',
            as: 'readByRecipients.readByUser',
          }
        },
  
        {
          $group: {
            _id: '$roomInfo._id',
            messageId: { $last: '$messageId' },
            chatRoomId: { $last: '$chatRoomId' },
            messageBody: { $last: '$messageBody' },
            type: { $last: '$type' },
            sender: { $last: '$sender' },
            readByRecipients: { $addToSet: '$readByRecipients' },
            roomInfo: { $addToSet: '$roomInfo.userProfile' },
            createdAt: { $last: '$createdAt' },
          },
        },
        // apply pagination
        { $skip: options.page * options.limit },
        { $limit: options.limit },
      ]);
    } catch (error) {
      throw error;
    }
  }

const Message = mongoose.model('message', messageSchema);

module.exports = Message;