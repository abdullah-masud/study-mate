let currentWeekStart = getStartOfWeek(new Date());

// 页面加载后统一初始化
window.addEventListener("DOMContentLoaded", () => {
  fetchSummary();
  fetchRecords();
  renderProductivityChart();

  flatpickr("#date", {
    dateFormat: "Y-m-d",
    maxDate: "today"
  });
});

// 表单提交逻辑
document.getElementById("submit-btn").addEventListener("click", async () => {
  const date = document.getElementById("date").value;
  const subject = document.getElementById("subject").value;
  const hours = parseInt(document.getElementById("hours").value, 10);
  const color = document.getElementById("color").value;

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
      
      // ✅ 手动清空表单字段
      document.getElementById("date").value = "";
      document.getElementById("subject").value = "";
      document.getElementById("hours").value = "";
      document.getElementById("color").value = "#3b82f6";
    
      fetchSummary();
      fetchRecords();
      renderProductivityChart(currentWeekStart);
    } else {
      alert("提交失败：" + (result.error || "未知错误"));
    }
  } catch (error) {
    console.error("❌ 网络错误：", error);
    alert("网络错误，请稍后再试！");
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
    console.error("❌ 获取统计信息失败：", error);
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
    console.error("❌ 获取记录失败：", error);
  }
}

async function deleteRecord(id) {
  if (!confirm("确定要删除这条记录吗？")) return;

  try {
    const response = await fetch(`/api/delete-session/${id}`, { method: "DELETE" });
    const result = await response.json();

    if (response.ok) {
      fetchSummary();
      fetchRecords();
      renderProductivityChart();
    } else {
      alert("删除失败：" + result.error);
    }
  } catch (error) {
    alert("网络错误，无法删除记录");
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
      alert("颜色更新失败");
    }
  } catch (error) {
    alert("网络错误，无法修改颜色");
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
    console.error("图表加载失败：", error);
  }
}

// 更新饼图的日期标签
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
    else alert("更新失败");
  } catch (error) {
    alert("网络错误，无法修改颜色");
  }
}

// 处理日期选择器的日期变化
document.getElementById("prev-week").addEventListener("click", () => {
  currentWeekStart.setDate(currentWeekStart.getDate() - 7);
  renderProductivityChart(currentWeekStart);
});

document.getElementById("next-week").addEventListener("click", () => {
  currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  renderProductivityChart(currentWeekStart);
});

// 处理饼图的日期变化
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

// 更新饼图的日期标签
async function renderPieChart(startDate = currentWeekStart) {
  const response = await fetch(`/api/productivity-by-day?start=${formatDate(startDate)}`);
  const data = await response.json();
  renderPieChartFromWeekData(data);
  updatePieWeekLabel(startDate);
}



