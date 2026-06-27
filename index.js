const express = require('express');
const login = require('fb-chat-api'); // আপনার সেই আগের সফল লাইব্রেরি
const fs = require('fs');
const app = express();

const PORT = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('🚀 ওস্তাদ, আপনার পুরনো সফল লাইব্রেরি দিয়ে ইনবক্স স্ক্র্যাপার সচল!'));
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
    if (err) return console.error("❌ লগইন করতে সমস্যা হয়েছে ওস্তাদ!", err);

    console.log("✅ ফেসবুক অ্যাকাউন্টে সফলভাবে লগইন হয়েছে ওস্তাদ!");
    
    // MQTT লিসেনারের ঝামেলা এড়াতে এটা বন্ধ রাখলাম
    api.setOptions({ listenEvents: false, selfListen: false });

    console.log("📡 প্রতি ৩ সেকেন্ড পর পর ইনবক্স স্ক্র্যাপ করে মেসেজ খোঁজা হচ্ছে...");

    // 🎯 প্রতি ৩ সেকেন্ড পর পর ইনবক্স স্ক্র্যাপ করার মেইন ইঞ্জিন
    setInterval(() => {
        api.getThreadList(5, null, ["INBOX"], (err, list) => {
            if (err || !list) return;

            list.forEach(thread => {
                // চ্যাটে কোনো আনরিড মেসেজ থাকলে স্ক্র্যাপার একটিভ হবে
                if (thread.unreadCount > 0) {
                    const threadId = thread.threadID;

                    // সর্বশেষ মেসেজটি স্ক্র্যাপ করে আনা
                    api.getThreadHistory(threadId, 1, null, (err, history) => {
                        if (err || !history || history.length === 0) return;

                        const lastMessage = history[0];

                        // মেসেজটি যদি অন্য কেউ দিয়ে থাকে
                        if (lastMessage.senderID !== api.getCurrentUserID()) {
                            console.log(`📩 মেসেজ স্ক্র্যাপ হয়েছে: "${lastMessage.body}"`);

                            const replyMessage = "HI ❤️";

                            // অটো-রিপ্লাই পাঠানো
                            api.sendMessage(replyMessage, threadId, (err) => {
                                if (!err) {
                                    console.log(`✅ সফলভাবে "${replyMessage}" পাঠানো হয়েছে ওস্তাদ!`);
                                    api.markAsRead(threadId, (err) => {});
                                }
                            });
                        }
                    });
                }
            });
        });
    }, 3000);
});
