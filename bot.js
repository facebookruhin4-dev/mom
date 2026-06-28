
// bot.js
// এখানে বটকে নির্দিষ্ট নামে ডাকলে সে কী কী স্পেশাল জবাব দিবে, সেগুলো রাখা হলো ওস্তাদ

const botReplies = [
    "জ্বী ওস্তাদ, বলেন! আপনার জন্য কী করতে পারি? 🤖🔥",
    "কে ডাকে আমারে? আমি তো অন ফায়ার! 😎💥",
    "হুম শুনছি, গ্রুপে আবার কী ভেজাল লাগলো? 😉",
    "বট হাজির ওস্তাদ! হুকুম করুন। 👑",
    "ডাকার জন্য ধন্যবাদ! চিল মোডে আছি, আপনি বলেন। ❤️✨"
];

/**
 * বটকে ডাকার জন্য নির্দিষ্ট শব্দগুলো চেক করার ফাংশন
 * @param {string} text 
 * @returns {boolean}
 */
function isCallingBot(text) {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    
    // কেউ যদি 'bot', '/bot' বা বাংলা 'বট' লিখে ডাকে
    return lowerText === 'bot' || lowerText === '/bot' || lowerText === 'বট';
}

/**
 * স্পেশাল রেপ্লাই লিস্ট থেকে র্যান্ডমলি একটি জবাব তুলে নেওয়ার ফাংশন
 * @returns {string}
 */
function getBotReply() {
    const randomIndex = Math.floor(Math.random() * botReplies.length);
    return botReplies[randomIndex];
}

module.exports = {
    isCallingBot,
    getBotReply
};
