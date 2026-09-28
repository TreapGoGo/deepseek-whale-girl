const status = document.querySelector('#copy-status');
const copyIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"></rect><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"></path></svg>';

function setStatus(message) {
  if (status) status.textContent = message;
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const helper = document.createElement('textarea');
  helper.value = text;
  helper.setAttribute('readonly', '');
  helper.style.position = 'fixed';
  helper.style.opacity = '0';
  document.body.appendChild(helper);
  helper.select();
  const copied = document.execCommand('copy');
  helper.remove();
  if (!copied) throw new Error('copy-failed');
}

function showCopied(button, originalLabel) {
  button.classList.add('copied');
  button.innerHTML = '<span class="copy-icon">✓</span>已复制';
  window.setTimeout(() => {
    button.classList.remove('copied');
    button.innerHTML = originalLabel;
  }, 2200);
}

function showCopyError(button, originalLabel) {
  button.classList.add('copy-error');
  button.textContent = '复制失败';
  window.setTimeout(() => {
    button.classList.remove('copy-error');
    button.innerHTML = originalLabel;
  }, 2600);
}

async function copyImage(imageUrl) {
  if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') throw new Error('image-copy-unsupported');

  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error('image-fetch-failed');
  const sourceBlob = await response.blob();
  let clipboardBlob = sourceBlob;

  if (sourceBlob.type !== 'image/png') {
    const bitmap = await createImageBitmap(sourceBlob);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext('2d').drawImage(bitmap, 0, 0);
    bitmap.close();
    clipboardBlob = await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('image-convert-failed')), 'image/png');
    });
  }

  await navigator.clipboard.write([new ClipboardItem({ 'image/png': clipboardBlob })]);
}

document.querySelectorAll('.copy-button').forEach((button) => {
  button.addEventListener('click', async () => {
    const target = document.getElementById(button.dataset.target);
    if (!target) return;

    try {
      await copyText(target.textContent.trim());
      showCopied(button, `${copyIcon}复制 Prompt`);
      setStatus('Prompt 已复制到剪贴板，可以直接粘贴到你的生图工具。');
    } catch {
      setStatus('浏览器没有开放剪贴板权限，请手动选中 Prompt 复制。');
    }
  });
});

function bindImageCopyButton(button) {
  if (button.dataset.copyReady === 'true') return;
  button.dataset.copyReady = 'true';
  button.addEventListener('click', async () => {
    const imageUrl = button.dataset.image;
    const originalLabel = button.innerHTML;
    try {
      await copyImage(imageUrl);
      showCopied(button, originalLabel);
      setStatus('设定图已复制，可以直接粘贴到支持图片输入的工具。');
    } catch {
      showCopyError(button, originalLabel);
      setStatus('当前浏览器暂不支持直接复制图片，请使用右侧的下载按钮。');
    }
  });
}

document.querySelectorAll('.image-copy-button').forEach(bindImageCopyButton);

const lightbox = document.querySelector('#gallery-lightbox');
const lightboxImage = document.querySelector('#lightbox-image');
const lightboxCaption = document.querySelector('#lightbox-caption');
const lightboxCopyButton = document.querySelector('.lightbox-copy-button');
const lightboxDownloadLink = document.querySelector('.lightbox-download-link');
const lightboxCloseButton = document.querySelector('.lightbox-close');

function openLightbox(image) {
  if (!lightbox || !image) return;
  const imageUrl = image.getAttribute('src');
  lightboxImage.src = imageUrl;
  lightboxImage.alt = image.alt;
  lightboxCaption.textContent = image.alt;
  lightboxCopyButton.dataset.image = imageUrl;
  lightboxDownloadLink.href = imageUrl;
  lightboxDownloadLink.download = imageUrl.split('/').pop();
  document.body.classList.add('lightbox-open');
  lightbox.showModal();
}

if (lightbox) {
  bindImageCopyButton(lightboxCopyButton);
  lightboxCloseButton.addEventListener('click', () => lightbox.close());
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) lightbox.close();
  });
  lightbox.addEventListener('close', () => {
    document.body.classList.remove('lightbox-open');
    lightboxImage.removeAttribute('src');
  });
}

const gallery = document.querySelector('.masonry-gallery');

if (gallery) {
  const communityWork = document.createElement('a');
  const communityImage = document.createElement('img');
  communityWork.href = './assets/gallery/community-2026-09-29.jpg';
  communityWork.target = '_blank';
  communityWork.rel = 'noreferrer';
  communityImage.src = communityWork.href;
  communityImage.alt = '鲸鱼娘社区二创作品（2026-09-29）';
  communityImage.loading = 'eager';
  communityWork.append(communityImage);
  gallery.append(communityWork);
  const galleryCount = document.querySelector('.gallery-heading > span');
  if (galleryCount) {
    galleryCount.textContent = `${gallery.querySelectorAll(':scope > a').length} 张社区作品`;
  }

  const links = [...gallery.querySelectorAll(':scope > a')];
  for (let index = links.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [links[index], links[swapIndex]] = [links[swapIndex], links[index]];
  }
  const items = links.map((link) => {
    const image = link.querySelector('img');
    const tile = document.createElement('div');
    const actions = document.createElement('div');
    const button = document.createElement('button');
    const download = document.createElement('a');
    tile.className = 'gallery-tile';
    actions.className = 'gallery-actions';
    button.className = 'gallery-copy-button';
    button.type = 'button';
    button.dataset.image = image.getAttribute('src');
    button.setAttribute('aria-label', `复制${image.alt}`);
    button.innerHTML = `${copyIcon}<span>复制图片</span>`;
    download.className = 'gallery-download-link';
    download.href = image.getAttribute('src');
    download.download = image.getAttribute('src').split('/').pop();
    download.setAttribute('aria-label', `下载${image.alt}`);
    download.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14"/></svg><span>下载</span>';
    link.addEventListener('click', (event) => {
      event.preventDefault();
      openLightbox(image);
    });
    gallery.insertBefore(tile, link);
    actions.append(button, download);
    tile.append(link, actions);
    bindImageCopyButton(button);
    return tile;
  });

  function layoutGallery() {
    if (items.some((item) => !item.querySelector('img')?.naturalWidth)) return;

    const width = gallery.clientWidth;
    const gap = width <= 560 ? 10 : 14;
    const targetHeight = width <= 560 ? Math.min(170, width * .46) : width / 4.15;
    const rows = [];
    let row = [];
    let ratioTotal = 0;

    items.forEach((item) => {
      const image = item.querySelector('img');
      const ratio = image.naturalWidth / image.naturalHeight;
      row.push({ item, ratio });
      ratioTotal += ratio;

      const projectedHeight = (width - gap * (row.length - 1)) / ratioTotal;
      if (projectedHeight <= targetHeight * 1.18) {
        rows.push({ entries: row, justified: true });
        row = [];
        ratioTotal = 0;
      }
    });

    if (row.length) rows.push({ entries: row, justified: false });

    const fragment = document.createDocumentFragment();
    rows.forEach(({ entries, justified }) => {
      const rowElement = document.createElement('div');
      rowElement.className = 'gallery-row';
      const totalRatio = entries.reduce((sum, entry) => sum + entry.ratio, 0);
      const height = justified
        ? (width - gap * (entries.length - 1)) / totalRatio
        : Math.min(targetHeight, (width - gap * (entries.length - 1)) / totalRatio);

      entries.forEach(({ item, ratio }) => {
        item.style.width = `${height * ratio}px`;
        item.style.height = `${height}px`;
        item.style.gridRowEnd = '';
        item.classList.toggle('is-landscape', ratio >= 1.3);
        rowElement.appendChild(item);
      });
      fragment.appendChild(rowElement);
    });

    gallery.replaceChildren(fragment);
  }

  items.forEach((item) => {
    const image = item.querySelector('img');
    if (image) image.loading = 'eager';
    if (!image?.naturalWidth) image?.addEventListener('load', layoutGallery, { once: true });
  });

  let galleryWidth = 0;
  const galleryObserver = new ResizeObserver(([entry]) => {
    if (entry.contentRect.width === galleryWidth) return;
    galleryWidth = entry.contentRect.width;
    layoutGallery();
  });
  galleryObserver.observe(gallery);
  window.addEventListener('load', layoutGallery, { once: true });
  layoutGallery();
}
