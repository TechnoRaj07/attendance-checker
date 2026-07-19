// ==========================================
// Custom Animations (Non-CSS)
// ==========================================

// Glitch text effect
const initGlitchEffect = () => {
    const glitchTexts = document.querySelectorAll('.glitch-text');
    
    glitchTexts.forEach(text => {
        const originalText = text.innerText;
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*';
        
        text.addEventListener('mouseover', () => {
            let iterations = 0;
            
            const interval = setInterval(() => {
                text.innerText = text.innerText.split('').map((letter, index) => {
                    if (index < iterations) {
                        return originalText[index];
                    }
                    return letters[Math.floor(Math.random() * letters.length)];
                }).join('');
                
                if (iterations >= originalText.length) {
                    clearInterval(interval);
                    text.innerText = originalText;
                }
                
                iterations += 1/3;
            }, 30);
        });
    });
};

document.addEventListener('DOMContentLoaded', initGlitchEffect);
