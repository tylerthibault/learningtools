// Global variables
const MASTERY_THRESHOLD = 3; // Number of correct answers needed to master a card
let FLASHCARDS = [];
let CURRENT_SIDE = 0;
let CURRENT_CARD_INDEX = -1;
let SHOW_MARK_AS_SEEN = true; // Default setting
let teams = [];
let currentTeamIndex = 0;

// Initialize all event listeners and load data
document.addEventListener('DOMContentLoaded', function() {
    // Initialize teams array
    if (!teams) {
        teams = [];
    }
    
    // Load saved data
    loadSavedData();
    loadTeams();
    
    // Initialize team-related event listeners
    initializeTeamControls();
    
    // Initialize other event listeners
    initializeFlashcardControls();
    
    // Initialize menu controls
    initializeMenuControls();
});

function initializeMenuControls() {
    // Get menu elements
    const menuToggle = document.querySelector('#menuToggle');
    const closeMenuBtn = document.querySelector('#closeMenu');
    const menuOverlay = document.querySelector('#menuOverlay');
    const settingsBtn = document.querySelector('#settingsBtn');
    const settingsModal = document.querySelector('#settingsModal');
    const closeSettingsBtn = document.querySelector('#closeSettingsModal');

    // Menu toggle
    if (menuToggle) {
        menuToggle.addEventListener('click', openMenu);
    } else {
        console.error('Menu toggle button not found');
    }

    // Close menu button
    if (closeMenuBtn) {
        closeMenuBtn.addEventListener('click', closeMenu);
    } else {
        console.error('Close menu button not found');
    }

    // Menu overlay
    if (menuOverlay) {
        menuOverlay.addEventListener('click', closeMenu);
    } else {
        console.error('Menu overlay not found');
    }

    // Settings button
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            settingsModal.classList.add('open');
            closeMenu();
        });
    } else {
        console.error('Settings button not found');
    }

    // Close settings button
    if (closeSettingsBtn) {
        closeSettingsBtn.addEventListener('click', () => {
            settingsModal.classList.remove('open');
        });
    } else {
        console.error('Close settings button not found');
    }
}

function initializeTeamControls() {
    // Team Modal Controls
    const setupTeamsBtn = document.getElementById('setupTeamsBtn');
    const teamModal = document.getElementById('teamModal');
    const closeTeamModalBtn = document.getElementById('closeTeamModal');
    const addTeamBtn = document.getElementById('addTeamBtn');
    const teamNameInput = document.getElementById('teamNameInput');
    const teamColorInput = document.getElementById('teamColorInput');

    setupTeamsBtn.addEventListener('click', function() {
        teamModal.classList.add('open');
        closeMenu();
    });

    closeTeamModalBtn.addEventListener('click', function() {
        teamModal.classList.remove('open');
    });

    // Add team functionality
    addTeamBtn.addEventListener('click', function() {
        const teamName = teamNameInput.value.trim();
        const teamColor = teamColorInput.value;
        
        if (teamName) {
            teams.push({
                name: teamName,
                color: teamColor,
                score: 0,
                currentCard: -1
            });
            teamNameInput.value = '';
            updateTeamList();
            saveTeams();
        }
    });
}

function initializeFlashcardControls() {
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const splashUploadBtn = document.getElementById('splashUploadBtn');
    const nextBtn = document.getElementById('nextBtn');
    const flipBtn = document.getElementById('flipBtn');
    const correctBtn = document.getElementById('correctBtn');
    const seenBtn = document.getElementById('seenBtn');
    const incorrectBtn = document.getElementById('incorrectBtn');
    const markAsSeenToggle = document.getElementById('markAsSeenToggle');
    const clearDataBtn = document.getElementById('clearDataBtn');

    // File upload functionality
    uploadBtn.addEventListener('click', function() {
        fileInput.click();
    });

    splashUploadBtn.addEventListener('click', function() {
        fileInput.click();
    });

    fileInput.addEventListener('change', handleFileUpload);

    // Button controls
    nextBtn.addEventListener('click', handleNextCard);
    flipBtn.addEventListener('click', handleFlipCard);
    correctBtn.addEventListener('click', function() {
        updateCard(true);
    });
    seenBtn.addEventListener('click', markAsSeen);
    incorrectBtn.addEventListener('click', function() {
        updateCard(false);
    });

    markAsSeenToggle.addEventListener('change', function() {
        SHOW_MARK_AS_SEEN = this.checked;
        updateButtonVisibility();
        saveToLocalStorage();
    });

    clearDataBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to clear all flashcard data? This cannot be undone.')) {
            clearSavedData();
        }
    });
}

// Local Storage Functions
function saveToLocalStorage() {
    const data = {
        flashcards: FLASHCARDS,
        settings: {
            showMarkAsSeen: SHOW_MARK_AS_SEEN
        }
    };
    localStorage.setItem('flashcardData', JSON.stringify(data));
}

function loadSavedData() {
    const savedData = localStorage.getItem('flashcardData');
    if (savedData) {
        const data = JSON.parse(savedData);
        FLASHCARDS = data.flashcards;
        SHOW_MARK_AS_SEEN = data.settings.showMarkAsSeen;
        
        // Update UI
        document.getElementById('markAsSeenToggle').checked = SHOW_MARK_AS_SEEN;
        if (FLASHCARDS.length > 0) {
            showFlashcardUI();
            selectAndDisplayNextCard();
        }
    }
}

function clearSavedData() {
    localStorage.removeItem('flashcardData');
    FLASHCARDS = [];
    CURRENT_CARD_INDEX = -1;
    
    // Reset UI
    document.getElementById('correctCount').textContent = '0';
    document.getElementById('incorrectCount').textContent = '0';
    document.getElementById('settingsModal').classList.remove('open');
    document.getElementById('splashScreen').style.display = 'flex';
    document.getElementById('flashcardContainer').style.display = 'none';
    document.getElementById('controlsGroup').style.display = 'none';
}

// Team Management
function saveTeams() {
    if (!teams) {
        teams = [];
    }
    const gameState = {
        teams: teams,
        currentTeamIndex: currentTeamIndex
    };
    localStorage.setItem('flashcardTeams', JSON.stringify(gameState));
}

function loadTeams() {
    const savedState = localStorage.getItem('flashcardTeams');
    if (savedState) {
        try {
            const gameState = JSON.parse(savedState);
            teams = Array.isArray(gameState.teams) ? gameState.teams : [];
            currentTeamIndex = gameState.currentTeamIndex || 0;
            if (currentTeamIndex >= teams.length) {
                currentTeamIndex = 0;
            }
            updateTeamList();
            if (teams.length > 0) {
                updateTeamTurn();
            }
        } catch (error) {
            console.error('Error loading teams:', error);
            teams = [];
            currentTeamIndex = 0;
        }
    } else {
        teams = [];
        currentTeamIndex = 0;
    }
}

// Initialize UI state
function showFlashcardUI() {
    document.getElementById('splashScreen').style.display = 'none';
    document.getElementById('flashcardContainer').style.display = 'block';
    document.getElementById('controlsGroup').style.display = 'flex';
}

// File upload functionality
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            let parsedCards;
            if (file.type === "application/json") {
                const jsonData = JSON.parse(e.target.result);
                parsedCards = parseJsonData(jsonData);
            } else {
                // Assume CSV if not JSON
                const csvData = e.target.result.split('\n');
                parsedCards = parseCsvData(csvData);
            }
            
            if (parsedCards && parsedCards.length > 0) {
                FLASHCARDS = parsedCards;
                saveToLocalStorage();
                showFlashcardUI();
                selectAndDisplayNextCard();
            } else {
                throw new Error('No valid cards found in file');
            }
        } catch (error) {
            console.error('Error parsing file:', error);
            alert('Error parsing file. Please make sure it is properly formatted.');
        }
    };
    
    reader.onerror = function() {
        console.error('Error reading file');
        alert('Error reading file');
    };
    
    reader.readAsText(file);
}

function parseCsvData(csvData) {
    if (!csvData || csvData.length < 2) return [];
    
    const flashcards = [];
    // Skip header row and process each line
    for (let i = 1; i < csvData.length; i++) {
        const line = csvData[i].trim();
        if (!line) continue; // Skip empty lines
        
        const parts = line.split(',').map(part => part.trim());
        if (parts.length >= 2) {
            const flashcard = createFlashcard(parts[0], parts[1]);
            flashcards.push(flashcard);
        }
    }
    console.log('Parsed CSV cards:', flashcards); // Debug log
    return flashcards;
}

function parseJsonData(jsonData) {
    if (!Array.isArray(jsonData)) return [];
    
    const flashcards = jsonData.map(card => {
        const front = card.front || card.term || '';
        const back = card.back || card.definition || '';
        return createFlashcard(front, back);
    }).filter(card => card.front && card.back); // Only keep cards with both front and back
    
    console.log('Parsed JSON cards:', flashcards); // Debug log
    return flashcards;
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
    
    setTimeout(() => {
        document.getElementById('frontText').textContent = flashcard.front;
        document.getElementById('backText').textContent = flashcard.back;
        
        document.getElementById('cardCorrectCount').textContent = flashcard.correctCount;
        document.getElementById('cardIncorrectCount').textContent = flashcard.incorrectCount;
        document.getElementById('cardCorrectCountBack').textContent = flashcard.correctCount;
        document.getElementById('cardIncorrectCountBack').textContent = flashcard.incorrectCount;
        
        updateButtonVisibility();
        updateTeamTurn();
        
        CURRENT_SIDE = 0;
        card.classList.remove('flipped');
        
        setTimeout(() => {
            card.classList.remove('changing');
        }, 50);
        
        flashcard.lastSeen = Date.now();
    }, 100);
}

function handleNextCard() {
    if (FLASHCARDS.length === 0) return;
    selectAndDisplayNextCard();
}

function handleFlipCard() {
    if (FLASHCARDS.length === 0) return;
    
    CURRENT_SIDE = (CURRENT_SIDE + 1) % 2;
    const card = document.getElementById('currentCard');
    card.classList.toggle('flipped');
}

function updateCard(isCorrect) {
    if (FLASHCARDS.length === 0 || CURRENT_CARD_INDEX === -1) return;
    
    const card = FLASHCARDS[CURRENT_CARD_INDEX];
    
    if (isCorrect) {
        card.correctCount++;
        card.hasBeenSeen = true;
        card.history.push('correct');
        document.getElementById("correctCount").textContent = 
            parseInt(document.getElementById("correctCount").textContent, 10) + 1;
        
        // Update team score
        if (teams.length > 0) {
            teams[currentTeamIndex].score++;
            nextTeamTurn();
        }
    } else {
        card.incorrectCount++;
        card.history.push('incorrect');
        document.getElementById("incorrectCount").textContent = 
            parseInt(document.getElementById("incorrectCount").textContent, 10) + 1;
        
        // Move to next team on incorrect answer
        if (teams.length > 0) {
            nextTeamTurn();
        }
    }
    
    saveToLocalStorage();
    saveTeams();
    selectAndDisplayNextCard();
}

function markAsSeen() {
    if (FLASHCARDS.length === 0 || CURRENT_CARD_INDEX === -1) return;
    
    const card = FLASHCARDS[CURRENT_CARD_INDEX];
    if (!card.hasBeenSeen) {
        card.hasBeenSeen = true;
        card.history.push('seen');
    }
    
    saveToLocalStorage();
    selectAndDisplayNextCard();
}

// Menu functionality
function closeMenu() {
    const sideMenu = document.getElementById('sideMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    sideMenu.classList.remove('open');
    menuOverlay.classList.remove('open');
}

function openMenu() {
    console.log("Opening menu...");
    const sideMenu = document.getElementById('sideMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    sideMenu.classList.add('open');
    menuOverlay.classList.add('open');
}

// Team Modal Controls
function updateTeamList() {
    const teamList = document.getElementById('teamList');
    if (!teamList) return;
    
    teamList.innerHTML = '';
    
    if (!teams) {
        teams = [];
        return;
    }
    
    teams.forEach((team, index) => {
        const teamItem = document.createElement('div');
        teamItem.className = 'team-item' + (index === currentTeamIndex ? ' current-turn' : '');
        if (index === currentTeamIndex) {
            teamItem.style.borderLeftColor = team.color;
        }
        
        teamItem.innerHTML = `
            <div class="team-info">
                <div class="team-color" style="background-color: ${team.color}"></div>
                <span>${team.name} (Score: ${team.score})</span>
            </div>
            <button class="remove-btn" data-index="${index}">
                <i class="fas fa-trash"></i>
            </button>
        `;
        teamList.appendChild(teamItem);
        
        // Add remove button listener
        const removeBtn = teamItem.querySelector('.remove-btn');
        removeBtn.addEventListener('click', function() {
            teams.splice(index, 1);
            if (currentTeamIndex >= teams.length) {
                currentTeamIndex = 0;
            }
            updateTeamList();
            updateTeamTurn();
            saveTeams();
        });
    });
}

function updateTeamTurn() {
    if (!teams || teams.length === 0) return;
    
    const flashcard = document.getElementById('currentCard');
    if (!flashcard) return;
    
    const currentTeam = teams[currentTeamIndex];
    if (!currentTeam) return;
    
    // Remove previous team's style
    flashcard.classList.remove('active-team');
    flashcard.style.boxShadow = '';
    
    // Add current team's style
    flashcard.classList.add('active-team');
    flashcard.style.boxShadow = `0 0 0 4px ${currentTeam.color}`;
}

function nextTeamTurn() {
    if (!teams || teams.length === 0) return;
    currentTeamIndex = (currentTeamIndex + 1) % teams.length;
    updateTeamList();
    updateTeamTurn();
    saveTeams();
}

function updateButtonVisibility() {
    const seenBtn = document.getElementById('seenBtn');
    const incorrectBtn = document.getElementById('incorrectBtn');
    const card = FLASHCARDS[CURRENT_CARD_INDEX];
    
    if (!card) return;
    
    if (SHOW_MARK_AS_SEEN && !card.hasBeenSeen) {
        seenBtn.style.display = 'inline-block';
        incorrectBtn.style.display = 'none';
    } else {
        seenBtn.style.display = 'none';
        incorrectBtn.style.display = 'inline-block';
    }
}