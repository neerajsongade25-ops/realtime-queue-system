const router = require('express').Router();
const Ticket = require('../models/Ticket');

// 1. CREATE TICKET (Student)
router.post('/', async (req, res) => {
  try {
    const { studentId, title, description } = req.body;

    const newTicket = new Ticket({
      student: studentId,
      title,
      description,
      status: 'pending'
    });

    const savedTicket = await newTicket.save();
    const populatedTicket = await savedTicket.populate('student', 'name');

    // 🔥 REAL-TIME ALERT: Tell everyone a new ticket exists!
    req.io.emit('new_ticket', populatedTicket);

    res.status(201).json(populatedTicket);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. GET ALL TICKETS
router.get('/', async (req, res) => {
  try {
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
router.patch('/:id', async (req, res) => {
  try {
    const { status, mentorId } = req.body;
    const ticketId = req.params.id;

    let updates = { status };
    if (mentorId) updates.mentor = mentorId;
    if (status === 'resolved') updates.resolvedAt = new Date();

    const updatedTicket = await Ticket.findByIdAndUpdate(
        ticketId, 
        updates, 
        { new: true }
    )
    .populate('student', 'name')
    .populate('mentor', 'name');

    // 🔥 REAL-TIME ALERT: Tell everyone a ticket status changed!
    req.io.emit('ticket_updated', updatedTicket);

    res.json(updatedTicket);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;