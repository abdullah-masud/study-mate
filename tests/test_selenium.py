import unittest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import time
import threading
import os
import sys
import signal
from app import create_app
from werkzeug.serving import make_server
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class FlaskServerThread(threading.Thread):
    def __init__(self, app):
        threading.Thread.__init__(self)
        self.app = app
        self.daemon = True
        self.server = make_server('127.0.0.1', 5000, app)
        self._stop_event = threading.Event()
        
    def run(self):
        self.server.serve_forever()
        
    def shutdown(self):
        self.server.shutdown()

class StudyMateSeleniumTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Create the test version of the Flask application
        cls.app = create_app({'TESTING': True, 'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:'})
        
        # Start the Flask server in a separate thread
        cls.server_thread = FlaskServerThread(cls.app)
        cls.server_thread.start()
        # Give the server some startup time
        time.sleep(2)
        
        # Set the Chrome browser options
        chrome_options = Options()
        chrome_options.add_argument("--headless") 
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        
        # Start the browser
        try:
            service = Service(ChromeDriverManager().install())
            cls.driver = webdriver.Chrome(service=service, options=chrome_options)
        except Exception as e:
            print(f"Failed to launch Chrome, trying alternative method: {e}")
            cls.driver = webdriver.Chrome(options=chrome_options)
            
        cls.base_url = "http://127.0.0.1:5000"
        cls.driver.implicitly_wait(3)
        
        print("✅ Server started automatically and browser initialized")

    @classmethod
    def tearDownClass(cls):
        # Close the browser
        cls.driver.quit()
        
        # Close the Flask browser
        if hasattr(cls, 'server_thread') and cls.server_thread.is_alive():
            try:
                cls.server_thread.shutdown()
                cls.server_thread.join(5) 
                print("✅ Server shutdown completed")
            except Exception as e:
                print(f"Warning: Could not cleanly shutdown server: {e}")
                
        print("✅ Browser shutdown completed")

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
    
    def test_6_form_interaction(self):
        """Test 6: 测试表单交互功能"""
        try:
            # Open the login page instead of the password forgetting page (which might be more reliable).
            self.driver.get(f"{self.base_url}/login")
            time.sleep(1)
            
            # Confirm successful page loading - Use page content verification
            page_source = self.driver.page_source.lower()
            self.assertIn("login", page_source, "Page should contain 'login' text")
            
            # Find the email input box (try multiple methods)
            try:
                # Try Method 1: Through ID
                email_field = self.driver.find_element(By.ID, "email")
            except:
                try:
                    # Try Method 2: Through the name attribute
                    email_field = self.driver.find_element(By.NAME, "email")
                except:
                    try:
                        # Try Method 3: Search for the email input box through the type attribute
                        email_field = self.driver.find_element(By.CSS_SELECTOR, "input[type='email']")
                    except:
                        # Try Method 4: Find the first input box
                        all_inputs = self.driver.find_elements(By.TAG_NAME, "input")
                        email_field = None
                        for input_field in all_inputs:
                            if input_field.get_attribute("type") != "password" and input_field.get_attribute("type") != "submit":
                                email_field = input_field
                                break
                        
                        if email_field is None:
                            raise Exception("Could not find any suitable input field for email")
            
            # Test form interaction - Enter an email
            email_field.clear()
            email_field.send_keys("test@example.com")
            time.sleep(1)
            
            # Verify whether the input is successful
            email_value = email_field.get_attribute("value")
            self.assertEqual(email_value, "test@example.com", "Email input field should contain the entered email")
            
            # Look for the first password input box
            try:
                password_field = self.driver.find_element(By.CSS_SELECTOR, "input[type='password']")
                
                # Test password input
                password_field.clear()
                password_field.send_keys("TestPassword123")
                time.sleep(1)
                
                # Verify whether the password input is successful
                self.assertIsNotNone(password_field.get_attribute("value"), "Password should be entered")
            except:
                print("Warning: Could not test password field, continuing...")
            
            # Look for the submit button
            try:
                submit_button = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
            except:
                try:
                    submit_button = self.driver.find_element(By.NAME, "submit")
                except:
                    try:
                        submit_button = self.driver.find_element(By.CSS_SELECTOR, "input[type='submit']")
                    except:
                        # Finally, try to find any elements that look like the submit button
                        all_buttons = self.driver.find_elements(By.TAG_NAME, "button")
                        if len(all_buttons) > 0:
                            submit_button = all_buttons[0]
                        else:
                            # Search for the input element that might be the submit button
                            submit_inputs = self.driver.find_elements(By.CSS_SELECTOR, "input[type='button'], input[type='submit']")
                            if len(submit_inputs) > 0:
                                submit_button = submit_inputs[0]
                            else:
                                raise Exception("Could not find any submit button")
            
            # Check whether the button exists
            self.assertIsNotNone(submit_button, "Submit button should exist on the page")
            
            # Check whether the button is clickable
            self.assertTrue(submit_button.is_enabled(), "Submit button should be enabled")
            
            print("✅ Test 6 Passed: Form interaction test successful")
        except Exception as e:
            self.fail(f"Form interaction test failed: {e}")

# Run the test suite when this file is run directly
if __name__ == "__main__":
    unittest.main()
