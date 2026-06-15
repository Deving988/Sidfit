// Verification and Razorpay Setup Gateway Pipeline
function executeCheckoutOrderPipeline(discountCouponCode = null) {
    let priceSubtotal = cart.reduce((acc, item) => acc + (item.calculatedPrice * item.qty), 0);
    let deductionValue = 0;

    if (discountCouponCode === "FIRST10") {
        deductionValue = priceSubtotal * 0.10; // Validate 10% coupon drop matrix
    }

    const netChargeValue = priceSubtotal - deductionValue;

    // Call serverless checkout controller endpoint to get a secure verification key
    // Below simulates payload transfer configurations structure
    const gatewayOptions = {
        "key": "rzp_live_YOUR_PUBLIC_KEY", 
        "amount": (netChargeValue * 100), // Razorpay tracks transactions in paisa units
        "currency": "INR",
        "name": "SIDFIT Clothing Brand",
        "description": "Premium Luxury Order Settlement",
        "handler": function (transactionResponse) {
            commitOrderToCloudArchitecture(transactionResponse, netChargeValue, discountCouponCode);
        },
        "prefill": {
            "name": document.getElementById("checkoutCustomerName").value,
            "contact": document.getElementById("checkoutCustomerPhone").value
        },
        "theme": { "color": "#111111" } // Preserves the clean luxury design identity
    };

    const razorpayWindowEngine = new Razorpay(gatewayOptions);
    razorpayWindowEngine.open();
}

function commitOrderToCloudArchitecture(paymentToken, grandTotalAmount, couponUsed) {
    const referencePayload = {
        userId: firebase.auth().currentUser ? firebase.auth().currentUser.uid : "GUEST_CHECKOUT",
        items: cart,
        financials: {
            grandTotal: grandTotalAmount,
            couponApplied: couponUsed
        },
        payment: {
            gateway: "Razorpay",
            paymentId: paymentToken.razorpay_payment_id,
            status: "Paid"
        },
        orderStatus: "Confirmed", // Initial state status string
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    db.collection("orders").add(referencePayload).then((docRef) => {
        // Clear transaction buffer state
        localStorage.removeItem('sidfit_cart');
        // Route customer instantly to tracked operational status view page
        window.location.href = `tracking.html?orderId=${docRef.id}`;
    });
}
