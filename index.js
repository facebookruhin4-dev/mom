const express = require('express');
const login = require('fb-chat-api');
const fs = require('fs');
const app = express();

const PORT = process.env.PORT || 8080;
app.get('/', (req, res) => {
    res.send('🚀 ওস্তাদ, আপনার ফেসবুক ইনবক্স + গ্রুপ বট রেন্ডারে চমৎকারভাবে সচল আছে!');
});
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

let fbAppState;
try {
    fbAppState = JSON.parse(fs.readFileSync('appstate.json', 'utf8'));
    console.log("✅ appstate.json ফাইল থেকে সফলভাবে কুকি লোড হয়েছে!");
} catch (err) {
    console.error("❌ appstate.json ফাইলটি পাওয়া যায়নি বা ফরম্যাট ভুল!", err);
    process.exit(1);
}

login({ appState: fbAppState }, (err, api) => {
    if (err) {
        console.error("❌ লগইন করতে সমস্যা হয়েছে ওস্তাদ!", err);
        return;
    }

    console.log("✅ ফেসবুক অ্যাকাউন্টে সফলভাবে লগইন হয়েছে ওস্তাদ!");

    // 🛠️ কনফিগারেশন একদম সিম্পল ও নিখুঁত রাখা হলো
    api.setOptions({ 
        listenEvents: true, 
        selfListen: false // নিজের মেসেজে নিজে রিপ্লাই দেবে না
    });

    // listenMqtt অটোমেটিক ইনবক্স এবং গ্রুপ চ্যাটের সব মেসেজ রিয়েল-টাইমে রিসিভ করে
    api.listenMqtt((err, message) => {
        if (err) return console.error(err);

        // ইনবক্স (Direct Message) অথবা গ্রুপ চ্যাট যেকোনো জায়গায় টেক্সট মেসেজ আসলে
        if (message.type === "message" && message.body) {
            const incomingMessage = message.body.toLowerCase().trim();
            const threadId = message.threadID; 

            console.log(`💬 নতুন মেসেজ এসেছে: "${message.body}" (Thread ID: ${threadId})`);

            // 🎯 ভালোবাসা দেখানোর ট্রিগার শব্দসমূহ
            if (incomingMessage.includes("ভালোবাসা") || incomingMessage.includes("love") || incomingMessage.includes("হাই") || incomingMessage.includes("বট")) {
                
                const loveMessages = [
                    "❤️ ওস্তাদের বটের পক্ষ থেকে একরাশ ভালোবাসা নিন! আপনার দিনটি চমৎকার কাটুক। ✨",
                    "💖 ভালোবাসা সবসময় সুন্দর! আপনার মেসেজটি দেখে মনটা ভালো হয়ে গেল। 🥰",
                    "🤗 অনেক অনেক ভালোবাসা আর শুভকামনা আপনার জন্য ওস্তাদ!",
                    "🌹 আপনার জন্য এক বুক ভালোবাসা পাঠালাম! সবসময় হাসিখুশি থাকুন। 😉"
                ];

                const randomReply = loveMessages[Math.floor(Math.random() * loveMessages.length)];

                // অটোমেটিক মেসেজ পাঠানো (ইনবক্স ও গ্রুপ দুই জায়গাতেই ফায়ার হবে)
                api.sendMessage(randomReply, threadId, (err) => {
                    if (err) console.error("❌ রিপ্লাই যায়নি:", err);
                    else console.log("✅ সুন্দর ভালোবাসার মেসেজ সফলভাবে পাঠানো হয়েছে!");
                });
            }
        }
    });
});
