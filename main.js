const drawButton = document.getElementById('draw-button');
const themeButton = document.getElementById('theme-button');
const numbersDisplay = document.querySelector('.numbers-display');

// Initialize theme
const currentTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', currentTheme);
updateThemeButton(currentTheme);

themeButton.addEventListener('click', () => {
    const theme = document.documentElement.getAttribute('data-theme');
    const newTheme = theme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeButton(newTheme);
});

function updateThemeButton(theme) {
    themeButton.textContent = theme === 'light' ? 'Dark Mode' : 'Light Mode';
}

drawButton.addEventListener('click', () => {
    drawNumbers();
});

function getBallColor(number) {
    if (number <= 10) return '#f4a261'; // Orange
    if (number <= 20) return '#2a9d8f'; // Teal
    if (number <= 30) return '#e76f51'; // Coral
    if (number <= 40) return '#264653'; // Dark Blue
    return '#e9c46a'; // Yellow
}

function drawNumbers() {
    numbersDisplay.innerHTML = '';
    const numbers = new Set();

    while (numbers.size < 6) {
        const randomNumber = Math.floor(Math.random() * 45) + 1;
        numbers.add(randomNumber);
    }

    const sortedNumbers = Array.from(numbers).sort((a, b) => a - b);

    sortedNumbers.forEach((number, index) => {
        setTimeout(() => {
            const ball = document.createElement('div');
            ball.classList.add('number-ball');
            ball.style.backgroundColor = getBallColor(number);
            ball.textContent = number;
            numbersDisplay.appendChild(ball);
        }, index * 300); // Stagger the animation
    });
}
