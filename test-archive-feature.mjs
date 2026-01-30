#!/usr/bin/env node

/**
 * Archive Feature Test Script
 * Tests feature #20: Archive/unarchive conversation
 *
 * This script uses Puppeteer to test the archive conversation functionality:
 * 1. Create multiple conversations
 * 2. Archive a conversation
 * 3. Verify it's removed from main list
 * 4. Switch to archive view
 * 5. Verify archived conversation appears
 * 6. Unarchive and verify it returns to main list
 */

import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const APP_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = join(__dirname, 'screenshots', 'archive-feature');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testArchiveFeature() {
  console.log('🧪 Starting Archive Feature Test (Test #20)...\n');

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

    // Step 2: Create first conversation
    console.log('Step 2: Create first conversation');
    const newChatButton = await page.$('button:has-text("New Chat")') ||
                          await page.$('button[class*="bg-[#CC785C]"]');
    if (!newChatButton) {
      throw new Error('Could not find New Chat button');
    }
    await newChatButton.click();
    await sleep(1000);

    // Type and send a message to make conversation distinguishable
    const textarea = await page.$('textarea');
    if (textarea) {
      await textarea.type('First conversation message');
      await page.keyboard.press('Enter');
      await sleep(2000);
    }
    await page.screenshot({ path: join(SCREENSHOT_DIR, '02-conversation-1-created.png'), fullPage: true });

    // Step 3: Create second conversation
    console.log('Step 3: Create second conversation');
    const newChatButton2 = await page.$('button:has-text("New Chat")') ||
                           await page.$('button[class*="bg-[#CC785C]"]');
    await newChatButton2.click();
    await sleep(1000);

    const textarea2 = await page.$('textarea');
    if (textarea2) {
      await textarea2.type('Second conversation message');
      await page.keyboard.press('Enter');
      await sleep(2000);
    }
    await page.screenshot({ path: join(SCREENSHOT_DIR, '03-conversation-2-created.png'), fullPage: true });

    // Step 4: Create third conversation to archive
    console.log('Step 4: Create third conversation (to be archived)');
    const newChatButton3 = await page.$('button:has-text("New Chat")') ||
                           await page.$('button[class*="bg-[#CC785C]"]');
    await newChatButton3.click();
    await sleep(1000);

    const textarea3 = await page.$('textarea');
    if (textarea3) {
      await textarea3.type('This conversation will be archived');
      await page.keyboard.press('Enter');
      await sleep(2000);
    }
    await page.screenshot({ path: join(SCREENSHOT_DIR, '04-conversation-3-created.png'), fullPage: true });

    // Step 5: Count conversations before archiving
    console.log('Step 5: Count conversations in main view');
    const conversationsBeforeArchive = await page.$$('.cursor-pointer.group');
    console.log(`   Found ${conversationsBeforeArchive.length} conversations in main list`);

    // Step 6: Hover over the second conversation and click archive button
    console.log('Step 6: Archive the second conversation');
    await sleep(500);

    // Get all conversation items
    const conversations = await page.$$('.cursor-pointer.group');
    if (conversations.length < 2) {
      throw new Error('Not enough conversations found');
    }

    // Hover over the second conversation (index 1)
    await conversations[1].hover();
    await sleep(500);
    await page.screenshot({ path: join(SCREENSHOT_DIR, '05-hover-showing-buttons.png'), fullPage: true });

    // Find and click the archive button (middle button with archive icon)
    const archiveButtons = await page.$$('button[title*="Archive"]');
    if (archiveButtons.length === 0) {
      throw new Error('Archive button not found');
    }
    await archiveButtons[0].click();
    await sleep(1500);
    await page.screenshot({ path: join(SCREENSHOT_DIR, '06-conversation-archived.png'), fullPage: true });

    // Step 7: Verify conversation removed from main list
    console.log('Step 7: Verify conversation removed from main list');
    const conversationsAfterArchive = await page.$$('.cursor-pointer.group');
    console.log(`   Now ${conversationsAfterArchive.length} conversations in main list`);

    if (conversationsAfterArchive.length !== conversationsBeforeArchive.length - 1) {
      throw new Error(`Expected ${conversationsBeforeArchive.length - 1} conversations after archive, but found ${conversationsAfterArchive.length}`);
    }
    console.log('   ✓ Conversation removed from main list');

    // Step 8: Click "Show Archived" button
    console.log('Step 8: Switch to archive view');
    const showArchivedButton = await page.$('button:has-text("Show Archived")') ||
                                await page.$('button span:has-text("Show Archived")').then(span => span?.evaluateHandle(el => el.parentElement));

    if (!showArchivedButton) {
      throw new Error('Show Archived button not found');
    }

    await showArchivedButton.click();
    await sleep(1000);
    await page.screenshot({ path: join(SCREENSHOT_DIR, '07-archive-view-opened.png'), fullPage: true });

    // Step 9: Verify archived conversation appears in archive view
    console.log('Step 9: Verify archived conversation appears in archive view');
    const archivedConversations = await page.$$('.cursor-pointer.group');
    console.log(`   Found ${archivedConversations.length} conversation(s) in archive view`);

    if (archivedConversations.length === 0) {
      throw new Error('No archived conversations found');
    }
    console.log('   ✓ Archived conversation appears in archive view');

    // Step 10: Hover and click unarchive button
    console.log('Step 10: Unarchive the conversation');
    await archivedConversations[0].hover();
    await sleep(500);
    await page.screenshot({ path: join(SCREENSHOT_DIR, '08-archive-view-hover.png'), fullPage: true });

    const unarchiveButtons = await page.$$('button[title*="Unarchive"]');
    if (unarchiveButtons.length === 0) {
      throw new Error('Unarchive button not found');
    }
    await unarchiveButtons[0].click();
    await sleep(1500);
    await page.screenshot({ path: join(SCREENSHOT_DIR, '09-conversation-unarchived.png'), fullPage: true });

    // Step 11: Verify conversation removed from archive view
    console.log('Step 11: Verify conversation removed from archive view');
    const remainingArchived = await page.$$('.cursor-pointer.group');
    console.log(`   Now ${remainingArchived.length} conversation(s) in archive view`);

    if (remainingArchived.length !== 0) {
      throw new Error(`Expected 0 conversations in archive after unarchive, but found ${remainingArchived.length}`);
    }
    console.log('   ✓ Conversation removed from archive view');

    // Step 12: Switch back to main view
    console.log('Step 12: Switch back to main view');
    const showActiveButton = await page.$('button:has-text("Show Active")') ||
                             await page.$('button span:has-text("Show Active")').then(span => span?.evaluateHandle(el => el.parentElement));

    if (!showActiveButton) {
      throw new Error('Show Active button not found');
    }

    await showActiveButton.click();
    await sleep(1000);
    await page.screenshot({ path: join(SCREENSHOT_DIR, '10-back-to-main-view.png'), fullPage: true });

    // Step 13: Verify conversation returned to main list
    console.log('Step 13: Verify conversation returned to main list');
    const conversationsAfterUnarchive = await page.$$('.cursor-pointer.group');
    console.log(`   Found ${conversationsAfterUnarchive.length} conversations in main list`);

    if (conversationsAfterUnarchive.length !== conversationsBeforeArchive.length) {
      throw new Error(`Expected ${conversationsBeforeArchive.length} conversations after unarchive, but found ${conversationsAfterUnarchive.length}`);
    }
    console.log('   ✓ Conversation returned to main list');

    console.log('\n✅ All archive feature tests passed!');
    console.log(`📸 Screenshots saved to: ${SCREENSHOT_DIR}`);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: join(SCREENSHOT_DIR, 'error.png'), fullPage: true });
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test
testArchiveFeature()
  .then(() => {
    console.log('\n🎉 Archive feature test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Archive feature test failed:', error);
    process.exit(1);
  });
