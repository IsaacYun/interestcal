// 이자 계산기 클래스
class InterestCalculator {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.calculate();
    }

    initializeElements() {
        this.loanAmountInput = document.getElementById('loanAmount');
        this.interestRateInput = document.getElementById('interestRate');
        this.loanTermInput = document.getElementById('loanTerm');
        this.repaymentTypeSelect = document.getElementById('repaymentType');
        
        this.monthlyPaymentElement = document.getElementById('monthlyPayment');
        this.totalInterestElement = document.getElementById('totalInterest');
        this.totalPaymentElement = document.getElementById('totalPayment');
        this.totalLoanAmountElement = document.getElementById('totalLoanAmount');
        this.scheduleTableElement = document.getElementById('scheduleTable');
        this.scheduleTotalElement = document.getElementById('scheduleTotal');
    }

    bindEvents() {
        // 실시간 계산을 위한 이벤트 리스너
        this.loanAmountInput.addEventListener('input', (e) => {
            this.formatAmountInput(e.target);
            this.calculate();
        });
        this.interestRateInput.addEventListener('input', (e) => {
            this.formatRateInput(e.target);
            this.calculate();
        });
        this.loanTermInput.addEventListener('input', (e) => {
            this.formatMonthsInput(e.target);
            this.calculate();
        });
        this.repaymentTypeSelect.addEventListener('change', () => this.calculate());
        
        // 빠른 금액 버튼 이벤트 리스너
        document.querySelectorAll('.quick-amount-buttons .btn[data-amount]').forEach(button => {
            button.addEventListener('click', (e) => {
                const amount = parseInt(e.target.dataset.amount);
                const currentAmount = this.parseAmountWithCommas(this.loanAmountInput.value) || 0;
                const newAmount = currentAmount + amount;
                this.loanAmountInput.value = this.formatAmountWithUnit(newAmount);
                this.calculate();
            });
        });

        // 초기화 버튼 이벤트 리스너
        document.getElementById('resetAmount').addEventListener('click', () => {
            this.loanAmountInput.value = '0 원';
            this.calculate();
        });
    }

    calculate() {
        const loanAmount = this.parseAmountWithCommas(this.loanAmountInput.value);
        const annualRate = this.parseRateWithPercent(this.interestRateInput.value) / 100;
        const totalMonths = this.parseMonthsWithUnit(this.loanTermInput.value);
        const repaymentType = this.repaymentTypeSelect.value;

        if (isNaN(loanAmount) || isNaN(annualRate) || isNaN(totalMonths) || loanAmount <= 0 || annualRate <= 0 || totalMonths <= 0) {
            this.clearResults();
            return;
        }

        const monthlyRate = annualRate / 12;

        let monthlyPayment, totalInterest, totalPayment;
        let schedule = [];

        if (repaymentType === 'equal') {
            // 원리금균등상환
            const result = this.calculateEqualPayment(loanAmount, monthlyRate, totalMonths);
            monthlyPayment = result.monthlyPayment;
            totalInterest = result.totalInterest;
            totalPayment = result.totalPayment;
            schedule = result.schedule;
        } else if (repaymentType === 'principal') {
            // 원금균등상환
            const result = this.calculatePrincipalPayment(loanAmount, monthlyRate, totalMonths);
            monthlyPayment = result.monthlyPayment;
            totalInterest = result.totalInterest;
            totalPayment = result.totalPayment;
            schedule = result.schedule;
        } else {
            // 원금 만기 일시 상환
            const result = this.calculateBulletPayment(loanAmount, monthlyRate, totalMonths);
            monthlyPayment = result.monthlyPayment;
            totalInterest = result.totalInterest;
            totalPayment = result.totalPayment;
            schedule = result.schedule;
        }

        this.updateResults(monthlyPayment, totalInterest, totalPayment, loanAmount);
        this.updateSchedule(schedule);
    }

    calculateEqualPayment(loanAmount, monthlyRate, totalMonths) {
        // 원리금균등상환 공식: PMT = P * (r * (1 + r)^n) / ((1 + r)^n - 1)
        const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
                              (Math.pow(1 + monthlyRate, totalMonths) - 1);

        let remainingBalance = loanAmount;
        let totalInterest = 0;
        const schedule = [];

        for (let month = 1; month <= totalMonths; month++) {
            const interest = remainingBalance * monthlyRate;
            const principal = monthlyPayment - interest;
            remainingBalance -= principal;
            totalInterest += interest;

            schedule.push({
                month: month,
                payment: monthlyPayment,
                principal: principal,
                interest: interest,
                remainingBalance: Math.max(0, remainingBalance)
            });
        }

        return {
            monthlyPayment: monthlyPayment,
            totalInterest: totalInterest,
            totalPayment: monthlyPayment * totalMonths,
            schedule: schedule
        };
    }

    calculatePrincipalPayment(loanAmount, monthlyRate, totalMonths) {
        // 원금균등상환: 매월 원금을 균등하게 상환
        const monthlyPrincipal = loanAmount / totalMonths;
        let remainingBalance = loanAmount;
        let totalInterest = 0;
        const schedule = [];

        for (let month = 1; month <= totalMonths; month++) {
            const interest = remainingBalance * monthlyRate;
            const payment = monthlyPrincipal + interest;
            remainingBalance -= monthlyPrincipal;
            totalInterest += interest;

            schedule.push({
                month: month,
                payment: payment,
                principal: monthlyPrincipal,
                interest: interest,
                remainingBalance: Math.max(0, remainingBalance)
            });
        }

        return {
            monthlyPayment: schedule[0].payment, // 첫 달 납입금
            totalInterest: totalInterest,
            totalPayment: loanAmount + totalInterest,
            schedule: schedule
        };
    }

    calculateBulletPayment(loanAmount, monthlyRate, totalMonths) {
        // 원금 만기 일시 상환: 매월 이자만 납입하고 원금은 만기에 일시 상환
        let remainingBalance = loanAmount;
        let totalInterest = 0;
        const schedule = [];

        for (let month = 1; month <= totalMonths; month++) {
            const interest = remainingBalance * monthlyRate;
            let principal = 0;
            let payment = interest;

            // 마지막 달에 원금 상환
            if (month === totalMonths) {
                principal = loanAmount;
                payment = interest + principal;
                remainingBalance = 0;
            }

            totalInterest += interest;

            schedule.push({
                month: month,
                payment: payment,
                principal: principal,
                interest: interest,
                remainingBalance: remainingBalance
            });
        }

        return {
            monthlyPayment: schedule[0].payment, // 첫 달 납입금 (이자만)
            totalInterest: totalInterest,
            totalPayment: loanAmount + totalInterest,
            schedule: schedule
        };
    }

    updateResults(monthlyPayment, totalInterest, totalPayment, loanAmount) {
        this.monthlyPaymentElement.textContent = this.formatCurrency(monthlyPayment);
        this.totalInterestElement.textContent = this.formatCurrency(totalInterest);
        this.totalPaymentElement.textContent = this.formatCurrency(totalPayment);
        this.totalLoanAmountElement.textContent = this.formatCurrency(loanAmount);
    }

    updateSchedule(schedule) {
        this.scheduleTableElement.innerHTML = '';
        
        // 처음 12개월과 마지막 12개월만 표시 (중간은 생략)
        const displaySchedule = [];
        
        // 처음 12개월
        displaySchedule.push(...schedule.slice(0, 12));
        
        // 중간 생략 표시
        if (schedule.length > 24) {
            displaySchedule.push({
                month: '...',
                payment: '-',
                principal: '-',
                interest: '-',
                remainingBalance: '-'
            });
        }
        
        // 마지막 12개월
        if (schedule.length > 12) {
            displaySchedule.push(...schedule.slice(-12));
        }

        displaySchedule.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.month}</td>
                <td>${item.payment === '-' ? '-' : this.formatCurrency(item.payment)}</td>
                <td>${item.principal === '-' ? '-' : this.formatCurrency(item.principal)}</td>
                <td>${item.interest === '-' ? '-' : this.formatCurrency(item.interest)}</td>
                <td>${item.remainingBalance === '-' ? '-' : this.formatCurrency(item.remainingBalance)}</td>
            `;
            this.scheduleTableElement.appendChild(row);
        });

        // 합계 행 추가
        this.updateScheduleTotal(schedule);
    }

    formatCurrency(amount) {
        if (amount === '-') return '-';
        return new Intl.NumberFormat('ko-KR').format(Math.round(amount));
    }

    clearResults() {
        this.monthlyPaymentElement.textContent = '-';
        this.totalInterestElement.textContent = '-';
        this.totalPaymentElement.textContent = '-';
        this.totalLoanAmountElement.textContent = '-';
        this.scheduleTableElement.innerHTML = '';
        this.scheduleTotalElement.innerHTML = '';
    }

    // 천 단위 콤마 제거 (숫자로 변환)
    parseAmountWithCommas(value) {
        if (!value) return 0;
        // "원" 텍스트와 콤마 제거 후 숫자로 변환
        return parseInt(value.replace(/[^\d]/g, '')) || 0;
    }

    // 천 단위 콤마와 "원" 추가 (표시용)
    formatAmountWithUnit(amount) {
        return this.formatAmountWithCommas(amount) + ' 원';
    }

    // "%" 제거하고 숫자로 변환
    parseRateWithPercent(value) {
        if (!value) return 0;
        return parseFloat(value.replace(/[^\d.]/g, '')) || 0;
    }

    // "개월" 제거하고 숫자로 변환
    parseMonthsWithUnit(value) {
        if (!value) return 0;
        return parseInt(value.replace(/[^\d]/g, '')) || 0;
    }

    // 천 단위 콤마 추가 (표시용)
    formatAmountWithCommas(amount) {
        return new Intl.NumberFormat('ko-KR').format(amount);
    }

    // 입력 필드 실시간 포맷팅
    formatAmountInput(input) {
        const cursorPosition = input.selectionStart;
        const value = input.value;
        const numericValue = value.replace(/[^\d]/g, '');
        
        if (numericValue === '') {
            input.value = '';
            return;
        }
        
        const formattedValue = this.formatAmountWithUnit(numericValue);
        input.value = formattedValue;
        
        // 커서 위치 조정 (콤마만 고려, "원"은 제외)
        const newCursorPosition = this.getNewCursorPosition(value, formattedValue, cursorPosition);
        input.setSelectionRange(newCursorPosition, newCursorPosition);
    }

    // 연이율 입력 필드 포맷팅
    formatRateInput(input) {
        const cursorPosition = input.selectionStart;
        const value = input.value;
        const numericValue = value.replace(/[^\d.]/g, '');
        
        if (numericValue === '') {
            input.value = '';
            return;
        }
        
        const formattedValue = numericValue + ' %';
        input.value = formattedValue;
        
        // 커서 위치 조정
        const newCursorPosition = Math.min(cursorPosition, formattedValue.length - 2);
        input.setSelectionRange(newCursorPosition, newCursorPosition);
    }

    // 대출기간 입력 필드 포맷팅
    formatMonthsInput(input) {
        const cursorPosition = input.selectionStart;
        const value = input.value;
        const numericValue = value.replace(/[^\d]/g, '');
        
        if (numericValue === '') {
            input.value = '';
            return;
        }
        
        const formattedValue = numericValue + ' 개월';
        input.value = formattedValue;
        
        // 커서 위치 조정
        const newCursorPosition = Math.min(cursorPosition, formattedValue.length - 3);
        input.setSelectionRange(newCursorPosition, newCursorPosition);
    }

    // 커서 위치 계산
    getNewCursorPosition(oldValue, newValue, oldCursorPosition) {
        const oldCommas = (oldValue.substring(0, oldCursorPosition).match(/,/g) || []).length;
        const newCommas = (newValue.substring(0, oldCursorPosition).match(/,/g) || []).length;
        return oldCursorPosition + (newCommas - oldCommas);
    }

    // 상환 스케줄 합계 행 업데이트
    updateScheduleTotal(schedule) {
        this.scheduleTotalElement.innerHTML = '';
        
        // 전체 스케줄에서 합계 계산
        const totalPayment = schedule.reduce((sum, item) => sum + item.payment, 0);
        const totalPrincipal = schedule.reduce((sum, item) => sum + item.principal, 0);
        const totalInterest = schedule.reduce((sum, item) => sum + item.interest, 0);
        
        const totalRow = document.createElement('tr');
        totalRow.innerHTML = `
            <th>합계</th>
            <td>${this.formatCurrency(totalPayment)}</td>
            <td>${this.formatCurrency(totalPrincipal)}</td>
            <td>${this.formatCurrency(totalInterest)}</td>
            <td>-</td>
        `;
        this.scheduleTotalElement.appendChild(totalRow);
    }
}

// 페이지 로드 시 계산기 초기화
document.addEventListener('DOMContentLoaded', () => {
    new InterestCalculator();
}); 