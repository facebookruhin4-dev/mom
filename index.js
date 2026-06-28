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

        console.log("✅ ফেসবুক এপিআই সফলভাবে কানেক্ট হয়েছে ওস্তাদ!");
        const botID = api.getCurrentUserID();

        // 🕋 ⏰ [মেইন ম্যাজিক] অলওয়েজ রানিং অটোমেটিক টাইমার
        // কেউ মেসেজ দিক বা না দিক, এই টাইমারটি প্রতি ৩০ সেকেন্ড পর পর নিজে নিজেই চলবে
        setInterval(() => {
            if (activeThreadID) {
                // কোনো মেসেজ ছাড়াই ব্যাকএন্ড থেকে ডিরেক্ট গ্রুপে মেসেজ পুশ হবে
                checkAndSendPrayerAlert(api, activeThreadID);
            }
        }, 30000);

        api.listen((listenErr, message) => {
            if (listenErr) {
                console.error("⚠️ লিসেনারে সমস্যা, ইঞ্জিন রিস্টার্ট করা হচ্ছে...", listenErr);
                setTimeout(startBot, 3000);
                return;
            }

            if (message && message.body) {
                const threadId = message.threadID;
                const senderId = message.senderID;
                const messageID = message.messageID;
                const messageBody = message.body.trim();
                const lowerBody = messageBody.toLowerCase();

                // শুধু গ্রুপ চ্যাট এলাу করবে, নিজের মেসেজ ইগনোর
                if (senderId === botID || threadId === senderId) return;

                // 🎯 গ্রুপে মেসেজ আসামাত্রই বট চিনে নিবে কোন গ্রুপে তাকে অটোমেটিক অ্যালার্ট দিতে হবে
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

                // ✨ ২. অটো রিয়েক্ট সিস্টেম (মুড বুঝে রিয়েক্ট মারবে)
                const emoji = getReactionEmoji(messageBody);
                if (emoji) {
                    api.setMessageReaction(emoji, messageID, (err) => {
                        if (!err) console.log(`🎯 মেসেজে "${emoji}" রিয়েক্ট দেওয়া হয়েছে!`);
                    }, true);
                }

                // ⏰ ৩. রান-টাইম চেক: কেউ গ্রুপে /start দিলে বাংলাদেশ সময় সহ দেখাবে
                if (lowerBody === '/start') {
                    const bdTime = getBangladeshTime();
                    const timeString = bdTime.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', hour12: true });
                    const dateString = bdTime.toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                    
                    const uptimeMessage = `🤖 ওমর অন ফায়ার বট অ্যাক্টিভ আছে ওস্তাদ!\n${getUptime()}\n\n⏰ বর্তমান বাংলাদেশ সময়: ${timeString}\n📅 তারিখ: ${dateString}`;
                    api.sendMessage(uptimeMessage, threadId, messageID);
                    return;
                }

                // 🤖 ৪. স্পেশাল বট ডাক সিস্টেম: কেউ যদি 'bot', 'বট' বা '/bot' লেখে
                if (isCallingBot(messageBody)) {
                    const specialReply = getBotReply();
                    console.log(`🤖 বটকে ডাকা হয়েছে! স্পেশাল রেপ্লাই: "${specialReply}"`);
                    api.sendMessage(specialReply, threadId, messageID);
                    return; 
                }

                // 💥 ۵. অল-মেসেজ ক্যাপশন রিপ্লাই (কেউ সাধারণ কোনো মেসেজ দিলে)
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
