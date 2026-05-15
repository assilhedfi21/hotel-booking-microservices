const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const PROTO_PATH = path.join(__dirname, '..', 'proto', 'booking.proto');
const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || 'localhost:50052';

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const bookingProto = grpc.loadPackageDefinition(packageDefinition).booking;

const client = new bookingProto.BookingService(
  BOOKING_SERVICE_URL,
  grpc.credentials.createInsecure(),
  {
    'grpc.keepalive_time_ms': 10000,
    'grpc.keepalive_timeout_ms': 5000,
    'grpc.keepalive_permit_without_calls': true
  }
);

// Promisify all methods
const promisify = (method) => (request = {}) =>
  new Promise((resolve, reject) => {
    client[method](request, (err, response) => {
      if (err) reject(err);
      else resolve(response);
    });
  });

module.exports = {
  createBooking: promisify('CreateBooking'),
  getBooking: promisify('GetBooking'),
  getUserBookings: promisify('GetUserBookings'),
  getAllBookings: promisify('GetAllBookings'),
  updateBookingStatus: promisify('UpdateBookingStatus'),
  cancelBooking: promisify('CancelBooking')
};