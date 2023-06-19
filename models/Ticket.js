const { ObjectId } = require('mongoose');
const mongoose = require('mongoose');

const TICKET_TYPE = {
BUG_REPORT: "bug report",
};

const ticketSchema = new mongoose.Schema(
    {
    userId: {
        type: ObjectId,
        required: [true, 'You must be logged in to create a ticket'], 
    },
    fullName:{
        type: String,
        required: [true, 'Please enter a full name'],
    },
    email: {
        type: String,
        required: [true, 'Please enter email address'],
    },
    type: {
        type: String,
        required: [true, 'Please enter a Ticket Type'],
    },
    subject: {
        type: String,
        required: [true, 'Please enter a Ticket subject/title'],
    },
    content: {
        type: String,
        required: [true, 'Content section cannot be empty'],
    },
    },

    {timestamps: true}
);

  /**
 * @param {ObjectId} userId - id of user
 * @return {Array} array of all tickets that the user has created
 */
   ticketSchema.statics.getTickets = async function (userId) {
    try {
      const tickets = await this.find({ userId: userId });
      return tickets;
    } catch (error) {
      throw error;
    }
  }


  /**
   * 
   * @param {ObjectId} userId - id of user
   * @param {String} fullName - first and last name of user
   * @param {String} email - user email address
   * @param {String} type - ticket type - bug report by default
   * @param {String} subject - subject/title of ticket
   * @param {String} content - text content of ticket/report
   * @returns {Ticket} - return a new ticket that was created 
   */
  ticketSchema.statics.createTicket = async function(userId, fullName, email, type, subject, content) {
      try {
        const ticket = await Ticket.create({userId, fullName, email, type, subject, content });
        return {
            message: 'creating a new ticket',
            userId: ticket._doc.userId,
            fullName: ticket._doc.fullName,
            email: ticket._doc.email,
            type: ticket._doc.type,
            subject: ticket._doc.subject,
            content: ticket._doc.content,
          };

      } catch(error) {
        console.log('error on create ticket method', error);
        throw error;
      }
  }

const Ticket = mongoose.model('ticket', ticketSchema);

module.exports = Ticket;