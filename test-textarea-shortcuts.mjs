import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

(async () => {
  const browser = await puppeteer.launch({ headless: false, slowMo: 100 });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('\n=== TEST #13: Textarea Auto-Resize ===\n');

  try {
    console.log('1. Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(screenshotsDir, '13_01_initial.png') });
    console.log('   ✓ Page loaded');

    console.log('2. Starting new conversation...');
    // Click the button with the text "Start New Conversation"
    await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll('button')).find(
        el => el.textContent.includes('Start New Conversation')
      );
      if (button) button.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.screenshot({ path: path.join(screenshotsDir, '13_01b_conversation_started.png') });
    console.log('   ✓ Conversation started');

    console.log('3. Finding message input textarea...');
    await page.waitForSelector('textarea');
    const textarea = await page.$('textarea');
    if (!textarea) throw new Error('Textarea not found');
    console.log('   ✓ Textarea found');

    const initialHeight = await page.evaluate((el) => el.offsetHeight, textarea);
    console.log(`   Initial height: ${initialHeight}px`);
    await page.screenshot({ path: path.join(screenshotsDir, '13_02_before_typing.png') });

    await textarea.click();
    await new Promise(resolve => setTimeout(resolve, 200));

    console.log('4. Typing multiple lines with Shift+Enter...');
    await page.keyboard.type('Line 1');
    await page.keyboard.down('Shift');
    await page.keyboard.press('Enter');
    await page.keyboard.up('Shift');
    await new Promise(resolve => setTimeout(resolve, 200));

    await page.keyboard.type('Line 2');
    await page.keyboard.down('Shift');
    await page.keyboard.press('Enter');
    await page.keyboard.up('Shift');
    await new Promise(resolve => setTimeout(resolve, 200));

    await page.keyboard.type('Line 3');
    await new Promise(resolve => setTimeout(resolve, 300));

    const expandedHeight = await page.evaluate((el) => el.offsetHeight, textarea);
    console.log(`   Height after typing: ${expandedHeight}px`);
    await page.screenshot({ path: path.join(screenshotsDir, '13_03_after_typing.png') });

    if (expandedHeight > initialHeight) {
      console.log(`   ✓ Textarea expanded (${initialHeight}px → ${expandedHeight}px)`);
    } else {
      console.log(`   ✗ FAILED: Textarea did not expand`);
    }

    console.log('5. Clearing text...');
    await page.evaluate((el) => {
      el.value = '';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, textarea);
    await new Promise(resolve => setTimeout(resolve, 300));

    const shrunkHeight = await page.evaluate((el) => el.offsetHeight, textarea);
    console.log(`   Height after clearing: ${shrunkHeight}px`);
    await page.screenshot({ path: path.join(screenshotsDir, '13_04_after_clearing.png') });

    if (shrunkHeight <= initialHeight) {
      console.log(`   ✓ Textarea shrunk back`);
    } else {
      console.log(`   ✗ FAILED: Textarea did not shrink`);
    }

    console.log('\n=== TEST #14: Keyboard Shortcuts ===\n');

    const initialMessageCount = await page.evaluate(() => {
      return document.querySelectorAll('.message, [class*="message"]').length;
    });
    console.log(`   Initial message count: ${initialMessageCount}`);

    console.log('6. Typing "Test message" and pressing Enter...');
    await textarea.click();
    await page.keyboard.type('Test message');
    await new Promise(resolve => setTimeout(resolve, 200));
    await page.screenshot({ path: path.join(screenshotsDir, '14_01_before_enter.png') });

    await page.keyboard.press('Enter');
    await new Promise(resolve => setTimeout(resolve, 1000));

    const afterSendMessageCount = await page.evaluate(() => {
      return document.querySelectorAll('.message, [class*="message"]').length;
    });
    console.log(`   Message count after send: ${afterSendMessageCount}`);
    await page.screenshot({ path: path.join(screenshotsDir, '14_02_after_enter.png') });

    if (afterSendMessageCount > initialMessageCount) {
      console.log('   ✓ Message sent successfully');
    } else {
      console.log('   ✗ FAILED: Message was not sent');
    }

    const textareaValue = await page.evaluate((el) => el.value, textarea);
    if (textareaValue === '') {
      console.log('   ✓ Textarea cleared after sending');
    }

    console.log('7. Typing multi-line message with Shift+Enter...');
    await textarea.click();
    await page.keyboard.type('Line 1');
    await page.keyboard.down('Shift');
    await page.keyboard.press('Enter');
    await page.keyboard.up('Shift');
    await new Promise(resolve => setTimeout(resolve, 200));
    await page.keyboard.type('Line 2');
    await new Promise(resolve => setTimeout(resolve, 300));

    const multiLineValue = await page.evaluate((el) => el.value, textarea);
    console.log(`   Textarea content: "${multiLineValue}"`);
    await page.screenshot({ path: path.join(screenshotsDir, '14_03_multiline_before_send.png') });

    if (multiLineValue.includes('\n')) {
      console.log('   ✓ Shift+Enter created new line');
    } else {
      console.log('   ✗ FAILED: Shift+Enter did not create new line');
    }

    console.log('8. Pressing Enter to send multi-line message...');
    await page.keyboard.press('Enter');
    await new Promise(resolve => setTimeout(resolve, 1000));

    const finalMessageCount = await page.evaluate(() => {
      return document.querySelectorAll('.message, [class*="message"]').length;
    });
    await page.screenshot({ path: path.join(screenshotsDir, '14_04_after_multiline_send.png') });

    if (finalMessageCount > afterSendMessageCount) {
      console.log('   ✓ Multi-line message sent');
    } else {
      console.log('   ✗ FAILED: Multi-line message was not sent');
    }

    console.log('\n=== TEST SUMMARY ===');
    console.log(`Textarea expands: ${expandedHeight > initialHeight ? 'PASS' : 'FAIL'}`);
    console.log(`Textarea shrinks: ${shrunkHeight <= initialHeight ? 'PASS' : 'FAIL'}`);
    console.log(`Enter sends: ${afterSendMessageCount > initialMessageCount ? 'PASS' : 'FAIL'}`);
    console.log(`Shift+Enter newline: ${multiLineValue.includes('\n') ? 'PASS' : 'FAIL'}`);
    console.log(`Multi-line sends: ${finalMessageCount > afterSendMessageCount ? 'PASS' : 'FAIL'}`);

  } catch (error) {
    console.error('Error:', error);
    await page.screenshot({ path: path.join(screenshotsDir, 'error.png') });
  }

  await new Promise(resolve => setTimeout(resolve, 2000));
  await browser.close();
})();
