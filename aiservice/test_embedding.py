#!/usr/bin/env python3
"""
Test script for embedding service
"""
import requests
import json
import sys

def test_embedding_service():
    """Test the embedding service endpoints"""
    base_url = "http://127.0.0.1:5001"
    
    print("🔧 Testing Embedding Service...")
    print("=" * 50)
    
    # Test health check
    print("\n1. Testing Health Check...")
    try:
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health Check: {data['status']}")
            print(f"   Model Loaded: {data['model_loaded']}")
            print(f"   Model Path: {data['model_path']}")
        else:
            print(f"❌ Health Check Failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health Check Error: {str(e)}")
        return False
    
    # Test single embedding
    print("\n2. Testing Single Text Embedding...")
    try:
        test_text = "This is a test legal document about contract agreements."
        response = requests.post(f"{base_url}/embed/single", json={'text': test_text})
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Single Embedding Success")
            print(f"   Dimensions: {data['dimensions']}")
            print(f"   Text Length: {data['text_length']}")
            print(f"   Embedding Preview: {data['embedding'][:5]}... (showing first 5 values)")
        else:
            print(f"❌ Single Embedding Failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Single Embedding Error: {str(e)}")
        return False
    
    # Test batch embedding
    print("\n3. Testing Batch Text Embedding...")
    try:
        test_texts = [
            "This is the first legal document.",
            "This is the second contract document.",
            "This is the third agreement document."
        ]
        response = requests.post(f"{base_url}/embed", json={'texts': test_texts})
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Batch Embedding Success")
            print(f"   Count: {data['count']}")
            print(f"   Dimensions: {data['dimensions']}")
            print(f"   All embeddings generated successfully")
        else:
            print(f"❌ Batch Embedding Failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Batch Embedding Error: {str(e)}")
        return False
    
    # Test similarity calculation
    print("\n4. Testing Similarity Calculation...")
    try:
        text1 = "This is a contract agreement."
        text2 = "This is a legal contract."
        response = requests.post(f"{base_url}/similarity", json={'text1': text1, 'text2': text2})
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Similarity Calculation Success")
            print(f"   Similarity Score: {data['similarity']:.4f}")
            print(f"   Text 1 Length: {data['text1_length']}")
            print(f"   Text 2 Length: {data['text2_length']}")
        else:
            print(f"❌ Similarity Failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Similarity Error: {str(e)}")
    
    # Test model info
    print("\n5. Testing Model Info...")
    try:
        response = requests.get(f"{base_url}/model/info")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Model Info Success")
            print(f"   Model: {data['model_name']}")
            print(f"   Dimensions: {data['dimensions']}")
            print(f"   Max Length: {data['max_sequence_length']}")
            print(f"   Library: {data['library']}")
        else:
            print(f"❌ Model Info Failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Model Info Error: {str(e)}")
    
    print("\n" + "=" * 50)
    print("✅ Embedding Service Test Completed!")
    return True

if __name__ == "__main__":
    success = test_embedding_service()
    if not success:
        sys.exit(1)