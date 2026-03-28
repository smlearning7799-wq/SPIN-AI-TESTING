import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'tools'))
from llm_connector import generate_test_plan

mock_issues = [
    {"key": "TEST-1", "summary": "Login feature", "type": "Story", "status": "To Do"},
    {"key": "TEST-2", "summary": "Password reset", "type": "Bug", "status": "In Progress"}
]

# Using Ollama provider (assuming it's running as we checked before)
success, content = generate_test_plan("ollama", "http://localhost:11434", mock_issues)

if success:
    print("SUCCESS")
    print("--- CONTENT START ---")
    print(content)
    print("--- CONTENT END ---")
    
    # Save to a file to check readability
    with open("test_plan_output.md", "w", encoding="utf-8") as f:
        f.write(content)
    print("Saved to test_plan_output.md")
else:
    print(f"FAILED: {content}")
