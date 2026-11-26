const { Model, DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");
const sequelize = require("../config/connection");

class User extends Model {
  checkPassword(loginPw) {
    return bcrypt.compareSync(loginPw, this.password);
  }

  toSafeObject() {
    const { id, firstName, lastName, email, hasPassword, isBlocked } = this.dataValues;
    return { id, firstName, lastName, email, hasPassword, isBlocked };
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      set(value) { this.setDataValue("email", value.trim().toLowerCase()); },
      validate: { isEmail: true },
    },
    firebaseUid: {
      type: DataTypes.STRING(128),
      allowNull: true,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [8, 128],
        byteLength(value) { if (Buffer.byteLength(value, "utf8") > 72) throw new Error("Password must be at most 72 bytes."); },
      },
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isBlocked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    pendingEmail: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    verificationToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tokenExpiration: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    hasPassword: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    resetPasswordToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resetPasswordExpiration: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    hooks: {
      beforeCreate: async (newUserData) => {
        newUserData.password = await bcrypt.hash(newUserData.password, 10);
        return newUserData;
      },
      beforeUpdate: async (updatedUserData) => {
        if (updatedUserData.changed("password")) {
          updatedUserData.password = await bcrypt.hash(
            updatedUserData.password,
            10
          );
        }
        return updatedUserData;
      },
    },
    sequelize,
    underscored: true,
    modelName: "user",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = User;
