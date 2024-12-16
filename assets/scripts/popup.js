$(document).ready(function() {
    // DOM 요소들을 jQuery 객체로 가져옵니다.
    const $display = $('#display');
    const $buttons = $('.btn');
    const $clearButton = $('#clear');
    const $equalButton = $('#equal');
    const $backspaceButton = $('#backspace');
    const $darkmodeToggle = $('#darkmode-toggle');
    const $memoryStatus = $('.memory-status');
    const $previousCalculation = $('.previous-calculation');
    const $historyList = $('.history-list');

    // 메모리와 히스토리 관련 변수들을 초기화합니다.
    let memory = 0;
    let history = [];
    const MAX_HISTORY = 5; // 최대 5개의 기록만 유지합니다.

    // 다크모드 설정을 처리합니다.
    $darkmodeToggle.on('change', function() {
        // 체크박스의 상태에 따라 data-theme 속성을 변경하고, Chrome Storage에 저장합니다.
        const isDarkMode = $(this).is(':checked');
        $('body').attr('data-theme', isDarkMode ? 'dark' : 'light');
        chrome.storage.sync.set({ darkMode: isDarkMode });
    });

    // 페이지 로드 시 다크모드 상태를 복원합니다.
    chrome.storage.sync.get(['darkMode'], function(result) {
        // 저장된 다크모드 설정이 있으면 가져오고, 없으면 false를 사용합니다.
        const savedDarkMode = result.darkMode || false;
        $darkmodeToggle.prop('checked', savedDarkMode);
        $('body').attr('data-theme', savedDarkMode ? 'dark' : 'light');
    });

    // 메모리 상태를 업데이트하는 함수입니다.
    function updateMemoryStatus() {
        $memoryStatus.text(memory !== 0 ? `M = ${memory}` : '');
    }

    // 계산 이력을 업데이트하는 함수입니다.
    function updateHistory(expression, result) {
        // 직전 계산식을 업데이트합니다.
        $previousCalculation.text(`${expression} =`);

        // 새로운 계산 기록을 생성하고, 클릭 이벤트를 추가합니다.
        const $historyItem = $(`<div class="history-item">
            <span class="history-expression">${expression}</span>
            <span class="history-result">${result}</span>
        </div>`);
        $historyItem.on('click', () => {
            $display.val(result);
        });

        // 이력 목록의 맨 앞에 새로운 기록을 추가합니다.
        $historyList.prepend($historyItem);

        // 최대 개수를 유지하기 위해 오래된 기록을 제거합니다.
        while ($historyList.children().length > MAX_HISTORY) {
            $historyList.children().last().remove();
        }
    }

    // 메모리 기능을 처리합니다.
    $('#mc').on('click', () => {
        memory = 0;
        updateMemoryStatus();
    });

    $('#mr').on('click', () => {
        $display.val(memory);
    });

    $('#m-plus').on('click', () => {
        memory += parseFloat($display.val()) || 0;
        updateMemoryStatus();
    });

    $('#m-minus').on('click', () => {
        memory -= parseFloat($display.val()) || 0;
        updateMemoryStatus();
    });

    // 버튼 클릭 이벤트를 처리합니다.
    $buttons.on('click', function() {
        const value = $(this).data('value');
        if (value) {
            // 첫 입력이 음수인 경우를 허용합니다.
            if ($display.val() === '' && value === '-') {
                $display.val('-');
                return;
            }
            // 직전 입력이 '*' 또는 '/'이고, 현재 입력이 '-'인 경우를 허용합니다.
            if (['*', '/'].includes($display.val().slice(-1)) && value === '-') {
                $display.val($display.val() + value);
                return;
            }
            // 연산자가 연속으로 입력되는 것을 방지합니다. (단, '*' 또는 '/' 뒤에 '-'는 허용)
            if (['+', '-', '*', '/'].includes($display.val().slice(-1)) &&
                ['+', '*', '/'].includes(value)) {
                return;
            }
            $display.val($display.val() + value);
        }
    });

    // 백스페이스 버튼 이벤트를 처리합니다.
    $backspaceButton.on('click', () => {
        $display.val($display.val().slice(0, -1));
    });

    // Clear 버튼 이벤트를 처리합니다.
    $clearButton.on('click', () => {
        $display.val('');
        $previousCalculation.text('');
    });

    // 계산을 수행하는 함수입니다.
    function calculate(expression) {
        // 연산자별 함수를 정의합니다.
        const operators = {
            '+': (a, b) => a + b,
            '-': (a, b) => a - b,
            '*': (a, b) => a * b,
            '/': (a, b) => b === 0 ? NaN : a / b,
        };

        try {
            // 괄호 처리를 위한 반복문입니다.
            while (expression.includes('(')) {
                expression = expression.replace(/\(([^()]+)\)/g, (match, group) => {
                    return calculate(group);
                });
            }

            // 연산자와 숫자를 분리합니다.
            let tokens = [];
            let currentNumber = '';
            let isNegative = false;

            // 문자열을 순회하면서 토큰화합니다.
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

                    // 현재까지의 숫자를 토큰에 추가합니다.
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

            // 곱셈과 나눗셈을 먼저 처리합니다.
            for (let i = 1; i < tokens.length - 1; i += 2) {
                if (tokens[i] === '*' || tokens[i] === '/') {
                    const result = operators[tokens[i]](
                        tokens[i-1],
                        tokens[i+1]
                    );
                    tokens.splice(i-1, 3, result);
                    i -= 2; // 인덱스를 조정합니다.
                }
            }

            // 덧셈과 뺄셈을 처리합니다.
            let result = tokens[0];
            for (let i = 1; i < tokens.length; i += 2) {
                const operator = tokens[i];
                const nextNum = tokens[i+1];

                if (operator === '+' || operator === '-') {
                    result = operators[operator](result, nextNum);
                }
            }

            // 소수점 자릿수를 최대 8자리로 제한합니다.
            return Number(result.toFixed(8));
        } catch (e) {
            console.error('Calculation error:', e);
            return NaN;
        }
    }

    // 계산 결과를 보여주는 함수입니다.
    function showCalculationResult(expression) {
        try {
            const result = calculate(expression);
            if (isNaN(result)) {
                $display.val('Error');
                return;
            }

            $display.val(result);
            updateHistory(expression, result);
        } catch (e) {
            $display.val('Error');
        }
    }

    // 등호 버튼 이벤트를 처리합니다.
    $equalButton.on('click', () => {
        if ($display.val()) {
            showCalculationResult($display.val());
        }
    });

    // 키보드 입력 이벤트를 처리합니다.
    $(document).on('keydown', function(event) {
        const key = event.key;
        const validKeys = /[\d+\-*/.()=]|Enter|Backspace|Escape/;

        // 유효하지 않은 키 입력은 무시합니다.
        if (!validKeys.test(key)) {
            return;
        }

        event.preventDefault();

        // Enter 키 입력 시 계산 결과를 보여줍니다.
        if (key === 'Enter') {
            showCalculationResult($display.val());
        }
        // Backspace 키 입력 시 마지막 문자를 제거합니다.
        else if (key === 'Backspace') {
            $display.val($display.val().slice(0, -1));
        }
        // Escape 키 입력 시 입력을 초기화합니다.
        else if (key === 'Escape') {
            $display.val('');
            $previousCalculation.text('');
        }
        // 등호(=) 키 입력 시 계산 결과를 보여줍니다.
        else if (key === '=') {
            showCalculationResult($display.val());
        }
        // 그 외의 경우, 입력값을 추가합니다.
        else {
            // 첫 입력이 음수인 경우를 허용합니다.
            if ($display.val() === '' && key === '-') {
                $display.val('-');
                return;
            }
            // 직전 입력이 '*' 또는 '/'이고, 현재 입력이 '-'인 경우를 허용합니다.
            if (['*', '/'].includes($display.val().slice(-1)) && key === '-') {
                $display.val($display.val() + key);
                return;
            }
            // 연산자가 연속으로 입력되는 것을 방지합니다. (단, '*' 또는 '/' 뒤에 '-'는 허용)
            if (['+', '-', '*', '/'].includes($display.val().slice(-1)) &&
                ['+', '*', '/'].includes(key)) {
                return;
            }
            $display.val($display.val() + key);
        }
    });

    // 초기 상태를 설정합니다.
    updateMemoryStatus();
});