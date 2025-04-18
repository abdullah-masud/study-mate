# StudyMate

## 📘 Project Overview
**StudyMate** is a web application designed to help users efficiently track their study habits. It allows users to log study sessions, visualize progress through interactive charts, and selectively share insights with peers. The goal is to promote productivity, self-reflection, and collaborative learning among students.

---

## 🧰 Core Technologies
- **Frontend**: HTML, CSS (Bootstrap), JavaScript, jQuery
- **Backend**: Flask (with SQLAlchemy ORM)
- **Database**: SQLite
- **Visualization**: Chart.js
- **Interaction**: AJAX

---

## 👥 Group Members

| UWA ID   | Name             | GitHub Username       |
|----------|------------------|------------------------|
| 24501549 | Abdulla Al Masud | `abdullah-masud`       |
| 24358018 | Yuyan Yang       | `Yuyan0701`            |
| 24090791 | Xingyue Wang     | `xingyue-user`         |
| 23932642 | Yingqi Liu       | `yingqi-liu`           |

---

## 🚀 Instructions to Launch the Application

### 1. Clone the Repository
```bash
git clone https://github.com/abdullah-masud/study-mate.git
cd study-mate
```

### 2. Create a Virtual Environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the Flask App
```bash
flask run
```

### 5. Access the App
Open your browser and navigate to:  
```
http://127.0.0.1:5000
```

---

## 🧪 Instructions for Running Tests
> _(To be added in Week 7–8 once testing modules like `pytest` are implemented.)_

---

## 📊 Features & Views Overview

| View             | Description                                                                 |
|------------------|-----------------------------------------------------------------------------|
| **Introductory**     | Welcome message + user login/signup page                                  |
| **Upload Data**      | Users enter study sessions manually or via CSV                            |
| **Visualize Data**   | Display charts for trends and comparisons using Chart.js                  |
| **Share Data**       | Share selected data with other registered users in view-only mode         |

---

## 📎 License & Contribution
This project is for academic use only as part of **CITS5505 Web Programming** at UWA.  
For collaboration guidelines and issue tracking, please use the [Issues](https://github.com/abdullah-masud/study-mate/issues) and [Pull Requests](https://github.com/abdullah-masud/study-mate/pulls) tabs.
