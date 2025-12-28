const router = require('express').Router();
const Ticket = require('../models/Ticket');
const User = require('../models/User');

// 1. CREATE TICKET (Student)
// POST /api/tickets
router.post('/', async (req, res) => {
  try {
    // We expect the frontend to send: { studentId, title, description }
    const { studentId, title, description } = req.body;

    const newTicket = new Ticket({
      student: studentId,
      title,
      description,
      status: 'pending'
    });

    const savedTicket = await newTicket.save();
    
    // Populate user details so the frontend sees "Neeraj" instead of just an ID
    const populatedTicket = await savedTicket.populate('student', 'name');

    res.status(201).json(populatedTicket);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. GET ALL TICKETS (Mentor Dashboard)
// GET /api/tickets
router.get('/', async (req, res) => {
  try {
    // Get all tickets, sort by newest first, and show User names
    const tickets = await Ticket.find()
      .populate('student', 'name')
      .populate('mentor', 'name')
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. UPDATE TICKET (Claim / Resolve)
// PATCH /api/tickets/:id
router.patch('/:id', async (req, res) => {
  try {
    const { status, mentorId } = req.body;
    const ticketId = req.params.id;

    // Updates to apply
    let updates = { status };
    
    // If a mentor is claiming it, add their ID
    if (mentorId) {
        updates.mentor = mentorId;
    }
    
    // If resolving, mark the time
    if (status === 'resolved') {
        updates.resolvedAt = new Date();
    }

    const updatedTicket = await Ticket.findByIdAndUpdate(
        ticketId, 
        updates, 
        { new: true } // Return the updated version
    )
    .populate('student', 'name')
    .populate('mentor', 'name');

    res.json(updatedTicket);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;