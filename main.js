// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
    themeToggle.querySelector('i').classList.replace('fa-moon', 'fa-sun');
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        const icon = themeToggle.querySelector('i');
        
        if (body.classList.contains('dark-mode')) {
            icon.classList.replace('fa-moon', 'fa-sun');
            localStorage.setItem('theme', 'dark');
        } else {
            icon.classList.replace('fa-sun', 'fa-moon');
            localStorage.setItem('theme', 'light');
        }
    });
}

// Letter History Functions
function loadLetterHistory() {
    const tableBody = document.getElementById('lettersTableBody');
    const noData = document.getElementById('noData');
    
    // Load data from Google Sheets
    loadSubmissionsData().then(letters => {
        if (letters.length === 0) {
            tableBody.style.display = 'none';
            noData.style.display = 'block';
        } else {
            renderLettersTable(letters);
            setupFilters(letters);
        }
    });
}

function renderLettersTable(letters) {
    const tableBody = document.getElementById('lettersTableBody');
    tableBody.innerHTML = '';
    
    letters.forEach(letter => {
        const row = document.createElement('tr');
        
        // Status color classes
        const reviewStatusClass = getStatusClass(letter.reviewStatus);
        const sendStatusClass = getStatusClass(letter.sendStatus);
        
        row.innerHTML = `
            <td>${letter.id}</td>
            <td>${letter.date}</td>
            <td>${translateLetterType(letter.type)}</td>
            <td><span class="status-badge ${reviewStatusClass}">${letter.reviewStatus}</span></td>
            <td><span class="status-badge ${sendStatusClass}">${letter.sendStatus}</span></td>
            <td>${letter.recipient}</td>
            <td>${letter.subject}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-icon" onclick="reviewLetter('${letter.id}')" title="مراجعة">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-icon" onclick="printLetter('${letter.id}')" title="طباعة">
                        <i class="fas fa-print"></i>
                    </button>
                    <button class="action-icon" onclick="downloadLetter('${letter.id}')" title="تحميل">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="action-icon delete" onclick="deleteLetter('${letter.id}')" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

function getStatusClass(status) {
    const statusMap = {
        'جاهز للإرسال': 'status-ready',
        'في الانتظار': 'status-waiting',
        'يحتاج إلى تحسينات': 'status-needs-improvement',
        'مرفوض': 'status-rejected',
        'تم الإرسال': 'status-ready'
    };
    return statusMap[status] || 'status-waiting';
}

function translateLetterType(type) {
    const typeMap = {
        'New': 'جديد',
        'Reply': 'رد',
        'Follow Up': 'متابعة',
        'Co-op': 'تعاون'
    };
    return typeMap[type] || type;
}

function setupFilters(letters) {
    const searchInput = document.getElementById('searchInput');
    const typeFilter = document.getElementById('letterTypeFilter');
    const reviewFilter = document.getElementById('reviewStatusFilter');
    
    const filterLetters = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedType = typeFilter.value;
        const selectedReview = reviewFilter.value;
        
        const filtered = letters.filter(letter => {
            const matchesSearch = letter.recipient.toLowerCase().includes(searchTerm) || 
                                letter.id.toLowerCase().includes(searchTerm);
            const matchesType = !selectedType || translateLetterType(letter.type) === selectedType;
            const matchesReview = !selectedReview || letter.reviewStatus === selectedReview;
            
            return matchesSearch && matchesType && matchesReview;
        });
        
        renderLettersTable(filtered);
    };
    
    searchInput.addEventListener('input', filterLetters);
    typeFilter.addEventListener('change', filterLetters);
    reviewFilter.addEventListener('change', filterLetters);
}

// Letter Actions
function reviewLetter(id) {
    window.location.href = `/src/pages/review-letter.html?id=${id}`;
}

function printLetter(id) {
    // Implement print functionality
    window.print();
}

function downloadLetter(id) {
    // Implement download functionality
    // This would call your API to get the PDF
    alert('جاري تحميل الخطاب...');
}

function deleteLetter(id) {
    if (confirm('هل أنت متأكد من حذف هذا الخطاب؟')) {
        // Implement delete functionality
        alert('تم حذف الخطاب بنجاح');
        loadLetterHistory();
    }
}

// Review Form Functions
function loadLettersForReview() {
    const letterSelect = document.getElementById('letterSelect');
    
    loadSubmissionsData().then(letters => {
        letters.forEach(letter => {
            const option = document.createElement('option');
            option.value = letter.id;
            option.textContent = `${letter.id} - ${letter.recipient} - ${letter.subject}`;
            letterSelect.appendChild(option);
        });
    });
}

function setupReviewForm() {
    const letterSelect = document.getElementById('letterSelect');
    const reviewForm = document.getElementById('reviewForm');
    const reviewCheckbox = document.getElementById('reviewComplete');
    const actionButtons = document.querySelectorAll('.action-button');
    
    letterSelect.addEventListener('change', (e) => {
        if (e.target.value) {
            reviewForm.style.display = 'block';
            loadLetterForReview(e.target.value);
        } else {
            reviewForm.style.display = 'none';
        }
    });
    
    reviewCheckbox.addEventListener('change', (e) => {
        actionButtons.forEach(button => {
            button.disabled = !e.target.checked;
        });
    });
    
    // Setup action buttons
    document.getElementById('readyButton').addEventListener('click', () => updateReviewStatus('جاهز للإرسال'));
        document.getElementById('improvementButton').addEventListener('click', () => updateReviewStatus('يحتاج إلى تحسينات'));
    document.getElementById('rejectedButton').addEventListener('click', () => updateReviewStatus('مرفوض'));
}

function loadLetterForReview(id) {
    // Load letter content from your data source
    // For now, we'll use placeholder content
    const letterContent = document.getElementById('letterContentReview');
    letterContent.value = 'محتوى الخطاب سيظهر هنا...';
}

function updateReviewStatus(status) {
    const reviewerName = document.getElementById('reviewerName').value;
    const notes = document.getElementById('reviewNotes').value;
    const letterId = document.getElementById('letterSelect').value;
    
    if (!reviewerName) {
        alert('الرجاء إدخال اسم المراجع');
        return;
    }
    
    // Update the status in your data source
    alert(`تم تحديث حالة المراجعة إلى: ${status}`);
    
    // Redirect to home
    window.location.href = '/';
}