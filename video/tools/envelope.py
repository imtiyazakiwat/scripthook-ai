"""Per-frame (30fps) mouth-open envelope + spectral 'brightness' for viseme choice."""
import numpy as np,wave,json,os,subprocess,sys
here=os.path.dirname(__file__);src=os.path.join(here,'..','public','vo.wav')
raw=subprocess.run(['ffmpeg','-v','error','-i',src,'-ac','1','-ar','16000','-f','s16le','-'],capture_output=True).stdout
x=np.frombuffer(raw,np.int16).astype(float)/32768;sr=16000;fps=30;h=sr//fps
n=len(x)//h;env=[];bright=[]
for i in range(n):
    s=x[i*h:(i+1)*h];r=np.sqrt((s**2).mean()+1e-12);env.append(r)
    S=np.abs(np.fft.rfft(s*np.hanning(len(s))));f=np.fft.rfftfreq(len(s),1/sr)
    bright.append(float((S[f>2500].sum())/(S.sum()+1e-9)))
env=np.array(env);db=20*np.log10(env+1e-9)
o=np.clip((db+42)/30,0,1)  # -42dB closed .. -12dB fully open
o=np.convolve(o,[0.25,0.5,0.25],'same')
json.dump({'open':[round(float(v),3) for v in o],'bright':[round(b,3) for b in bright]},open(os.path.join(here,'..','src','envelope.json'),'w'))
print(n,'frames')
