
// islamic.js
// বাংলাদেশ সময় অনুযায়ী নামাজ, সকাল, সন্ধ্যা এবং জুম্মার স্পেশাল স্টাইলিশ রিমাইন্ডার

// নামাজের আনুমানিক স্থায়ী সময়সূচী (বাংলাদেশ সময়)
const prayerTimes = {
    "ফজর": { hour: 4, minute: 45 },
    "যোহর": { hour: 13, minute: 15 },
    "আছর": { hour: 16, minute: 30 },
    "মাগরিব": { hour: 18, minute: 45 },
    "এশা": { hour: 20, minute: 15 }
};

// ⏰ অন্যান্য রুটিন টাইম
const dailyRoutines = {
    "সকাল": { hour: 7, minute: 30 }, // গুড মর্নিং ও নাস্তার সময়
    "সন্ধ্যা": { hour: 19, minute: 0 } // পড়তে বসার সময়
};

// একবার মেসেজ চলে গেলে ওই মিনিটে যেন বারবার মেসেজ না যায়, তার ট্র্যাকার
let lastNotifiedEvent = "";
let lastNotifiedMinute = -1;

/**
 * বাংলাদেশ সময় (GMT+6) বের করার ফাংশন
 */
function getBangladeshTime() {
    const localTime = new Date();
    return new Date(localTime.toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
}

/**
 * সব ধরনের অটোমেটিক স্টাইলিশ অ্যালার্ট চেক ও সেন্ড করার মেইন ফাংশন
 */
function checkAndSendPrayerAlert(api, threadId) {
    const bdTime = getBangladeshTime();
    const currentHour = bdTime.getHours();
    const currentMinute = bdTime.getMinutes();
    const currentDay = bdTime.getDay(); // ০ = রবিবার, ৫ = শুক্রবার

    // সটিক তারিখ ও বার ফরম্যাট
    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    const dateString = bdTime.toLocaleDateString('bn-BD', dateOptions);
    const dayName = bdTime.toLocaleDateString('bn-BD', { weekday: 'long' });
    const timeString = bdTime.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', hour12: true });

    let finalMessage = "";
    let eventKey = "";

    // 🕋 ১. নামাজের ওয়াক্ত চেক
    for (const [prayerName, time] of Object.entries(prayerTimes)) {
        if (currentHour === time.hour && currentMinute === time.minute) {
            eventKey = `prayer_${prayerName}`;
            finalMessage = `╭━━📢 【 𝑷𝒓𝒂𝒚𝒆𝒓 𝑨𝒍𝒆𝒓𝒕 】 📢━━╮\n` +
                           `┃\n` +
                           `┃  🕋 𝑷𝒂𝒗𝒊𝒕𝒓𝒂 **${prayerName}** 𝑵𝒂𝒎𝒂𝒋𝒆𝒓 𝑺𝒐𝒎𝒐𝒚\n` +
                           `┃  ⏰ 𝑻𝒊𝒎𝒆: ${timeString} (𝑩𝑫)\n` +
                           `┃  📅 𝑫𝒂𝒕𝒆: ${dateString} [${dayName}]\n` +
                           `┃\n` +
                           `┃  ❝ নামাজ বেহেশতের চাবি। ❞ ✨\n` +
                           `┃  চিল তো পরেও হবে, আগে নামাজ ওস্তাদ! ❤️\n` +
                           `┃\n` +
                           `╰━━━━━━━━━━━━━━━━━━━━━━━╯`;
            break;
        }
    }

    // ☀️ ২. সকালের গুড মর্নিং চেক (যদি নামাজ না মিলে)
    if (!finalMessage && currentHour === dailyRoutines.সকাল.hour && currentMinute === dailyRoutines.সকাল.minute) {
        eventKey = "routine_morning";
        
        // 🕌 জুম্মার দিন (শুক্রবার = 5) হলে জুম্মা মোবারক অ্যাড হবে সকালের মেসেজে
        if (currentDay === 5) {
            finalMessage = `╭━━ ✨ 【 𝑱𝒖𝒎𝒎𝒂𝒉 𝑴𝒐𝒃𝒂𝒓𝒂𝒌 】 ✨ ━━╮\n` +
                           `┃\n` +
                           `┃  🌹 𝑮𝒐𝒐𝒅 𝑴𝒐𝒓𝒏𝒊𝒏𝒈 & 𝑱𝒖𝒎𝒎𝒂𝒉 𝑴𝒐𝒃𝒂𝒓𝒂𝒌 🌹\n` +
                           `┃  ⏰ 𝑻𝒊𝒎𝒆: ${timeString}\n` +
                           `┃\n` +
                           `┃  আজ পবিত্র জুম্মার দিন! 🥰\n` +
                           `┃  সবাই ঝটপট নাস্তা করে নাও ওস্তাদ 🍳☕\n` +
                           `┃  জুম্মার নামাজ ও দরুদ পড়ার প্রস্তুতি নাও! 📿\n` +
                           `┃\n` +
                           `╰━━━━━━━━━━━━━━━━━━━━━━━╯`;
        } else {
            finalMessage = `╭━━ ☀️ 【 𝑮𝒐𝒐𝒅 𝑴𝒐𝒓𝒏𝒊𝒏𝒈 】 ☀️ ━━╮\n` +
                           `┃\n` +
                           `┃  🌻 𝑺𝒖𝒑𝒓𝒂𝒃𝒉𝒂𝒕 𝑶𝒔𝒕𝒂𝒅! 🌻\n` +
                           `┃  ⏰ 𝑻𝒊𝒎𝒆: ${timeString}\n` +
                           `┃\n` +
                           `┃  নতুন দিনের শুভেচ্ছা! 🥳\n` +
                           `┃  সবাই চটপট নাস্তা করে নাও! 🍞🥚\n` +
                           `┃  আজকের দিনটি আগুন কাটুক! 🔥💪\n` +
                           `┃\n` +
                           `╰━━━━━━━━━━━━━━━━━━━━━━━╯`;
        }
    }

    // 🌙 ৩. সন্ধ্যার পড়তে বসার রিমাইন্ডার চেক
    if (!finalMessage && currentHour === dailyRoutines.সন্ধ্যা.hour && currentMinute === dailyRoutines.সন্ধ্যা.minute) {
        eventKey = "routine_evening";
        finalMessage = `╭━━ 📚 【 𝑺𝒕𝒖𝒅𝒚 𝑻𝒊𝒎𝒆 】 📚 ━━╮\n` +
                       `┃\n` +
                       `┃  🌆 𝑮𝒐𝒐𝒅 𝑬𝒗𝒆𝒏𝒊𝒏𝒈 𝑶𝒔𝒕𝒂𝒅! 🌆\n` +
                       `┃  ⏰ 𝑻𝒊𝒎𝒆: ${timeString}\n` +
                       `┃\n` +
                       `┃  সন্ধ্যা হয়ে গেছে! 🌙\n` +
                       `┃  আড্ডা-খেলাধুলা বন্ধ করো সবাই! ❌\n` +
                       `┃  চুপচাপ পড়তে বসে যাও এখন! 📖✍️😏\n` +
                       `┃\n` +
                       `╰━━━━━━━━━━━━━━━━━━━━━━━╯`;
    }

    // 📨 মেসেজ পাঠানোর ফাইনাল প্রসেস
    if (finalMessage && eventKey) {
        if (lastNotifiedEvent === eventKey && lastNotifiedMinute === currentMinute) {
            return; // একই মিনিটে দুইবার মেসেজ যাবে না
        }

        api.sendMessage(finalMessage, threadId, (err) => {
            if (!err) {
                lastNotifiedEvent = eventKey;
                lastNotifiedMinute = currentMinute;
                console.log(`🎯 সফলভাবে পুশ করা হয়েছে: ${eventKey}`);
            } else {
                console.error("অটো মেসেজ পাঠাতে সমস্যা:", err);
            }
        });
    }
}

module.exports = {
    getBangladeshTime,
    checkAndSendPrayerAlert
};
