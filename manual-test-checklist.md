# Manual Test Checklist for Claude.ai Clone

## Test Session: 2026-01-30

### Environment Setup
- ✅ Backend running on http://localhost:3000
- ✅ Frontend running on http://localhost:5173
- ✅ Database connected at ./database/claude.db
- ⚠️  API Key: Not configured (streaming will not work with real API)

---

## Tests to Verify

### Test #9: Click conversation in sidebar to switch context

**Status:** NEEDS VERIFICATION

**Steps:**
1. Navigate to http://localhost:5173
2. Create first conversation by clicking "Start New Conversation" or "New Chat"
3. Type a test message (it won't get a response without API key, that's OK)
4. Click "New Chat" to create a second conversation
5. Type a different test message in the second conversation
6. Click on the first conversation in the sidebar
7. Verify: First conversation's messages are displayed
8. Click on the second conversation in the sidebar
9. Verify: Second conversation's messages are displayed
10. Verify: URL changes to /chat/{conversationId}

**Expected Results:**
- Clicking conversations in sidebar switches the chat view
- Messages from the selected conversation are displayed
- URL updates to reflect current conversation ID
- The active conversation is highlighted in the sidebar

---

### Test #10: Delete conversation with confirmation

**Status:** NEEDS IMPLEMENTATION

**Current Implementation:**
- Delete button appears on hover in sidebar (✓)
- `window.confirm()` is used for confirmation (⚠️ needs better modal)
- API endpoint exists (✓)
- Deletion logic works (✓)

**Issues:**
- Using browser's `confirm()` instead of a custom modal
- Should be a proper styled confirmation modal

**Steps to Verify:**
1. Hover over a conversation in the sidebar
2. Click the delete (trash) icon
3. Confirm deletion in the browser dialog
4. Verify conversation is removed from sidebar
5. Verify if it was the current conversation, user is redirected

---

### Test #11: Search conversations by title

**Status:** NEEDS VERIFICATION

**Current Implementation:**
- Search input exists in sidebar (✓)
- Real-time filtering implemented (✓)
- Case-insensitive search (✓)

**Steps to Verify:**
1. Create multiple conversations with different titles
2. Type in the search box
3. Verify conversations filter in real-time
4. Clear search and verify all conversations return

---

### Test #12: Keyboard shortcuts (Enter to send)

**Status:** NEEDS VERIFICATION

**Current Implementation:**
- Enter sends message (✓)
- Shift+Enter creates newline (✓)

**Steps:**
1. Type a message
2. Press Enter (should send)
3. Type a message
4. Press Shift+Enter (should create newline)
5. Press Enter (should send multiline message)

---

## Summary

**Can be verified immediately (no API required):**
- ✅ Test #9: Conversation switching
- ✅ Test #10: Delete conversation (works, just uses browser confirm)
- ✅ Test #11: Search conversations
- ✅ Test #12: Keyboard shortcuts

**Requires Claude API key:**
- ❌ Test #5: Send message and receive streaming response
- ❌ Test #8: Stop generation button
- ❌ Test #10: Markdown rendering (needs actual response)
- ❌ Test #11: Code syntax highlighting (needs actual response)

---

## Next Actions

1. **Manually verify** tests #9, #11, #12 in browser
2. **Improve** delete confirmation (replace `confirm()` with modal)
3. **Document** which features work without API
4. **Update** feature_list.json for passing tests
5. **Commit** progress

