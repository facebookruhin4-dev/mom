const express = require('express');
const login = require('fca-horizon-remake');
const fs = require('fs');
const app = express();

const PORT = process.env.PORT || 8080;
app.get('/', (req, res) => {
    res.send('🚀 ওস্তাদ, আপনার আপডেটেড সুপার-বট রেন্ডারে ফুল ফায়ারে সচল আছে!');
});
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

let fbAppState;
try {
    fbAppState = JSON.parse(fs.readFileSync('appstate.json', 'utf8'));
    console.log("✅ appstate.json থেকে কুকি সাকসেসফুলি লোড হয়েছে!");
} catch (err) {
    console.error("❌ appstate.json ফাইলটি ঠিকমতো পাওয়া যায়নি!", err);
    process.exit(1);
}

// 🛡️ নতুন মেটা সিকিউরিটি এড়াতে কাস্টম কনফিগারেশন
const botOptions = {
    appState: fbAppState,
    forceLogin: true
};

login(botOptions, (err, api) => {
    if (err) {
        console.error("❌ লগইন ফেইলড! কুকি ডেড হয়ে গেছে ওস্তাদ। নতুন কুকি লাগবে।", err);
        return;
    }

    console.log("✅ ফেসবুক অ্যাকাউন্টে সফলভাবে প্রবেশ করা হয়েছে ওস্তাদ!");

    // ⚡ লেটেস্ট লাইব্রেরির জন্য অপ্টিমাইজড সেটিংস
    api.setOptions({ 
        listenEvents: true, 
        selfListen: false,
        autoMarkRead: true, // মেসেজ আসা মাত্রই রিড করে নেবে
        online: true
    });

    console.log("📡 বটের কান খাড়া আছে, মেসেজ আসলেই খতম করে দেবে...");

    api.listenMqtt((err, message) => {
        if (err) return console.error("❌ লিসেনিং এরর:", err);

        // ইনবক্স বা গ্রুপ চ্যাটে যেকোনো মেসেজ আসলেই কাজ করবে
        if ((message.type === "message" || message.type === "message_reply") && message.body) {
            const threadId = message.threadID;

            // নিজের মেসেজ বাদ দিয়ে অন্য কারো মেসেজ হলেই ধরবে
            if (message.senderID !== api.getCurrentUserID()) {
                console.log(`📩 নতুন মেসেজ এসেছে: "${message.body}"`);

                // ⏱️ সেফটি ডিলয়: ১.৫ সেকেন্ড পর মানুষের মতো রিপ্লাই দেবে যেন ব্লক না খায়
                setTimeout(() => {
                    const replyMessage = "HI ❤️"; 

                    api.sendMessage(replyMessage, threadId, (err) => {
                        if (!err) {
                            console.log(`✅ "${replyMessage}" সফলভাবে ডেলিভার করা হয়েছে!`);
                        } else {
                            console.error("❌ রিপ্লাই পাঠাতে সমস্যা হয়েছে:", err);
                        }
                    });
                }, 1500);
            }
        }
    });
});
