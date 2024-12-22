// Global variables
const MASTERY_THRESHOLD = 3; // Number of correct answers needed to master a card
let FLASHCARDS = [];
let CURRENT_SIDE = 0;
let CURRENT_CARD_INDEX = -1;

document.getElementById("fileInput").addEventListener("change", function() {
    if (this.files.length > 0) {
        var file = this.files[0];
        var reader = new FileReader();
        reader.onload = function(e) {
            var data = e.target.result;
            if (file.type === "application/json") {
                var jsonData = JSON.parse(data);
                parseJsonData(jsonData);
            } else if (file.type === "text/csv") {
                var csvData = data.split("\n");
                parseCsvData(csvData);
            }
        };
        reader.readAsText(file);
    }
});

function parseCsvData(csvData) {
    var flashcards = [];
    for (var i = 1; i < csvData.length; i++) {
        var parts = csvData[i].split(",");
        if (parts.length >= 2) {
            var flashcard = createFlashcard(parts[0], parts[1]);
            flashcards.push(flashcard);
        }
    }
    FLASHCARDS = flashcards;
    selectAndDisplayNextCard();
}

function parseJsonData(jsonData) {
    FLASHCARDS = jsonData.map(card => 
        createFlashcard(card.front || card.term, card.back || card.definition)
    );
    selectAndDisplayNextCard();
}

function createFlashcard(front, back) {
    return {
        front: front,
        back: back,
        correctCount: 0,
        incorrectCount: 0,
        hasBeenSeen: false,
        history: [], // Array of 'correct' or 'seen' strings
        lastSeen: null,
        weight: 1 // Higher weight means more likely to be selected
    };
}

function calculateCardWeight(card) {
    if (card.correctCount >= MASTERY_THRESHOLD) {
        return 0; // Don't show mastered cards
    }

    // Base weight starts at 1
    let weight = 1;

    // Increase weight based on incorrect answers
    weight += card.incorrectCount * 2;

    // Decrease weight based on correct answers
    weight -= card.correctCount * 0.5;

    // If card has never been seen, give it higher priority
    if (!card.hasBeenSeen) {
        weight += 2;
    }
    // If card was recently marked as seen but not correct, give it moderate priority
    else if (card.history[card.history.length - 1] === 'seen') {
        weight += 1;
    }
    // If card was recently incorrect, increase its priority
    else if (card.history[card.history.length - 1] === 'incorrect') {
        weight += 3;
    }

    return Math.max(weight, 0.1); // Ensure weight is never below 0.1
}

function selectNextCard() {
    // Calculate weights for all cards
    const weights = FLASHCARDS.map(calculateCardWeight);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

    // If all cards are mastered, return null
    if (totalWeight === 0) {
        return null;
    }

    // Random selection based on weights
    let random = Math.random() * totalWeight;
    for (let i = 0; i < FLASHCARDS.length; i++) {
        random -= weights[i];
        if (random <= 0) {
            return i;
        }
    }
    return 0; // Fallback to first card
}

function selectAndDisplayNextCard() {
    const nextIndex = selectNextCard();
    if (nextIndex === null) {
        document.getElementById('frontText').textContent = "All cards mastered!";
        document.getElementById('backText').textContent = "Congratulations!";
        return;
    }
    
    CURRENT_CARD_INDEX = nextIndex;
    displayFlashcard(FLASHCARDS[CURRENT_CARD_INDEX]);
}

function displayFlashcard(flashcard) {
    if (!flashcard) return;
    
    const card = document.getElementById('currentCard');
    card.classList.add('changing');
    
    // Wait for fade out
    setTimeout(() => {
        document.getElementById('frontText').textContent = flashcard.front;
        document.getElementById('backText').textContent = flashcard.back;
        
        // Update card stats
        document.getElementById('cardCorrectCount').textContent = flashcard.correctCount;
        document.getElementById('cardIncorrectCount').textContent = flashcard.incorrectCount;
        document.getElementById('cardCorrectCountBack').textContent = flashcard.correctCount;
        document.getElementById('cardIncorrectCountBack').textContent = flashcard.incorrectCount;
        
        // Show/hide appropriate buttons based on hasBeenSeen status
        document.getElementById('seenBtn').style.display = flashcard.hasBeenSeen ? 'none' : 'inline-block';
        document.getElementById('incorrectBtn').style.display = flashcard.hasBeenSeen ? 'inline-block' : 'none';
        
        // Reset the flip state when displaying a new card
        CURRENT_SIDE = 0;
        card.classList.remove('flipped');
        
        // Wait a tiny bit to ensure flip reset is done
        setTimeout(() => {
            card.classList.remove('changing');
        }, 50);
        
        // Update last seen timestamp
        flashcard.lastSeen = Date.now();
    }, 100);
}

document.getElementById("nextBtn").addEventListener("click", function() {
    if (FLASHCARDS.length === 0) return;
    selectAndDisplayNextCard();
});

document.getElementById("flipBtn").addEventListener("click", function() {
    if (FLASHCARDS.length === 0) return;
    
    CURRENT_SIDE = (CURRENT_SIDE + 1) % 2;
    const card = document.getElementById('currentCard');
    card.classList.toggle('flipped');
});

function updateCard(isCorrect) {
    if (FLASHCARDS.length === 0 || CURRENT_CARD_INDEX === -1) return;
    
    const card = FLASHCARDS[CURRENT_CARD_INDEX];
    
    if (isCorrect) {
        card.correctCount++;
        card.hasBeenSeen = true;
        card.history.push('correct');
        document.getElementById("correctCount").textContent = 
            parseInt(document.getElementById("correctCount").textContent, 10) + 1;
    } else {
        card.incorrectCount++;
        card.history.push('incorrect');
        document.getElementById("incorrectCount").textContent = 
            parseInt(document.getElementById("incorrectCount").textContent, 10) + 1;
    }
    
    selectAndDisplayNextCard();
}

function markAsSeen() {
    if (FLASHCARDS.length === 0 || CURRENT_CARD_INDEX === -1) return;
    
    const card = FLASHCARDS[CURRENT_CARD_INDEX];
    if (!card.hasBeenSeen) {
        card.hasBeenSeen = true;
        card.history.push('seen');
    }
    
    selectAndDisplayNextCard();
}

document.getElementById("correctBtn").addEventListener("click", function() {
    updateCard(true);
});

document.getElementById("seenBtn").addEventListener("click", function() {
    markAsSeen();
});

document.getElementById("incorrectBtn").addEventListener("click", function() {
    updateCard(false);
});