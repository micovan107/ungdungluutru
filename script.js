import { auth, provider, signInWithPopup, onAuthStateChanged, signOut } from './firebase-config.js';

// Lưu trữ tài liệu trong LocalStorage
let documents = [];

// Tải dữ liệu từ localStorage
function loadDocuments() {
    documents = JSON.parse(localStorage.getItem('documents')) || [];
    renderDocuments();
}

// Xử lý đăng nhập với Google
async function handleGoogleSignIn() {
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error('Lỗi đăng nhập:', error);
    }
}

// Kiểm tra trạng thái đăng nhập
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('landing-page').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        document.getElementById('userAvatar').src = user.photoURL || 'https://via.placeholder.com/32';
        loadDocuments();
    } else {
        document.getElementById('landing-page').style.display = 'block';
        document.getElementById('app').style.display = 'none';
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

// Hàm chuyển đổi ảnh sang PDF
async function convertImageToPdf(imageFile) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const img = new Image();
                img.src = event.target.result;
                
                await new Promise(resolve => img.onload = resolve);
                
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF({
                    orientation: img.width > img.height ? 'l' : 'p',
                    unit: 'px',
                    format: [img.width, img.height]
                });
                
                pdf.addImage(canvas.toDataURL('image/jpeg'), 'JPEG', 0, 0, img.width, img.height);
                const pdfData = pdf.output('datauristring');
                resolve(pdfData);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
    });
}

// Xử lý khi chọn file
fileInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
        try {
            let content;
            let type = file.type;
            let name = file.name;
            
            if (file.type.startsWith('image/')) {
                content = await convertImageToPdf(file);
                type = 'application/pdf';
                name = name.replace(/\.[^\.]+$/, '.pdf');
            } else {
                const reader = new FileReader();
                content = await new Promise((resolve, reject) => {
                    reader.onload = (event) => resolve(event.target.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            }
            
            const document = {
                id: Date.now() + Math.random(),
                name: name,
                type: type,
                size: file.size,
                content: content,
                uploadDate: new Date().toLocaleString()
            };
            
            documents.push(document);
            localStorage.setItem('documents', JSON.stringify(documents));
            renderDocuments();
        } catch (error) {
            console.error('Lỗi khi xử lý file:', error);
            alert(`Không thể xử lý file ${file.name}. Vui lòng thử lại.`);
        }
    }
    
    fileInput.value = '';
});

// Hiển thị danh sách tài liệu
import { documentViewer } from './modal.js';

// Xem tài liệu
window.viewDocument = function(docId) {
    const doc = documents.find(d => d.id === docId);
    if (doc) {
        try {
            // Kiểm tra nếu nội dung là base64
            if (doc.content.startsWith('data:')) {
                const [header, base64Data] = doc.content.split(',');
                const mimeString = header.split(':')[1].split(';')[0];
                const byteString = atob(base64Data);
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) {
                    ia[i] = byteString.charCodeAt(i);
                }
                const blob = new Blob([ab], {type: mimeString});
                const file = new File([blob], doc.name, {type: mimeString});
                documentViewer.viewDocument(file);
            } else {
                // Xử lý nội dung văn bản thông thường
                const blob = new Blob([doc.content], {type: 'text/html'});
                const file = new File([blob], doc.name, {type: 'text/html'});
                documentViewer.viewDocument(file);
            }
        } catch (error) {
            console.error('Lỗi khi xử lý tài liệu:', error);
            alert('Không thể mở tài liệu này. Vui lòng kiểm tra định dạng tài liệu.');
        }
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

// Hiển thị tài liệu khi trang được tải
renderDocuments();

// Xử lý click vào avatar
document.getElementById('userAvatar').addEventListener('click', () => {
    window.location.href = './profile.html';
});

// Định dạng kích thước file
function formatSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

// Xử lý tìm kiếm
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

// Hàm tìm kiếm tài liệu
function searchDocuments(keyword) {
    keyword = keyword.toLowerCase().trim();
    if (!keyword) {
        renderDocuments();
        return;
    }

    const filteredDocs = documents.filter(doc => 
        doc.name.toLowerCase().includes(keyword)
    );

    documentList.innerHTML = filteredDocs.length > 0 ? 
        filteredDocs.map(doc => `
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
        `).join('') : 
        '<div class="no-results">Không tìm thấy tài liệu nào phù hợp</div>';
}

// Xử lý sự kiện nhập liệu trong ô tìm kiếm
searchInput.addEventListener('input', () => {
    if (searchInput.value.trim() === '') {
        renderDocuments();
    }
});

// Xử lý sự kiện nhấn Enter trong ô tìm kiếm
searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        searchDocuments(searchInput.value);
    }
});

// Xử lý sự kiện click nút tìm kiếm
searchBtn.addEventListener('click', () => {
    searchDocuments(searchInput.value);
});

document.querySelector('.compose-btn').addEventListener('click', () => {
    window.location.href = 'editor.html';
});
