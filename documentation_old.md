# Production-Grade GitOps Deployment — MERN E-Commerce

## What We Are Building

A real company-style DevOps pipeline around an existing MERN app.
Developer pushes code → Jenkins runs CI → Docker image built and pushed to DockerHub → Jenkins updates a Kubernetes manifest repo → ArgoCD detects the change → deploys to Kind cluster → zero-downtime rolling update.

**GitOps principle:** Git is the single source of truth. Jenkins never touches Kubernetes. ArgoCD owns all deployments.

---

## Application Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Redux Toolkit, React Router v7, Tailwind, Vite |
| Backend | Node.js, Express 5, JWT, Mongoose, Multer, Cloudinary |
| Database | MongoDB Atlas (external — not inside Kubernetes) |

---

## Repository Strategy

| Branch | Purpose |
|--------|---------|
| `main` | DevOps project — all changes, Dockerfiles, Jenkinsfile |
| `render` | Frozen. Render.com deploys from here. Never touched. |

Second repo: `ecommerce-k8s-manifests` — Kubernetes YAMLs only. ArgoCD watches this.

---

## Architecture

```
git push → GitHub → EC2 #1 — CI Server
                        ├── Jenkins
                        ├── SonarQube scan
                        ├── docker build + push → DockerHub
                        └── update image tag → k8s manifest repo
                                                      ↓
                                            EC2 #2 — Kubernetes Server
                                                   ArgoCD (inside Kind)
                                                      ↓
                                             Kind Cluster
                                             ├── Frontend Deployment
                                             ├── Backend Deployment
                                             ├── Services + Ingress
                                             └── HPA + Metrics Server
```

EC2 #1 never connects to EC2 #2. ArgoCD on EC2 #2 pulls from GitHub independently.

---

## Infrastructure

**EC2 #1 — CI Server** (`t3.medium`, 20GB gp3) — ports: 22, 8080, 9000

| Tool | Runs As | Port |
|------|---------|------|
| Jenkins | Docker container | 8080 |
| SonarQube | Docker container | 9000 |

**EC2 #2 — Kubernetes Server** (`t3.large`, 30GB gp3) — ports: 22, 80, 30000–32767

| Tool | Runs As |
|------|---------|
| Kind cluster (3 nodes) | Docker containers |
| ArgoCD | Pod inside Kind |
| NGINX Ingress | Pod inside Kind |
| Metrics Server | Pod inside Kind |

External: MongoDB Atlas, Cloudinary, DockerHub.

---

## Key Design Decisions

- **No EKS/ECS** — Kind gives real Kubernetes at zero cost
- **No Helm** — plain YAML, every resource understood
- **Jenkins never runs kubectl** — updates manifest repo only, never touches EC2 #2
- **Two EC2s** — build spikes on CI don't affect the running cluster
- **MongoDB external** — stateful workloads don't belong in Kubernetes here
- **Images tagged by BUILD_NUMBER** — every image traceable, never use `latest`

---

## Application Code Changes (main branch)

### `backend/index.js`
```js
// 1. CORS origin from env — set via Kubernetes ConfigMap per environment
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', ... }))

// 2. Health check — Kubernetes liveness/readiness probes call this
app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok' }))

// 3. Bind to 0.0.0.0 — containers must accept traffic from outside localhost
app.listen(PORT, '0.0.0.0', () => { ... })
```

### Frontend `.env`
```
VITE_REACT_BASE_URL=/api
```
Vite bakes this at build time. Ingress routes `/api/*` to backend, `/*` to frontend.

---

## Environment Variables

### Kubernetes Secret (sensitive)
| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | JWT signing key |
| `CLOUDINARY_API_KEY` | Cloudinary key |
| `CLOUDINARY_API_SECRET` | Cloudinary secret |

### Kubernetes ConfigMap (non-sensitive)
| Variable | Value |
|----------|-------|
| `PORT` | 5000 |
| `CORS_ORIGIN` | Ingress domain |
| `CLOUDINARY_CLOUD_NAME` | Your cloud name |

---

## Phases

### Phase 1 — EC2 Infrastructure Setup ✅

**Both EC2s — Docker install:**
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin
sudo usermod -aG docker $USER && newgrp docker
docker run hello-world
```

**EC2 #1 — Jenkins:**
```bash
docker volume create jenkins_home
docker run -d --name jenkins --restart unless-stopped \
  -p 8080:8080 -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  jenkins/jenkins:lts-jdk17
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
# Open http://<EC2-1-IP>:8080 → paste password → Install Suggested Plugins
```

**EC2 #1 — SonarQube:**
```bash
sudo sysctl -w vm.max_map_count=262144
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
docker volume create sonarqube_data && docker volume create sonarqube_logs
docker run -d --name sonarqube --restart unless-stopped \
  -p 9000:9000 \
  -v sonarqube_data:/opt/sonarqube/data \
  -v sonarqube_logs:/opt/sonarqube/logs \
  sonarqube:lts-community
# Open http://<EC2-1-IP>:9000 → login admin/admin → change password
```

**EC2 #2 — Pre-Kubernetes app test:**
```bash
git clone https://github.com/MDsaabiq/ecommerce.git && cd ecommerce
nano backend/.env          # fill real values, never committed
docker build -t ecommerce-backend ./backend
docker run -d -p 5000:5000 --name=backend --env-file backend/.env ecommerce-backend
docker build -t ecommerce-frontend ./frontend
docker run -d -p 80:80 --name=frontend ecommerce-frontend
curl http://localhost:5000/api/health   # must return {"status":"ok"}
curl -I http://localhost:80             # must return HTTP 200
```
API calls fail at this stage — expected. Ingress handles `/api` routing in Kubernetes.

---

### Phase 2 — Kind Kubernetes Cluster ✅

**EC2 #2 — Install Kind + kubectl:**
```bash
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.23.0/kind-linux-amd64
chmod +x ./kind && sudo mv ./kind /usr/local/bin/kind

curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl && sudo mv kubectl /usr/local/bin/kubectl
```

**Create cluster config (`kind-config.yaml`):**
```yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
    kubeadmConfigPatches:
      - |
        kind: InitConfiguration
        nodeRegistration:
          kubeletExtraArgs:
            node-labels: "ingress-ready=true"
    extraPortMappings:
      - containerPort: 80
        hostPort: 80
        protocol: TCP
      - containerPort: 443
        hostPort: 443
        protocol: TCP
  - role: worker
  - role: worker
```
- `extraPortMappings` — maps EC2 host port 80 → control-plane container port 80. **Only the control-plane gets this mapping** — worker nodes have no host port binding.
- `node-labels: ingress-ready=true` — the official Kind NGINX deploy manifest has `nodeSelector: ingress-ready: "true"` built in. This label ensures the ingress controller pod schedules on the control-plane (the only node with the port mapping) automatically, with no manual patching needed.

```bash
kind create cluster --name ecommerce --config kind-config.yaml
kubectl get nodes   # all 3 must show Ready
```

---

### Phase 3 — Dockerize the Application ✅

**`frontend/Dockerfile`** — Multi-stage:
- Stage 1: Node 20 Alpine → `vite build` → `/app/dist`
- Stage 2: Nginx Alpine → serves `/dist` only. No Node/source/node_modules in final image.

**`backend/Dockerfile`** — Single stage:
- Node 20 Alpine, `npm install --omit=dev`, non-root `node` user.

**`frontend/nginx.conf`** — `try_files` for React Router. No proxy block — Ingress handles `/api/*`.

**`.dockerignore`** on both — excludes `node_modules`, `.env`, `.git`.

```bash
# Test builds
docker build -t ecommerce-frontend ./frontend
docker build -t ecommerce-backend ./backend
```

---

### Phase 4 — Jenkins CI Pipeline ✅

**Jenkins UI setup:**
1. Manage Jenkins → Plugins → install: `Docker Pipeline`, `SonarQube Scanner`, `Git`
2. Manage Jenkins → Tools → SonarQube Scanner → Add → name: `SonarQube Scanner` → Install automatically
3. Manage Jenkins → System → SonarQube servers → Add:
   - Name: `SonarQube`, URL: `http://<EC2-1-IP>:9000`, Token: select `sonarqube` credential
4. Manage Jenkins → Credentials → Add:
   - `dockerid` — Username/Password (DockerHub)
   - `sonarqube` — Secret text (SonarQube token)
   - `github-token` — Secret text (GitHub PAT with `repo` scope)
5. Fix Docker CLI inside Jenkins:
```bash
docker exec -u root jenkins bash -c "apt-get update && apt-get install -y docker.io"
chmod 666 /var/run/docker.sock
```

**Create pipeline job:**
- New Item → Pipeline → name: `ecommerce-pipeline`
- Pipeline → Pipeline script from SCM → Git
- URL: `https://github.com/MDsaabiq/ecommerce.git`, branch: `*/main`
- Script Path: `deployment/jenkins/Jenkinsfile`
- Build Triggers: GitHub hook trigger for GITScm polling

**GitHub webhook:**
- Repo → Settings → Webhooks → Add: `http://<EC2-1-IP>:8080/github-webhook/`
- Port 8080 must be open to `0.0.0.0/0` in Security Group (GitHub servers are not your IP)

**Troubleshooting encountered:**
- `docker: not found` → install docker.io inside Jenkins container
- `permission denied` on socket → `chmod 666 /var/run/docker.sock`
- `GIT_COMMIT` null → use `BUILD_NUMBER` instead
- Quality gate hangs → add SonarQube webhook back to Jenkins

---

### Phase 5 — SonarQube Integration ✅

**`sonar-project.properties` in repo root:**
```
sonar.projectKey=ecommerce
sonar.projectName=ecommerce
sonar.sources=frontend/src,backend
sonar.exclusions=**/node_modules/**,**/dist/**
sonar.inclusions=**/*.js,**/*.jsx,**/*.mjs
```

**SonarQube webhook (required):**
SonarQube → Administration → Webhooks → Create:
- Name: `jenkins`, URL: `http://<EC2-1-IP>:8080/sonarqube-webhook/`

Without this, `waitForQualityGate` in Jenkins hangs until timeout then fails.

---

### Phase 6 — GitOps Manifest Repository ✅

**Repo:** `ecommerce-k8s-manifests` on GitHub (separate from source repo).

| File | Purpose |
|------|---------|
| `frontend-deployment.yaml` | 2 frontend pods, readiness probe on `/` |
| `frontend-service.yaml` | ClusterIP → frontend pods port 80 |
| `backend-deployment.yaml` | 2 backend pods, liveness + readiness on `/api/health` |
| `backend-service.yaml` | ClusterIP → backend pods port 5000 |
| `backend-configmap.yaml` | PORT, CORS_ORIGIN, CLOUDINARY_CLOUD_NAME |
| `ingress.yaml` | `/api/*` → backend-service, `/*` → frontend-service |

**Secret — never in Git. Apply manually on EC2 #2:**
```bash
kubectl create secret generic backend-secret \
  --from-literal=MONGODB_URI="mongodb+srv://..." \
  --from-literal=JWT_SECRET="your-secret" \
  --from-literal=CLOUDINARY_API_KEY="your-key" \
  --from-literal=CLOUDINARY_API_SECRET="your-secret"
kubectl get secret backend-secret   # verify
```

---

### Phase 7 — ArgoCD Setup ✅

**Install ArgoCD on EC2 #2:**
```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl get pods -n argocd --watch   # wait until all Running
```

**Access ArgoCD UI:**
```bash
# NodePort doesn't work with Kind — use port-forward instead
kubectl port-forward svc/argocd-server -n argocd 8888:80 --address 0.0.0.0 &
# Open port 8888 in EC2 #2 Security Group
# Open http://<EC2-2-IP>:8888
```

**Get initial admin password:**
```bash
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d && echo
```

**Create ArgoCD Application:**
- New App → App name: `ecommerce`
- Project: `default`, Sync policy: `Automatic` + `Self Heal` + `Prune`
- Repo URL: `https://github.com/MDsaabiq/ecommerce-k8s-manifests.git`
- Branch: `main`, Path: `.`
- Cluster: `https://kubernetes.default.svc`, Namespace: `default`

**Apply backend secret manually (never in Git):**
```bash
kubectl create secret generic backend-secret \
  --from-literal=MONGODB_URI="mongodb+srv://..." \
  --from-literal=JWT_SECRET="your-secret" \
  --from-literal=CLOUDINARY_API_KEY="your-key" \
  --from-literal=CLOUDINARY_API_SECRET="your-secret" \
  --from-literal=CLOUDINARY_CLOUD_NAME="your-cloud-name" \
  --from-literal=PORT="5000"
```

**Troubleshooting encountered:**
- `connection refused localhost:8080` → run kubectl as root or with correct user that has kubeconfig
- NodePort not reachable externally with Kind → use `kubectl port-forward` instead
- `ImagePullBackOff` → manifest YAML had `latest` tag, DockerHub only had BUILD_NUMBER tags — update manually for first deploy
- `CRD too long` warning on install → harmless, ignore it

---

### Phase 8 — Complete CI/CD Loop ✅

**Uncomment `Update Manifest Repo` stage in Jenkinsfile** — adds `rm -rf` cleanup before clone to prevent "directory exists" error on re-runs.

Full flow working:
```
git push → webhook → Jenkins
  → SonarQube → quality gate
  → docker build → docker push (BUILD_NUMBER tag)
  → rm -rf manifest dir → clone → sed replace image tag → git commit + push
  → ArgoCD detects new commit (within 3 min) → syncs cluster
  → Kubernetes rolling update → zero downtime
```

---

### Phase 9 — NGINX Ingress ✅

**Install NGINX Ingress Controller:**
```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s
```

**Fix 1 — `ingress.yaml` path rules:**

Use `Prefix` pathType for both paths. Do NOT use `use-regex: true` or `ImplementationSpecific` — regex paths lose priority to the `/` Prefix rule and `/api` never matches.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ecommerce-ingress
  namespace: default
spec:
  ingressClassName: nginx
  rules:
    - http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: backend-service
                port:
                  number: 5000
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-service
                port:
                  number: 80
```

NGINX ingress uses longest-prefix-match — `/api/health` matches both `/api` and `/`, NGINX picks `/api` (longer). No rewrite annotation needed — backend already handles `/api/*` routes.

**Fix 2 — Ingress controller must run on control-plane node:**

Kind only maps host port 80 → `ecommerce-control-plane` container. If the ingress controller pod schedules on a worker node, port 80 is unreachable from the host (connection reset).

Force the pod onto the control-plane:
```bash
# Add label to control-plane node (may already exist)
kubectl label node ecommerce-control-plane ingress-ready=true

# Patch deployment to pin it to control-plane
kubectl patch deployment -n ingress-nginx ingress-nginx-controller \
  --type='json' \
  -p='[{"op":"add","path":"/spec/template/spec/nodeSelector","value":{"ingress-ready":"true","kubernetes.io/hostname":"ecommerce-control-plane"}}]'

# Wait for pod to reschedule
kubectl rollout status deployment -n ingress-nginx ingress-nginx-controller

# Verify pod is on control-plane
kubectl get pod -n ingress-nginx -o wide
# NODE column must show: ecommerce-control-plane

# Verify port 80 is now bound inside the control-plane container
docker exec ecommerce-control-plane ss -tlnp | grep :80
```

**Verify:**
```bash
curl http://localhost/api/health   # {"status":"ok"}
curl -I http://localhost            # HTTP/1.1 200
```

---

### Phase 10 — HPA and Scaling ✅

**Install Metrics Server:**
```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
# Kind requires this flag — Metrics Server needs to skip TLS verification for kubelet
kubectl patch deployment metrics-server -n kube-system \
  --type='json' \
  -p='[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'
kubectl top nodes   # verify metrics are flowing
```

**Apply HPA manifests:**
```bash
kubectl apply -f hpa-frontend.yaml
kubectl apply -f hpa-backend.yaml
kubectl get hpa   # shows min/max/current replicas and CPU%
```

**Load test:**
```bash
# Install hey load tester
go install github.com/rakyll/hey@latest
hey -n 10000 -c 100 http://<EC2-2-IP>/api/products

# Watch scaling in real time
kubectl get hpa --watch
```

---

### Phase 11 — End-to-End Verification ✅

**What was deployed as the real code change:**
- Cart item count badge on Navbar (red bubble showing total units in cart)
- Functional `+`/`-` quantity buttons in Cart page with stock validation
- New `POST /cart/remove` backend endpoint (decrement or remove item)
- Redux cart slice — count syncs across Navbar and Cart page in real time

**Pipeline run:**
```bash
# Code pushed to main
git commit -m "feat: cart item count badge in navbar, working +/- with stock validation"
git push origin main

# Jenkins fired automatically:
# Checkout → SonarQube Scan → Quality Gate → Docker Build & Push → Update Manifest tag

# ArgoCD detected manifest change → rolling update:
kubectl rollout status deployment/frontend
kubectl rollout status deployment/backend
# Zero downtime confirmed — old pods terminated only after new pods passed readiness probe
```

**Verification commands:**
```bash
# Rolling update
kubectl rollout status deployment/frontend
kubectl rollout status deployment/backend

# Self-healing — delete a pod, watch it recreate
kubectl delete pod <any-pod-name>
kubectl get pods   # back within seconds

# GitOps self-healing — corrupt manually, ArgoCD reverts in ~3 min
kubectl set image deployment/frontend frontend=nginx:latest
kubectl get pods --watch   # ArgoCD restores correct image tag

# HPA load test
hey -n 10000 -c 100 http://<EC2-2-IP>/api/products
kubectl get hpa --watch   # pods scale up then back down
```

---

## Interview Questions

**GitOps**
- What is GitOps? How is it different from traditional CI/CD?
- Why does Jenkins not run `kubectl apply`?
- What happens when someone manually edits a Deployment in the cluster?
- Why is the manifest repo separate from the source repo?

**Kubernetes**
- Deployment vs Pod — what's the difference?
- What does a Service do? Why can't you call a Pod directly?
- How does Ingress differ from a LoadBalancer?
- How does a rolling update achieve zero downtime?
- What are liveness vs readiness probes?
- How does HPA decide when to scale? What does Metrics Server do?

**Docker**
- Why multi-stage build for the frontend?
- Why tag with BUILD_NUMBER instead of `latest`?
- Why mount Docker socket into Jenkins?
- Why bind backend to `0.0.0.0`?

**Jenkins / SonarQube**
- What is a quality gate?
- How are secrets handled in a pipeline?
- Why store the Jenkinsfile in the repo?

---

## Interview Q&A — Detailed Answers

### Q: How did you handle the initial authentication configuration between Jenkins and your GitHub manifest repository?

Jenkins needs to push a git commit to the `ecommerce-k8s-manifests` repo on every build (to update the image tag). This requires GitHub authentication from inside the Jenkins container.

**How it's done:**

1. Generate a GitHub Personal Access Token (PAT) with `repo` scope on GitHub → Settings → Developer settings → Personal access tokens
2. In Jenkins → Manage Jenkins → Credentials → Add a **Secret text** credential with ID `github-token`, paste the PAT as the value
3. In the Jenkinsfile, the `Update Manifest Repo` stage uses `withCredentials` to inject the token at runtime:

```groovy
withCredentials([string(credentialsId: 'github-token', variable: 'GH_TOKEN')]) {
    sh '''
        git clone https://${GH_TOKEN}@github.com/MDsaabiq/ecommerce-k8s-manifests.git
        cd ecommerce-k8s-manifests
        sed -i "s|image: sksaabiq123/ecommerce-frontend:.*|image: sksaabiq123/ecommerce-frontend:${IMAGE_TAG}|g" frontend-deployment.yaml
        sed -i "s|image: sksaabiq123/ecommerce-backend:.*|image: sksaabiq123/ecommerce-backend:${IMAGE_TAG}|g" backend-deployment.yaml
        git add frontend-deployment.yaml backend-deployment.yaml
        git commit -m "ci: update image tag to ${IMAGE_TAG}"
        git push origin main
    '''
}
```

The token is embedded in the clone URL (`https://<token>@github.com/...`). Jenkins never stores it in a file or logs it — `withCredentials` masks it from all console output.

**Why not SSH keys?**
A PAT stored as a Jenkins Secret text credential is simpler to set up in this case — no key pair generation, no `~/.ssh/known_hosts` setup inside the container. For a production setup, SSH deploy keys scoped to only the manifest repo would be more secure.

---

### Q: What metrics does the Metrics Server collect to trigger your HPA, and how long does it take to scale back down once traffic drops?

**What Metrics Server collects:**

Metrics Server scrapes the `kubelet` on each node every 15 seconds via the `/metrics/resource` endpoint. It collects:
- **CPU usage** — millicores currently consumed per pod
- **Memory usage** — bytes currently consumed per pod

It exposes these through the Kubernetes `metrics.k8s.io` API. HPA queries this API every 15 seconds (default `--horizontal-pod-autoscaler-sync-period`) to compare current CPU against the target threshold.

In this project the HPA is configured at **50% CPU utilization**:
```yaml
metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 50
```

HPA calculates: `desiredReplicas = ceil(currentReplicas × (currentCPU / targetCPU))`

Example: 2 pods running at 90% CPU average → `ceil(2 × 90/50)` = 4 pods.

**Scale-up:** happens within ~30 seconds of CPU exceeding the threshold (one or two scrape cycles).

**Scale-down:** deliberately slow by design. Kubernetes applies a **5-minute cooldown** (`--horizontal-pod-autoscaler-downscale-stabilization`, default 5 min) before scaling down. This prevents thrashing — rapid scale-up/scale-down cycles if traffic fluctuates. So after traffic drops, pods stay at the higher count for ~5 minutes, then scale back down to `minReplicas: 2`.

**Why Kind needs `--kubelet-insecure-tls`:**
Kind uses self-signed TLS certificates for the kubelet. Metrics Server by default verifies the kubelet's TLS certificate, which fails with Kind's self-signed certs. The `--kubelet-insecure-tls` flag skips this verification — it's a Kind-specific requirement, not needed on EKS/GKE where kubelets have properly signed certs.
