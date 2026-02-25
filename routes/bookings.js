const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middleware");
const bookingsController = require("../controllers/bookings");
const wrapAsync = require("../utils/wrapAsync");

router.post("/", isLoggedIn, wrapAsync(bookingsController.create));
router.get("/:id", isLoggedIn, wrapAsync(bookingsController.show));
router.get("/", isLoggedIn, wrapAsync(bookingsController.index));

module.exports = router;
