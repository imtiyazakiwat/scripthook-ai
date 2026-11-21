"""Merge forced-alignment word timings with tools/pages.txt -> src/timeline.json"""
import json,re,sys,os
here=os.path.dirname(__file__)
al=json.load(open(os.path.join(here,'align.json')))
al=[(re.sub(r'\(\d+\)','',w),a,b) for w,a,b in al]
pages=[];i=0
def norm(s): return re.sub(r"[^a-z0-9']","",s.lower())
for line in open(os.path.join(here,'pages.txt')):
    if not line.strip() or line.startswith('#'): continue
    scene,gest,emo,text=[x.strip() for x in line.split('|',3)]
    words=[]
    for tok in text.split():
        kw=tok.startswith('*'); tok=tok.lstrip('*')
        n=1
        m=re.match(r'(.*)~(\d+)$',tok)
        if m: tok,n=m.group(1),int(m.group(2))
        seg=al[i:i+n]
        if n==1 and norm(tok).replace("'","")[:3]!=seg[0][0].replace("'","")[:3] and not tok[0].isdigit():
            sys.exit(f"mismatch at {tok} vs {seg[0][0]}")
        if not seg: sys.exit('ran out at '+tok)
        words.append({'text':tok,'kw':kw,'t0':seg[0][1],'t1':seg[-1][2]}); i+=n
    pages.append({'scene':scene,'gesture':gest,'emotion':emo,'words':words,'t0':words[0]['t0'],'t1':words[-1]['t1']})
assert i==len(al),(i,len(al))
json.dump({'duration':al[-1][2]+0.9,'pages':pages},open(os.path.join(here,'..','src','timeline.json'),'w'),indent=1)
print(len(pages),'pages; end',al[-1][2])
