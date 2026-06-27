const express = require('express');
const login = require('fca-sus'); // নতুন লাইব্রেরি
const fs = require('fs');
const app = express();

const PORT = process.env.PORT || 10000;
app.get('/', (req, res) => {
    res.send('🚀 ওস্তাদ, আপনার নতুন বট টার্মাক্সে চমৎকারভাবে সচল আছে!');
});
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

let fbAppState;
try {
    fbAppState = JSON.parse(fs.readFileSync('appstate.json', 'utf8'));
    console.log("✅ appstate.json ফাইল থেকে সফলভাবে কুকি লোড হয়েছে!");
} catch (err) {
    console.error("❌ appstate.json ফাইলটি পাওয়া যায়নি!", err);
    process.exit(1);
}

login({ appState: fbAppState }, (err, api) => {
    if (err) {
        console.error("❌ লগইন করতে সমস্যা হয়েছে ওস্তাদ!", err);
        return;
    }

    console.log("✅ ফেসবুক অ্যাকাউন্টে সফলভাবে লগইন হয়েছে ওস্তাদ!");

    api.setOptions({ 
        listenEvents: true, 
        selfListen: false
    });

    console.log("📡 বটের লিসেনার অন করা হয়েছে, মেসেজের অপেক্ষা করা হচ্ছে...");

    api.listenMqtt((err, message) => {
        if (err) return console.error(err);

        if (message.body) {
            const incomingMessage = message.body.toLowerCase().trim();
            const threadId = message.threadID;

            if (message.senderID !== api.getCurrentUserID()) {
                console.log(`💬 নতুন মেসেজ: "${message.body}"`);

                if (incomingMessage.includes("হাই") || incomingMessage.includes("hi") || incomingMessage.includes("love")) {
                    const replyMessage = "HI ❤️";

                    api.sendMessage(replyMessage, threadId, (err) => {
                        if (err) console.error("❌ রিপ্লাই যায়নি:", err);
                        else console.log("✅ সফলভাবে HI পাঠানো হয়েছে!");
                    });
                }
            }
        }
    });
});
