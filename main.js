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

// Shuffle array using Fisher-Yates algorithm
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
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
        
        // Initialize question order
        questionOrder = Array.from({length: questions.length}, (_, i) => i);
        shuffleArray(questionOrder);
        
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
    
    const question = questions[questionOrder[index]];
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
    progressInfo.textContent = `Question ${index + 1} of ${questions.length} (${question.level})`;
}

// Preview the latex input
latexInput.addEventListener('input', function() {
    previewArea.textContent = '$' + latexInput.value + '$';
    MathJax.typesetPromise([previewArea]).catch(err => console.error(err));
});

// Check answer button
checkButton.addEventListener('click', function() {
    // Remove $ delimiters and normalize whitespace
    const userInput = latexInput.value.trim()
        .replace(/\s+/g, '')  // Remove all whitespace
        .replace(/^\$|\$$/g, '');
    const correctAnswer = questions[questionOrder[currentQuestionIndex]].target.trim()
        .replace(/\s+/g, '')  // Remove all whitespace
        .replace(/^\$|\$$/g, '');
    
    // Compare the normalized strings
    if (userInput === correctAnswer) {
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
    hintArea.textContent = questions[questionOrder[currentQuestionIndex]].hint;
    hintArea.style.display = 'block';
});

// Next question button
nextButton.addEventListener('click', function() {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        loadQuestion(currentQuestionIndex);
    } else {
        // End of questions - reshuffle and start over
        shuffleArray(questionOrder);
        currentQuestionIndex = 0;
        loadQuestion(currentQuestionIndex);
    }
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