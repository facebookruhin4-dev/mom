// ban.js
// এখানে আপনার ইচ্ছামতো যত খুশি খারাপ শব্দ বা গালি যোগ করতে পারবেন ওস্তাদ
const bannedWords = [
    "xxx", 
    "sex", 
    "বাল", 
    "চুদ", 
    "বগা", 
    "সেক্স", 
    "এক্সক্সক্স"
    "মাদার"
    "মাদারকার্ড"
"তরমারেচুদি"
"🥒"
"🍆"
"🍌🫦"
"🖕"
"বান্দীরপুয়া"
"বান্দীরফুয়া"
"mc"
"mg"
"পেল"
"কনডম"
"condom"
"চুর"
"মগা"
"শাওয়া"



];

/**
 * মেসেজে কোনো নিষিদ্ধ শব্দ আছে কিনা তা চেক করার ফাংশন
 * @param {string} text 
 * @returns {boolean}
 */
function hasBannedWord(text) {
    if (!text) return false;
    
    // মেসেজটিকে ছোট হাতের অক্ষরে কনভার্ট করে চেক করা (যাতে Sex বা SEX দিলেও ধরে ফেলে)
    const lowerText = text.toLowerCase();
    
    // কোনো একটি নিষিদ্ধ শব্দ মেসেজের ভেতর থাকলেই true রিটার্ন করবে
    return bannedWords.some(word => lowerText.includes(word));
}

module.exports = {
    bannedWords,
    hasBannedWord
};

