"""Rebuild static gallery markup from the reviewed manifest (no remote reads)."""
import html
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

def main():
    source=ROOT/'site/index.html'
    document=source.read_text(encoding='utf-8')
    manifest=json.loads((ROOT/'site/assets/gallery/manifest.json').read_text(encoding='utf-8'))
    cards=[]
    for work in manifest['works']:
        if work.get('gallery') is False:continue
        esc=lambda value:html.escape(str(value),quote=True)
        caption=work['title'] if work['author'] in work['title'] else work['title']+'（作者：'+work['author']+'）'
        cards.append(f'<a id="{esc(work["id"])}" href="{esc(work["original"])}" target="_blank" rel="noreferrer" data-author="{esc(work["author"])}" data-handmade="{str(work["handmade"]).lower()}" data-original="{esc(work["original"])}" data-issue-url="{esc(work["issueUrl"])}"><img src="{esc(work["src"])}" alt="{esc(caption)}" width="{work["width"]}" height="{work["height"]}" loading="lazy" /></a>')
    start=document.index('        <section class="gallery-section"')
    end=document.index('</section>',start)+len('</section>')
    section='        <section class="gallery-section" id="gallery" aria-labelledby="gallery-title"><div class="gallery-heading"><div><p class="section-label">二创大全</p><h2 id="gallery-title">社区画廊</h2></div><span>'+str(len(cards))+' 张社区作品</span></div><p class="gallery-intro">来自社区的不同画风与创意。点击图片放大查看，悬停可复制或下载；作品署名与投稿来源随图片展示。</p><div class="masonry-gallery">\n          '+'\n          '.join(cards)+'\n        </div></section>'
    source.write_text(document[:start]+section+document[end:],encoding='utf-8',newline='\n')
    print(f'Built {len(cards)} gallery entries')

if __name__=='__main__':main()
