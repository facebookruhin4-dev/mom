const express = require('express');
const login = require('cyber-bot-fca');
const fs = require('fs');
const path = require('path');

// পুরাতন ban.js এবং নতুন caption.js দুইটাই এখানে ইমপোর্ট করলাম
const { hasBannedWord } = require('./ban');
const { getRandomCaption } = require('./caption');

const app = express();
const PORT = process.env.PORT || 10000;

const startTime = Date.now();

app.get('/', (req, res) => {
    res.send('Bot is running perfectly with Captions!');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

function getUptime() {
    const totalSeconds = Math.floor((Date.now() - startTime) / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `⏳ রান-টাইম: ${hours} ঘণ্টা, ${minutes} মিনিট, ${seconds} সেকেন্ড ওস্তাদ!`;
}

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
            setTimeout(startBot, 3000);
            return;
        }

        const botID = api.getCurrentUserID();

        api.listen((listenErr, message) => {
            if (listenErr) {
                console.error("⚠️ লিসেনারে সমস্যা, ইঞ্জিন রিস্টার্ট করা হচ্ছে...", listenErr);
                setTimeout(startBot, 3000);
                return;
            }

            if (message && message.body) {
                const threadId = message.threadID;
                const senderId = message.senderID;
                const messageBody = message.body.trim().toLowerCase(); // ছোট হাতের অক্ষরে কনভার্ট করে নিলাম

                // শুধু গ্রুপ চ্যাট এলাউ করবে, পার্সোনাল ইনবক্স ও নিজের মেসেজ ইগনোর
                if (senderId === botID || threadId === senderId) return;

                // 🚨 ১. সিকিউরিটি চেক: মেসেজে কোনো খারাপ শব্দ আছে কিনা
                if (hasBannedWord(messageBody)) {
                    console.log(`⚠️ খারাপ মেসেজ ডিটেক্ট হয়েছে! Sender: ${senderId}`);
                    const warningMessage = "ভাই আমি আপনার মতো বিয়াদব না এসব গালী দিয়েন না ☺️😏🥵";
                    api.sendMessage(warningMessage, threadId);
                    return; 
                }

                // 🤖 ২. ক্যাপশন সিস্টেম: কেউ গ্রুপে 'bot' বা '/bot' লিখে ডাকলে
                if (messageBody === 'bot' || messageBody === '/bot') {
                    const randomCaption = getRandomCaption(); // র্যান্ডম ক্যাপশন তুলে আনা হলো
                    console.log(`💬 ক্যাপশন রিকোয়েস্ট! পাঠানো হচ্ছে: "${randomCaption}"`);
                    
                    api.sendMessage(randomCaption, threadId, (err) => {
                        if (err) console.error("ক্যাপশন পাঠাতে সমস্যা:", err);
                    });
                    return; // ক্যাপশন পাঠিয়ে দিলে কাজ শেষ, নিচে আর যাবে না
                }

                // ⏰ ৩. রান-টাইম চেক: কেউ গ্রুপে /start দিলে
                if (messageBody === '/start') {
                    const uptimeMessage = `🤖 ওমর অন ফায়ার বট অ্যাক্টিভ আছে ওস্তাদ!\n${getUptime()}`;
                    api.sendMessage(uptimeMessage, threadId);
                    return;
                }

                // [নোট: সাধারণ মেসেজে এখন আর কোনো "HI ❤️" রেপ্লাই যাবে না, শুধু কমান্ডেই কাজ করবে]
            }
        });
    });
}

process.on('uncaughtException', (err) => {
    console.error('🔥 ক্র্যাশ এড়াতে Uncaught Exception হ্যান্ডেল করা হলো:', err);
    setTimeout(startBot, 3000);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🔥 ক্র্যাশ এড়াতে Unhandled Rejection হ্যান্ডেল করা হলো:', reason);
    setTimeout(startBot, 3000);
});

startBot();
