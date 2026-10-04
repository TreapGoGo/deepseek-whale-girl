"""Validate the static site and package archived workflows. Standard library only."""
import collections
import json
import re
import sys
import urllib.parse
import zipfile
from html.parser import HTMLParser
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/'site'

class Page(HTMLParser):
    def __init__(self):
        super().__init__();self.ids=[];self.links=[];self.images=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id' in a:self.ids.append(a['id'])
        if tag in ('a','link') and a.get('href'):self.links.append(a['href'])
        if tag=='script' and a.get('src'):self.links.append(a['src'])
        if tag=='img' and a.get('src'):self.links.append(a['src']);self.images.append(a)

def main():
    errors=[]
    pages={}
    for path in SITE.glob('*.html'):
        page=Page();page.feed(path.read_text(encoding='utf-8'));pages[path]=page
        errors.extend(f'{path.name}: duplicate id {id}' for id,count in collections.Counter(page.ids).items() if count>1)
        for image in page.images:
            if 'alt' not in image:errors.append(f'{path.name}: missing image alt')
    for path,page in pages.items():
        for link in page.links:
            url=urllib.parse.urlparse(link)
            if url.scheme or url.netloc or link=='#':continue
            target=(path.parent/urllib.parse.unquote(url.path)).resolve() if url.path else path
            if not target.is_relative_to(SITE):errors.append(f'{path.name}: escaping link {link}');continue
            if not target.exists():errors.append(f'{path.name}: missing {link}')
            elif url.fragment and target in pages and url.fragment not in pages[target].ids:
                errors.append(f'{path.name}: missing anchor {link}')
    manifest=json.loads((SITE/'assets/gallery/manifest.json').read_text(encoding='utf-8'))['works']
    seen=set()
    for work in manifest:
        if work['id'] in seen:errors.append('Duplicate manifest id '+work['id'])
        seen.add(work['id'])
        if work['width']<=0 or work['height']<=0:errors.append('Bad dimensions '+work['id'])
        for field in ('src','original'):
            if not (SITE/work[field][2:]).is_file():errors.append('Missing asset '+work[field])
    gallery=[x for x in manifest if x.get('gallery') is not False]
    for work in gallery:
        if work['id'] not in pages[SITE/'index.html'].ids:errors.append('Missing gallery card '+work['id'])
    folder=SITE/'assets/workflows/comfyui-issue-2'
    jsons=list(folder.glob('*.json'))
    if len(jsons)!=6:errors.append('Expected 6 workflows')
    for path in jsons:
        task=json.loads(path.read_text(encoding='utf-8-sig'))
        if set(task)!=set(map(str,range(1,10))):errors.append('Unexpected nodes '+path.name)
        if task['6']['inputs']['seed']!=int(path.stem.split('seed')[-1]):errors.append('Incorrect seed '+path.name)
        for node in task.values():
            if not {'class_type','inputs'} <= set(node):errors.append('Invalid node '+path.name)
            for value in node['inputs'].values():
                if isinstance(value,list) and (len(value)!=2 or str(value[0]) not in task):errors.append('Bad connection '+path.name)
        text=path.read_text(encoding='utf-8-sig')
        if re.search(r'sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|-----BEGIN .*PRIVATE KEY-----',text):errors.append('Possible credential '+path.name)
    bundle=folder.parent/'comfyui-issue-2.zip'
    with zipfile.ZipFile(bundle,'w',zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(folder.iterdir()):
            if path.is_file():archive.write(path,path.name)
    with zipfile.ZipFile(bundle) as archive:
        if archive.testzip():errors.append('Corrupt workflow archive')
    # Byte-for-byte archive validation; no execution of downloaded models/workflows.
    with zipfile.ZipFile(bundle) as archive:
        for path in jsons:
            if archive.read(path.name)!=path.read_bytes():errors.append('Archive mismatch '+path.name)
    print(json.dumps({'pages':len(pages),'gallery':len(gallery),'handmade':sum(x['handmade'] for x in gallery),'archived':len(manifest),'workflows':len(jsons),'errors':errors},ensure_ascii=False))
    return bool(errors)

if __name__=='__main__':sys.exit(main())
