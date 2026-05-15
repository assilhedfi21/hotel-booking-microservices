const express = require('express');
const router = express.Router();
const userClient = require('../grpc-clients/userClient');
const bookingClient = require('../grpc-clients/bookingClient');
const notifClient = require('../grpc-clients/notifClient');

// ─── Middleware ──────────────────────────────────────────────────────────────

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ─── USER ROUTES ─────────────────────────────────────────────────────────────

// POST /api/users/register
router.post('/users/register', asyncHandler(async (req, res) => {
  const result = await userClient.createUser(req.body);
  res.status(result.success ? 201 : 400).json(result);
}));

// POST /api/users/login
router.post('/users/login', asyncHandler(async (req, res) => {
  const result = await userClient.authenticateUser(req.body);
  res.status(result.success ? 200 : 401).json(result);
}));

// GET /api/users
router.get('/users', asyncHandler(async (req, res) => {
  const result = await userClient.getAllUsers({});
  res.json(result);
}));

// GET /api/users/:id
router.get('/users/:id', asyncHandler(async (req, res) => {
  const result = await userClient.getUser({ id: req.params.id });
  res.status(result.success ? 200 : 404).json(result);
}));

// PUT /api/users/:id
router.put('/users/:id', asyncHandler(async (req, res) => {
  const result = await userClient.updateUser({ id: req.params.id, ...req.body });
  res.status(result.success ? 200 : 400).json(result);
}));

// DELETE /api/users/:id
router.delete('/users/:id', asyncHandler(async (req, res) => {
  const result = await userClient.deleteUser({ id: req.params.id });
  res.status(result.success ? 200 : 404).json(result);
}));

// ─── BOOKING ROUTES ───────────────────────────────────────────────────────────

// POST /api/bookings
router.post('/bookings', asyncHandler(async (req, res) => {
  const result = await bookingClient.createBooking(req.body);
  res.status(result.success ? 201 : 400).json(result);
}));

// GET /api/bookings
router.get('/bookings', asyncHandler(async (req, res) => {
  const result = await bookingClient.getAllBookings({});
  res.json(result);
}));

// GET /api/bookings/:id
router.get('/bookings/:id', asyncHandler(async (req, res) => {
  const result = await bookingClient.getBooking({ id: req.params.id });
  res.status(result.success ? 200 : 404).json(result);
}));

// GET /api/users/:userId/bookings
router.get('/users/:userId/bookings', asyncHandler(async (req, res) => {
  const result = await bookingClient.getUserBookings({ user_id: req.params.userId });
  res.json(result);
}));

// PATCH /api/bookings/:id/status
router.patch('/bookings/:id/status', asyncHandler(async (req, res) => {
  const result = await bookingClient.updateBookingStatus({
    id: req.params.id,
    status: req.body.status
  });
  res.status(result.success ? 200 : 400).json(result);
}));

// DELETE /api/bookings/:id
router.delete('/bookings/:id', asyncHandler(async (req, res) => {
  const result = await bookingClient.cancelBooking({
    id: req.params.id,
    reason: req.body?.reason
  });
  res.status(result.success ? 200 : 400).json(result);
}));

// ─── NOTIFICATION ROUTES ──────────────────────────────────────────────────────

// POST /api/notifications
router.post('/notifications', asyncHandler(async (req, res) => {
  const result = await notifClient.sendNotification(req.body);
  res.status(result.success ? 201 : 400).json(result);
}));

// GET /api/notifications
router.get('/notifications', asyncHandler(async (req, res) => {
  const result = await notifClient.getAllNotifications({});
  res.json(result);
}));

// GET /api/users/:userId/notifications
router.get('/users/:userId/notifications', asyncHandler(async (req, res) => {
  const result = await notifClient.getUserNotifications({ user_id: req.params.userId });
  res.json(result);
}));

// PATCH /api/notifications/:id/read
router.patch('/notifications/:id/read', asyncHandler(async (req, res) => {
  const result = await notifClient.markAsRead({ id: req.params.id });
  res.status(result.success ? 200 : 404).json(result);
}));

// ─── HEALTH CHECK ────────────────────────────────────────────────────────────

router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    services: {
      'user-service': `${process.env.USER_SERVICE_URL || 'localhost:50051'}`,
      'booking-service': `${process.env.BOOKING_SERVICE_URL || 'localhost:50052'}`,
      'notification-service': `${process.env.NOTIFICATION_SERVICE_URL || 'localhost:50053'}`
    }
  });
});

module.exports = router;