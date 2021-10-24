const { Schema, model } = require("mongoose");

const userSchema = Schema(
  {
    username: String,
    token: String,
    chats: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
  { strict: false }
);

module.exports = model("User", userSchema);
