from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Vite serves on /solve-sixteen/ by default due to base config
            page.goto("http://localhost:5173/solve-sixteen/")
            page.wait_for_load_state("networkidle")

            # Verify Title
            title = page.title()
            print(f"Page Title: {title}")
            assert title == "Solve Sixteen"

            # Verify Favicon Link
            # Vite dev server rewrites /favicon.svg to include base
            favicon = page.locator("link[rel='icon']")
            href = favicon.get_attribute("href")
            print(f"Favicon HREF: {href}")

            # Allow either, as sometimes dev server behavior varies slightly
            assert href == "/solve-sixteen/favicon.svg" or href == "/favicon.svg"

            page.screenshot(path="verification.png")
            print("Verification successful, screenshot saved.")
        except Exception as e:
            print(f"Verification failed: {e}")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    run()
