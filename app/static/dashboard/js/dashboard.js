let currentWeekStart = getStartOfWeek(new Date());

// Unified initialisation after page load
window.addEventListener("DOMContentLoaded", () => {
  fetchSummary();
  fetchRecords();
  renderProductivityChart();

  flatpickr("#date", {
    dateFormat: "Y-m-d",
    maxDate: "today"
  });
});

// Form Submission Logic
document.getElementById("submit-btn").addEventListener("click", async () => {
  const date = document.getElementById("date").value;
  const subject = document.getElementById("subject").value;
  const hours = parseInt(document.getElementById("hours").value, 10);
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

async function fetchSummary() {
  try {
    const response = await fetch("/api/get-summary");
    const summary = await response.json();
    document.getElementById("total-hours").textContent = summary.totalHours || 0;
    document.getElementById("most-subject").textContent = summary.mostStudied || "-";
    document.getElementById("least-subject").textContent = summary.leastStudied || "-";
  } catch (error) {
    console.error("❌ Failed to get statistics：", error);
  }
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

// Handle date picker changes
document.getElementById("prev-week").addEventListener("click", () => {
  currentWeekStart.setDate(currentWeekStart.getDate() - 7);
  renderProductivityChart(currentWeekStart);
});

document.getElementById("next-week").addEventListener("click", () => {
  currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  renderProductivityChart(currentWeekStart);
});

// Handle date changes for pie charts
document.getElementById("prev-pie-week").addEventListener("click", () => {
  currentWeekStart.setDate(currentWeekStart.getDate() - 7);
  renderPieChart(currentWeekStart);
});

document.getElementById("next-pie-week").addEventListener("click", () => {
  currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  renderPieChart(currentWeekStart);
});


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



// ✅ 顶部定义图表实例变量，避免 undefined 错误
let sharedBarChart = null;
let sharedPieChart = null;

document.addEventListener("DOMContentLoaded", () => {
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

  // ✅ Shared With Me 逻辑
  const senderSelect = document.getElementById("sender-select");
  if (!senderSelect) return;

  fetch("/api/received-shares")
    .then(res => res.json())
    .then(data => {
      Object.keys(data).forEach(sender => {
        const option = document.createElement("option");
        option.value = sender;
        option.textContent = sender;
        senderSelect.appendChild(option);
      });

      document.getElementById("shared-summary").textContent = "";
      document.getElementById("shared-productivity-chart").style.display = "none";
      document.getElementById("shared-pie-chart").style.display = "none";
    });

    senderSelect.addEventListener("change", async (e) => {
      const selected = e.target.value;
      if (!selected) return;
    
      const res1 = await fetch("/api/received-shares");
      const allData = await res1.json();
      const permission = allData[selected];
    
      const summaryDiv = document.getElementById("shared-summary");
      const barSection = document.getElementById("shared-productivity-chart");
      const pieSection = document.getElementById("shared-pie-chart");
    
      // 🔧 先更新展示区域可见性
      summaryDiv.textContent = permission.summary.length ? "📘 Summary was shared." : "—";
      barSection.style.display = permission.bar.length ? "block" : "none";
      pieSection.style.display = permission.pie.length ? "block" : "none";
    
      // 🔄 等待下一个宏任务（让 display: block 真正生效）
      await new Promise(resolve => setTimeout(resolve, 50));
    
      const res2 = await fetch(`/api/shared-chart-data?sender_email=${selected}`);
      const result = await res2.json();
      console.log("🔎 Shared BarChartData:", result.barChartData);

      // ✅ 渲染 summary 内容
      if (permission.summary.length) {
        const { totalHours, mostStudied, leastStudied } = result.summary;
        summaryDiv.innerHTML = `
          <strong>Summary:</strong><br>
          📊 <strong>Total Hours:</strong> ${totalHours}<br>
          🔝 <strong>Most Studied:</strong> ${mostStudied}<br>
          🔻 <strong>Least Studied:</strong> ${leastStudied}
        `;
      }
    
      // ✅ 渲染柱状图（等 barSection 已可见）
      if (permission.bar && permission.bar.length > 0) {
        const canvas = document.getElementById("shared-productivity-canvas");
        const ctx = canvas.getContext("2d");
      
        // ✅ 强制设置宽高
        canvas.style.width = "100%";
        canvas.style.height = "400px";
        
        if (sharedBarChart) sharedBarChart.destroy();
      
        sharedBarChart = new Chart(ctx, {
          type: "bar",
          data: result.barChartData,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: "top" }
            },
            scales: {
              x: { stacked: true },
              y: { stacked: true, beginAtZero: true }
            }
          }
        });
      
        console.log("✅ Shared Bar Chart created.");
      }
    
      // ✅ 渲染饼图
      if (permission.pie.length) {
        const ctx = document.getElementById("shared-pie-canvas").getContext("2d");
        if (sharedPieChart) sharedPieChart.destroy();
        sharedPieChart = new Chart(ctx, {
          type: "pie",
          data: result.pieChartData,
          options: {
            responsive: true,
            plugins: {
              legend: { position: "bottom" }
            }
          }
        });
      }
    });
    
  });


