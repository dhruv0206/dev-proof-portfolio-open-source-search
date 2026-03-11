import subprocess
import sys
import os
import platform

# ---- Configuration ----
SERVICE_NAME = "devproof-api"
REGION = "us-central1"

def run_command(command, cwd=None):
    """Run a shell command and exit if it fails."""
    try:
        print(f"   $ {command}")
        subprocess.run(command, cwd=cwd, shell=True, check=True)
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Error executing command: {command}")
        print(f"   Exit code: {e.returncode}")
        sys.exit(e.returncode)
    except FileNotFoundError:
        print(f"\n❌ Command not found: {command.split()[0]}")
        sys.exit(1)

def get_gcp_project_id():
    """Get the current GCP project ID from gcloud config."""
    try:
        result = subprocess.check_output(
            "gcloud config get-value project", shell=True
        ).decode("utf-8").strip()
        if not result or result == "(unset)":
            print("❌ No GCP project set. Run: gcloud config set project <PROJECT_ID>")
            sys.exit(1)
        return result
    except Exception as e:
        print(f"❌ Could not get GCP project ID: {e}")
        sys.exit(1)

def main():
    print("🚀 Starting Full Stack Deployment...\n")

    project_id = get_gcp_project_id()
    print(f"   GCP Project: {project_id}\n")

    # ---------------------------------------------------------
    # 1. Backend Deployment (Google Cloud Run)
    # ---------------------------------------------------------
    print("📦 [Backend] Starting deployment to Google Cloud Run...")

    if not os.path.exists("ai-engine/ai-engine-cloudbuild.yaml"):
        print("❌ Error: ai-engine/ai-engine-cloudbuild.yaml not found!")
        sys.exit(1)

    # 1. Fetch GitHub token from Secret Manager for private repo access during build
    print("   • Fetching GITHUB_TOKEN from Secret Manager...")
    try:
        token_cmd = 'gcloud secrets versions access latest --secret="GITHUB_TOKEN"'
        token = subprocess.check_output(token_cmd, shell=True).decode("utf-8").strip()
    except Exception as e:
        print("⚠️ Warning: Could not fetch GITHUB_TOKEN from GCP Secrets.")
        print(f"   Reason: {e}")
        print("   Build WILL FAIL if private repo access is needed. Proceeding...")
        token = ""

    # 2. Build container image via Cloud Build
    print("   • Submitting build to Cloud Build...")
    build_cmd = f'gcloud builds submit --config ai-engine/ai-engine-cloudbuild.yaml --substitutions=_GITHUB_TOKEN="{token}" .'
    print(f"   $ {build_cmd.replace(token, '*****')}")
    subprocess.run(build_cmd, shell=True, check=True)

    # 3. Deploy to Cloud Run with secrets
    print(f"   • Deploying to Cloud Run service '{SERVICE_NAME}'...")
    run_command(
        f"gcloud run deploy {SERVICE_NAME} "
        f"--image gcr.io/{project_id}/backend "
        f"--platform managed "
        f"--region {REGION} "
        f"--allow-unauthenticated "
        f'--set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest,'
        f'PINECONE_API_KEY=PINECONE_API_KEY:latest,'
        f'DATABASE_URL=DATABASE_URL:latest,'
        f'GITHUB_TOKEN=GITHUB_TOKEN:latest" '
        f'--set-env-vars="PINECONE_INDEX_NAME=github-opensource-search"'
    )

    # Get the deployed URL
    try:
        url = subprocess.check_output(
            f"gcloud run services describe {SERVICE_NAME} --region {REGION} --format='value(status.url)'",
            shell=True
        ).decode("utf-8").strip()
    except Exception:
        url = f"https://{SERVICE_NAME}-xxxxx-uc.a.run.app"

    # ---------------------------------------------------------
    # 2. Frontend Deployment (Vercel)
    # ---------------------------------------------------------
    print("\n🎨 [Frontend] Starting deployment to Vercel...")

    if not os.path.isdir("web-platform"):
        print("❌ Error: 'web-platform' directory not found!")
        sys.exit(1)

    run_command("vercel --prod", cwd="web-platform")

    # ---------------------------------------------------------
    # Summary
    # ---------------------------------------------------------
    print("\n✅ DEPLOYMENT SUCCESSFUL!")
    print("   ----------------------------------------------------------------")
    print(f"   🔗 Backend:  {url}")
    print(f"   🔗 Frontend: https://dev-proof-portfolio.vercel.app")
    print("   ----------------------------------------------------------------")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n⚠️ Deployment cancelled by user.")
        sys.exit(130)
