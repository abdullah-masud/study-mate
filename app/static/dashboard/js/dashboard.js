// ✅ 获取 CSRF Token
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;

let currentWeekStart = getStartOfWeek(new Date());

// Unified initialisation after page load
window.addEventListener("DOMContentLoaded", () => {
  updateAllViews(0);
  fetchRecords();
  loadSentShares();
  

  flatpickr("#date", {
    dateFormat: "Y-m-d",
    maxDate: "today"
  });

  // 初始化更新分享按钮
  const updateShareBtn = document.getElementById("update-share-btn");
  if (updateShareBtn) {
    updateShareBtn.addEventListener("click", updateShare);
  }
});

// Form Submission Logic
document.getElementById("submit-btn").addEventListener("click", async () => {
  const date = document.getElementById("date").value;
  const subject = document.getElementById("subject").value;
  const hours = parseFloat(document.getElementById("hours").value);
  const color = document.getElementById("color").value;
  const userId = localStorage.getItem('user_id');
  
  const isValidDate = (dateString) => {
    const date = new Date(dateString);
    const isValidFormat = /^\d{4}-\d{2}-\d{2}$/.test(dateString);
    return isValidFormat && !isNaN(date.getTime());
  };

  if (!isValidDate(date)) {
    alert("Please enter a valid date (format: YYYY-MM-DD)!");
    return;
  }

  if (!date || !subject || isNaN(hours)) {
    alert("Please complete all fields!");
    return;
  }

  const sessionData = { date, subject, hours, color };

  try {
    const response = await fetch("/api/add-session", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRFToken": csrfToken},
      body: JSON.stringify(sessionData)
    });

    let result = {};
    try {
      result = await response.json();
    } catch (e) {
      console.warn("⚠️ JSON parsing failed:", e);
    }

    if (response.ok) {
      alert(result.message || "Add successfully！");
      
      // ✅ Manually clear form fields
      document.getElementById("date").value = "";
      document.getElementById("subject").value = "";
      document.getElementById("hours").value = "";
      document.getElementById("color").value = "#3b82f6";
    
      fetchSummary();
      fetchRecords();
      renderProductivityChart(currentWeekStart);
    } else {
      alert("Failed to submit：" + (result.error || "unknown error"));
    }
  } catch (error) {
    console.error("❌ network error：", error);
    alert("Network error, please try again later!");
  }
});

async function fetchSummary(startDate = currentWeekStart) {
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  const startStr = formatDate(startDate);
  const endStr = formatDate(endDate);

  try {
    const response = await fetch(`/api/get-summary?start=${startStr}&end=${endStr}`);
    const summary = await response.json();
    document.getElementById("total-hours").textContent = Number(summary.totalHours || 0).toFixed(1);
    document.getElementById("most-subject").textContent = summary.mostStudied || "-";
    document.getElementById("least-subject").textContent = summary.leastStudied || "-";
  } catch (error) {
    console.error("❌ Failed to get statistics：", error);
  }
}


function updateSummaryWeekLabel(startDate) {
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  document.getElementById("summary-week-label").textContent =
    `${formatDate(startDate)} ~ ${formatDate(endDate)}`;
}




async function fetchRecords() {
  try {
    const response = await fetch("/api/get-records");
    const records = await response.json();

    const tableBody = document.getElementById("records-table-body");
    tableBody.innerHTML = "";
    const subjectColorMap = {};

    records.forEach(record => {
      if (!subjectColorMap[record.subject]) {
        subjectColorMap[record.subject] = record.color;
      }

      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="p-2 border text-center">${record.date}</td>
        <td class="p-2 border text-center">${record.subject}</td>
        <td class="p-2 border text-center">${record.hours}</td>
        <td class="p-2 border text-center flex justify-center items-center gap-2">
          <input type="color" value="${subjectColorMap[record.subject]}" data-subject="${record.subject}" onchange="handleColorChange('${record.subject}', this.value)" />
          <button onclick="deleteRecord(${record.id})" class="text-red-600 hover:underline">🗑️ delete</button>
        </td>`;
      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error("❌ Failed to get the record:", error);
  }
}

async function deleteRecord(id) {
  if (!confirm("Sure you want to delete this record?")) return;

  try {
    const response = await fetch(`/api/delete-session/${id}`, {
      method: "DELETE",
      headers: {
        "X-CSRFToken": csrfToken  // ✅ 添加 CSRF 令牌
      }
    });
    const result = await response.json();

    if (response.ok) {
      fetchSummary();
      fetchRecords();
      renderProductivityChart();
    } else {
      alert("Failed to delete：" + result.error);
    }
  } catch (error) {
    alert("Network error, unable to delete records");
  }
}


async function updateColor(id, newColor) {
  try {
    const response = await fetch(`/api/update-color/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" ,"X-CSRFToken": csrfToken},
      body: JSON.stringify({ color: newColor })
    });
    if (response.ok) {
      renderProductivityChart();
    } else {
      alert("Colour update failed");
    }
  } catch (error) {
    alert("Network error, unable to change colour");
  }
}

let chartInstance = null;

async function renderProductivityChart(startDate = currentWeekStart) {
  updateWeekLabel(startDate);

  try {
    const response = await fetch(`/api/productivity-by-day?start=${formatDate(startDate)}`);
    const data = await response.json();

    const recentDates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      recentDates.push(formatDate(d));
    }

    const labels = recentDates;
    const subjectsSet = new Set();
    recentDates.forEach(date => {
      Object.keys(data[date] || {}).forEach(sub => subjectsSet.add(sub));
    });

    const subjects = Array.from(subjectsSet);
    const datasets = subjects.map(subject => ({
      label: subject,
      data: recentDates.map(date => data[date]?.[subject]?.hours || 0),
      backgroundColor: data[recentDates.find(d => data[d]?.[subject])]?.[subject]?.color || "#999"
    }));

    if (chartInstance) chartInstance.destroy();
    const ctx = document.getElementById("productivity-chart").getContext("2d");
    chartInstance = new Chart(ctx, {
      type: "bar",
      data: { labels, datasets },
      options: {
        responsive: true,
        plugins: {
          tooltip: { mode: "index", intersect: false },
          legend: { position: "top" }
        },
        scales: {
          x: { stacked: true },
          y: { stacked: true, beginAtZero: true, title: { display: true, text: "Hours Studied" } }
        }
      }
    });

    renderPieChartFromWeekData(data);
  } catch (error) {
    console.error("Chart loading failure：", error);
  }
}

// Updating the date labels of pie charts
function updatePieWeekLabel(startDate) {
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  document.getElementById("pie-week-label").textContent =
    `${formatDate(startDate)} ~ ${formatDate(endDate)}`;
}


function renderPieChartFromWeekData(data) {
  const subjectTotal = {};
  const subjectColors = {};
  for (const date in data) {
    for (const subject in data[date]) {
      const sub = subject.toLowerCase();
      subjectTotal[sub] = (subjectTotal[sub] || 0) + data[date][subject].hours;
      if (!subjectColors[sub]) subjectColors[sub] = data[date][subject].color || "#ccc";
    }
  }

  const labels = Object.keys(subjectTotal);
  const values = labels.map(sub => subjectTotal[sub]);
  const colors = labels.map(sub => subjectColors[sub]);

  if (pieChartInstance) pieChartInstance.destroy();
  const ctx = document.getElementById("weekly-pie-chart").getContext("2d");
  pieChartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [{ data: values, backgroundColor: colors }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom", labels: { font: { size: 14 } } },
        tooltip: {
          callbacks: {
            label: (context) => `${context.label}: ${context.raw} hrs`
          }
        }
      }
    }
  });
}

async function handleColorChange(subject, newColor) {
  try {
    document.querySelectorAll(`input[data-subject="${subject}"]`).forEach(input => input.value = newColor);
    const response = await fetch(`/api/update-color-subject/${subject}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-CSRFToken": csrfToken },
      body: JSON.stringify({ color: newColor })
    });
    if (response.ok) renderProductivityChart();
    else alert("update failure");
  } catch (error) {
    alert("Network error, unable to change colour");
  }
}

function updateAllViews(offset) {
  const newStart = new Date(currentWeekStart);
  newStart.setDate(newStart.getDate() + 7 * offset);
  currentWeekStart = newStart;

  // Update All Views
  fetchSummary(currentWeekStart);
  renderProductivityChart(currentWeekStart);
  updateSummaryWeekLabel(currentWeekStart);
  updateWeekLabel(currentWeekStart);
  updatePieWeekLabel(currentWeekStart);
  renderPieChart(currentWeekStart); 
}


document.getElementById("prev-week").addEventListener("click", () => updateAllViews(-1));
document.getElementById("next-week").addEventListener("click", () => updateAllViews(1));
document.getElementById("prev-summary-week").addEventListener("click", () => updateAllViews(-1));
document.getElementById("next-summary-week").addEventListener("click", () => updateAllViews(1));
document.getElementById("prev-pie-week").addEventListener("click", () => updateAllViews(-1));
document.getElementById("next-pie-week").addEventListener("click", () => updateAllViews(1));





function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function updateWeekLabel(startDate) {
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  document.getElementById("week-label").textContent = `${formatDate(startDate)} ~ ${formatDate(endDate)}`;
}

let pieChartInstance = null;

// Update the date labels of the pie chart
async function renderPieChart(startDate = currentWeekStart) {
  const response = await fetch(`/api/productivity-by-day?start=${formatDate(startDate)}`);
  const data = await response.json();
  renderPieChartFromWeekData(data);
  updatePieWeekLabel(startDate);
}












// ✅ global variable
let sharedBarChart = null;
let sharedPieChart = null;
let currentSharedSender = null;
let currentSharedStartDate = getStartOfWeek(new Date());
let allSenders = []; // Store all available senders

// ✅ Register DOMContentLoaded
window.addEventListener("DOMContentLoaded", () => {
  const senderSelect = document.getElementById("sender-select");
  const senderSearchInput = document.getElementById("sender-search");
  const senderSearchResults = document.getElementById("sender-search-results");
  
  if (!senderSelect || !senderSearchInput) return;

  // Load all senders for dropdown and search functionality
  fetch("/api/received-shares")
    .then(res => res.json())
    .then(data => {
      allSenders = Object.keys(data).map(email => {
        return {
          email,
          permissions: data[email]
        };
      });
      
      // Populate the hidden select element (for compatibility)
      allSenders.forEach(sender => {
        const option = document.createElement("option");
        option.value = sender.email;
        option.textContent = sender.email;
        senderSelect.appendChild(option);
      });
    });
  
  // Function to display search results
  function displaySearchResults(senders) {
    if (senders.length === 0) {
      senderSearchResults.innerHTML = '<div class="alert alert-info">No matching senders found</div>';
    } else {
      senderSearchResults.innerHTML = senders.map(sender => `
        <div class="card mb-2 sender-result" data-email="${sender.email}">
          <div class="card-body py-2">
            <div><strong>${sender.email}</strong></div>
          </div>
        </div>
      `).join('');
      
      // Add click event to select sender
      document.querySelectorAll('.sender-result').forEach(card => {
        card.addEventListener('click', function() {
          const email = this.dataset.email;
          selectSender(email);
        });
      });
    }
    
    senderSearchResults.style.display = 'block';
  }
  
  // Function to select a sender
  function selectSender(email) {
    currentSharedSender = email;
    senderSelect.value = email;
    senderSearchInput.value = email;
    senderSearchResults.style.display = 'none';
    
    // Trigger change event to load the data
    const event = new Event('change');
    senderSelect.dispatchEvent(event);
  }
  
  // Show all senders when clicking the search input
  senderSearchInput.addEventListener('focus', function() {
    displaySearchResults(allSenders);
  });
  
  // Real-time search on input
  senderSearchInput.addEventListener('input', function() {
    const searchTerm = this.value.trim();
    
    // Filter senders based on input
    const filteredSenders = searchTerm 
      ? allSenders.filter(sender => 
          sender.email.toLowerCase().includes(searchTerm.toLowerCase()))
      : allSenders;
    
    displaySearchResults(filteredSenders);
  });
  
  // Clear search results when clicking outside
  document.addEventListener('click', (event) => {
    if (!senderSearchResults.contains(event.target) && 
        event.target !== senderSearchInput) {
      senderSearchResults.style.display = "none";
    }
  });

  // Loading shared data when switching senders
  senderSelect.addEventListener("change", async (e) => {
    const selected = e.target.value;
    if (!selected) return;

    const res1 = await fetch("/api/received-shares");
    const allData = await res1.json();
    const permission = allData[selected];

    // Set the current sender and reset date
    currentSharedSender = selected;
    currentSharedStartDate = getStartOfWeek(new Date());

    // Control area visibility
    document.getElementById("shared-summary-cards").style.display = permission.summary.length ? "flex" : "none";
    document.getElementById("shared-bar-chart-section").style.display = permission.bar.length ? "block" : "none";
    document.getElementById("shared-pie-chart-section").style.display = permission.pie.length ? "block" : "none";

    updateSharedViews(0);
  });

  // Weekly Switch Button Binding
  document.getElementById("prev-shared-week").addEventListener("click", () => updateSharedViews(-1));
  document.getElementById("next-shared-week").addEventListener("click", () => updateSharedViews(1));
});

// ✅ Main function: switch weeks and update all views
async function updateSharedViews(offset) {
  if (!currentSharedSender) return;

  const newStart = new Date(currentSharedStartDate);
  newStart.setDate(newStart.getDate() + offset * 7);
  currentSharedStartDate = newStart;

  const end = new Date(newStart);
  end.setDate(end.getDate() + 6);
  document.getElementById("shared-week-label").textContent = `${formatDate(newStart)} ~ ${formatDate(end)}`;

  // ✅ Pulling shared data
  const res = await fetch(`/api/shared-chart-data?sender_email=${currentSharedSender}&start=${formatDate(newStart)}`);
  const data = await res.json();

  // ✅ Rendering summary cards
  const { totalHours, mostStudied, leastStudied } = data.summary;
  document.getElementById("shared-total-hours").textContent = Number(totalHours || 0).toFixed(1);
  document.getElementById("shared-most-subject").textContent = mostStudied || "-";
  document.getElementById("shared-least-subject").textContent = leastStudied || "-";

  // ✅ Rendering Bar Charts
  
    // ✅ Build date labels for the last 7 days
const recentDates = [];
for (let i = 0; i < 7; i++) {
  const d = new Date(currentSharedStartDate);
  d.setDate(d.getDate() + i);
  recentDates.push(formatDate(d));
}

// ✅ Extract all occurrences of the discipline
const subjectsSet = new Set();
recentDates.forEach(date => {
  const dayData = data.rawData?.[date];
  if (dayData) {
    Object.keys(dayData).forEach(subject => subjectsSet.add(subject));
  }
});
const subjects = Array.from(subjectsSet);

// ✅ Build datasets for each discipline
const datasets = subjects.map(subject => ({
  label: subject,
  data: recentDates.map(date => data.rawData?.[date]?.[subject]?.hours || 0),
  backgroundColor: data.rawData?.[recentDates.find(d => data.rawData[d]?.[subject])]?.[subject]?.color || "#888888"
}));

// ✅ Destruction of old charts
if (sharedBarChart) sharedBarChart.destroy();

// ✅ Plotting new charts
const ctxBar = document.getElementById("shared-productivity-canvas").getContext("2d");
sharedBarChart = new Chart(ctxBar, {
  type: "bar",
  data: {
    labels: recentDates,
    datasets: datasets
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: { size: 14 }
        }
      },
      tooltip: {
        mode: "index",
        intersect: false
      }
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          autoSkip: false,
          maxRotation: 45,
          minRotation: 0,
          font: { size: 12 }
        }
      },
      y: {
        stacked: true,
        beginAtZero: true,
        title: {
          display: true,
          text: "Hours Studied",
          font: { size: 14 }
        },
        ticks: {
          font: { size: 12 }
        }
      }
    }
  }
});

  

  // ✅ rendering pie chart
  if (sharedPieChart) sharedPieChart.destroy();
  const ctxPie = document.getElementById("shared-pie-canvas").getContext("2d");
  sharedPieChart = new Chart(ctxPie, {
    type: "pie",
    data: data.pieChartData,
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" }
      }
    }
  });
}

// ✅ instrumental function
function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

// ✅ Share Modal 
const shareBtn = document.getElementById("confirm-share");
if (shareBtn) {
  shareBtn.addEventListener("click", async () => {
    const recipientEmail = document.getElementById("receiver-email")?.value.trim();
    const shareSummary = document.getElementById("share-summary")?.checked;
    const shareBar = document.getElementById("share-productivity")?.checked;
    const sharePie = document.getElementById("share-piechart")?.checked;

    if (!recipientEmail) {
      alert("Please enter a recipient email.");
      return;
    }

    const response = await fetch("/api/share-record", {
      method: "POST",
      headers: { "Content-Type": "application/json" ,"X-CSRFToken": csrfToken},
      body: JSON.stringify({
        recipient_email: recipientEmail,
        share_summary: shareSummary,
        share_bar: shareBar,
        share_pie: sharePie
      })
    });

    const result = await response.json();
    if (response.ok) {
      alert("🎉 Shared successfully!");
      document.getElementById("shareModal")?.querySelector(".close")?.click();
      loadSentShares(); 
    } else {
      alert("❌ Error: " + result.error);
    }
  });
}

// ✅ Add event listener for update share button
const updateShareBtn = document.getElementById("update-share-btn");
if (updateShareBtn) {
  updateShareBtn.addEventListener("click", updateShare);
}

let lastScrollY = window.scrollY;

window.addEventListener("scroll", () => {
  const navbar = document.querySelector(".navbar");

  if (window.scrollY > lastScrollY) {
    
    navbar.classList.add("hide");
  } else {
    
    navbar.classList.remove("hide");
  }

  lastScrollY = window.scrollY;
});

async function loadSentShares() {
  const res = await fetch("/api/sent-shares");
  const data = await res.json();
  const tbody = document.querySelector("#my-shared-table tbody");

  if (!tbody) return;

  if (!data.length) {
    tbody.innerHTML = "<tr><td colspan='5'>No shares yet.</td></tr>";
    return;
  }

  tbody.innerHTML = data.map(r => `
    <tr>
      <td>${r.recipient_email}</td>
      <td>${r.summary ? "✅" : "❌"}</td>
      <td>${r.bar ? "✅" : "❌"}</td>
      <td>${r.pie ? "✅" : "❌"}</td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="deleteShare(${r.id})">🗑️</button>
        <button class="btn btn-sm btn-info" onclick="openEditShare(${r.id}, ${r.summary}, ${r.bar}, ${r.pie})">✏️</button>
      </td>
    </tr>
  `).join("");
}



async function deleteShare(id) {
  if (!confirm("Are you sure to revoke this share?")) return;
  const res = await fetch(`/api/delete-share/${id}`, {
    method: "DELETE",
    headers: {
      "X-CSRFToken": csrfToken  
    }
  });
  const result = await res.json();
  alert(result.message);
  loadSentShares();
}

function openEditShare(id, summary, bar, pie) {
  document.getElementById("edit-share-id").value = id;
  document.getElementById("edit-share-summary").checked = summary;
  document.getElementById("edit-share-bar").checked = bar;
  document.getElementById("edit-share-pie").checked = pie;
  $('#editShareModal').modal('show');
}

async function updateShare() {
  const id = document.getElementById("edit-share-id").value;
  const body = {
    share_summary: document.getElementById("edit-share-summary").checked,
    share_bar: document.getElementById("edit-share-bar").checked,
    share_pie: document.getElementById("edit-share-pie").checked
  };

  const res = await fetch(`/api/update-share/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "X-CSRFToken": csrfToken },
    body: JSON.stringify(body)
  });

  const result = await res.json();

  if (!res.ok && result.error?.includes("already shared")) {
    alert("⚠️ You've already shared with this user. Please update or delete the existing record instead.");
    return;
  }

  alert(result.message);
  $('#editShareModal').modal('hide');
  loadSentShares();
}

// ✅ Add submitEditShare function for calling from HTML
function submitEditShare() {
  updateShare();
}

// ✅ To-Do List Logic
const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");

window.addEventListener("DOMContentLoaded", () => {
  const savedTodos = JSON.parse(localStorage.getItem("todos") || "[]");
  savedTodos.forEach(todo => renderTodo(todo.text, todo.completed));
});

todoForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = todoInput.value.trim();
  if (!text) return;
  renderTodo(text, false);
  saveTodos();
  todoInput.value = "";
});

function renderTodo(text, completed) {
  const li = document.createElement("li");
  li.className = `list-group-item ${completed ? "completed" : ""}`;
  li.innerHTML = `
    <span>${text}</span>
    <div class="todo-actions">
      <button class="btn btn-sm btn-outline-success">${completed ? "✅" : "✔️"}</button>
      <button class="btn btn-sm btn-outline-danger">🗑️</button>
    </div>
  `;
  li.querySelector(".btn-outline-success").addEventListener("click", () => {
    li.classList.toggle("completed");
    saveTodos();
  });
  li.querySelector(".btn-outline-danger").addEventListener("click", () => {
    li.remove();
    saveTodos();
  });
  todoList.appendChild(li);
}

function saveTodos() {
  const todos = [];
  todoList.querySelectorAll("li").forEach(li => {
    todos.push({
      text: li.querySelector("span").textContent,
      completed: li.classList.contains("completed")
    });
  });
  localStorage.setItem("todos", JSON.stringify(todos));
}

document.getElementById("export-pdf-btn").addEventListener("click", async () => {
  try {
    // Show loading indicator
    const exportBtn = document.getElementById("export-pdf-btn");
    const originalBtnText = exportBtn.innerHTML;
    exportBtn.innerHTML = "Exporting...";
    exportBtn.disabled = true;
    
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");
    
    // Get user information
    const username = document.querySelector("h2.mb-4 strong")?.textContent || "User";
    
    // Get proper date format from the week label
    const weekLabel = document.getElementById("week-label").textContent;
    
    // Add report header with user name
    pdf.setFillColor(33, 37, 41);
    pdf.rect(0, 0, pdf.internal.pageSize.width, 25, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.text("StudyMate - Weekly Summary", 105, 15, { align: 'center' });
    
    // Add user info section
    pdf.setFillColor(240, 240, 240);
    pdf.rect(0, 25, pdf.internal.pageSize.width, 10, 'F');
    
    pdf.setTextColor(33, 37, 41);
    pdf.setFontSize(12);
    pdf.text(`Report for: ${username}`, 10, 32);
    
    // Add summary text
    pdf.setFontSize(12);
    pdf.setTextColor(33, 37, 41);
    const totalHours = document.getElementById("total-hours").textContent;
    const mostSubject = document.getElementById("most-subject").textContent;
    const leastSubject = document.getElementById("least-subject").textContent;
    
    pdf.text("Week Period: " + weekLabel, 10, 45);
    pdf.text("Total Hours: " + totalHours, 10, 52);
    pdf.text("Most Studied Subject: " + mostSubject, 10, 59);
    pdf.text("Least Studied Subject: " + leastSubject, 10, 66);
    
    // Add separator line
    pdf.setDrawColor(220, 220, 220);
    pdf.line(10, 70, 200, 70);
    
    // Clone and prepare bar chart for export
    await prepareBarChartForExport();
    
    // Capture bar chart with better quality
    const barContainer = document.getElementById("export-bar-container");
    const barCanvas = barContainer.querySelector("canvas");
    
    const barImage = await html2canvas(barCanvas, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true
    });
    
    // Add Bar Chart title
    pdf.setFontSize(14);
    pdf.text("Productivity by Day", 105, 75, { align: 'center' });
    
    const barData = barImage.toDataURL("image/png");
    pdf.addImage(barData, "PNG", 15, 80, 180, 70);
    
    // Clone and prepare pie chart for export
    await preparePieChartForExport();
    
    // Add separator line
    pdf.line(10, 155, 200, 155);
    
    // Add Pie Chart title
    pdf.text("Subject Distribution", 105, 160, { align: 'center' });
    
    // Capture pie chart with better quality and maintain aspect ratio
    const pieContainer = document.getElementById("export-pie-container");
    const pieCanvas = pieContainer.querySelector("canvas");
    
    const pieImage = await html2canvas(pieCanvas, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true
    });
    
    const pieData = pieImage.toDataURL("image/png");
    
    // Calculate dimensions to maintain aspect ratio (1:1 for a circle)
    const pieWidth = 120; // Reduced width for better circular appearance
    const pieHeight = 120; // Equal to width to maintain aspect ratio
    const pieX = 50; // Center it horizontally
    
    pdf.addImage(pieData, "PNG", pieX, 165, pieWidth, pieHeight);
    
    // Add footer with date and user info
    pdf.setFillColor(240, 240, 240);
    pdf.rect(0, 275, pdf.internal.pageSize.width, 22, 'F');
    
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    const exportDate = new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString();
    pdf.text(`Generated for: ${username}`, 10, 280);
    pdf.text(`Generated on: ${exportDate}`, 10, 285);
    
    // Add page number
    pdf.text("Page 1 of 1", 195, 285, { align: 'right' });
    
    // Add website info
    pdf.setFontSize(8);
    pdf.text("StudyMate.com - Track your learning progress", 105, 292, { align: 'center' });
    
    // Save with formatted date and username in the filename
    const sanitizedUsername = username.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `StudyMate_${sanitizedUsername}_${weekLabel.replace(/\s/g, '').replace(/~/g, '-')}.pdf`;
    pdf.save(fileName);
    
    // Clean up temporary containers
    document.getElementById("export-bar-container")?.remove();
    document.getElementById("export-pie-container")?.remove();
    
    // Restore button state
    exportBtn.innerHTML = originalBtnText;
    exportBtn.disabled = false;
    
  } catch (error) {
    console.error("Error exporting PDF:", error);
    alert("Failed to export PDF. Please try again.");
    
    // Make sure button is restored even on error
    const exportBtn = document.getElementById("export-pdf-btn");
    exportBtn.innerHTML = "📄 Export Summary as PDF";
    exportBtn.disabled = false;
    
    // Clean up on error
    document.getElementById("export-bar-container")?.remove();
    document.getElementById("export-pie-container")?.remove();
  }
});

// Function to prepare bar chart for export with better formatting
async function prepareBarChartForExport() {
  // Create a temporary container for the export chart
  const tempContainer = document.createElement("div");
  tempContainer.id = "export-bar-container";
  tempContainer.style.position = "absolute";
  tempContainer.style.left = "-9999px";
  tempContainer.style.width = "800px";
  tempContainer.style.height = "400px";
  tempContainer.style.backgroundColor = "#ffffff";
  document.body.appendChild(tempContainer);
  
  // Create a canvas in the container
  const canvas = document.createElement("canvas");
  tempContainer.appendChild(canvas);
  
  // Get the original chart data
  const originalChart = chartInstance;
  if (!originalChart) return;
  
  // Create a clone of the chart with export-optimized options
  const ctx = canvas.getContext("2d");
  const exportChart = new Chart(ctx, {
    type: "bar",
    data: JSON.parse(JSON.stringify(originalChart.data)), // Deep clone data
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: false,
      plugins: {
        legend: {
          position: "top",
          labels: {
            font: { size: 14, weight: 'bold' },
            padding: 20
          }
        },
        tooltip: { enabled: false }
      },
      scales: {
        x: {
          stacked: true,
          ticks: {
            font: { size: 12 },
            maxRotation: 45,
            minRotation: 45
          },
          grid: {
            display: true,
            color: "#f0f0f0"
          }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          title: {
            display: true,
            text: "Hours Studied",
            font: { size: 14, weight: 'bold' }
          },
          ticks: {
            font: { size: 12 }
          },
          grid: {
            display: true,
            color: "#f0f0f0"
          }
        }
      }
    }
  });
  
  // Wait for chart to render
  await new Promise(resolve => setTimeout(resolve, 200));
  return exportChart;
}

// Function to prepare pie chart for export with better formatting
async function preparePieChartForExport() {
  // Create a temporary container for the export chart
  const tempContainer = document.createElement("div");
  tempContainer.id = "export-pie-container";
  tempContainer.style.position = "absolute";
  tempContainer.style.left = "-9999px";
  tempContainer.style.width = "600px";  // Make width and height equal
  tempContainer.style.height = "600px";  // Make width and height equal
  tempContainer.style.backgroundColor = "#ffffff";
  document.body.appendChild(tempContainer);
  
  // Create a canvas in the container with square dimensions
  const canvas = document.createElement("canvas");
  canvas.width = 600;  // Set explicit width
  canvas.height = 600; // Set explicit height
  tempContainer.appendChild(canvas);
  
  // Get the original chart data
  const originalChart = pieChartInstance;
  if (!originalChart) return;
  
  // Create a clone of the chart with export-optimized options
  const ctx = canvas.getContext("2d");
  const exportChart = new Chart(ctx, {
    type: "pie",
    data: JSON.parse(JSON.stringify(originalChart.data)), // Deep clone data
    options: {
      responsive: false,  // Disable responsive to maintain aspect ratio
      maintainAspectRatio: true,
      animation: false,
      layout: {
        padding: {
          top: 50,    // Add padding to ensure the chart is centered
          bottom: 50, 
          left: 50,
          right: 50
        }
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            font: { size: 14, weight: 'bold' },
            padding: 20,
            boxWidth: 40,
            generateLabels: function(chart) {
              const data = chart.data;
              if (data.labels.length && data.datasets.length) {
                return data.labels.map((label, i) => {
                  const dataset = data.datasets[0];
                  const value = dataset.data[i];
                  return {
                    text: `${label}: ${value} hrs`,
                    fillStyle: dataset.backgroundColor[i],
                    hidden: false,
                    index: i
                  };
                });
              }
              return [];
            }
          }
        },
        tooltip: { enabled: false }
      }
    }
  });
  
  // Wait for chart to render
  await new Promise(resolve => setTimeout(resolve, 300));
  return exportChart;
}


