// react.js
// এখানে বিভিন্ন ধরনের শব্দের ওপর ভিত্তি করে কোন রিয়েক্ট যাবে তা সেট করা আছে

// মজার শব্দ এবং তার জন্য হা হা রিয়েক্ট
const funnyWords = ["হাহা", "haha", "মজা", "fun", "হাসি", "lol", "xd", "🤣", "😂"];

// রাগের শব্দ এবং তার জন্য রাগের রিয়েক্ট
const angryWords = ["রাগ", "angry", "খেলব না", "টাইম ওভার", "খেলা চলবে", "শালার", "কুত্তা", "😡", "🤬"];

// সাধারণ ভালো মেসেজের জন্য লাভ বা লাইক রিয়েক্ট
const loveWords = ["ধন্যবাদ", "ওস্তাদ", "অন ফায়ার", "ওমর", "ভালোবাসা", "love", "🔥", "❤️", "🥰"];

/**
 * মেসেজের ভেতরের লেখা দেখে পারফেক্ট ইমোজি সিলেক্ট করার ফাংশন
 * @param {string} text 
 * @returns {string|null}
 */
function getReactionEmoji(text) {
    if (!text) return null;
    const lowerText = text.toLowerCase();

    // ১. মজার মেসেজ হলে হা হা (😆) রিয়েক্ট
    if (funnyWords.some(word => lowerText.includes(word))) {
        return "😆"; 
    }

    // ②. রাগের মেসেজ হলে রাগ (😡) রিয়েক্ট
    if (angryWords.some(word => lowerText.includes(word))) {
        return "😡";
    }

    // ৩. প্রশংসা বা ভালো মেসেজ হলে লাভ (❤️) রিয়েক্ট
    if (loveWords.some(word => lowerText.includes(word))) {
        return "❤️";
    }

    // ৪. উপরে কিছু না মিললে র্যান্ডমলি একটা লাইক বা ওয়াও রিয়েক্ট দেওয়া যেতে পারে (ঐচ্ছিক)
    // যদি চান সব মেসেজেই রিয়েক্ট দিক, তাহলে নিচের লাইনের কমেন্ট তুলে দিতে পারেন
    // return Math.random() > 0.5 ? "👍" : "😮";
    
    return null; 
}

module.exports = {
    getReactionEmoji
};

