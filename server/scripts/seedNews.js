/* eslint-disable no-console */
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const NewsArticle = require("../models/NewsArticle");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const seedArticles = [
  {
    title: "New Club Signing",
    slug: "new-club-signing",
    category: "club",
    summary: "We're excited to announce the signing of a new player.",
    body: `IPY FC are delighted to announce the signing of exciting winger Zaheer, who joins the club from Lucan United. The talented wide player brings pace, creativity, and a strong attacking mindset that will add a new dimension to the squad.

Zaheer has impressed with his ability to take on defenders, deliver quality crosses, and contribute in the final third. His experience and energy on the wing are expected to strengthen IPY FC’s attacking options as the team looks ahead to the season.

Everyone at the club is excited to welcome Zaheer and looks forward to seeing him in action. We wish him the very best in his time with IPY FC and are confident he will make a big impact both on and off the pitch.`,
    image: "assets/img/news/news-big-update.jpg",
    published: true,
    publishedAt: new Date("2026-03-20")
  },
  {
    title: "Match Report: IPY FC 3–2 Glasnevin FC 2nds",
    slug: "match-report-ipy-3-2-glasnevin-2nds",
    category: "match",
    summary: "Full match breakdown, goalscorers and what we learned from this victory.",
    body: `IPY FC secured an exciting 3–2 victory over Glasnevin FC 2nds in a competitive UCFL Division 3C clash.

The game started at a high tempo, with IPY FC taking early control through sharp attacking play. Muneeb Rouf opened the scoring with a well-taken finish before doubling his tally later in the match with a composed strike, putting IPY firmly in command. Glasnevin responded with two goals of their own, keeping the contest tense throughout.

Shaheer proved to be the difference-maker, netting the decisive third goal to secure all three points for IPY FC. His contribution capped off a strong team performance full of determination and resilience.

What we learned:
IPY FC showed great attacking quality and mental strength, holding their nerve under pressure. The team’s ability to respond and stay organised in tight moments highlights their growing confidence as the season progresses.`,
    image: "assets/img/news/news1.jpg",
    published: true,
    publishedAt: new Date("2026-03-18")
  },
  {
    title: "Player Announcements",
    slug: "player-announcements-march-2026",
    category: "player",
    summary: "Catch up on new signings, squad updates, and availability news.",
    body: `IPY FC continues to see positive developments across the squad, with new signings and strong individual performances shaping the team’s progress.

The club is pleased to welcome Ade, who joins as a new left back, adding defensive stability and energy on the flank. Billy Khan also comes in on the wing, bringing pace and attacking threat to the side.

There’s a major boost as Sharouz returns to full fitness and is set to captain the team, providing leadership both on and off the pitch. Meanwhile, Sullieman has impressed while continuing in a makeshift centre-back role, showing consistency and resilience in recent matches.

In attack, Aimon is hitting form at the right time, scoring twice in the last game. The race for the golden boot is also heating up, with Sameer and Muneeb Rouf level on 10 goals each, adding extra competition within the squad.`,
    image: "assets/img/news/news-player-announcement.jpg",
    published: true,
    publishedAt: new Date("2026-03-17")
  },
  {
    title: "Coach Q&A Available Now",
    slug: "coach-vasyl-qa-available-now",
    category: "interview",
    summary: "Get to know First Team Coach Vasyl Tropanets and his expectations for the season.",
    body: `Get to know First Team Coach Vasyl Tropanets in our latest Q&A, where he shares his thoughts and expectations for the remainder of the season.

With IPY FC currently sitting 7th in the table and coming off a difficult run of three consecutive league defeats, the coach provides honest insight into the team’s recent performances and what needs to improve. He highlights the importance of staying focused, maintaining discipline, and working harder both in training and on matchdays.

Tropanets remains confident in the squad’s ability to turn things around, emphasising the quality within the team and the need to rediscover consistency. He also discusses key areas for development, including defensive organisation and clinical finishing.

Supporters can expect a determined response from IPY FC as they look to climb the table in the coming weeks.`,
    image: "assets/img/news/vas.jpg",
    published: true,
    publishedAt: new Date("2026-03-16")
  },
  {
    title: "Next Match Preview: IPY FC vs Lourdes Pearse FC",
    slug: "next-match-preview-ipy-vs-lourdes-pearse",
    category: "match",
    summary: "Fixture insight, key players, and tactical preview before kickoff.",
    body: `IPY FC return to action with a crucial fixture against Lourdes Pearse FC, as they aim to bounce back following a tough defeat to Ronanstown FC 2nds.

Heading into the game, IPY FC sit 7th in the table, while Lourdes Pearse FC are currently in 11th, making this an important opportunity to secure valuable points and build momentum.

Key Players:
Muneeb Rouf will once again be central to IPY’s attacking play, especially after his recent standout performances. New signing Zaheer is in excellent form and will be a major threat on the wing. Meanwhile, Shaheer is set to return from injury, adding further strength and depth to the squad.

Tactical Preview:
The coach is expected to deploy a 4-3-3 system, with Muneeb operating in a more advanced midfield role—similar to his position in the match against Ronanstown FC 2nds. This setup should allow IPY to press higher and create more chances going forward.

IPY FC will be determined to respond strongly and deliver a disciplined, attacking performance.`,
    image: "assets/img/news/news2.jpg",
    published: true,
    publishedAt: new Date("2026-03-15")
  },
  {
    title: "Club Sponsorship Update",
    slug: "club-sponsorship-update-cgc",
    category: "club",
    summary: "IPY FC is pleased to announce a new sponsorship deal with CGC Catering.",
    body: `IPY FC are proud to announce a new sponsorship partnership with CGC Catering, a specialist one-on-one meal prepping and diet planning business tailored for athletes.

This exciting partnership marks a positive step forward for the club, both on and off the pitch. CGC Catering will provide expert nutritional support, helping players optimise performance, recovery, and overall fitness through personalised meal plans.

The collaboration reflects IPY FC’s commitment to developing players in every aspect of the game, recognising the importance of nutrition in modern football. With CGC’s expertise, the squad will benefit from professional guidance designed to enhance performance levels throughout the season.

Everyone at IPY FC is delighted to welcome CGC Catering to the club and looks forward to a successful partnership moving forward.`,
    image: "assets/img/news/news3.jpg",
    published: true,
    publishedAt: new Date("2026-03-14")
  }
];

async function run() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing in server/.env");
  }

  await mongoose.connect(process.env.MONGO_URI);

  for (const article of seedArticles) {
    await NewsArticle.updateOne(
      { slug: article.slug },
      { $set: article },
      { upsert: true }
    );
    console.log(`Upserted: ${article.slug}`);
  }

  await mongoose.disconnect();
  console.log("News seed complete.");
}

run().catch(async (err) => {
  console.error("Seed failed:", err.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});