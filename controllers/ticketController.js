const Ticket = require('../models/Ticket')
const User = require('../models/User');
const mongoose = require('mongoose');
const app = require('../app');
const {ObjectId} = require('mongodb');
const assert = require('assert');
const { getUser } = require('./users');

module.exports.showTickets = async(req, res) => {
    try {
        const currentLoggedInUser = ObjectId(req.params.userId);
        assert(currentLoggedInUser, "no signed in user id provided.");
        
        const tickets = await Ticket.getTickets(currentLoggedInUser);

        return res.status(200).json({ success: true, tickets });
    } catch(error) {
        return res.status(500).json({ success: false, error: error});
    }
}

module.exports.createTicket = async(req, res) => {
    try {
        const currentLoggedInUser = ObjectId(req.params.userId);
        assert(currentLoggedInUser, "no signed in user id provided.");

        const user = await User.findById(currentLoggedInUser);
        console.log("user: ", user);

        const {type, subject, content,} = req.body;

        const ticket = await Ticket.createTicket(currentLoggedInUser, user.firstName + " " + user.lastName,
         user.email, type, subject, content);
        return res.status(200).json({ success: true, ticket});
    }
    catch(error) {
        return res.status(500).json({ success: false, error: error });
    }
}