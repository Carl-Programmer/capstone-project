// =======================
// LOGOUT
// =======================
document.getElementById("linguistLogoutBtn")?.addEventListener("click", e => {
  e.preventDefault();
  if (confirm("Are you sure you want to log out?")) {
    window.location.href = "/logout";
  }
});

// =======================
// TABS
// =======================
const tabCourses = document.getElementById("tabCourses");
const tabDictionary = document.getElementById("tabDictionary");

const coursesTab = document.getElementById("coursesTab");
const dictionaryTab = document.getElementById("dictionaryTab");

tabCourses.onclick = () => {
  coursesTab.style.display = "block";
  dictionaryTab.style.display = "none";
  tabCourses.classList.add("active");
  tabDictionary.classList.remove("active");
};

tabDictionary.onclick = () => {
  coursesTab.style.display = "none";
  dictionaryTab.style.display = "block";
  tabDictionary.classList.add("active");
  tabCourses.classList.remove("active");

  loadWords(); // load when switching
};

// =======================
// LOAD WORDS
// =======================
async function loadWords() {
  const res = await fetch('/users/all-words');
  const words = await res.json();

  const container = document.getElementById("wordList");

container.innerHTML = words.map(w => `
  <div class="flex justify-between items-center border p-2 rounded" id="word-${w._id}">
    
    <div class="flex-1">
      <input value="${w.tagalog}" id="tagalog-${w._id}" placeholder="Tagalog word" 
        class="border p-1 rounded hidden w-full"/>
      <input value="${w.chavacano}" id="chavacano-${w._id}" placeholder="Chavacano translation" 
        class="border p-1 rounded hidden w-full mt-1"/>

      <div id="text-${w._id}">
        <b>${w.tagalog}</b> → ${w.chavacano}
        <div class="text-xs text-gray-500">${w.category || ""}</div>
      </div>
    </div>

    <div class="flex gap-2">
        <button onclick="editWord('${w._id}')" class="approve" id="edit-btn-${w._id}">Edit</button>
        
        <button onclick="saveWord('${w._id}')" class="hidden approve" id="save-${w._id}">Save</button>
        
        <button onclick="cancelEdit('${w._id}')" 
            class="hidden bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-full transition-colors"                id="cancel-${w._id}">
        Cancel
        </button>      

        <button onclick="deleteWord('${w._id}')" class="reject" id="del-btn-${w._id}">Delete</button>
        </div>

  </div>
`).join("");
}

// =======================
// ADD WORD
// =======================
document.getElementById("addWordForm")?.addEventListener("submit", async e => {
  e.preventDefault();

  const formData = new FormData(e.target);

  try {
    const response = await fetch('/add-word', {
      method: 'POST',
      body: JSON.stringify({
        tagalog: formData.get("tagalog"),
        chavacano: formData.get("chavacano"),
        category: formData.get("category")
      }),
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      // --- SUCCESS ALERT ---
      alert("Word added successfully!"); 
      
      e.target.reset();
      loadWords();
    } else {
      alert("Failed to add word. Please try again.");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("An error occurred while connecting to the server.");
  }
});

//======================
// EDIT WORD
//======================
function editWord(id) {
  // Hide the static text
  document.getElementById(`text-${id}`).style.display = "none";
  
  // Hide the Edit and Delete buttons (optional, but cleaner)
  document.getElementById(`edit-btn-${id}`).classList.add("hidden");
  document.getElementById(`del-btn-${id}`).classList.add("hidden");

  // Show the input boxes
  document.getElementById(`tagalog-${id}`).classList.remove("hidden");
  document.getElementById(`chavacano-${id}`).classList.remove("hidden");

  // Show the Save and Cancel buttons
  document.getElementById(`save-${id}`).classList.remove("hidden");
  document.getElementById(`cancel-${id}`).classList.remove("hidden");
}

//======================
// CANCEL EDIT
//======================
function cancelEdit(id) {
  // Show the static text again
  document.getElementById(`text-${id}`).style.display = "block";

  // Show the Edit and Delete buttons again
  document.getElementById(`edit-btn-${id}`).classList.remove("hidden");
  document.getElementById(`del-btn-${id}`).classList.remove("hidden");

  // Hide the input boxes
  document.getElementById(`tagalog-${id}`).classList.add("hidden");
  document.getElementById(`chavacano-${id}`).classList.add("hidden");

  // Hide the Save and Cancel buttons
  document.getElementById(`save-${id}`).classList.add("hidden");
  document.getElementById(`cancel-${id}`).classList.add("hidden");
}
// =======================
// UPDATE WORD
// =======================
async function saveWord(id) {
  const tagalog = document.getElementById(`tagalog-${id}`).value;
  const chavacano = document.getElementById(`chavacano-${id}`).value;

try{
  const res = await fetch(`/update-word/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tagalog, chavacano })
  });

  if (res.ok) {
    alert("Word updated successfully!");
    loadWords(); // refresh UI
  } else {
    alert("Failed to update");
  }
  } catch (error) {
    console.error("Error:", error);
    alert("An error occurred while connecting to the server.");
  }
}

// =======================
// DELETE WORD
// =======================
async function deleteWord(id) {
  if (!confirm("Delete this word?")) return;

  const res = await fetch(`/delete-word/${id}`, {
    method: 'DELETE'
  });

  if (res.ok) {
    loadWords(); // refresh
  } else {
    alert("Failed to delete");
  }
}