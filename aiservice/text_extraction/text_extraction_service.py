from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import os
import traceback
from datetime import datetime
import PyPDF2
import docx
import zipfile
import xml.etree.ElementTree as ET

# LayoutLMv3 and modern OCR imports
try:
    from transformers import LayoutLMv3Processor, LayoutLMv3ForTokenClassification
    from pdf2image import convert_from_path
    from PIL import Image, ImageFilter, ImageEnhance
    import torch
    import numpy as np

    # OpenCV import for advanced preprocessing
    try:
        import cv2
        OPENCV_AVAILABLE = True
    except ImportError:
        OPENCV_AVAILABLE = False

    LAYOUTLM_AVAILABLE = True
    logger = logging.getLogger(__name__)
    logger.info("LayoutLMv3 libraries loaded successfully")

    # Fallback OCR imports
    try:
        import pytesseract
        TESSERACT_AVAILABLE = True

        # Set Tesseract path immediately when imported
        tesseract_path = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        if os.path.exists(tesseract_path):
            pytesseract.pytesseract.tesseract_cmd = tesseract_path
            logger.info(f"Tesseract configured at: {tesseract_path}")

    except ImportError:
        TESSERACT_AVAILABLE = False
        logger.warning("Tesseract not available as fallback")

except ImportError as e:
    LAYOUTLM_AVAILABLE = False
    TESSERACT_AVAILABLE = False
    OPENCV_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.error(f"LayoutLMv3 libraries not available: {e}")
    logger.error("Text extraction will be severely limited")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

class TextExtractor:
    def __init__(self):
        self.layoutlm_processor = None
        self.layoutlm_model = None

        if LAYOUTLM_AVAILABLE:
            try:
                logger.info("Initializing LayoutLMv3 model...")

                # Path to your local model
                model_path = r"D:\capstone\Legal_Arch_aiu\storage\app\models\layoutlmv3-base"

                # Load only processor for OCR functionality (we don't need the model for basic text extraction)
                self.layoutlm_processor = LayoutLMv3Processor.from_pretrained(model_path)
                # We'll use the processor's built-in OCR capability instead of the token classification model

                logger.info("LayoutLMv3 model initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize LayoutLMv3: {e}")
                self.layoutlm_processor = None
                self.layoutlm_model = None
    
    def preprocess_image_for_ocr(self, image):
        """Preprocess image to improve OCR accuracy"""
        try:
            if OPENCV_AVAILABLE:
                # Use OpenCV for advanced preprocessing
                if isinstance(image, Image.Image):
                    image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
                
                # Convert to grayscale
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
                
                # Apply denoising
                denoised = cv2.medianBlur(gray, 3)
                
                # Apply adaptive thresholding
                thresh = cv2.adaptiveThreshold(
                    denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
                )
                
                # Morphological operations to clean up the image
                kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 1))
                cleaned = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
                
                # Convert back to PIL Image
                return Image.fromarray(cleaned)
            else:
                # Use PIL for enhanced preprocessing
                if not isinstance(image, Image.Image):
                    return image

                # Convert to grayscale
                gray = image.convert('L')

                # Enhance sharpness first
                sharpness_enhancer = ImageEnhance.Sharpness(gray)
                sharp = sharpness_enhancer.enhance(1.5)

                # Enhance contrast
                contrast_enhancer = ImageEnhance.Contrast(sharp)
                enhanced = contrast_enhancer.enhance(1.8)

                # Apply adaptive-like threshold using point operations
                # Get image statistics for better threshold
                import statistics
                pixels = list(enhanced.getdata())
                mean_val = statistics.mean(pixels)

                # Use mean-based threshold
                threshold = int(mean_val * 0.9)  # Slightly below mean for better text separation
                processed = enhanced.point(lambda p: 255 if p > threshold else 0)

                return processed
                
        except Exception as e:
            logger.error(f"Image preprocessing failed: {str(e)}")
            return image

    def extract_text_with_layoutlm(self, image):
        """Extract text using LayoutLMv3 processor's OCR capabilities"""
        if not self.layoutlm_processor:
            return ""

        try:
            logger.info("Using LayoutLMv3 processor for text extraction")

            # Ensure image is PIL Image
            if not isinstance(image, Image.Image):
                image = Image.fromarray(image)

            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')

            # Use the processor's apply_ocr method to get words and bounding boxes
            # This is the correct way to use LayoutLMv3 processor for OCR
            encoding = self.layoutlm_processor(image, return_tensors="pt")

            # The processor extracts words during preprocessing
            # Access the words from the processor's internal OCR results
            if hasattr(self.layoutlm_processor, 'apply_ocr'):
                # Get OCR words directly
                words, boxes = self.layoutlm_processor.apply_ocr(image)
                if words:
                    extracted_text = ' '.join(words)
                    logger.info(f"LayoutLMv3 OCR extracted {len(words)} words")
                    return extracted_text.strip()

            # Fallback: try to get text from input tokens
            if 'input_ids' in encoding:
                input_ids = encoding['input_ids'][0]
                # Decode the tokens back to text
                decoded_text = self.layoutlm_processor.tokenizer.decode(
                    input_ids,
                    skip_special_tokens=True,
                    clean_up_tokenization_spaces=True
                )
                if decoded_text and len(decoded_text.strip()) > 5:
                    logger.info(f"LayoutLMv3 token decoding successful")
                    return decoded_text.strip()

            logger.warning("LayoutLMv3 failed to extract meaningful text")
            return ""

        except Exception as e:
            logger.error(f"LayoutLMv3 processor extraction failed: {str(e)}")
            logger.error(f"Error details: {traceback.format_exc()}")
            return ""

    def extract_text_with_ocr(self, file_path):
        """Extract text from image-based PDF using LayoutLMv3 and fallback OCR"""
        if not LAYOUTLM_AVAILABLE and not TESSERACT_AVAILABLE:
            logger.warning("OCR libraries not available, cannot extract from image-based PDF")
            return ""
            
        try:
            # Check if Tesseract is available
            try:
                pytesseract.get_tesseract_version()
            except Exception as e:
                logger.error(f"Tesseract not found: {e}")
                logger.error("Please install Tesseract OCR:")
                logger.error("1. Download from: https://github.com/UB-Mannheim/tesseract/wiki")
                logger.error("2. Install to C:\\Program Files\\Tesseract-OCR\\")
                logger.error("3. Add to PATH or uncomment the tesseract_cmd line in the code")
                return ""
            
            logger.info(f"Attempting OCR extraction from: {file_path}")
            
            # Convert PDF to images - optimize for speed vs quality balance
            # Set poppler path for pdf2image
            poppler_path = r'C:\poppler\poppler-23.08.0\Library\bin'
            if not os.path.exists(poppler_path):
                # Try alternative paths
                alt_paths = [
                    r'C:\poppler\Library\bin',
                    r'C:\poppler\bin',
                    r'C:\Program Files\poppler\bin'
                ]
                for path in alt_paths:
                    if os.path.exists(path):
                        poppler_path = path
                        break
                else:
                    poppler_path = None

            # Increase PIL's image size limit for OCR processing
            from PIL import Image
            Image.MAX_IMAGE_PIXELS = None  # Remove the limit

            # Use lower DPI for maximum speed (still readable for most text)
            dpi_setting = 100  # Faster processing - acceptable quality for most documents

            if poppler_path:
                logger.info(f"Using Poppler path: {poppler_path}")
                images = convert_from_path(file_path, dpi=dpi_setting, fmt='PNG', poppler_path=poppler_path)
            else:
                logger.warning("Poppler not found, trying without explicit path")
                images = convert_from_path(file_path, dpi=dpi_setting, fmt='PNG')
            
            extracted_text = ""
            total_pages = len(images)

            # Limit pages for very long documents to speed up processing
            max_pages = 50  # Process maximum 50 pages for speed
            pages_to_process = min(total_pages, max_pages)

            if total_pages > max_pages:
                logger.info(f"Document has {total_pages} pages, processing first {max_pages} for speed")

            for i, image in enumerate(images[:pages_to_process]):
                logger.info(f"Processing page {i+1}/{total_pages} with optimized OCR")

                page_text = ""

                # Try LayoutLMv3 first with timeout for faster processing
                if self.layoutlm_processor:
                    try:
                        import signal
                        import time

                        start_time = time.time()
                        logger.info(f"Using LayoutLMv3 for page {i+1}")
                        page_text = self.extract_text_with_layoutlm(image)

                        # If LayoutLMv3 takes too long, skip to Tesseract
                        if time.time() - start_time > 8:  # 8 second timeout for faster processing
                            logger.warning(f"LayoutLMv3 taking too long, switching to Tesseract")
                            page_text = ""

                    except Exception as e:
                        logger.warning(f"LayoutLMv3 failed quickly, using Tesseract: {e}")
                        page_text = ""

                # If LayoutLMv3 fails or produces little text, fallback to optimized Tesseract
                if not page_text or len(page_text.strip()) < 20:
                    logger.info(f"Using optimized Tesseract for page {i+1}")

                    if TESSERACT_AVAILABLE:
                        # Minimal preprocessing for speed
                        if OPENCV_AVAILABLE:
                            processed_image = self.preprocess_image_for_ocr(image)
                        else:
                            # Simple PIL preprocessing for speed
                            processed_image = image.convert('L')  # Just convert to grayscale

                        # Configure Tesseract for faster processing
                        custom_config = r'--oem 3 --psm 6'  # Keep same config for consistency

                        # Extract text using Tesseract
                        tesseract_text = pytesseract.image_to_string(
                            processed_image,
                            config=custom_config,
                            lang='eng'
                        )

                        page_text = tesseract_text

                # Clean and add page text
                if page_text.strip():
                    extracted_text += f"\n--- Page {i+1} ---\n"
                    extracted_text += page_text.strip() + "\n"
            
            logger.info(f"OCR completed. Extracted {len(extracted_text)} characters from {total_pages} pages")
            return extracted_text.strip()
            
        except Exception as e:
            logger.error(f"OCR extraction failed: {str(e)}")
            logger.error(traceback.format_exc())
            return ""

    def extract_text_from_pdf(self, file_path):
        """Extract text from PDF using PyPDF2, fallback to OCR for image-based PDFs"""
        try:
            # First, try standard text extraction
            text = ""
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                
                for page_num in range(len(pdf_reader.pages)):
                    page = pdf_reader.pages[page_num]
                    page_text = page.extract_text()
                    text += page_text + "\n"
            
            # Check if we got meaningful text
            cleaned_text = text.strip()
            word_count = len(cleaned_text.split()) if cleaned_text else 0
            
            # If we didn't get much text, it's likely an image-based PDF
            if word_count < 10 or len(cleaned_text) < 50:
                logger.info(f"Standard extraction yielded minimal text ({word_count} words). Trying fast OCR...")
                ocr_text = self.extract_text_with_ocr(file_path)

                if ocr_text and len(ocr_text.strip()) > len(cleaned_text):
                    logger.info("Fast OCR extraction successful, using OCR results")
                    return ocr_text
                else:
                    logger.info("OCR did not improve results, using standard extraction")
                    return cleaned_text
            
            return cleaned_text
            
        except Exception as e:
            logger.error(f"PDF extraction failed: {str(e)}")
            # If standard extraction fails completely, try LayoutLMv3/OCR as last resort
            if LAYOUTLM_AVAILABLE or TESSERACT_AVAILABLE:
                logger.info("Standard extraction failed, attempting OCR as fallback")
                return self.extract_text_with_ocr(file_path)
            return ""
    
    def extract_text_from_docx(self, file_path):
        """Extract text from DOCX using python-docx"""
        try:
            doc = docx.Document(file_path)
            text = ""
            
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            
            # Extract text from tables
            for table in doc.tables:
                for row in table.rows:
                    for cell in row.cells:
                        text += cell.text + " "
                    text += "\n"
            
            return text.strip()
        except Exception as e:
            logger.error(f"DOCX extraction failed: {str(e)}")
            return ""
    
    def extract_text_from_doc(self, file_path):
        """Extract text from DOC files (basic XML parsing)"""
        try:
            # This is a very basic approach for .doc files
            # For better extraction, you'd need python-docx or antiword
            with open(file_path, 'rb') as file:
                content = file.read()
                # Try to find readable text (very basic approach)
                text = ""
                for byte in content:
                    if 32 <= byte <= 126:  # Printable ASCII characters
                        text += chr(byte)
                    elif byte in [10, 13]:  # Newlines
                        text += "\n"
                
                # Clean up the text
                lines = text.split('\n')
                cleaned_lines = []
                for line in lines:
                    line = line.strip()
                    if len(line) > 5 and not line.startswith('\\x'):
                        cleaned_lines.append(line)
                
                return '\n'.join(cleaned_lines)
        except Exception as e:
            logger.error(f"DOC extraction failed: {str(e)}")
            return ""
    
    def extract_text_from_txt(self, file_path):
        """Extract text from plain text files"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read()
        except UnicodeDecodeError:
            # Try different encodings
            encodings = ['latin-1', 'cp1252', 'iso-8859-1']
            for encoding in encodings:
                try:
                    with open(file_path, 'r', encoding=encoding) as file:
                        return file.read()
                except UnicodeDecodeError:
                    continue
            logger.error(f"Could not decode text file: {file_path}")
            return ""
        except Exception as e:
            logger.error(f"TXT extraction failed: {str(e)}")
            return ""
    
    def clean_text(self, text):
        """Clean and normalize extracted text"""
        if not text:
            return ""
        
        # Remove excessive whitespace
        import re
        text = re.sub(r'\s+', ' ', text)
        
        # Remove non-printable characters except newlines and tabs
        text = re.sub(r'[^\x20-\x7E\n\t]', '', text)
        
        # Remove excessive newlines
        text = re.sub(r'\n\s*\n', '\n\n', text)
        
        return text.strip()

# Initialize text extractor
extractor = TextExtractor()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check for text extraction service"""
    return jsonify({
        'status': 'healthy',
        'service': 'text_extraction',
        'supported_formats': ['pdf', 'docx', 'doc', 'txt'],
        'timestamp': datetime.now().isoformat()
    })

@app.route('/extract', methods=['POST'])
def extract_text():
    """Extract text from uploaded document"""
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Get file type from filename or content type
        filename = file.filename.lower()
        content_type = file.content_type
        
        # Save temporary file
        temp_path = f"/tmp/{filename}"
        file.save(temp_path)
        
        try:
            text = ""
            
            # Determine file type and extract accordingly
            if filename.endswith('.pdf') or content_type == 'application/pdf':
                text = extractor.extract_text_from_pdf(temp_path)
            elif filename.endswith('.docx') or content_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                text = extractor.extract_text_from_docx(temp_path)
            elif filename.endswith('.doc') or content_type == 'application/msword':
                text = extractor.extract_text_from_doc(temp_path)
            elif filename.endswith('.txt') or content_type == 'text/plain':
                text = extractor.extract_text_from_txt(temp_path)
            else:
                # Try as plain text
                text = extractor.extract_text_from_txt(temp_path)
            
            # Clean the extracted text
            cleaned_text = extractor.clean_text(text)
            
            # Get text statistics
            word_count = len(cleaned_text.split()) if cleaned_text else 0
            char_count = len(cleaned_text) if cleaned_text else 0
            
            return jsonify({
                'text': cleaned_text,
                'filename': filename,
                'content_type': content_type,
                'word_count': word_count,
                'character_count': char_count,
                'extraction_success': bool(cleaned_text),
                'timestamp': datetime.now().isoformat()
            })
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.remove(temp_path)
        
    except Exception as e:
        logger.error(f"Text extraction error: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'error': 'Text extraction failed',
            'details': str(e)
        }), 500

@app.route('/extract/path', methods=['POST'])
def extract_text_from_path():
    """Extract text from file path (for internal Laravel use)"""
    try:
        data = request.get_json()
        
        if not data or 'file_path' not in data:
            return jsonify({'error': 'file_path is required'}), 400
        
        file_path = data['file_path']
        mime_type = data.get('mime_type', '')
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found'}), 404
        
        text = ""
        filename = os.path.basename(file_path).lower()
        
        # Extract based on file extension or mime type
        if filename.endswith('.pdf') or mime_type == 'application/pdf':
            text = extractor.extract_text_from_pdf(file_path)
        elif filename.endswith('.docx') or mime_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            text = extractor.extract_text_from_docx(file_path)
        elif filename.endswith('.doc') or mime_type == 'application/msword':
            text = extractor.extract_text_from_doc(file_path)
        elif filename.endswith('.txt') or mime_type == 'text/plain':
            text = extractor.extract_text_from_txt(file_path)
        else:
            # Try as plain text
            text = extractor.extract_text_from_txt(file_path)
        
        # Clean the extracted text
        cleaned_text = extractor.clean_text(text)
        
        # Get text statistics
        word_count = len(cleaned_text.split()) if cleaned_text else 0
        char_count = len(cleaned_text) if cleaned_text else 0
        
        return jsonify({
            'text': cleaned_text,
            'file_path': file_path,
            'mime_type': mime_type,
            'word_count': word_count,
            'character_count': char_count,
            'extraction_success': bool(cleaned_text),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Path-based text extraction error: {str(e)}")
        return jsonify({
            'error': 'Text extraction failed',
            'details': str(e)
        }), 500

if __name__ == '__main__':
    logger.info("Starting Text Extraction Service...")
    logger.info("Service will be available at: http://localhost:5002")
    logger.info("Health check: GET http://localhost:5002/health")
    logger.info("Extract from upload: POST http://localhost:5002/extract")
    logger.info("Extract from path: POST http://localhost:5002/extract/path")
    
    app.run(host='0.0.0.0', port=5002, debug=False, threaded=True)