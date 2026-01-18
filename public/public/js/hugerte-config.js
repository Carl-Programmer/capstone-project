
hugerte.init({
  selector: 'textarea[name="description"]',
  height: 400,
  menubar: 'file edit insert view format tools table help', // ✅ Full top menu
  branding: false,
  automatic_uploads: true,
  images_upload_url: '/admin/lessons/upload-image',
  file_picker_types: 'image',

  // ✅ Plugins for rich text and media
  plugins: 'advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table help wordcount codesample emoticons pagebreak template',

  // ✅ Toolbar (compact + functional)
  toolbar: [
    'undo redo | fullscreen preview | formatselect fontsizeselect | bold italic underline strikethrough forecolor backcolor |',
    'alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media table |',
    'codesample blockquote hr emoticons pagebreak | removeformat code help'
  ].join(' '),

  // ✅ Text formatting options
  style_formats: [
    { title: 'Paragraph', block: 'p' },
    { title: 'Heading 1', block: 'h1' },
    { title: 'Heading 2', block: 'h2' },
    { title: 'Heading 3', block: 'h3' },
    { title: 'Heading 4', block: 'h4' },
    { title: 'Heading 5', block: 'h5' },
    { title: 'Heading 6', block: 'h6' }
  ],

  fontsize_formats: '12px 14px 16px 18px 24px 32px 48px',

  // ✅ Image Upload (5 MB limit)
  automatic_uploads: true,
  file_picker_types: 'image',
  file_picker_callback: (cb, value, meta) => {
    if (meta.filetype !== 'image') return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = function () {
      const file = this.files[0];
      if (!file) return;

      const maxSize = 5 * 1024 * 1024; // 5 MB limit
      if (file.size > maxSize) {
        alert('⚠️ Image too large! Please upload files below 5 MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = function () {
        const id = 'blobid' + new Date().getTime();
        const blobCache = hugerte.activeEditor.editorUpload.blobCache;
        const base64 = reader.result.split(',')[1];
        const blobInfo = blobCache.create(id, file, base64);
        blobCache.add(blobInfo);
        cb(blobInfo.blobUri(), { title: file.name });
      };
      reader.readAsDataURL(file);
    };

    input.click();
  },

  // ✅ Optional: Keep Insert → Media working for YouTube/Drive
  media_url_resolver: function (data, resolve) {
    const youtubeMatch = data.url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/
    );
    const driveMatch = data.url.match(
      /drive\.google\.com\/file\/d\/([\w-]+)/
    );

    if (youtubeMatch) {
      resolve({
        html: `<iframe width="560" height="315" 
                src="https://www.youtube.com/embed/${youtubeMatch[1]}" 
                frameborder="0" allowfullscreen></iframe>`
      });
    } else if (driveMatch) {
      resolve({
        html: `<iframe width="560" height="315" 
                src="https://drive.google.com/file/d/${driveMatch[1]}/preview" 
                frameborder="0" allowfullscreen></iframe>`
      });
    } else {
      resolve({ html: '' });
    }
  }
});

// 🪄 Add helper text for Insert → Media dialog
// 🪄 Add placeholder for Media dialog
document.addEventListener("focusin", () => {
  const dialog = document.querySelector('.tox-dialog');
  if (!dialog) return;

  const title = dialog.querySelector('.tox-dialog__title');
  if (!title) return;

  // 🎥 Insert → Media
  if (title.textContent.toLowerCase().includes('media')) {
    const mediaInput = dialog.querySelector('input.tox-textfield[type="url"]');
    if (mediaInput && !mediaInput.dataset.placeholderSet) {
      mediaInput.placeholder = "Paste YouTube or Google Drive link here...";
      mediaInput.dataset.placeholderSet = "true";
    }
  }

  // 🖼️ Insert → Image
  if (title.textContent.toLowerCase().includes('image')) {
    const imageInput = dialog.querySelector('input.tox-textfield[type="url"]');
    if (imageInput && !dialog.querySelector('.image-hint')) {
      const hint = document.createElement('small');
      hint.textContent = "Maximum file size: 5 MB";
      hint.classList.add('image-hint');
      hint.style.display = 'block';
      hint.style.marginTop = '4px';
      hint.style.color = '#6b7280'; // Tailwind gray-500
      hint.style.fontSize = '12px';
      imageInput.insertAdjacentElement('afterend', hint);
    }
  }
});
