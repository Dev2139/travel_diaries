import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { v4 as uuidv4 } from "uuid";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

/* ---------------- COUNTRY MODEL ---------------- */
const countrySchema = new mongoose.Schema({
  id: String,
  hero: { title: String, description: String, buttonText: String, image: String },
  discover: { title: String, description: String },
  infoCards: [{ title: String, icon: String, description: String }],
  activities: [{ image: String, title: String, description: String }],
});

const Country = mongoose.model("Country", countrySchema);

app.get("/api/countries", async (req, res) => {
  const data = await Country.find();
  res.json(data);
});

app.get("/api/countries/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const country = await Country.findOne({ id });

    if (!country) {
      return res.status(404).json({ message: "Country not found" });
    }

    res.json(country);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

app.post("/api/countries", async (req, res) => {
  const newData = new Country(req.body);
  await newData.save();
  res.status(201).json({ message: "New country data added successfully", data: newData });
});

app.patch("/api/countries/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const updatedData = await Country.findOneAndUpdate({ id }, updates, { new: true });
  if (!updatedData) return res.status(404).json({ message: "Data not found" });
  res.json({ message: "Country data updated successfully", data: updatedData });
});

app.delete("/api/countries/:id", async (req, res) => {
  const { id } = req.params;
  const deletedData = await Country.findOneAndDelete({ id });
  if (!deletedData) return res.status(404).json({ message: "Data not found" });
  res.json({ message: "Country data deleted successfully" });
});

/* ---------------- JOURNAL MODEL ---------------- */
const journalSchema = new mongoose.Schema({
  journalId: { type: String, unique: true, default: uuidv4 },
  journalTitle: String,
  countries: [String],
  notTravelRelated: Boolean,
  startDate: Date,
  endDate: Date,
  createdAt: { type: Date, default: Date.now },
  images: [String],
  content: String,
});

const Journal = mongoose.model("Journal", journalSchema);

app.post("/api/journals", async (req, res) => {
  try {
    const { journalTitle, startDate, endDate, images, content } = req.body;
    const journal = new Journal({
      journalTitle,
      startDate,
      endDate,
      images,
      content,
    });
    await journal.save();
    res.status(201).json({ message: "Journal created successfully", journal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/journals", async (req, res) => {
  const journals = await Journal.find();
  res.json(journals);
});

app.get("/api/journals/:journalId", async (req, res) => {
  const { journalId } = req.params;
  const journal = await Journal.findOne({ journalId });
  if (!journal) return res.status(404).json({ error: "Journal not found" });
  res.json(journal);
});

app.put("/api/journals/:journalId", async (req, res) => {
  const { journalId } = req.params;
  const { journalTitle, startDate, endDate, images, content } = req.body;

  try {
    const updatedJournal = await Journal.findOneAndUpdate(
      { journalId },
      { journalTitle, startDate, endDate, images, content },
      { new: true }
    );
    if (!updatedJournal) return res.status(404).json({ error: "Journal not found" });
    res.json({ message: "Journal updated successfully", updatedJournal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/journals/:journalId", async (req, res) => {
  const { journalId } = req.params;
  const deletedJournal = await Journal.findOneAndDelete({ journalId });
  if (!deletedJournal) return res.status(404).json({ error: "Journal not found" });
  res.json({ message: "Journal deleted successfully" });
});

/* ---------------- FAQ MODEL ---------------- */
const faqSchema = new mongoose.Schema({
  category: String,
  question: String,
  answer: String,
});

const FAQ = mongoose.model("FAQ", faqSchema);

// Fetch all FAQs categorized
app.get("/api/faqs", async (req, res) => {
  try {
    const faqs = await FAQ.find();
    const categorizedFAQs = faqs.reduce((acc, faq) => {
      acc[faq.category] = acc[faq.category] || [];
      acc[faq.category].push({ question: faq.question, answer: faq.answer });
      return acc;
    }, {});

    res.json(categorizedFAQs);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Add a new FAQ
app.post("/api/faqs", async (req, res) => {
  try {
    const newFAQ = new FAQ(req.body);
    await newFAQ.save();
    res.status(201).json({ message: "FAQ added successfully", faq: newFAQ });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update an FAQ
app.patch("/api/faqs/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const updatedFAQ = await FAQ.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedFAQ) return res.status(404).json({ error: "FAQ not found" });
    res.json({ message: "FAQ updated successfully", faq: updatedFAQ });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete an FAQ
app.delete("/api/faqs/:id", async (req, res) => {
  try {
    const deletedFAQ = await FAQ.findByIdAndDelete(req.params.id);
    if (!deletedFAQ) return res.status(404).json({ error: "FAQ not found" });
    res.json({ message: "FAQ deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---------------- MESSAGE MODEL ---------------- */
const messageSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  createdAt: { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", messageSchema);

app.post("/api/contact", async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const newMessage = new Message({ name, email, message });
    await newMessage.save();
    res.status(201).json({ success: "Message received successfully", data: newMessage });
  } catch (error) {
    res.status(500).json({ error: "Server error", message: error.message });
  }
});

/* ---------------- SERVER START ---------------- */
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
