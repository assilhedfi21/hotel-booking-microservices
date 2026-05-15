const { buildSchema } = require('graphql');

const schema = buildSchema(`
  # ─── User Types ──────────────────────────────────────
  type User {
    id: String
    name: String
    email: String
    phone: String
    created_at: String
    success: Boolean
    message: String
  }

  type UsersResponse {
    users: [User]
    success: Boolean
    message: String
  }

  type DeleteResponse {
    success: Boolean
    message: String
  }

  type AuthResponse {
    success: Boolean
    message: String
    token: String
    user: User
  }

  # ─── Booking Types ────────────────────────────────────
  type Booking {
    id: String
    user_id: String
    hotel_id: String
    hotel_name: String
    room_type: String
    check_in: String
    check_out: String
    price_per_night: Float
    total_price: Float
    guests: Int
    status: String
    created_at: String
    success: Boolean
    message: String
  }

  type BookingsResponse {
    bookings: [Booking]
    success: Boolean
    message: String
  }

  # ─── Notification Types ───────────────────────────────
  type Notification {
    id: String
    user_id: String
    type: String
    title: String
    message: String
    booking_id: String
    is_read: Boolean
    created_at: String
    success: Boolean
    response_message: String
  }

  type NotificationsResponse {
    notifications: [Notification]
    success: Boolean
    message: String
  }

  # ─── Queries ──────────────────────────────────────────
  type Query {
    # Users
    users: UsersResponse
    user(id: String!): User

    # Bookings
    bookings: BookingsResponse
    booking(id: String!): Booking
    userBookings(userId: String!): BookingsResponse

    # Notifications
    notifications: NotificationsResponse
    userNotifications(userId: String!): NotificationsResponse
  }

  # ─── Mutations ────────────────────────────────────────
  type Mutation {
    # Users
    registerUser(name: String!, email: String!, password: String!, phone: String): User
    loginUser(email: String!, password: String!): AuthResponse
    updateUser(id: String!, name: String, email: String, phone: String): User
    deleteUser(id: String!): DeleteResponse

    # Bookings
    createBooking(
      user_id: String!,
      hotel_id: String!,
      hotel_name: String!,
      room_type: String!,
      check_in: String!,
      check_out: String!,
      price_per_night: Float!,
      guests: Int
    ): Booking
    updateBookingStatus(id: String!, status: String!): Booking
    cancelBooking(id: String!, reason: String): Booking

    # Notifications
    sendNotification(
      user_id: String!,
      type: String!,
      title: String!,
      message: String!,
      booking_id: String
    ): Notification
    markNotificationAsRead(id: String!): Notification
  }
`);

module.exports = schema;