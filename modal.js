// Modal component for document viewer
class DocumentViewerModal {
    constructor() {
        this.modal = null;
        this.viewer = null;
        this.init();
    }

    init() {
        // Create modal element
        this.modal = document.createElement('div');
        this.modal.className = 'modal';
        this.modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <div class="document-viewer"></div>
            </div>
        `;

        // Add modal to body
        document.body.appendChild(this.modal);

        // Get viewer element
        this.viewer = this.modal.querySelector('.document-viewer');

        // Close button functionality
        const closeBtn = this.modal.querySelector('.close');
        closeBtn.onclick = () => this.hide();

        // Click outside to close
        window.onclick = (event) => {
            if (event.target === this.modal) {
                this.hide();
            }
        };
    }

    show() {
        this.modal.style.display = 'block';
    }

    hide() {
        this.modal.style.display = 'none';
        this.viewer.innerHTML = ''; // Clear viewer content
    }

    async viewDocument(file) {
        this.show();
        this.viewer.innerHTML = '<div class="loading">Đang tải tài liệu...</div>';

        try {
            const reader = new FileReader();

            reader.onload = (e) => {
                const content = e.target.result;
                const fileType = file.type;

                if (fileType.includes('pdf')) {
                    // Display PDF
                    this.viewer.innerHTML = `
                        <iframe src="${content}" width="100%" height="100%" frameborder="0"></iframe>
                    `;
                } else if (fileType.includes('text') || fileType.includes('document')) {
                    // Display text content
                    this.viewer.innerHTML = `
                        <div class="text-content">${content}</div>
                    `;
                } else {
                    this.viewer.innerHTML = '<div class="error">Không thể hiển thị định dạng tài liệu này</div>';
                }
            };

            reader.onerror = () => {
                this.viewer.innerHTML = '<div class="error">Lỗi khi đọc tài liệu</div>';
            };

            if (file.type.includes('text')) {
                reader.readAsText(file);
            } else {
                reader.readAsDataURL(file);
            }
        } catch (error) {
            this.viewer.innerHTML = '<div class="error">Lỗi khi xử lý tài liệu</div>';
        }
    }
}

export const documentViewer = new DocumentViewerModal();