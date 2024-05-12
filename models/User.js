const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: {
    type: String,
    enum: ["manager", "employee"],
    default: "employee",
    required: true,
  },
  tasks: [{ type: mongoose.SchemaTypes.ObjectId, ref: "Task" }],
});

const User = mongoose.model("User", userSchema);

module.exports = User;
