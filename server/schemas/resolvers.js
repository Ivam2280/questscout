const { Op } = require("sequelize");
const sequelize = require("../config/connection");
const { User, EscapeRoom, Booking, Review } = require("../models");
const { authMutations, normalizeEmail, isDemoUser } = require("../services/auth");
const { paymentMutations } = require("../services/payments");
const { availableSlots, createBooking, requireUser, ownedBooking } = require("../services/bookings");
const { validateRoom } = require("../services/rooms");
const { refundPayment } = require("../utils/paypal");
const { ForbiddenError, UserInputError } = require("../utils/errors");

const publicReviews = { model: Review, include: [{ model: User, attributes: ["id", "firstName", "lastName"] }] };
const bookingIncludes = [EscapeRoom, User];
function requireAdmin(context) {
  if (!requireUser(context).isAdmin) throw new ForbiddenError("Admin access required.");
}

const resolvers = {
  Query: {
    checkEmailExists: async (_, { email }) => Boolean(await User.findOne({ where: { email: normalizeEmail(email) }, attributes: ["id"] })),
    getAllEscapeRooms: async () => EscapeRoom.findAll({ include: [publicReviews], order: [["id", "ASC"]] }),
    getEscapeRoom: async (_, { id }) => EscapeRoom.findByPk(id, { include: [publicReviews] }),
    getTopCompletedRooms: async () => {
      const [rooms, bookings] = await Promise.all([
        EscapeRoom.findAll({ include: [publicReviews] }),
        Booking.findAll({ where: { status: "completed" }, attributes: ["escape_room_id", "date", "time"], order: [["date", "DESC"], ["time", "DESC"]] }),
      ]);
      const stats = new Map();
      for (const booking of bookings) {
        const current = stats.get(booking.escape_room_id) || { completedCount: 0, latestCompletedDate: booking.date, latestCompletedTime: booking.time };
        current.completedCount += 1;
        stats.set(booking.escape_room_id, current);
      }
      return rooms.map((room) => ({ ...room.get({ plain: true }), completedCount: 0, ...stats.get(room.id) }))
        .sort((a, b) => b.completedCount - a.completedCount || `${b.latestCompletedDate || ""}${b.latestCompletedTime || ""}`.localeCompare(`${a.latestCompletedDate || ""}${a.latestCompletedTime || ""}`)).slice(0, 3);
    },
    availableSlots: (_, args) => availableSlots(args),
    me: (_, args, context) => User.findByPk(requireUser(context).id),
    getAllUserBookings: (_, args, context) => Booking.findAll({ where: { user_id: requireUser(context).id, status: "active" }, include: bookingIncludes, order: [["created_at", "DESC"]] }),
    getCompletedBookings: (_, args, context) => Booking.findAll({ where: { user_id: requireUser(context).id, status: "completed" }, include: bookingIncludes, order: [["date", "DESC"], ["time", "DESC"]] }),
    getSingleBooking: (_, { booking_id }, context) => ownedBooking(booking_id, context),
    getAllBookings: (_, args, context) => { requireAdmin(context); return Booking.findAll({ include: bookingIncludes, order: [["created_at", "DESC"]] }); },
    getAllUsers: (_, args, context) => { requireAdmin(context); return User.findAll({ order: [["created_at", "DESC"]] }); },
    getAllReviews: (_, args, context) => { requireAdmin(context); return Review.findAll({ include: [User, EscapeRoom], order: [["created_at", "DESC"]] }); },
    getReview: (_, { id }, context) => { requireAdmin(context); return Review.findByPk(id, { include: [User, EscapeRoom] }); },
  },
  Mutation: {
    ...authMutations,
    ...paymentMutations,
    createBooking: (_, input, context) => createBooking(input, context),
    updateBooking: async (_, { booking_id, input }, context) => {
      requireAdmin(context);
      if (input.status && !["active", "completed", "cancelled"].includes(input.status)) throw new UserInputError("Invalid booking status.");
      if (input.payment_status && !["pending", "completed", "cancelled"].includes(input.payment_status)) throw new UserInputError("Invalid payment status.");
      if (input.payment_amount !== undefined && (!Number.isFinite(input.payment_amount) || input.payment_amount < 0)) throw new UserInputError("Enter a valid payment amount.");
      return sequelize.transaction(async (transaction) => {
        const booking = await ownedBooking(booking_id, context, transaction);
        if (booking.payment_method === "PayPal Sandbox" && booking.payment_status === "completed") throw new UserInputError("Use cancellation to refund a PayPal booking.");
        if (booking.paypal_order_id && input.payment_amount !== undefined && Number(input.payment_amount) !== booking.payment_amount) throw new UserInputError("The amount cannot change after a PayPal order has been created.");
        const update = { ...input };
        if (update.status === "cancelled") update.payment_status = "cancelled";
        if (update.payment_status === "cancelled") update.status = "cancelled";
        return booking.update(update, { transaction });
      });
    },
    deleteBooking: async (_, { booking_id }, context) => sequelize.transaction(async (transaction) => {
      const booking = await ownedBooking(booking_id, context, transaction);
      if (booking.status !== "active") {
        await booking.destroy({ transaction });
        return true;
      }
      if (booking.payment_status === "completed" && booking.payment_method === "PayPal Sandbox" && booking.transaction_id) await refundPayment(booking.transaction_id);
      if (context.user.isAdmin) await booking.destroy({ transaction });
      else await booking.update({ status: "cancelled", payment_status: "cancelled" }, { transaction });
      return true;
    }),
    createReview: async (_, { escape_room_id, rating, comment }, context) => {
      const user = requireUser(context);
      const text = comment?.trim() || null;
      if (rating == null && !text) throw new UserInputError("Add a rating or a comment.");
      if (rating != null && (!Number.isFinite(rating) || rating < 1 || rating > 5)) throw new UserInputError("Rating must be between 1 and 5.");
      if (text && text.length > 4000) throw new UserInputError("Comments must be at most 4000 characters.");
      if (!(await EscapeRoom.findByPk(escape_room_id))) throw new UserInputError("Quest room not found.");
      return Review.create({ user_id: user.id, escape_room_id, rating, comment: text });
    },
    updateReview: async (_, { id, input }, context) => {
      requireAdmin(context);
      if (input.reply && input.reply.length > 4000) throw new UserInputError("Replies must be at most 4000 characters.");
      const review = await Review.findByPk(id);
      if (!review) throw new UserInputError("Review not found.");
      return review.update(input);
    },
    deleteReview: async (_, { id }, context) => {
      requireAdmin(context);
      if (!(await Review.destroy({ where: { id } }))) throw new UserInputError("Review not found.");
      return true;
    },
    createEscapeRoom: (_, { input }, context) => { requireAdmin(context); return EscapeRoom.create(validateRoom(input)); },
    updateEscapeRoom: async (_, { id, input }, context) => {
      requireAdmin(context);
      const update = validateRoom(input);
      return sequelize.transaction(async (transaction) => {
        const room = await EscapeRoom.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
        if (!room) throw new UserInputError("Quest room not found.");
        if (room.duration !== update.duration && await Booking.count({ where: { escape_room_id: id, status: "active" }, transaction })) throw new UserInputError("Cancel active bookings before changing the room duration.");
        return room.update(update, { transaction });
      });
    },
    deleteEscapeRoom: async (_, { id }, context) => {
      requireAdmin(context);
      return sequelize.transaction(async (transaction) => {
        const room = await EscapeRoom.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
        if (!room) throw new UserInputError("Quest room not found.");
        if (await Booking.count({ where: { escape_room_id: id, status: "active" }, transaction })) throw new UserInputError("Cancel active bookings before deleting the room.");
        await room.destroy({ transaction });
        return true;
      });
    },
    deleteUser: async (_, { id }, context) => {
      requireAdmin(context);
      if (context.user.id === id) throw new ForbiddenError("You cannot delete your own account.");
      const user = await User.findByPk(id);
      if (!user) throw new UserInputError("User not found.");
      if (user.isAdmin) throw new ForbiddenError("Administrator accounts cannot be deleted here.");
      if (isDemoUser(user)) throw new ForbiddenError("The shared demo account cannot be deleted.");
      await user.destroy();
      return true;
    },
    toggleBlockUser: async (_, { id }, context) => {
      requireAdmin(context);
      if (context.user.id === id) throw new ForbiddenError("You cannot block your own account.");
      const user = await User.findByPk(id);
      if (!user) throw new UserInputError("User not found.");
      if (user.isAdmin) throw new ForbiddenError("Administrator accounts cannot be blocked here.");
      if (isDemoUser(user)) throw new ForbiddenError("The shared demo account cannot be blocked.");
      return user.update({ isBlocked: !user.isBlocked });
    },
  },
  User: {
    stats: async (user, args, context) => {
      if (!context.user || (user.id !== context.user.id && !context.user.isAdmin)) return null;
      const [bookings, totalReviews] = await Promise.all([Booking.findAll({ where: { user_id: user.id } }), Review.count({ where: { user_id: user.id } })]);
      return {
        totalBookings: bookings.length,
        completedBookings: bookings.filter((booking) => booking.status === "completed").length,
        totalSpent: bookings.filter((booking) => booking.payment_status === "completed").reduce((sum, booking) => sum + Math.round(Number(booking.payment_amount) * 100), 0) / 100,
        totalReviews,
      };
    },
  },
  EscapeRoom: {
    reviews: async (room) => (room.reviews || await Review.findAll({ where: { escape_room_id: room.id }, include: [{ model: User, attributes: ["id", "firstName", "lastName"] }] })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    averageRating: async (room) => {
      const reviews = room.reviews || await Review.findAll({ where: { escape_room_id: room.id }, attributes: ["rating"] });
      const ratings = reviews.filter((review) => review.rating != null).map((review) => Number(review.rating));
      return ratings.length ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length : null;
    },
  },
  Review: {
    created_at: (review) => new Date(review.created_at).toISOString().slice(0, 10).split("-").reverse().join("."),
    user: (review) => review.user || User.findByPk(review.user_id, { attributes: ["id", "firstName", "lastName"] }),
    escaperoom: (review) => review.escaperoom || EscapeRoom.findByPk(review.escape_room_id),
  },
  Booking: {
    created_at: (booking) => new Date(booking.created_at).toISOString(),
    payment_amount: (booking) => Number(booking.payment_amount),
    user: (booking) => booking.user || User.findByPk(booking.user_id),
    escaperoom: (booking) => booking.escaperoom || EscapeRoom.findByPk(booking.escape_room_id),
  },
};

module.exports = resolvers;
