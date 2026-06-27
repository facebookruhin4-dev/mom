const express = require('express');
const login = require('fb-chat-api');
const fs = require('fs');
const app = express();

// রেন্ডার সার্ভার সচল রাখার জন্য বেসিক এক্সপ্রেস পোর্ট সেটআপ
const PORT = process.env.PORT || 10000;
app.get('/', (req, res) => {
    res.send('🚀 ওস্তাদ, আপনার ফেসবুক গ্রুপ বট রেন্ডারে সফলভাবে লাইভ আছে!');
});
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// appstate.json থেকে কুকি রিড করার মেকানিজম
let fbAppState;
try {
    fbAppState = JSON.parse(fs.readFileSync('appstate.json', 'utf8'));
    console.log("✅ appstate.json ফাইল থেকে সফলভাবে কুকি লোড হয়েছে!");
} catch (err) {
    console.error("❌ appstate.json ফাইলটি পাওয়া যায়নি বা ফরম্যাট ভুল!", err);
    process.exit(1);
}

// ফেসবুক লগইন প্রসেস শুরু ওস্তাদ
login({ appState: fbAppState }, (err, api) => {
    if (err) {
        console.error("❌ ফেসবুক লগইন করতে সমস্যা হয়েছে ওস্তাদ! কুকি চেক করুন।", err);
        return;
    }

    console.log("✅ ফেসবুক অ্যাকাউন্টে সফলভাবে লগইন হয়েছে ওস্তাদ!");

    // বটের লিসেনিং অপশন কনফিগারেশন
    api.setOptions({ 
        listenEvents: true, 
        selfListen: false 
    });

    console.log("📡 বটের লিসেনার অন করা হয়েছে, মেসেজের অপেক্ষা করা হচ্ছে...");

    // মেসেজ রিসিভ এবং অটো-রিপ্লাই লজিক
    api.listenMqtt((err, message) => {
        if (err) {
            console.error("❌ লাইভ লিসেনিং এ সমস্যা হয়েছে:", err);
            return;
        }

        // ইনবক্স বা মেসেঞ্জার গ্রুপ চ্যাটে কোনো টেক্সট মেসেজ আসলে
        if (message.type === "message" && message.body) {
            const incomingMessage = message.body.toLowerCase().trim();
            const threadId = message.threadID;

            // নিজের পাঠানো মেসেজ বাদ দিয়ে অন্য কারো মেসেজ হলেই অ্যাকশন নেবে
            if (message.senderID !== api.getCurrentUserID()) {
                console.log(`📩 নতুন মেসেজ এসেছে: "${message.body}" (Thread ID: ${threadId})`);

                // 🎯 ট্রিকার শব্দসমূহ (হাই, hi, love, ইত্যাদি)
                if (incomingMessage.includes("হাই") || incomingMessage.includes("hi") || incomingMessage.includes("love") || incomingMessage.includes("বট")) {
                    
                    const replyMessage = "HI ❤️";

                    // অটোমেটিক মেসেজ পাঠানো (ইনবক্স ও গ্রুপ দুই জায়গাতেই কাজ করবে)
                    api.sendMessage(replyMessage, threadId, (err) => {
                        if (err) console.error("❌ রিপ্লাই পাঠানো যায়নি:", err);
                        else console.log(`✅ সফলভাবে "${replyMessage}" পাঠানো হয়েছে ওস্তাদ!`);
                    });
                }
            }
        }
    });
});
