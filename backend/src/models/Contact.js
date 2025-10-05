const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  metadata: {
    userAgent: { type: String, trim: true },
    ipAddress: { type: String, trim: true },
  },
}, { timestamps: true });

module.exports = mongoose.model('Contact', contactSchema);
