const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 Navigating to client login page...');
    await page.goto('http://localhost:3000/login/client');
    await page.waitForLoadState('networkidle');

    console.log('📝 Filling in login credentials...');
    await page.fill('input[type="email"]', 'stephen@stepten.io');
    await page.fill('input[type="password"]', 'qwerty12345');

    console.log('🔑 Clicking login button...');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✅ Logged in! Current URL:', page.url());

    console.log('🔍 Looking for floating video call button...');
    const floatingButton = await page.locator('button[aria-label="Start video call"]');
    const isVisible = await floatingButton.isVisible();
    
    if (isVisible) {
      console.log('✅ FLOATING VIDEO BUTTON FOUND!');
      console.log('📹 Taking screenshot of button...');
      await page.screenshot({ path: 'floating-button-visible.png' });

      console.log('👆 Clicking floating video button...');
      await floatingButton.click();
      await page.waitForTimeout(1000);

      console.log('🔍 Checking if staff selection modal opened...');
      const modal = await page.locator('text=Start Video Call');
      const modalVisible = await modal.isVisible();

      if (modalVisible) {
        console.log('✅ STAFF SELECTION MODAL OPENED!');
        console.log('📹 Taking screenshot of modal...');
        await page.screenshot({ path: 'staff-modal-open.png' });

        console.log('🔍 Looking for Sarah Test in staff list...');
        const sarahTest = await page.locator('text=Sarah Test');
        const sarahVisible = await sarahTest.isVisible();

        if (sarahVisible) {
          console.log('✅ SARAH TEST FOUND IN STAFF LIST!');
          console.log('📹 Taking screenshot...');
          await page.screenshot({ path: 'sarah-in-list.png' });

          console.log('📞 Looking for Call button next to Sarah...');
          const callButton = await page.locator('button:has-text("Call")').first();
          const callButtonVisible = await callButton.isVisible();

          if (callButtonVisible) {
            console.log('✅ CALL BUTTON FOUND!');
            console.log('📹 Final screenshot...');
            await page.screenshot({ path: 'ready-to-call.png', fullPage: true });

            console.log('\n============================================');
            console.log('✅ ALL TESTS PASSED!');
            console.log('============================================');
            console.log('✅ Floating button visible');
            console.log('✅ Modal opens on click');
            console.log('✅ Sarah Test appears in list');
            console.log('✅ Call button is visible');
            console.log('============================================\n');
          } else {
            console.log('❌ Call button NOT visible');
          }
        } else {
          console.log('❌ Sarah Test NOT found in staff list');
        }
      } else {
        console.log('❌ Staff selection modal did NOT open');
      }
    } else {
      console.log('❌ FLOATING VIDEO BUTTON NOT FOUND!');
      console.log('📹 Taking screenshot of current page...');
      await page.screenshot({ path: 'no-floating-button.png' });
    }

    console.log('\n⏸️  Pausing for manual inspection (browser will stay open)...');
    await page.waitForTimeout(60000); // Keep browser open for 1 minute

  } catch (error) {
    console.error('❌ Error during test:', error.message);
    await page.screenshot({ path: 'error-screenshot.png' });
  } finally {
    await browser.close();
  }
})();

