document.addEventListener("DOMContentLoaded", () => {
  const payButton = document.getElementById("payButton");
  if (!payButton) return;

  payButton.addEventListener("click", async () => {
    payButton.disabled = true;
    payButton.textContent = "Redirecting...";

    try {
      const res = await fetch(orderCreateUrl, {
        method: "POST",
        headers: { Accept: "application/json" },
      });

      if (res.redirected) {
        window.location.href = res.url;
        return;
      }

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error("Unexpected response from server");
      }

      if (!data || !data.orderId) {
        throw new Error(data.error || "Unable to create order");
      }

      const desc = (listing.description || "").slice(0, 250);

      const rzp = new Razorpay({
        key: data.key || razorKey,
        amount: data.amount,
        currency: data.currency,
        order_id: data.orderId,
        name: listing.title,
        description: desc,
        // Allow all methods (UPI visible when enabled for test mode)
        handler: () => {
          let redirected = false;
          fetch("/bookings", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              listingId: listing._id,
              orderId: data.orderId,
              amount: data.amount,
              currency: data.currency,
            }),
          })
            .then((r) => r.json())
            .then((bookingRes) => {
              const dest = bookingRes.bookingId
                ? `/bookings/${bookingRes.bookingId}`
                : `${window.location.pathname}?payment=success`;
              redirected = true;
              window.location.href = dest;
            })
            .catch(() => {
              redirected = true;
              window.location.href = `${window.location.pathname}?payment=success`;
            });
          // Safety fallback redirect after 3s in case fetch fails silently
          setTimeout(() => {
            if (!redirected) {
              window.location.href = `${window.location.pathname}?payment=success`;
            }
          }, 3000);
        },
        modal: {
          ondismiss: () => {
            window.location.href = `${window.location.pathname}?payment=cancel`;
          },
        },
        prefill: {
          email: window.currUserEmail || "",
          name: window.currUserName || "",
        },
        theme: { color: "#0f9d58" },
      });

      rzp.open();
    } catch (err) {
      console.error(err);
      alert(err.message || "Payment initiation failed");
      payButton.disabled = false;
      payButton.textContent = "Book & Pay";
    }
  });

  if (paymentStatus === "success") {
    alert("Payment successful! Your booking is confirmed.");
  } else if (paymentStatus === "cancel") {
    alert("Payment cancelled. You were not charged.");
  }
});
