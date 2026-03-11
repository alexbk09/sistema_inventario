from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
from PIL import Image
import io
import uvicorn
import logging

logger = logging.getLogger(__name__)

# globals declared at module level to be shared across requests
processor = None
model = None
translator_tokenizer = None
translator_model = None

app = FastAPI(title="Image AI Service")


def simple_tags_from_caption(caption: str, lang: str = 'es', topn: int = 6):
    import re
    # small spanish stopwords list; extend if needed
    spanish_stopwords = set([
        'el','la','los','las','un','una','unos','unas','de','del','y','con','sin','por','para',
        'en','sobre','entre','que','se','es','son','esta','está','este','esta','sus','su','al',
        'como','más','muy','muy','desde','hasta','o','su','sus'
    ])
    english_stopwords = set([
        'the','a','an','and','of','in','on','with','for','to','is','are','its','it','that','this'
    ])
    stopwords = spanish_stopwords if lang and lang.startswith('es') else english_stopwords
    text = re.sub(r'[^\w\s]', ' ', caption.lower())
    words = [w for w in text.split() if w not in stopwords and len(w) > 2]
    seen = []
    for w in words:
        if w not in seen:
            seen.append(w)
    return seen[:topn]


@app.on_event("startup")
def load_model():
    global processor, model
    try:
        from transformers import BlipProcessor, BlipForConditionalGeneration
        processor = BlipProcessor.from_pretrained('Salesforce/blip-image-captioning-base')
        model = BlipForConditionalGeneration.from_pretrained('Salesforce/blip-image-captioning-base')
        logger.info('BLIP model loaded')
    except Exception as e:
        processor = None
        model = None
        logger.exception('Failed loading BLIP model: %s', e)


@app.post("/process")
async def process_image(
    file: UploadFile = File(...),
    lang: str = Form('es'),
    verbose: str = Form('false'),
    tags_from_caption: str = Form('true')
):
    # parse booleans
    verbose_flag = str(verbose).lower() in ('1', 'true', 'yes')
    tags_flag = str(tags_from_caption).lower() in ('1', 'true', 'yes')

    if processor is None or model is None:
        return JSONResponse({'error': 'model not loaded; check logs and dependencies'}, status_code=500)

    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert('RGB')
    except Exception:
        return JSONResponse({'error': 'invalid image'}, status_code=400)

    try:
        inputs = processor(images=image, return_tensors='pt')
        gen_kwargs = {'max_length': 30, 'num_beams': 4}
        if verbose_flag:
            gen_kwargs['max_length'] = 80
            gen_kwargs['num_beams'] = 5
        out = model.generate(**inputs, **gen_kwargs)
        caption = processor.decode(out[0], skip_special_tokens=True)
        logger.info('Generated caption (pre-translation)', {'caption': caption, 'lang': lang, 'verbose': verbose_flag, 'tags_flag': tags_flag})

        # fallback: if caption is empty, try a sampling-based generation
        if not caption or not caption.strip():
            try:
                logger.info('Caption empty, retrying with sampling')
                gen_kwargs_fallback = {'max_length': 40, 'do_sample': True, 'top_k': 50, 'top_p': 0.95, 'num_return_sequences': 1}
                out2 = model.generate(**inputs, **gen_kwargs_fallback)
                caption = processor.decode(out2[0], skip_special_tokens=True)
                logger.info('Generated caption fallback', {'caption': caption})
            except Exception as e:
                logger.exception('Fallback generation failed: %s', e)

        # translate to Spanish if requested
        target_lang = str(lang or 'es').strip().lower()
        if target_lang in ('', 'null', 'none', 'undefined'):
            target_lang = 'es'
        logger.info('Caption before translation', {'caption': caption, 'target_lang': target_lang})
        if target_lang.startswith('es') and caption:
            try:
                global translator_tokenizer, translator_model
                if translator_tokenizer is None or translator_model is None:
                    from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
                    translator_tokenizer = AutoTokenizer.from_pretrained('Helsinki-NLP/opus-mt-en-es')
                    translator_model = AutoModelForSeq2SeqLM.from_pretrained('Helsinki-NLP/opus-mt-en-es')
                    logger.info('Translator model loaded')
                inputs_t = translator_tokenizer(caption, return_tensors='pt', truncation=True)
                translated = translator_model.generate(**inputs_t, max_length=128)
                caption = translator_tokenizer.decode(translated[0], skip_special_tokens=True)
                logger.info('Caption after translation', {'caption': caption})
            except Exception as e:
                logger.exception('Translation failed: %s', e)
                # keep original caption if translation fails

        tags = []
        if tags_flag:
            tags = simple_tags_from_caption(caption, lang=target_lang, topn=8)

        return {'caption': caption, 'tags': tags}
    except Exception as e:
        return JSONResponse({'error': str(e)}, status_code=500)


if __name__ == '__main__':
    uvicorn.run(app, host='127.0.0.1', port=8001)
