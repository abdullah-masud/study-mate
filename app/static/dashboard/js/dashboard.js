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

  // 表单校验
  if (!date || !subject || isNaN(hours)) {
    alert("请填写所有字段！");
    return;
  }

  // 构建请求数据
  const sessionData = {
    date: date,
    subject: subject,
    hours: hours
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
      console.log("成功添加");
      document.getElementById("study-form").reset();
      fetchSummary();
      fetchRecords();
      renderProductivityChart(); // ✅ 新增图表刷新
    }
     else {
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


async function fetchRecords() {
  try {
    const response = await fetch("/api/get-records");
    const records = await response.json();

    const tableBody = document.getElementById("records-table-body");
    tableBody.innerHTML = ""; // 清空旧数据

    records.forEach(record => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="p-2 border text-center">${record.date}</td>
        <td class="p-2 border text-center">${record.subject}</td>
        <td class="p-2 border text-center">${record.hours}</td>
        <td class="p-2 border text-center">
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

async function renderProductivityChart() {
  try {
    const response = await fetch("/api/productivity-by-day");
    const data = await response.json();

    const labels = Object.keys(data);
    const values = Object.values(data);

    // 如果之前有图表，先销毁
    if (chartInstance) {
      chartInstance.destroy();
    }

    const ctx = document.getElementById("productivity-chart").getContext("2d");
    chartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{
          label: "Hours Studied",
          data: values,
          backgroundColor: "rgba(54, 162, 235, 0.6)"
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Hours"
            }
          }
        }
      }
    });

  } catch (error) {
    console.error("图表数据加载失败：", error);
  }
}






