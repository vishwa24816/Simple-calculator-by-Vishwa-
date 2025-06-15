// test_calculator.js - Jasmine Test Specs for calculator.js

describe("Calculator Logic", function() {
    let display;
    let buttons = {}; // To store button elements for easy access

    const FLOAT_PRECISION = 8; // Decimal places for float comparison

    // Helper function to simulate button click
    function clickButton(dataValue) {
        const button = document.querySelector(`button[data-value="${dataValue}"]`);
        if (button) {
            button.click();
        } else {
            console.warn(`Button with data-value "${dataValue}" not found for click simulation.`);
        }
    }

    // Helper to get display value, formatted for float comparison
    function getDisplayValue() {
        const val = display.value;
        if (val.toLowerCase().includes("error")) return val; // Return error messages as is
        const num = parseFloat(val);
        if (isNaN(num)) return val; // Return non-numeric strings as is (e.g. for placeholder)
        return parseFloat(num.toFixed(FLOAT_PRECISION));
    }

    // Helper to get a button's text content
    function getButtonText(dataValue) {
        // For buttons that change text, we might need to query based on original data-value
        // or ensure the query can find it if data-value also changes.
        // The inverseFunctionMap in calculator.js changes data-value, so this should be fine.
        const button = document.querySelector(`button[data-value="${dataValue}"]`);
        return button ? button.innerHTML.trim() : null;
    }

    // This will run before each test in this suite
    beforeEach(() => {
        // The calculator.js script should have initialized its DOM elements when it loaded.
        // We need to ensure our references are up-to-date for each test.
        display = document.getElementById('display');

        // Manually call clearAll to reset state before each test.
        // calculator.js's clearAll() is in the global scope because it's not wrapped in its own module/closure.
        // It also updates the display and button states.
        clearAll();

        // Verify reset (currentInput should be "" and display.value "0" after clearAll and updateDisplay)
        // This check is mainly for sanity during test development.
        if (display.value !== "0") {
             console.warn(`Display not '0' after clearAll in beforeEach. Current display: '${display.value}'`);
        }
    });

    describe("Initialization and Basic Input", function() {
        it("should display '0' initially after AC/clearAll", function() {
            expect(getDisplayValue()).toBe(0);
        });

        it("should handle single digit input", function() {
            clickButton('7');
            expect(getDisplayValue()).toBe(7);
        });

        it("should handle multiple digit input", function() {
            clickButton('1');
            clickButton('2');
            clickButton('3');
            expect(getDisplayValue()).toBe(123);
        });

        it("should handle decimal input", function() {
            clickButton('1');
            clickButton('.');
            clickButton('2');
            clickButton('5');
            expect(getDisplayValue()).toBe(1.25);
        });

        it("should allow only one decimal point", function() {
            clickButton('1');
            clickButton('.');
            clickButton('2');
            clickButton('.');
            clickButton('5');
            expect(getDisplayValue()).toBe(1.25);
        });

        it("should clear entry (CE) correctly", function() {
            clickButton('1');
            clickButton('2');
            clickButton('3');
            clickButton('CE');
            // currentInput becomes "", display becomes "0" via updateDisplay
            expect(getDisplayValue()).toBe(0);
            clickButton('4'); // Check if new input starts fresh
            expect(getDisplayValue()).toBe(4);
        });

        it("should handle backspace (DEL) correctly", function() {
            clickButton('1');
            clickButton('2');
            clickButton('3');
            clickButton('DEL');
            expect(getDisplayValue()).toBe(12);
            clickButton('DEL');
            expect(getDisplayValue()).toBe(1);
            clickButton('DEL');
            expect(getDisplayValue()).toBe(0);
            clickButton('DEL');
            expect(getDisplayValue()).toBe(0);
        });
    });

    describe("Arithmetic Operations", function() {
        it("should perform addition: 2 + 3 = 5", function() {
            clickButton('2');
            clickButton('+');
            clickButton('3');
            clickButton('=');
            expect(getDisplayValue()).toBe(5);
        });

        it("should perform subtraction: 10 - 4 = 6", function() {
            clickButton('1');
            clickButton('0');
            clickButton('-');
            clickButton('4');
            clickButton('=');
            expect(getDisplayValue()).toBe(6);
        });

        it("should perform multiplication: 5 * 4 = 20", function() {
            clickButton('5');
            clickButton('*');
            clickButton('4');
            clickButton('=');
            expect(getDisplayValue()).toBe(20);
        });

        it("should perform division: 20 / 4 = 5", function() {
            clickButton('2');
            clickButton('0');
            clickButton('/');
            clickButton('4');
            clickButton('=');
            expect(getDisplayValue()).toBe(5);
        });

        it("should handle division by zero: 1 / 0 = Error", function() {
            clickButton('1');
            clickButton('/');
            clickButton('0');
            clickButton('=');
            expect(getDisplayValue()).toMatch(/Error/i);
        });

        it("should handle chained operations: 2 + 3 * 2 = 10 (sequential evaluation)", function() {
            clickButton('2');
            clickButton('+');
            clickButton('3');
            clickButton('*'); // Calculates 2+3=5; previousInput=5, operator='*'
            clickButton('2');
            clickButton('='); // Calculates 5*2=10
            expect(getDisplayValue()).toBe(10);
        });

        it("should handle percentage: 50 + 10% (of 50) = 55", function() {
            clickButton('5');
            clickButton('0');
            clickButton('+');
            clickButton('1');
            clickButton('0');
            clickButton('%'); // currentInput becomes 5 (10% of 50)
            clickButton('='); // previousInput (50) + currentInput (5)
            expect(getDisplayValue()).toBe(55);
        });
    });

    describe("Scientific Functions", function() {
        it("sqrt(25) = 5", function() {
            clickButton('2');
            clickButton('5');
            clickButton('sqrt');
            expect(getDisplayValue()).toBe(5);
        });

        it("x^2: 5^2 = 25 (using dedicated x^2 button)", function() {
            // Need to ensure 'Inv' is OFF for this button if 'sqrt' is its pair.
            // The current inverseFunctionMap has 'sqrt' <-> 'x^2'.
            // So, if 'Inv' is off, the button with original text 'x^2' might not exist if its data-value was 'x^2' initially.
            // Let's assume the button for x^2 is always available or Inv handles it.
            // The HTML has a button data-value="x^2". If Inv is active, sqrt becomes x^2.
            // If Inv is OFF, we need to click the button that is currently x^2.
            // The map is {'sqrt': { invValue: 'x^2', ...}}. So button starts as 'sqrt'.
            // To test 'x^2' directly as per HTML, Inv must be ON or it's a separate button not in map.
            // The HTML structure has a distinct `data-value="x^2"` button.
            // This button is ALSO the target for 'Inv' + 'sqrt'.
            // So, if 'Inv' is OFF, 'sqrt' is shown. If 'Inv' is ON, 'x^2' is shown on that button.
            // The test "x^2 (sqrt inverse) of 5 = 25" covers Inv case.
            // This test assumes a button *currently* showing x^2 and having data-value x^2 is clicked.
            // This will be the case if Inv is ON and we click the sqrt button, or if there's a separate x^2 button.
            // The HTML *does* have a separate button: <button class="btn function" data-value="x^2">x<sup>2</sup></button>
            // This button's data-value is 'x^2'. It is *also* targeted by the inverse map for 'sqrt'.
            // This might lead to confusion if not handled carefully in `updateInverseButtons`.
            // `updateInverseButtons` queries for `".btn[data-value="${originalValue}"], .btn[data-value="${inverseFunctionMap[originalValue].invValue}"]"`
            // For 'sqrt', it queries for `[data-value="sqrt"]` or `[data-value="x^2"]`. This should find the button.
            // If Inv is OFF, it sets it to 'sqrt'. If Inv is ON, it sets it to 'x^2'.
            // So, to click the button that *is* 'x^2', 'Inv' must be ON.

            // To test the specific button <button data-value="x^2">, we assume 'Inv' state is managed.
            // If 'Inv' is OFF, clicking data-value="x^2" should still work if calculator.js handles it.
            // Let's assume calculator.js handles data-value="x^2" regardless of Inv state for that specific button.
            clickButton('5');
            clickButton('x^2'); // direct click on the button with data-value="x^2"
            expect(getDisplayValue()).toBe(25);
        });

        it("x^3: 2^3 = 8", function() {
            clickButton('2');
            clickButton('x^3');
            expect(getDisplayValue()).toBe(8);
        });

        it("1/x: 1/4 = 0.25", function() {
            clickButton('4');
            clickButton('1/x');
            expect(getDisplayValue()).toBe(0.25);
        });

        it("1/x: 1/0 = Error", function() {
            clickButton('0');
            clickButton('1/x');
            expect(getDisplayValue()).toMatch(/Error/i);
        });

        it("log10(100) = 2", function() {
            clickButton('1');
            clickButton('0');
            clickButton('0');
            clickButton('log');
            expect(getDisplayValue()).toBe(2);
        });

        it("ln(e) = 1", function() {
            clickButton('e');
            clickButton('ln');
            expect(getDisplayValue()).toBe(1);
        });

        it("abs(-10) = 10", function() {
            // Simulate direct input of -10
            currentInput = "-10";
            document.getElementById('display').value = currentInput; // Manually set display for this non-click input
            clickButton('abs');
            expect(getDisplayValue()).toBe(10);
        });

        it("round(3.14) = 3", function() {
            currentInput = "3.14"; document.getElementById('display').value = currentInput;
            clickButton('round');
            expect(getDisplayValue()).toBe(3);
        });

        it("floor(3.99) = 3", function() {
            currentInput = "3.99"; document.getElementById('display').value = currentInput;
            clickButton('floor');
            expect(getDisplayValue()).toBe(3);
        });

        it("ceil(3.01) = 4", function() {
            currentInput = "3.01"; document.getElementById('display').value = currentInput;
            clickButton('ceil');
            expect(getDisplayValue()).toBe(4);
        });

        it("x^y: 2^3 = 8", function() {
            clickButton('2');
            clickButton('^');
            clickButton('3');
            clickButton('=');
            expect(getDisplayValue()).toBe(8);
        });
    });

    describe("Angle Mode (Rad/Deg) and Trigonometric Functions", function() {
        it("sin(90 deg) = 1", function() {
            clickButton('deg');
            clickButton('9');
            clickButton('0');
            clickButton('sin');
            expect(getDisplayValue()).toBe(1);
        });

        it("sin(PI/2 rad) = 1", function() {
            clickButton('rad');
            currentInput = (Math.PI / 2).toString(); document.getElementById('display').value = currentInput;
            clickButton('sin');
            expect(getDisplayValue()).toBe(1);
        });

        it("cos(0 deg) = 1", function() {
            clickButton('deg');
            clickButton('0');
            clickButton('cos');
            expect(getDisplayValue()).toBe(1);
        });

        it("tan(45 deg) = 1", function() {
            clickButton('deg');
            clickButton('4');
            clickButton('5');
            clickButton('tan');
            expect(getDisplayValue()).toBe(1);
        });
    });

    describe("Inverse ('Inv') Mode and Function Toggling", function() {
        beforeEach(function() {
            clickButton('rad'); // Default to RAD for these tests
        });

        it("should toggle 'sin' to 'sin<sup>-1</sup>' text and back", function() {
            // Initial state: Inv OFF, button is 'sin'
            const sinButton = document.querySelector('button[data-value="sin"]');
            expect(sinButton.innerHTML.trim()).toBe('sin');

            clickButton('inv'); // Inv ON
            // The button's data-value is now 'asin', text is 'sin<sup>-1</sup>'
            expect(sinButton.innerHTML.trim()).toBe('sin<sup>-1</sup>');
            expect(sinButton.dataset.value).toBe('asin');

            clickButton('inv'); // Inv OFF
            // Button is back to 'sin'
            expect(sinButton.innerHTML.trim()).toBe('sin');
            expect(sinButton.dataset.value).toBe('sin');
        });

        it("asin(1) in RAD = PI/2 (approx 1.57079633)", function() {
            clickButton('inv');
            clickButton('1');
            // The 'sin' button now has data-value 'asin'
            const sinButtonAsAsin = document.querySelector('button[data-value="asin"]');
            sinButtonAsAsin.click();
            expect(getDisplayValue()).toBe(parseFloat((Math.PI / 2).toFixed(FLOAT_PRECISION)));
        });

        it("e^1 (ln inverse) = e (approx 2.71828183)", function() {
            clickButton('inv');
            const lnButtonAsExp = document.querySelector('button[data-value="e^x"]'); // Original ln button is now e^x
            expect(lnButtonAsExp.innerHTML.trim()).toBe('e<sup>x</sup>');
            clickButton('1');
            lnButtonAsExp.click();
            expect(getDisplayValue()).toBe(parseFloat(Math.E.toFixed(FLOAT_PRECISION)));
        });

        it("x^2 (sqrt inverse) of 5 = 25", function() {
            clickButton('inv');
            const sqrtButtonAsSqr = document.querySelector('button[data-value="x^2"]'); // Original sqrt button is now x^2
            expect(sqrtButtonAsSqr.innerHTML.trim()).toBe('x<sup>2</sup>');
            clickButton('5');
            sqrtButtonAsSqr.click();
            expect(getDisplayValue()).toBe(25);
        });
    });

    describe("Error Handling for Domain Specific Functions", function() {
        it("log of negative number should be Error", function() {
            currentInput = "-1"; document.getElementById('display').value = currentInput;
            clickButton('log');
            expect(getDisplayValue()).toMatch(/Error/i);
        });

        it("ln of 0 should be Error", function() {
            clickButton('0');
            clickButton('ln');
            expect(getDisplayValue()).toMatch(/Error/i);
        });

        it("acosh(0) should be Error", function() {
            clickButton('inv');
            clickButton('0');
            const coshButtonAsAcosh = document.querySelector('button[data-value="acosh"]');
            coshButtonAsAcosh.click();
            expect(getDisplayValue()).toMatch(/Error/i);
        });

        it("atanh(1) should be Error", function() {
            clickButton('inv');
            clickButton('1');
            const tanhButtonAsAtanh = document.querySelector('button[data-value="atanh"]');
            tanhButtonAsAtanh.click();
            expect(getDisplayValue()).toMatch(/Error/i);
        });
    });

    describe("Constants", function() {
        it("should insert PI", function() {
            clickButton('π');
            expect(getDisplayValue()).toBe(parseFloat(Math.PI.toFixed(FLOAT_PRECISION)));
        });
        it("should insert E", function() {
            clickButton('e');
            expect(getDisplayValue()).toBe(parseFloat(Math.E.toFixed(FLOAT_PRECISION)));
        });
        it("should insert Golden Ratio (phi)", function() {
            clickButton('phi');
            const phi = (1 + Math.sqrt(5)) / 2;
            expect(getDisplayValue()).toBe(parseFloat(phi.toFixed(FLOAT_PRECISION)));
        });
    });

    describe("Memory Functions", function() {
        it("should store to memory (MS) and recall (MR)", function() {
            clickButton('1');
            clickButton('2');
            clickButton('MS');
            clickButton('AC');
            expect(getDisplayValue()).toBe(0);
            clickButton('MR');
            expect(getDisplayValue()).toBe(12);
        });

        it("should clear memory (MC)", function() {
            clickButton('5');
            clickButton('MS');
            clickButton('MC');
            clickButton('AC');
            clickButton('MR');
            expect(getDisplayValue()).toBe(0);
        });

        it("should add to memory (M+)", function() {
            clickButton('1');
            clickButton('0');
            clickButton('MS');
            clickButton('5');
            clickButton('M+');
            clickButton('AC');
            clickButton('MR');
            expect(getDisplayValue()).toBe(15);
        });

        it("should subtract from memory (M-)", function() {
            clickButton('2');
            clickButton('0');
            clickButton('MS');
            clickButton('5');
            clickButton('M-');
            clickButton('AC');
            clickButton('MR');
            expect(getDisplayValue()).toBe(15);
        });
    });

});
