import { auth, provider, signInWithPopup, onAuthStateChanged, signOut } from './firebase-config.js';

// Lưu trữ tài liệu trong LocalStorage
let documents = JSON.parse(localStorage.getItem('documents')) || [];

// Xử lý đăng nhập với Google
async function handleGoogleSignIn() {
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error('Lỗi đăng nhập:', error);
    }
}

// Theo dõi trạng thái xác thực
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('landing-page').style.display = 'none';
        document.getElementById('app').style.display = 'block';
    } else {
        document.getElementById('app').style.display = 'none';
        document.getElementById('landing-page').style.display = 'block';
    }
});

// Xử lý đăng nhập Google
document.getElementById('googleSignInBtn').addEventListener('click', handleGoogleSignIn);

// Xử lý đăng xuất
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Lỗi đăng xuất:', error);
    }
});


// Các phần tử DOM
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const documentList = document.getElementById('documentList');

// Sự kiện click nút tải lên
uploadBtn.addEventListener('click', () => {
    fileInput.click();
});

// Xử lý khi chọn file
fileInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
        const reader = new FileReader();
        
        reader.onload = (event) => {
            const document = {
                id: Date.now() + Math.random(),
                name: file.name,
                type: file.type,
                size: file.size,
                content: event.target.result,
                uploadDate: new Date().toLocaleString()
            };
            
            documents.push(document);
            localStorage.setItem('documents', JSON.stringify(documents));
            renderDocuments();
        };
        
        reader.readAsDataURL(file);
    }
    
    fileInput.value = '';
});

// Hiển thị danh sách tài liệu
import { documentViewer } from './modal.js';

// Xem tài liệu
window.viewDocument = function(docId) {
    const doc = documents.find(d => d.id === docId);
    if (doc) {
        // Chuyển đổi base64 thành Blob
        const byteString = atob(doc.content.split(',')[1]);
        const mimeString = doc.content.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], {type: mimeString});
        const file = new File([blob], doc.name, {type: mimeString});
        documentViewer.viewDocument(file);
    }
}

function renderDocuments() {
    documentList.innerHTML = documents.map(doc => `
        <div class="document-card ${doc.isImportant ? 'important' : ''}">
            <h3>${doc.name} ${doc.isLocked ? '🔒' : ''} ${doc.isImportant ? '⭐' : ''}</h3>
            <p>Kích thước: ${formatSize(doc.size)}</p>
            <p>Ngày tải lên: ${doc.uploadDate}</p>
            <div class="actions">
                <button class="btn" onclick="viewDocument(${doc.id})" ${doc.isLocked ? 'disabled' : ''}>Xem</button>
                <button class="btn" onclick="downloadDocument(${doc.id})" ${doc.isLocked ? 'disabled' : ''}>Tải xuống</button>
                <button class="menu-btn" onclick="toggleMenu(${doc.id})">...</button>
                <div class="menu-options" id="menu-${doc.id}">
                    <div class="menu-option" onclick="editDocument(${doc.id})">
                        <i>✏️</i> Sửa
                    </div>
                    <div class="menu-option" onclick="shareDocument(${doc.id})">
                        <i>🔗</i> Chia sẻ
                    </div>
                    <div class="menu-option" onclick="lockDocument(${doc.id})">
                        <i>🔒</i> ${doc.isLocked ? 'Mở khóa' : 'Khóa'}
                    </div>
                    <div class="menu-option" onclick="markImportant(${doc.id})">
                        <i>⭐</i> ${doc.isImportant ? 'Bỏ đánh dấu' : 'Đánh dấu'} quan trọng
                    </div>
                    <div class="menu-option" onclick="deleteDocument(${doc.id})">
                        <i>🗑️</i> Xóa
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}


// Xử lý menu tùy chọn
window.toggleMenu = function(id) {
    const menu = document.getElementById(`menu-${id}`);
    // Đóng tất cả các menu khác
    document.querySelectorAll('.menu-options').forEach(m => {
        if (m.id !== `menu-${id}`) {
            m.classList.remove('show');
        }
    });
    menu.classList.toggle('show');
}

// Đóng menu khi click ra ngoài
document.addEventListener('click', (e) => {
    if (!e.target.matches('.menu-btn')) {
        document.querySelectorAll('.menu-options').forEach(menu => {
            menu.classList.remove('show');
        });
    }
});

// Các hàm xử lý tùy chọn menu
window.editDocument = function(id) {
    const doc = documents.find(d => d.id === id);
    if (!doc) return;
    
    const newName = prompt('Nhập tên mới cho tài liệu:', doc.name);
    if (newName && newName.trim() !== '') {
        doc.name = newName.trim();
        localStorage.setItem('documents', JSON.stringify(documents));
        renderDocuments();
    }
}

window.shareDocument = function(id) {
    const doc = documents.find(d => d.id === id);
    if (!doc) return;
    
    const shareLink = `${window.location.origin}/share?id=${id}`;
    navigator.clipboard.writeText(shareLink)
        .then(() => alert('Đã sao chép liên kết chia sẻ vào clipboard!'))
        .catch(() => alert('Không thể sao chép liên kết!'));
}

window.lockDocument = function(id) {
    const doc = documents.find(d => d.id === id);
    if (!doc) return;
    
    if (doc.isLocked) {
        const password = prompt('Nhập mật khẩu để mở khóa tài liệu:');
        if (password === doc.password) {
            doc.isLocked = false;
            doc.password = null;
            alert('Đã mở khóa tài liệu!');
        } else {
            alert('Mật khẩu không đúng!');
            return;
        }
    } else {
        const password = prompt('Nhập mật khẩu để khóa tài liệu:');
        if (password && password.trim() !== '') {
            doc.isLocked = true;
            doc.password = password;
            alert('Đã khóa tài liệu!');
        }
    }
    
    localStorage.setItem('documents', JSON.stringify(documents));
    renderDocuments();
}

window.markImportant = function(id) {
    const doc = documents.find(d => d.id === id);
    if (!doc) return;
    
    doc.isImportant = !doc.isImportant;
    localStorage.setItem('documents', JSON.stringify(documents));
    renderDocuments();
}

// Tải xuống tài liệu
window.downloadDocument = function(id) {
    const doc = documents.find(d => d.id === id);
    if (!doc) return;
    
    const link = document.createElement('a');
    link.href = doc.content;
    link.download = doc.name;
    link.click();
}

// Xóa tài liệu
window.deleteDocument = function(id) {
    documents = documents.filter(d => d.id !== id);
    localStorage.setItem('documents', JSON.stringify(documents));
    renderDocuments();
}

// Định dạng kích thước file
function formatSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

// Hiển thị tài liệu khi trang được tải
renderDocuments();