// Function to check the strength of the provided password
function checkPasswordStrength(password) {
    let strength = 0;

    // Define password requirements as a set of checks
    const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    // Loop through each requirement and update UI indicators
    Object.entries(requirements).forEach(([key, isMet]) => {
        const el = document.querySelector(`.requirement[data-requirement="${key}"]`);
        if (el) {
            // Add or remove CSS classes based on whether requirement is met
            el.classList.toggle("met", isMet);
            el.classList.toggle("unmet", !isMet);
        }
        if (isMet) strength++; // Increment strength score for each met requirement
    });

    // Get strength bar and text elements
    const bar = document.querySelector('.strength-bar');
    const text = document.querySelector('.strength-text');
    bar.className = 'strength-bar'; // Reset class list

    // Update strength bar color and width based on strength score
    if (strength <= 2) {
        bar.classList.add('weak');
        bar.style.width = '33%';
        text.textContent = 'Weak';
    } else if (strength <= 4) {
        bar.classList.add('medium');
        bar.style.width = '66%';
        text.textContent = 'Medium';
    } else {
        bar.classList.add('strong');
        bar.style.width = '100%';
        text.textContent = 'Strong';
    }
}

// Add event listeners after the page is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    const pwInput = document.getElementById("exampleInputPassword1");

    // Attach an input event listener to the password field
    if (pwInput) {
        pwInput.addEventListener("input", () => {
            checkPasswordStrength(pwInput.value);
        });
    }

    // Initialize all requirement items as 'unmet' by default
    document.querySelectorAll('.requirement').forEach(req => req.classList.add('unmet'));
});
