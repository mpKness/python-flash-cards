// main.js
import { getRandomColor } from "./utils.js";

let selectedCategories = [];
let filteredFlashcards = [];

let currentCardIndex = -1;

let scoreRight = 0;
let scoreWrong = 0;

let categoryColors = {};

const storedUserCards = JSON.parse(localStorage.getItem("userFlashcards") || "[]");
let flashcards = [...serverFlashcards, ...storedUserCards];

/**
 * updateCategoryFilters
 * Updates the category filters based on the current flashcards.
 */
function updateCategoryFilters() {
    const filterContainer = document.getElementById("category-filters");
    filterContainer.innerHTML = ""; // clear previous buttons

    const allCategoriesSet = new Set(flashcards.map(card => card.category));
    selectedCategories = [...allCategoriesSet];
    allCategoriesSet.forEach(category => {
        let localCategory = category;
        if (localCategory !== undefined) {
            categoryColors[localCategory] = getRandomColor();
            const button = document.createElement("button");
            button.className = `filter-btn active category-${localCategory.toLowerCase()}`;
            button.setAttribute("data-category", localCategory);
            button.setAttribute("style", `background-color: ${categoryColors[localCategory]}; color: white;`);
            button.textContent = localCategory;
            filterContainer.appendChild(button);
        }
    });

    filteredFlashcards = flashcards.filter(card => selectedCategories.includes(card.category));

    // Reattach filter logic
    document.querySelectorAll(".filter-btn").forEach(button => {
        button.addEventListener("click", () => {
        const category = button.getAttribute("data-category");
        button.classList.toggle("active");

        if (button.classList.contains("active")) {
            selectedCategories.push(category);
            button.style.backgroundColor = categoryColors[category];
        } else {
            selectedCategories = selectedCategories.filter(cat => cat !== category);
            button.style.backgroundColor = "#cccccc"; // Reset to default color
        }

        filteredFlashcards = flashcards.filter(card => selectedCategories.includes(card.category));
        loadNewCard();
        });
    });
}

/**
 * saveUserFlashcards
 * Saves the user's flashcards to local storage.
 * @param {*} cards 
 */
function saveUserFlashcards(cards) {
    localStorage.setItem("userFlashcards", JSON.stringify(cards));
}

/**
 * loadNewCard
 * Loads a new flashcard from the filtered list based on selected categories.
 * @returns 
 */
function loadNewCard() {
    // check if there are no flashcards left
    if (filteredFlashcards.length === 0) {
        document.getElementById("question-text").textContent = "No cards available for selected categories.";
        document.getElementById("answer-text").textContent = "";
        document.getElementById("category-label").textContent = "";
        document.getElementById("flashcard").className = "flashcard";
        return;
    }

    // Grab a random flashcard from the filtered list
    const randomIndex = Math.floor(Math.random() * filteredFlashcards.length);
    const card = filteredFlashcards[randomIndex];

    document.getElementById("question-text").textContent = card.question;
    document.getElementById("answer-text").textContent = card.answer;
    document.getElementById("question-tags").textContent = card.tags ? `Tags: ${card.tags.join(', ')}` : '';
    
    const categoryLabel = document.getElementById("category-label");
    categoryLabel.textContent = card.category || "Uncategorized";

    const flashcard = document.getElementById("flashcard");
    flashcard.className = "flashcard"; // reset existing category class

    // Set class based on category
    categoryLabel.className = "category-label"; // reset first
    if (card.category) {
        const categoryClass = "category-" + card.category.toLowerCase();
        categoryLabel.className = "category-label " + categoryClass;
        flashcard.style.borderColor = categoryColors[card.category];
        categoryLabel.style.backgroundColor = categoryColors[card.category];
    }

    // Ensure card is front-facing
    document.getElementById('flashcard').classList.remove('flipped');

    // 🔧 Add this to adjust the card height smoothly after the flip
    setTimeout(() => {
        const front = flashcard.querySelector(".card-front");
        const back = flashcard.querySelector(".card-back");

        const newHeight = flashcard.classList.contains("flipped")
        ? back.scrollHeight
        : front.scrollHeight;

        flashcard.style.height = newHeight + "px";
    }, 300); // Delay matches flip animation (0.8s), adjust if needed
}

// Initialize the flashcard display and category filters on page load
window.onload = async () => {
    await updateCategoryFilters();
    await loadNewCard();
}

/**
 * flipCard
 * Flips the flashcard to show the answer or question.
 * @param {*} event 
 * @returns 
 */
function flipCard(event) {
    if (event && event.target.tagName === "BUTTON") return;

    const card = document.getElementById('flashcard');
    card.classList.toggle('flipped');

    // 🔧 Add this to adjust the card height smoothly after the flip
    setTimeout(() => {
        const front = flashcard.querySelector(".card-front");
        const back = flashcard.querySelector(".card-back");

        const newHeight = flashcard.classList.contains("flipped")
        ? back.scrollHeight
        : front.scrollHeight;

        flashcard.style.height = newHeight + "px";
    }, 300); // Delay matches flip animation (0.8s), adjust if needed
}

/**
 * markAnswer
 * Marks the user's answer as correct or incorrect and updates the score.
 * @param {*} correct 
 */
function markAnswer(correct) {
    if (correct) {
        scoreRight++;
        document.getElementById("score-right").textContent = scoreRight;
        console.log("✅ User got it right");
    } else {
        scoreWrong++;
        document.getElementById("score-wrong").textContent = scoreWrong;
        console.log("❌ User got it wrong");
    }

    loadNewCard(); // Immediately load the next card
}

/**
 * toggleFab
 * Toggles the visibility of the FAB menu and the hamburger icon.
 */
function toggleFab() {
    const actions = document.getElementById("fab-actions");
    const hamburger = document.getElementById("hamburger");

    actions.classList.toggle("show");
    hamburger.classList.toggle("active");

    // Toggle outside click listener
    if (actions.classList.contains("show")) {
        document.addEventListener("click", closeFabOnOutsideClick);
    } else {
        document.removeEventListener("click", closeFabOnOutsideClick);
    }
}

/**
 * closeFabOnOutsideClick
 * Closes the FAB menu if clicked outside of it.
 * @param {*} event 
 */
function closeFabOnOutsideClick(event) {
    const fab = document.querySelector(".fab-menu");
    if (!fab.contains(event.target)) {
        document.getElementById("fab-actions").classList.remove("show");
        document.getElementById("hamburger").classList.remove("active");
        document.removeEventListener("click", closeFabOnOutsideClick);
    }
}

document.getElementById("file-upload").addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
        const imported = JSON.parse(e.target.result);

        // Validate structure
        if (!Array.isArray(imported)) {
            alert("Invalid JSON: must be an array of flashcards.");
            return;
        }

        const validCards = imported.filter(card => card.question && card.answer);
        const stored = JSON.parse(localStorage.getItem("userFlashcards") || "[]");
        const updated = [...stored, ...validCards];

        flashcards = [...serverFlashcards, ...updated]
        saveUserFlashcards(updated);

        updateCategoryFilters();
        filteredFlashcards = flashcards.filter(card => selectedCategories.includes(card.category));
        loadNewCard();

        alert("Flashcards imported successfully!");
        } catch (err) {
        alert("Error parsing JSON: " + err.message);
        }
    };
    reader.readAsText(file);
});

/**
 * clearUserFlashcards
 */
function clearUserFlashcards() {
    if (confirm("Are you sure you want to remove all your imported flashcards?")) {
        localStorage.removeItem("userFlashcards");
        flashcards = [...serverFlashcards];
        updateCategoryFilters();
        filteredFlashcards = flashcards.filter(card => selectedCategories.includes(card.category));
        loadNewCard();
        alert("User flashcards cleared.");
    }
}

// add functions to window that are event handlers
window.flipCard = flipCard;
window.markAnswer = markAnswer;
window.toggleFab = toggleFab;
window.closeFabOnOutsideClick = closeFabOnOutsideClick;
window.clearUserFlashcards = clearUserFlashcards;


