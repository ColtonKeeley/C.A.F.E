import ollama
from PIL import Image, ImageFilter
import io
#test test 
def preprocess_for_cafe(image_path, output_size=(448, 448)):
    # 1. Load the image
    with Image.open(image_path) as img:
        img = img.convert("RGB")

        img = img.resize(output_size, Image.Resampling.LANCZOS)

        # Helps a light model to read text.
        img = img.filter(ImageFilter.SHARPEN)
        
        #outputs image to our current directoy
        img.save('./processed_image.png')
        
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='JPEG')
        return img_byte_arr.getvalue()

ollama.generate(model='qwen3-vl:4b', keep_alive=-1)

def classify_file_image(image_path, prompt):
    print("asking ollama", prompt)
    img_bytes = preprocess_for_cafe(image_path)
    response = ollama.chat(
        model='qwen3-vl:4b',
        messages=[{
            'role': 'user',
            'content': '<|vision_start|><|image_pad|><|vision_end|> use 1-2 words for the answer' + prompt,
            'images': [img_bytes] 
        }],
        options={
            'num_ctx': 1024,
            
        }
    )
    return response['message']['content']

print(classify_file_image('./image.png', 'Classify this file, is it spam, is it a subscription, is it a receipt, is it an ad, or is it multiple (list them if so)'))
print(classify_file_image('./image.png', 'What is the date of this email?'))
