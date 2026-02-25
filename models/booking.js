const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema(
  {
    listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    orderId: { type: String, required: true },
    amount: { type: Number, required: true }, // paise
    currency: { type: String, default: "INR" },
    status: { type: String, enum: ["pending", "paid"], default: "paid" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
