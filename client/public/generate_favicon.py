from PIL import Image, ImageDraw

# Create a new image with white background
size = (16, 16)
image = Image.new('RGBA', size, (255, 255, 255, 0))
draw = ImageDraw.Draw(image)

# EasyMove blue color
blue = (0, 82, 204)
black = (0, 0, 0)

# Draw van body
draw.rectangle([(4, 4), (11, 7)], fill=blue)
# Draw windows
draw.rectangle([(4, 8), (6, 9)], fill=blue)
draw.rectangle([(9, 8), (11, 9)], fill=blue)
# Draw wheels
draw.rectangle([(4, 12), (5, 13)], fill=black)
draw.rectangle([(10, 12), (11, 13)], fill=black)

# Save as favicon
image.save('favicon.ico', format='ICO')
