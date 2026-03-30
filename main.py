import ollama
from PIL import Image, ImageFilter
import io

def preprocess_for_cafe(image_path, output_size=(448, 448)):
    # 1. Load the image
    with Image.open(image_path) as img:
        # 2. Convert to RGB (handles PNG transparency)
        img = img.convert("RGB")
        
        # 3. Resize (Shrink) to Qwen's optimal dimensions
        # Use LANCZOS for high-quality downsampling
        img = img.resize(output_size, Image.Resampling.LANCZOS)
        
        # 4. Apply a Sharpen filter (The 'C' in CAFE)
        # This helps the 4B model 'read' thin text in emails
        img = img.filter(ImageFilter.SHARPEN)
        
        # 5. Convert to bytes for Ollama
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='JPEG')
        return img_byte_arr.getvalue()

def classify_file_image(image_path):
    # Fix 1: Read as raw binary bytes instead of base64 string
    img_bytes = preprocess_for_cafe(image_path)
    response = ollama.chat(
        model='qwen3-vl:4b',
        messages=[{
            'role': 'user',
            'content': '<|vision_start|><|image_pad|><|vision_end|>Classify this file type.',
            'images': [img_bytes] 
        }],
        options={
            'num_ctx': 2048
        }
    )
    return response['message']['content']

print(classify_file_image('./image.png'))
