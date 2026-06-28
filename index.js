const express = require('express');
const login = require('cyber-bot-fca');
const fs = require('fs');
const path = require('path');

// কাস্টম ফাইল কানেকশনস
const { hasBannedWord } = require('./ban');
const { getRandomCaption } = require('./caption');
const { getReactionEmoji } = require('./react');

const app = express();
const PORT = process.env.PORT || 10000;

const startTime = Date.now();

app.get('/', (req, res) => {
    res.send('Bot is running perfectly with Auto-Reply & Reactions!');
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
                const messageID = message.messageID; // রিপ্লাই এবং রিয়েক্টের জন্য আসল চাবিকাঠি
                const messageBody = message.body.trim();
                const lowerBody = messageBody.toLowerCase();

                // শুধু গ্রুপ চ্যাট এলাউ করবে, পার্সোনাল ইনবক্স ও নিজের মেসেজ ইগনোর
                if (senderId === botID || threadId === senderId) return;

                // 🚨 ১. সিকিউরিটি চেক: মেসেজে কোনো খারাপ শব্দ আছে কিনা
                if (hasBannedWord(lowerBody)) {
                    console.log(`⚠️ খারাপ মেসেজ ডিটেক্ট হয়েছে! Sender: ${senderId}`);
                    const warningMessage = "ভাই আমি আপনার মতো বিয়াদব না এসব গালী দিয়েন না ☺️😏🥵";
                    
                    // খারাপ মেসেজটাকেও রিপ্লাই করে ওয়ার্নিং দেওয়া হবে
                    api.sendMessage({ body: warningMessage, mentions: [{ tag: warningMessage, id: senderId }] }, threadId, messageID);
                    api.setMessageReaction("😡", messageID, (err) => { if(err) console.error(err); }, true);
                    return; 
                }

                // ✨ ২. অটো রিয়েক্ট সিস্টেম (মেসেজ আসার সাথে সাথে রিয়েক্ট মারবে)
                const emoji = getReactionEmoji(messageBody);
                if (emoji) {
                    api.setMessageReaction(emoji, messageID, (err) => {
                        if (!err) console.log(`🎯 মেসেজে "${emoji}" রিয়েক্ট দেওয়া হয়েছে!`);
                    }, true);
                }

                // ⏰ ৩. রান-টাইম চেক: কেউ গ্রুপে /start দিলে
                if (lowerBody === '/start') {
                    const uptimeMessage = `🤖 ওমর অন ফায়ার বট অ্যাক্টিভ আছে ওস্তাদ!\n${getUptime()}`;
                    api.sendMessage(uptimeMessage, threadId, messageID); // নির্দিষ্ট মেসেজকে রিপ্লাই
                    return;
                }

                // 💥 ৪. অল-মেসেজ ক্যাপশন রিপ্লাই (এখন যে কেউ যাই মেসেজ দিক না কেন, বট রিপ্লাই করবে)
                const randomCaption = getRandomCaption();
                console.log(`💬 অল-মেসেজ রেপ্লাই! পাঠানো হচ্ছে: "${randomCaption}"`);
                
                // এখানে আমরা অবজেক্ট না পাঠিয়ে সরাসরি মেসেজ টেক্সট এবং ৩য় প্যারামিটার হিসেবে messageID পাস করছি জাস্ট চট করে রিপ্লাই হওয়ার জন্য
                api.sendMessage(randomCaption, threadId, (err) => {
                    if (err) console.error("ক্যাপশন রিপ্লাই পাঠাতে সমস্যা:", err);
                }, messageID);
            }
        });
    });
}

process.on('uncaughtException', (err) => {
    console.error('🔥 - ক্র্যাশ এড়াতে Uncaught Exception হ্যান্ডেল করা হলো:', err);
    setTimeout(startBot, 3000);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🔥 - ক্র্যাশ এড়াতে Unhandled Rejection হ্যান্ডেল করা হলো:', reason);
    setTimeout(startBot, 3000);
});

startBot();
