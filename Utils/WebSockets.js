const jwt = require('jsonwebtoken');

class WebSockets {
    users = [];
    connection(client) {
      
      //subscribeToRoom
      console.log("client socketId: ", client.id, " has connected.");
      /**
       * when client emits 'subscribe', 
       * a room is created with the user and the other user
       * use case: first message 
       */
      client.on("subscribe", (room, otherUserId = "", callback) => {
        client.join(room);
        console.log(`SUBSCRIBE: subscribed ${client} to ${room}`);

        //this.subscribeOtherUser(room, otherUserId);
        
        //subscribe other user
        const userSockets = this.users.filter(
          (user) => user.userId === otherUserId
        );
        userSockets.map((userInfo) => {
          const otherUserSocket =  io.of('/').sockets.get(userInfo.socketId);
          if (otherUserSocket){
            otherUserSocket.join(room);
            console.log(`SUBSCRIBE: subscribed ${client} (otherUser) to ${room}`);
          }
          else {
            console.error("subscribing other user socket: " + userInfo.socketId + " failed");
          }
        });
        //end subscribe other user
        
        callback({
          status: "ok"
        });
      });

      client.on("disconnect", () => {
        console.log("server: ", client.id + " has disconnected");
        if (typeof this.users != 'undefined'){
          this.users = this.users.filter((user) => user.socketId != client.id);
        }
      });
      
      // add identity of user mapped to the socket id
      client.on("submit-identity", (userId, callback) => {
        if (typeof this.users == 'undefined'){
          this.users = [];
        }
        this.users = this.users.filter((user) => user.userId != userId);

        this.users.push({
          socketId: client.id,
          userId: userId,
        });
        console.log('users: ', this.users);
        callback({
          status: "ok"
        });
      });
      
      /*
      // mute a chat room
      client.on("unsubscribe", (room) => {
        console.log("a user has unsubscribed.");
        client.leave(room);
      });
      */
    }

  }
  
  module.exports = new WebSockets(); 