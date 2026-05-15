const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const BookingService = require('./service');
const kafkaProducer = require('./kafka/producer');

const PROTO_PATH = path.join(__dirname, 'proto', 'booking.proto');
const PORT = process.env.GRPC_PORT || 50052;

// Load proto definition
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const bookingProto = grpc.loadPackageDefinition(packageDefinition).booking;

// Create gRPC server
const server = new grpc.Server();

server.addService(bookingProto.BookingService.service, BookingService);

const start = async () => {
  // Connect to Kafka
  await kafkaProducer.connect();

  server.bindAsync(
    `0.0.0.0:${PORT}`,
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        console.error('[BookingService] Failed to start server:', err);
        process.exit(1);
      }
      console.log(`[BookingService] gRPC server running on port ${port}`);
    }
  );
};

start();

// Graceful shutdown
const shutdown = async () => {
  console.log('[BookingService] Shutting down...');
  await kafkaProducer.disconnect();
  server.tryShutdown(() => {
    console.log('[BookingService] Server stopped');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);