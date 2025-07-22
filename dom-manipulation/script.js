// ----- Quote Data & Persistence -----

let quotes = [];

function loadQuotes() {
  const saved = localStorage.getItem('quotes');
  if (saved) {
    quotes = JSON.parse(saved);
  } else {
    quotes = [
      { text: "Success is not final, failure is not fatal.", category: "Motivation" },
      { text: "Stay hungry, stay foolish.", category: "Inspiration" }
    ];
  }
}

function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
}

// ----- Quote Display -----

function showRandomQuote() {
  const quoteDisplay = document.getElementById('quoteDisplay');
  if (quotes.length === 0) {
    quoteDisplay.textContent = "No quotes available.";
    return;
  }
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const randomQuote = quotes[randomIndex];
  quoteDisplay.textContent = `"${randomQuote.text}" - ${randomQuote.category}`;

  sessionStorage.setItem('lastQuote', JSON.stringify(randomQuote));
}

// ----- Add Quote Form -----

function createAddQuoteForm() {
  const container = document.getElementById('formContainer');

  // Clear container
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const textInput = document.createElement('input');
  textInput.id = 'newQuoteText';
  textInput.type = 'text';
  textInput.placeholder = 'Enter a new quote';

  const categoryInput = document.createElement('input');
  categoryInput.id = 'newQuoteCategory';
  categoryInput.type = 'text';
  categoryInput.placeholder = 'Enter quote category';

  const addButton = document.createElement('button');
  addButton.textContent = 'Add Quote';
  addButton.addEventListener('click', addQuote);

  container.appendChild(textInput);
  container.appendChild(categoryInput);
  container.appendChild(addButton);
}

// ----- Add Quote Handler -----

function addQuote() {
  const text = document.getElementById('newQuoteText').value.trim();
  const category = document.getElementById('newQuoteCategory').value.trim();

  if (!text || !category) {
    alert('Please enter both quote text and category.');
    return;
  }

  quotes.push({ text, category });
  saveQuotes();

  document.getElementById('newQuoteText').value = '';
  document.getElementById('newQuoteCategory').value = '';

  alert('Quote added successfully!');
}

// ----- JSON Import/Export -----

function importFromJsonFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function(e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (Array.isArray(importedQuotes)) {
        quotes.push(...importedQuotes);
        saveQuotes();
        alert('Quotes imported successfully!');
      } else {
        alert('Invalid JSON format.');
      }
    } catch {
      alert('Error parsing JSON file.');
    }
  };

  reader.readAsText(file);

  // Reset file input so same file can be imported again
  event.target.value = '';
}

function exportToJsonFile() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'quotes.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

// ----- Server Sync Simulation -----

async function fetchServerQuotes() {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5');
    if (!response.ok) throw new Error('Failed to fetch from server');
    const posts = await response.json();

    return posts.map(post => ({
      text: post.title,
      category: 'Server'
    }));
  } catch (error) {
    console.error(error);
    return null;
  }
}

function mergeQuotes(serverQuotes) {
  if (!serverQuotes) return;

  let updated = false;

  const localSet = new Set(quotes.map(q => q.text + '|' + q.category));

  serverQuotes.forEach(sq => {
    if (!localSet.has(sq.text + '|' + sq.category)) {
      quotes.push(sq);
      updated = true;
    }
  });

  if (updated) {
    saveQuotes();
    showSyncStatus('Data synced with server. Local data updated.', true);
  } else {
    showSyncStatus('No new data from server. Local data is up-to-date.', false);
  }
}

function showSyncStatus(message, success) {
  const statusEl = document.getElementById('syncStatus');
  statusEl.textContent = message;
  statusEl.style.color = success ? 'green' : 'orange';

  setTimeout(() => {
    statusEl.textContent = '';
  }, 5000);
}

async function manualSync() {
  showSyncStatus('Syncing with server...', true);
  const serverQuotes = await fetchServerQuotes();
  mergeQuotes(serverQuotes);
}

// ----- Initialization -----

window.onload = () => {
  loadQuotes();

  const lastQuote = sessionStorage.getItem('lastQuote');
  if (lastQuote) {
    const q = JSON.parse(lastQuote);
    document.getElementById('quoteDisplay').textContent = `"${q.text}" - ${q.category}`;
  } else {
    showRandomQuote();
  }

  createAddQuoteForm();

  document.getElementById('newQuote').addEventListener('click', showRandomQuote);

  document.getElementById('syncNowButton').addEventListener('click', manualSync);

  // Periodic sync every 30 seconds
  setInterval(async () => {
    const serverQuotes = await fetchServerQuotes();
    mergeQuotes(serverQuotes);
  }, 30000);
};
