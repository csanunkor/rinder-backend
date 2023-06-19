const { Router } = require('express');
const ticketController = require('../controllers/ticketController');

const router = Router();

router.get('/ticket/:userId/showAll', ticketController.showTickets);
router.post('/ticket/:userId/create', ticketController.createTicket);

module.exports = router;