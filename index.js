const express = require('express');
const login = require('fb-chat-api');
const fs = require('fs');
const app = express();

// 🌐 রেন্ডারকে ২৪ ঘণ্টা লাইভ রাখার জন্য ডামি ওয়েব সার্ভার
const PORT = process.env.PORT || 8080;
app.get('/', (req, res) => {
    res.send('🚀 ওস্তাদ, আপনার ফেসবুক কুকি গ্রুপ বট রেন্ডারে চমৎকারভাবে সচল আছে!');
});
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// 📁 আলাদা ফাইল থেকে কুকি (AppState) লোড করার ওস্তাদি ট্রিক
let fbAppState;
try {
    fbAppState = JSON.parse(fs.readFileSync('appstate.json', 'utf8'));
    console.log("✅ appstate.json ফাইল থেকে সফলভাবে কুকি লোড হয়েছে!");
} catch (err) {
    console.error("❌ appstate.json ফাইলটি পাওয়া যায়নি বা ফরম্যাট ভুল!", err);
    process.exit(1);
}

// 🤖 ফেসবুক কুকি দিয়ে লগইন এবং গ্রুপ চ্যাট মনিটরিং
login({ appState: fbAppState }, (err, api) => {
    if (err) {
        console.error("❌ লগইন করতে সমস্যা হয়েছে ওস্তাদ! কুকি এক্সপায়ার বা নষ্ট হতে পারে।", err);
        return;
    }

    console.log("✅ ফেসবুক অ্যাকাউন্টে সফলভাবে লগইন হয়েছে ওস্তাদ!");

    // নিজের মেসেজে নিজে যেন রিপ্লাই না দেয়
    api.setOptions({ listenEvents: true, selfListen: false });

    // মেসেজ শোনার লজিক
    api.listenMqtt((err, message) => {
        if (err) return console.error(err);

        // গ্রুপ বা ইনবক্সে টেক্সট মেসেজ আসলে
        if (message.type === "message" && message.body) {
            const incomingMessage = message.body.toLowerCase().trim();
            const threadId = message.threadID;

            console.log(`💬 নতুন মেসেজ: "${message.body}" (ID: ${threadId})`);

            // 🎯 গ্রুপে কেউ নক দিলে ভালোবাসা দেখানোর লজিক
            if (incomingMessage.includes("ভালোবাসা") || incomingMessage.includes("love") || incomingMessage.includes("হাই") || incomingMessage.includes("বট")) {
                
                const loveMessages = [
                    "❤️ ওস্তাদের বটের পক্ষ থেকে একরাশ ভালোবাসা নিন! আপনার দিনটি চমৎকার কাটুক। ✨",
                    "💖 ভালোবাসা সবসময় সুন্দর! আপনার মেসেজটি দেখে মনটা ভালো হয়ে গেল। 🥰",
                    "🤗 অনেক অনেক ভালোবাসা আর শুভকামনা আপনার জন্য ওস্তাদ!",
                    "🌹 আপনার জন্য এক বুক ভালোবাসা পাঠালাম! সবসময় হাসিখুশি থাকুন। 😉"
                ];

                const randomReply = loveMessages[Math.floor(Math.random() * loveMessages.length)];

                // অটোমেটিক রিপ্লাই পাঠানো
                api.sendMessage(randomReply, threadId, (err) => {
                    if (err) console.error("❌ রিপ্লাই যায়নি:", err);
                    else console.log("✅ সুন্দর ভালোবাসার মেসেজ পাঠানো হয়েছে!");
                });
            }
        }
    });
});
