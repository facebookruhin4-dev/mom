const fs = require('fs');
const express = require('express');
const login = require('fb-chat-api');

// ================= GLOBAL CONFIGURATION =================
const CONFIG = {
  REPLY_TEXT: "HI ❤️",
  TARGET_SENDER_ID: "", // If empty, reply to anyone. If Facebook UID is specified, reply ONLY to them.
  ALLOW_GROUPS: false   // Strictly ignore group messages
};
// ========================================================

// Keep-Alive Express Server for Hosting Platforms (e.g., Render)
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.status(200).send('Facebook Automated Reply Bot is active.');
});

app.listen(PORT, () => {
  console.log(`[Express] Web server listening on port ${PORT}`);
});

let stopListen = null;
let isRebooting = false;

/**
 * Handles incoming message events and applies specified filter rules
 */
function handleIncomingMessage(api, event) {
  // 1. Group exclusion check
  if (!CONFIG.ALLOW_GROUPS && event.isGroup) {
    return;
  }

  // 2. Specific Target Sender ID check
  if (CONFIG.TARGET_SENDER_ID && event.senderID !== CONFIG.TARGET_SENDER_ID) {
    return;
  }

  // 3. Self-Message Check
  const myID = api.getCurrentUserID();
  if (event.senderID === myID) {
    return;
  }

  // Reply back to the target thread ID, attaching it as a reply to the original message
  api.sendMessage(CONFIG.REPLY_TEXT, event.threadID, (err) => {
    if (err) {
      console.error(`[Error] Failed to reply to thread ${event.threadID}:`, err);
    } else {
      console.log(`[Success] Sent reply to thread ${event.threadID}`);
    }
  }, event.messageID);
}

/**
 * Configures connection parameters and initiates the HTTP polling listener
 */
function startListener(api) {
  // Apply connection-saving configurations and transition away from MQTT
  api.setOptions({
    useMqtt: false,       // Force fallback to HTTP polling (bypasses restricted/unstable MQTT gateways)
    forceLogin: true,     // Direct session configuration
    listenEvents: true,   // Ensure global messaging and system events are received
    selfListen: false     // Disable listening to the bot's own responses
  });

  console.log("[Listener] Initializing HTTP polling stream...");

  // Bypassing getThreadList entirely. Logic listens to real-time events as they arrive.
  stopListen = api.listen((err, event) => {
    if (err) {
      console.error("[Listener Error] Active stream generated an error:", err);
      triggerReconnect(api);
      return;
    }

    if (event.type === "message" || event.type === "message_reply") {
      handleIncomingMessage(api, event);
    }
  });
}

/**
 * Safely tears down the active listener and initiates automated reconnection
 */
function triggerReconnect(api) {
  if (isRebooting) return;
  isRebooting = true;

  console.log("[Self-Healing] Connection loss detected. Restructuring listener...");

  try {
    if (typeof stopListen === "function") {
      stopListen();
    }
  } catch (stopError) {
    console.error("[Self-Healing] Error trying to close active listener:", stopError);
  }

  console.log("[Self-Healing] Waiting 5 seconds before binding new HTTP polling cycle...");
  setTimeout(() => {
    isRebooting = false;
    startListener(api);
  }, 5000);
}

/**
 * Bootstrap sequence for appstate verification and login execution
 */
function bootstrap() {
  let appState;
  
  try {
    if (fs.existsSync('./appstate.json')) {
      const fileContent = fs.readFileSync('./appstate.json', 'utf8');
      appState = JSON.parse(fileContent);
      console.log("[System] Credentials parsed from appstate.json");
    } else {
      console.error("[CRITICAL] Missing 'appstate.json' file. Please place it in the application root.");
      process.exit(1);
    }
  } catch (parseError) {
    console.error("[CRITICAL] Failed to parse appstate.json. Ensure it is formatted as valid JSON.", parseError);
    process.exit(1);
  }

  console.log("[System] Connecting to Facebook session...");
  login({ appState }, (err, api) => {
    if (err) {
      console.error("[CRITICAL] Login process failed. Session markers may be invalid.", err);
      process.exit(1);
    }

    console.log("[System] Session authorized.");

    // Update the state cache to preserve dynamic cookie values
    try {
      const updatedState = api.getAppState();
      fs.writeFileSync('./appstate.json', JSON.stringify(updatedState, null, 2));
      console.log("[System] Local appstate.json storage updated.");
    } catch (saveError) {
      console.warn("[Warning] Could not cache new session tokens:", saveError);
    }

    startListener(api);
  });
}

bootstrap();
