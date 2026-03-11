import os
from PIL import Image

folder = r'c:\Users\Usuario\OneDrive\Área de Trabalho\pixellab\parceiros'
for filename in os.listdir(folder):
    if filename.endswith(('.jpg', '.png')) and not filename.endswith('_alpha.png'):
        input_path = os.path.join(folder, filename)
        output_filename = filename.rsplit('.', 1)[0] + '_alpha.png'
        output_path = os.path.join(folder, output_filename)
        
        try:
            img = Image.open(input_path).convert("RGBA")
            datas = img.getdata()
            newData = []
            for item in datas:
                # If pixel is near white
                if item[0] > 240 and item[1] > 240 and item[2] > 240:
                    newData.append((255, 255, 255, 0))
                else:
                    newData.append(item)
            img.putdata(newData)
            img.save(output_path, "PNG")
            print(f"Processed {filename}")
        except Exception as e:
            print(f"Failed {filename}: {e}")
