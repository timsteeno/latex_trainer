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

// State variables
let questions = [];
let currentQuestionIndex = 0;

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
        
        // Initialize first question
        loadQuestion(currentQuestionIndex);
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
    
    const question = questions[index];
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
    const userInput = latexInput.value.trim().replace(/\s+/g, ' ').replace(/^\$|\$$/g, '');
    const correctAnswer = questions[currentQuestionIndex].target.trim().replace(/\s+/g, ' ').replace(/^\$|\$$/g, '');
    
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
    hintArea.textContent = questions[currentQuestionIndex].hint;
    hintArea.style.display = 'block';
});

// Next question button
nextButton.addEventListener('click', function() {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        loadQuestion(currentQuestionIndex);
    } else {
        // End of questions
        promptText.textContent = 'Congratulations! You\'ve completed all questions.';
        targetDisplay.innerHTML = '';
        latexInput.value = '';
        previewArea.innerHTML = '';
        checkButton.disabled = true;
        hintButton.disabled = true;
        nextButton.disabled = true;
        progressInfo.textContent = 'All questions completed';
    }
});

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    fetchQuestions();
});