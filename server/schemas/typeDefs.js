const typeDefs = `
  type UserStats {
    totalBookings: Int!
    completedBookings: Int!
    totalSpent: Float!
    totalReviews: Int!
  }

  type User {
    id: Int!
    firstName: String!
    lastName: String!
    email: String!
    isAdmin: Boolean!
    hasPassword: Boolean!
    isBlocked: Boolean!
    stats: UserStats
  }

  type Review {
    id: Int!
    user_id: Int!
    escape_room_id: Int!
    rating: Float
    comment: String
    reply: String
    isRead: Boolean!
    created_at: String!
    user: User
    escaperoom: EscapeRoom
  }

  type EscapeRoom {
    id: Int!
    theme: String!
    genre: String!
    difficulty: String!
    ageGroup: String!
    playersMin: Int!
    playersMax: Int!
    price: Int!
    description: String!
    duration: Int!
    image_url: String!
    gallery: [String]
    reviews: [Review]
    averageRating: Float
    completedCount: Int
    latestCompletedDate: String
    latestCompletedTime: String
  }

  type Booking {
    id: Int!
    user_id: Int!
    escape_room_id: Int!
    numberOfPlayers: Int!
    date: String!
    time: String!
    created_at: String!
    payment_status: String!
    payment_amount: Float!
    payment_method: String
    transaction_id: String
    status: String!
    escaperoom: EscapeRoom
    user: User
  }

  type AvailableSlot {
    date: String!
    time: String!
  }

  type Auth {
    token: ID!
    user: User
  }

  input EscapeRoomInput {
    theme: String!
    genre: String!
    difficulty: String!
    ageGroup: String!
    playersMin: Int!
    playersMax: Int!
    price: Int!
    description: String!
    duration: Int!
    image_url: String
    gallery: [String]
  }

  input UpdateBookingInput {
    payment_status: String
    payment_amount: Float
    payment_method: String
    status: String
  }

  input UpdateReviewInput {
    reply: String
    isRead: Boolean
  }

  input UpdateNameInput {
    firstName: String!
    lastName: String!
  }

  type Query {
    me: User
    checkEmailExists(email: String!): Boolean!
    getAllEscapeRooms: [EscapeRoom]
    getEscapeRoom(id: Int!): EscapeRoom
    getTopCompletedRooms: [EscapeRoom]
    availableSlots(
      escape_room_id: Int!
      start_date: String!
      end_date: String!
    ): [AvailableSlot]!
    getSingleBooking(booking_id: Int!): Booking
    getAllUserBookings: [Booking]
    getCompletedBookings: [Booking]
    getAllBookings: [Booking]
    getAllUsers: [User]
    getAllReviews: [Review]
    getReview(id: Int!): Review
  }

  type Mutation {
    login(email: String!, password: String!): Auth
    createUser(
      firstName: String!
      lastName: String!
      email: String!
      password: String!
    ): Auth

    sendAuthCode(email: String!): String!
    verifyAuthCode(email: String!, code: String!, authJwt: String!): Boolean!
    loginWithCode(email: String!, code: String!, authJwt: String!): Auth

    requestEmailUpdate(newEmail: String!): Boolean!
    confirmEmailUpdate(token: String!): User

    updatePassword(currentPassword: String!, newPassword: String!): User
    addPassword(newPassword: String!): User
    forgotPassword(email: String!): Boolean!
    verifyResetCode(email: String!, code: String!): Boolean!
    resetPassword(email: String!, code: String!, newPassword: String!): Boolean!

    updateName(input: UpdateNameInput!): User
    createBooking(
      escape_room_id: Int!
      numberOfPlayers: Int!
      date: String!
      time: String!
    ): Booking
    updateBooking(booking_id: Int!, input: UpdateBookingInput!): Booking
    completeDemoPayment(booking_id: Int!): Booking!
    createPayPalOrder(booking_id: Int!): String!
    capturePayPalOrder(orderId: String!, booking_id: Int!): Booking!

    deleteBooking(booking_id: Int!): Boolean!
    createReview(escape_room_id: Int!, rating: Float, comment: String): Review
    updateReview(id: Int!, input: UpdateReviewInput!): Review
    deleteReview(id: Int!): Boolean!
    createEscapeRoom(input: EscapeRoomInput!): EscapeRoom
    updateEscapeRoom(id: Int!, input: EscapeRoomInput!): EscapeRoom
    deleteEscapeRoom(id: Int!): Boolean!
    deleteUser(id: Int!): Boolean!
    toggleBlockUser(id: Int!): User
  }
`;

module.exports = typeDefs;
