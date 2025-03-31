const express = require('express');
const path = require('path');
const app = express();

// Port dla Render lub lokalny
const port = process.env.PORT || 3000;

// 🔹 Serwowanie statycznych plików z folderu "nazuna"
app.use(express.static(path.join(__dirname, 'nazuna')));

// 🔹 Główna strona – index.html z folderu "nazuna"
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'nazuna', 'index.html'));
});

// 🔹 Uruchomienie serwera
app.listen(port, () => {
  console.log(`Nazuna Game Server is running at http://localhost:${port}`);
});
