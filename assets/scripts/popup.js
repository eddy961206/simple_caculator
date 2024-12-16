document.addEventListener('DOMContentLoaded', function () {
    const display = document.getElementById('display');
    const buttons = document.querySelectorAll('.btn');
    const clearButton = document.getElementById('clear');
    const equalButton = document.getElementById('equal');
    const backspaceButton = document.getElementById('backspace');
    const darkmodeToggle = document.getElementById('darkmode-toggle');
    const memoryStatus = document.querySelector('.memory-status');
    const historyList = document.querySelector('.history-list');

    let memory = 0;
    let history = [];
    const MAX_HISTORY = 5;

    // 다크모드 설정
    darkmodeToggle.addEventListener('change', function() {
        document.body.setAttribute('data-theme', this.checked ? 'dark' : 'light');
    });

    // 메모리 상태 업데이트
    function updateMemoryStatus() {
        memoryStatus.textContent = memory !== 0 ? `M = ${memory}` : '';
    }

    // 히스토리 업데이트
    function updateHistory(expression, result) {
        history.unshift(`${expression} = ${result}`);
        if (history.length > MAX_HISTORY) {
            history.pop();
        }
        historyList.innerHTML = history.map(item => `<div>${item}</div>`).join('');
    }

    // 메모리 기능
    document.getElementById('mc').addEventListener('click', () => {
        memory = 0;
        updateMemoryStatus();
    });

    document.getElementById('mr').addEventListener('click', () => {
        display.value = memory;
    });

    document.getElementById('m-plus').addEventListener('click', () => {
        memory += parseFloat(display.value) || 0;
        updateMemoryStatus();
    });

    document.getElementById('m-minus').addEventListener('click', () => {
        memory -= parseFloat(display.value) || 0;
        updateMemoryStatus();
    });

    buttons.forEach(function (button) {
        button.addEventListener('click', function () {
            const value = this.getAttribute('data-value');
            if (value) {
                // 첫 입력이 음수인 경우 허용
                if (display.value === '' && value === '-') {
                    display.value = '-';
                    return;
                }
                // 직전 입력이 '*' 또는 '/'이고, 현재 입력이 '-'인 경우 허용
                if (['*', '/'].includes(display.value.slice(-1)) && value === '-') {
                    display.value += value;
                    return;
                }
                // 연산자 연속 입력 방지 (단, '*' 또는 '/' 뒤에 '-'는 허용)
                if (['+', '-', '*', '/'].includes(display.value.slice(-1)) &&
                    ['+', '*', '/'].includes(value)) {
                    return;
                }
                // 나머지 경우 정상 입력
                display.value += value;
            }
        });
    });

    backspaceButton.addEventListener('click', function() {
        display.value = display.value.slice(0, -1);
    });

    clearButton.addEventListener('click', function () {
        display.value = '';
        const prevDisplays = document.querySelectorAll('.previous-display');
        prevDisplays.forEach(el => el.remove());
    });

    // 계산 함수 개선
    function calculate(expression) {
        const operators = {
            '+': (a, b) => a + b,
            '-': (a, b) => a - b,
            '*': (a, b) => a * b,
            '/': (a, b) => b === 0 ? NaN : a / b,
        };
    
        try {
            // 괄호 처리
            while (expression.includes('(')) {
                expression = expression.replace(/\(([^()]+)\)/g, (match, group) => {
                    return calculate(group);
                });
            }
    
            // 연산자와 숫자를 분리
            let tokens = [];
            let currentNumber = '';
            let isNegative = false;
    
            // 문자열을 순회하면서 토큰화
            for (let i = 0; i < expression.length; i++) {
                const char = expression[i];
                
                // 숫자나 소수점인 경우
                if (/[\d.]/.test(char)) {
                    currentNumber += char;
                }
                // 연산자인 경우
                else if (/[\+\-\*\/]/.test(char)) {
                    // 첫 문자가 마이너스이거나, 이전 문자가 연산자인 경우 (음수 처리)
                    if (char === '-' && (i === 0 || /[\+\-\*\/]/.test(expression[i-1]))) {
                        isNegative = true;
                        continue;
                    }
                    
                    // 현재까지의 숫자를 토큰에 추가
                    if (currentNumber !== '') {
                        tokens.push(isNegative ? -parseFloat(currentNumber) : parseFloat(currentNumber));
                        currentNumber = '';
                        isNegative = false;
                    }
                    tokens.push(char);
                }
            }
            
            // 마지막 숫자 처리
            if (currentNumber !== '') {
                tokens.push(isNegative ? -parseFloat(currentNumber) : parseFloat(currentNumber));
            }
    
            // 곱셈과 나눗셈 먼저 처리
            for (let i = 1; i < tokens.length - 1; i += 2) {
                if (tokens[i] === '*' || tokens[i] === '/') {
                    const result = operators[tokens[i]](
                        tokens[i-1],
                        tokens[i+1]
                    );
                    tokens.splice(i-1, 3, result);
                    i -= 2;
                }
            }
    
            // 덧셈과 뺄셈 처리
            let result = tokens[0];
            for (let i = 1; i < tokens.length; i += 2) {
                const operator = tokens[i];
                const nextNum = tokens[i+1];
                
                if (operator === '+' || operator === '-') {
                    result = operators[operator](result, nextNum);
                }
            }
    
            // 소수점 자릿수 제한 (최대 8자리)
            return Number(result.toFixed(8));
        } catch (e) {
            console.error('Calculation error:', e);
            return NaN;
        }
    }

    function showCalculationResult(expression) {
        try {
            const result = calculate(expression);
            if (isNaN(result)) {
                display.value = 'Error';
                return;
            }

            // 이전 계산식 표시
            const prevDisplays = document.querySelectorAll('.previous-display');
            prevDisplays.forEach(el => el.remove());

            const previousDisplay = document.createElement('div');
            previousDisplay.className = 'previous-display';
            previousDisplay.textContent = expression;
            previousDisplay.style.position = 'absolute';
            previousDisplay.style.fontSize = '1.3em';
            previousDisplay.style.opacity = '0.7';
            previousDisplay.style.color = 'var(--text-color)';
            previousDisplay.style.left = '24px';
            previousDisplay.style.top = '24px';

            const calculatorDiv = document.querySelector('.calculator');
            calculatorDiv.insertBefore(previousDisplay, display);

            // 결과 표시 및 히스토리 업데이트
            display.value = result;
            updateHistory(expression, result);
        } catch (e) {
            display.value = 'Error';
        }
    }

    equalButton.addEventListener('click', function () {
        if (display.value) {
            showCalculationResult(display.value);
        }
    });

    // 키보드 입력 처리 개선
    document.addEventListener('keydown', function (event) {
        const key = event.key;
        const validKeys = /[\d+\-*/.()=]|Enter|Backspace|Escape/;
    
        if (!validKeys.test(key)) {
            return;
        }
    
        event.preventDefault();
    
        if (key === 'Enter') {
            showCalculationResult(display.value);
        } else if (key === 'Backspace') {
            display.value = display.value.slice(0, -1);
        } else if (key === 'Escape') {
            display.value = '';
            const prevDisplays = document.querySelectorAll('.previous-display');
            prevDisplays.forEach(el => el.remove());
        } else if (key === '=') {
            showCalculationResult(display.value);
        } else {
            // 첫 입력이 음수인 경우 허용
            if (display.value === '' && key === '-') {
                display.value = '-';
                return;
            }
            // 직전 입력이 '*' 또는 '/'이고, 현재 입력이 '-'인 경우 허용
            if (['*', '/'].includes(display.value.slice(-1)) && key === '-') {
                display.value += key;
                return;
            }
            // 연산자 연속 입력 방지 (단, '*' 또는 '/' 뒤에 '-'는 허용)
            if (['+', '-', '*', '/'].includes(display.value.slice(-1)) &&
                ['+', '*', '/'].includes(key)) {
                return;
            }
            // 나머지 경우 정상 입력
            display.value += key;
        }
    });
});