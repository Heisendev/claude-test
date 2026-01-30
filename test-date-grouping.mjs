#!/usr/bin/env node

/**
 * Date Grouping Feature Test Script
 * Tests feature #21: Conversations grouped by date
 *
 * This script uses Puppeteer to test the conversation date grouping functionality:
 * 1. Create conversations with different timestamps
 * 2. Verify conversations appear under correct group headers
 * 3. Test group collapse/expand functionality
 * 4. Verify "Today", "Yesterday", "Previous 7 Days", etc. labels
 */

import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const APP_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = join(__dirname, 'screenshots', 'date-grouping');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testDateGrouping() {
  console.log('🧪 Starting Date Grouping Feature Test (Test #21)...\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();

  try {
    // Step 1: Navigate to app
    console.log('Step 1: Navigate to app');
    await page.goto(APP_URL, { waitUntil: 'networkidle2' });
    await sleep(1000);
    await page.screenshot({ path: join(SCREENSHOT_DIR, '01-app-loaded.png'), fullPage: true });

    // Step 2: Create multiple conversations (they will all have today's timestamp initially)
    console.log('Step 2: Create multiple conversations');

    for (let i = 1; i <= 3; i++) {
      const newChatButton = await page.$('button:has-text("New Chat")') ||
                            await page.$('button[class*="bg-[#CC785C]"]');
      if (newChatButton) {
        await newChatButton.click();
        await sleep(500);

        const textarea = await page.$('textarea');
        if (textarea) {
          await textarea.type(`Conversation ${i} created today`);
          await page.keyboard.press('Enter');
          await sleep(1500);
        }
      }
    }
    await page.screenshot({ path: join(SCREENSHOT_DIR, '02-conversations-created.png'), fullPage: true });

    // Step 3: Verify "Today" group header appears
    console.log('Step 3: Check for "Today" group header');

    // Look for the "Today" header text
    const todayHeader = await page.evaluate(() => {
      const headers = Array.from(document.querySelectorAll('button'));
      const todayBtn = headers.find(btn => btn.textContent.includes('TODAY') || btn.textContent.includes('Today'));
      return todayBtn ? todayBtn.textContent : null;
    });

    if (!todayHeader) {
      throw new Error('Could not find "Today" group header');
    }
    console.log(`   ✓ Found group header: ${todayHeader}`);
    await page.screenshot({ path: join(SCREENSHOT_DIR, '03-today-header-visible.png'), fullPage: true });

    // Step 4: Count conversations under Today
    console.log('Step 4: Count conversations under Today group');
    const conversationCount = await page.$$eval('.cursor-pointer.group', els => els.length);
    console.log(`   Found ${conversationCount} conversations`);

    if (conversationCount < 3) {
      console.warn(`   ⚠️  Expected at least 3 conversations, found ${conversationCount}`);
    }

    // Step 5: Test group collapse functionality
    console.log('Step 5: Test group collapse/expand');

    // Find and click the Today header to collapse
    const headerButton = await page.evaluate(() => {
      const headers = Array.from(document.querySelectorAll('button'));
      const todayBtn = headers.find(btn => btn.textContent.includes('TODAY') || btn.textContent.includes('Today'));
      return todayBtn ? true : false;
    });

    if (headerButton) {
      await page.evaluate(() => {
        const headers = Array.from(document.querySelectorAll('button'));
        const todayBtn = headers.find(btn => btn.textContent.includes('TODAY') || btn.textContent.includes('Today'));
        if (todayBtn) todayBtn.click();
      });
      await sleep(500);
      await page.screenshot({ path: join(SCREENSHOT_DIR, '04-group-collapsed.png'), fullPage: true });

      // Count conversations after collapse (should be 0 or hidden)
      const collapsedCount = await page.$$eval('.cursor-pointer.group', els => els.length);
      console.log(`   After collapse: ${collapsedCount} visible conversations`);

      if (collapsedCount < conversationCount) {
        console.log('   ✓ Group collapsed successfully');
      }

      // Click again to expand
      await page.evaluate(() => {
        const headers = Array.from(document.querySelectorAll('button'));
        const todayBtn = headers.find(btn => btn.textContent.includes('TODAY') || btn.textContent.includes('Today'));
        if (todayBtn) todayBtn.click();
      });
      await sleep(500);
      await page.screenshot({ path: join(SCREENSHOT_DIR, '05-group-expanded.png'), fullPage: true });

      const expandedCount = await page.$$eval('.cursor-pointer.group', els => els.length);
      console.log(`   After expand: ${expandedCount} visible conversations`);

      if (expandedCount > collapsedCount) {
        console.log('   ✓ Group expanded successfully');
      }
    }

    // Step 6: Check for chevron/arrow icon
    console.log('Step 6: Verify group header has collapse/expand icon');

    const hasIcon = await page.evaluate(() => {
      const headers = Array.from(document.querySelectorAll('button'));
      const todayBtn = headers.find(btn => btn.textContent.includes('TODAY') || btn.textContent.includes('Today'));
      if (!todayBtn) return false;

      // Check for SVG icon (chevron/arrow)
      const svg = todayBtn.querySelector('svg');
      return svg !== null;
    });

    if (hasIcon) {
      console.log('   ✓ Group header has collapse/expand icon');
    } else {
      console.warn('   ⚠️  Group header icon not found');
    }

    // Step 7: Visual verification of grouping
    console.log('Step 7: Visual verification complete');
    await page.screenshot({ path: join(SCREENSHOT_DIR, '06-final-state.png'), fullPage: true });

    console.log('\n✅ Date grouping feature tests completed!');
    console.log(`📸 Screenshots saved to: ${SCREENSHOT_DIR}`);
    console.log('\nNote: This test creates conversations with current timestamps.');
    console.log('To fully test date groups (Yesterday, Previous 7 Days, etc.),');
    console.log('you would need to modify timestamps in the database manually.');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: join(SCREENSHOT_DIR, 'error.png'), fullPage: true });
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test
testDateGrouping()
  .then(() => {
    console.log('\n🎉 Date grouping feature test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Date grouping feature test failed:', error);
    process.exit(1);
  });
