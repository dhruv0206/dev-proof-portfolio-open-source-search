import subprocess
import sys
import os
import platform

def run_command(command, cwd=None, shell=False):
    """Run a shell command and exit if it fails."""
    try:
        # On Windows, use shell=True for internal commands or complex chains if needed, 
        # but for simple executables, list of args is safer. 
        # However, user wants "runnable everywhere", let's keeps it simple.
        print(f"   $ {command}")
        
        # Split command string for subprocess unless shell=True
        if isinstance(command, str) and not shell:
            # Basic splitting (won't handle quoted args with spaces perfectly, but sufficient here)
            # For complex gcloud/vercel commands, shell=True is often easier for cross-platform scripts 
            # that users just "run".
            pass

        result = subprocess.run(
            command, 
            cwd=cwd, 
            shell=True,  # shell=True allows using string commands like "gcloud ..."
            check=True   # Raises CalledProcessError on non-zero exit code
        )
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Error executing command: {command}")
        print(f"   Exit code: {e.returncode}")
        sys.exit(e.returncode)
    except FileNotFoundError:
        print(f"\n❌ Command not found: {command.split()[0]}")
        sys.exit(1)

def main():
    print("🚀 Starting Full Stack Deployment...\n")

    # ---------------------------------------------------------
    # 1. Backend Deployment (Google Cloud Run)
    # ---------------------------------------------------------
    print("📦 [Backend] Starting deployment to Google Cloud Run...")
    
    if not os.path.exists("ai-engine/ai-engine-cloudbuild.yaml"):
        print("❌ Error: ai-engine/ai-engine-cloudbuild.yaml not found!")
        sys.exit(1)

    print("   • Submitting build to Cloud Build...")
    # Using absolute path for config to be safe, or just assuming cwd is root (which strictly it should be)
    print("   • Submitting build to Cloud Build with Secrets...")
    
    # 1. Fetch Cloud Build Token from Secret Manager (So we don't hardcode it)
    try:
        # We run gcloud to get the secret value. 
        # Note: This requires the current gcloud user to have 'Secret Manager Secret Accessor' role
        token_cmd = 'gcloud secrets versions access latest --secret="BRAIN_GITHUB_TOKEN"'
        
        # On Windows, we need to handle the executable output carefully. 
        # Using subprocess.check_output to grab the value.
        token = subprocess.check_output(token_cmd, shell=True).decode("utf-8").strip()
        
    except Exception as e:
        print("⚠️ Warning: Could not fetch BRAIN_GITHUB_TOKEN from GCP Secrets.")
        print(f"   Reason: {e}")
        # Only for MVP/User Session: Prompt or Fail? 
        # Let's assume user might not have set it up yet and this is a "first run" test.
        # But wait, build will fail without it.
        print("   Build WILL FAIL if the private repo is needed. proceeding to try...")
        token = ""

    # 2. Run Build with Substitution
    # Using format string carefully
    build_cmd = f'gcloud builds submit --config ai-engine/ai-engine-cloudbuild.yaml --substitutions=_GITHUB_TOKEN="{token}" .'
    
    # Mask the token in logs
    print(f"   $ {build_cmd.replace(token, '*****')}")
    
    subprocess.run(build_cmd, shell=True, check=True)

    print("   • Deploying to Cloud Run service 'github-finder-backend'...")
    run_command(
        "gcloud run deploy github-finder-backend "
        "--image gcr.io/opesource-github-search/backend "
        "--platform managed "
        "--region us-central1 "
        "--allow-unauthenticated"
    )

    # ---------------------------------------------------------
    # 2. Frontend Deployment (Vercel)
    # ---------------------------------------------------------
    print("\n🎨 [Frontend] Starting deployment to Vercel...")

    if not os.path.isdir("web-platform"):
        print("❌ Error: 'web-platform' directory not found!")
        sys.exit(1)

    # Vercel needs to run inside the frontend directory
    # On Windows "vercel" might be a cmd/ps1 shim, valid in shell=True
    run_command("vercel --prod", cwd="web-platform")

    # ---------------------------------------------------------
    # Summary
    # ---------------------------------------------------------
    print("\n✅ DEPLOYMENT SUCCESSFUL!")
    print("   ----------------------------------------------------------------")
    print("   🔗 Backend:  https://github-finder-backend-18267677210.us-central1.run.app")
    print("   🔗 Frontend: https://orenda.vision")
    print("   ----------------------------------------------------------------")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n⚠️ Deployment cancelled by user.")
        sys.exit(130)
