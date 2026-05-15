const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const PROTO_PATH = path.join(__dirname, '..', 'proto', 'notification.proto');
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'localhost:50053';

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const notificationProto = grpc.loadPackageDefinition(packageDefinition).notification;

const client = new notificationProto.NotificationService(
  NOTIFICATION_SERVICE_URL,
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
  sendNotification: promisify('SendNotification'),
  getUserNotifications: promisify('GetUserNotifications'),
  markAsRead: promisify('MarkAsRead'),
  getAllNotifications: promisify('GetAllNotifications')
};