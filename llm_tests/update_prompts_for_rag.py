import json
import os

# Load the existing prompts file
with open('llm_tests/prompts.json', 'r') as f:
    prompts_data = json.load(f)

# Add retrieved context to each test case
for test_case in prompts_data['test_cases']:
    # If there's no retrieved context yet, add a mock one based on the reference answer
    if 'retrieved_context' not in test_case:
        reference = test_case.get('reference_answer', '')
        # Create a mock retrieved context that's similar to but not identical to the reference
        retrieved_context = f"""
        Financial Information:
        {reference}
        
        Additional context:
        This information is relevant to the {test_case.get('region', 'Global')} region and 
        pertains to {test_case.get('category', 'finance')} topics.
        """
        test_case['retrieved_context'] = retrieved_context

# Save the updated prompts file
with open('llm_tests/prompts_with_rag.json', 'w') as f:
    json.dump(prompts_data, f, indent=2)

print("Updated prompts.json with RAG context information.")
print("New file saved as prompts_with_rag.json")