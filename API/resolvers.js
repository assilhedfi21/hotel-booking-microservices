const userClient = require('../grpc-clients/userClient');
const bookingClient = require('../grpc-clients/bookingClient');
const notifClient = require('../grpc-clients/notifClient');

const resolvers = {
  // ─── User Queries ──────────────────────────────────────────────────────────
  users: async () => {
    return await userClient.getAllUsers({});
  },

  user: async ({ id }) => {
    return await userClient.getUser({ id });
  },

  // ─── Booking Queries ───────────────────────────────────────────────────────
  bookings: async () => {
    return await bookingClient.getAllBookings({});
  },

  booking: async ({ id }) => {
    return await bookingClient.getBooking({ id });
  },

  userBookings: async ({ userId }) => {
    return await bookingClient.getUserBookings({ user_id: userId });
  },

  // ─── Notification Queries ──────────────────────────────────────────────────
  notifications: async () => {
    return await notifClient.getAllNotifications({});
  },

  userNotifications: async ({ userId }) => {
    return await notifClient.getUserNotifications({ user_id: userId });
  },

  // ─── User Mutations ────────────────────────────────────────────────────────
  registerUser: async ({ name, email, password, phone }) => {
    return await userClient.createUser({ name, email, password, phone: phone || '' });
  },

  loginUser: async ({ email, password }) => {
    return await userClient.authenticateUser({ email, password });
  },

  updateUser: async ({ id, name, email, phone }) => {
    return await userClient.updateUser({ id, name: name || '', email: email || '', phone: phone || '' });
  },

  deleteUser: async ({ id }) => {
    return await userClient.deleteUser({ id });
  },

  // ─── Booking Mutations ─────────────────────────────────────────────────────
  createBooking: async ({ user_id, hotel_id, hotel_name, room_type, check_in, check_out, price_per_night, guests }) => {
    return await bookingClient.createBooking({
      user_id, hotel_id, hotel_name, room_type,
      check_in, check_out, price_per_night,
      guests: guests || 1
    });
  },

  updateBookingStatus: async ({ id, status }) => {
    return await bookingClient.updateBookingStatus({ id, status });
  },

  cancelBooking: async ({ id, reason }) => {
    return await bookingClient.cancelBooking({ id, reason: reason || '' });
  },

  // ─── Notification Mutations ────────────────────────────────────────────────
  sendNotification: async ({ user_id, type, title, message, booking_id }) => {
    return await notifClient.sendNotification({
      user_id, type, title, message,
      booking_id: booking_id || ''
    });
  },

  markNotificationAsRead: async ({ id }) => {
    return await notifClient.markAsRead({ id });
  }
};

module.exports = resolvers;