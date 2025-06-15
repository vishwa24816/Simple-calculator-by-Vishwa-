document.addEventListener('DOMContentLoaded', () => {
    const display = document.getElementById('display');
    const buttons = document.querySelectorAll('.btn');
    let currentInput = "";
    let operator = null;
    let previousInput = "";
    let memory = 0;
    let shouldResetDisplay = false;
    let angleMode = 'rad'; // 'rad' or 'deg'
    let lastAnswer = null;
    let isInverseActive = false;

    // Helper functions for angle conversion
    function degToRad(degrees) {
        return degrees * (Math.PI / 180);
    }

    function radToDeg(radians) {
        return radians * (180 / Math.PI);
    }

    // Map for inverse functions and their button text/data-values
    // Structure: originalValue: { invValue, origText, invText, buttonSelector (optional for direct query) }
    const inverseFunctionMap = {
        'sin': { invValue: 'asin', origText: 'sin', invText: 'sin<sup>-1</sup>' },
        'cos': { invValue: 'acos', origText: 'cos', invText: 'cos<sup>-1</sup>' },
        'tan': { invValue: 'atan', origText: 'tan', invText: 'tan<sup>-1</sup>' },
        'sinh': { invValue: 'asinh', origText: 'sinh', invText: 'sinh<sup>-1</sup>' },
        'cosh': { invValue: 'acosh', origText: 'cosh', invText: 'cosh<sup>-1</sup>' },
        'tanh': { invValue: 'atanh', origText: 'tanh', invText: 'tanh<sup>-1</sup>' },
        'log': { invValue: '10^x', origText: 'log', invText: '10<sup>x</sup>' },
        'ln': { invValue: 'e^x', origText: 'ln', invText: 'e<sup>x</sup>' },
        'sqrt': { invValue: 'x^2', origText: '√', invText: 'x<sup>2</sup>' },
        'log2': { invValue: '2^x', origText: 'log<sub>2</sub>', invText: '2<sup>x</sup>' },
    };


    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const value = button.dataset.value;
            const type = button.classList;

            if (type.contains('number') || value === '.') {
                handleNumber(value);
            } else if (type.contains('operator') && !['(', ')', '%'].includes(value)) {
                handleOperator(value);
            } else if (type.contains('function') || ['(', ')', '%'].includes(value)) {
                handleFunction(value);
            } else if (type.contains('equals')) {
                handleEquals();
            } else if (type.contains('clear-all')) {
                clearAll();
            } else if (type.contains('clear-entry')) {
                clearEntry();
            } else if (type.contains('backspace')) {
                backspace();
            } else if (type.contains('memory')) {
                handleMemory(value);
            }
            updateDisplay();
        });
    });

    function updateDisplay() {
        display.value = currentInput || previousInput || "0";
    }

    function handleNumber(value) {
        if (shouldResetDisplay) {
            currentInput = "";
            shouldResetDisplay = false;
        }
        if (value === '.' && currentInput.includes('.')) return;
        currentInput += value;
    }

    function handleOperator(op) {
        if (currentInput === "" && previousInput === "") return; // Nothing to operate on
        if (currentInput === "" && previousInput !== "" && operator) { // Change operator
            operator = op;
            return;
        }
        if (previousInput !== "" && operator && currentInput !== "") {
            calculate(); // Calculate intermediate result
        }
        
        operator = op;
        previousInput = currentInput || previousInput;
        currentInput = "";
        shouldResetDisplay = false; // Don't reset display until a number is pressed
    }
    
    function handleFunction(funcValue) {
        shouldResetDisplay = false;
        let num;

        switch (funcValue) {
            case '(':
            case ')':
                currentInput += funcValue;
                break;
            case '%':
                if (currentInput) {
                     // Percentage typically means currentInput / 100
                     // Or if previousInput and operator exist, it's previousInput * (currentInput / 100)
                    if (previousInput && operator) {
                        currentInput = (parseFloat(previousInput) * (parseFloat(currentInput) / 100)).toString();
                    } else {
                        currentInput = (parseFloat(currentInput) / 100).toString();
                    }
                }
                break;
            case 'sin':
            case 'cos':
            case 'tan':
                if (!currentInput) return;
                num = parseFloat(currentInput);
                if (angleMode === 'deg') num = num * (Math.PI / 180); // Convert to radians
                currentInput = Math[funcValue](num).toString();
                break;
            case 'asin': // Inverse functions (if 'Inv' is active)
            case 'acos':
            case 'atan':
                 if (!currentInput) return;
                 num = parseFloat(currentInput);
                 let result = Math[funcValue](num);
                 if (angleMode === 'deg') result = result * (180 / Math.PI); // Convert to degrees
                 currentInput = result.toString();
                 break;
            case 'log': // base 10
                if (!currentInput) return;
                currentInput = Math.log10(parseFloat(currentInput)).toString();
                break;
            case 'ln': // natural log
                if (!currentInput) return;
                currentInput = Math.log(parseFloat(currentInput)).toString();
                break;
            case 'sqrt':
                if (!currentInput) return;
                currentInput = Math.sqrt(parseFloat(currentInput)).toString();
                break;
            case '^': // For x^y, treat it like an operator
                handleOperator('^');
                return; // Exit to avoid double updateDisplay
            case '!': // Factorial
                if (!currentInput) return;
                num = parseInt(currentInput);
                if (num < 0) { currentInput = "Error"; break; }
                let fact = 1;
                for (let i = 2; i <= num; i++) fact *= i;
                currentInput = fact.toString();
                break;
            case 'π':
                currentInput = Math.PI.toString();
                break;
            case 'e':
                currentInput = Math.E.toString();
                shouldResetDisplay = true;
                break;
            // New functions from here:
            case 'x^2':
                if (!currentInput || isNaN(parseFloat(currentInput))) { currentInput = "Error: Invalid input"; shouldResetDisplay = true; break; }
                currentInput = (parseFloat(currentInput) ** 2).toString();
                break;
            case 'x^3':
                if (!currentInput || isNaN(parseFloat(currentInput))) { currentInput = "Error: Invalid input"; shouldResetDisplay = true; break; }
                currentInput = (parseFloat(currentInput) ** 3).toString();
                break;
            case '1/x':
                if (!currentInput || isNaN(parseFloat(currentInput))) { currentInput = "Error: Invalid input"; shouldResetDisplay = true; break; }
                num = parseFloat(currentInput);
                if (num === 0) { currentInput = "Error: Division by zero"; shouldResetDisplay = true; break; }
                currentInput = (1 / num).toString();
                break;
            case 'abs':
                if (!currentInput || isNaN(parseFloat(currentInput))) { currentInput = "Error: Invalid input"; shouldResetDisplay = true; break; }
                currentInput = Math.abs(parseFloat(currentInput)).toString();
                break;
            case 'round':
                if (!currentInput || isNaN(parseFloat(currentInput))) { currentInput = "Error: Invalid input"; shouldResetDisplay = true; break; }
                currentInput = Math.round(parseFloat(currentInput)).toString();
                break;
            case 'floor':
                if (!currentInput || isNaN(parseFloat(currentInput))) { currentInput = "Error: Invalid input"; shouldResetDisplay = true; break; }
                currentInput = Math.floor(parseFloat(currentInput)).toString();
                break;
            case 'ceil':
                if (!currentInput || isNaN(parseFloat(currentInput))) { currentInput = "Error: Invalid input"; shouldResetDisplay = true; break; }
                currentInput = Math.ceil(parseFloat(currentInput)).toString();
                break;
            // Cases for sinh, cosh, tanh, asinh, acosh, atanh, 10^x, 2^x, e^x, log2, x^2
            // will be handled by the dynamic data-value attribute set by updateInverseButtons.
            // For example, pressing 'sin' button (data-value="sin") will trigger 'sin'.
            // If 'Inv' is active, 'sin' button's data-value becomes 'asin', so it triggers 'asin'.
            // The specific implementations for these functions are below:
            case 'sinh':
            case 'cosh':
            case 'tanh':
                if (!currentInput || isNaN(parseFloat(currentInput))) { currentInput = "Error: Invalid input"; shouldResetDisplay = true; break; }
                num = parseFloat(currentInput);
                if (angleMode === 'deg') num = degToRad(num);
                currentInput = Math[funcValue](num).toString();
                break;
            case 'asinh':
            case 'acosh':
            case 'atanh':
                if (!currentInput || isNaN(parseFloat(currentInput))) { currentInput = "Error: Invalid input"; shouldResetDisplay = true; break; }
                num = parseFloat(currentInput);
                if (funcValue === 'acosh' && num < 1) { currentInput = "Error: Domain"; shouldResetDisplay = true; break; }
                if (funcValue === 'atanh' && (num <= -1 || num >= 1)) { currentInput = "Error: Domain"; shouldResetDisplay = true; break; }
                let result_hyper_inv = Math[funcValue](num);
                if (angleMode === 'deg') result_hyper_inv = radToDeg(result_hyper_inv);
                currentInput = result_hyper_inv.toString();
                break;
            case '10^x':
                if (!currentInput || isNaN(parseFloat(currentInput))) { currentInput = "Error: Invalid input"; shouldResetDisplay = true; break; }
                currentInput = (10 ** parseFloat(currentInput)).toString();
                break;
            case '2^x':
                if (!currentInput || isNaN(parseFloat(currentInput))) { currentInput = "Error: Invalid input"; shouldResetDisplay = true; break; }
                currentInput = (2 ** parseFloat(currentInput)).toString();
                break;
            case 'e^x': // This is exp(x)
                if (!currentInput || isNaN(parseFloat(currentInput))) { currentInput = "Error: Invalid input"; shouldResetDisplay = true; break; }
                currentInput = Math.exp(parseFloat(currentInput)).toString();
                break;
            case 'log2':
                if (!currentInput || isNaN(parseFloat(currentInput))) { currentInput = "Error: Invalid input"; shouldResetDisplay = true; break; }
                num = parseFloat(currentInput);
                if (num <= 0) { currentInput = "Error: Domain"; shouldResetDisplay = true; break; }
                currentInput = Math.log2(num).toString();
                break;
            case 'rand':
                currentInput = Math.random().toString();
                shouldResetDisplay = true;
                break;
            case 'phi': // Golden Ratio φ
                currentInput = ((1 + Math.sqrt(5)) / 2).toString();
                shouldResetDisplay = true;
                break;
            // End of new functions
            case 'rad':
                angleMode = 'rad';
                updateAngleModeButtons();
                break;
            case 'deg':
                angleMode = 'deg';
                updateAngleModeButtons();
                break;
            case 'inv':
                isInverseActive = !isInverseActive;
                updateInverseButtons();
                break;
            case 'ans':
                if (lastAnswer !== null) {
                    currentInput = lastAnswer.toString();
                }
                break;
            case 'exp': // For scientific notation 1.2 E 3 -> 1.2 * 10^3
                currentInput += "E"; // Let eval handle this with numbers like "2.5E+3"
                break;
            default:
                // For functions not yet implemented or complex ones like x^2 (could be currentInput * currentInput)
                if(currentInput) currentInput = "Func Error";
        }
        shouldResetDisplay = true; // Result of function shown, next number should clear it
    }

    function handleEquals() {
        if (previousInput !== "" && operator && currentInput !== "") {
            calculate();
            operator = null; // Ready for new calculation chain starting with result
            // previousInput = ""; // Result is now the new currentInput for chaining
        } else if (currentInput.includes('(') || currentInput.includes(')')) {
            // Try to evaluate expression with parentheses
            try {
                // Sanitize for security if necessary, but for button input it's less of a risk
                // Replace math symbols with JS equivalents if needed for eval
                let evalExpression = currentInput
                                        .replace(/π/g, 'Math.PI')
                                        .replace(/e/g, 'Math.E')
                                        .replace(/φ/g, '((1 + Math.sqrt(5)) / 2)'); // Added phi replacement
                // For x^y, might need custom handling before eval or a replace function
                // evalExpression = evalExpression.replace(/\^/g, '**'); // If not handled by calculate
                
                const result = eval(evalExpression);
                if (isNaN(result) || !isFinite(result)) {
                    currentInput = "Error";
                } else {
                    currentInput = result.toString();
                    lastAnswer = result;
                }
            } catch (error) {
                currentInput = "Error";
            }
            previousInput = "";
            operator = null;
            shouldResetDisplay = true;
        }
        shouldResetDisplay = true;
    }

    function calculate() {
        let result;
        const prev = parseFloat(previousInput);
        const current = parseFloat(currentInput);

        if (isNaN(prev) || isNaN(current)) {
            currentInput = "Error";
            previousInput = "";
            operator = null;
            return;
        }

        switch (operator) {
            case '+': result = prev + current; break;
            case '-': result = prev - current; break;
            case '*': result = prev * current; break;
            case '/': result = current === 0 ? "Error" : prev / current; break;
            case '^': result = Math.pow(prev, current); break;
            // Percentage handled in handleFunction or here if preferred
            default: return;
        }
        
        if (result === "Error" || isNaN(result) || !isFinite(result)) {
            currentInput = "Error";
        } else {
            currentInput = result.toString();
            lastAnswer = result;
        }
        
        operator = null;
        previousInput = ""; // Calculation done, result is in currentInput
    }

    function clearAll() {
        currentInput = "";
        previousInput = "";
        operator = null;
        shouldResetDisplay = false;
        lastAnswer = null;
        angleMode = 'rad'; // Reset to default
        if (isInverseActive) {
            isInverseActive = false; // Reset inverse mode
            updateInverseButtons(); // Reset button texts/values only if it was active
        }
        updateAngleModeButtons(); // Ensure Rad/Deg buttons are correctly styled
    }

    function clearEntry() {
        currentInput = "";
        shouldResetDisplay = false;
    }

    function backspace() {
        currentInput = currentInput.slice(0, -1);
    }

    function handleMemory(memOp) {
        const val = parseFloat(currentInput || display.value); // Use display value if currentInput is empty (e.g. after =)
        if (isNaN(val) && memOp !== 'MR' && memOp !== 'MC') return;

        switch (memOp) {
            case 'M+': memory += val; break;
            case 'M-': memory -= val; break;
            case 'MR': currentInput = memory.toString(); shouldResetDisplay = true; break;
            case 'MC': memory = 0; break;
            case 'MS': memory = val; break; // Store current display/input value
        }
    }

    // Initialize display and Rad/Deg button style
    clearAll(); // Sets initial display to 0, resets modes and button displays
    updateDisplay(); // Make sure display shows "0" or initial state

    // DOMContentLoaded ends
});

// Helper function to update Rad/Deg button styles
function updateAngleModeButtons() {
    const radButton = document.querySelector('[data-value="rad"]');
    const degButton = document.querySelector('[data-value="deg"]');
    if (angleMode === 'rad') {
        radButton.classList.add('active-mode');
        degButton.classList.remove('active-mode');
    } else {
        degButton.classList.add('active-mode');
        radButton.classList.remove('active-mode');
    }
}

// Helper function to update buttons based on Inverse mode
function updateInverseButtons() {
    const invButton = document.querySelector('[data-value="inv"]');
    if (isInverseActive) {
        invButton.classList.add('active-mode');
    } else {
        invButton.classList.remove('active-mode');
    }

    for (const originalValue in inverseFunctionMap) {
        const button = document.querySelector(`.btn[data-value="${originalValue}"], .btn[data-value="${inverseFunctionMap[originalValue].invValue}"]`);
        if (button) {
            const config = inverseFunctionMap[originalValue];
            if (isInverseActive) {
                button.dataset.value = config.invValue;
                button.innerHTML = config.invText;
            } else {
                button.dataset.value = originalValue;
                button.innerHTML = config.origText;
            }
        }
    }
}