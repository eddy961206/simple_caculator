document.addEventListener('DOMContentLoaded', function () {
    const display = document.getElementById('display');
    const buttons = document.querySelectorAll('.btn');
    const clearButton = document.getElementById('clear');
    const equalButton = document.getElementById('equal');

    buttons.forEach(function (button) {
        button.addEventListener('click', function () {
            const value = this.getAttribute('data-value');
            if (value) {
                if (['+', '*', '/'].includes(value) && display.value === '') {
                    return; // 첫 입력이 -만 허용하고, 나머지 연산자는 입력되지 않도록 함
                }
                // 마지막 입력이 연산자인지 확인
                if (['+', '-', '*', '/'].includes(display.value.slice(-1)) && ['+', '-', '*', '/'].includes(value)) {
                    return; // 연산자가 연속으로 입력되는 것을 방지
                }
                display.value += value;
            }
        });
    });

    clearButton.addEventListener('click', function () {
        display.value = '';
    });

    // 계산 함수 정의
    function calculate(expression) {
        const operators = {
            '+': (a, b) => a + b,
            '-': (a, b) => a - b,
            '*': (a, b) => a * b,
            '/': (a, b) => a / b,
        };

        const precedence = {
            '+': 1,
            '-': 1,
            '*': 2,
            '/': 2,
        };

        const isOperator = (c) => ['+', '-', '*', '/'].includes(c);
        const isDigit = (c) => /\d/.test(c);

        const toPostfix = (infix) => {
            const output = [];
            const opsStack = [];
            let numberBuffer = '';
            let lastChar = '';

            for (let i = 0; i < infix.length; i++) {
                const char = infix[i];

                if (isDigit(char) || char === '.') {
                    numberBuffer += char;
                } else if (isOperator(char)) {
                    if (char === '-' && (i === 0 || isOperator(lastChar))) {
                        // 음수 처리: 수식의 시작이나 연산자 뒤에 오는 '-'는 음수로 간주
                        numberBuffer += char;
                    } else {
                        if (numberBuffer) {
                            output.push(parseFloat(numberBuffer));
                            numberBuffer = '';
                        }
                        while (
                            opsStack.length &&
                            precedence[opsStack[opsStack.length - 1]] >= precedence[char]
                        ) {
                            output.push(opsStack.pop());
                        }
                        opsStack.push(char);
                    }
                }
                lastChar = char;
            }

            if (numberBuffer) {
                output.push(parseFloat(numberBuffer));
            }

            while (opsStack.length) {
                output.push(opsStack.pop());
            }

            return output;
        };

        const evaluatePostfix = (postfix) => {
            const stack = [];

            postfix.forEach((token) => {
                if (typeof token === 'number') {
                    stack.push(token);
                } else if (isOperator(token)) {
                    const b = stack.pop();
                    const a = stack.pop();
                    stack.push(operators[token](a, b));
                }
            });

            return stack[0];
        };

        const postfix = toPostfix(expression.replace(/\s+/g, ''));
        return evaluatePostfix(postfix);
    }

    // 계산 결과를 표시하는 함수를 분리하여 재사용
    function showCalculationResult(expression) {
        try {
            const result = calculate(expression);

            // 이전에 표시된 계산식이 있다면 제거
            const prevDisplays = document.querySelectorAll('.previous-display');
            prevDisplays.forEach(el => el.remove());

            // 새로운 계산식 표시
            const previousDisplay = document.createElement('div');
            previousDisplay.className = 'previous-display'; // 클래스 추가
            previousDisplay.textContent = expression;
            previousDisplay.style.position = 'absolute';
            previousDisplay.style.fontSize = '1.3em';
            previousDisplay.style.opacity = '0.7';
            previousDisplay.style.color = '#666';
            previousDisplay.style.left = '24px';
            previousDisplay.style.top = '24px'; // display 상단에 위치하도록 수정

            // display의 컨테이너에 추가
            const calculatorDiv = document.querySelector('.calculator');
            calculatorDiv.insertBefore(previousDisplay, display);

            display.value = result;
        } catch (e) {
            display.value = 'Error';
        }
    }

    // 등호 버튼 클릭 이벤트 수정
    equalButton.addEventListener('click', function () {
        showCalculationResult(display.value);
    });

    // 키보드 입력 처리
    document.addEventListener('keydown', function (event) {
        const key = event.key;

        // 숫자 입력 처리
        if (/\d/.test(key)) {
            display.value += key;
        }

        if (['+', '*', '/'].includes(key) && display.value === '') {
            return; // 첫 입력이 -만 허용하고, 나머지 연산자는 입력되지 않도록 함
        }

        // 연산자 입력 처리
        if (['+', '-', '*', '/'].includes(key)) {
            // 마지막 입력이 연산자인지 확인
            if (['+', '-', '*', '/'].includes(display.value.slice(-1))) {
                return; // 연산자가 연속으로 입력되는 것을 방지
            }
            display.value += key;
        }

        // Shift + '=' for '+'
        if (key === '=' && event.shiftKey) {
            display.value += '+';
        }

        // Shift + '8' for '*'
        if (key === '8' && event.shiftKey) {
            display.value += '*';
        }

        // 백스페이스 처리
        if (key === 'Backspace') {
            display.value = display.value.slice(0, -1);
        }

        // 엔터 키로 계산 수행
        if (key === 'Enter') {
            showCalculationResult(display.value);
        }

        // Clear 버튼을 눌렀을 때 직전 계산식도 함께 초기화
        if (key === 'Escape') {
            display.value = '';
            const prevDisplays = document.querySelectorAll('.previous-display');
            prevDisplays.forEach(el => el.remove());
        }
    });

    // Clear 버튼 클릭 시 직전 계산식도 함께 초기화
    clearButton.addEventListener('click', function () {
        display.value = '';
        const prevDisplays = document.querySelectorAll('.previous-display');
        prevDisplays.forEach(el => el.remove());
    });
});