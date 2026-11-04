from playwright.sync_api import sync_playwright, expect
from pathlib import Path
import json,re,os,tempfile,sys
out=Path(os.environ.get("PLAZA_REPORT_DIR",tempfile.gettempdir()))/"narrativeos-plaza-layout"
out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(channel="msedge" if sys.platform=="win32" else None,headless=True)
 page=browser.new_page(viewport={"width":1440,"height":1000})
 errors=[]
 page.on("pageerror",lambda error: errors.append(str(error)))
 base=os.environ.get("PLAZA_TEST_URL","http://127.0.0.1:3000/teacher-ecosystem/")
 page.goto(base,timeout=90000)
 page.wait_for_load_state("networkidle")
 expect(page.locator(".plaza-card").first).to_be_visible()
 assert not page.locator(".plaza-filters").evaluate("element => element.open")
 assert not page.locator(".plaza-filter-options").is_visible()
 assert page.locator(".plaza-grid").evaluate("element => getComputedStyle(element).gridTemplateColumns.split(' ').length") == 4
 assert page.locator(".plaza-card").first.locator(".plaza-card-caption a").count() == 1
 assert page.locator(".plaza-card").first.locator(".plaza-card-caption button").count() == 0
 assert page.locator(".plaza-paper-copy").count() == 0
 assert page.locator(".plaza-sidebar").bounding_box()["x"] < 25
 width=page.locator(".plaza-card-visual").first.bounding_box()["width"]
 cover=page.locator(".plaza-card-visual .plaza-cover").first.bounding_box()["width"]
 assert cover >= width - 2
 for visual in page.locator(".plaza-card-visual").all():
  box=visual.bounding_box()
  assert abs(box["height"] / box["width"] - 9/16) < .01
 heights=page.locator(".plaza-paper").evaluate_all("elements => elements.map(element => element.getBoundingClientRect().height)")
 assert max(heights)-min(heights) < 2
 assert page.locator(".plaza-card .plaza-author").count() == page.locator(".plaza-card").count()
 for card in page.locator(".plaza-card").all():
  image=card.locator(".plaza-card-visual").bounding_box()
  title=card.locator(".plaza-card-heading").bounding_box()
  assert 0 <= title["y"]-(image["y"]+image["height"]) <= 8
  assert image["width"] >= card.bounding_box()["width"]-3
  assert 1 <= card.locator(".plaza-cover-tags span").count() <= 5
 page.screenshot(path=str(out/"desktop.png"),full_page=True)
 page.locator(".plaza-filter-toggle").click()
 expect(page.locator(".plaza-filter-options")).to_be_visible()
 page.locator(".plaza-filter-toggle").click()
 subject=page.locator(".plaza-sidebar nav").get_by_role("link",name="语文",exact=True)
 subject.click()
 page.wait_for_load_state("networkidle")
 expect(page).to_have_url(re.compile("subject="))
 expect(page.locator(".plaza-sidebar nav a[aria-current=true]")).to_have_text("语文✓")
 page.locator(".plaza-cover-button").first.click()
 expect(page.get_by_role("dialog")).to_be_visible()
 expect(page.locator(".plaza-drawer")).to_have_css("opacity","1")
 assert page.locator(".plaza-drawer").bounding_box()["width"] >= 1000
 assert page.locator(".plaza-detail-art").bounding_box()["width"] >= 500
 assert page.locator(".plaza-detail-actions a").first.get_attribute("target") == "_blank"
 assert page.evaluate("document.body.style.overflow") == "hidden"
 page.screenshot(path=str(out/"detail-desktop.png"))
 # Long author descriptions must scroll without hiding preview or close control.
 page.locator(".plaza-detail-summary").evaluate("el=>el.textContent=(el.textContent+' ').repeat(40)")
 page.locator(".plaza-drawer").evaluate("el=>el.scrollTop=el.scrollHeight")
 expect(page.locator(".plaza-close")).to_be_in_viewport()
 expect(page.locator(".plaza-detail-art")).to_be_in_viewport()
 page.keyboard.press("Escape")
 expect(page.get_by_role("dialog")).not_to_be_visible()
 expect(page.locator(".plaza-cover-button").first).to_be_focused()
 assert page.evaluate("document.body.style.overflow") != "hidden"
 for width,columns in [(1100,3),(820,2),(390,1)]:
  page.set_viewport_size({"width":width,"height":900})
  assert page.locator(".plaza-grid").evaluate("element => getComputedStyle(element).gridTemplateColumns.split(' ').length") == columns
  assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
  page.screenshot(path=str(out/f"width-{width}.png"),full_page=True)
 page.locator(".plaza-filter-toggle").click()
 expect(page.locator(".plaza-filter-options")).to_be_visible()
 page.locator(".plaza-advanced summary").click()
 assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
 page.locator(".plaza-sort-mobile").select_option("latest")
 page.wait_for_load_state("networkidle")
 expect(page).to_have_url(re.compile("sort=latest"))
 expect(page.locator(".plaza-sidebar nav a[aria-current=true]")).to_have_text("语文✓")
 page.locator(".plaza-cover-button").first.click()
 expect(page.get_by_role("dialog")).to_be_visible()
 expect(page.locator(".plaza-drawer")).to_have_css("opacity","1")
 assert page.locator(".plaza-drawer").evaluate("el=>el.scrollWidth<=el.clientWidth")
 page.locator(".plaza-drawer").evaluate("el=>el.scrollTop=el.scrollHeight")
 expect(page.locator(".plaza-close")).to_be_in_viewport()
 page.screenshot(path=str(out/"detail-mobile.png"))
 page.locator(".plaza-close").click()
 expect(page.get_by_role("dialog")).not_to_be_visible()
 from urllib.parse import urlsplit
 origin="{0.scheme}://{0.netloc}".format(urlsplit(base))
 for locale in ["en","zh-hant"]:
  page.goto(f"{origin}/{locale}/teacher-ecosystem/",timeout=90000)
  page.wait_for_load_state("networkidle")
  for width in [320,768,1440]:
   page.set_viewport_size({"width":width,"height":900})
   assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"),(locale,width)
  page.screenshot(path=str(out/f"locale-{locale}.png"),full_page=True)
 page.goto(base+"?q=plaza-no-match-qa-293842",timeout=90000)
 expect(page.locator(".plaza-empty")).to_be_visible()
 assert page.locator(".plaza-card").count()==0
 assert not errors,errors
 print(json.dumps({"status":"passed","screenshots":str(out)}))
 browser.close()
