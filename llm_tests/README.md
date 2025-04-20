# LLM Evaluation Framework for Fin-Bot

This directory contains tools for evaluating the performance of different LLM models used in the Fin-Bot application.

## Overview

The evaluation framework assesses three LLM models:
- GPT-4o-mini
- DeepSeek
- LLaMA3

It evaluates them across multiple dimensions:
- Response quality (BLEU, ROUGE, BERTScore)
- Response time
- Token usage efficiency
- Keyword coverage
- Consistency across models
- Potential hallucinations

## Files

- `prompts.json`: Contains test cases with queries, expected keywords, and reference answers
- `evaluate_llms.py`: Main script for running evaluations and generating reports

## Usage

```bash
# Install required packages
pip install evaluate bert-score rouge-score nltk pandas matplotlib seaborn tiktoken

# Run the evaluation
python llm_tests/evaluate_llms.py

# Options
python llm_tests/evaluate_llms.py --models chatgpt llama deepseek --prompts llm_tests/prompts.json --output-dir llm_tests/results