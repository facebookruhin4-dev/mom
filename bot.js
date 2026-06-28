
// bot.js
// এখানে বটকে নির্দিষ্ট নামে ডাকলে সে কী কী স্পেশাল জবাব দিবে, সেগুলো রাখা হলো ওস্তাদ

const botReplies = [
    "আহ মিয়া কী জন্য ডাকছেন বলেন! 🫤",
    "কে ডাকে আমারে? তর gf আমার 🤣👸",
    "বট বট করচ কে কী হইচে বা***🤦‍♀️🤷‍♀️👀",
    "তর নানীকে I Love YOU 🤭🎉🗿",
    "👀 তকে কী করব 😨 বট বট করচ 😿💨"
    "I Labu👀🔪🤭"
"এত পেচাল করিচ নাতো সর প্রেম করতে দে 🫦🤦‍♀️"
"আবার কী হলো 🤔🫣"
"তদের মতো কী সিংগ্যাল আমি রে এত সময় নাই সর 🌝🔥"
"সব কতা শুনব আগে প্রেম করাই দে 🙌🤝"
"নেও নাম্বার 999 দিলাম কল দে আর ডিস্টাব করিস না বাবা 😘🤭🤣"
" এই দেক সিংগ্যাল আরেকটা নক করচে 🥶🤒"

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
