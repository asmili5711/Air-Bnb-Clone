const Booking = require("../models/booking");
const Listing = require("../models/listing");

module.exports.create = async (req, res) => {
  try {
    const { listingId, orderId, amount, currency } = req.body;

    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    const booking = await Booking.create({
      listing: listingId,
      buyer: req.user._id,
      orderId,
      amount,
      currency: currency || "INR",
      status: "paid",
    });

    res.json({ bookingId: booking._id });
  } catch (err) {
    console.error("booking create error", err);
    res.status(500).json({ error: "Could not save booking" });
  }
};

module.exports.show = async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate("listing")
    .populate("buyer");
  if (!booking) {
    req.flash("error", "Booking not found");
    return res.redirect("/listings");
  }

  res.render("bookings/show.ejs", { booking });
};

module.exports.index = async (req, res) => {
  const bookings = await Booking.find({ buyer: req.user._id })
    .populate("listing")
    .sort({ createdAt: -1 });
  res.render("bookings/index.ejs", { bookings });
};
