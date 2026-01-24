"""
Core AI functionality for document processing - With Groq/Llama fallback
"""
import os
import logging
import requests
import re
from pathlib import Path
from dotenv import load_dotenv

# Load .env file BEFORE reading environment variables
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

from config import (
    LARAVEL_BASE_URL, LARAVEL_API_TIMEOUT,
    MAX_TITLE_LENGTH, MAX_DESCRIPTION_LENGTH,
    MIN_PARAGRAPH_LENGTH, TITLE_SEARCH_LINES, EMBEDDING_MODEL_PATH
)
from model_loader import get_embedding_model, get_llama_model, is_llama_loaded, get_llama_lock

# Configure logging
# logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
# Add file handler for debugging
fh = logging.FileHandler('ai_debug.log')
fh.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
fh.setFormatter(formatter)
logger.addHandler(fh)

# Groq API configuration - loaded AFTER dotenv
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
GROQ_MODEL = os.getenv('GROQ_MODEL', 'llama-3.3-70b-versatile')
GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
AI_SERVICE_TYPE = os.getenv('AI_SERVICE_TYPE', 'groq')  # 'groq' or 'local'

logger.info(f"AI Service initialized - Type: {AI_SERVICE_TYPE}, Groq API Key: {'Found' if GROQ_API_KEY else 'Not found'}")

class ContentAnalyzer:
    """Helper class for document content analysis"""
    
    DOCUMENT_TYPES = {
        'criminal defense practice manual': ['criminal', 'defense', 'practice', 'manual', 'attorney-client'],
        'legal office guide': ['legal office', 'guide', 'reference', 'procedures'],
        'contract agreement': ['agreement', 'parties', 'consideration', 'terms'],
        'litigation document': ['plaintiff', 'defendant', 'court', 'filing'],
        'policy document': ['policy', 'procedure', 'compliance', 'standards']
    }
    
    SUBJECT_PATTERNS = [
        'criminal case management', 'defense practice', 'attorney-client privilege',
        'legal office procedures', 'case preparation', 'client representation',
        'contract law', 'employment law', 'litigation strategy'
    ]
    
    TOPIC_PATTERNS = {
        'attorney-client privilege': r'attorney[- ]client privilege',
        'confidentiality': r'confidential|confidentiality',
        'case preparation': r'case preparation|preparing cases',
        'court procedures': r'court procedures|courtroom',
        'evidence handling': r'evidence|handling evidence'
    }
    
    @staticmethod
    def detect_document_type(text):
        """Detect document type based on content"""
        text_lower = text.lower()
        best_match = 'legal document'
        best_score = 0
        
        for doc_type, keywords in ContentAnalyzer.DOCUMENT_TYPES.items():
            score = sum(1 for keyword in keywords if keyword in text_lower)
            if score > best_score:
                best_score = score
                best_match = doc_type
        
        return best_match
    
    @staticmethod
    def extract_subject_matter(text):
        """Extract main subject from document"""
        text_lower = text.lower()
        for pattern in ContentAnalyzer.SUBJECT_PATTERNS:
            if re.search(pattern, text_lower):
                return pattern
        return None
    
    @staticmethod
    def extract_key_topics(text):
        """Extract key topics from document"""
        text_lower = text.lower()
        found_topics = []
        for topic, pattern in ContentAnalyzer.TOPIC_PATTERNS.items():
            if re.search(pattern, text_lower):
                found_topics.append(topic)
        return found_topics[:3]

class AIBridgeService:
    def __init__(self):
        self.analyzer = ContentAnalyzer()
    
    def call_laravel_api(self, endpoint, method='GET', data=None, headers=None):
        """Make API calls to Laravel backend"""
        try:
            url = f"{LARAVEL_BASE_URL}/api{endpoint}"
            
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=LARAVEL_API_TIMEOUT)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=LARAVEL_API_TIMEOUT)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=LARAVEL_API_TIMEOUT)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            if response.status_code == 302:
                return {'success': False, 'error': 'Authentication required', 'status_code': response.status_code}
            
            response_data = None
            if response.content:
                try:
                    response_data = response.json()
                except ValueError:
                    response_data = {'raw_response': response.text[:200]}
            
            return {
                'success': response.status_code < 400,
                'data': response_data,
                'status_code': response.status_code
            }
        except Exception as e:
            logger.error(f"Laravel API call failed: {str(e)}")
            return {'success': False, 'error': str(e), 'status_code': 500}
    
    def generate_embeddings_with_bert(self, text_chunks):
        """Generate embeddings using BERT model"""
        try:
            embedding_model = get_embedding_model()
            if not embedding_model:
                raise Exception("Embedding model not loaded")
            
            embeddings = []
            for chunk in text_chunks:
                embedding = embedding_model.encode([chunk], convert_to_tensor=False)[0]
                embeddings.append({
                    'chunk_text': chunk,
                    'embedding': embedding.tolist(),
                    'model_used': 'legal-bert-base-uncased'
                })
            
            return embeddings
        except Exception as e:
            logger.error(f"BERT embedding generation failed: {str(e)}")
            return []
    
    def analyze_document_content(self, text):
        """Analyze document content to extract title, description, and generate AI suggestions"""
        try:
            # Debug logging
            logger.info(f"analyze_document_content called with text length: {len(text) if text else 0}")
            logger.info(f"Text preview (first 300 chars): {text[:300] if text else 'NONE'}")

            # Check if we have sufficient text
            if not text or len(text.strip()) < 50:
                logger.error(f"Insufficient text for analysis. Length: {len(text) if text else 0}")
                return {
                    'suggested_title': 'Legal Document',
                    'suggested_description': 'Insufficient text content extracted from document',
                    'ai_remarks': 'ERROR: No text content available for analysis'
                }

            # Extract title
            title = self._extract_title(text)

            # Generate description
            description = self._generate_description(text)

            # Generate remarks
            remarks = self._generate_remarks(text)

            return {
                'suggested_title': title,
                'suggested_description': description,
                'ai_remarks': remarks
            }
        except Exception as e:
            logger.error(f"Document content analysis failed: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return {
                'suggested_title': 'Error Logic',
                'suggested_description': f'DEBUG ERROR: {str(e)}',
                'ai_remarks': f'Analysis error: {str(e)}'
            }
    
    def _extract_title(self, text):
        """Extract document title with automatic Groq/Llama fallback"""
        try:
            # Log debugging info
            logger.info(f"Title generation - Text length: {len(text) if text else 0} chars")
            logger.info(f"Title generation - Service type: {AI_SERVICE_TYPE}")
            logger.info(f"Title generation - Llama available: {is_llama_loaded()}")

            if not text or len(text.strip()) < 100:
                logger.warning("Insufficient text for title generation")
                logger.warning(f"Text preview: {text[:200] if text else 'None'}")
                return "Legal Document"

            # Try Groq first (if configured as primary and has API key)
            if AI_SERVICE_TYPE == 'groq' and GROQ_API_KEY:
                try:
                    logger.info("Attempting Groq API for title generation...")
                    title = self._generate_groq_title(text)
                    if title and len(title.strip()) > 5:
                        logger.info(f"Groq generated title: {title}")
                        return title
                except Exception as e:
                    logger.warning(f"Groq title generation failed: {str(e)}")
                    logger.info("Falling back to local Llama...")

            # Try local Llama (either as primary or fallback from Groq)
            if is_llama_loaded():
                logger.info("Attempting local Llama title generation...")
                title = self._generate_llama_title(text)
                if title and title != "Legal Document" and len(title.strip()) > 5:
                    logger.info(f"Llama generated title: {title}")
                    return title
                else:
                    logger.warning("Llama generated poor title, falling back to rule-based")

            # Only try Groq as fallback if NOT in local-only mode
            # When AI_SERVICE_TYPE is 'local', we stay offline - no Groq fallback
            # if AI_SERVICE_TYPE != 'groq' and GROQ_API_KEY:
            #     try:
            #         logger.info("Llama failed, trying Groq as fallback...")
            #         title = self._generate_groq_title(text)
            #         if title and len(title.strip()) > 5:
            #             logger.info(f"Groq fallback generated title: {title}")
            #             return title
            #     except Exception as e:
            #         logger.warning(f"Groq fallback failed: {str(e)}")

            # Last resort: enhanced rule-based
            logger.info("Using enhanced rule-based title generation")
            return self._generate_enhanced_title(text)

        except Exception as e:
            logger.error(f"Title generation failed: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return "Legal Document"
    
    def _generate_groq_title(self, text):
        """Generate title using Groq API"""
        try:
            if not GROQ_API_KEY:
                raise Exception("Groq API key not configured")

            text_sample = text[:2000] if len(text) > 2000 else text

            response = requests.post(
                GROQ_API_URL,
                headers={
                    'Authorization': f'Bearer {GROQ_API_KEY}',
                    'Content-Type': 'application/json'
                },
                json={
                    'model': GROQ_MODEL,
                    'messages': [
                        {
                            'role': 'system',
                            'content': 'You are an expert legal document analyst. Create highly specific, unique document titles that distinguish this document from others of the same type.'
                        },
                        {
                            'role': 'user',
                            'content': f'Read this legal document and create a unique, specific title (5-10 words). You MUST use this format: "[Document Type] - [Specific Person/Org Name] - [Date or Reference ID]".\n\nSTRICT RULES:\n1. NEVER use generic titles like "Affidavit" or "Contract".\n2. YOU MUST include the specific name of the person or organization involved.\n3. YOU MUST include a date (YYYY-MM-DD) or a case/reference number if found.\n\nExamples of BAD titles: "Affidavit of Loss", "Board Resolution", "Service Contract"\nExamples of GOOD titles: "Affidavit of Loss - Juan Dela Cruz - 2024-05-12", "Board Resolution No. 45-2023 - Approving Budget", "Service Contract - CMU and Security Agency - 2024"\n\nDocument:\n{text_sample}\n\nProvide only the specific title:'
                        }
                    ],
                    'temperature': 0.3,
                    'max_tokens': 60
                },
                timeout=30
            )

            if response.status_code != 200:
                raise Exception(f"Groq API error: {response.status_code} - {response.text}")

            data = response.json()
            title = data['choices'][0]['message']['content'].strip()

            # Clean up
            title = title.replace('"', '').replace("'", '').replace('Title:', '').strip()
            title = ' '.join(title.split())

            # Remove unwanted prefixes
            unwanted_starts = ['this is', 'this document', 'the document', 'document:', 'title:']
            for unwanted in unwanted_starts:
                if title.lower().startswith(unwanted):
                    title = title[len(unwanted):].strip()

            if len(title) > MAX_TITLE_LENGTH:
                words = title.split()
                title = ' '.join(words[:10]) if len(words) > 10 else title[:MAX_TITLE_LENGTH]

            return title

        except Exception as e:
            logger.error(f"Groq title generation failed: {str(e)}")
            raise

    def _generate_llama_title(self, text):
        """Generate title using Llama model with embeddings content"""
        try:
            llama_model = get_llama_model()
            if not llama_model:
                raise Exception("Llama model not available")

            # Use first 1500 characters to avoid context issues
            text_sample = text[:1500] if len(text) > 1500 else text

            # Simpler, more direct prompt
            prompt = f"""<|start_header_id|>system<|end_header_id|>

You extract document titles. Reply with ONLY the title, nothing else.<|eot_id|><|start_header_id|>user<|end_header_id|>

What is the title of this document? Reply with ONLY the title in format: [DocType] - [Name] - [Date]

{text_sample}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

"""

            # Use the lock for thread-safe model access
            with get_llama_lock():
                response = llama_model(
                    prompt,
                    max_tokens=40,
                    temperature=0.1,
                    top_p=0.9,
                    repeat_penalty=1.2,
                    stop=["<|eot_id|>", "\n", "<|start_header_id|>"]
                )

            title = response['choices'][0]['text'].strip()

            # Check for chatty responses - if it starts with common prefixes, fall back
            chatty_starts = [
                'here is', 'the title', 'this is', 'i have', 'based on',
                'the document', 'extracted', 'output:', 'answer:'
            ]
            if any(title.lower().startswith(prefix) for prefix in chatty_starts):
                logger.warning(f"Llama gave chatty response: '{title[:50]}', using rule-based")
                return None

            # Detect refusal
            refusal_phrases = ['i cannot', 'i can\'t', 'i will not', 'cannot provide', 'unable to']
            if any(phrase in title.lower() for phrase in refusal_phrases):
                logger.warning(f"Llama refused: {title[:50]}")
                return None

            # Clean up quotes
            title = title.strip('"\'').strip()
            title = ' '.join(title.split())

            # Validate
            if len(title) < 5 or len(title) > MAX_TITLE_LENGTH:
                logger.warning(f"Invalid title length: {len(title)}")
                return None

            logger.info(f"Generated Llama title: '{title}'")
            return title

        except Exception as e:
            logger.error(f"Llama title generation failed: {str(e)}")
            return None
    
    def _generate_enhanced_title(self, text):
        """Generate title using enhanced content analysis of embeddings"""
        try:
            # First try traditional title extraction
            title = self._extract_traditional_title(text)
            if title != "Legal Document":
                return title
            
            # If no title found, generate from content analysis
            doc_type = self.analyzer.detect_document_type(text)
            subject_matter = self.analyzer.extract_subject_matter(text)
            
            # Build intelligent title from content
            if subject_matter:
                if 'criminal case management' in subject_matter:
                    title = "Criminal Case Management Guide"
                elif 'defense practice' in subject_matter:
                    title = "Criminal Defense Practice Manual"
                elif 'attorney-client privilege' in subject_matter:
                    title = "Attorney-Client Privilege Guidelines"
                elif 'case preparation' in subject_matter:
                    title = "Legal Case Preparation Manual"
                else:
                    # Clean up subject matter for title
                    clean_subject = subject_matter.replace('_', ' ').title()
                    title = f"{clean_subject} Guide"
            elif 'criminal defense practice manual' in doc_type:
                title = "Criminal Defense Practice Manual"
            elif 'legal office guide' in doc_type:
                title = "Legal Office Procedures Guide"
            elif 'contract agreement' in doc_type:
                title = "Legal Contract Agreement"
            else:
                # Last resort - analyze key terms in text
                text_lower = text.lower()
                
                # Helper to extract name using regex
                def extract_name(text_content):
                    # Try "I, [Name], of legal age"
                    match = re.search(r"I,\s+([A-Z][a-zA-Z\s\.]+?),\s+of\s+legal\s+age", text_content)
                    if match:
                        return match.group(1).strip()
                    # Try "Name: [Name]"
                    match = re.search(r"Name:\s+([A-Z][a-zA-Z\s\.]+)", text_content)
                    if match:
                        return match.group(1).strip()
                    return None

                extracted_name = extract_name(text)
                name_suffix = f" - {extracted_name}" if extracted_name else ""

                if 'affidavit' in text_lower:
                    # Try to extract specific affidavit type
                    if 'no violation' in text_lower:
                        title = f"Affidavit of No Violation{name_suffix}"
                    elif 'compliance' in text_lower:
                        title = f"Affidavit of Compliance{name_suffix}"
                    elif 'loss' in text_lower:
                        title = f"Affidavit of Loss{name_suffix}"
                    else:
                        title = f"Affidavit{name_suffix}"
                elif 'criminal' in text_lower and 'case' in text_lower:
                    title = "Criminal Case Reference Guide"
                elif 'contract' in text_lower and 'agreement' in text_lower:
                    title = f"Contract Agreement{name_suffix}"
                elif 'policy' in text_lower and 'procedure' in text_lower:
                    title = "Policy and Procedures Manual"
                elif 'resolution' in text_lower and 'board' in text_lower:
                    title = "Board Resolution"
                elif 'memorandum' in text_lower or 'memo' in text_lower:
                    title = f"Memorandum{name_suffix}"
                else:
                    title = "Legal Reference Document"
            
            # Ensure proper length
            if len(title) > MAX_TITLE_LENGTH:
                words = title.split()
                title = ' '.join(words[:10])  # Increased limit to accommodate names
            
            logger.info(f"Generated enhanced title: '{title}'")
            return title
            
        except Exception as e:
            logger.error(f"Enhanced title generation failed: {str(e)}")
            return "Legal Document"
    
    def _extract_traditional_title(self, text):
        """Extract title using traditional rule-based methods"""
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        
        for line in lines[:TITLE_SEARCH_LINES]:
            if 10 < len(line) < 100:
                clean_line = line.replace("TITLE:", "").replace("Subject:", "").strip()
                if clean_line and not clean_line.lower().startswith(('page', 'date', 'from:', 'to:')):
                    return clean_line[:MAX_TITLE_LENGTH]
        
        return "Legal Document"
    
    def _generate_description(self, text):
        """Generate intelligent description with automatic Groq/Llama fallback"""
        try:
            # Try Groq first (if configured as primary and has API key)
            if AI_SERVICE_TYPE == 'groq' and GROQ_API_KEY:
                try:
                    logger.info("Attempting Groq API for description generation...")
                    description = self._generate_groq_description(text)
                    if description and len(description.strip()) > 20:
                        logger.info("Groq generated description successfully")
                        return description
                except Exception as e:
                    logger.warning(f"Groq description generation failed: {str(e)}")
                    logger.info("Falling back to local Llama...")

            # Try local Llama (either as primary or fallback from Groq)
            if is_llama_loaded():
                logger.info("Attempting local Llama description generation...")
                description = self._generate_llama_description(text)
                if description and len(description.strip()) > 20:
                    return description

            # Only try Groq as fallback if NOT in local-only mode
            # When AI_SERVICE_TYPE is 'local', we stay offline - no Groq fallback
            # if AI_SERVICE_TYPE != 'groq' and GROQ_API_KEY:
            #     try:
            #         logger.info("Llama failed, trying Groq as fallback...")
            #         description = self._generate_groq_description(text)
            #         if description and len(description.strip()) > 20:
            #             return description
            #     except Exception as e:
            #         logger.warning(f"Groq fallback failed: {str(e)}")

            # Last resort: rule-based
            return self._generate_rule_based_description(text)

        except Exception as e:
            logger.error(f"Description generation failed: {str(e)}")
            return f"Legal document containing {len(text.split())} words available for review and processing."
    
    def _generate_groq_description(self, text):
        """Generate description using Groq API"""
        try:
            if not GROQ_API_KEY:
                raise Exception("Groq API key not configured")

            text_sample = text[:1500] if len(text) > 1500 else text

            response = requests.post(
                GROQ_API_URL,
                headers={
                    'Authorization': f'Bearer {GROQ_API_KEY}',
                    'Content-Type': 'application/json'
                },
                json={
                    'model': GROQ_MODEL,
                    'messages': [
                        {
                            'role': 'system',
                            'content': 'You are an expert legal document analyst. Write detailed, specific document summaries that highlight unique information.'
                        },
                        {
                            'role': 'user',
                            'content': f'Read this legal document and write a specific 2-3 sentence summary (under 400 characters). You MUST mention:\n1. The SPECIFIC NAMES of people/parties involved (e.g., "Juan Dela Cruz", "TechCorp Inc.").\n2. The SPECIFIC purpose or amount (e.g., "Php 50,000 loan", "Lost Student ID").\n3. Any specific dates or unique conditions.\n\nExample of BAD summary: "This is an affidavit of loss filed by an individual regarding a lost item."\nExample of GOOD summary: "Affidavit of Loss filed by Juan Dela Cruz regarding a lost BPI ATM Card. The incident occurred on May 12, 2024, in Valencia City."\n\nDocument:\n{text_sample}\n\nSummary:'
                        }
                    ],
                    'temperature': 0.4,
                    'max_tokens': 180
                },
                timeout=30
            )

            if response.status_code != 200:
                raise Exception(f"Groq API error: {response.status_code} - {response.text}")

            data = response.json()
            description = data['choices'][0]['message']['content'].strip().replace('\n', ' ')

            if len(description) > MAX_DESCRIPTION_LENGTH:
                cutoff = description[:MAX_DESCRIPTION_LENGTH].rfind(' ')
                description = description[:cutoff] + "..."

            return description

        except Exception as e:
            logger.error(f"Groq description generation failed: {str(e)}")
            raise

    def _generate_llama_description(self, text):
        """Generate description using Llama model"""
        try:
            llama_model = get_llama_model()
            if not llama_model:
                raise Exception("Llama model not available")

            text_sample = text[:1500] if len(text) > 1500 else text

            # Pure extraction prompt - no creation, just extraction
            prompt = f"""<|start_header_id|>system<|end_header_id|>

Extract and list facts from text.<|eot_id|><|start_header_id|>user<|end_header_id|>

List the key facts from this text (names, dates, amounts, purpose) in 2-3 sentences:

Text: {text_sample}

Facts:<|eot_id|><|start_header_id|>assistant<|end_header_id|>

"""

            # Use the lock for thread-safe model access
            with get_llama_lock():
                response = llama_model(
                    prompt,
                    max_tokens=180,
                    temperature=0.4,
                    top_p=0.9,
                    repeat_penalty=1.1,
                    stop=["<|eot_id|>", "<|start_header_id|>"]
                )
            description = response['choices'][0]['text'].strip().replace('\n', ' ')

            # Clean up common AI response prefixes
            unwanted_prefixes = [
                'here is a 2-3 sentence summary of the document:',
                'here is a 2-3 sentence summary:',
                'here is a summary:',
                'here is the summary:',
                'summary:',
                'this document is',
                'the document is',
                'facts:',
                'here are the facts:',
                'here are the key facts:'
            ]
            description_lower = description.lower()
            for prefix in unwanted_prefixes:
                if description_lower.startswith(prefix):
                    description = description[len(prefix):].strip()
                    if description:
                        description = description[0].upper() + description[1:]
                    break

            # Detect if Llama refused to process (safety rejection)
            refusal_phrases = ['i cannot', 'i can\'t', 'i will not', 'i won\'t', 'cannot provide',
                             'unable to', 'not appropriate', 'cannot assist', 'i apologize']
            if any(phrase in description.lower() for phrase in refusal_phrases):
                logger.warning(f"Llama refused to generate description (safety): {description[:100]}")
                raise Exception("Llama safety refusal - falling back to rule-based")

            if len(description) > MAX_DESCRIPTION_LENGTH:
                cutoff = description[:MAX_DESCRIPTION_LENGTH].rfind(' ')
                description = description[:cutoff] + "..."

            if len(description.strip()) < 20:
                raise Exception("Generated description too short")
            
            return description
            
        except Exception as e:
            logger.error(f"Llama description generation failed: {str(e)}")
            return self._generate_rule_based_description(text)
    
    def _suggest_folder_with_llama(self, text, folder_names):
        """Use Llama to suggest folder from available folders (same as Groq)"""
        try:
            if not folder_names or len(folder_names) == 0:
                logger.warning("No folders available for suggestion")
                return None

            llama_model = get_llama_model()
            if not llama_model:
                logger.warning("Llama not available, using keyword matching")
                # Fallback to keyword matching
                for folder_name in folder_names:
                    if folder_name.lower() in text.lower():
                        return folder_name
                return None

            text_sample = text[:1500] if len(text) > 1500 else text
            folders_list = ', '.join(folder_names)

            prompt = f"""<|start_header_id|>system<|end_header_id|>

You are a filing assistant. Choose a folder for this document.<|eot_id|><|start_header_id|>user<|end_header_id|>

Pick ONE folder from: {folders_list}

Document:
{text_sample}

Answer ONLY with the folder name. Folder:<|eot_id|><|start_header_id|>assistant<|end_header_id|>

"""

            # Use the lock for thread-safe model access
            with get_llama_lock():
                response = llama_model(
                    prompt,
                    max_tokens=50,
                    temperature=0.1, # Lower temperature for more deterministic output
                    top_p=0.9,
                    stop=["<|eot_id|>", "\n", "<|start_header_id|>"]
                )

            raw_response = response['choices'][0]['text'].strip()
            logger.info(f"Llama raw folder response: '{raw_response}'")

            # Clean up response
            suggested_folder = raw_response.replace('"', '').replace("'", '').strip()

            # 1. Exact match check
            if suggested_folder in folder_names:
                logger.info(f"Llama suggested folder (Exact): {suggested_folder}")
                return suggested_folder
            
            # 2. Case-insensitive match
            for folder_name in folder_names:
                if folder_name.lower() == suggested_folder.lower():
                     logger.info(f"Llama suggested folder (Case-insensitive): {folder_name}")
                     return folder_name

            # 3. Contains match (The Fix for "I will choose...")
            # Check if any folder name is contained WITHIN the response
            best_match = None
            longest_match_len = 0
            
            response_lower = suggested_folder.lower()
            for folder_name in folder_names:
                if folder_name.lower() in response_lower:
                    if len(folder_name) > longest_match_len:
                        best_match = folder_name
                        longest_match_len = len(folder_name)
            
            if best_match:
                logger.info(f"Llama suggested folder (Contains Match): {best_match} from '{suggested_folder}'")
                return best_match

            # 4. Keyword fallback (if Llama failed completely)
            logger.warning(f"Llama suggested invalid folder: {suggested_folder}. Trying generic keyword matching.")
            for folder_name in folder_names:
                if folder_name.lower() in text.lower():
                    return folder_name
                    
            return None

        except Exception as e:
            logger.error(f"Llama folder suggestion failed: {str(e)}")
            return None

    def _generate_rule_based_description(self, text):
        """Generate description using content analysis"""
        try:
            word_count = len(text.split())
            text_lower = text.lower()

            doc_type = self.analyzer.detect_document_type(text)
            subject_matter = self.analyzer.extract_subject_matter(text)
            key_topics = self.analyzer.extract_key_topics(text)

            # Build description
            description = f"This is a {doc_type}"

            if subject_matter:
                description += f" focusing on {subject_matter}"
            
            if key_topics:
                topics_str = ", ".join(key_topics)
                description += f", covering topics such as {topics_str}"
            
            description += f". This document contains {word_count:,} words"
            
            if 'attorney-client privilege' in text_lower or 'confidential' in text_lower:
                description += " with confidentiality requirements"
            
            description += "."
            
            # Ensure proper length
            if len(description) > MAX_DESCRIPTION_LENGTH:
                cutoff = description[:MAX_DESCRIPTION_LENGTH].rfind(' ')
                description = description[:cutoff] + "..."
            
            return description
            
        except Exception as e:
            logger.error(f"Rule-based description generation failed: {str(e)}")
            return f"Legal document containing {len(text.split())} words available for review and processing."
    
    def _generate_remarks(self, text):
        """Generate AI remarks about the document with automatic Groq/Llama fallback"""
        try:
            # Try Groq first (if configured as primary and has API key)
            if AI_SERVICE_TYPE == 'groq' and GROQ_API_KEY:
                try:
                    logger.info("Attempting Groq API for remarks generation...")
                    remarks = self._generate_groq_remarks(text)
                    if remarks and len(remarks.strip()) > 20:
                        return remarks
                except Exception as e:
                    logger.warning(f"Groq remarks generation failed: {str(e)}")

            # Try local Llama 
            if is_llama_loaded():
                logger.info("Attempting local Llama remarks generation...")
                remarks = self._generate_llama_remarks(text)
                if remarks and len(remarks.strip()) > 20:
                    return remarks

            # Fallback to rule-based
            return self._generate_rule_based_remarks(text)

        except Exception as e:
            logger.error(f"Remarks generation failed: {str(e)}")
            return self._generate_rule_based_remarks(text)

    def _generate_groq_remarks(self, text):
        """Generate remarks using Groq API"""
        try:
            if not GROQ_API_KEY:
                raise Exception("Groq API key not configured")

            text_sample = text[:2000] if len(text) > 2000 else text

            response = requests.post(
                GROQ_API_URL,
                headers={
                    'Authorization': f'Bearer {GROQ_API_KEY}',
                    'Content-Type': 'application/json'
                },
                json={
                    'model': GROQ_MODEL,
                    'messages': [
                        {
                            'role': 'system',
                            'content': 'You are an expert legal document analyst. Extract key specific details such as penalties, dates, and obligations.'
                        },
                        {
                            'role': 'user',
                            'content': f'Analyze this legal document and provide a concise list of key REMARKS. Focus on:\n1. Specific penalties for non-compliance (if any).\n2. Critical deadlines or dates.\n3. Key obligations or requirements.\n4. Names of main parties.\n\nKeep it under 300 characters. Format as a running paragraph or comma-separated points.\n\nDocument:\n{text_sample}\n\nRemarks:'
                        }
                    ],
                    'temperature': 0.3,
                    'max_tokens': 150
                },
                timeout=30
            )

            if response.status_code != 200:
                raise Exception(f"Groq API error: {response.status_code}")

            data = response.json()
            return data['choices'][0]['message']['content'].strip()
        except Exception as e:
            logger.error(f"Groq remarks generation failed: {str(e)}")
            raise

    def _generate_llama_remarks(self, text):
        """Generate remarks using Llama model"""
        try:
            llama_model = get_llama_model()
            if not llama_model:
                raise Exception("Llama model not available")

            text_sample = text[:2000] if len(text) > 2000 else text

            # Pure extraction prompt
            prompt = f"""<|start_header_id|>system<|end_header_id|>

Extract key details from text.<|eot_id|><|start_header_id|>user<|end_header_id|>

Extract from this text: important dates, deadlines, names, amounts (under 300 chars):

Text: {text_sample}

Details:<|eot_id|><|start_header_id|>assistant<|end_header_id|>

"""

            # Use the lock for thread-safe model access
            with get_llama_lock():
                response = llama_model(
                    prompt,
                    max_tokens=150,
                    temperature=0.3,
                    top_p=0.9,
                    stop=["<|eot_id|>", "<|start_header_id|>"]
                )

            remarks = response['choices'][0]['text'].strip()
            
            return remarks
        except Exception as e:
            logger.error(f"Llama remarks generation failed: {str(e)}")
            return None

    def _generate_rule_based_remarks(self, text):
        """Generate basic rule-based remarks (fallback)"""
        try:
            word_count = len(text.split())
            doc_type = self.analyzer.detect_document_type(text)
            
            remarks = f"AI Analysis: Document classified as {doc_type.replace('_', ' ')}. "
            remarks += f"Contains {word_count} words. "
            
            if word_count > 1000:
                remarks += "High confidence in classification due to substantial content. "
            else:
                remarks += "Limited content for detailed analysis. "
            
            return remarks
        except Exception as e:
            return f"AI analysis completed with basic metrics. Error: {str(e)}"
    
    def suggest_category_and_folder(self, text, categories, folders):
        """Suggest category and folder based on document content using AI (Llama)"""
        try:
            text_lower = text.lower()

            logger.info(f"Folder suggestion - Received {len(folders)} folders: {[f.get('folder_name') for f in folders if isinstance(f, dict)]}")

            # Use Llama to intelligently suggest folder (same as Groq)
            folder_names = [f.get('folder_name') for f in folders if isinstance(f, dict) and 'folder_name' in f]
            suggested_folder_name = self._suggest_folder_with_llama(text, folder_names)

            # Find the folder object
            suggested_folder = None
            if suggested_folder_name:
                for folder in folders:
                    if isinstance(folder, dict) and folder.get('folder_name') == suggested_folder_name:
                        suggested_folder = folder
                        break

            logger.info(f"AI suggested folder: {suggested_folder_name}")

            # Category suggestion
            suggested_category = None
            category_scores = {}

            for category in categories:
                if not isinstance(category, dict) or 'category_name' not in category:
                    continue

                score = 0
                category_name_lower = category['category_name'].lower()

                if category_name_lower in text_lower:
                    score += 10

                # Legal keywords matching
                legal_keywords = {
                    'contract': ['agreement', 'contract', 'terms'],
                    'litigation': ['court', 'case', 'plaintiff', 'defendant'],
                    'criminal': ['criminal', 'defense', 'case']
                }

                for legal_type, keywords in legal_keywords.items():
                    if legal_type in category_name_lower:
                        score += sum(2 for keyword in keywords if keyword in text_lower)

                if score > 0:
                    category_scores[category['category_id']] = {'category': category, 'score': score}

            if category_scores:
                best_category = max(category_scores.values(), key=lambda x: x['score'])
                suggested_category = best_category['category']

            # Folder suggestion
            suggested_folder = None
            folder_scores = {}

            for folder in folders:
                if not isinstance(folder, dict) or 'folder_name' not in folder:
                    logger.warning(f"Invalid folder format: {folder}")
                    continue

                score = 0
                folder_name_lower = folder['folder_name'].lower()

                logger.info(f"Checking folder '{folder['folder_name']}' against text...")

                if folder_name_lower in text_lower:
                    score += 5
                    logger.info(f"  - Found '{folder_name_lower}' in text! Score: {score}")

                if suggested_category and folder.get('category_id') == suggested_category['category_id']:
                    score += 8
                    logger.info(f"  - Category match! Score: {score}")

                if score > 0:
                    folder_scores[folder['folder_id']] = {'folder': folder, 'score': score}

            logger.info(f"Folder scores: {[(f['folder']['folder_name'], f['score']) for f in folder_scores.values()]}")

            if folder_scores:
                best_folder = max(folder_scores.values(), key=lambda x: x['score'])
                suggested_folder = best_folder['folder']
                logger.info(f"Best folder selected: {suggested_folder['folder_name']} with score {best_folder['score']}")
            else:
                logger.warning("No folder matches found!")

            return {
                'suggested_category': suggested_category,
                'suggested_folder': suggested_folder,
                'category_confidence': category_scores.get(suggested_category['category_id'], {}).get('score', 0) if suggested_category else 0,
                'folder_confidence': folder_scores.get(suggested_folder['folder_id'], {}).get('score', 0) if suggested_folder else 0
            }

        except Exception as e:
            logger.error(f"Category/folder suggestion failed: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return {
                'suggested_category': categories[0] if categories and len(categories) > 0 else None,
                'suggested_folder': folders[0] if folders and len(folders) > 0 else None,
                'category_confidence': 0,
                'folder_confidence': 0
            }