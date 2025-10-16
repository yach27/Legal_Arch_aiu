"""
Core AI functionality for document processing - Streamlined version
"""
import os
import logging
import requests
import re
from config import (
    LARAVEL_BASE_URL, LARAVEL_API_TIMEOUT, 
    MAX_TITLE_LENGTH, MAX_DESCRIPTION_LENGTH,
    MIN_PARAGRAPH_LENGTH, TITLE_SEARCH_LINES, EMBEDDING_MODEL_PATH
)
from model_loader import get_embedding_model, get_llama_model, is_llama_loaded

# Configure logging
logger = logging.getLogger(__name__)

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
            return {
                'suggested_title': 'Legal Document',
                'suggested_description': 'Document uploaded for AI processing',
                'ai_remarks': f'Analysis error: {str(e)}'
            }
    
    def _extract_title(self, text):
        """Extract document title using embeddings content with Llama"""
        try:
            # Log debugging info
            logger.info(f"Title generation - Text length: {len(text) if text else 0} chars")
            logger.info(f"Title generation - Llama available: {is_llama_loaded()}")
            
            if not text or len(text.strip()) < 100:
                logger.warning("Insufficient text for title generation - likely embeddings issue")
                logger.warning(f"Text preview: {text[:200] if text else 'None'}")
                return "Legal Document"
            
            # Try Llama first with embeddings content
            if is_llama_loaded():
                logger.info("Attempting Llama title generation with embeddings content")
                title = self._generate_llama_title(text)
                if title and title != "Legal Document" and len(title.strip()) > 5:
                    return title
                else:
                    logger.warning("Llama generated poor title, falling back to rule-based")
            
            # Fallback to enhanced rule-based with content analysis
            logger.info("Using enhanced rule-based title generation")
            return self._generate_enhanced_title(text)
            
        except Exception as e:
            logger.error(f"Title generation failed: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return "Legal Document"
    
    def _generate_llama_title(self, text):
        """Generate title using Llama model with embeddings content"""
        try:
            llama_model = get_llama_model()
            if not llama_model:
                raise Exception("Llama model not available")
            
            # Use first 1200 characters for better context from embeddings
            text_sample = text[:1200] if len(text) > 1200 else text
            
            # Enhanced prompt specifically for reconstructed embeddings content
            prompt = f"""You are a legal document analyst. Based on the following legal document content, generate a clear, professional title (5-8 words) that describes what this document is about. Focus on the document type and main subject.

Legal document content:
{text_sample}

Generate only the title (no quotes, no extra text):"""

            response = llama_model(
                prompt, 
                max_tokens=40, 
                temperature=0.1,  # Very low temperature for consistent titles
                top_p=0.7,
                stop=["\n", "Legal document content:", "Generate only", ":"]
            )
            
            title = response['choices'][0]['text'].strip()
            
            # Clean up the title more thoroughly
            title = title.replace('"', '').replace("'", '').replace('Title:', '').strip()
            title = ' '.join(title.split())  # Normalize whitespace
            
            # Remove unwanted prefixes/suffixes
            unwanted_starts = ['this is', 'this document', 'the document', 'document:', 'title:']
            for unwanted in unwanted_starts:
                if title.lower().startswith(unwanted):
                    title = title[len(unwanted):].strip()
            
            # Ensure reasonable length
            if len(title) > MAX_TITLE_LENGTH:
                words = title.split()
                if len(words) > 8:
                    title = ' '.join(words[:8])
                else:
                    title = title[:MAX_TITLE_LENGTH].strip()
            
            # Validate the title quality
            if len(title.strip()) < 5 or title.lower() in ['legal document', 'document', 'legal']:
                logger.warning(f"Poor quality Llama title generated: '{title}'")
                raise Exception("Generated title too generic")
            
            logger.info(f"Generated Llama title: '{title}' from text length: {len(text)}")
            return title
            
        except Exception as e:
            logger.error(f"Llama title generation failed: {str(e)}")
            return None  # Return None to trigger fallback
    
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
                if 'criminal' in text_lower and 'case' in text_lower:
                    title = "Criminal Case Reference Guide"
                elif 'contract' in text_lower and 'agreement' in text_lower:
                    title = "Contract Agreement Document"
                elif 'policy' in text_lower and 'procedure' in text_lower:
                    title = "Policy and Procedures Manual"
                else:
                    title = "Legal Reference Document"
            
            # Ensure proper length
            if len(title) > MAX_TITLE_LENGTH:
                words = title.split()
                title = ' '.join(words[:6])  # Limit to 6 words
            
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
        """Generate intelligent description"""
        try:
            if is_llama_loaded():
                return self._generate_llama_description(text)
            else:
                return self._generate_rule_based_description(text)
        except Exception as e:
            logger.error(f"Description generation failed: {str(e)}")
            return f"Legal document containing {len(text.split())} words available for review and processing."
    
    def _generate_llama_description(self, text):
        """Generate description using Llama model"""
        try:
            llama_model = get_llama_model()
            if not llama_model:
                raise Exception("Llama model not available")
            
            text_sample = text[:1000] if len(text) > 1000 else text
            
            prompt = f"""You are a legal document analyst. Based on the following excerpt, write a concise professional description (2-3 sentences maximum, under 400 characters) that summarizes what this document is about. Do not copy text directly.

Document excerpt:
{text_sample}

Professional description:"""

            response = llama_model(prompt, max_tokens=150, temperature=0.3, top_p=0.9)
            description = response['choices'][0]['text'].strip().replace('\n', ' ')
            
            if len(description) > MAX_DESCRIPTION_LENGTH:
                cutoff = description[:MAX_DESCRIPTION_LENGTH].rfind(' ')
                description = description[:cutoff] + "..."
            
            if len(description.strip()) < 20:
                raise Exception("Generated description too short")
            
            return description
            
        except Exception as e:
            logger.error(f"Llama description generation failed: {str(e)}")
            return self._generate_rule_based_description(text)
    
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
        """Generate AI remarks about the document"""
        try:
            word_count = len(text.split())
            doc_type = self.analyzer.detect_document_type(text)
            
            remarks = f"AI Analysis: Document classified as {doc_type.replace('_', ' ')}. "
            remarks += f"Contains {word_count} words. "
            
            if word_count > 1000:
                remarks += "High confidence in classification due to substantial content. "
            else:
                remarks += "Limited content for detailed analysis. "
            
            embedding_model = get_embedding_model()
            remarks += f"Processed with {embedding_model.__class__.__name__ if embedding_model else 'unknown'} model."
            
            return remarks
        except Exception as e:
            return f"AI analysis completed with basic metrics. Error: {str(e)}"
    
    def suggest_category_and_folder(self, text, categories, folders):
        """Suggest category and folder based on document content"""
        try:
            text_lower = text.lower()
            
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
                    continue
                    
                score = 0
                folder_name_lower = folder['folder_name'].lower()
                
                if folder_name_lower in text_lower:
                    score += 5
                
                if suggested_category and folder.get('category_id') == suggested_category['category_id']:
                    score += 8
                
                if score > 0:
                    folder_scores[folder['folder_id']] = {'folder': folder, 'score': score}
            
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
            return {
                'suggested_category': categories[0] if categories and len(categories) > 0 else None,
                'suggested_folder': folders[0] if folders and len(folders) > 0 else None,
                'category_confidence': 0,
                'folder_confidence': 0
            }