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
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightboxImage || event.target.closest('.lightbox-actions')) return;
    lightbox.close();
  });
  lightbox.addEventListener('close', () => {
    document.body.classList.remove('lightbox-open');
    lightboxImage.removeAttribute('src');
  });
}

const gallery = document.querySelector('.masonry-gallery');

if (gallery) {
  const communityWorks = [
    { src: './assets/gallery/community-2026-09-29.jpg', alt: '鲸鱼娘社区二创作品（2026-09-29）' },
    { src: './assets/gallery/meme-26.webp', alt: '鲸鱼娘大冒险、偷懒与跳脸梗图' },
    { src: './assets/gallery/meme-27.webp', alt: '鲸鱼娘误触飞行模式后网络中断的漫画' },
    { src: './assets/gallery/meme-28.webp', alt: '鲸鱼娘与用户互动的连续漫画' },
    { src: './assets/gallery/meme-29.webp', alt: '鲸鱼娘先去吃饭的测试梗图' },
    { src: './assets/gallery/meme-30.webp', alt: '鲸鱼娘把 DeepSeek 鲸鱼标志认成自己的漫画' },
    { src: './assets/gallery/meme-31.webp', alt: '鲸鱼娘偷偷玩中文 Wordle 的漫画' },
    { src: './assets/gallery/meme-32.webp', alt: '糖鲸表情包；作者未知，来源为长期流传的 QQ 群表情包，投稿 Issue #1' },
    { src: './assets/gallery/meme-33.webp', alt: 'fufu风格的鲸鱼娘（作者：尘间_PX / SpaceOFDust_PX，投稿 Issue #4）' },
    { src: './assets/gallery/meme-34.webp', alt: 'fufu风格的鲸鱼娘二创（作者：尘间_PX / SpaceOFDust_PX，投稿 Issue #4）' },
    { src: './assets/gallery/meme-35.webp', alt: 'fufu风格的鲸鱼娘表情（作者：尘间_PX / SpaceOFDust_PX，投稿 Issue #4）' },
    { src: './assets/gallery/meme-36.webp', alt: '来吃你家大米了（作者：尘间_PX / SpaceOFDust_PX，投稿 Issue #5）' },
    { src: './assets/gallery/meme-37.webp', alt: '大肥鱼扫除（作者：心脏等分；来源：Bilibili，投稿 Issue #6）' },
    { src: './assets/gallery/meme-38.webp', alt: '马克笔与彩铅绘制的站立蓝色大肥鱼（作者：标准大气吖，投稿 Issue #9）', author: '标准大气吖', handmade: true },
    { src: './assets/gallery/meme-39.webp', alt: '鲸鱼娘全身手绘设定草图（作者：标准大气吖，投稿 Issue #9）', author: '标准大气吖', handmade: true },
    { src: './assets/gallery/meme-40.webp', alt: '马克笔与彩铅绘制的站立蓝色大肥鱼（作者：标准大气吖，投稿 Issue #9）', author: '标准大气吖', handmade: true },
  ];

  communityWorks.forEach(({ src, alt, author, handmade }, index) => {
    const work = document.createElement('a');
    const image = document.createElement('img');
    work.href = src;
    work.target = '_blank';
    work.rel = 'noreferrer';
    image.src = src;
    image.alt = alt;
    image.loading = index === 0 ? 'eager' : 'lazy';
    work.append(image);
    if (author) work.dataset.author = author;
    if (handmade) work.dataset.handmade = 'true';
    gallery.append(work);
  });
  const galleryHeading = document.querySelector('.gallery-heading');
  const galleryCount = galleryHeading?.querySelector(':scope > span');
  const handmadeCount = gallery.querySelectorAll(':scope > a[data-handmade="true"]').length;
  const galleryControls = document.createElement('div');
  galleryControls.className = 'gallery-heading-actions';
  const handmadeToggle = document.createElement('button');
  handmadeToggle.className = 'handmade-mode-toggle';
  handmadeToggle.type = 'button';
  handmadeToggle.setAttribute('aria-pressed', 'false');
  handmadeToggle.setAttribute('aria-controls', 'community-gallery');
  handmadeToggle.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15.8 4.2 4 4M4 20l4.2-.9L19 8.3a2.83 2.83 0 0 0-4-4L4.2 15.1 4 20Z"/><path d="M13.5 6.5 17.5 10.5"/></svg><span>能工智人古法手搓专区</span>';
  gallery.id = 'community-gallery';
  galleryControls.append(handmadeToggle);
  if (galleryCount) {
    galleryCount.className = 'gallery-count';
    galleryControls.prepend(galleryCount);
  }
  galleryHeading?.append(galleryControls);

  const links = [...gallery.querySelectorAll(':scope > a')];
  const shuffle = (entries) => {
    for (let index = entries.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [entries[index], entries[swapIndex]] = [entries[swapIndex], entries[index]];
    }
    return entries;
  };
  const handmadeLinks = shuffle(links.filter((link) => link.dataset.handmade === 'true'));
  const regularLinks = shuffle(links.filter((link) => link.dataset.handmade !== 'true'));
  const orderedLinks = [];
  let regularSinceHandmade = 0;
  while (regularLinks.length || handmadeLinks.length) {
    const floorReached = regularSinceHandmade >= 4;
    const variedPlacement = regularSinceHandmade > 0 && Math.random() < 0.28;
    const showHandmade = handmadeLinks.length && (!regularLinks.length || floorReached || variedPlacement);
    const link = showHandmade ? handmadeLinks.shift() : regularLinks.shift();
    orderedLinks.push(link);
    regularSinceHandmade = showHandmade ? 0 : regularSinceHandmade + 1;
  }

  if (galleryCount) {
    galleryCount.textContent = `${links.length} 张社区作品 · 手作 ${handmadeCount} 件`;
  }

  const items = orderedLinks.map((link) => {
    const image = link.querySelector('img');
    const tile = document.createElement('div');
    const actions = document.createElement('div');
    const button = document.createElement('button');
    const download = document.createElement('a');
    const isHandmade = link.dataset.handmade === 'true';
    tile.className = `gallery-tile${isHandmade ? ' is-handmade' : ''}`;
    if (isHandmade) {
      const author = document.createElement('span');
      author.className = 'gallery-author-caption';
      author.textContent = `手作 · ${link.dataset.author || '作者未署名'}`;
      link.append(author);
    }
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

  let handmadeMode = false;
  handmadeToggle.addEventListener('click', () => {
    handmadeMode = !handmadeMode;
    handmadeToggle.setAttribute('aria-pressed', String(handmadeMode));
    handmadeToggle.querySelector('span').textContent = handmadeMode ? '返回全部作品' : '能工智人古法手搓专区';
    gallery.classList.toggle('is-handmade-mode', handmadeMode);
    if (galleryCount) {
      galleryCount.textContent = handmadeMode
        ? `手搓专区 · ${handmadeCount} 件作品`
        : `${links.length} 张社区作品 · 手作 ${handmadeCount} 件`;
    }
    layoutGallery();
  });

  function layoutGallery() {
    if (items.some((item) => !item.querySelector('img')?.naturalWidth)) return;

    const width = gallery.clientWidth;
    const gap = width <= 560 ? 10 : 14;
    const handmadeMode = gallery.classList.contains('is-handmade-mode');
    const visibleItems = items.filter((item) => !handmadeMode || item.classList.contains('is-handmade'));
    items.forEach((item) => { item.hidden = handmadeMode && !item.classList.contains('is-handmade'); });
    const fragment = document.createDocumentFragment();

    if (handmadeMode) {
      const columns = width <= 700 ? 1 : 2;
      for (let index = 0; index < visibleItems.length; index += columns) {
        const rowElement = document.createElement('div');
        rowElement.className = 'gallery-row handmade-row';
        visibleItems.slice(index, index + columns).forEach((item) => {
          item.style.width = '';
          item.style.height = '';
          item.classList.toggle('is-solo', columns === 2 && index + columns > visibleItems.length && visibleItems.length % columns === 1);
          rowElement.appendChild(item);
        });
        fragment.appendChild(rowElement);
      }
      gallery.replaceChildren(fragment);
      return;
    }

    const targetHeight = width <= 560 ? Math.min(170, width * .46) : width / 4.15;
    const rows = [];
    let row = [];
    let ratioTotal = 0;

    visibleItems.forEach((item) => {
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
