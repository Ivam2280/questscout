import { gql } from "@apollo/client";

export const CREATE_USER = gql`
  mutation createUser(
    $firstName: String!
    $lastName: String!
    $email: String!
    $password: String!
  ) {
    createUser(
      firstName: $firstName
      lastName: $lastName
      email: $email
      password: $password
    ) {
      token
      user {
        id
        firstName
        lastName
      }
    }
  }
`;

export const UPDATE_BOOKING = gql`
  mutation updateBooking($booking_id: Int!, $input: UpdateBookingInput!) {
    updateBooking(booking_id: $booking_id, input: $input) {
      id
      payment_status
      payment_amount
      payment_method
    }
  }
`;

export const LOGIN_USER = gql`
  mutation login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        firstName
        lastName
        email
      }
    }
  }
`;

export const SEND_AUTH_CODE = gql`
  mutation sendAuthCode($email: String!) {
    sendAuthCode(email: $email)
  }
`;

export const VERIFY_AUTH_CODE = gql`
  mutation verifyAuthCode($email: String!, $code: String!, $authJwt: String!) {
    verifyAuthCode(email: $email, code: $code, authJwt: $authJwt)
  }
`;

export const LOGIN_WITH_CODE = gql`
  mutation loginWithCode($email: String!, $code: String!, $authJwt: String!) {
    loginWithCode(email: $email, code: $code, authJwt: $authJwt) {
      token
      user {
        id
        firstName
        lastName
        email
      }
    }
  }
`;

export const COMPLETE_DEMO_PAYMENT = gql`
  mutation completeDemoPayment($booking_id: Int!) {
    completeDemoPayment(booking_id: $booking_id) { id payment_status payment_amount payment_method transaction_id }
  }
`;

export const CREATE_PAYPAL_ORDER = gql`
  mutation createPayPalOrder($booking_id: Int!) { createPayPalOrder(booking_id: $booking_id) }
`;

export const CAPTURE_PAYPAL_ORDER = gql`
  mutation capturePayPalOrder($orderId: String!, $booking_id: Int!) {
    capturePayPalOrder(orderId: $orderId, booking_id: $booking_id) { id payment_status payment_amount payment_method transaction_id }
  }
`;

export const REQUEST_EMAIL_UPDATE = gql`
  mutation requestEmailUpdate($newEmail: String!) {
    requestEmailUpdate(newEmail: $newEmail)
  }
`;

export const CONFIRM_EMAIL_UPDATE = gql`
  mutation confirmEmailUpdate($token: String!) {
    confirmEmailUpdate(token: $token) {
      id
      firstName
      lastName
      email
    }
  }
`;

export const UPDATE_NAME = gql`
  mutation updateName($input: UpdateNameInput!) {
    updateName(input: $input) {
      id
      firstName
      lastName
      email
    }
  }
`;

export const UPDATE_PASSWORD = gql`
  mutation updatePassword($currentPassword: String!, $newPassword: String!) {
    updatePassword(
      currentPassword: $currentPassword
      newPassword: $newPassword
    ) {
      id
    }
  }
`;

export const ADD_PASSWORD = gql`
  mutation addPassword($newPassword: String!) {
    addPassword(newPassword: $newPassword) {
      id
      hasPassword
    }
  }
`;

export const FORGOT_PASSWORD = gql`
  mutation forgotPassword($email: String!) {
    forgotPassword(email: $email)
  }
`;

export const VERIFY_RESET_CODE = gql`
  mutation verifyResetCode($email: String!, $code: String!) {
    verifyResetCode(email: $email, code: $code)
  }
`;

export const RESET_PASSWORD = gql`
  mutation resetPassword($email: String!, $code: String!, $newPassword: String!) {
    resetPassword(email: $email, code: $code, newPassword: $newPassword)
  }
`;

export const CREATE_BOOKING = gql`
  mutation createBooking(
    $escape_room_id: Int!
    $numberOfPlayers: Int!
    $date: String!
    $time: String!
  ) {
    createBooking(
      escape_room_id: $escape_room_id
      numberOfPlayers: $numberOfPlayers
      date: $date
      time: $time
    ) {
      id
      user_id
      escape_room_id
      numberOfPlayers
      date
      time
      created_at
      payment_status
    }
  }
`;

export const DELETE_BOOKING = gql`
  mutation deleteBooking($booking_id: Int!) {
    deleteBooking(booking_id: $booking_id)
  }
`;

export const DELETE_USER = gql`
  mutation deleteUser($id: Int!) {
    deleteUser(id: $id)
  }
`;

export const TOGGLE_BLOCK_USER = gql`
  mutation toggleBlockUser($id: Int!) {
    toggleBlockUser(id: $id) {
      id
      isBlocked
    }
  }
`;

export const CREATE_REVIEW = gql`
  mutation createReview(
    $escape_room_id: Int!
    $rating: Float
    $comment: String
  ) {
    createReview(
      escape_room_id: $escape_room_id
      rating: $rating
      comment: $comment
    ) {
      id
      user_id
      escape_room_id
      rating
      comment
      created_at
    }
  }
`;

export const UPDATE_REVIEW = gql`
  mutation updateReview($id: Int!, $input: UpdateReviewInput!) {
    updateReview(id: $id, input: $input) {
      id
      reply
      isRead
    }
  }
`;

export const DELETE_REVIEW = gql`
  mutation deleteReview($id: Int!) {
    deleteReview(id: $id)
  }
`;

export const CREATE_ESCAPEROOM = gql`
  mutation createEscapeRoom($input: EscapeRoomInput!) {
    createEscapeRoom(input: $input) {
      id
      theme
      genre
      difficulty
      ageGroup
      playersMin
      playersMax
      price
      description
      duration
      image_url
      gallery
    }
  }
`;

export const UPDATE_ESCAPEROOM = gql`
  mutation updateEscapeRoom($id: Int!, $input: EscapeRoomInput!) {
    updateEscapeRoom(id: $id, input: $input) {
      id
      theme
      genre
      difficulty
      ageGroup
      playersMin
      playersMax
      price
      description
      duration
      image_url
      gallery
    }
  }
`;

export const DELETE_ESCAPEROOM = gql`
  mutation deleteEscapeRoom($id: Int!) {
    deleteEscapeRoom(id: $id)
  }
`;
