import numpy as np
from PIL import Image

img_path = "/Users/liyakatali/Downloads/ch2_ohr_ncp_20260330T2317474369_d_img_d18/data/calibrated/20260330/ch2_ohr_ncp_20260330T2317474369_d_img_d18.img"
width = 12000
height = 91971

print("[COMPUTED] Opening raw stream non-destructively...")
# Open the file in read-binary mode without altering it
with open(img_path, "rb") as f:
    # Instead of reading 1.1GB, let's just read the very first 2000 lines (top strip) to make a quick preview
    preview_height = 2000
    bytes_to_read = width * preview_height
    
    raw_data = f.read(bytes_to_read)
    
    # Convert raw bytes into a 2D Numpy array matching XML specifications
    arr = np.frombuffer(raw_data, dtype=np.uint8).reshape((preview_height, width))
    
    # Downsample it so it's small enough for a web browser view (take every 10th pixel)
    small_arr = arr[::10, ::10]
    
    # Save as a safe local PNG preview for our frontend
    img = Image.fromarray(small_arr)
    img.save("lunar_preview.png")
    print("[SUCCESS] Non-destructive preview generated: lunar_preview.png")
