// ======= Project 1 quotes + localStorage =======

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

// ======= Project 3: Category Filter Select =======

const categoryFilter = document.getElementById('categoryFilter');

function populateCategories() {
  if (!categoryFilter) return;

  const categories = [...new Set(quotes.map(q => q.category.toLowerCase()))];

  while (categoryFilter.firstChild) {
    categoryFilter.removeChild(categoryFilter.firstChild);
  }

  const allOption = document.createElement('option');
  allOption.value = 'all';
  allOption.textContent = 'All';
  categoryFilter.appendChild(allOption);

  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
    categoryFilter.appendChild(option);
  });
}

// ======= Show Quote with category filtering (Project 3) =======

function showRandomQuote() {
  const quoteDisplay = document.getElementById('quoteDisplay');
  if (quotes.length === 0) {
    quoteDisplay.textContent = "No quotes available.";
    return;
  }

  let filteredQuotes = quotes;

  let selectedCategory = 'all';
  if (categoryFilter) {
    selectedCategory = categoryFilter.value;
  }

  if (selectedCategory !== 'all') {
    filteredQuotes = quotes.filter(q => q.category.toLowerCase() === selectedCategory.toLowerCase());
  }

  if (filteredQuotes.length === 0) {
    quoteDisplay.textContent = "No quotes found in this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const randomQuote = filteredQuotes[randomIndex];
  quoteDisplay.textContent = `"${randomQuote.text}" - ${randomQuote.category}`;

  sessionStorage.setItem('lastQuote', JSON.stringify(randomQuote));
}

// ======= New: filterQuote function for Project 3 test =======

function filterQuote() {
  showRandomQuote();
}

// ======= Project 1: Add Quote Form (no innerHTML) =======

function createAddQuoteForm() {
  const container = document.getElementById('formContainer');
  if (!container) return;

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

// ======= Add quote handler (project 1 compatible) =======

function addQuote() {
  const text = document.getElementById('newQuoteText').value.trim();
  const category = document.getElementById('newQuoteCategory').value.trim();

  if (!text || !category) {
    alert('Please enter both quote text and category.');
    return;
  }

  quotes.push({ text, category });
  saveQuotes();
  populateCategories();

  document.getElementById('newQuoteText').value = '';
  document.getElementById('newQuoteCategory').value = '';

  alert('Quote added successfully!');
}

// ======= JSON Import/Export (project 1 compatible) =======

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
        populateCategories();
        alert('Quotes imported successfully!');
      } else {
        alert('Invalid JSON format.');
      }
    } catch {
      alert('Error parsing JSON file.');
    }
  };

  reader.readAsText(file);
  event.target.value = ''; // reset input
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

// ======= Project 4: Server Sync Simulation and Conflict Handling =======

const SERVER_URL = 'https://jsonplaceholder.typicode.com/posts?_limit=5';

async function fetchQuotesFromServer() {
  try {
    const response = await fetch(SERVER_URL);
    if (!response.ok) throw new Error('Failed to fetch from server');
    const posts = await response.json();

    return posts.map(post => ({
      text: post.title,
      category: 'server'
    }));
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function postQuotesToServer() {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quotes)
    });

    if (!response.ok) throw new Error('Failed to post quotes to server');
    const data = await response.json();
    console.log('Successfully posted quotes:', data);
    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
}

function mergeQuotes(serverQuotes) {
  if (!serverQuotes) return false;

  let updated = false;

  const localSet = new Set(quotes.map(q => q.text + '|' + q.category.toLowerCase()));

  serverQuotes.forEach(sq => {
    if (!localSet.has(sq.text + '|' + sq.category.toLowerCase())) {
      quotes.push(sq);
      updated = true;
    }
  });

  if (updated) {
    saveQuotes();
    populateCategories();
  }

  return updated;
}

function showSyncStatus(message, success) {
  const statusEl = document.getElementById('syncStatus');
  if (!statusEl) return;

  statusEl.textContent = message;
  statusEl.style.color = success ? 'green' : 'orange';

  setTimeout(() => {
    statusEl.textContent = '';
  }, 5000);
}

async function syncQuotes() {
  showSyncStatus('Syncing with server...', true);

  const postResult = await postQuotesToServer();

  if (!postResult) {
    showSyncStatus('Failed to post data to server.', false);
    return;
  }

  const serverQuotes = await fetchQuotesFromServer();
  if (serverQuotes === null) {
    showSyncStatus('Failed to fetch data from server.', false);
    return;
  }

  const updated = mergeQuotes(serverQuotes);

  if (updated) {
    showSyncStatus('Quotes synced with server!', true);
  } else {
    showSyncStatus('No new data from server. Local data is up-to-date.', false);
  }
}

function startAutoSync() {
  setInterval(async () => {
    const serverQuotes = await fetchQuotesFromServer();
    if (serverQuotes) {
      const updated = mergeQuotes(serverQuotes);
      if (updated) {
        showSyncStatus('Quotes synced with server!', true);
      }
    }
  }, 30000);
}

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
  populateCategories();

  const newQuoteBtn = document.getElementById('newQuote');
  if (newQuoteBtn) newQuoteBtn.addEventListener('click', showRandomQuote);

  if (categoryFilter) {
    categoryFilter.addEventListener('change', filterQuote);
  }

  const syncBtn = document.getElementById('syncNowButton');
  if (syncBtn) syncBtn.addEventListener('click', syncQuotes);

  startAutoSync();
};
