const express = require('express');
const login = require('cyber-bot-fca');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// বটের রান-টাইম হিসাব করার জন্য শুরুর সময়টা সেভ করে রাখছি
const startTime = Date.now();

const CONFIG = {
    REPLY_TEXT: "HI ❤️",
    ALLOW_GROUPS_ONLY: true // শুধু গ্রুপে কাজ করবে
};

app.get('/', (req, res) => {
    res.send('Bot is running perfectly!');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// রান-টাইম (Uptime) ফরম্যাট করার ফাংশন
function getUptime() {
    const totalSeconds = Math.floor((Date.now() - startTime) / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `⏳ রান-টাইম: ${hours} ঘণ্টা, ${minutes} মিনিট, ${seconds} সেকেন্ড ওস্তাদ!`;
}

// মূল বট স্টার্ট করার ফাংশন
function startBot() {
    console.log("🤖 বট স্টার্ট করা হচ্ছে...");
    
    const appStatePath = path.join(__dirname, 'appstate.json');
    if (!fs.existsSync(appStatePath)) {
        console.error("❌ appstate.json ফাইলটি পাওয়া যায়নি!");
        return;
    }

    const appState = JSON.parse(fs.readFileSync(appStatePath, 'utf8'));

    login({ appState }, (err, api) => {
        if (err) {
            console.error("⚠️ লগইন করতে ঝামেলা হয়েছে, ৩ সেকেন্ড পর আবার চেষ্টা করছি...", err);
            setTimeout(startBot, 3000); // ভেজাল হলে ৩ সেকেন্ড পর অটো রিস্টার্ট হবে
            return;
        }

        const botID = api.getCurrentUserID();

        api.listen((listenErr, message) => {
            if (listenErr) {
                console.error("⚠️ লিসেনারে সমস্যা, ইঞ্জিন রিস্টার্ট করা হচ্ছে...", listenErr);
                setTimeout(startBot, 3000); // লিসেনারে ভেজাল হলেও অটো রিস্টার্ট
                return;
            }

            if (message && message.body) {
                const threadId = message.threadID;
                const senderId = message.senderID;
                const messageBody = message.body.trim();

                // বট নিজের মেসেজ ইগনোর করবে এবং শুধু গ্রুপ চ্যাট (যেখানে threadID আর senderID এক না) এলাউ করবে
                if (senderId === botID || threadId === senderId) return;

                // কেউ গ্রুপে /start দিলে রান-টাইম দেখাবে
                if (messageBody === '/start') {
                    const uptimeMessage = `🤖 ওমর অন ফায়ার বট অ্যাক্টিভ আছে ওস্তাদ!\n${getUptime()}`;
                    api.sendMessage(uptimeMessage, threadId);
                    return;
                }

                // অন্য যেকোনো মেসেজের জন্য সাধারণ রেপ্লাই
                api.sendMessage(CONFIG.REPLY_TEXT, threadId, (sendErr) => {
                    if (sendErr) console.error(`❌ মেসেজ পাঠাতে সমস্যা!`, sendErr);
                });
            }
        });
    });
}

// প্রজেক্টে কোনো আনকচ বা বড় এরর (Crash Error) আসলেও যাতে ক্র্যাশ না করে রিস্টার্ট হয়
process.on('uncaughtException', (err) => {
    console.error('🔥 ক্র্যাশ এড়াতে Uncaught Exception হ্যান্ডেল করা হলো:', err);
    setTimeout(startBot, 3000);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🔥 ক্র্যাশ এড়াতে Unhandled Rejection হ্যান্ডেল করা হলো:', reason);
    setTimeout(startBot, 3000);
});

// প্রথমবার রান করার জন্য কল করা হলো
startBot();
