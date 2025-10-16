"""
Entry point to run the AI Bridge Service
"""
import sys
import os
import subprocess

def run_ai_bridge():
    """Run AI Bridge service using virtual environment Python"""
    # Get the virtual environment Python path
    venv_python = os.path.join(os.path.dirname(__file__), 'aiservice_env', 'Scripts', 'python.exe')
    ai_bridge_script = os.path.join(os.path.dirname(__file__), 'ai_bridge', 'ai_bridge_app.py')
    
    if os.path.exists(venv_python) and os.path.exists(ai_bridge_script):
        print("Starting AI Bridge Service using virtual environment...")
        subprocess.run([venv_python, ai_bridge_script], check=True)
    else:
        print(f"Virtual environment or script not found:")
        print(f"  Python: {venv_python} (exists: {os.path.exists(venv_python)})")
        print(f"  Script: {ai_bridge_script} (exists: {os.path.exists(ai_bridge_script)})")
        sys.exit(1)

if __name__ == '__main__':
    run_ai_bridge()