// Local client data state mirrors
let localInventoryCache = [];
let queryFilterCategory = "all";
let queryFilterSize = "";
let searchKeywordString = "";
let sequenceSortingStrategy = "newest";

document.addEventListener("DOMContentLoaded", () => {
    initializeCatalogSyncStream();
});

// Establish a continuous dynamic data stream wrapper pipeline connection
function initializeCatalogSyncStream() {
    db.collection("products")
      .orderBy("createdAt", "desc")
      .onSnapshot((querySnapshot) => {
          localInventoryCache = [];
          querySnapshot.forEach(documentRecord => {
              const dataRef = documentRecord.data();
              dataRef.id = documentRecord.id;
              localInventoryCache.push(dataRef);
          });
          processAndRenderCatalogView();
      }, transactionalError => {
          console.error("Live catalog synchronization break fault: ", transactionalError);
      });
}

// Master execution processor filtering out structural state parameters
function processAndRenderCatalogView() {
    const targetGridDisplay = document.getElementById("catalogGridContainer");
    if (!targetGridDisplay) return;

    // 1. Structural Filter Layer operations
    let processingBufferArray = localInventoryCache.filter(garment => {
        const structuralCategoryMatch = (queryFilterCategory === "all" || garment.category === queryFilterCategory);
        const sizingAvailabilityMatch = (queryFilterSize === "" || (garment.inventory && garment.inventory[queryFilterSize] > 0));
        const keywordTextSearchMatch = garment.title.toLowerCase().includes(searchKeywordString.toLowerCase()) || 
                                       garment.description.toLowerCase().includes(searchKeywordString.toLowerCase());

        return structuralCategoryMatch && sizingAvailabilityMatch && keywordTextSearchMatch;
    });

    // 2. Sequence Sorting operations
    if (sequenceSortingStrategy === "price-low") {
        processingBufferArray.sort((alpha, beta) => alpha.price - beta.price);
    } else if (sequenceSortingStrategy === "price-high") {
        processingBufferArray.sort((alpha, beta) => beta.price - alpha.price);
    } // "newest" automatically structural default position sequence sorting order via original pipeline

    // 3. Clear existing grid nodes and re-render the catalog view
    targetGridDisplay.innerHTML = "";

    if (processingBufferArray.length === 0) {
        targetGridDisplay.innerHTML = `
            <div class="empty-matrix-fallback">
                <p>No garment configuration matches current search criteria.</p>
            </div>
        `;
        return;
    }

    // Append standard functional cards mapping back parameters structures
    processingBufferArray.forEach(garmentElement => {
        const itemCardElementNode = generatePremiumCatalogSemanticCard(garmentElement);
        targetGridDisplay.appendChild(itemCardElementNode);
    });
}

function generatePremiumCatalogSemanticCard(garment) {
    const componentNode = document.createElement("div");
    componentNode.className = "product-card";
    
    // Check aggregate volume count total to determine absolute zero levels
    const totalUnitsAvailable = Object.values(garment.inventory || {}).reduce((sum, val) => sum + val, 0);
    const trackingOutIndicator = totalUnitsAvailable === 0;

    componentNode.innerHTML = `
        <div class="product-image-frame" onclick="routeToDetailPage('${garment.id}')" style="cursor: pointer;">
            <img src="${garment.images[0]}" alt="${garment.title}" loading="lazy" />
            ${trackingOutIndicator ? '<span class="sold-out-badge">Sold Out</span>' : ''}
        </div>
        <div class="product-meta">
            <h3 class="product-title" onclick="routeToDetailPage('${garment.id}')" style="cursor: pointer;">${garment.title}</h3>
            <p class="product-price">₹${garment.price.toLocaleString('en-IN')}</p>
            <div class="interactive-card-footer">
                <button class="text-link" onclick="routeToDetailPage('${garment.id}')">Inspect Blueprint</button>
            </div>
        </div>
    `;
    return componentNode;
}

// Action Event Hooks
function handleSearch(event) {
    searchKeywordString = event.target.value;
    processAndRenderCatalogView();
}

function handleSort(event) {
    sequenceSortingStrategy = event.target.value;
    processAndRenderCatalogView();
}

function filterByCategory(categoryName) {
    queryFilterCategory = categoryName;
    
    // Set active class states on layout sidebar DOM indicators
    document.querySelectorAll(".cat-link").forEach(anchor => {
        if(anchor.innerText.toLowerCase() === categoryName.toLowerCase() || (categoryName === 'all' && anchor.innerText.includes("All"))) {
            anchor.classList.add("active");
        } else {
            anchor.classList.remove("active");
        }
    });
    processAndRenderCatalogView();
}

function filterBySize(sizeCharacterMarker) {
    // Toggle active filter attribute logic values
    queryFilterSize = (queryFilterSize === sizeCharacterMarker) ? "" : sizeCharacterMarker;
    
    document.querySelectorAll(".size-filter-grid button").forEach(btn => {
        if(btn.innerText === queryFilterSize) {
            btn.classList.add("selected-filter-active");
        } else {
            btn.classList.remove("selected-filter-active");
        }
    });
    processAndRenderCatalogView();
}

function routeToDetailPage(productId) {
    window.location.href = `product.html?id=${productId}`;
}

function toggleFilterPanel() {
    const filterPanelSidebar = document.getElementById("filterSidebar");
    if(filterPanelSidebar) {
        filterPanelSidebar.classList.toggle("mobile-drawer-visible");
    }
}
