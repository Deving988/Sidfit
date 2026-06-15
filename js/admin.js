// Connect Admin Session Lifecycle Elements
document.addEventListener("DOMContentLoaded", () => {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            // Verify privileges using custom claims or specific admin document lists
            db.collection("system_operators").doc(user.uid).get().then(doc => {
                if(doc.exists && doc.data().role === "administrator") {
                    bootAdminDashboard();
                } else {
                    alert("Unauthorized Clearance Credentials.");
                    firebase.auth().signOut();
                }
            });
        } else {
            document.getElementById("adminAuthGate").classList.remove("hidden");
            document.getElementById("adminMainDashboard").classList.add("hidden");
        }
    });
});

function executeAdminAuth() {
    const e = document.getElementById("adminEmail").value;
    const p = document.getElementById("adminPassword").value;
    firebase.auth().signInWithEmailAndPassword(e, p)
        .catch(err => alert("Access Denied: " + err.message));
}

function bootAdminDashboard() {
    document.getElementById("adminAuthGate").classList.add("hidden");
    document.getElementById("adminMainDashboard").classList.remove("hidden");
    loadMetrics();
}

function loadMetrics() {
    // Pipeline aggregate collection analysis data directly
    db.collection("orders").onSnapshot(snap => {
        let grossTotal = 0;
        let count = 0;
        snap.forEach(doc => {
            const data = doc.data();
            if(data.payment && data.payment.status === "Paid") {
                grossTotal += data.financials.grandTotal;
                count++;
            }
        });
        document.getElementById("metricGross").innerText = "₹" + grossTotal.toLocaleString('en-IN');
        document.getElementById("metricOrders").innerText = count;
    });
}

function createNewProductSKU(event) {
    event.preventDefault();
    
    const targetObject = {
        title: document.getElementById("skuTitle").value,
        price: parseFloat(document.getElementById("skuPrice").value),
        images: document.getElementById("skuImages").value.split(",").map(str => str.trim()),
        category: document.getElementById("skuCategory").value,
        featured: document.getElementById("skuFeatured").checked,
        sizes: ["S", "M", "L", "XL"],
        inventory: { "S": 10, "M": 10, "L": 10, "XL": 10 },
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    db.collection("products").add(targetObject)
        .then(() => {
            alert("SKU Successfully committed globally.");
            document.getElementById("productCreationForm").reset();
        })
        .catch(err => alert("Write operation abort fault: " + err.message));
}
