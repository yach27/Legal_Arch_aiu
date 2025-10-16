"""
Core AI functionality for document processing
"""
import os
import logging
import traceback
import requests
from config import (
    LARAVEL_BASE_URL, TEXT_EXTRACTION_URL, LARAVEL_API_TIMEOUT, 
    TEXT_EXTRACTION_TIMEOUT, DEFAULT_CHUNK_SIZE, DEFAULT_CHUNK_OVERLAP,
    MIN_TEXT_LENGTH, MIN_CHUNK_LENGTH, MAX_TITLE_LENGTH, MAX_DESCRIPTION_LENGTH,
    MIN_PARAGRAPH_LENGTH, TITLE_SEARCH_LINES, EMBEDDING_MODEL_PATH
)
from model_loader import get_embedding_model, get_llama_model, is_llama_loaded

# Configure logging
logger = logging.getLogger(__name__)

class AIBridgeService:
    def __init__(self):
        self.text_extraction_url = TEXT_EXTRACTION_URL
        self.embedding_url = "http://127.0.0.1:5001"  # Keep for compatibility
    
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
            
            # Check if we got a redirect (302) which indicates auth issues
            if response.status_code == 302:
                logger.warning(f"Received 302 redirect for {endpoint}, likely auth issue")
                return {
                    'success': False,
                    'error': 'Authentication required or session expired',
                    'status_code': response.status_code,
                    'data': None
                }
            
            # Try to parse JSON response
            response_data = None
            if response.content:
                try:
                    response_data = response.json()
                except ValueError as e:
                    logger.warning(f"Failed to parse JSON response: {str(e)[:100]}")
                    response_data = {'raw_response': response.text[:200]}
            
            return {
                'success': response.status_code < 400,
                'data': response_data,
                'status_code': response.status_code
            }
        except requests.exceptions.RequestException as e:
            logger.error(f"Laravel API call failed - Request error: {str(e)}")
            return {
                'success': False,
                'error': f'Request failed: {str(e)}',
                'status_code': 500
            }
        except Exception as e:
            logger.error(f"Laravel API call failed - General error: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'status_code': 500
            }
    
    def extract_text_from_document(self, file_path, mime_type):
        """Extract text using the text extraction service"""
        try:
            response = requests.post(f"{self.text_extraction_url}/extract/path", 
                                   json={'file_path': file_path, 'mime_type': mime_type}, 
                                   timeout=TEXT_EXTRACTION_TIMEOUT)
            
            if response.status_code == 200:
                return response.json().get('text', '')
            else:
                logger.error(f"Text extraction failed: {response.text}")
                return ''
        except Exception as e:
            logger.error(f"Text extraction error: {str(e)}")
            return ''
    
    def generate_embeddings_with_bert(self, text_chunks):
        """Generate embeddings using the loaded BERT model"""
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
            # Extract potential title (first meaningful line)
            lines = [line.strip() for line in text.split('\n') if line.strip()]
            title = "Legal Document"
            
            # Look for title-like patterns
            for line in lines[:TITLE_SEARCH_LINES]:  # Check first 10 lines
                if len(line) > 10 and len(line) < 100:
                    # Remove common prefixes and check if it looks like a title
                    clean_line = line.replace("TITLE:", "").replace("Subject:", "").strip()
                    if clean_line and not clean_line.lower().startswith(('page', 'date', 'from:', 'to:')):
                        title = clean_line[:MAX_TITLE_LENGTH]  # Limit title length
                        break
            
            # Generate intelligent description (summary, not copy)
            description = self.generate_intelligent_description(text)
            
            # Generate AI remarks based on content analysis
            remarks = self.generate_ai_remarks(text)
            
            return {
                'suggested_title': title,
                'suggested_description': description,
                'ai_remarks': remarks
            }
        except Exception as e:
            logger.error(f"Document content analysis failed: {str(e)}")
            return {
                'suggested_title': 'Legal Document',
                'suggested_description': 'Document uploaded for AI processing',
                'ai_remarks': f'Analysis error: {str(e)}'
            }
    
    def generate_intelligent_description(self, text):
        """Generate intelligent description using Llama model"""
        try:
            # Try Llama first if available
            if is_llama_loaded():
                return self.generate_llama_description(text)
            else:
                # Fallback to rule-based generation
                logger.warning("Llama model not loaded, using rule-based description generation")
                return self.generate_rule_based_description(text)
                
        except Exception as e:
            logger.error(f"Description generation failed: {str(e)}")
            return f"Legal document containing {len(text.split())} words available for review and processing."
    
    def generate_llama_description(self, text):
        """Generate description using Llama model"""
        try:
            llama_model = get_llama_model()
            if not llama_model:
                raise Exception("Llama model not available")
            
            # Get first 1000 characters for context (avoid token limits)
            text_sample = text[:1000] if len(text) > 1000 else text
            
            # Create prompt for Llama
            prompt = f"""You are a legal document analyst. Based on the following excerpt from a legal document, write a concise, professional description (2-3 sentences maximum, under 400 characters) that summarizes what this document is about. Do not copy text directly - create an original summary.

Document excerpt:
{text_sample}

Professional description:"""

            # Generate response with Llama
            response = llama_model(
                prompt,
                max_tokens=150,
                temperature=0.3,  # Lower temperature for more consistent output
                top_p=0.9,
                stop=["Document excerpt:", "Professional description:", "\n\n"]
            )
            
            # Extract the generated text
            description = response['choices'][0]['text'].strip()
            
            # Clean up the description
            description = description.replace('\n', ' ').strip()
            
            # Ensure it's not too long
            if len(description) > MAX_DESCRIPTION_LENGTH:
                cutoff = description[:MAX_DESCRIPTION_LENGTH].rfind('. ')
                if cutoff > MAX_DESCRIPTION_LENGTH * 0.7:
                    description = description[:cutoff] + "."
                else:
                    cutoff = description[:MAX_DESCRIPTION_LENGTH].rfind(' ')
                    description = description[:cutoff] + "..."
            
            # Ensure we have a meaningful description
            if len(description.strip()) < 20:
                raise Exception("Generated description too short")
            
            logger.info(f"Generated Llama description: {description[:100]}...")
            return description
            
        except Exception as e:
            logger.error(f"Llama description generation failed: {str(e)}")
            # Fallback to rule-based generation
            return self.generate_rule_based_description(text)
    
    def generate_rule_based_description(self, text):
        """Content-aware rule-based description generation"""
        try:
            import re
            word_count = len(text.split())
            text_lower = text.lower()
            
            # Extract key content elements
            purpose = self.extract_document_purpose(text)
            subject_matter = self.extract_subject_matter(text)
            document_type = self.detect_document_type(text)
            key_topics = self.extract_key_topics(text)
            
            # Build intelligent description based on actual content
            description_parts = []
            
            # Start with document type and purpose
            if purpose:
                description_parts.append(f"This is a {document_type} that {purpose}")
            else:
                description_parts.append(f"This is a {document_type}")
            
            # Add subject matter if found
            if subject_matter:
                description_parts.append(f"focusing on {subject_matter}")
            
            # Add key topics
            if key_topics:
                topics_str = ", ".join(key_topics[:3])  # Limit to 3 key topics
                description_parts.append(f"covering topics such as {topics_str}")
            
            # Combine parts intelligently
            if len(description_parts) >= 3:
                description = f"{description_parts[0]} {description_parts[1]}, {description_parts[2]}"
            elif len(description_parts) == 2:
                description = f"{description_parts[0]} {description_parts[1]}"
            else:
                description = description_parts[0]
            
            # Add document characteristics
            if word_count > 3000:
                description += f". This comprehensive document contains {word_count:,} words"
            elif word_count > 1000:
                description += f". This detailed document contains {word_count:,} words"
            else:
                description += f". This concise document contains {word_count:,} words"
            
            # Add confidentiality notice if applicable
            if 'attorney-client privilege' in text_lower or 'confidential' in text_lower:
                description += " with confidentiality requirements"
            
            description += "."
            
            # Ensure proper length
            if len(description) > MAX_DESCRIPTION_LENGTH:
                cutoff = description[:MAX_DESCRIPTION_LENGTH].rfind('. ')
                if cutoff > MAX_DESCRIPTION_LENGTH * 0.7:
                    description = description[:cutoff] + "."
                else:
                    cutoff = description[:MAX_DESCRIPTION_LENGTH].rfind(' ')
                    description = description[:cutoff] + "..."
            
            return description
            
        except Exception as e:
            logger.error(f"Rule-based description generation failed: {str(e)}")
            return f"Legal document containing {len(text.split())} words available for review and processing."
    
    def extract_document_purpose(self, text):
        """Extract what the document is intended to do"""
        import re
        text_lower = text.lower()
        
        purpose_patterns = [
            (r'serves as (a |an )?([^.]+)', 'serves as'),
            (r'provides (a |an )?([^.]+)', 'provides'),
            (r'establishes (a |an )?([^.]+)', 'establishes'),
            (r'outlines (a |an )?([^.]+)', 'outlines'),
            (r'defines (a |an )?([^.]+)', 'defines'),
            (r'(guide|manual|handbook) for ([^.]+)', 'serves as a guide for'),
            (r'reference for ([^.]+)', 'serves as a reference for'),
            (r'instructions for ([^.]+)', 'provides instructions for'),
            (r'procedures for ([^.]+)', 'outlines procedures for')
        ]
        
        for pattern, purpose_type in purpose_patterns:
            match = re.search(pattern, text_lower)
            if match:
                if len(match.groups()) > 1:
                    subject = match.group(-1).strip()
                    if len(subject) < 100:  # Reasonable length
                        return f"{purpose_type} {subject}"
                else:
                    return purpose_type
        
        return None
    
    def extract_subject_matter(self, text):
        """Extract what the document is about"""
        import re
        text_lower = text.lower()
        
        # Look for explicit subject declarations
        subject_patterns = [
            r'criminal case management',
            r'defense practice',
            r'attorney-client privilege',
            r'legal office procedures',
            r'case preparation',
            r'client representation',
            r'court procedures',
            r'evidence handling',
            r'plea negotiations',
            r'trial preparation',
            r'contract law',
            r'employment law',
            r'corporate governance',
            r'intellectual property',
            r'real estate transactions',
            r'litigation strategy'
        ]
        
        found_subjects = []
        for pattern in subject_patterns:
            if re.search(pattern, text_lower):
                found_subjects.append(pattern.replace('_', ' '))
        
        if found_subjects:
            return found_subjects[0]  # Return the first/most prominent one
        
        return None
    
    def detect_document_type(self, text):
        """Detect specific document type based on content analysis"""
        text_lower = text.lower()
        
        # More sophisticated document type detection
        type_scores = {
            'criminal defense practice manual': ['criminal', 'defense', 'practice', 'manual', 'attorney-client'],
            'legal office guide': ['legal office', 'guide', 'reference', 'procedures'],
            'case management handbook': ['case management', 'handbook', 'procedures', 'workflow'],
            'contract agreement': ['agreement', 'parties', 'consideration', 'terms'],
            'litigation document': ['plaintiff', 'defendant', 'court', 'filing'],
            'policy document': ['policy', 'procedure', 'compliance', 'standards'],
            'legal opinion': ['opinion', 'analysis', 'recommendation', 'counsel'],
            'court filing': ['court', 'filing', 'motion', 'petition'],
            'legal brief': ['brief', 'argument', 'legal analysis', 'precedent']
        }
        
        best_match = 'legal document'
        best_score = 0
        
        for doc_type, keywords in type_scores.items():
            score = sum(1 for keyword in keywords if keyword in text_lower)
            if score > best_score:
                best_score = score
                best_match = doc_type
        
        return best_match
    
    def extract_key_topics(self, text):
        """Extract key topics mentioned in the document"""
        import re
        text_lower = text.lower()
        
        # Legal topics that commonly appear
        topic_patterns = {
            'attorney-client privilege': r'attorney[- ]client privilege',
            'confidentiality': r'confidential|confidentiality',
            'case preparation': r'case preparation|preparing cases',
            'client representation': r'client representation|representing clients',
            'evidence handling': r'evidence|handling evidence',
            'court procedures': r'court procedures|courtroom',
            'legal research': r'legal research|research methods',
            'plea negotiations': r'plea|negotiations',
            'trial preparation': r'trial preparation|preparing for trial',
            'document management': r'document management|filing system',
            'billing procedures': r'billing|time tracking|invoicing',
            'ethical guidelines': r'ethics|ethical|professional conduct'
        }
        
        found_topics = []
        for topic, pattern in topic_patterns.items():
            if re.search(pattern, text_lower):
                found_topics.append(topic)
        
        return found_topics[:5]  # Return up to 5 key topics
    
    def generate_ai_remarks(self, text):
        """Generate AI-powered remarks about the document"""
        try:
            word_count = len(text.split())
            char_count = len(text)
            
            # Simple content detection
            content_indicators = {
                'contract': ['agreement', 'contract', 'parties', 'whereas', 'terms and conditions'],
                'legal_opinion': ['opinion', 'analysis', 'recommendation', 'conclusion', 'legal advice'],
                'court_document': ['court', 'judge', 'plaintiff', 'defendant', 'case', 'hearing'],
                'regulation': ['regulation', 'compliance', 'requirement', 'shall', 'must', 'prohibited'],
                'policy': ['policy', 'procedure', 'guideline', 'standard', 'protocol']
            }
            
            detected_type = 'legal_document'
            text_lower = text.lower()
            
            for doc_type, indicators in content_indicators.items():
                if sum(1 for indicator in indicators if indicator in text_lower) >= 2:
                    detected_type = doc_type
                    break
            
            remarks = f"AI Analysis: Document classified as {detected_type.replace('_', ' ')}. "
            remarks += f"Contains {word_count} words ({char_count} characters). "
            
            # Add confidence based on content length
            if word_count > 1000:
                remarks += "High confidence in classification due to substantial content. "
            elif word_count > 300:
                remarks += "Moderate confidence in classification. "
            else:
                remarks += "Limited content for detailed analysis. "
            
            embedding_model = get_embedding_model()
            remarks += f"Processed with {embedding_model.__class__.__name__ if embedding_model else 'unknown'} model."
            
            return remarks
        except Exception as e:
            return f"AI analysis completed with basic metrics. Error: {str(e)}"
    
    def suggest_category_and_folder(self, text, categories, folders):
        """Suggest category and folder based on document content and available options"""
        try:
            text_lower = text.lower()
            
            # Category suggestion logic
            suggested_category = None
            category_scores = {}
            
            for category in categories:
                # Skip if category is not a proper dictionary
                if not isinstance(category, dict) or 'category_name' not in category:
                    logger.warning(f"Invalid category data: {category}")
                    continue
                    
                score = 0
                category_name_lower = category['category_name'].lower()
                category_desc_lower = (category.get('description') or '').lower()
                
                # Score based on category name appearing in text
                if category_name_lower in text_lower:
                    score += 10
                
                # Score based on description keywords
                if category_desc_lower:
                    desc_words = category_desc_lower.split()
                    score += sum(1 for word in desc_words if word in text_lower)
                
                # Specific legal document type matching
                legal_keywords = {
                    'contract': ['agreement', 'contract', 'terms', 'parties'],
                    'litigation': ['court', 'case', 'plaintiff', 'defendant'],
                    'regulatory': ['compliance', 'regulation', 'requirement'],
                    'corporate': ['corporation', 'board', 'shareholder', 'merger'],
                    'employment': ['employee', 'employment', 'salary', 'benefits'],
                    'intellectual': ['patent', 'trademark', 'copyright', 'license']
                }
                
                for legal_type, keywords in legal_keywords.items():
                    if legal_type in category_name_lower:
                        score += sum(2 for keyword in keywords if keyword in text_lower)
                
                if score > 0:
                    category_scores[category['category_id']] = {
                        'category': category,
                        'score': score
                    }
            
            if category_scores:
                best_category = max(category_scores.values(), key=lambda x: x['score'])
                suggested_category = best_category['category']
            
            # Folder suggestion logic
            suggested_folder = None
            folder_scores = {}
            
            for folder in folders:
                # Skip if folder is not a proper dictionary
                if not isinstance(folder, dict) or 'folder_name' not in folder:
                    logger.warning(f"Invalid folder data: {folder}")
                    continue
                    
                score = 0
                folder_name_lower = folder['folder_name'].lower()
                
                # Score based on folder name appearing in text
                if folder_name_lower in text_lower:
                    score += 5
                
                # Score based on folder type
                folder_type_lower = folder.get('folder_type', '').lower()
                if folder_type_lower in text_lower:
                    score += 3
                
                # Match folder category with suggested category
                if suggested_category and folder.get('category_id') == suggested_category['category_id']:
                    score += 8
                
                if score > 0:
                    folder_scores[folder['folder_id']] = {
                        'folder': folder,
                        'score': score
                    }
            
            if folder_scores:
                best_folder = max(folder_scores.values(), key=lambda x: x['score'])
                suggested_folder = best_folder['folder']
            
            return {
                'suggested_category': suggested_category,
                'suggested_folder': suggested_folder,
                'category_confidence': category_scores.get(suggested_category['category_id'], {}).get('score', 0) if suggested_category else 0,
                'folder_confidence': folder_scores.get(suggested_folder['folder_id'], {}).get('score', 0) if suggested_folder else 0
            }
            
        except Exception as e:
            logger.error(f"Category/folder suggestion failed: {str(e)}")
            # Safe fallback - return first valid category/folder if they exist
            safe_category = None
            safe_folder = None
            
            if categories and len(categories) > 0 and isinstance(categories[0], dict):
                safe_category = categories[0]
            if folders and len(folders) > 0 and isinstance(folders[0], dict):
                safe_folder = folders[0]
                
            return {
                'suggested_category': safe_category,
                'suggested_folder': safe_folder,
                'category_confidence': 0,
                'folder_confidence': 0
            }
    
    def chunk_text(self, text, chunk_size=DEFAULT_CHUNK_SIZE, overlap=DEFAULT_CHUNK_OVERLAP):
        """Split text into overlapping chunks"""
        if not text or len(text.strip()) < MIN_TEXT_LENGTH:
            return []
        
        # Simple sentence-based chunking
        sentences = [s.strip() for s in text.split('.') if len(s.strip()) > 10]
        
        chunks = []
        current_chunk = ''
        current_length = 0
        
        for sentence in sentences:
            sentence_length = len(sentence)
            
            if current_length + sentence_length > chunk_size and current_chunk:
                chunks.append(current_chunk.strip())
                
                # Add overlap
                overlap_sentences = current_chunk.split('.')[-3:] if '.' in current_chunk else []
                overlap_text = '. '.join(overlap_sentences).strip()
                current_chunk = overlap_text + '. ' + sentence if overlap_text else sentence
                current_length = len(current_chunk)
            else:
                current_chunk += '. ' + sentence if current_chunk else sentence
                current_length += sentence_length + 2
        
        if current_chunk.strip():
            chunks.append(current_chunk.strip())
        
        return [chunk for chunk in chunks if len(chunk.strip()) > MIN_CHUNK_LENGTH]