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
    alert("请输入有效的日期（格式：YYYY-MM-DD）！");
    return;
  }

  if (!date || !subject || isNaN(hours)) {
    alert("请填写所有字段！");
    return;
  }

  const sessionData = { date, subject, hours, color };

  try {
    const response = await fetch("/api/add-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sessionData)
    });

    let result = {};
    try {
      result = await response.json();
    } catch (e) {
      console.warn("⚠️ JSON 解析失败：", e);
    }

    if (response.ok) {
      alert(result.message || "添加成功！");
      
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
    document.getElementById("total-hours").textContent = summary.totalHours || 0;
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
    const response = await fetch(`/api/delete-session/${id}`, { method: "DELETE" });
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
      headers: { "Content-Type": "application/json" },
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
      headers: { "Content-Type": "application/json" },
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

  // 更新全部视图
  fetchSummary(currentWeekStart);
  renderProductivityChart(currentWeekStart);
  updateSummaryWeekLabel(currentWeekStart);
  updateWeekLabel(currentWeekStart);
  updatePieWeekLabel(currentWeekStart);
  renderPieChart(currentWeekStart); // ✅ 你之前是单独写的 pie 渲染
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












// ✅ 全局变量
let sharedBarChart = null;
let sharedPieChart = null;
let currentSharedSender = null;
let currentSharedStartDate = getStartOfWeek(new Date());

// ✅ 注册 DOMContentLoaded
window.addEventListener("DOMContentLoaded", () => {
  const senderSelect = document.getElementById("sender-select");
  if (!senderSelect) return;

  // ✅ 加载可选发送者
  fetch("/api/received-shares")
    .then(res => res.json())
    .then(data => {
      Object.keys(data).forEach(sender => {
        const option = document.createElement("option");
        option.value = sender;
        option.textContent = sender;
        senderSelect.appendChild(option);
      });
    });

  // ✅ 切换 sender 时加载共享数据
  senderSelect.addEventListener("change", async (e) => {
    const selected = e.target.value;
    if (!selected) return;

    const res1 = await fetch("/api/received-shares");
    const allData = await res1.json();
    const permission = allData[selected];

    // ✅ 设置当前 sender 和重置日期
    currentSharedSender = selected;
    currentSharedStartDate = getStartOfWeek(new Date());

    // ✅ 控制区域可见性
    document.getElementById("shared-summary-cards").style.display = permission.summary.length ? "flex" : "none";
    document.getElementById("shared-bar-chart-section").style.display = permission.bar.length ? "block" : "none";
    document.getElementById("shared-pie-chart-section").style.display = permission.pie.length ? "block" : "none";

    updateSharedViews(0);
  });

  // ✅ 周切换按钮绑定
  document.getElementById("prev-shared-week").addEventListener("click", () => updateSharedViews(-1));
  document.getElementById("next-shared-week").addEventListener("click", () => updateSharedViews(1));
});

// ✅ 主函数：切换周并更新所有视图
async function updateSharedViews(offset) {
  if (!currentSharedSender) return;

  const newStart = new Date(currentSharedStartDate);
  newStart.setDate(newStart.getDate() + offset * 7);
  currentSharedStartDate = newStart;

  const end = new Date(newStart);
  end.setDate(end.getDate() + 6);
  document.getElementById("shared-week-label").textContent = `${formatDate(newStart)} ~ ${formatDate(end)}`;

  // ✅ 拉取共享数据
  const res = await fetch(`/api/shared-chart-data?sender_email=${currentSharedSender}&start=${formatDate(newStart)}`);
  const data = await res.json();

  // ✅ 渲染 Summary
  const { totalHours, mostStudied, leastStudied } = data.summary;
  document.getElementById("shared-total-hours").textContent = totalHours || 0;
  document.getElementById("shared-most-subject").textContent = mostStudied || "-";
  document.getElementById("shared-least-subject").textContent = leastStudied || "-";

  // ✅ 渲染柱状图
  
    // ✅ 构建最近 7 天的日期标签
const recentDates = [];
for (let i = 0; i < 7; i++) {
  const d = new Date(currentSharedStartDate);
  d.setDate(d.getDate() + i);
  recentDates.push(formatDate(d));
}

// ✅ 提取所有出现过的学科
const subjectsSet = new Set();
recentDates.forEach(date => {
  const dayData = data.rawData?.[date];
  if (dayData) {
    Object.keys(dayData).forEach(subject => subjectsSet.add(subject));
  }
});
const subjects = Array.from(subjectsSet);

// ✅ 构建 datasets
const datasets = subjects.map(subject => ({
  label: subject,
  data: recentDates.map(date => data.rawData?.[date]?.[subject]?.hours || 0),
  backgroundColor: data.rawData?.[recentDates.find(d => data.rawData[d]?.[subject])]?.[subject]?.color || "#888888"
}));

// ✅ 销毁旧图表
if (sharedBarChart) sharedBarChart.destroy();

// ✅ 绘制新图表
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

  

  // ✅ 渲染饼图
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

// ✅ 工具函数
function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

// ✅ Share Modal 逻辑
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
      headers: { "Content-Type": "application/json" },
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
    } else {
      alert("❌ Error: " + result.error);
    }
  });
}


let lastScrollY = window.scrollY;

window.addEventListener("scroll", () => {
  const navbar = document.querySelector(".navbar");

  if (window.scrollY > lastScrollY) {
    // 向下滚动
    navbar.classList.add("hide");
  } else {
    // 向上滚动
    navbar.classList.remove("hide");
  }

  lastScrollY = window.scrollY;
});

async function loadSentShares() {
  const res = await fetch("/api/sent-shares");
  const data = await res.json();
  const table = document.getElementById("my-shared-table");

  if (!data.length) {
    table.innerHTML = "<tr><td colspan='6'>No shares yet.</td></tr>";
    return;
  }

  table.innerHTML = `
    <thead>
      <tr>
        <th>Recipient</th><th>Summary</th><th>Bar</th><th>Pie</th><th>Actions</th>
      </tr>
    </thead>
    <tbody>
      ${data.map(r => `
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
      `).join("")}
    </tbody>
  `;
}


async function deleteShare(id) {
  if (!confirm("Are you sure to revoke this share?")) return;
  const res = await fetch(`/api/delete-share/${id}`, { method: "DELETE" });
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

async function submitEditShare() {
  const id = document.getElementById("edit-share-id").value;
  const body = {
    share_summary: document.getElementById("edit-share-summary").checked,
    share_bar: document.getElementById("edit-share-bar").checked,
    share_pie: document.getElementById("edit-share-pie").checked
  };

  const res = await fetch(`/api/update-share/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const result = await res.json();
  alert(result.message);
  $('#editShareModal').modal('hide');
  loadSentShares();
}
