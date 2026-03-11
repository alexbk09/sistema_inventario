#!/usr/bin/env python
"""
Minimal local image caption + tag generator using BLIP (Hugging Face).
Free / open-source approach. Works on CPU but may be slow.

Usage: python image_caption.py /full/path/to/image.jpg
Outputs JSON to stdout: {"caption":"..","tags":["..",...]}
"""
import sys
import json
import os
import re

from PIL import Image

def simple_tags_from_caption(caption, topn=5):
    stopwords = set([
        'the','a','an','and','of','in','on','with','for','to','is','are','its','it','that','this'
    ])
    text = re.sub(r'[^a-zA-Z0-9\s]', '', caption.lower())
    words = [w for w in text.split() if w not in stopwords and len(w) > 2]
    seen = []
    for w in words:
        if w not in seen:
            seen.append(w)
    return seen[:topn]

def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error':'no image path'}))
        return
    image_path = sys.argv[1]
    if not os.path.exists(image_path):
        print(json.dumps({'error':'file not found'}))
        return

    # Lazy import transformers to avoid failing if not installed until runtime
    try:
        from transformers import BlipProcessor, BlipForConditionalGeneration
        import torch
    except Exception as e:
        print(json.dumps({'error': 'missing python dependencies: transformers, torch, pillow'}))
        return

    try:
        image = Image.open(image_path).convert('RGB')
    except Exception as e:
        print(json.dumps({'error':'invalid image'}))
        return

    try:
        processor = BlipProcessor.from_pretrained('Salesforce/blip-image-captioning-base')
        model = BlipForConditionalGeneration.from_pretrained('Salesforce/blip-image-captioning-base')
        inputs = processor(images=image, return_tensors='pt')
        out = model.generate(**inputs)
        caption = processor.decode(out[0], skip_special_tokens=True)
        tags = simple_tags_from_caption(caption, topn=6)
        print(json.dumps({'caption': caption, 'tags': tags}, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({'error': str(e)}))

if __name__ == '__main__':
    main()
