// Initialize Firebase Instance Context
const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "sidfit-luxury.firebaseapp.com",
    projectId: "sidfit-luxury",
    storageBucket: "sidfit-luxury.appspot.com",
    messagingSenderId: "1092837465",
    appId: "1:1092837465:web:abcdef123456"
};

// Start Apps Check
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();

// Global Dynamic UI States
let cart = JSON.parse(localStorage.getItem('sidfit_cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('sidfit_wishlist')) || [];

document.addEventListener("DOMContentLoaded", () => {
    fetchFeaturedProducts();
    updateUIBadges();
    setupCartDrawerActions();
});

// Real-time Fetch Pipeline for Luxury Home Feed
function fetchFeaturedProducts() {
    const gridContainer = document.getElementById("featuredProductsContainer");
    if(!gridContainer) return;

    db.collection("products")
      .where("featured", "==", true)
      .limit(8)
      .onSnapshot((snapshot) => {
          gridContainer.innerHTML = "";
          if (snapshot.empty) {
              gridContainer.innerHTML = "<p class='empty-msg'>New Minimal Pieces Arriving Soon.</p>";
              return;
          }
          snapshot.forEach((doc) => {
              const product = doc.data();
              product.id = doc.id;
              gridContainer.appendChild(renderProductCard(product));
          });
      }, error => {
          console.error("Failed collection sync: ", error);
      });
}

// Render Engine for Luxury Semantic Cards
function renderProductCard(product) {
    const card = document.createElement("div");
    card.className = "product-card";
    
    // Check if item is in inventory stock
    const isOutOfStock = Object.values(product.inventory).reduce((a, b) => a + b, 0) === 0;

    card.innerHTML = `
        <div class="product-image-frame">
            <img src="${product.images[0]}" alt="${product.title}" loading="lazy" />
            ${isOutOfStock ? '<span class="sold-out-badge">Sold Out</span>' : ''}
            <div class="card-quick-actions">
                <button onclick="quickViewProduct('${product.id}')" class="action-btn">Quick View</button>
            </div>
        </div>
        <div class="product-meta">
            <h3 class="product-title">${product.title}</h3>
            <p class="product-price">₹${product.price.toLocaleString('en-IN')}</p>
            <div class="size-preview-row">
                 ${product.sizes.map(size => `<span class="size-dot">${size}</span>`).join('')}
            </div>
            <button onclick="directAddToCart('${product.id}', '${product.sizes[0]}')" class="btn-card-add" ${isOutOfStock ? 'disabled' : ''}>
                ${isOutOfStock ? 'Out of Stock' : 'Add to Bag'}
            </button>
        </div>
    `;
    return card;
}

// Global Cart Actions Handler
function directAddToCart(productId, chosenSize) {
    if(!chosenSize || chosenSize === 'undefined') {
        alert("Please inspect details to select exact silhouette measurements.");
        return;
    }
    
    const existingIndex = cart.findIndex(item => item.id === productId && item.size === chosenSize);
    if(existingIndex > -1) {
        cart[existingIndex].qty += 1;
    } else {
        cart.push({ id: productId, size: chosenSize, qty: 1 });
    }
    
    syncCartState();
}

function syncCartState() {
    localStorage.setItem('sidfit_cart', JSON.stringify(cart));
    updateUIBadges();
    renderCartDrawerContent();
}

function updateUIBadges() {
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    document.getElementById("cartCount").innerText = totalQty;
    document.getElementById("cartDrawerCount").innerText = totalQty;
}

function setupCartDrawerActions() {
    const trigger = document.getElementById("cartTrigger");
    const closeBtn = document.querySelector(".close-drawer");
    const drawer = document.getElementById("cartDrawer");

    if(trigger && drawer) {
        trigger.addEventListener("click", (e) => {
            e.preventDefault();
            drawer.classList.add("drawer-open");
            renderCartDrawerContent();
        });
    }
    if(closeBtn && drawer) {
        closeBtn.addEventListener("click", () => drawer.classList.remove("drawer-open"));
    }
}

// Async Drawer Injector
function renderCartDrawerContent() {
    const container = document.getElementById("cartDrawerItems");
    if(!container) return;
    
    if(cart.length === 0) {
        container.innerHTML = "<p class='empty-cart-msg'>Your collection bag is empty.</p>";
        document.getElementById("cartSubtotal").innerText = "₹0.00";
        return;
    }

    container.innerHTML = "";
    let accumulatedPrice = 0;

    cart.forEach((item, index) => {
        db.collection("products").doc(item.id).get().then(doc => {
            if(!doc.exists) return;
            const data = doc.data();
            const itemCost = data.price * item.qty;
            accumulatedPrice += itemCost;

            const itemDiv = document.createElement("div");
            itemDiv.className = "drawer-item-row";
            itemDiv.innerHTML = `
                <img src="${data.images[0]}" class="drawer-item-thumb" />
                <div class="drawer-item-info">
                    <h4>${data.title}</h4>
                    <p>Size: ${item.size} | Qty: ${item.qty}</p>
                    <p class="price-val">₹${itemCost.toLocaleString('en-IN')}</p>
                    <button onclick="removeCartItem(${index})" class="remove-item-txt">Remove</button>
                </div>
            `;
            container.appendChild(itemDiv);
            document.getElementById("cartSubtotal").innerText = "₹" + accumulatedPrice.toLocaleString('en-IN');
        });
    });
}

function removeCartItem(index) {
    cart.splice(index, 1);
    syncCartState();
}
