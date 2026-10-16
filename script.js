
document.querySelectorAll(".avatar img").forEach(function (img) {
  img.addEventListener("error", function () {
    img.style.display = "none";
  });
});

/* ----------------------------------------------------------
   PART 2: Dictionary app (Using the reliable Datamuse API)
   ---------------------------------------------------------- */
const form = document.getElementById("search-form");

if (form) {
  // Datamuse API endpoint (sp = spelled like, md=d = definitions, md=r = pronunciation)
  const API_URL = "https://api.datamuse.com/words?sp=";

  const input = document.getElementById("word-input");
  const button = document.getElementById("search-btn");
  const loading = document.getElementById("loading");
  const messageBox = document.getElementById("message");
  const resultsBox = document.getElementById("results");

  function showLoading(isLoading) {
    loading.classList.toggle("show", isLoading);
    button.disabled = isLoading; 
  }

  function showMessage(text, type) {
    messageBox.textContent = text;
    messageBox.className = "message show " + type; 
  }

  function clearMessage() {
    messageBox.className = "message";
    messageBox.textContent = "";
  }

  function clearResults() {
    resultsBox.hidden = true;
    resultsBox.innerHTML = "";
  }

  async function searchWord(word) {
    clearMessage();
    clearResults();

    if (word === "") {
      showMessage("Please type a word before searching.", "info");
      return;
    }

    if (!/^[A-Za-z][A-Za-z' -]*$/.test(word)) {
      showMessage("Please enter a valid English word (letters only).", "info");
      return;
    }

    showLoading(true);

    try {
      // Fetch definitions and pronunciations from Datamuse
      const response = await fetch(API_URL + encodeURIComponent(word) + "&md=d&md=r&max=1");

      if (!response.ok) {
        showMessage("The dictionary service returned an error. Please try again later.", "error");
        return;
      }

      const data = await response.json();
      
      // Datamuse returns an empty array if the word isn't found
      if (data.length === 0 || !data[0].defs) {
        showMessage('Sorry, we could not find "' + word + '". Check the spelling and try again.', "error");
        return;
      }

      displayResults(data[0]);
    } catch (error) {
      showMessage("Could not reach the dictionary. Please check your internet connection and try again.", "error");
    } finally {
      showLoading(false);
    }
  }

  function displayResults(entry) {
    const header = document.createElement("div");
    header.className = "word-header";

    const title = document.createElement("h2");
    title.className = "word-title";
    title.textContent = entry.word;
    header.appendChild(title);

    // Format phonetic spelling from Datamuse
    let phoneticText = "";
    if (entry.tags) {
        const pronTag = entry.tags.find(tag => tag.startsWith("pron:"));
        if (pronTag) {
            phoneticText = "/" + pronTag.split(":")[1] + "/";
        }
    }

    if (phoneticText) {
      const ph = document.createElement("span");
      ph.className = "phonetic";
      ph.textContent = phoneticText;
      header.appendChild(ph);
    }

    resultsBox.appendChild(header);

    // Group Datamuse definitions by part of speech
    const meaningsMap = {}; 

    (entry.defs || []).forEach(function (defStr) {
        const parts = defStr.split('\t');
        let posCode = parts[0];
        let defText = parts[1];
        
        let pos = "unknown";
        if (posCode === 'n') pos = "noun";
        else if (posCode === 'v') pos = "verb";
        else if (posCode === 'adj') pos = "adjective";
        else if (posCode === 'adv') pos = "adverb";

        if (!meaningsMap[pos]) {
            meaningsMap[pos] = [];
        }
        meaningsMap[pos].push(defText);
    });

    // Generate HTML for each part of speech
    for (const pos in meaningsMap) {
        const block = document.createElement("div");
        block.className = "meaning";

        const posSpan = document.createElement("span");
        posSpan.className = "pos";
        posSpan.textContent = pos;
        block.appendChild(posSpan);

        const list = document.createElement("ol");
        list.className = "definitions";

        meaningsMap[pos].forEach(function(defText) {
            const li = document.createElement("li");
            li.textContent = defText;
            list.appendChild(li);
        });
        
        block.appendChild(list);
        resultsBox.appendChild(block);
    }

    resultsBox.hidden = false;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault(); 
    searchWord(input.value.trim());
  });
}