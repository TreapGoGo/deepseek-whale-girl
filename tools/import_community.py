"""Import GitHub artwork attachments, keeping attribution and local previews.

Run from the repository root. Requires GitHub CLI and Pillow. Never executes
downloaded workflows or code; the generated manifest is reviewed before release.
"""
import concurrent.futures
import argparse
import hashlib
import io
import json
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = 'TreapGoGo/deepseek-whale-girl'

def gh(*args):
    return json.loads(subprocess.check_output(['gh', *args], encoding='utf-8'))

def download(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'whale-girl-community-import'})
    with urllib.request.urlopen(request, timeout=90) as response:
        return response.read()

def field(body, heading):
    found = re.search(r'### ' + re.escape(heading) + r'\s*\n(.*?)(?=\n### |\Z)', body, re.S)
    return found.group(1).strip() if found else ''

def main():
    from PIL import Image, ImageOps, ImageDraw, ImageFont
    sys.stdout.reconfigure(encoding='utf-8')
    parser=argparse.ArgumentParser(description='下载指定 issue 的图片到本地候选区，不自动发布')
    parser.add_argument('--issues',required=True,help='逗号分隔的投稿编号，例如 52,53')
    args=parser.parse_args()
    selected={int(value) for value in args.issues.split(',')}
    issues = gh('issue', 'list', '--repo', REPO, '--state', 'all', '--limit', '200', '--json', 'number,title,body,comments,state,author,url')
    cache = ROOT / '.community-review'
    cache.mkdir(exist_ok=True)
    (cache / 'issues.json').write_text(json.dumps(issues, ensure_ascii=False, indent=2), encoding='utf-8')
    jobs = []
    for issue in sorted(issues, key=lambda x: x['number']):
        if issue['number'] not in selected:
            continue
        texts = [issue['body']] + [comment['body'] for comment in issue['comments']]
        urls = list(dict.fromkeys(url for text in texts for url in re.findall(r'<img\b[^>]*src="([^"]+)"', text)))
        for index, url in enumerate(urls, 1):
            jobs.append((issue, index, url))
    # The external collection stays upstream; locally host representative previews.
    featured=[]
    if 37 in selected:
        issue37 = next(x for x in issues if x['number'] == 37)
        tree = gh('api', 'repos/AATINF/deepseek-whale-girl-assets/git/trees/main?recursive=1')['tree']
        featured = [x['path'] for x in tree if x['path'].startswith('featured/') and x['path'].endswith('.jpg')]
        for index, path in enumerate(featured, 1):
            jobs.append((issue37, index, 'https://raw.githubusercontent.com/AATINF/deepseek-whale-girl-assets/main/' + path))
    output = ROOT / 'site/assets/gallery/submissions'
    output.mkdir(parents=True, exist_ok=True)

    def import_one(job):
        issue, index, url = job
        name = f"issue-{issue['number']:02}-{index:02}"
        if (output/(name+'.webp')).exists():
            raise RuntimeError('候选文件已存在，请先检查而不是覆盖：'+name)
        data = download(url)
        image = ImageOps.exif_transpose(Image.open(io.BytesIO(data))).convert('RGB')
        original = output / (name + '.webp')
        image.save(original, 'WEBP', quality=95, method=6)
        preview = image.copy()
        preview.thumbnail((1000, 1000), Image.Resampling.LANCZOS)
        preview.save(output / (name + '-preview.webp'), 'WEBP', quality=88, method=6)
        title = field(issue['body'], '作品名称或简短说明') or issue['title']
        if title == 'AI生成':
            title = issue['title']
        author = field(issue['body'], '作者') or issue['author']['login']
        if issue['number'] == 2:
            author = issue['author']['login']
            title = 'ComfyUI 鲸鱼娘工作流测试图'
        if issue['number'] == 37:
            title = '鲸鱼娘二创素材扩展包 · ' + Path(url).stem
        return {'id': name, 'issue': issue['number'], 'title': title, 'author': author,
                'source': field(issue['body'], '原始来源链接'), 'issueUrl': issue['url'],
                'attachment': url, 'handmade': field(issue['body'], '作品是否为纯人工创作？') == '纯人工创作（手绘、手写、手工制作等）',
                'creationType': field(issue['body'], '作品是否为纯人工创作？') or '投稿未说明',
                'src': './assets/gallery/submissions/' + name + '-preview.webp',
                'original': './assets/gallery/submissions/' + name + '.webp',
                'width': image.width, 'height': image.height,
                'pixelHash': hashlib.sha256(image.tobytes()).hexdigest()}

    entries, errors = [], []
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        futures = {pool.submit(import_one, job): job for job in jobs}
        for future in concurrent.futures.as_completed(futures):
            try:
                entry = future.result()
                entries.append(entry)
                print(entry['id'], entry['width'], entry['height'], flush=True)
            except Exception as exc:
                job = futures[future]
                errors.append({'issue':job[0]['number'], 'url':job[2], 'error':str(exc)})
                print('ERROR', errors[-1], flush=True)
    entries.sort(key=lambda x:x['id'])
    (cache / 'imported.json').write_text(json.dumps(entries, ensure_ascii=False, indent=2), encoding='utf-8')
    (cache / 'errors.json').write_text(json.dumps(errors, ensure_ascii=False, indent=2), encoding='utf-8')
    font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 18)
    for batch in range(0, len(entries), 24):
        sheet = Image.new('RGB', (1440, 4 * 390), '#eef2fa')
        draw = ImageDraw.Draw(sheet)
        for i, entry in enumerate(entries[batch:batch+24]):
            im = Image.open(ROOT / 'site' / entry['original'][2:])
            im.thumbnail((228, 345))
            x, y = (i % 6)*240, (i//6)*390
            sheet.paste(im, (x + (240-im.width)//2, y))
            draw.text((x+6,y+350), entry['id'], font=font, fill='#16264b')
        sheet.save(cache / f'contact-{batch//24+1}.jpg')
    print(json.dumps({'imported':len(entries),'errors':errors,'featured':featured}, ensure_ascii=False))
    if errors:
        raise SystemExit(1)

if __name__ == '__main__':
    main()
