from markdrop import extract_images, make_markdown, extract_tables_from_pdf

source_pdf = 'C:/Users/rohit/Documents/CIC/Room-Occupancy-Predictor/docs/Training-and-experimentation-guide.pdf'    # Replace with your local PDF file path or a URL
output_dir = 'C:/Users/rohit/Documents/CIC/Room-Occupancy-Predictor/docs/'                 # Replace with desired output directory's path

make_markdown(source_pdf, output_dir)
extract_images(source_pdf, output_dir)
extract_tables_from_pdf(source_pdf, output_dir=output_dir)