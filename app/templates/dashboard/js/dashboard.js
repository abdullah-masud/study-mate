// script.js


document.getElementById("submit-btn").addEventListener("click", function () {
  const date = document.getElementById("date").value;
  const subject = document.getElementById("subject").value;
  const hours = parseFloat(document.getElementById("hours").value);

  if (!date || !subject || isNaN(hours)) {
    alert("Please fill in all fields.");
    return;
  }

  alert(`Study session recorded:\n${date} - ${subject} - ${hours} hours`);

  // 清空输入
  document.getElementById("date").value = "";
  document.getElementById("subject").value = "";
  document.getElementById("hours").value = "";
});


