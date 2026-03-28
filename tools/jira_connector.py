import requests
import base64

def test_jira_connection(url: str, email: str, token: str) -> tuple[bool, str]:
    """
    Test Jira API connection using Atlassian API token.
    Returns (success_boolean, message)
    """
    try:
        jira_url = f"{url.rstrip('/')}/rest/api/3/myself"
        
        # Create Basic Auth token
        auth_string = f"{email}:{token}"
        auth_bytes = auth_string.encode('utf-8')
        base64_auth = base64.b64encode(auth_bytes).decode('utf-8')
        
        headers = {
            "Accept": "application/json",
            "Authorization": f"Basic {base64_auth}"
        }
        
        response = requests.get(jira_url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            name = data.get("displayName", "User")
            return True, f"Successfully authenticated to Jira as {name}"
        elif response.status_code == 401:
            return False, "Authentication failed. Please check your Email and API Token."
        elif response.status_code == 403:
            return False, "Access forbidden. Check your account permissions."
        else:
            return False, f"Jira connection failed: HTTP {response.status_code} - {response.text}"
            
    except requests.exceptions.RequestException as e:
        return False, f"Could not connect to Jira URL: {str(e)}"

def fetch_jira_issues(url: str, email: str, token: str, project_key: str) -> tuple[bool, str, list]:
    """
    Fetch Jira issues for a specific project.
    Returns (success_boolean, message, list_of_issues)
    """
    try:
        # Search endpoint: JQL query
        jira_url = f"{url.rstrip('/')}/rest/api/3/search/jql"
        
        # Create Basic Auth token
        auth_string = f"{email}:{token}"
        auth_bytes = auth_string.encode('utf-8')
        base64_auth = base64.b64encode(auth_bytes).decode('utf-8')
        
        headers = {
            "Accept": "application/json",
            "Authorization": f"Basic {base64_auth}"
        }
        
        # JQL query to get recent issues for the project
        params = {
            "jql": f"project = {project_key} ORDER BY created DESC",
            "maxResults": 20,
            "fields": "summary,issuetype,status,description"
        }
        
        response = requests.get(jira_url, headers=headers, params=params, timeout=15)
        
        if response.status_code == 200:
            data = response.json()
            issues_raw = data.get("issues", [])
            fetched = []
            for issue in issues_raw:
                fetched.append({
                    "key": issue.get("key"),
                    "summary": issue.get("fields", {}).get("summary", "No Summary"),
                    "type": issue.get("fields", {}).get("issuetype", {}).get("name", "Unknown"),
                    "status": issue.get("fields", {}).get("status", {}).get("name", "Unknown")
                })
            
            return True, f"Successfully fetched {len(fetched)} issues.", fetched
        elif response.status_code == 401:
            return False, "Authentication failed. Please check your credentials.", []
        else:
            return False, f"Jira fetch failed: HTTP {response.status_code} - {response.text}", []
            
    except requests.exceptions.RequestException as e:
        return False, f"Could not connect to Jira to fetch issues: {str(e)}", []
