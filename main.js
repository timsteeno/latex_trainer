// main.js - LaTeX Formula Trainer

// DOM elements
const promptText = document.getElementById('promptText');
const targetDisplay = document.getElementById('targetDisplay');
const latexInput = document.getElementById('latexInput');
const previewArea = document.getElementById('previewArea');
const checkButton = document.getElementById('checkButton');
const hintButton = document.getElementById('hintButton');
const nextButton = document.getElementById('nextButton');
const feedback = document.getElementById('feedback');
const hintArea = document.getElementById('hintArea');
const progressInfo = document.getElementById('progressInfo');
const showAnswerButton = document.getElementById('showAnswerButton');

// State variables
let questions = [];
let currentQuestionIndex = 0;
let questionOrder = [];
let currentLevel = 'beginner';
let levelIndices = {
    'beginner': { start: 0, end: 0 },
    'intermediate': { start: 0, end: 0 },
    'advanced': { start: 0, end: 0 },
    'expert': { start: 0, end: 0 }
};

// Shuffle array using Fisher-Yates algorithm
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Get questions for current level
function getCurrentLevelQuestions() {
    const { start, end } = levelIndices[currentLevel];
    return questionOrder.slice(start, end);
}

// Move to next level
function moveToNextLevel() {
    const levels = ['beginner', 'intermediate', 'advanced', 'expert'];
    const currentIndex = levels.indexOf(currentLevel);
    if (currentIndex < levels.length - 1) {
        currentLevel = levels[currentIndex + 1];
        return true;
    }
    return false;
}

// Fetch questions from JSON file
async function fetchQuestions() {
    try {
        const response = await fetch('questions.json');
        if (!response.ok) {
            throw new Error('Failed to load questions');
        }
        questions = await response.json();
        
        // Sort questions by difficulty level
        const levelOrder = { 'beginner': 0, 'intermediate': 1, 'advanced': 2, 'expert': 3 };
        questions.sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);
        
        // Calculate level indices
        let currentIndex = 0;
        for (const level of ['beginner', 'intermediate', 'advanced', 'expert']) {
            const levelQuestions = questions.filter(q => q.level === level);
            levelIndices[level] = {
                start: currentIndex,
                end: currentIndex + levelQuestions.length
            };
            currentIndex += levelQuestions.length;
        }
        
        // Initialize question order
        questionOrder = Array.from({length: questions.length}, (_, i) => i);
        
        // Shuffle questions within each level
        for (const level of ['beginner', 'intermediate', 'advanced', 'expert']) {
            const { start, end } = levelIndices[level];
            const levelSlice = questionOrder.slice(start, end);
            shuffleArray(levelSlice);
            questionOrder.splice(start, end - start, ...levelSlice);
        }
        
        // Start with beginner level
        currentLevel = 'beginner';
        currentQuestionIndex = 0;
        
        // Initialize first question
        loadQuestion(0);
    } catch (error) {
        console.error('Error loading questions:', error);
        promptText.textContent = 'Error loading questions. Please check the console.';
    }
}

// Load a question by index
function loadQuestion(index) {
    if (!questions || questions.length === 0) {
        promptText.textContent = 'No questions available.';
        return;
    }
    
    const levelQuestions = getCurrentLevelQuestions();
    if (index >= levelQuestions.length) {
        if (moveToNextLevel()) {
            currentQuestionIndex = 0;
            loadQuestion(0);
            return;
        } else {
            // End of all questions - reshuffle and start over
            currentLevel = 'beginner';
            currentQuestionIndex = 0;
            
            // Reshuffle questions within each level
            for (const level of ['beginner', 'intermediate', 'advanced', 'expert']) {
                const { start, end } = levelIndices[level];
                const levelSlice = questionOrder.slice(start, end);
                shuffleArray(levelSlice);
                questionOrder.splice(start, end - start, ...levelSlice);
            }
            
            loadQuestion(0);
            return;
        }
    }
    
    const question = questions[levelQuestions[index]];
    promptText.textContent = question.prompt;
    
    // Display the target formula using MathJax
    targetDisplay.textContent = '$' + question.target + '$';
    MathJax.typesetPromise([targetDisplay]).catch(err => console.error(err));
    
    // Clear input and feedback
    latexInput.value = '';
    feedback.style.display = 'none';
    feedback.className = 'feedback';
    hintArea.style.display = 'none';
    previewArea.innerHTML = '';
    nextButton.disabled = true;
    
    // Hide target display and show the show answer button
    targetDisplay.style.display = 'none';
    showAnswerButton.classList.remove('hidden');
    
    // Update progress info
    progressInfo.textContent = `Question ${index + 1} of ${levelQuestions.length} (${currentLevel})`;
}

// Preview the latex input
latexInput.addEventListener('input', function() {
    previewArea.textContent = '$' + latexInput.value + '$';
    MathJax.typesetPromise([previewArea]).catch(err => console.error(err));
});

// Check answer button
checkButton.addEventListener('click', function() {
    const levelQuestions = getCurrentLevelQuestions();
    // Remove $ delimiters and normalize whitespace
    const userInput = latexInput.value.trim()
        .replace(/\s+/g, '')  // Remove all whitespace
        .replace(/^\$|\$$/g, '');
    const question = questions[levelQuestions[currentQuestionIndex]];
    const correctAnswer = question.target.trim()
        .replace(/\s+/g, '')  // Remove all whitespace
        .replace(/^\$|\$$/g, '');
    
    // Get all valid answers (target + alternatives)
    const validAnswers = [correctAnswer];
    if (question.alternatives && question.alternatives.length > 0) {
        validAnswers.push(...question.alternatives.map(alt => 
            alt.trim().replace(/\s+/g, '').replace(/^\$|\$$/g, '')
        ));
    }
    
    // Check if user input matches any valid answer
    const isCorrect = validAnswers.some(answer => userInput === answer);
    
    if (isCorrect) {
        feedback.textContent = 'Correct! Well done.';
        feedback.className = 'feedback correct';
        nextButton.disabled = false;
    } else {
        feedback.textContent = 'Not quite. Try again or check the hint.';
        feedback.className = 'feedback incorrect';
    }
    feedback.style.display = 'block';
});

// Show hint button
hintButton.addEventListener('click', function() {
    const levelQuestions = getCurrentLevelQuestions();
    hintArea.textContent = questions[levelQuestions[currentQuestionIndex]].hint;
    hintArea.style.display = 'block';
});

// Next question button
nextButton.addEventListener('click', function() {
    currentQuestionIndex++;
    loadQuestion(currentQuestionIndex);
});

// Show Answer button
showAnswerButton.addEventListener('click', function() {
    targetDisplay.style.display = 'block';
    showAnswerButton.classList.add('hidden');
});

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    fetchQuestions();
});