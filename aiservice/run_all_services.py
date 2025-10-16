"""
Master script to run all AI services
"""
import sys
import os
import subprocess
import threading
import time
import logging
import signal

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ServiceManager:
    def __init__(self):
        self.processes = {}
        self.running = True
        
    def start_service(self, service_name, script_path, port, python_exe=None):
        """Start a service in a separate process"""
        try:
            logger.info(f"Starting {service_name} on port {port}...")
            python_cmd = python_exe if python_exe else sys.executable
            process = subprocess.Popen([python_cmd, script_path], 
                                     stdout=subprocess.PIPE, 
                                     stderr=subprocess.PIPE,
                                     text=True,
                                     bufsize=1,
                                     universal_newlines=True)
            self.processes[service_name] = {
                'process': process,
                'port': port,
                'script': script_path,
                'python': python_cmd
            }
            
            # Start output monitoring thread
            threading.Thread(target=self.monitor_output, args=(service_name, process), daemon=True).start()
            
            logger.info(f"{service_name} started with PID {process.pid}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to start {service_name}: {str(e)}")
            return False
    
    def monitor_output(self, service_name, process):
        """Monitor service output"""
        while self.running and process.poll() is None:
            try:
                line = process.stdout.readline()
                if line:
                    logger.info(f"[{service_name}] {line.strip()}")
            except:
                break
    
    def stop_all_services(self):
        """Stop all running services"""
        logger.info("Stopping all services...")
        self.running = False
        
        for service_name, service_info in self.processes.items():
            process = service_info['process']
            if process.poll() is None:  # Process is still running
                logger.info(f"Stopping {service_name}...")
                try:
                    process.terminate()
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    logger.warning(f"Force killing {service_name}...")
                    process.kill()
                logger.info(f"{service_name} stopped")
    
    def check_services(self):
        """Check status of all services"""
        for service_name, service_info in self.processes.items():
            process = service_info['process']
            if process.poll() is not None:
                logger.error(f"{service_name} has stopped unexpectedly (exit code: {process.returncode})")
                # Optionally restart the service
                self.restart_service(service_name)
    
    def restart_service(self, service_name):
        """Restart a specific service"""
        if service_name in self.processes:
            service_info = self.processes[service_name]
            logger.info(f"Restarting {service_name}...")
            self.start_service(service_name, service_info['script'], service_info['port'], service_info.get('python'))

def signal_handler(signum, frame):
    """Handle shutdown signals"""
    logger.info("Received shutdown signal...")
    manager.stop_all_services()
    sys.exit(0)

if __name__ == '__main__':
    # Set up signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    manager = ServiceManager()
    
    # Get virtual environment Python path
    venv_python = os.path.join(os.path.dirname(__file__), 'aiservice_env', 'Scripts', 'python.exe')
    
    # Define services to start
    services = [
        {
            'name': 'Embedding Service',
            'script': os.path.join(os.path.dirname(__file__), 'embedding_service', 'embedding_service.py'),
            'python': venv_python,
            'port': 5001
        },
        {
            'name': 'Text Extraction Service', 
            'script': os.path.join(os.path.dirname(__file__), 'text_extraction', 'text_extraction_service.py'),
            'python': venv_python,
            'port': 5002
        },
        {
            'name': 'AI Bridge Service',
            'script': os.path.join(os.path.dirname(__file__), 'ai_bridge', 'ai_bridge_app.py'),
            'python': venv_python,
            'port': 5003
        },
        {
            'name': 'Chatbot Service',
            'script': os.path.join(os.path.dirname(__file__), 'chatbot', 'chatbot_service.py'),
            'python': venv_python,
            'port': 5000
        }
    ]
    
    logger.info("=== AI Services Manager ===")
    logger.info("Starting all services...")
    
    # Start all services
    for service in services:
        success = manager.start_service(service['name'], service['script'], service['port'], service['python'])
        if not success:
            logger.error(f"Failed to start {service['name']}")
        time.sleep(2)  # Wait between service starts
    
    logger.info("All services started!")
    logger.info("Services running:")
    for service in services:
        logger.info(f"  - {service['name']}: http://localhost:{service['port']}")
    
    logger.info("Press Ctrl+C to stop all services")
    
    try:
        # Keep the main thread alive and monitor services
        while True:
            time.sleep(10)
            manager.check_services()
    except KeyboardInterrupt:
        pass
    finally:
        manager.stop_all_services()