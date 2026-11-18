// ===== 1. SAMPLE DATA: each item is an object, like one row in a spreadsheet =====
const resources = [
  { id: 1, name: "DRILL", category: "COMMUNITY RESOURCE", owner: "JATIN", contact: "Block A", status: "Available" },
  { id: 2, name: "Camping Tent (4-person)", category: "OUTDOORS", owner: "MEERA", contact: "Block B", status: "Borrowed" },
  { id: 3, name: "Extension Ladder", category: "TOOLSS", owner: "BALDEV", contact: "Block A", status: "Available" },
  { id: 4, name: "Bike", category: "VEHICLE", owner: "RONALDO", contact: "Block C", status: "Available" },
  { id: 5, name: "Car", category: "VEHICLE", owner: "SONU", contact: "Block D", status: "Available" },
  { id: 6, name: "Board Games Set", category: "GAMES", owner: "PRACHI", contact: "Block B", status: "Borrowed" },
  { id: 7, name: "Projector", category: "ELECTRONICS", owner: "VIRAT KOHLI", contact: "Block C", status: "Available" },
  { id: 8, name: "Community Hall", category: "INDOOR", owner: "RAJAT", contact: "Block D", status: "Available" },
  { id: 9, name: "Pool", category: "INDOOR", owner: "SAMMY", contact: "Block D", status: "Available" },
  { id: 10, name: "Cricket Turf", category: "INDOOR", owner: "DHONI", contact: "Block E", status: "Available" }
];

// ===== 2. STATE: values that change while the user uses the page =====
let currentCategory = "All";   // which filter button is active
let searchTerm = "";           // text typed in the search box
let selectedItemId = null;     // the item the request popup is for

// ===== 3. HTML ELEMENTS: looked up once and saved in variables =====
const catalogGrid = document.getElementById("catalogGrid");
const emptyMsg = document.getElementById("emptyMsg");
const searchInput = document.getElementById("searchInput");
const filterButtons = document.getElementById("filterButtons");
const shareForm = document.getElementById("shareForm");
const formError = document.getElementById("formError");
const requestModal = document.getElementById("requestModal");
const requestForm = document.getElementById("requestForm");
const requestError = document.getElementById("requestError");
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

// ===== 4. HELPER: creates an element and sets its text safely =====
// textContent treats text as plain text, never as HTML code, which protects the page
function makeEl(tag, className, text) {
  const el = document.createElement(tag);
  el.className = className;
  el.textContent = text;
  return el;
}

// ===== 5. CREATE ONE CARD: builds it in memory, not yet on the page =====
function createCard(item) {
  const status = item.status.toLowerCase();   // "available", "requested" or "borrowed"
  const card = makeEl("article", `card is-${status}`, "");

  // Top row: category tag and status badge
  const top = makeEl("div", "card-top", "");
  top.append(makeEl("span", "tag", item.category));
  top.append(makeEl("span", `badge badge-${status}`, item.status));

  card.append(top, makeEl("h3", "", item.name));
  card.append(makeEl("p", "owner", `Owned by ${item.owner}, ${item.contact}`));

  // Show who asked to borrow it, once a request exists
  if (item.requestedBy) {
    card.append(makeEl("p", "owner", `Requested by ${item.requestedBy}`));
  }

  // The button only works for available items
  const isAvailable = item.status === "Available";
  const btn = makeEl("button", "btn btn-primary", isAvailable ? "Request to Borrow" : "Not Available");
  btn.disabled = !isAvailable;
  // The arrow function remembers this item's id and opens the popup for it
  btn.addEventListener("click", () => openModal(item.id));
  card.append(btn);

  return card;
}

// ===== 6. RENDER: redraws the grid using the current filter and search =====
function renderCatalog() {
  catalogGrid.innerHTML = "";   // empty the grid first
  const term = searchTerm.toLowerCase();

  // filter() keeps only items that match BOTH the category AND the search text
  const visibleItems = resources.filter(item => {
    const matchesCategory = currentCategory === "All" || item.category === currentCategory;
    const matchesSearch = item.name.toLowerCase().includes(term) || item.owner.toLowerCase().includes(term);
    return matchesCategory && matchesSearch;
  });

  // forEach: add one card to the grid for each match
  visibleItems.forEach(item => catalogGrid.append(createCard(item)));

  // Show the "no matches" message only when the list is empty
  emptyMsg.hidden = visibleItems.length > 0;
}

// ===== 7. CATEGORY FILTER BUTTONS =====
function setFilter(category) {
  currentCategory = category;
  // Highlight only the button that matches the chosen category
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.category === category);
  });
  renderCatalog();
}

// Event delegation: one listener on the parent handles clicks on every button inside it
filterButtons.addEventListener("click", event => {
  if (event.target.classList.contains("filter-btn")) {
    setFilter(event.target.dataset.category);   // dataset reads the data-category value
  }
});

// ===== 8. LIVE SEARCH: runs on every keystroke ("input" event) =====
searchInput.addEventListener("input", () => {
  searchTerm = searchInput.value.trim();
  renderCatalog();
});

// ===== 9. SHARE A RESOURCE: validate the form, then add a new item =====
// Returns an error message, or an empty string when everything is valid
function getShareError(name, owner, contact) {
  if (name.length < 3) return "Item name needs at least 3 characters.";
  if (owner === "") return "Enter the owner's name.";
  if (contact.length < 3) return "Enter a block or contact detail, such as Block C.";
  return "";
}

shareForm.addEventListener("submit", event => {
  event.preventDefault();   // stops the browser reloading the page (its default form behaviour)

  // .value reads what was typed; .trim() removes spaces at the start and end
  const name = document.getElementById("itemName").value.trim();
  const category = document.getElementById("itemCategory").value;
  const owner = document.getElementById("ownerName").value.trim();
  const contact = document.getElementById("contactInfo").value.trim();

  const error = getShareError(name, owner, contact);
  if (error) {
    formError.textContent = error;   // show the problem and stop here
    return;
  }

  // Valid: add the new item to our array (shorthand: name means name: name)
  resources.push({ id: Date.now(), name, category, owner, contact, status: "Available" });

  shareForm.reset();          // clear the form fields
  formError.textContent = "";
  searchInput.value = "";
  searchTerm = "";
  setFilter("All");           // show every category so the new card is visible
  document.getElementById("browse").scrollIntoView({ behavior: "smooth" });
});

// ===== 10. BORROW / REQUEST MODAL =====
function openModal(itemId) {
  selectedItemId = itemId;
  const item = resources.find(r => r.id === itemId);   // find() returns the first matching item
  document.getElementById("modalItemInfo").textContent =
    `${item.name} (${item.category}), owned by ${item.owner}, ${item.contact}`;
  requestForm.reset();
  requestError.textContent = "";
  requestModal.hidden = false;   // un-hide the popup; CSS then displays it
}

function closeModal() {
  requestModal.hidden = true;
  selectedItemId = null;
}

requestForm.addEventListener("submit", event => {
  event.preventDefault();
  const name = document.getElementById("requesterName").value.trim();
  const flat = document.getElementById("requesterFlat").value.trim();

  if (name === "" || flat === "") {
    requestError.textContent = "Enter your name and flat number to send the request.";
    return;
  }

  // Change the item's status from Available to Requested, and record who asked
  const item = resources.find(r => r.id === selectedItemId);
  item.status = "Requested";
  item.requestedBy = `${name}, Flat ${flat}`;

  closeModal();
  renderCatalog();   // redraw so the new "Requested" badge appears
});

// Three ways to close: the X button, a click on the dark background, or the Escape key
document.getElementById("closeModal").addEventListener("click", closeModal);
requestModal.addEventListener("click", event => {
  if (event.target === requestModal) closeModal();   // only when the backdrop itself is clicked
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !requestModal.hidden) closeModal();
});

// ===== 11. MOBILE MENU (hamburger) =====
menuToggle.addEventListener("click", () => {
  // classList.toggle adds the class if it is missing and removes it if present; it returns true when added
  const isOpen = navLinks.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", isOpen);   // tells screen readers whether the menu is open
});

// Close the menu after a link is tapped, so the user sees the new section
navLinks.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => navLinks.classList.remove("open"));
});

// ===== 12. START: draw the catalog as soon as the page loads =====
renderCatalog();
