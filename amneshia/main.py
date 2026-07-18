import sys
from .api import run_api_server
from .mcp_server import run_mcp_server

def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "api"
    
    if mode == "mcp":
        run_mcp_server()
    else:
        run_api_server()

if __name__ == "__main__":
    main()
