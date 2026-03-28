import requests
import json

def test_llm_connection(provider: str, url_or_key: str) -> tuple[bool, str]:
    """
    Test the connection to the specified LLM provider.
    Returns (success_boolean, message)
    """
    try:
        if provider.lower() == "ollama":
            # url_or_key is expected to be the base URL, e.g., http://localhost:11434
            url = f"{url_or_key.rstrip('/')}/api/tags"
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                data = response.json()
                models = [m.get("name") for m in data.get("models", [])]
                return True, f"Connected to Ollama successfully. Found {len(models)} local models."
            return False, f"Ollama responded with status code {response.status_code}"
            
        elif provider.lower() in ["groq", "grok"]:
            # Basic validation for Groq (starts with gsk_)
            if not url_or_key.startswith("gsk_") and provider.lower() == "groq":
                return False, "Invalid Groq API Key format. Should start with 'gsk_'"
            
            headers = {
                "Authorization": f"Bearer {url_or_key}",
                "Content-Type": "application/json"
            }
            # Test Groq models endpoint
            url = "https://api.groq.com/openai/v1/models"
            
            if provider.lower() == "grok":
                url = "https://api.x.ai/v1/models" # Example xAI endpoint
                
            response = requests.get(url, headers=headers, timeout=5)
            
            if response.status_code == 200:
                return True, f"Connected to {provider.upper()} API successfully."
            return False, f"{provider.upper()} test failed with status {response.status_code}: {response.text}"
            
        else:
            return False, f"Unsupported provider: {provider}"
            
    except requests.exceptions.RequestException as e:
        return False, f"Connection failed: {str(e)}"

def generate_test_plan(provider: str, url_or_key: str, issues: list) -> tuple[bool, str]:
    """
    Generate a test plan based on a list of Jira issues using the specified LLM provider.
    Returns (success_boolean, test_plan_content)
    """
    if not issues:
        return False, "No issues provided for test plan generation."

    # Prepare the prompt
    issues_text = "\n".join([f"- {i['key']}: {i['summary']} (Type: {i['type']}, Status: {i['status']})" for i in issues])
    
    prompt = f"""
    You are an expert Quality Assurance Engineer. Based on the following Jira issues, generate a comprehensive Test Plan in Markdown format.
    
    Jira Issues:
    {issues_text}
    
    The Test Plan should include:
    1. Introduction & Scope
    2. Test Scenarios (for each issue)
    3. Positive and Negative Test Cases
    4. Test Data Requirements
    5. Success Criteria
    
    Format everything clearly as Markdown.
    """

    try:
        if provider.lower() == "ollama":
            # First, check what models are actually available
            list_url = f"{url_or_key.rstrip('/')}/api/tags"
            try:
                list_response = requests.get(list_url, timeout=5)
                available_models = []
                if list_response.status_code == 200:
                    available_models = [m.get("name") for m in list_response.json().get("models", [])]
                
                # Determine which model to use
                target_model = "llama3"
                if target_model not in available_models and available_models:
                    target_model = available_models[0]
                elif not available_models:
                    return False, "Ollama connection successful but no models found. Please run 'ollama pull llama3' or similar."
                
                url = f"{url_or_key.rstrip('/')}/api/generate"
                payload = {
                    "model": target_model,
                    "prompt": prompt,
                    "stream": False
                }
                response = requests.post(url, json=payload, timeout=120) # Increased timeout for generation
                if response.status_code == 200:
                    data = response.json()
                    content = data.get("response", "")
                    
                    # Strip potential markdown code fences if the LLM wrapped the whole thing
                    content = content.strip()
                    if content.startswith("```markdown"):
                        content = content[11:].strip()
                    elif content.startswith("```"):
                        content = content[3:].strip()
                    if content.endswith("```"):
                        content = content[:-3].strip()
                        
                    return True, content or "No response content."
                return False, f"Ollama generation failed ({target_model}): {response.text}"
            except Exception as e:
                return False, f"Failed to communicate with Ollama: {str(e)}"

        elif provider.lower() in ["groq", "grok"]:
            headers = {
                "Authorization": f"Bearer {url_or_key}",
                "Content-Type": "application/json"
            }
            
            url = "https://api.groq.com/openai/v1/chat/completions"
            model = "llama3-8b-8192"
            
            if provider.lower() == "grok":
                url = "https://api.x.ai/v1/chat/completions"
                model = "grok-beta" # Example xAI model name
                
            payload = {
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.5
            }
            
            response = requests.post(url, headers=headers, json=payload, timeout=60)
            
            if response.status_code == 200:
                data = response.json()
                content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                
                # Strip potential markdown code fences
                content = content.strip()
                if content.startswith("```markdown"):
                    content = content[11:].strip()
                elif content.startswith("```"):
                    content = content[3:].strip()
                if content.endswith("```"):
                    content = content[:-3].strip()
                    
                return True, content or "No content received."
            return False, f"{provider.upper()} API error: {response.text}"
            
        else:
            return False, f"Unsupported provider: {provider}"
            
    except requests.exceptions.RequestException as e:
        return False, f"LLM generation request failed: {str(e)}"

