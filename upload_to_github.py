import os
import base64
import urllib.request
import json

TOKEN = "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"
REPO_NAME = "pixellab"
USER = "pixelaboficial"
URL_BASE = "https://api.github.com"
HEADERS = {
    "Authorization": f"token {TOKEN}",
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "PixelLab-Deployer"
}

def api_call(endpoint, data=None, method=None):
    url = f"{URL_BASE}{endpoint}"
    req_data = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=req_data, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        print(f"HTTPError on {url}: {e.code} {e.read().decode()}")
        return None
    except Exception as e:
        print(f"Error on {url}: {e}")
        return None

print(f"Creating repository {REPO_NAME}...")
api_call("/user/repos", data={"name": REPO_NAME, "private": False, "auto_init": False}, method="POST")

print("Uploading files...")
tree = []
for root, dirs, files in os.walk("."):
    if ".git" in root or "__pycache__" in root or "venv" in root or ".gemini" in root: continue
    for f in files:
        if f in ["remove_bg.py", "upload_to_github.py", "desktop.ini"] or f.endswith(".zip"): continue
        path = os.path.join(root, f)
        git_path = path.replace("\\", "/").replace("./", "", 1)
        
        with open(path, "rb") as file:
            content = file.read()
            
        print(f"Uploading blob: {git_path} ({len(content)} bytes)")
        blob_res = api_call(f"/repos/{USER}/{REPO_NAME}/git/blobs", data={
            "content": base64.b64encode(content).decode("utf-8"),
            "encoding": "base64"
        }, method="POST")
        
        if blob_res and "sha" in blob_res:
            tree.append({
                "path": git_path,
                "mode": "100644",
                "type": "blob",
                "sha": blob_res["sha"]
            })
        else:
            print(f"Failed to upload {git_path}")

print("Creating tree...")
tree_res = api_call(f"/repos/{USER}/{REPO_NAME}/git/trees", data={"tree": tree}, method="POST")
if not tree_res:
    print("Tree creation failed.")
    exit(1)
tree_sha = tree_res["sha"]

print("Creating commit...")
commit_res = api_call(f"/repos/{USER}/{REPO_NAME}/git/commits", data={
    "message": "Deploying Pixel Lab Website",
    "tree": tree_sha
}, method="POST")
if not commit_res:
    print("Commit creation failed.")
    exit(1)
commit_sha = commit_res["sha"]

print("Updating reference refs/heads/main...")
ref_res = api_call(f"/repos/{USER}/{REPO_NAME}/git/refs", data={
    "ref": "refs/heads/main",
    "sha": commit_sha
}, method="POST")

if not ref_res:
    # If the ref already exists (maybe repo was initialized), PATCH it
    print("Trying to update existing reference...")
    ref_res = api_call(f"/repos/{USER}/{REPO_NAME}/git/refs/heads/main", data={
        "sha": commit_sha,
        "force": True
    }, method="PATCH")

if ref_res:
    print(f"Successfully pushed code to https://github.com/{USER}/{REPO_NAME}")
else:
    print("Failed to update branch reference.")
