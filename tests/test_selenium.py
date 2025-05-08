import unittest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

class StudyMateSeleniumTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Set up Chrome browser in headless mode
        # This ensures that the tests can run in CI or without a visible window
        chrome_options = Options()
        chrome_options.add_argument("--headless")  # Run in background (no browser UI)
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")

        # Start the Chrome WebDriver and open the Flask app
        cls.driver = webdriver.Chrome(options=chrome_options)
        cls.driver.get("http://127.0.0.1:5000")  # Flask server must be running

    @classmethod
    def tearDownClass(cls):
        # Close the browser after all tests
        cls.driver.quit()

    def test_1_home_page_title(self):
        """Test 1: Verify that the home page loads correctly and the title contains 'StudyMate'"""
        self.assertIn("StudyMate", self.driver.title)

    def test_2_dashboard_page_load(self):
        """Test 2: Navigate to the /dashboard page and check if summary card is visible"""
        self.driver.get("http://127.0.0.1:5000/dashboard")
        WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.ID, "summary-card"))
        )
        self.assertTrue(self.driver.find_element(By.ID, "summary-card").is_displayed())

    def test_3_submit_study_form(self):
        """Test 3: Submit a new study session using the form"""
        self.driver.get("http://127.0.0.1:5000/dashboard")
        time.sleep(1)  # Wait for the page to load

        # Fill out the form fields
        self.driver.find_element(By.ID, "date").send_keys("2025-05-01")
        self.driver.find_element(By.ID, "subject").send_keys("Biology")
        self.driver.find_element(By.ID, "hours").clear()
        self.driver.find_element(By.ID, "hours").send_keys("2")
        self.driver.find_element(By.ID, "color").send_keys("#00ff00")

        # Submit the form
        self.driver.find_element(By.ID, "submit-btn").click()
        time.sleep(2)  # Wait for frontend to process and update

    def test_4_record_appears_in_table(self):
        """Test 4: After submission, the new record should appear in the study history table"""
        table = self.driver.find_element(By.ID, "records-table-body")
        rows = table.find_elements(By.TAG_NAME, "tr")
        self.assertGreater(len(rows), 0)

    def test_5_chart_canvas_visible(self):
        """Test 5: Ensure that the productivity chart canvas is visible on the dashboard"""
        canvas = self.driver.find_element(By.ID, "productivity-canvas")
        self.assertTrue(canvas.is_displayed())

# Run the test suite when this file is executed directly
if __name__ == "__main__":
    unittest.main()
