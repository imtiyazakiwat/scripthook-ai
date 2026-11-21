#!/bin/bash
# QA a rendered reel: specs, loudness, A/V duration, contact sheets, transition frames
V=$1; O=$2; mkdir -p $O
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,sample_rate,channels:format=duration,bit_rate -of default=nw=1 "$V"
ffmpeg -hide_banner -i "$V" -af loudnorm=print_format=summary -f null - 2>&1 | grep -E "Input (Integrated|True Peak|LRA)"
ffmpeg -v error -y -i "$V" -vf "fps=1,scale=270:-1,tile=10x2" $O/sheet_%02d.jpg
ffmpeg -i "$V" -vf "select='gt(scene,0.25)',showinfo" -f null - 2>&1 | grep -o "pts_time:[0-9.]*" | tr '\n' ' '; echo
