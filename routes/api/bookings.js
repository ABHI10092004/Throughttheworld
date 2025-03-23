const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const Booking = require('../../models/Booking');
const User = require('../../models/User');

// @route   POST api/bookings
// @desc    Create a booking
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('type', 'Type is required').isIn(['flight', 'car', 'bus', 'train', 'hotel']),
      check('price.amount', 'Price amount is required').isNumeric()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const newBooking = new Booking({
        user: req.user.id,
        type: req.body.type,
        details: req.body.details,
        price: req.body.price,
        status: req.body.status || 'confirmed'
      });

      const booking = await newBooking.save();

      res.json(booking);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/bookings
// @desc    Get all bookings for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/bookings/:id
// @desc    Get booking by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }
    
    // Check user ownership
    if (booking.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    
    res.json(booking);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Booking not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/bookings/:id
// @desc    Update booking
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    let booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }
    
    // Check user ownership
    if (booking.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    
    // Update booking fields
    const { type, details, price, status } = req.body;
    
    if (type) booking.type = type;
    if (details) booking.details = details;
    if (price) booking.price = price;
    if (status) booking.status = status;
    
    await booking.save();
    
    res.json(booking);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Booking not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/bookings/:id
// @desc    Delete booking
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }
    
    // Check user ownership
    if (booking.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    
    await booking.remove();
    
    res.json({ msg: 'Booking removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Booking not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/bookings/cancel/:id
// @desc    Cancel a booking
// @access  Private
router.put('/cancel/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ msg: 'Booking not found' });
    }
    
    // Check user ownership
    if (booking.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    
    booking.status = 'cancelled';
    
    await booking.save();
    
    res.json(booking);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Booking not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router; 