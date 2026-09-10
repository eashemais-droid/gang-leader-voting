const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'votes.json');

const QUESTIONS = [
  'redline',
  'lostmc',
  'ballas',
  'families',
  'vagos'
];

function loadVotes() {
  if (!fs.existsSync(DATA_FILE)) {
    const empty = {};
    QUESTIONS.forEach(q => { empty[q] = {}; });
    fs.writeFileSync(DATA_FILE, JSON.stringify(empty, null, 2));
    return empty;
  }
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    const empty = {};
    QUESTIONS.forEach(q => { empty[q] = {}; });
    return empty;
  }
}

function saveVotes(votes) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(votes, null, 2));
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/votes', (req, res) => {
  const votes = loadVotes();
  res.json(votes);
});

app.post('/api/vote', (req, res) => {
  const { question, name, previousName } = req.body || {};

  if (!question || !QUESTIONS.includes(question)) {
    return res.status(400).json({ error: 'Invalid question' });
  }
  const trimmed = typeof name === 'string' ? name.trim() : '';
  if (!trimmed) {
    return res.status(400).json({ error: 'Name is required' });
  }
  if (trimmed.length > 40) {
    return res.status(400).json({ error: 'Name too long' });
  }

  const votes = loadVotes();
  if (!votes[question]) votes[question] = {};

  if (previousName && votes[question][previousName]) {
    votes[question][previousName] = Math.max(0, votes[question][previousName] - 1);
    if (votes[question][previousName] === 0) delete votes[question][previousName];
  }

  votes[question][trimmed] = (votes[question][trimmed] || 0) + 1;
  saveVotes(votes);

  res.json(votes);
});

app.listen(PORT, () => {
  console.log(`Voting app running on port ${PORT}`);
});
