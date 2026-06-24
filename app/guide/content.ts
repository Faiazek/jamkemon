// Long-form copy for the /guide page, in both languages.
//
// The short app-chrome strings live in app/i18n/messages.ts (the t() system).
// This page is paragraph-heavy, so its content lives here as a typed structure
// instead — one object per locale, same shape, side by side for easy editing.
// Category and severity *labels* are NOT duplicated here; the page pulls those
// from messages.ts via t() so the legend always matches the rest of the app.

import type { Category } from "../../lib/reports";
import type { Locale } from "../i18n/messages";

type Item = { emoji: string; title: string; body: string };
type Feature = { emoji: string; title: string; body: string };
type QA = { q: string; a: string };

export type GuideContent = {
  nav: { guide: string; backToMap: string };
  hero: {
    kicker: string;
    title: string;
    subtitle: string;
    ctaMap: string;
    ctaReport: string;
  };
  steps: { title: string; subtitle: string; items: Item[] };
  legend: {
    title: string;
    subtitle: string;
    // A short, plain-language description for each pin colour.
    catDesc: Record<Category, string>;
    severityTitle: string;
    severityNote: string;
  };
  tips: { title: string; subtitle: string; items: Item[] };
  features: { title: string; subtitle: string; items: Feature[] };
  trust: { title: string; body: string; points: string[]; honest: string };
  privacy: { title: string; body: string; points: string[] };
  quality: { title: string; body: string; points: string[]; honest: string };
  faq: { title: string; items: QA[] };
  outro: { title: string; body: string; ctaMap: string; ctaReport: string };
};

const en: GuideContent = {
  nav: { guide: "Guide", backToMap: "Back to map" },
  hero: {
    kicker: "How it works",
    title: "Get the most out of JamKemon",
    subtitle:
      "JamKemon turns what people see on Dhaka's roads into one live, glanceable map — no Facebook group, no account, no waiting. Here's how to read it, report well, and trust what you see.",
    ctaMap: "Open the live map",
    ctaReport: "Report something",
  },
  steps: {
    title: "Four steps, start to finish",
    subtitle: "The whole loop takes seconds, and the map cleans up after itself.",
    items: [
      {
        emoji: "👀",
        title: "See what's live",
        body: "Open the map and you'll see colour-coded pins for what people are reporting right now — jams, waterlogging, accidents, blocked roads and more.",
      },
      {
        emoji: "✍️",
        title: "Report what you see",
        body: "Tap Report, drop a pin where it's happening, pick a type and how bad it is, and submit. A line of detail or a photo helps, but isn't required.",
      },
      {
        emoji: "✅",
        title: "A person checks it",
        body: "Every report is reviewed by a human before it reaches the public map. That single gate is what keeps spam, jokes and stale posts off the map.",
      },
      {
        emoji: "⏱️",
        title: "It clears on its own",
        body: "Each report has a lifespan that matches reality — a jam fades fast, a road closure lasts longer. Nothing lingers, so the map always means \"now\".",
      },
    ],
  },
  legend: {
    title: "Reading the map",
    subtitle:
      "Each pin is one report. Its colour is the type of problem; the badge tells you how serious it is.",
    catDesc: {
      jam: "Slow or stopped traffic — the everyday Dhaka gridlock.",
      accident: "A crash or breakdown blocking part of the road.",
      waterlogging: "Flooded or standing water making a road hard to pass.",
      roadblock: "A road closed or blocked — barriers, VIP movement, repairs.",
      protest: "A march, procession or gathering affecting traffic.",
      construction: "Roadworks or digging narrowing the road.",
      other: "Anything road-related that doesn't fit the buckets above.",
    },
    severityTitle: "How bad is it?",
    severityNote:
      "Light, Moderate or Severe — a quick read on whether you'll lose a minute or half an hour. Severe pins glow brighter so they stand out at a glance.",
  },
  tips: {
    title: "Report like a local",
    subtitle: "A few habits that make your reports far more useful to everyone else.",
    items: [
      {
        emoji: "📍",
        title: "Pin the exact spot",
        body: "Drag the pin to where the problem actually is — the junction, not the street you're parked on. Precise pins are the ones people trust.",
      },
      {
        emoji: "🏷️",
        title: "Match the type and severity",
        body: "Picking the right category and how bad it is lets others judge in a glance without reading a word.",
      },
      {
        emoji: "💬",
        title: "Add one useful line",
        body: "\"Truck broke down, one lane open\" beats a bare pin. A photo helps even more when you can safely take one.",
      },
      {
        emoji: "🕒",
        title: "Saw it earlier? Still report it",
        body: "No signal at the time? Report it later and set when you saw it. We back-date it so it expires correctly instead of looking fresher than it is.",
      },
      {
        emoji: "🔄",
        title: "Keep others' reports honest",
        body: "Tap \"Still there?\" or \"It's cleared\" on a pin you pass. These small taps are how the map stays true between official reviews.",
      },
    ],
  },
  features: {
    title: "Beyond the map",
    subtitle: "A few things JamKemon does that a Facebook group never could.",
    items: [
      {
        emoji: "⏳",
        title: "Time filters",
        body: "Switch between Live, last 1 hour and last 3 hours to see only what's relevant to your trip right now.",
      },
      {
        emoji: "🧭",
        title: "Directions with reports",
        body: "Plan a route and JamKemon shows the reports sitting on it — so you find out about the jam before you're stuck in it.",
      },
      {
        emoji: "🔎",
        title: "Search any place",
        body: "Jump to a restaurant, road or area to check conditions there before you leave.",
      },
      {
        emoji: "🔗",
        title: "Shareable links",
        body: "Share any report as a clean link with a map preview — far better than screenshotting a Facebook post.",
      },
    ],
  },
  trust: {
    title: "Why you can trust the map",
    body: "The hard part of crowd-sourced traffic isn't drawing pins — it's keeping out the fake, the stale and the noise. JamKemon is built around that from the ground up.",
    points: [
      "A human reviews every report before it goes public. Nothing appears on the map automatically.",
      "Reports expire on their own, sized to the problem — so the map reflects now, not three hours ago.",
      "Near-duplicate reports of the same thing are merged, and the freshest sighting wins.",
      "The community keeps it honest with \"still there\" and \"cleared\" taps between reviews.",
    ],
    honest:
      "We won't pretend it's perfect — it's people, not sensors. But a real person stands between every report and the map you see.",
  },
  privacy: {
    title: "Your privacy",
    body: "JamKemon is built to be useful without knowing who you are. Reporting takes nothing but a tap.",
    points: [
      "No account, no phone number, no Facebook login — ever, to report or to browse.",
      "We don't track who you are or follow your movements. There's no profile behind your reports.",
      "The only location stored is the pin you choose to drop — not your live position, and only when you report.",
      "Photos are optional and entirely your call. Skip them and your report still works fine.",
    ],
  },
  quality: {
    title: "About the data",
    body: "JamKemon's reports come from people on the road, not traffic sensors or a prediction model. That shapes both what it's great at and where it's thin.",
    points: [
      "It explains why a road is red — a crash, flooding, a procession — instead of just colouring it.",
      "It's often faster than model-based maps, because a person reports the moment it happens.",
      "Coverage follows people: busy areas fill in quickly, quiet ones may have fewer pins.",
      "Quality is kept up by the same three things — human review, self-expiry, and merging duplicates.",
    ],
    honest:
      "Think of it as \"where people are reporting problems right now,\" not sensor-grade speed data. An empty area means no one has reported yet — not necessarily a clear road.",
  },
  faq: {
    title: "Quick answers",
    items: [
      {
        q: "Do I need an account?",
        a: "No. You can browse and report completely anonymously — no sign-up, no login.",
      },
      {
        q: "Is it free?",
        a: "Yes, completely. JamKemon is a community project for Dhaka, free to use.",
      },
      {
        q: "Why is my area empty?",
        a: "An empty map just means nobody has reported there yet. Be the first — your report helps the next person.",
      },
      {
        q: "How is this different from Google Maps?",
        a: "Google shows model-predicted colours that can lag reality and never say why. JamKemon shows live, human reports that explain what's actually going on.",
      },
      {
        q: "When does a report disappear?",
        a: "Automatically, once its lifespan passes — shorter for fast-moving jams, longer for things like road closures. An admin can also clear or extend one.",
      },
    ],
  },
  outro: {
    title: "Ready when you are",
    body: "Open the map to see what's live, and add a report next time you're stuck — every pin makes the next person's trip a little easier.",
    ctaMap: "Open the live map",
    ctaReport: "Report something",
  },
};

const bn: GuideContent = {
  nav: { guide: "গাইড", backToMap: "ম্যাপে ফিরে যান" },
  hero: {
    kicker: "যেভাবে কাজ করে",
    title: "জ্যাম কেমন পুরোপুরি কাজে লাগান",
    subtitle:
      "ঢাকার রাস্তায় মানুষ যা দেখছে, জ্যাম কেমন তা একটিই লাইভ ম্যাপে এনে দেয় — কোনো ফেসবুক গ্রুপ নয়, অ্যাকাউন্ট নয়, অপেক্ষাও নয়। কীভাবে ম্যাপ পড়বেন, ভালোভাবে রিপোর্ট করবেন আর যা দেখছেন তাতে ভরসা রাখবেন — সবই এখানে।",
    ctaMap: "লাইভ ম্যাপ খুলুন",
    ctaReport: "রিপোর্ট করুন",
  },
  steps: {
    title: "চার ধাপেই পুরো কাজ",
    subtitle: "পুরো কাজটা কয়েক সেকেন্ডের, আর ম্যাপ নিজে থেকেই পরিষ্কার থাকে।",
    items: [
      {
        emoji: "👀",
        title: "লাইভে কী আছে দেখুন",
        body: "ম্যাপ খুললেই রঙিন পিনে দেখবেন এই মুহূর্তে মানুষ কী রিপোর্ট করছে — যানজট, জলাবদ্ধতা, দুর্ঘটনা, বন্ধ রাস্তাসহ আরও অনেক কিছু।",
      },
      {
        emoji: "✍️",
        title: "যা দেখছেন রিপোর্ট করুন",
        body: "‘রিপোর্ট’-এ চাপ দিন, ঠিক জায়গায় পিন বসান, ধরন আর কতটা খারাপ বেছে নিয়ে জমা দিন। দু-এক লাইন বা ছবি দিলে ভালো, তবে বাধ্যতামূলক নয়।",
      },
      {
        emoji: "✅",
        title: "মানুষ যাচাই করে",
        body: "ম্যাপে আসার আগে প্রতিটি রিপোর্ট একজন মানুষ যাচাই করেন। এই একটিমাত্র ধাপই স্প্যাম, ফালতু আর পুরোনো পোস্ট ম্যাপ থেকে দূরে রাখে।",
      },
      {
        emoji: "⏱️",
        title: "নিজে থেকেই মুছে যায়",
        body: "প্রতিটি রিপোর্টের আয়ু ঠিক হয় বাস্তব অনুযায়ী — যানজট দ্রুত মিলিয়ে যায়, রাস্তা বন্ধ থাকে বেশিক্ষণ। কিছুই জমে থাকে না, তাই ম্যাপ মানে সবসময় ‘এখন’।",
      },
    ],
  },
  legend: {
    title: "ম্যাপ পড়ার নিয়ম",
    subtitle: "প্রতিটি পিন একটি করে রিপোর্ট। রঙ বলে সমস্যার ধরন, আর ব্যাজ বলে কতটা গুরুতর।",
    catDesc: {
      jam: "ধীর বা থেমে থাকা যান — ঢাকার চিরচেনা জট।",
      accident: "দুর্ঘটনা বা গাড়ি নষ্ট হয়ে রাস্তার একাংশ বন্ধ।",
      waterlogging: "জমে থাকা পানিতে রাস্তা চলাচলের অযোগ্য।",
      roadblock: "রাস্তা বন্ধ — ব্যারিকেড, ভিআইপি চলাচল বা মেরামত।",
      protest: "মিছিল, শোভাযাত্রা বা জমায়েত, যা যান চলাচলে প্রভাব ফেলছে।",
      construction: "নির্মাণ বা খোঁড়াখুঁড়িতে সরু হয়ে যাওয়া রাস্তা।",
      other: "উপরের ধরনগুলোতে পড়ে না এমন রাস্তা-সংক্রান্ত যেকোনো কিছু।",
    },
    severityTitle: "কতটা খারাপ?",
    severityNote:
      "হালকা, মাঝারি নাকি তীব্র — এক নজরেই বোঝা যায় এক মিনিট লাগবে নাকি আধ ঘণ্টা। তীব্র পিন উজ্জ্বল আলোয় আলাদা করে চোখে পড়ে।",
  },
  tips: {
    title: "পাকা হাতে রিপোর্ট করুন",
    subtitle: "এই কয়েকটি অভ্যাস আপনার রিপোর্টকে সবার জন্য আরও কাজের করে তুলবে।",
    items: [
      {
        emoji: "📍",
        title: "ঠিক জায়গায় পিন দিন",
        body: "যেখানে সমস্যা সেখানেই পিন টেনে আনুন — মোড়টিতে, আপনি যে রাস্তায় দাঁড়িয়ে সেখানে নয়। নিখুঁত পিনকেই মানুষ বিশ্বাস করে।",
      },
      {
        emoji: "🏷️",
        title: "ঠিক ধরন আর মাত্রা বেছে দিন",
        body: "সঠিক ধরন আর কতটা খারাপ বেছে দিলে অন্যরা একটা কথাও না পড়ে এক নজরেই বুঝে নিতে পারে।",
      },
      {
        emoji: "💬",
        title: "দু-এক কথা লিখে দিন",
        body: "‘ট্রাক নষ্ট, এক লেন খোলা’ — খালি পিনের চেয়ে অনেক ভালো। নিরাপদে পারলে একটা ছবি আরও বেশি সাহায্য করে।",
      },
      {
        emoji: "🕒",
        title: "আগে দেখেছেন? তবুও জানান",
        body: "তখন নেট ছিল না? পরে রিপোর্ট করে কখন দেখেছেন তা বেছে দিন। আমরা সময়টা পিছিয়ে দিই, যাতে এটি ঠিক সময়েই মুছে যায়, কেউ একে নতুন বলে ভুল না করে।",
      },
      {
        emoji: "🔄",
        title: "অন্যের রিপোর্ট সঠিক রাখুন",
        body: "পথে যে পিন চোখে পড়ে তাতে ‘এখনও আছে?’ বা ‘পরিষ্কার হয়েছে’ চাপুন। যাচাইয়ের ফাঁকে এই ছোট ছোট চাপই ম্যাপকে সত্য রাখে।",
      },
    ],
  },
  features: {
    title: "শুধু ম্যাপ নয়",
    subtitle: "এমন কিছু সুবিধা, যা কোনো ফেসবুক গ্রুপে পাবেন না।",
    items: [
      {
        emoji: "⏳",
        title: "সময় ফিল্টার",
        body: "লাইভ, শেষ ১ ঘণ্টা বা ৩ ঘণ্টা — এর মধ্যে বেছে নিয়ে কেবল এখনকার দরকারি রিপোর্টগুলোই দেখুন।",
      },
      {
        emoji: "🧭",
        title: "রিপোর্টসহ দিকনির্দেশ",
        body: "রুট ঠিক করলে জ্যাম কেমন সেই পথের রিপোর্টগুলো দেখায় — জটে আটকা পড়ার আগেই জেনে যান।",
      },
      {
        emoji: "🔎",
        title: "যেকোনো জায়গা খুঁজুন",
        body: "বের হওয়ার আগে রেস্তোরাঁ, রাস্তা বা এলাকা খুঁজে সেখানকার অবস্থা দেখে নিন।",
      },
      {
        emoji: "🔗",
        title: "শেয়ারযোগ্য লিংক",
        body: "যেকোনো রিপোর্ট ম্যাপ-প্রিভিউসহ পরিষ্কার লিংক হিসেবে শেয়ার করুন — ফেসবুক পোস্টের স্ক্রিনশটের চেয়ে অনেক ভালো।",
      },
    ],
  },
  trust: {
    title: "ম্যাপে কেন ভরসা রাখবেন",
    body: "মানুষের পাঠানো রিপোর্ট দিয়ে ট্রাফিক দেখানোর আসল কঠিন কাজটা পিন বসানো নয় — কঠিন হলো ভুয়া, পুরোনো আর অপ্রয়োজনীয় তথ্য ঠেকানো। জ্যাম কেমন গোড়া থেকেই এই কথা মাথায় রেখে বানানো।",
    points: [
      "ম্যাপে আসার আগে প্রতিটি রিপোর্ট একজন মানুষ যাচাই করেন। কিছুই নিজে থেকে ম্যাপে আসে না।",
      "প্রতিটি রিপোর্ট নিজে থেকেই মুছে যায় — সমস্যা অনুযায়ী কম-বেশি সময় পরে — তাই ম্যাপ সবসময় এখনকার, তিন ঘণ্টা আগের নয়।",
      "একই ঘটনার কাছাকাছি রিপোর্টগুলো একত্র হয়, আর সবচেয়ে নতুন তথ্যটি টিকে থাকে।",
      "যাচাইয়ের ফাঁকে কমিউনিটি ‘এখনও আছে’ আর ‘পরিষ্কার’ চাপ দিয়ে সত্যটা ধরে রাখে।",
    ],
    honest:
      "নিখুঁত বলে দাবি করব না — এটা মানুষ, সেন্সর নয়। তবে প্রতিটি রিপোর্ট আর আপনার দেখা ম্যাপের মাঝে একজন বাস্তব মানুষ থাকেন।",
  },
  privacy: {
    title: "আপনার গোপনীয়তা",
    body: "আপনি কে তা না জেনেই জ্যাম কেমন কাজে লাগে। রিপোর্ট করতে শুধু একটা চাপই যথেষ্ট।",
    points: [
      "কোনো অ্যাকাউন্ট নয়, ফোন নম্বর নয়, ফেসবুক লগইন নয় — দেখতে বা রিপোর্ট করতে কখনোই নয়।",
      "আপনি কে তা আমরা ট্র্যাক করি না, আপনার চলাফেরাও অনুসরণ করি না। রিপোর্টের পেছনে কোনো প্রোফাইল নেই।",
      "শুধু আপনার বসানো পিনটির অবস্থান রাখা হয় — আপনার লাইভ অবস্থান নয়, আর কেবল যখন রিপোর্ট করেন তখনই।",
      "ছবি দেওয়া ঐচ্ছিক, পুরোপুরি আপনার ইচ্ছা। না দিলেও রিপোর্ট ঠিকঠাক কাজ করে।",
    ],
  },
  quality: {
    title: "ডেটা সম্পর্কে",
    body: "জ্যাম কেমন-এর রিপোর্ট আসে রাস্তায় থাকা মানুষের কাছ থেকে — কোনো ট্রাফিক সেন্সর বা অনুমাননির্ভর মডেল থেকে নয়। এ কারণেই এটি কোথাও দুর্দান্ত, আবার কোথাও কিছুটা দুর্বল।",
    points: [
      "রাস্তা কেন লাল, তা বুঝিয়ে দেয় — দুর্ঘটনা, জলাবদ্ধতা কিংবা মিছিল — শুধু রঙ বদলে দিয়েই থেমে থাকে না।",
      "মডেলভিত্তিক ম্যাপের চেয়ে প্রায়ই দ্রুত, কারণ ঘটনার মুহূর্তেই একজন মানুষ রিপোর্ট করেন।",
      "কোন এলাকায় কেমন তথ্য মিলবে তা মানুষের ওপর নির্ভর করে — ব্যস্ত এলাকা দ্রুত ভরে ওঠে, শান্ত এলাকায় পিন কম থাকতে পারে।",
      "মান ধরে রাখে সেই তিনটি জিনিসই — মানুষের যাচাই, নিজে থেকে মুছে যাওয়া আর একই রিপোর্ট এক করে ফেলা।",
    ],
    honest:
      "এভাবে দেখুন — এটি বলে ‘এই মুহূর্তে মানুষ কোথায় সমস্যা জানাচ্ছে’, সেন্সরে মাপা গতির হিসাব নয়। কোনো এলাকা ফাঁকা মানে সেখানে এখনও কেউ কিছু জানায়নি, রাস্তা পরিষ্কার বলে নয়।",
  },
  faq: {
    title: "সংক্ষিপ্ত উত্তর",
    items: [
      {
        q: "অ্যাকাউন্ট লাগবে?",
        a: "না। পুরোপুরি নাম-পরিচয় ছাড়াই দেখতে ও রিপোর্ট করতে পারবেন — কোনো সাইন-আপ বা লগইন নেই।",
      },
      {
        q: "এটা কি ফ্রি?",
        a: "হ্যাঁ, পুরোপুরি। জ্যাম কেমন ঢাকার জন্য একটি কমিউনিটি উদ্যোগ, ব্যবহার করতে কোনো খরচ নেই।",
      },
      {
        q: "আমার এলাকা ফাঁকা কেন?",
        a: "ফাঁকা ম্যাপ মানে কেবল সেখানে এখনও কেউ রিপোর্ট করেনি। প্রথমজন হোন — আপনার রিপোর্ট পরের জনকে সাহায্য করবে।",
      },
      {
        q: "গুগল ম্যাপস থেকে এটা আলাদা কীভাবে?",
        a: "গুগল মডেল দিয়ে অনুমান করা রঙ দেখায়, যা বাস্তবের চেয়ে পিছিয়ে থাকতে পারে আর কারণ বলে না। জ্যাম কেমন দেখায় মানুষের পাঠানো লাইভ রিপোর্ট, যা আসলে কী ঘটছে তা বলে দেয়।",
      },
      {
        q: "রিপোর্ট কখন মুছে যায়?",
        a: "আয়ু ফুরোলে নিজে থেকেই — দ্রুত বদলানো জটের জন্য কম সময়, রাস্তা বন্ধের মতো বিষয়ে বেশি। অ্যাডমিনও আগে মুছতে বা সময় বাড়াতে পারেন।",
      },
    ],
  },
  outro: {
    title: "চলুন, শুরু করা যাক",
    body: "লাইভ যা আছে দেখতে ম্যাপ খুলুন, আর পরেরবার আটকে গেলে একটা রিপোর্ট দিন — প্রতিটি পিন পরের জনের যাত্রা একটু সহজ করে।",
    ctaMap: "লাইভ ম্যাপ খুলুন",
    ctaReport: "রিপোর্ট করুন",
  },
};

export const guideContent: Record<Locale, GuideContent> = { en, bn };
