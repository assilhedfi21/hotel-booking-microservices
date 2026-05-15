const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const PROTO_PATH = path.join(__dirname, '..', 'proto', 'user.proto');
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'localhost:50051';

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const userProto = grpc.loadPackageDefinition(packageDefinition).user;

const client = new userProto.UserService(
  USER_SERVICE_URL,
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
  createUser: promisify('CreateUser'),
  getUser: promisify('GetUser'),
  getAllUsers: promisify('GetAllUsers'),
  updateUser: promisify('UpdateUser'),
  deleteUser: promisify('DeleteUser'),
  authenticateUser: promisify('AuthenticateUser')
};