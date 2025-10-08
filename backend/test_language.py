#!/usr/bin/env python3
"""
Simple test script to debug language detection issues
"""

def test_hinglish_detection():
    """Test the Hinglish detection logic"""
    test_queries = [
        "chor kon hai?",
        "what is this?",
        "kya hai yeh?",
        "tumhara naam kya hai?",
        "show me the files"
    ]
    
    hinglish_words = ['hai', 'hain', 'kar', 'kya', 'aur', 'main', 'mein', 'tum', 'tumhara', 'mera', 'tera', 'uska', 'kaise', 'kahan', 'kyun', 'abhi', 'phir', 'chor', 'kon', 'koi', 'yeh', 'woh', 'isko', 'usko', 'dekho', 'suno', 'bolo', 'batao', 'dikhao', 'karo', 'kijiye']
    
    for query in test_queries:
        is_hinglish = any(word in query.lower() for word in hinglish_words)
        print(f"Query: '{query}'")
        print(f"Detected as Hinglish: {is_hinglish}")
        if is_hinglish:
            matching_words = [word for word in hinglish_words if word in query.lower()]
            print(f"Matching words: {matching_words}")
        print("-" * 40)

def simulate_language_instruction(query):
    """Simulate the language instruction generation"""
    lang_instruction = "IMPORTANT: Respond in English by default."
    detected_language = None
    
    # Check for Hinglish patterns
    hinglish_words = ['hai', 'hain', 'kar', 'kya', 'aur', 'main', 'mein', 'tum', 'tumhara', 'mera', 'tera', 'uska', 'kaise', 'kahan', 'kyun', 'abhi', 'phir', 'chor', 'kon', 'koi', 'yeh', 'woh', 'isko', 'usko', 'dekho', 'suno', 'bolo', 'batao', 'dikhao', 'karo', 'kijiye']
    
    if any(word in query.lower() for word in hinglish_words):
        lang_instruction = "IMPORTANT: You MUST respond in Hinglish (mix of Hindi and English in Roman script). Use a natural mix of Hindi and English words like 'chor kon hai', 'kya pata', 'yeh dekho', etc."
        detected_language = "Hinglish (auto-detected)"
    
    return lang_instruction, detected_language

if __name__ == "__main__":
    print("Testing Hinglish Detection Logic")
    print("=" * 50)
    test_hinglish_detection()
    
    print("\nTesting Language Instruction Generation")
    print("=" * 50)
    
    test_queries = ["chor kon hai?", "what is this?", "kya hai yeh?"]
    for query in test_queries:
        instruction, detected = simulate_language_instruction(query)
        print(f"Query: '{query}'")
        print(f"Detected: {detected}")
        print(f"Instruction: {instruction}")
        print("-" * 40)