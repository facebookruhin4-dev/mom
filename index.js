const express = require('express');
const login = require('cyber-bot-fca');
const fs = require('fs');
const path = require('path');

// সবকটি কাস্টম ফাইল এখানে কানেক্ট করা হলো
const { hasBannedWord } = require('./ban');
const { getRandomCaption } = require('./caption');
const { getReactionEmoji } = require('./react');
const { isCallingBot, getBotReply } = require('./bot'); 
const { checkAndSendPrayerAlert, getBangladeshTime } = require('./islamic'); 
const { getWelcomeMessage } = require('./welcome'); // 🎯 নতুন ওয়েলকাম ফাইল কানেক্ট করা হলো

const app = express();
const PORT = process.env.PORT || 10000;

const startTime = Date.now();
let activeThreadID = null; // 🎯 গ্রুপ আইডি অটো সেভ রাখার জন্য গ্লোবাল ভেরিয়েবল

app.get('/', (req, res) => {
    res.send('Bot is running perfectly with 100% Automatic Islamic Alerts!');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

function getUptime() {
    const totalSeconds = Math.floor((Date.now() - startTime) / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `⏳ রান-টাইম: ${hours} ঘণ্টা, ${minutes} মিনিট, ${seconds} সেকেন্ড!`;
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

        console.log("✅ ফেসবুক এপিআই সফলভাবে কানেক্ট হয়েছে!");
        const botID = api.getCurrentUserID();

        // 🕋 ⏰ অলওয়েজ রানিং অটোমেটিক টাইমার
        setInterval(() => {
            if (activeThreadID) {
                checkAndSendPrayerAlert(api, activeThreadID);
            }
        }, 30000);

        api.listen((listenErr, message) => {
            if (listenErr) {
                console.error("⚠️ লিসেনারে সমস্যা, ইঞ্জিন রিস্টার্ট করা হচ্ছে...", listenErr);
                setTimeout(startBot, 3000);
                return;
            }

            // 🎯 ৫. নতুন মেম্বার জয়েন করলে স্বাগত জানানোর সিস্টেম (ইভেন্ট হ্যান্ডলার)
            if (message && message.type === "log:subscribe") {
                const threadId = message.threadID;
                activeThreadID = threadId; // গ্রুপ আইডি আপডেট

                // বট নিজে গ্রুপে এড হলে
                if (message.logMessageData.addedParticipants.some(i => i.userFbId == botID)) {
                    api.sendMessage("কী রে বলদের দল! আমাকে গ্রুপে এড করলি কেন? এখন তোদের কপালে শনি আছে! 🔥", threadId);
                } else {
                    // অন্য কোনো নতুন বলদ জয়েন করলে
                    message.logMessageData.addedParticipants.forEach((participant) => {
                        const name = participant.fullName;
                        const welcomeText = getWelcomeMessage(name);
                        api.sendMessage(welcomeText, threadId);
                    });
                }
                return;
            }

            // সাধারণ মেসেজ হ্যান্ডলিং
            if (message && message.body) {
                const threadId = message.threadID;
                const senderId = message.senderID;
                const messageID = message.messageID;
                const messageBody = message.body.trim();
                const lowerBody = messageBody.toLowerCase();

                // শুধু গ্রুপ চ্যাট এলাউ করবে, নিজের মেসেজ ইগনোর
                if (senderId === botID || threadId === senderId) return;

                if (activeThreadID !== threadId) {
                    activeThreadID = threadId;
                    console.log(`📌 অটোমেটিক অ্যালার্টের জন্য গ্রুপ আইডি সেট করা হলো: ${activeThreadID}`);
                }

                // 🚨 ১. সিকিউরিটি চেক: মেসেজে কোনো খারাপ শব্দ আছে কিনা
                if (hasBannedWord(lowerBody)) {
                    console.log(`⚠️ খারাপ মেসেজ ডিটেক্ট হয়েছে! Sender: ${senderId}`);
                    const warningMessage = "ভাই আমি আপনার মতো বিয়াদব না এসব গালী দিয়েন না ☺️😏🥵";
                    api.sendMessage(warningMessage, threadId, messageID);
                    api.setMessageReaction("😡", messageID, (err) => { if(err) console.error(err); }, true);
                    return; 
                }

                // ✨ ২. অটো রিয়েক্ট সিস্টেম
                const emoji = getReactionEmoji(messageBody);
                if (emoji) {
                    api.setMessageReaction(emoji, messageID, (err) => {
                        if (!err) console.log(`🎯 মেসেজে "${emoji}" রিয়েক্ট দেওয়া হয়েছে!`);
                    }, true);
                }

                // ⏰ ৩. রান-টাইম চেক
                if (lowerBody === '/start') {
                    const bdTime = getBangladeshTime();
                    const timeString = bdTime.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', hour12: true });
                    const dateString = bdTime.toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                    
                    const uptimeMessage = `🤖 ওমর অন ফায়ার বট অ্যাক্টিভ আছে!\n${getUptime()}\n\n⏰ বর্তমান বাংলাদেশ সময়: ${timeString}\n📅 তারিখ: ${dateString}`;
                    api.sendMessage(uptimeMessage, threadId, messageID);
                    return;
                }

                // 🤖 ৪. স্পেশাল বট ডাক সিস্টেম
                if (isCallingBot(messageBody)) {
                    const specialReply = getBotReply();
                    console.log(`🤖 বটকে ডাকা হয়েছে! স্পেশাল রেপ্লাই: "${specialReply}"`);
                    api.sendMessage(specialReply, threadId, messageID);
                    return; 
                }

                // 💥 ৫. অল-মেসেজ ক্যাপশন রিপ্লাই
                const randomCaption = getRandomCaption();
                console.log(`💬 সাধারণ রেপ্লাই! পাঠানো হচ্ছে: "${randomCaption}"`);
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
