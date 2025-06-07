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
                break;
            case 'rad':
                angleMode = 'rad';
                // Visually indicate mode change if desired
                document.querySelector('[data-value="rad"]').style.backgroundColor = '#e67e22';
                document.querySelector('[data-value="deg"]').style.backgroundColor = '#273644';
                break;
            case 'deg':
                angleMode = 'deg';
                document.querySelector('[data-value="deg"]').style.backgroundColor = '#e67e22';
                document.querySelector('[data-value="rad"]').style.backgroundColor = '#273644';
                break;
            case 'inv':
                // Toggle inverse functions (sin <-> asin etc.)
                // This would require changing the text/data-value of buttons
                // For simplicity, I'll assume 'asin' etc. are dedicated buttons or an 'Inv' mode changes other buttons' behavior.
                // Here, we'll just log it. Actual implementation would be more involved.
                console.log("Inverse mode toggled. Implement button text/function changes.");
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
                let evalExpression = currentInput.replace(/π/g, 'Math.PI').replace(/e/g, 'Math.E');
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
        // Reset angle mode indicator if any
        document.querySelector('[data-value="rad"]').style.backgroundColor = '#273644';
        document.querySelector('[data-value="deg"]').style.backgroundColor = '#273644';
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
    clearAll(); // Sets initial display to 0
    updateDisplay();
    document.querySelector('[data-value="rad"]').style.backgroundColor = '#e67e22'; // Default Rad mode

});