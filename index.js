const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();

// 🔑 আপনার টেলিগ্রাম বট টোকেন
const token = '8962459681:AAEN-VzfP9yHpMBIn02hvsoQby5Z1CQktnA';
const bot = new TelegramBot(token, { polling: true });

// ইউজারের স্টেট (নাম/ঠিকানা ট্র্যাক করার জন্য) ডিক্লেয়ারেশন
const userState = {};

// 🌐 Render-এর জন্য ডামি ওয়েব সার্ভার (যাতে সার্ভার লাইভ থাকে)
const PORT = process.env.PORT || 8080;
app.get('/', (req, res) => {
    res.send('🚀 ওস্তাদ, আপনার Node.js মেডেক্স বট রেন্ডারে চমৎকারভাবে সচল আছে!');
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// 🤖 /start কমান্ড হ্যান্ডলার
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    userState[chatId] = { step: 'awaiting_name' }; // প্রথম ধাপ সেট করলাম

    const welcomeMessage = `🩺 *ওস্তাদের স্পেশাল বটের পক্ষ থেকে স্বাগতম!*\n\n` +
                           `আপনাকে আমাদের সিস্টেমে রেজিস্টার করতে জাস্ট দুটি ছোট তথ্য লাগবে।\n\n` +
                           `👤 ওস্তাদ, দয়া করে প্রথমে আপনার *সম্পূর্ণ নাম* টাইপ করে পাঠান:`;
    
    bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

// 💬 মেসেজ রিসিভ এবং নাম + ঠিকানা নেওয়ার লজিক
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text ? msg.text.strip : '';

    // যদি ইউজার কোনো কমান্ড দেয় (যেমন /start), তবে এই জেনারেল মেসেজ লজিক কাজ করবে না
    if (msg.text && msg.text.startsWith('/')) return;

    // যদি ইউজারের কোনো স্টেট না থাকে, তবে নরমাল রেসপন্স বা ওষুধ সার্চে যাবে
    if (!userState[chatId]) {
        // এখানে আপনি পরবর্তীতে ওষুধ সার্চের লজিক অ্যাড করতে পারবেন
        return;
    }

    const currentState = userState[chatId].step;

    // ১. নাম নেওয়ার ধাপ
    if (currentState === 'awaiting_name') {
        userState[chatId].name = msg.text; // নাম সেভ হলো
        userState[chatId].step = 'awaiting_address'; // পরবর্তী ধাপ সেট হলো

        const addressMessage = `🎯 *ধন্যবাদ ওস্তাদ!*\n\n` +
                               `আপনার নাম সফলভাবে নেওয়া হয়েছে। এবার দয়া করে আপনার *বর্তমান ঠিকানা (Address)* লিখে পাঠান:`;
        bot.sendMessage(chatId, addressMessage, { parse_mode: 'Markdown' });
    }
    
    // ২. ঠিকানা নেওয়ার ধাপ
    else if (currentState === 'awaiting_address') {
        userState[chatId].address = msg.text; // ঠিকানা সেভ হলো
        const name = userState[chatId].name;
        const address = userState[chatId].address;

        // স্টেট ক্লিয়ার করে দেওয়া যাতে এর পরের মেসেজগুলো নরমালভাবে কাজ করে
        delete userState[chatId]; 

        const successMessage = `🎉 *রেজিস্ট্রেশন সম্পন্ন হয়েছে ওস্তাদ!*\n\n` +
                               `🤝 *আপনার প্রোফাইল ডিটেইলস:*\n` +
                               `⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n` +
                               `👤 *নাম:* ${name}\n` +
                               `📍 *ঠিকানা:* ${address}\n` +
                               `⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n\n` +
                               `🩺 এখন আপনি যেকোনো ওষুধের নাম লিখে সার্চ করতে পারেন। আমি আপনার সেবা করার জন্য প্রস্তুত!`;

        bot.sendMessage(chatId, successMessage, { parse_mode: 'Markdown' });
    }
});

console.log("🤖 Node.js টেলিগ্রাম বট সফলভাবে চালু হয়েছে...");
