const { GraphQLError } = require("graphql");

class ApolloError extends GraphQLError {
  constructor(message, code = "INTERNAL_SERVER_ERROR") { super(message, { extensions: { code } }); }
}
class AuthenticationError extends ApolloError {
  constructor(message = "You need to be logged in!") { super(message, "UNAUTHENTICATED"); }
}
class ForbiddenError extends ApolloError {
  constructor(message = "You don't have permission.") { super(message, "FORBIDDEN"); }
}
class UserInputError extends ApolloError {
  constructor(message) { super(message, "BAD_USER_INPUT"); }
}

module.exports = { ApolloError, AuthenticationError, ForbiddenError, UserInputError };
