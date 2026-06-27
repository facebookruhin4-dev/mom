const express = require('express');
const login = require('fb-chat-api');
const fs = require('fs');
const app = express();

const PORT = process.env.PORT || 8080;
app.get('/', (req, res) => {
    res.send('🚀 ওস্তাদ, আপনার আনলিমিটেড HI রিপ্লাই বট রেন্ডারে চমৎকারভাবে সচল আছে!');
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

    api.setOptions({ listenEvents: false, selfListen: false });

    // 🎯 প্রতি ২ সেকেন্ড পর পর ইনবক্স রিফ্রেশ করে মেসেজ পাঠানোর ওস্তাদি লজিক
    setInterval(() => {
        api.getThreadList(10, null, ["INBOX"], (err, list) => {
            if (err || !list) return;

            list.forEach(thread => {
                // চ্যাটে নতুন কোনো আনরিড মেসেজ আসলেই এটি ট্রিপ করবে
                if (thread.unreadCount > 0 && thread.messageCount > 0) {
                    
                    api.getThreadHistory(thread.threadID, 1, null, (err, history) => {
                        if (err || !history || history.length === 0) return;
                        
                        const lastMessage = history[0];
                        
                        // মেসেজটি অন্য কেউ দিলেই সাথে সাথে অ্যাকশনে যাবে
                        if (lastMessage.senderID !== api.getCurrentUserID()) {
                            const threadId = thread.threadID;

                            console.log(`📩 নতুন মেসেজ ডিটেক্ট হয়েছে! (ID: ${threadId})`);

                            // 💬 যেকোনো মেসেজের বিপরীতে ডিরেক্ট "HI" বা ভালোবাসার মেসেজ
                            const replyMessage = "HI ❤️"; 

                            // মেসেজ পাঠিয়ে সাথে সাথে চ্যাটটি Read মার্ক করে দেবে যেন লুপ না হয়
                            api.sendMessage(replyMessage, threadId, (err) => {
                                if (!err) {
                                    console.log(`✅ সফলভাবে "${replyMessage}" পাঠানো হয়েছে!`);
                                    api.markAsRead(threadId, (err) => {});
                                }
                            });
                        }
                    });
                }
            });
        });
    }, 2000); // প্রতি ২ সেকেন্ড পর পর রিফ্রেশ নিয়ে চেক করবে
});
