const mongoose = require("mongoose");

const newsArticleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    category: {
      type: String,
      enum: ["match", "club", "player", "interview"],
      default: "club",
      required: true
    },
    summary: { type: String, required: true, trim: true, maxlength: 220 },
    body: { type: String, required: true, trim: true, maxlength: 12000 },
    image: {
    type: String,
    trim: true,
    default: "assets/img/news/news1.jpg"
    },
    published: { type: Boolean, default: true },
    publishedAt: { type: Date, default: Date.now },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);

newsArticleSchema.index({ published: 1, publishedAt: -1 });

module.exports = mongoose.model("NewsArticle", newsArticleSchema);