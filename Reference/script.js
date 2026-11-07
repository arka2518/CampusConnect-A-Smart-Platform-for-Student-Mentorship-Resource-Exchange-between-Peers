
const $ = (selector) => document.querySelector(selector);

const state = {
  page: "dashboard",
  mentors: [
    { id: 1, name: "Rohan Sharma", dept: "Computer Science", year: "Final Year", interests: "DSA, placements, Python", bio: "Happy to help juniors build a study plan and prepare for technical interviews.", initials: "RS", color: "teal" },
    { id: 2, name: "Ananya Patel", dept: "Computer Science", year: "Third Year", interests: "Web development, React", bio: "Building projects and learning frontend development. Let's learn together.", initials: "AP", color: "gold" },
    { id: 3, name: "Karan Mehta", dept: "Electronics", year: "Final Year", interests: "Embedded systems, IoT", bio: "Interested in electronics projects, sensors and practical engineering.", initials: "KM", color: "purple" },
    { id: 4, name: "Priya Nair", dept: "Mechanical", year: "Third Year", interests: "CAD, design, projects", bio: "Can share project planning tips and help you navigate technical coursework.", initials: "PN", color: "pink" },
    { id: 5, name: "Vivek Rao", dept: "Computer Science", year: "Final Year", interests: "Python, databases, internships", bio: "Happy to discuss coding practice, databases and internship preparation.", initials: "VR", color: "blue" },
    { id: 6, name: "Meera Shah", dept: "Electronics", year: "Third Year", interests: "Arduino, robotics, IoT", bio: "Interested in hands-on projects and helping juniors get started.", initials: "MS", color: "teal" }
  ],
  resources: [
    { id: 101, title: "Engineering Mathematics", category: "Textbook", price: 250, condition: "Good condition", seller: "Rohan S.", icon: "📘", description: "Sample second-hand mathematics textbook for engineering students." },
    { id: 102, title: "Data Structures Notes", category: "Notes", price: 80, condition: "Printed notes", seller: "Ananya P.", icon: "📒", description: "Sample revision notes covering common data structure concepts." },
    { id: 103, title: "Digital Electronics Textbook", category: "Textbook", price: 300, condition: "Used, readable", seller: "Karan M.", icon: "📗", description: "Sample textbook listing for digital electronics coursework." },
    { id: 104, title: "Arduino Starter Kit", category: "Equipment", price: 550, condition: "Working condition", seller: "Vivek R.", icon: "🔌", description: "Sample electronics project kit for student experiments." },
    { id: 105, title: "Python Programming Guide", category: "Textbook", price: 180, condition: "Good condition", seller: "Meera S.", icon: "📙", description: "Sample beginner-friendly Python programming book." },
    { id: 106, title: "Semester Revision Notes", category: "Notes", price: 60, condition: "Printed notes", seller: "Priya N.", icon: "📝", description: "Sample condensed notes for quick revision." }
  ],
  stays: [
    { id: 201, title: "Shared Student Room", area: "Near campus", rent: 5500, type: "Shared room", gender: "Details to be confirmed", icon: "🏠", description: "Illustrative shared-room listing with basic furnishings." },
    { id: 202, title: "Student PG Accommodation", area: "Main road area", rent: 7500, type: "PG accommodation", gender: "Details to be confirmed", icon: "🏢", description: "Illustrative PG listing with access to local transport." },
    { id: 203, title: "Budget Shared Flat", area: "Residential area", rent: 4800, type: "Shared flat", gender: "Details to be confirmed", icon: "🛏️", description: "Illustrative shared-flat option for students on a budget." },
    { id: 204, title: "Furnished Student Room", area: "Near local shops", rent: 9500, type: "Private room", gender: "Details to be confirmed", icon: "🏡", description: "Illustrative furnished-room listing with study space." },
    { id: 205, title: "Shared PG Room", area: "Near bus stop", rent: 6500, type: "PG accommodation", gender: "Details to be confirmed", icon: "🛌", description: "Illustrative shared PG option with nearby transport." },
    { id: 206, title: "Student Flat Vacancy", area: "Residential area", rent: 8000, type: "Shared flat", gender: "Details to be confirmed", icon: "🏘️", description: "Illustrative vacancy for students considering a shared flat." }
  ]
};

let nextId = 1000;
let toastTimer;

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function money(amount) {
  return "₹" + Number(amount).toLocaleString("en-IN");
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

function navigate(page) {
  const view = document.getElementById(page);
  if (!view) return;

  state.page = page;

  document.querySelectorAll(".page-view").forEach(item => {
    item.classList.toggle("active", item.id === page);
  });

  document.querySelectorAll(".nav-link").forEach(item => {
    item.classList.toggle("active", item.dataset.page === page);
  });

  const labels = {
    dashboard: "Dashboard",
    mentorship: "Mentorship",
    resources: "Resource Exchange",
    accommodation: "Accommodation"
  };

  $("#breadcrumb").textContent = labels[page];
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (page === "dashboard") renderRecent();
  if (page === "mentorship") renderMentors();
  if (page === "resources") renderResources();
  if (page === "accommodation") renderStays();
}

function renderMentors() {
  const query = $("#mentor-search").value.trim().toLowerCase();
  const dept = $("#mentor-department").value;

  const results = state.mentors.filter(person => {
    const searchable = `${person.name} ${person.dept} ${person.interests} ${person.bio}`.toLowerCase();
    return searchable.includes(query) && (!dept || person.dept === dept);
  });

  $("#mentor-count").textContent = `${results.length} mentor profiles · Demonstration data`;

  $("#mentor-grid").innerHTML = results.length
    ? results.map(person => `
      <article class="listing-card">
        <div class="listing-body">
          <div class="mentor-profile">
            <div class="mentor-avatar ${escapeHTML(person.color)}">${escapeHTML(person.initials)}</div>
            <div>
              <h3>${escapeHTML(person.name)}</h3>
              <div class="card-meta">${escapeHTML(person.dept)}</div>
            </div>
          </div>
          <div class="badge-row">
            <span class="pill">Student mentor</span>
            <span class="pill purple">${escapeHTML(person.year)}</span>
          </div>
          <div class="card-meta">✦ ${escapeHTML(person.interests)}</div>
          <p class="listing-description">${escapeHTML(person.bio)}</p>
          <div class="listing-divider"></div>
          <button class="card-button full-button" data-action="mentor-request" data-id="${person.id}">Request mentorship →</button>
        </div>
      </article>
    `).join("")
    : emptyState("No mentors found", "Try a different name, department or interest.");
}

function renderResources() {
  const query = $("#resource-search").value.trim().toLowerCase();
  const category = $("#resource-category").value;
  const sort = $("#resource-sort").value;

  let results = state.resources.filter(item => {
    const searchable = `${item.title} ${item.category} ${item.condition} ${item.seller} ${item.description}`.toLowerCase();
    return searchable.includes(query) && (!category || item.category === category);
  });

  if (sort === "low") results = [...results].sort((a, b) => a.price - b.price);
  if (sort === "high") results = [...results].sort((a, b) => b.price - a.price);

  $("#resource-count").textContent = `${results.length} resources · Demonstration data`;

  $("#resource-grid").innerHTML = results.length
    ? results.map(item => `
      <article class="listing-card">
        <div class="image-fallback">${escapeHTML(item.icon)}</div>
        <div class="listing-body">
          <div class="badge-row">
            <span class="pill ${item.category === "Notes" ? "gold" : ""}">${escapeHTML(item.category)}</span>
            <span class="card-meta">${escapeHTML(item.condition)}</span>
          </div>
          <h3>${escapeHTML(item.title)}</h3>
          <p class="listing-description">${escapeHTML(item.description)}</p>
          <div class="card-meta">Listed by ${escapeHTML(item.seller)}</div>
          <div class="listing-divider"></div>
          <div class="listing-footer">
            <span class="price">${money(item.price)}</span>
            <button class="card-button" data-action="resource-interest" data-id="${item.id}">I'm interested</button>
          </div>
        </div>
      </article>
    `).join("")
    : emptyState("No resources found", "Try changing your search or category filter.");
}

function renderStays() {
  const query = $("#stay-search").value.trim().toLowerCase();
  const budget = Number($("#stay-budget").value);

  const results = state.stays.filter(stay => {
    const searchable = `${stay.title} ${stay.area} ${stay.type} ${stay.description}`.toLowerCase();
    return searchable.includes(query) && stay.rent <= budget;
  });

  $("#stay-count").textContent = `${results.length} accommodation listings · Demonstration data`;

  $("#stay-grid").innerHTML = results.length
    ? results.map(stay => `
      <article class="listing-card">
        <div class="image-fallback">${escapeHTML(stay.icon)}</div>
        <div class="listing-body">
          <div class="badge-row">
            <span class="pill purple">${escapeHTML(stay.type)}</span>
            <span class="pill gold">Sample listing</span>
          </div>
          <h3>${escapeHTML(stay.title)}</h3>
          <div class="card-meta">⌖ ${escapeHTML(stay.area)}</div>
          <p class="listing-description">${escapeHTML(stay.description)}</p>
          <div class="card-meta">Availability and terms require confirmation.</div>
          <div class="listing-divider"></div>
          <div class="listing-footer">
            <span class="price">${money(stay.rent)}<small> / month</small></span>
            <button class="card-button" data-action="stay-interest" data-id="${stay.id}">View details</button>
          </div>
        </div>
      </article>
    `).join("")
    : emptyState("No stays match your filters", "Try a higher budget or another search term.");
}

function emptyState(title, description) {
  return `
    <div class="empty-state">
      <span>⌕</span>
      <h3>${escapeHTML(title)}</h3>
      <p>${escapeHTML(description)}</p>
    </div>
  `;
}

function renderRecent() {
  const items = state.resources.slice(0, 3);
  $("#recent-listings").innerHTML = items.map(item => `
    <div class="recent-item">
      <div class="recent-icon">${escapeHTML(item.icon)}</div>
      <div class="recent-meta">
        <strong>${escapeHTML(item.title)}</strong>
        <span>${escapeHTML(item.category)} · ${escapeHTML(item.condition)}</span>
      </div>
      <div class="recent-price">${money(item.price)}</div>
    </div>
  `).join("");
}

function openModal(title, fields, submitLabel, onSubmit, note = "Demonstration only. Information is not sent to a server.") {
  $("#modal-title").textContent = title;

  $("#modal-body").innerHTML = `
    <form id="dynamic-form">
      <div class="form-grid">
        ${fields.map(field => {
          const full = field.full ? "full" : "";
          const required = field.required === false ? "" : "required";
          let control = "";

          if (field.type === "select") {
            control = `
              <select name="${escapeHTML(field.name)}" ${required}>
                ${field.options.map(option => `
                  <option value="${escapeHTML(option.value)}">${escapeHTML(option.label)}</option>
                `).join("")}
              </select>`;
          } else if (field.type === "textarea") {
            control = `<textarea name="${escapeHTML(field.name)}" placeholder="${escapeHTML(field.placeholder || "")}" ${required}></textarea>`;
          } else {
            control = `<input name="${escapeHTML(field.name)}" type="${escapeHTML(field.type || "text")}" placeholder="${escapeHTML(field.placeholder || "")}" ${field.min !== undefined ? `min="${field.min}"` : ""} ${required} />`;
          }

          return `
            <div class="form-field ${full}">
              <label>${escapeHTML(field.label)}${field.required === false ? " (optional)" : ""}</label>
              ${control}
            </div>`;
        }).join("")}
      </div>
      <p class="modal-note">${escapeHTML(note)}</p>
      <div class="form-actions">
        <button type="button" class="button button-secondary" data-action="close-modal">Cancel</button>
        <button type="submit" class="button button-primary">${escapeHTML(submitLabel)}</button>
      </div>
    </form>
  `;

  $("#modal-backdrop").hidden = false;

  $("#dynamic-form").addEventListener("submit", event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values = Object.fromEntries(form.entries());
    onSubmit(values);
  });

  $("#modal-close").focus();
}

function closeModal() {
  $("#modal-backdrop").hidden = true;
}

function requestMentor(id) {
  const mentor = state.mentors.find(item => item.id === Number(id));

  openModal(
    mentor ? `Request ${mentor.name}` : "Request a mentor",
    [
      { name: "student", label: "Your name", placeholder: "Enter your name" },
      { name: "topic", label: "What would you like help with?", placeholder: "e.g. DSA, projects, placements", full: true },
      { name: "message", label: "Message", type: "textarea", placeholder: "Introduce yourself and your goal", full: true }
    ],
    "Submit demo request",
    values => {
      closeModal();
      showToast("Demo mentorship request recorded in this session.");
      console.info("Demo mentorship request:", { mentor: mentor?.name || "Any mentor", ...values });
    }
  );
}

function addResource() {
  openModal(
    "Add a resource",
    [
      { name: "title", label: "Item title", placeholder: "e.g. Engineering Mathematics", full: true },
      { name: "category", label: "Category", type: "select", options: [
        { value: "Textbook", label: "Textbook" },
        { value: "Notes", label: "Notes" },
        { value: "Equipment", label: "Equipment" }
      ]},
      { name: "price", label: "Price (₹)", type: "number", min: 0 },
      { name: "condition", label: "Condition", placeholder: "e.g. Good condition", full: true },
      { name: "seller", label: "Your display name", placeholder: "e.g. Student" }
    ],
    "Add listing",
    values => {
      state.resources.unshift({
        id: nextId++,
        title: values.title.trim(),
        category: values.category,
        price: Number(values.price),
        condition: values.condition.trim(),
        seller: values.seller.trim(),
        icon: values.category === "Notes" ? "📝" : values.category === "Equipment" ? "🔌" : "📘",
        description: "Student-submitted demonstration listing."
      });
      closeModal();
      renderResources();
      renderRecent();
      showToast("Resource added to the current demo session.");
    }
  );
}

function addStay() {
  openModal(
    "Post an accommodation vacancy",
    [
      { name: "title", label: "Listing title", placeholder: "e.g. Shared student room", full: true },
      { name: "area", label: "Area", placeholder: "e.g. Near campus" },
      { name: "rent", label: "Monthly rent (₹)", type: "number", min: 1 },
      { name: "type", label: "Accommodation type", type: "select", options: [
        { value: "PG accommodation", label: "PG accommodation" },
        { value: "Shared room", label: "Shared room" },
        { value: "Shared flat", label: "Shared flat" },
        { value: "Private room", label: "Private room" }
      ]},
      { name: "description", label: "Details", type: "textarea", placeholder: "Add relevant details and availability", full: true }
    ],
    "Add vacancy",
    values => {
      state.stays.unshift({
        id: nextId++,
        title: values.title.trim(),
        area: values.area.trim(),
        rent: Number(values.rent),
        type: values.type,
        gender: "Details to be confirmed",
        icon: "🏠",
        description: values.description.trim() || "Student-submitted demonstration listing."
      });
      closeModal();
      renderStays();
      showToast("Vacancy added to the current demo session.");
    }
  );
}

function handleAction(action, id) {
  if (action === "close-modal") return closeModal();
  if (action === "mentor-request") return requestMentor(id);
  if (action === "add-resource") return addResource();
  if (action === "add-stay") return addStay();

  if (action === "resource-interest") {
    const item = state.resources.find(entry => entry.id === Number(id));
    openModal(
      "Express interest",
      [
        { name: "name", label: "Your name", placeholder: "Enter your name" },
        { name: "message", label: "Message to the student", type: "textarea", placeholder: "Ask about the item or arrange a handover", full: true }
      ],
      "Send demo enquiry",
      values => {
        closeModal();
        showToast("Demo enquiry recorded in this session.");
        console.info("Resource enquiry:", { item: item?.title, ...values });
      }
    );
    return;
  }

  if (action === "stay-interest") {
    const stay = state.stays.find(entry => entry.id === Number(id));
    openModal(
      "Accommodation enquiry",
      [
        { name: "name", label: "Your name", placeholder: "Enter your name" },
        { name: "moveIn", label: "Preferred move-in date", type: "date", required: false },
        { name: "message", label: "Questions", type: "textarea", placeholder: "Ask about availability, facilities or terms", full: true }
      ],
      "Submit demo enquiry",
      values => {
        closeModal();
        showToast("Demo accommodation enquiry recorded.");
        console.info("Accommodation enquiry:", { listing: stay?.title, ...values });
      }
    );
  }
}

document.addEventListener("click", event => {
  const pageButton = event.target.closest("[data-page]");
  if (pageButton) {
    event.preventDefault();
    navigate(pageButton.dataset.page);
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (actionButton) {
    handleAction(actionButton.dataset.action, actionButton.dataset.id);
  }
});

$("#modal-close").addEventListener("click", closeModal);

$("#modal-backdrop").addEventListener("click", event => {
  if (event.target === $("#modal-backdrop")) closeModal();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !$("#modal-backdrop").hidden) closeModal();
});

$("#mentor-search").addEventListener("input", renderMentors);
$("#mentor-department").addEventListener("change", renderMentors);
$("#resource-search").addEventListener("input", renderResources);
$("#resource-category").addEventListener("change", renderResources);
$("#resource-sort").addEventListener("change", renderResources);
$("#stay-search").addEventListener("input", renderStays);
$("#stay-budget").addEventListener("change", renderStays);

$("#today-date").textContent = new Date().toLocaleDateString("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric"
});

renderRecent();
renderMentors();
renderResources();
renderStays();