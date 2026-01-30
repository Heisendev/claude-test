#!/usr/bin/env node

/**
 * Test Script: Pin/Unpin Conversation Feature
 *
 * Tests feature #19: Pin conversation to top of list
 *
 * This script uses Puppeteer to test the pin/unpin functionality:
 * 1. Create multiple conversations
 * 2. Pin one conversation
 * 3. Verify it moves to top
 * 4. Verify pin icon appears
 * 5. Create new conversation
 * 6. Verify pinned stays at top
 * 7. Unpin and verify position changes
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = './screenshots/pin-feature';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page, name) {
  const filepath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`  📸 Screenshot saved: ${filepath}`);
}

async function testPinFeature() {
  console.log('🧪 Testing Pin/Unpin Conversation Feature (Test #19)\n');

  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      slowMo: 100 // Slow down for visibility
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    // Step 1: Navigate to the app
    console.log('Step 1: Navigate to application');
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
    await sleep(1000);
    await takeScreenshot(page, '01-initial-load');

    // Step 2: Create first conversation
    console.log('\nStep 2: Create first conversation');
    const newChatButton = await page.waitForSelector('button:has-text("New Chat"), button >> text="New Chat"', { timeout: 5000 });
    await newChatButton.click();
    await sleep(1000);
    await takeScreenshot(page, '02-first-conversation-created');

    // Step 3: Create second conversation
    console.log('\nStep 3: Create second conversation');
    await page.click('button:has-text("New Chat"), button >> text="New Chat"');
    await sleep(1000);
    await takeScreenshot(page, '03-second-conversation-created');

    // Step 4: Create third conversation
    console.log('\nStep 4: Create third conversation');
    await page.click('button:has-text("New Chat"), button >> text="New Chat"');
    await sleep(1000);
    await takeScreenshot(page, '04-third-conversation-created');

    // Step 5: Get all conversations from the sidebar
    console.log('\nStep 5: Identify conversations in sidebar');
    const conversations = await page.$$('div[class*="cursor-pointer"]');
    console.log(`  Found ${conversations.length} conversations`);

    if (conversations.length < 2) {
      console.error('❌ Not enough conversations to test pin feature');
      return false;
    }

    // Step 6: Hover over the second conversation to reveal pin button
    console.log('\nStep 6: Hover over second conversation to reveal pin button');
    const secondConv = conversations[1];
    await secondConv.hover();
    await sleep(500);
    await takeScreenshot(page, '05-hover-reveal-buttons');

    // Step 7: Click the pin button (first button in the group)
    console.log('\nStep 7: Click pin button on second conversation');
    const pinButton = await secondConv.$('button[title*="Pin"]');
    if (!pinButton) {
      console.error('❌ Pin button not found');
      return false;
    }
    await pinButton.click();
    await sleep(1000);
    await takeScreenshot(page, '06-conversation-pinned');

    // Step 8: Verify the pinned conversation is now at the top
    console.log('\nStep 8: Verify pinned conversation moved to top');
    const conversationsAfterPin = await page.$$('div[class*="cursor-pointer"]');
    const firstConv = conversationsAfterPin[0];

    // Check if pin icon is visible on first conversation
    const pinIcon = await firstConv.$('svg[class*="text-[#CC785C]"]');
    if (!pinIcon) {
      console.error('❌ Pin icon not found on first conversation');
      return false;
    }
    console.log('  ✅ Pin icon visible on first conversation');

    // Step 9: Create a new conversation to verify pinned stays at top
    console.log('\nStep 9: Create new conversation to verify pinned stays at top');
    await page.click('button:has-text("New Chat"), button >> text="New Chat"');
    await sleep(1000);
    await takeScreenshot(page, '07-new-conversation-created');

    // Step 10: Verify pinned conversation is still at top
    console.log('\nStep 10: Verify pinned conversation still at top after creating new one');
    const conversationsAfterNew = await page.$$('div[class*="cursor-pointer"]');
    const firstConvAfterNew = conversationsAfterNew[0];
    const pinIconStillThere = await firstConvAfterNew.$('svg[class*="text-[#CC785C]"]');

    if (!pinIconStillThere) {
      console.error('❌ Pinned conversation not at top after creating new conversation');
      return false;
    }
    console.log('  ✅ Pinned conversation remained at top');

    // Step 11: Hover and unpin the conversation
    console.log('\nStep 11: Unpin the conversation');
    await firstConvAfterNew.hover();
    await sleep(500);
    const unpinButton = await firstConvAfterNew.$('button[title*="Unpin"]');
    if (!unpinButton) {
      console.error('❌ Unpin button not found');
      return false;
    }
    await unpinButton.click();
    await sleep(1000);
    await takeScreenshot(page, '08-conversation-unpinned');

    // Step 12: Verify conversation moved from top position
    console.log('\nStep 12: Verify unpinned conversation is no longer at top');
    const conversationsAfterUnpin = await page.$$('div[class*="cursor-pointer"]');
    const firstConvAfterUnpin = conversationsAfterUnpin[0];
    const pinIconGone = await firstConvAfterUnpin.$('svg[class*="text-[#CC785C]"]');

    if (pinIconGone) {
      console.error('❌ Conversation still appears pinned after unpinning');
      return false;
    }
    console.log('  ✅ Conversation successfully unpinned');

    console.log('\n✅ All pin/unpin tests passed!');
    return true;

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error(error.stack);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testPinFeature().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
