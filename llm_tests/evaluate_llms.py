import json
import time
import argparse
import os
import sys
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, List, Any, Tuple
from datetime import datetime

# Define a mock function to simulate API responses
def get_ai_response(prompt, model, region="Global"):
    """
    Mock function to simulate responses from different models
    """
    print(f"Generating response for query: '{prompt[:50]}...' using model: {model}, region: {region}")
    
    # Simulate different response qualities and times for different models
    if model.lower() == "chatgpt":
        time.sleep(1.2)  # Simulate response time
        return f"This is a comprehensive analysis about {prompt[:30]}... for the {region} region. The analysis includes relevant financial data and insights based on current market trends."
    
    elif model.lower() == "llama":
        time.sleep(1.5)  # Simulate response time
        return f"Analysis of {prompt[:20]}... for {region}: This financial topic relates to market dynamics and economic factors that influence investment decisions."
    
    elif model.lower() == "deepseek":
        time.sleep(0.8)  # Simulate response time
        return f"Financial insight regarding {prompt[:25]}... in the {region} market: This involves consideration of multiple economic indicators and market trends."
    
    else:
        time.sleep(1.0)
        return f"Response about {prompt[:15]}... for {region} region."

def count_tokens(text: str) -> int:
    """Count the number of tokens in a text string (simplified)."""
    # Simple approximation: 1 token ≈ 4 characters
    return len(text) // 4

def calculate_keyword_coverage(response: str, keywords: List[str]) -> float:
    """Calculate the percentage of expected keywords present in the response."""
    response_lower = response.lower()
    keywords_found = sum(1 for keyword in keywords if keyword.lower() in response_lower)
    return keywords_found / len(keywords) if keywords else 0

def evaluate_model(
    model_name: str, 
    test_cases: List[Dict[str, Any]], 
    output_dir: str
) -> pd.DataFrame:
    """Evaluate a single model on all test cases."""
    results = []
    
    for case in test_cases:
        query = case["query"]
        reference = case["reference_answer"]
        keywords = case["expected_keywords"]
        region = case.get("region", "Global")
        
        print(f"Testing {model_name} on query: {query[:50]}...")
        
        # Measure response time
        start_time = time.time()
        response = get_ai_response(query, model_name, region)
        end_time = time.time()
        response_time = end_time - start_time
        
        # Count tokens
        input_tokens = count_tokens(query)
        output_tokens = count_tokens(response)
        
        # Calculate keyword coverage
        keyword_coverage = calculate_keyword_coverage(response, keywords)
        
        # Compile results
        result = {
            "model": model_name,
            "query_id": case["id"],
            "category": case["category"],
            "region": region,
            "query": query,
            "response": response,
            "reference": reference,
            "response_time": response_time,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "tokens_per_second": output_tokens / response_time if response_time > 0 else 0,
            "keyword_coverage": keyword_coverage,
        }
        
        results.append(result)
        
        # Save individual result to file
        case_filename = f"{output_dir}/{model_name}_{case['id']}.json"
        with open(case_filename, 'w') as f:
            json.dump(result, f, indent=2)
    
    # Convert to DataFrame
    df = pd.DataFrame(results)
    
    # Save full results to CSV
    df.to_csv(f"{output_dir}/{model_name}_results.csv", index=False)
    
    return df

def compare_models(results_dfs: Dict[str, pd.DataFrame], output_dir: str):
    """Compare results across different models and generate visualizations."""
    # Combine all results
    all_results = pd.concat(results_dfs.values())
    
    # Save combined results
    all_results.to_csv(f"{output_dir}/all_models_results.csv", index=False)
    
    # Create comparison visualizations
    create_visualizations(all_results, output_dir)
    
    # Generate summary report
    generate_summary_report(all_results, output_dir)

def create_visualizations(df: pd.DataFrame, output_dir: str):
    """Create visualizations comparing model performance."""
    # Set the style
    sns.set(style="whitegrid")
    
    # 1. Response Time Comparison
    plt.figure(figsize=(10, 6))
    sns.barplot(x="model", y="response_time", data=df)
    plt.title("Response Time by Model")
    plt.ylabel("Time (seconds)")
    plt.tight_layout()
    plt.savefig(f"{output_dir}/response_time_comparison.png")
    plt.close()
    
    # 2. Keyword Coverage Comparison
    plt.figure(figsize=(10, 6))
    sns.barplot(x="model", y="keyword_coverage", data=df)
    plt.title("Keyword Coverage by Model")
    plt.ylabel("Coverage Percentage")
    plt.tight_layout()
    plt.savefig(f"{output_dir}/keyword_coverage_comparison.png")
    plt.close()
    
    # 3. Token Efficiency (Tokens per Second)
    plt.figure(figsize=(10, 6))
    sns.barplot(x="model", y="tokens_per_second", data=df)
    plt.title("Token Generation Efficiency by Model")
    plt.ylabel("Tokens per Second")
    plt.tight_layout()
    plt.savefig(f"{output_dir}/token_efficiency_comparison.png")
    plt.close()
    
    # 4. Performance by Query Category
    plt.figure(figsize=(12, 8))
    sns.boxplot(x="category", y="keyword_coverage", hue="model", data=df)
    plt.title("Keyword Coverage by Query Category and Model")
    plt.ylabel("Keyword Coverage")
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.savefig(f"{output_dir}/performance_by_category.png")
    plt.close()

def generate_summary_report(df: pd.DataFrame, output_dir: str):
    """Generate a summary report of the evaluation results."""
    # Calculate overall metrics by model
    model_summary = df.groupby('model').agg({
        'response_time': 'mean',
        'keyword_coverage': 'mean',
        'input_tokens': 'mean',
        'output_tokens': 'mean',
        'tokens_per_second': 'mean'
    }).reset_index()
    
    # Calculate rankings
    metrics = ['keyword_coverage', 'tokens_per_second']
    
    # Higher is better for these metrics
    for metric in metrics:
        model_summary[f'{metric}_rank'] = model_summary[metric].rank(ascending=False)
    
    # Lower is better for these metrics
    model_summary['response_time_rank'] = model_summary['response_time'].rank(ascending=True)
    
    # Calculate average rank
    rank_columns = [col for col in model_summary.columns if col.endswith('_rank')]
    model_summary['average_rank'] = model_summary[rank_columns].mean(axis=1)
    
    # Sort by average rank
    model_summary = model_summary.sort_values('average_rank')
    
    # Save summary to CSV
    model_summary.to_csv(f"{output_dir}/model_summary.csv", index=False)
    
    # Generate HTML report
    html_report = f"""
    <html>
    <head>
        <title>LLM Evaluation Report</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 20px; }}
            h1, h2 {{ color: #333; }}
            table {{ border-collapse: collapse; width: 100%; margin-bottom: 20px; }}
            th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
            th {{ background-color: #f2f2f2; }}
            tr:nth-child(even) {{ background-color: #f9f9f9; }}
            .highlight {{ background-color: #e6f7ff; }}
            .section {{ margin-bottom: 30px; }}
            img {{ max-width: 100%; height: auto; margin: 10px 0; }}
        </style>
    </head>
    <body>
        <h1>LLM Evaluation Report</h1>
        <p>Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        
        <div class="section">
            <h2>Model Performance Summary</h2>
            <table>
                <tr>
                    <th>Model</th>
                    <th>Avg Rank</th>
                    <th>Keyword Coverage</th>
                    <th>Response Time (s)</th>
                    <th>Tokens/Second</th>
                </tr>
    """
    
    # Add rows for each model
    for _, row in model_summary.iterrows():
        html_report += f"""
                <tr>
                    <td>{row['model']}</td>
                    <td>{row['average_rank']:.2f}</td>
                    <td>{row['keyword_coverage']:.4f}</td>
                    <td>{row['response_time']:.2f}</td>
                    <td>{row['tokens_per_second']:.2f}</td>
                </tr>
        """
    
    html_report += """
            </table>
        </div>
        
        <div class="section">
            <h2>Visualizations</h2>
            
            <h3>Response Time</h3>
            <img src="response_time_comparison.png" alt="Response Time Comparison">
            
            <h3>Keyword Coverage</h3>
            <img src="keyword_coverage_comparison.png" alt="Keyword Coverage Comparison">
            
            <h3>Efficiency</h3>
            <img src="token_efficiency_comparison.png" alt="Token Efficiency Comparison">
            
            <h3>Performance by Category</h3>
            <img src="performance_by_category.png" alt="Performance by Category">
        </div>
        
        <div class="section">
            <h2>Conclusion</h2>
            <p>Based on the evaluation metrics, the models can be ranked as follows:</p>
            <ol>
    """
    
    # Add model rankings
    for _, row in model_summary.iterrows():
        html_report += f"""
                <li><strong>{row['model']}</strong> (Average Rank: {row['average_rank']:.2f})</li>
        """
    
    html_report += """
            </ol>
            <p>
                This ranking considers multiple factors including keyword coverage, response time, 
                and token generation efficiency.
            </p>
            <p>
                <strong>Note:</strong> This evaluation was conducted using mock responses since the actual API integration
                could not be established. In a real-world scenario, you would replace the mock responses with actual API calls.
            </p>
        </div>
    </body>
    </html>
    """
    
    # Save HTML report
    with open(f"{output_dir}/evaluation_report.html", 'w') as f:
        f.write(html_report)
    
    print(f"Summary report generated at {output_dir}/evaluation_report.html")

def main():
    """Main function to run the evaluation."""
    parser = argparse.ArgumentParser(description='Evaluate LLM models for financial queries')
    parser.add_argument('--models', nargs='+', default=['chatgpt', 'llama', 'deepseek'],
                        help='Models to evaluate')
    parser.add_argument('--prompts', type=str, default='llm_tests/prompts.json',
                        help='Path to prompts JSON file')
    parser.add_argument('--output-dir', type=str, default='llm_tests/results',
                        help='Directory to save results')
    
    args = parser.parse_args()
    
    # Create output directory if it doesn't exist
    os.makedirs(args.output_dir, exist_ok=True)
    
    # Load test cases
    try:
        with open(args.prompts, 'r') as f:
            test_cases = json.load(f)['test_cases']
        print(f"Successfully loaded {len(test_cases)} test cases from {args.prompts}")
    except FileNotFoundError:
        print(f"Error: Prompts file {args.prompts} not found.")
        return
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in prompts file: {e}")
        return
    
    # Evaluate each model
    results_dfs = {}
    for model in args.models:
        print(f"\n=== Evaluating {model} ===")
        results_df = evaluate_model(model, test_cases, args.output_dir)
        results_dfs[model] = results_df
    
    # Compare models
    print("\n=== Comparing Models ===")
    compare_models(results_dfs, args.output_dir)
    
    print(f"\nEvaluation complete. Results saved to {args.output_dir}")
    print(f"Open the HTML report at {os.path.join(args.output_dir, 'evaluation_report.html')}")

if __name__ == "__main__":
    main()