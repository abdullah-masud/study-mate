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

| UWA ID   | Name             | GitHub Username  |
| -------- | ---------------- | ---------------- |
| 24501549 | Abdulla Al Masud | `abdullah-masud` |
| 24358018 | Yuyan Yang       | `Yuyan0701`      |
| 24090791 | Xingyue Wang     | `KelseyOnGit`    |
| 23932642 | Yingqi Liu       | `SexyZoe`        |

---

## 🚀 Instructions to Launch the Application

## Prerequisites

Make sure you have Python 3.13 and pip installed.

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

### 4. initialising the database

```bash
python main.py 
```

### 5. Run the Flask App

```bash
flask run
```

### 6. Access the App

Open your browser and navigate to:

```
http://127.0.0.1:5000
```

---

## 🧪 Instructions for Running Tests

Follow these steps to properly set up and run the tests for StudyMate:

### 1. Database Setup

StudyMate uses two different database environments:

1. **Development/Demo Database**: Initialized through `seed.py`, contains test data(This section is used for lecture presentations)
2. **Test Database**: Separate in-memory database automatically created for tests, following testing best practices

**Note**: Automated tests use their own independent test database and do not rely on `seed.py`. `seed.py` is mainly for manual testing and demonstrations.

### 2. Running Unit Tests

Unit tests verify the core functionality of the application:

```bash
python -m pytest tests/test_unit.py -v
```

These tests will:
- Automatically create an independent in-memory test database (`sqlite:///:memory:`)
- Check API endpoints, database models, and application logic
- Automatically create users and data needed for testing
- Include 6+ unit tests

### 3. Running Selenium Tests

Selenium tests now automatically start and stop the Flask application:

```bash
python -m tests.test_selenium
```

The improved tests will:
- Automatically create an independent test database environment
- Start the Flask application in test mode
- Run all Selenium tests
- Automatically shut down the server when complete

**Important**: These tests are completely independent from the main application database, using a dedicated test database, fulfilling the "Tests use test database" requirement.

**Note:** Selenium tests require Chrome browser. The tests use webdriver-manager to automatically download the appropriate ChromeDriver version. If you encounter issues, ensure you have Chrome installed and that webdriver-manager is installed via:

```bash
pip install webdriver-manager
```

### 4. Troubleshooting

- **Database errors**: If you encounter database errors, try deleting the `instance/studymate_database.db` file and run `python seed.py` again.
- **Selenium test failures**: If tests fail with element not found errors, you may need to increase the wait times in the test code.
- **Browser issues**: If the tests can't launch Chrome, try running in non-headless mode by editing `tests/test_selenium.py` and removing the `--headless` option.

---

## 📊 Features & Views Overview

| View               | Description                                                       |
| ------------------ | ----------------------------------------------------------------- |
| **Introductory**   | Welcome message + user login/signup page                          |
| **Upload Data**    | Users enter study sessions manually or via CSV                    |
| **Visualize Data** | Display charts for trends and comparisons using Chart.js          |
| **Share Data**     | Share selected data with other registered users in view-only mode |

---

## 📎 License & Contribution

This project is for academic use only as part of **CITS5505 Web Programming** at UWA.  
For collaboration guidelines and issue tracking, please use the [Issues](https://github.com/abdullah-masud/study-mate/issues) and [Pull Requests](https://github.com/abdullah-masud/study-mate/pulls) tabs.

## 🔖 References

[1] "Flask Documentation," Flask, 2024. [Online]. Available: https://flask.palletsprojects.com/. [Accessed: 14-May-2025].

[2] "SQLAlchemy Documentation," SQLAlchemy, 2024. [Online]. Available: https://docs.sqlalchemy.org/. [Accessed: 14-May-2025].

[3] "Bootstrap Documentation," Bootstrap, 2024. [Online]. Available: https://getbootstrap.com/docs/. [Accessed: 14-May-2025].

[4] "Chart.js Documentation," Chart.js, 2024. [Online]. Available: https://www.chartjs.org/docs/latest/. [Accessed: 14-May-2025].

[5] OpenAI, "ChatGPT Assistance for Code Optimization and Debugging," ChatGPT, OpenAI, 2025. [Online]. Available: https://openai.com/chatgpt/. [Accessed: 14-May-2025].
