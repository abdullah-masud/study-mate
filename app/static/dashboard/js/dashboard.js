let currentWeekStart = getStartOfWeek(new Date());


// 页面加载后获取统计数据
window.addEventListener("DOMContentLoaded", () => {
  fetchSummary();
  fetchRecords();
  renderProductivityChart();  // ✅ 新增
});


// 绑定提交按钮事件
document.getElementById("submit-btn").addEventListener("click", async () => {
  const date = document.getElementById("date").value;
  const subject = document.getElementById("subject").value;
  const hours = parseInt(document.getElementById("hours").value, 10);
  const color = document.getElementById("color").value;  // ✅ 获取颜色值

  // 表单校验
  if (!date || !subject || isNaN(hours)) {
    alert("请填写所有字段！");
    return;
  }

  // 构建请求数据
  const sessionData = {
    date: date,
    subject: subject,
    hours: hours,
    color: color // ✅ 一定要带上 color
  };

  try {
    const response = await fetch("/api/add-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(sessionData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log("✅ 成功添加");
      document.getElementById("study-form").reset();
      fetchSummary();
      fetchRecords();
      renderProductivityChart(); // ✅ 刷新图表
    } else {
      console.error("❌ 添加失败：", result.error);
      alert("提交失败：" + result.error);
    }
  } catch (error) {
    console.error("❌ 网络错误：", error);
    alert("网络错误，请稍后再试！");
  }
});

// 获取统计信息并更新页面
async function fetchSummary() {
  try {
    const response = await fetch("/api/get-summary");
    const summary = await response.json();

    document.getElementById("total-hours").textContent = summary.totalHours || 0;
    document.getElementById("most-subject").textContent = summary.mostStudied || "-";
    document.getElementById("least-subject").textContent = summary.leastStudied || "-";

    console.log("📊 已更新统计信息：", summary);
  } catch (error) {
    console.error("❌ 获取统计信息失败：", error);
  }
}


// ✅ 修改 fetchRecords 函数，给每一行记录增加颜色选择器
async function fetchRecords() {
  try {
    const response = await fetch("/api/get-records");
    const records = await response.json();

    const tableBody = document.getElementById("records-table-body");
    tableBody.innerHTML = ""; // 清空旧数据

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
          <input 
            type="color" 
            value="${subjectColorMap[record.subject]}" 
            data-subject="${record.subject}" 
            onchange="handleColorChange('${record.subject}', this.value)" 
          />
          <button 
            onclick="deleteRecord(${record.id})" 
            class="text-red-600 hover:underline"
          >🗑️ delete</button>
        </td>
      `;
      tableBody.appendChild(row);
    });

  } catch (error) {
    console.error("❌ 获取记录失败：", error);
  }
}


// ✅ 添加 updateColor 方法（调用新 API）
async function updateColor(id, newColor) {
  try {
    const response = await fetch(`/api/update-color/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ color: newColor }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log("🎨 颜色更新成功：", result);
      renderProductivityChart();
    } else {
      alert("颜色更新失败：" + result.error);
    }
  } catch (error) {
    console.error("❌ 更新颜色请求失败：", error);
    alert("网络错误，无法修改颜色");
  }
}


// 页面加载时拉取记录
window.addEventListener("DOMContentLoaded", () => {
  fetchSummary();
  fetchRecords();  // ✅ 新增
});


async function deleteRecord(id) {
  const confirmDelete = confirm("确定要删除这条记录吗？");
  if (!confirmDelete) return;

  try {
    const response = await fetch(`/api/delete-session/${id}`, {
      method: "DELETE"
    });
    const result = await response.json();

    if (response.ok) {
      console.log("🗑️ 删除成功：", result);
      fetchSummary();
      fetchRecords();
      renderProductivityChart(); // ✅ 新增：刷新图表

    } else {
      alert("删除失败：" + result.error);
    }
  } catch (error) {
    console.error("❌ 删除请求失败：", error);
    alert("网络错误，无法删除记录");
  }
}


// 页面加载时渲染图表
let chartInstance = null;

async function renderProductivityChart(startDate = currentWeekStart){
  updateWeekLabel(startDate);

  try {
    const response = await fetch(`/api/productivity-by-day?start=${formatDate(startDate)}`);
    const data = await response.json();

    const viewMode = "date";  // ✅ 解决 viewMode 未定义报错

    const recentDates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      recentDates.push(formatDate(d));
    }

    const labels = viewMode === "weekday"
      ? recentDates.map(date => new Date(date).toLocaleDateString('en-US', { weekday: 'long' }))
      : recentDates;

    const subjectsSet = new Set();
    recentDates.forEach(date => {
      Object.keys(data[date] || {}).forEach(sub => subjectsSet.add(sub));
    });

    const subjects = Array.from(subjectsSet);

    const datasets = subjects.map(subject => {
      return {
        label: subject,
        data: recentDates.map(date => {
          const entry = data[date]?.[subject];
          return entry ? entry.hours : 0;
        }),
        backgroundColor: data[recentDates.find(d => data[d]?.[subject])]?.[subject]?.color || '#999'
      };
    });

    if (chartInstance) chartInstance.destroy();

    const ctx = document.getElementById("productivity-chart").getContext("2d");
    chartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: { mode: 'index', intersect: false },
          legend: { position: 'top' }
        },
        scales: {
          x: { stacked: true },
          y: {
            stacked: true,
            beginAtZero: true,
            title: {
              display: true,
              text: "Hours Studied"
            }
          }
        }
      }
    });

  } catch (error) {
    console.error("图表加载失败：", error);
  }
}


async function handleColorChange(subject, newColor) {
  try {
    // 1. 所有 input[data-subject="math"] => 颜色都变成新的
    const inputs = document.querySelectorAll(`input[data-subject="${subject}"]`);
    inputs.forEach(input => input.value = newColor);

    // 2. 发一个更新请求（更新所有 subject 是 math 的颜色）
    const response = await fetch(`/api/update-color-subject/${subject}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ color: newColor }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log("✅ 所有颜色更新成功");
      renderProductivityChart();
    } else {
      alert("更新失败：" + result.error);
    }
  } catch (error) {
    console.error("❌ 网络错误：", error);
    alert("网络错误，无法修改颜色");
  }
}

// 绑定周切换按钮事件


function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 周日 = 0，周一 = 1
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function updateWeekLabel(startDate) {
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  const label = `${formatDate(startDate)} ~ ${formatDate(endDate)}`;
  document.getElementById("week-label").textContent = label;
}


document.getElementById("prev-week").addEventListener("click", () => {
  currentWeekStart.setDate(currentWeekStart.getDate() - 7);
  renderProductivityChart(currentWeekStart);
});

document.getElementById("next-week").addEventListener("click", () => {
  currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  renderProductivityChart(currentWeekStart);
});



