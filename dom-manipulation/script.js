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

  // Get unique categories (case-insensitive)
  const categories = [...new Set(quotes.map(q => q.category.toLowerCase()))];

  // Clear current options
  while (categoryFilter.firstChild) {
    categoryFilter.removeChild(categoryFilter.firstChild);
  }

  // Add "All" option
  const allOption = document.createElement('option');
  allOption.value = 'all';
  allOption.textContent = 'All';
  categoryFilter.appendChild(allOption);

  // Add categories as options
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

  if (categoryFilter && categoryFilter.value !== 'all') {
    filteredQuotes = quotes.filter(q => q.category.toLowerCase() === categoryFilter.value.toLowerCase());
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

// ======= Project 1: Add Quote Form (no innerHTML) =======

function createAddQuoteForm() {
  const container = document.getElementById('formContainer');
  if (!container) return;

  // Clear container
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  // Quote text input
  const textInput = document.createElement('input');
  textInput.id = 'newQuoteText';
  textInput.type = 'text';
  textInput.placeholder = 'Enter a new quote';

  // Category input
  const categoryInput = document.createElement('input');
  categoryInput.id = 'newQuoteCategory';
  categoryInput.type = 'text';
  categoryInput.placeholder = 'Enter quote category';

  // Add button
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

  // Update category dropdown for project 3
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

// ======= Project 4: Server Sync Simulation =======

async function fetchServerQuotes() {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5');
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

function mergeQuotes(serverQuotes) {
  if (!serverQuotes) return;

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
    showSyncStatus('Data synced with server. Local data updated.', true);
  } else {
    showSyncStatus('No new data from server. Local data is up-to-date.', false);
  }
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

async function manualSync() {
  showSyncStatus('Syncing with server...', true);
  const serverQuotes = await fetchServerQuotes();
  mergeQuotes(serverQuotes);
}

// ======= Initialization =======

window.onload = () => {
  loadQuotes();

  // Show last quote or random one
  const lastQuote = sessionStorage.getItem('lastQuote');
  if (lastQuote) {
    const q = JSON.parse(lastQuote);
    document.getElementById('quoteDisplay').textContent = `"${q.text}" - ${q.category}`;
  } else {
    showRandomQuote();
  }

  createAddQuoteForm();

  // Populate categories dropdown (project 3)
  populateCategories();

  // Event listeners
  const newQuoteBtn = document.getElementById('newQuote');
  if (newQuoteBtn) newQuoteBtn.addEventListener('click', showRandomQuote);

  if (categoryFilter) {
    categoryFilter.addEventListener('change', showRandomQuote);
  }

  const syncBtn = document.getElementById('syncNowButton');
  if (syncBtn) syncBtn.addEventListener('click', manualSync);

  // Periodic sync every 30 seconds
  setInterval(async () => {
    const serverQuotes = await fetchServerQuotes();
    mergeQuotes(serverQuotes);
  }, 30000);
};
