const express = require('express');
const login = require('cyber-bot-fca'); 
const fs = require('fs');
const app = express();

const PORT = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('🚀 ওস্তাদ, সাইবার এফসিএ সুপার ইঞ্জিন ফুল অ্যাক্টিভ!'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// =========================================
// GLOBAL CONFIGURATION
// =========================================
const CONFIG = {
    REPLY_TEXT: "HI ❤️",           // বটের অটো-রেপ্লাই মেসেজ
    TARGET_SENDER_ID: "",         // নির্দিষ্ট কারও আইডি দিলে শুধু তাকেই রিপ্লাই করবে, খালি রাখলে সবাইকে
    ALLOW_GROUPS: false           // গ্রুপ চ্যাটে অটো-রিপ্লাই বন্ধ রাখার জন্য false
};

let fbAppState;
try {
    fbAppState = JSON.parse(fs.readFileSync('appstate.json', 'utf8'));
    console.log("✅ appstate.json loaded successfully!");
} catch (err) {
    console.error("❌ appstate.json not found!", err);
    process.exit(1);
}

function startBot() {
    login({ appState: fbAppState }, (err, api) => {
        if (err) {
            console.error("❌ লগইন ব্যর্থ! ৫ সেকেন্ড পর আবার চেষ্টা করা হচ্ছে...", err);
            setTimeout(startBot, 5000);
            return;
        }

        console.log("✅ ফেসবুক অ্যাকাউন্টে সফলভাবে লগইন হয়েছে ওস্তাদ!");
        const botID = api.getCurrentUserID();
        console.log(`🤖 বটের নিজস্ব ইউজার আইডি: ${botID}`);
        
        // লাইব্রেরির সোর্স কোড অনুযায়ী অপটিমাইজড অপশনস
        api.setOptions({ 
            listenEvents: true, 
            selfListen: false,
            autoMarkRead: true,
            online: true
        });

        console.log("📡 লাইভ মেসেজের জন্য লিসেনিং ইঞ্জিন সচল করা হলো...");

        // api.listen কল করলে এটি ব্যাকএন্ডে স্বয়ংক্রিয়ভাবে listenMqtt লুপ ফায়ার করবে
        api.listen((listenErr, message) => {
            if (listenErr) {
                console.error("⚠️ লিসেনারে সমস্যা, সেলফ-হিলিং রিবুট নেওয়া হচ্ছে...", listenErr);
                setTimeout(startBot, 5000);
                return;
            }

            // শুধুমাত্র নতুন ইনকামিং মেসেজ প্রসেস করার জন্য
            if (message && message.type === "message") {
                const threadId = message.threadID;
                const senderId = message.senderID;
                const isGroup = message.isGroup || false;

                // মেসেজটি যদি নিজের অ্যাকাউন্ট থেকে না আসে
                if (senderId !== botID) {
                    
                    // গ্রুপ চ্যাট রেস্ট্রিকশন ফিল্টার
                    if (isGroup && !CONFIG.ALLOW_GROUPS) return;

                    // নির্দিষ্ট টার্গেট ইউজার ফিল্টার
                    if (CONFIG.TARGET_SENDER_ID && senderId !== CONFIG.TARGET_SENDER_ID) return;

                    console.log(`📩 নতুন মেসেজ ইন্টারসেপ্ট হয়েছে: "${message.body}" from ID: ${senderId}`);

                    // মেসেজ ডেলিভারি মেকানিজম (আধুনিক মেথড ফেইল করলে লাইব্রেরি অটো ওল্ড-মেথড ব্যাকআপ ফায়ার করবে)
                    api.sendMessage(CONFIG.REPLY_TEXT, threadId, (sendErr) => {
                        if (!sendErr) {
                            console.log(`✅ Automated reply "${CONFIG.REPLY_TEXT}" delivered to ${threadId}`);
                        } else {
                            console.error(`❌ মেসেজ পাঠাতে সমস্যা!`, sendErr);
                        }
                    });
                }
            }
        });
    });
}

// ইঞ্জিন স্টার্ট
startBot();
