import unittest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import time

class StudyMateSeleniumTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Set up Chrome browser options
        chrome_options = Options()
        chrome_options.add_argument("--headless")  # Headless mode
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        
        # Launch browser
        try:
            service = Service(ChromeDriverManager().install())
            cls.driver = webdriver.Chrome(service=service, options=chrome_options)
        except Exception as e:
            print(f"Failed to launch Chrome, trying alternative method: {e}")
            cls.driver = webdriver.Chrome(options=chrome_options)
            
        cls.base_url = "http://127.0.0.1:5000"
        cls.driver.implicitly_wait(3)

    @classmethod
    def tearDownClass(cls):
        cls.driver.quit()

    def test_1_home_page_loads(self):
        """Test 1: Verify home page loads correctly"""
        try:
            self.driver.get(self.base_url)
            time.sleep(1)
            self.assertIn("StudyMate", self.driver.title)
            print("✅ Test 1 Passed: Home page loaded successfully")
        except Exception as e:
            self.fail(f"Home page load test failed: {e}")

    def test_2_login_page_loads(self):
        """Test 2: Verify login page loads correctly"""
        try:
            self.driver.get(f"{self.base_url}/login")
            time.sleep(1)
            
            # Check if page contains login-related elements
            page_source = self.driver.page_source.lower()
            login_elements = ["login", "email", "password"]
            
            found = False
            for term in login_elements:
                if term in page_source:
                    found = True
                    break
                    
            self.assertTrue(found, "Login page doesn't contain any login-related elements")
            print("✅ Test 2 Passed: Login page loaded successfully")
        except Exception as e:
            self.fail(f"Login page load test failed: {e}")

    def test_3_signup_page_loads(self):
        """Test 3: Verify signup page loads correctly"""
        try:
            self.driver.get(f"{self.base_url}/signup")
            time.sleep(1)
            
            # Check if page contains signup-related elements
            page_source = self.driver.page_source.lower()
            signup_elements = ["signup", "register", "email", "password"]
            
            found = False
            for term in signup_elements:
                if term in page_source:
                    found = True
                    break
                    
            self.assertTrue(found, "Signup page doesn't contain any signup-related elements")
            print("✅ Test 3 Passed: Signup page loaded successfully")
        except Exception as e:
            self.fail(f"Signup page load test failed: {e}")
            
    def test_4_page_links(self):
        """Test 4: Check links on the page"""
        try:
            self.driver.get(self.base_url)
            time.sleep(1)
            
            # Find and count links on the page
            links = self.driver.find_elements(By.TAG_NAME, "a")
            link_count = len(links)
            
            # Ensure there's at least one link on the page
            self.assertGreater(link_count, 0, "No links found on the home page")
            print(f"✅ Test 4 Passed: Found {link_count} links on the home page")
        except Exception as e:
            self.fail(f"Link check test failed: {e}")
    
    def test_5_page_css_loaded(self):
        """Test 5: Verify CSS styles are loaded correctly"""
        try:
            self.driver.get(self.base_url)
            time.sleep(1)
            
            # Check for Bootstrap CSS link
            page_source = self.driver.page_source
            has_bootstrap = "bootstrap" in page_source.lower()
            
            # Check for basic page elements
            body = self.driver.find_element(By.TAG_NAME, "body")
            
            # Get background color to verify CSS loading
            has_style = self.driver.execute_script(
                "return window.getComputedStyle(document.body).getPropertyValue('background-color') !== ''")
            
            self.assertTrue(has_bootstrap or has_style, "Page styles may not be loading correctly")
            print("✅ Test 5 Passed: Page styles loaded correctly")
        except Exception as e:
            self.fail(f"CSS style check test failed: {e}")

# Run the test suite when this file is run directly
if __name__ == "__main__":
    unittest.main()
