#!/bin/bash

# Install requirements
pip install -r llm_tests/requirements.txt

# Test API keys
python llm_tests/test_api_keys.py

# Run evaluation with a small sample size (2 test cases) for quick testing
python llm_tests/real_evaluate_llms.py --sample-size 2 --output-dir llm_tests/real_results

echo "Evaluation complete. Check the results in llm_tests/real_results/"
