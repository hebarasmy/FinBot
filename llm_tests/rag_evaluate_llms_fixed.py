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
import openai
from dotenv import load_dotenv

# Load environment variables from .env.local
load_dotenv('.env.local')

# Set up API clients
openai_client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
groq_client = openai.OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=os.getenv("GROQ_API_KEY")
)

def get_ai_response(prompt, model, region="Global", retrieved_context=None):
    """
    Get response from AI models using actual API calls
    """
    system_message = f"You are a financial expert providing information about the {region} region. Answer the following question with accurate and up-to-date information."
    
    # Add retrieved context if available
    if retrieved_context:
        system_message += f"\n\nHere is some relevant context to help you answer accurately:\n{retrieved_context}"
    
    try:
        start_time = time.time()
        
        if model.lower() == "chatgpt":
            response = openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500
            )
            result = response.choices[0].message.content
            
        elif model.lower() == "llama":
            response = groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500
            )
            result = response.choices[0].message.content
            
        elif model.lower() == "deepseek":
            response = groq_client.chat.completions.create(
                model="deepseek-r1-distill-llama-70b",
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500
            )
            result = response.choices[0].message.content
            
        else:
            # Fallback to a default model
            response = groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500
            )
            result = response.choices[0].message.content
        
        end_time = time.time()
        print(f"Response time: {end_time - start_time:.2f}s")
        
        return result
        
    except Exception as e:
        print(f"Error calling AI API: {str(e)}")
        # Return a fallback response in case of API error
        return f"[API Error] Could not generate response for query about {prompt[:30]}... using {model}."

def evaluate_hallucination(response, reference_context, reference_answer):
    """
    Evaluate the level of hallucination in the response compared to the reference context
    """
    # Use OpenAI to evaluate hallucination
    try:
        eval_prompt = """
        You are an expert evaluator assessing the factual accuracy of AI responses.
        
        Reference context: {0}
        Reference answer: {1}
        AI response: {2}
        
        On a scale of 0 to 1, rate the level of hallucination in the AI response, where:
        - 0 means the response contains only facts supported by the reference context or reference answer
        - 0.5 means the response contains a mix of supported facts and unsupported claims
        - 1 means the response contains significant claims not supported by the reference
        
        First, identify any specific claims in the AI response that are not supported by the reference.
        Then provide your numerical rating (0-1) and a brief explanation.
        
        Format your response as a JSON object with the following structure:
        {{
            "unsupported_claims": ["claim 1", "claim 2", ...],
            "hallucination_score": 0.5,
            "explanation": "Your explanation here"
        }}
        """.format(reference_context, reference_answer, response)
        
        eval_response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert evaluator of AI responses."},
                {"role": "user", "content": eval_prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        result = json.loads(eval_response.choices[0].message.content)
        return result
    except Exception as e:
        print(f"Error evaluating hallucination: {str(e)}")
        return {
            "unsupported_claims": [],
            "hallucination_score": 0.5,  # Default middle value
            "explanation": "Error in evaluation"
        }

def evaluate_bias(response):
    """
    Evaluate potential bias in the response
    """
    # Use OpenAI to evaluate bias
    try:
        eval_prompt = """
        You are an expert evaluator assessing potential bias in AI responses to financial questions.
        
        AI response: {0}
        
        Evaluate the response for the following types of bias:
        1. Political bias (favoring particular political viewpoints)
        2. Regional bias (favoring particular regions/countries)
        3. Recency bias (overemphasizing recent events)
        4. Source bias (overreliance on particular sources)
        5. Confirmation bias (reinforcing existing beliefs)
        
        For each type of bias, rate on a scale of 0 to 1, where:
        - 0 means no detectable bias
        - 0.5 means moderate bias
        - 1 means strong bias
        
        Format your response as a JSON object with the following structure:
        {{
            "political_bias": 0.5,
            "regional_bias": 0.5,
            "recency_bias": 0.5,
            "source_bias": 0.5,
            "confirmation_bias": 0.5,
            "overall_bias": 0.5,
            "explanation": "Your explanation here"
        }}
        """.format(response)
        
        eval_response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert evaluator of AI responses."},
                {"role": "user", "content": eval_prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        result = json.loads(eval_response.choices[0].message.content)
        return result
    except Exception as e:
        print(f"Error evaluating bias: {str(e)}")
        return {
            "political_bias": 0.5,
            "regional_bias": 0.5,
            "recency_bias": 0.5,
            "source_bias": 0.5,
            "confirmation_bias": 0.5,
            "overall_bias": 0.5,
            "explanation": "Error in evaluation"
        }

def count_tokens(text: str) -> int:
    """Count the number of tokens in a text string (simplified)."""
    # Simple approximation: 1 token ≈ 4 characters
    return len(text) // 4

def calculate_keyword_coverage(response: str, keywords: List[str]) -> float:
    """Calculate the percentage of expected keywords present in the response."""
    response_lower = response.lower()
    keywords_found = sum(1 for keyword in keywords if keyword.lower() in response_lower)
    return keywords_found / len(keywords) if keywords else 0

def calculate_similarity_score(response: str, reference: str) -> float:
    """Calculate a simple similarity score between response and reference."""
    # Simple word overlap score
    response_words = set(response.lower().split())
    reference_words = set(reference.lower().split())
    
    if not reference_words:
        return 0.0
    
    overlap = len(response_words.intersection(reference_words))
    return overlap / len(reference_words)

def evaluate_model(
    model_name: str, 
    test_cases: List[Dict[str, Any]], 
    output_dir: str,
    evaluate_rag: bool = True
) -> pd.DataFrame:
    """Evaluate a single model on all test cases."""
    results = []
    
    for case in test_cases:
        query = case["query"]
        reference = case["reference_answer"]
        keywords = case["expected_keywords"]
        region = case.get("region", "Global")
        
        # Get retrieved context if available (for RAG evaluation)
        retrieved_context = case.get("retrieved_context", "")
        
        print(f"Testing {model_name} on query: {query[:50]}...")
        
        # Measure response time
        start_time = time.time()
        response = get_ai_response(query, model_name, region, retrieved_context if evaluate_rag else None)
        end_time = time.time()
        response_time = end_time - start_time
        
        # Count tokens
        input_tokens = count_tokens(query)
        output_tokens = count_tokens(response)
        
        # Calculate keyword coverage
        keyword_coverage = calculate_keyword_coverage(response, keywords)
        
        # Calculate similarity score
        similarity_score = calculate_similarity_score(response, reference)
        
        # Evaluate hallucination and bias if RAG evaluation is enabled
        hallucination_result = None
        bias_result = None
        
        if evaluate_rag:
            print("Evaluating hallucination...")
            hallucination_result = evaluate_hallucination(response, retrieved_context, reference)
            
            print("Evaluating bias...")
            bias_result = evaluate_bias(response)
        
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
            "input_tokens": count_tokens(query),
            "output_tokens": count_tokens(response),
            "tokens_per_second": output_tokens / response_time if response_time > 0 else 0,
            "keyword_coverage": keyword_coverage,
            "similarity_score": similarity_score,
        }
        
        # Add RAG-specific metrics if available
        if evaluate_rag and hallucination_result and bias_result:
            result.update({
                "hallucination_score": hallucination_result["hallucination_score"],
                "unsupported_claims": hallucination_result["unsupported_claims"],
                "hallucination_explanation": hallucination_result["explanation"],
                "political_bias": bias_result["political_bias"],
                "regional_bias": bias_result["regional_bias"],
                "recency_bias": bias_result["recency_bias"],
                "source_bias": bias_result["source_bias"],
                "confirmation_bias": bias_result["confirmation_bias"],
                "overall_bias": bias_result["overall_bias"],
                "bias_explanation": bias_result["explanation"],
            })
        
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

def compare_models(results_dfs: Dict[str, pd.DataFrame], output_dir: str, evaluate_rag: bool = True):
    """Compare results across different models and generate visualizations."""
    # Combine all results
    all_results = pd.concat(results_dfs.values())
    
    # Save combined results
    all_results.to_csv(f"{output_dir}/all_models_results.csv", index=False)
    
    # Create comparison visualizations
    create_visualizations(all_results, output_dir, evaluate_rag)
    
    # Generate summary report
    generate_summary_report(all_results, output_dir, evaluate_rag)

def create_visualizations(df: pd.DataFrame, output_dir: str, evaluate_rag: bool = True):
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
    
    # 5. Similarity Score Comparison
    plt.figure(figsize=(10, 6))
    sns.barplot(x="model", y="similarity_score", data=df)
    plt.title("Similarity to Reference Answer by Model")
    plt.ylabel("Similarity Score")
    plt.tight_layout()
    plt.savefig(f"{output_dir}/similarity_comparison.png")
    plt.close()
    
    # RAG-specific visualizations
    if evaluate_rag and "hallucination_score" in df.columns:
        # 6. Hallucination Score Comparison
        plt.figure(figsize=(10, 6))
        sns.barplot(x="model", y="hallucination_score", data=df)
        plt.title("Hallucination Score by Model (Lower is Better)")
        plt.ylabel("Hallucination Score")
        plt.tight_layout()
        plt.savefig(f"{output_dir}/hallucination_comparison.png")
        plt.close()
        
        # 7. Overall Bias Comparison
        plt.figure(figsize=(10, 6))
        sns.barplot(x="model", y="overall_bias", data=df)
        plt.title("Overall Bias by Model (Lower is Better)")
        plt.ylabel("Bias Score")
        plt.tight_layout()
        plt.savefig(f"{output_dir}/bias_comparison.png")
        plt.close()
        
        # 8. Detailed Bias Comparison
        bias_columns = ["political_bias", "regional_bias", "recency_bias", "source_bias", "confirmation_bias"]
        bias_data = []
        
        for model in df["model"].unique():
            model_df = df[df["model"] == model]
            for bias_type in bias_columns:
                if bias_type in model_df.columns:
                    avg_bias = model_df[bias_type].mean()
                    bias_data.append({
                        "model": model,
                        "bias_type": bias_type.replace("_bias", "").capitalize(),
                        "score": avg_bias
                    })
        
        bias_df = pd.DataFrame(bias_data)
        
        plt.figure(figsize=(12, 8))
        sns.barplot(x="bias_type", y="score", hue="model", data=bias_df)
        plt.title("Detailed Bias Analysis by Model (Lower is Better)")
        plt.ylabel("Bias Score")
        plt.tight_layout()
        plt.savefig(f"{output_dir}/detailed_bias_comparison.png")
        plt.close()

def generate_summary_report(df: pd.DataFrame, output_dir: str, evaluate_rag: bool = True):
    """Generate a summary report of the evaluation results."""
    # Define metrics to include in summary
    base_metrics = [
        'response_time', 
        'keyword_coverage', 
        'similarity_score', 
        'input_tokens', 
        'output_tokens', 
        'tokens_per_second'
    ]
    
    rag_metrics = []
    if evaluate_rag and "hallucination_score" in df.columns:
        rag_metrics = [
            'hallucination_score',
            'overall_bias',
            'political_bias',
            'regional_bias',
            'recency_bias',
            'source_bias',
            'confirmation_bias'
        ]
    
    metrics = base_metrics + [m for m in rag_metrics if m in df.columns]
    
    # Calculate overall metrics by model
    model_summary = df.groupby('model')[metrics].mean().reset_index()
    
    # Calculate rankings
    higher_better = ['keyword_coverage', 'similarity_score', 'tokens_per_second']
    lower_better = ['response_time'] + [m for m in rag_metrics if m in df.columns]
    
    # Higher is better for these metrics
    for metric in higher_better:
        if metric in model_summary.columns:
            model_summary[f'{metric}_rank'] = model_summary[metric].rank(ascending=False)
    
    # Lower is better for these metrics
    for metric in lower_better:
        if metric in model_summary.columns:
            model_summary[f'{metric}_rank'] = model_summary[metric].rank(ascending=True)
    
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
        <title>LLM Evaluation Report with RAG Assessment</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 20px; }}
            h1, h2, h3 {{ color: #333; }}
            table {{ border-collapse: collapse; width: 100%; margin-bottom: 20px; }}
            th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
            th {{ background-color: #f2f2f2; }}
            tr:nth-child(even) {{ background-color: #f9f9f9; }}
            .highlight {{ background-color: #e6f7ff; }}
            .section {{ margin-bottom: 30px; }}
            img {{ max-width: 100%; height: auto; margin: 10px 0; }}
            .model-response {{ background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; }}
            .model-card {{ border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 20px; }}
            .model-header {{ display: flex; justify-content: space-between; }}
            .metrics {{ display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }}
            .metric {{ background-color: #e9ecef; padding: 5px 10px; border-radius: 4px; }}
            .good {{ color: green; }}
            .bad {{ color: red; }}
            .neutral {{ color: orange; }}
        </style>
    </head>
    <body>
        <h1>LLM Evaluation Report with RAG Assessment</h1>
        <p>Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        
        <div class="section">
            <h2>Model Performance Summary</h2>
            <table>
                <tr>
                    <th>Model</th>
                    <th>Avg Rank</th>
                    <th>Keyword Coverage</th>
                    <th>Similarity Score</th>
                    <th>Response Time (s)</th>
    """
    
    # Add RAG-specific columns if available
    if evaluate_rag and "hallucination_score" in df.columns:
        html_report += """
                    <th>Hallucination Score</th>
                    <th>Overall Bias</th>
        """
    
    html_report += """
                </tr>
    """
    
    # Add rows for each model
    for _, row in model_summary.iterrows():
        html_report += f"""
                <tr>
                    <td>{row['model']}</td>
                    <td>{row['average_rank']:.2f}</td>
                    <td>{row['keyword_coverage']:.4f}</td>
                    <td>{row['similarity_score']:.4f}</td>
                    <td>{row['response_time']:.2f}</td>
        """
        
        # Add RAG-specific metrics if available
        if evaluate_rag and "hallucination_score" in row:
            html_report += f"""
                    <td>{row['hallucination_score']:.4f}</td>
                    <td>{row['overall_bias']:.4f}</td>
            """
        
        html_report += """
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
            
            <h3>Similarity to Reference</h3>
            <img src="similarity_comparison.png" alt="Similarity Score Comparison">
    """
    
    # Add RAG-specific visualizations if available
    if evaluate_rag and "hallucination_score" in df.columns:
        html_report += """
            <h3>Hallucination Assessment</h3>
            <img src="hallucination_comparison.png" alt="Hallucination Comparison">
            
            <h3>Bias Assessment</h3>
            <img src="bias_comparison.png" alt="Bias Comparison">
            
            <h3>Detailed Bias Analysis</h3>
            <img src="detailed_bias_comparison.png" alt="Detailed Bias Comparison">
        """
    
    html_report += """
            <h3>Efficiency</h3>
            <img src="token_efficiency_comparison.png" alt="Token Efficiency Comparison">
            
            <h3>Performance by Category</h3>
            <img src="performance_by_category.png" alt="Performance by Category">
        </div>
    """
    
    # Add RAG-specific sample responses if available
    if evaluate_rag and "hallucination_score" in df.columns:
        html_report += """
        <div class="section">
            <h2>Sample Responses with RAG Assessment</h2>
        """
        
        # Get samples with highest and lowest hallucination scores for each model
        for model in df['model'].unique():
            model_df = df[df['model'] == model].copy()
            
            if len(model_df) > 0 and "hallucination_score" in model_df.columns:
                # Get best (lowest hallucination) and worst (highest hallucination) examples
                best_idx = model_df['hallucination_score'].idxmin()
                worst_idx = model_df['hallucination_score'].idxmax()
                
                if best_idx is not None and worst_idx is not None:
                    best_example = model_df.loc[best_idx]
                    worst_example = model_df.loc[worst_idx]
                    
                    html_report += f"""
                    <h3>Model: {model}</h3>
                    
                    <h4>Best Example (Lowest Hallucination)</h4>
                    <div class="model-card">
                        <p><strong>Query:</strong> {best_example['query']}</p>
                        <div class="model-response">
                            <p>{best_example['response']}</p>
                        </div>
                        <div class="metrics">
                            <span class="metric good">Hallucination Score: {best_example['hallucination_score']:.2f}</span>
                            <span class="metric">Bias Score: {best_example['overall_bias']:.2f}</span>
                            <span class="metric">Keyword Coverage: {best_example['keyword_coverage']:.2f}</span>
                        </div>
                        <p><strong>Hallucination Analysis:</strong> {best_example['hallucination_explanation']}</p>
                    </div>
                    
                    <h4>Worst Example (Highest Hallucination)</h4>
                    <div class="model-card">
                        <p><strong>Query:</strong> {worst_example['query']}</p>
                        <div class="model-response">
                            <p>{worst_example['response']}</p>
                        </div>
                        <div class="metrics">
                            <span class="metric bad">Hallucination Score: {worst_example['hallucination_score']:.2f}</span>
                            <span class="metric">Bias Score: {worst_example['overall_bias']:.2f}</span>
                            <span class="metric">Keyword Coverage: {worst_example['keyword_coverage']:.2f}</span>
                        </div>
                        <p><strong>Hallucination Analysis:</strong> {worst_example['hallucination_explanation']}</p>
                    </div>
                    """
        
        html_report += """
        </div>
        """
    
    html_report += """
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
    """
    
    # Add RAG-specific conclusions if available
    if evaluate_rag and "hallucination_score" in df.columns:
        # Calculate average hallucination and bias scores by model
        hallucination_by_model = df.groupby('model')['hallucination_score'].mean().sort_values()
        bias_by_model = df.groupby('model')['overall_bias'].mean().sort_values()
        
        html_report += f"""
            <h3>Hallucination Assessment</h3>
            <p>Models ranked by hallucination score (lower is better):</p>
            <ol>
        """
        
        for model, score in hallucination_by_model.items():
            html_report += f"""
                <li><strong>{model}</strong>: {score:.4f}</li>
            """
        
        html_report += """
            </ol>
            
            <h3>Bias Assessment</h3>
            <p>Models ranked by overall bias score (lower is better):</p>
            <ol>
        """
        
        for model, score in bias_by_model.items():
            html_report += f"""
                <li><strong>{model}</strong>: {score:.4f}</li>
            """
        
        html_report += """
            </ol>
            
            <h3>Key Findings on RAG Quality</h3>
            <ul>
                <li>Hallucination scores indicate how often models generate information not supported by the retrieved context.</li>
                <li>Bias scores show potential skews in the model responses across different dimensions.</li>
                <li>Models with lower hallucination scores generally provide more reliable information in a RAG context.</li>
            </ul>
        """
    
    html_report += """
            <p>
                <strong>Recommendations:</strong> Based on these results, consider using different models for different types of queries
                to optimize both performance and quality.
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
    parser = argparse.ArgumentParser(description='Evaluate LLM models for financial queries with RAG assessment')
    parser.add_argument('--models', nargs='+', default=['chatgpt', 'llama', 'deepseek'],
                        help='Models to evaluate')
    parser.add_argument('--prompts', type=str, default='llm_tests/prompts.json',
                        help='Path to prompts JSON file')
    parser.add_argument('--output-dir', type=str, default='llm_tests/rag_results',
                        help='Directory to save results')
    parser.add_argument('--sample-size', type=int, default=None,
                        help='Number of test cases to sample (for quick testing)')
    parser.add_argument('--no-rag', action='store_true',
                        help='Disable RAG-specific evaluations')
    
    args = parser.parse_args()
    
    # Create output directory if it doesn't exist
    os.makedirs(args.output_dir, exist_ok=True)
    
    # Load test cases
    try:
        with open(args.prompts, 'r') as f:
            test_cases = json.load(f)['test_cases']
        
        # Sample test cases if requested
        if args.sample_size and args.sample_size < len(test_cases):
            import random
            test_cases = random.sample(test_cases, args.sample_size)
            
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
        results_df = evaluate_model(model, test_cases, args.output_dir, not args.no_rag)
        results_dfs[model] = results_df
    
    # Compare models
    print("\n=== Comparing Models ===")
    compare_models(results_dfs, args.output_dir, not args.no_rag)
    
    print(f"\nEvaluation complete. Results saved to {args.output_dir}")
    print(f"Open the HTML report at {os.path.join(args.output_dir, 'evaluation_report.html')}")

if __name__ == "__main__":
    main()