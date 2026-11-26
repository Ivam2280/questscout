const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/connection");

class Booking extends Model {}

Booking.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    escape_room_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "escaperooms",
        key: "id",
      },
    },
    numberOfPlayers: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    payment_status: {
      type: DataTypes.STRING,
      defaultValue: "pending",
    },
    payment_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      get() { return Number(this.getDataValue("payment_amount")); },
    },
    payment_method: {
      type: DataTypes.STRING,
    },
    transaction_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    paypal_order_id: { type: DataTypes.STRING },
    paypal_amount: { type: DataTypes.DECIMAL(12, 2) },
    status: {
      type: DataTypes.STRING,
      defaultValue: "active",
    },
  },
  {
    sequelize,
    modelName: "booking",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Booking;
