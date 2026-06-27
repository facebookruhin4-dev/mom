const express = require('express');
const login = require('fb-chat-api'); 
const fs = require('fs');
const app = express();

const PORT = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('🚀 Bot Web Service is Alive!'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// =========================================
// CONFIGURATION
// =========================================
const CONFIG = {
    POLL_INTERVAL: 8000,          // Polling rate in ms. 8-10 seconds is safer against automated flags.
    REPLY_TEXT: "HI ❤️",           // Your automated response
    TARGET_SENDER_ID: "",         // Keep empty to reply to anyone, or input their Facebook ID (e.g. "10000xxxx") to target only them
    ALLOW_GROUPS: false           // Prevents automatic replies inside group chats
};

// Cache to track successfully handled messages
const repliedMessages = new Set();

let fbAppState;
try {
    fbAppState = JSON.parse(fs.readFileSync('appstate.json', 'utf8'));
    console.log("✅ appstate.json loaded successfully!");
} catch (err) {
    console.error("❌ appstate.json not found!", err);
    process.exit(1);
}

login({ appState: fbAppState }, (err, api) => {
    if (err) return console.error("❌ Login failed!", err);

    console.log("✅ Facebook account successfully authenticated!");
    const botID = api.getCurrentUserID();
    console.log(`🤖 Bot User ID: ${botID}`);

    // Disabling MQTT to prevent crashes due to regional gateway issues
    api.setOptions({ listenEvents: false, selfListen: false });

    function pollInbox() {
        console.log("📡 Polling inbox for unread messages...");

        api.getThreadList(10, null, ["INBOX"], (err, list) => {
            if (err) {
                console.error("❌ Failed to scrape thread list:", err);
                // Schedule the next check even if this poll fails
                setTimeout(pollInbox, CONFIG.POLL_INTERVAL);
                return;
            }

            if (!list || list.length === 0) {
                console.log("📭 Thread list is empty or unreadable.");
                setTimeout(pollInbox, CONFIG.POLL_INTERVAL);
                return;
            }

            let processingReplies = 0;

            list.forEach(thread => {
                const threadId = thread.threadID;
                const unread = thread.unreadCount;
                const lastMsgId = thread.lastMessageID;
                const lastSender = thread.snippetSender;
                const isGroup = thread.isGroup;

                // Process if there is an unread message, it is not from ourselves, and has not been handled
                if (unread > 0 && lastSender !== botID && lastMsgId && !repliedMessages.has(lastMsgId)) {
                    
                    // Filter groups if configured
                    if (isGroup && !CONFIG.ALLOW_GROUPS) return;

                    // Filter target sender ID if configured
                    if (CONFIG.TARGET_SENDER_ID && lastSender !== CONFIG.TARGET_SENDER_ID) return;

                    console.log(`📩 New message: "${thread.snippet}" from Thread: ${threadId}`);

                    // Record to cache immediately to prevent concurrent triggers
                    repliedMessages.add(lastMsgId);
                    processingReplies++;

                    api.sendMessage(CONFIG.REPLY_TEXT, threadId, (sendErr) => {
                        if (!sendErr) {
                            console.log(`✅ Automated reply "${CONFIG.REPLY_TEXT}" sent to ${threadId}`);
                            
                            // Reset unread count on Facebook's servers
                            api.markAsRead(threadId, (readErr) => {
                                if (readErr) console.error(`⚠️ Failed to mark thread ${threadId} as read:`, readErr);
                            });
                        } else {
                            console.error(`❌ Failed to send reply to ${threadId}:`, sendErr);
                            // Remove from cache if the delivery failed so the bot can try again
                            repliedMessages.delete(lastMsgId);
                        }
                    });
                }
            });

            if (processingReplies === 0) {
                console.log("💤 No new matching messages detected.");
            }

            // Prune memory cache to keep memory footprint stable
            if (repliedMessages.size > 200) {
                const cacheArray = Array.from(repliedMessages);
                repliedMessages.clear();
                // Retain only the last 100 handled IDs
                cacheArray.slice(-100).forEach(id => repliedMessages.add(id));
            }

            // Schedule the next iteration recursively after this iteration completes
            setTimeout(pollInbox, CONFIG.POLL_INTERVAL);
        });
    }

    // Launch polling loop
    pollInbox();
});
