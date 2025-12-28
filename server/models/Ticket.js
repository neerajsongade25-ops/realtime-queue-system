const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  mentor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    default: null 
  },
  title: { type: String, required: true }, // e.g., "MERN Auth Error"
  description: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'active', 'resolved'], 
    default: 'pending' 
  },
  // Timestamps for Analytics
  resolvedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);