const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const UserService = require('../user-service');

const PROTO_PATH = path.join(__dirname, 'proto', 'user.proto');
const PORT = process.env.GRPC_PORT || 50051;

// Load proto definition
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const userProto = grpc.loadPackageDefinition(packageDefinition).user;

// Create gRPC server
const server = new grpc.Server();

server.addService(userProto.UserService.service, UserService);

server.bindAsync(
  `0.0.0.0:${PORT}`,
  grpc.ServerCredentials.createInsecure(),
  (err, port) => {
    if (err) {
      console.error('[UserService] Failed to start server:', err);
      process.exit(1);
    }
    console.log(`[UserService] gRPC server running on port ${port}`);
  }
);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[UserService] Shutting down...');
  server.tryShutdown(() => {
    console.log('[UserService] Server stopped');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[UserService] Shutting down...');
  server.tryShutdown(() => {
    process.exit(0);
  });
});