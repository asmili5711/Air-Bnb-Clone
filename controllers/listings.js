const Listing = require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const Razorpay = require('razorpay');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

// Razorpay client setup
const razor = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


module.exports.index = async(req,res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
};

module.exports.searchListings = async (req, res) => {
  const { query } = req.query;
  
  const listings = await Listing.find({
    $or: [
      { location: { $regex: query, $options: 'i' } },
      { country: { $regex: query, $options: 'i' } }
    ]
  }).populate('reviews');

  res.render('listings/search', { 
    listings,
    searchQuery: query 
  });
};

module.exports.renderNewForm = (req,res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async(req,res) => {
    let {id} = req.params;
   const listing = await Listing.findById(id).populate({path:"reviews",populate:{path: "author",},
}).populate("Owner");
   if(!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
   }
   const paymentStatus = req.query.payment;
   res.render("listings/show.ejs", {listing, paymentStatus});
};

module.exports.createCheckoutOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    if (listing.Owner && req.user && listing.Owner.equals(req.user._id)) {
      return res.status(400).json({ error: "Owners cannot purchase their own listing" });
    }

    const amountInPaise = Math.max(1, Math.round(listing.price * 100));

    const receipt = `list_${id.slice(-8)}_${Date.now()}`;

    const order = await razor.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt,
      notes: { listingId: id, buyer: req.user?.username || "guest" },
    });

    return res.json({
      orderId: order.id,
      amount: amountInPaise,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("Razorpay order error", err);
    return res.status(500).json({ error: "Unable to start payment right now" });
  }
};

module.exports.createListing = async(req,res,next) => {

    let response = await geocodingClient.forwardGeocode({
        query: req.body.listing.location,
        limit: 1,
      })
        .send()



    let url = req.file.path;
    let filename = req.file.filename;

    const newListing = new Listing(req.body.listing);
    newListing.Owner = req.user._id;
    newListing.image = {url , filename};

    newListing.geometry = response.body.features[0].geometry;

    let saveListing = await newListing.save();
    console.log(saveListing);
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
};

module.exports.renderEditForm = async(req,res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id);
    if(!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        res.redirect("/listings");
       }
       let originalImageUrl = listing.image.url;
    res.render("listings/edit.ejs", {listing, originalImageUrl});
};

module.exports.updateListing = async(req,res) => {
    let {id} = req.params;
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing});

    if(typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = {url, filename}
    await listing.save();
    }
    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async(req,res) => {
    let {id} = req.params;
   const deletedListing = await Listing.findByIdAndDelete(id);
   console.log(deletedListing);
   req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};
