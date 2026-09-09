import os
img_path = "/Users/liyakatali/Downloads/ch2_ohr_ncp_20260330T2317474369_d_img_d18/data/calibrated/20260330/ch2_ohr_ncp_20260330T2317474369_d_img_d18.img"
if os.path.exists(img_path):
    print(f"[SUCCESS] Found .img file! Size: {os.path.getsize(img_path) / (1024*1024*1024):.2f} GB")
else:
    print("[ERROR] Check path.")
