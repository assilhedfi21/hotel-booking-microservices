const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const { publishEvent, TOPICS } = require('./kafka/producer');

// Helper: calculate total price
const calcTotalPrice = (checkIn, checkOut, pricePerNight) => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const nights = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  return Math.round(nights * pricePerNight * 100) / 100;
};

const formatBooking = (b, success = true, message = '') => ({
  id: b.id,
  user_id: b.user_id,
  hotel_id: b.hotel_id,
  hotel_name: b.hotel_name,
  room_type: b.room_type,
  check_in: b.check_in,
  check_out: b.check_out,
  price_per_night: b.price_per_night,
  total_price: b.total_price,
  guests: b.guests,
  status: b.status,
  created_at: b.created_at,
  success,
  message
});

const BookingService = {
  // Create booking
  CreateBooking: async (call, callback) => {
    try {
      const { user_id, hotel_id, hotel_name, room_type, check_in, check_out, price_per_night, guests } = call.request;

      if (!user_id || !hotel_id || !hotel_name || !room_type || !check_in || !check_out || !price_per_night) {
        return callback(null, { success: false, message: 'Missing required fields' });
      }

      const id = uuidv4();
      const total_price = calcTotalPrice(check_in, check_out, price_per_night);
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO bookings (id, user_id, hotel_id, hotel_name, room_type, check_in, check_out,
          price_per_night, total_price, guests, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)
      `).run(id, user_id, hotel_id, hotel_name, room_type, check_in, check_out,
        price_per_night, total_price, guests || 1, now, now);

      const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);

      // Publish Kafka event
      await publishEvent(TOPICS.BOOKING_CREATED, {
        bookingId: id,
        userId: user_id,
        hotelId: hotel_id,
        hotelName: hotel_name,
        roomType: room_type,
        checkIn: check_in,
        checkOut: check_out,
        totalPrice: total_price,
        guests: guests || 1,
        status: 'PENDING'
      });

      console.log(`[BookingService] Booking created: ${id}`);
      callback(null, formatBooking(booking, true, 'Booking created successfully'));
    } catch (err) {
      console.error('[BookingService] CreateBooking error:', err);
      callback(null, { success: false, message: err.message });
    }
  },

  // Get booking by ID
  GetBooking: (call, callback) => {
    try {
      const { id } = call.request;
      const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);

      if (!booking) {
        return callback(null, { success: false, message: 'Booking not found' });
      }

      callback(null, formatBooking(booking, true, 'Booking found'));
    } catch (err) {
      console.error('[BookingService] GetBooking error:', err);
      callback(null, { success: false, message: err.message });
    }
  },

  // Get user bookings
  GetUserBookings: (call, callback) => {
    try {
      const { user_id } = call.request;
      const bookings = db.prepare('SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC').all(user_id);

      callback(null, {
        bookings: bookings.map(b => formatBooking(b)),
        success: true,
        message: `Found ${bookings.length} bookings`
      });
    } catch (err) {
      console.error('[BookingService] GetUserBookings error:', err);
      callback(null, { bookings: [], success: false, message: err.message });
    }
  },

  // Get all bookings
  GetAllBookings: (call, callback) => {
    try {
      const bookings = db.prepare('SELECT * FROM bookings ORDER BY created_at DESC').all();

      callback(null, {
        bookings: bookings.map(b => formatBooking(b)),
        success: true,
        message: `Found ${bookings.length} bookings`
      });
    } catch (err) {
      console.error('[BookingService] GetAllBookings error:', err);
      callback(null, { bookings: [], success: false, message: err.message });
    }
  },

  // Update booking status
  UpdateBookingStatus: async (call, callback) => {
    try {
      const { id, status } = call.request;
      const validStatuses = ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'];

      if (!validStatuses.includes(status)) {
        return callback(null, { success: false, message: `Invalid status. Valid values: ${validStatuses.join(', ')}` });
      }

      const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
      if (!booking) {
        return callback(null, { success: false, message: 'Booking not found' });
      }

      const now = new Date().toISOString();
      db.prepare('UPDATE bookings SET status = ?, updated_at = ? WHERE id = ?').run(status, now, id);

      const updated = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);

      // Publish Kafka event
      const topic = status === 'CONFIRMED' ? TOPICS.BOOKING_CONFIRMED : TOPICS.BOOKING_UPDATED;
      await publishEvent(topic, {
        bookingId: id,
        userId: booking.user_id,
        hotelName: booking.hotel_name,
        status,
        checkIn: booking.check_in,
        checkOut: booking.check_out
      });

      console.log(`[BookingService] Booking ${id} status updated to ${status}`);
      callback(null, formatBooking(updated, true, `Booking status updated to ${status}`));
    } catch (err) {
      console.error('[BookingService] UpdateBookingStatus error:', err);
      callback(null, { success: false, message: err.message });
    }
  },

  // Cancel booking
  CancelBooking: async (call, callback) => {
    try {
      const { id, reason } = call.request;
      const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);

      if (!booking) {
        return callback(null, { success: false, message: 'Booking not found' });
      }

      if (booking.status === 'CANCELLED') {
        return callback(null, { success: false, message: 'Booking already cancelled' });
      }

      const now = new Date().toISOString();
      db.prepare('UPDATE bookings SET status = ?, cancel_reason = ?, updated_at = ? WHERE id = ?')
        .run('CANCELLED', reason || 'No reason provided', now, id);

      const updated = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);

      // Publish Kafka event
      await publishEvent(TOPICS.BOOKING_CANCELLED, {
        bookingId: id,
        userId: booking.user_id,
        hotelName: booking.hotel_name,
        reason: reason || 'No reason provided',
        checkIn: booking.check_in,
        checkOut: booking.check_out
      });

      console.log(`[BookingService] Booking cancelled: ${id}`);
      callback(null, formatBooking(updated, true, 'Booking cancelled successfully'));
    } catch (err) {
      console.error('[BookingService] CancelBooking error:', err);
      callback(null, { success: false, message: err.message });
    }
  }
};

module.exports = BookingService;