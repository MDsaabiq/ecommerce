# E-Commerce Platform — Production GitOps Deployment

A full-stack MERN e-commerce application deployed with a **production-grade DevOps pipeline** — automated CI/CD, code quality gates, GitOps, Kubernetes, zero-downtime rolling updates, and auto-scaling on AWS EC2.

Built to understand what real DevOps engineering looks like beyond just writing a Dockerfile.

---

## Live App

App is deployed on AWS EC2 and served through NGINX Ingress on a Kind Kubernetes cluster:

```
http://<EC2-2-public-ip>             → Frontend (React)
http://<EC2-2-public-ip>/api         → Backend API (Node.js)
http://<EC2-2-public-ip>/api/health  → Health check
```

Jenkins: `http://<EC2-1-public-ip>:8080` &nbsp;|&nbsp; SonarQube: `http://<EC2-1-public-ip>:9000`

---

## Architecture

![Architecture Diagram](https://via.placeholder.com/900x500?text=Add+Architecture+Diagram+Here)

> Replace with your image: `![Architecture Diagram](./assets/architecture.png)` — drag-drop into a GitHub Issue to get a hosted URL

---

## Demo

[![Demo Video](click to watch)](https://github.com/user-attachments/assets/8d28043d-25d9-4301-ad2c-4d3599ee9b92)

> **Zero-Downtime Rolling Update — Live CI/CD Pipeline Demo**  
> Code pushed → Jenkins CI → SonarQube quality gate → Docker build → ArgoCD detects manifest change → Kubernetes rolling update with zero dropped requests

---

## Pipeline Overview

```
Developer
git push ──► GitHub ──► Jenkins (EC2 #1)
                              │
                   ┌──────────▼────────────────────────────────┐
                   │  1. Checkout Code                          │
                   │  2. SonarQube Scan                         │
                   │  3. Quality Gate  ◄── aborts if fails      │
                   │  4. Docker Build                           │
                   │  5. Push → DockerHub  :BUILD_NUMBER        │
                   │  6. Update Manifest   git commit + push    │
                   └──────────┬────────────────────────────────┘
                              │  (Jenkins never touches Kubernetes)
                   ┌──────────▼───────────┐
                   │  ArgoCD (EC2 #2)      │  polls manifest repo every 3 min
                   │  detects new tag      │  kubectl apply → rolling update
                   └──────────┬───────────┘
                              │
              ┌───────────────▼──────────────────────┐
              │         Kind Cluster (K8s)            │
              │                                       │
              │  frontend ×2 pods ──► ×5 pods (HPA)  │
              │  backend  ×2 pods ──► ×5 pods (HPA)  │
              │                                       │
              │  NGINX Ingress                        │
              │    /api/* ──► backend-service:5000    │
              │    /*     ──► frontend-service:80     │
              └───────────────────────────────────────┘
```

**Jenkins never runs kubectl. ArgoCD owns all deployments. Git is the single source of truth.**

---

## What This Demonstrates

| Concept | How It's Implemented |
|---|---|
| **GitOps** | ArgoCD watches the manifest repo — any manual cluster change is auto-reverted within 3 minutes |
| **Zero-downtime deploy** | Kubernetes rolling update — new pods pass `/api/health` readiness probe before old pods stop |
| **Quality gate** | SonarQube scan on every push — pipeline aborts and no image is built if quality drops |
| **Immutable images** | Every image tagged with `BUILD_NUMBER`, never `latest` — every running pod traces to an exact build |
| **Auto-scaling** | HPA scales pods 2→5 when CPU exceeds 50%, scales back down when load drops |
| **Self-healing** | Delete a pod → Kubernetes recreates it. Corrupt a Deployment → ArgoCD reverts it |
| **Separation of concerns** | Source repo and manifest repo are separate — Jenkins writes manifests, ArgoCD deploys them |

---

## Application Features

- User registration and login (JWT authentication)
- Product catalog with category filters and auto-advancing image slider
- Add to cart with live stock validation — can't add more than available stock
- Cart item count badge in navbar, updates in real time across all pages (Redux)
- Quantity `+` / `−` controls in cart with per-item stock limit enforcement
- Order placement and full order history
- Admin dashboard — create, edit, delete products with Cloudinary image upload
- Responsive dark theme (Tailwind CSS, Netflix-inspired)

---

## Tech Stack

### Application

| Layer | Tech |
|---|---|
| Frontend | React 19, Redux Toolkit, React Router v7, Tailwind CSS, Vite |
| Backend | Node.js, Express 5, JWT, Mongoose, Multer, Cloudinary |
| Database | MongoDB Atlas (external — not inside Kubernetes) |

### DevOps

| Tool | Role |
|---|---|
| **Docker** | Multi-stage build for frontend (Nginx serves `/dist` only), single-stage for backend |
| **Jenkins** | CI pipeline — runs on EC2 #1, defined in `Jenkinsfile` in this repo |
| **SonarQube** | Static code analysis + quality gate — blocks deploy if thresholds not met |
| **Kind** | 3-node Kubernetes cluster (1 control-plane + 2 workers) running in Docker on EC2 #2 |
| **ArgoCD** | Watches `ecommerce-k8s-manifests` repo, syncs cluster state to Git state |
| **NGINX Ingress** | Single entry point — routes `/api/*` → backend, `/*` → frontend |
| **Metrics Server + HPA** | CPU-based auto-scaling, min 2 / max 5 replicas per service |
| **AWS EC2** | t3.medium (CI) + t3.large (Kubernetes) |
| **DockerHub** | Image registry — `sksaabiq123/ecommerce-frontend`, `sksaabiq123/ecommerce-backend` |

---

## Infrastructure

```
AWS
├── EC2 #1 — CI Server (t3.medium)          ports: 22, 8080, 9000
│   ├── Jenkins   → :8080  (Docker container)
│   └── SonarQube → :9000  (Docker container)
│
└── EC2 #2 — Kubernetes Server (t3.large)    ports: 22, 80
    └── Kind Cluster "ecommerce"
        ├── ecommerce-control-plane   ← host port 80 mapped here → NGINX Ingress
        ├── ecommerce-worker
        ├── ecommerce-worker2
        └── Pods
            ├── frontend  ×2   (React app, served by Nginx)
            ├── backend   ×2   (Node.js API)
            ├── ingress-nginx-controller   ← pinned to control-plane node
            ├── argocd-server + argocd-application-controller
            └── metrics-server
```

---

## Repositories

| Repo | Purpose |
|---|---|
| [`MDsaabiq/ecommerce`](https://github.com/MDsaabiq/ecommerce) | Source code, Dockerfiles, Jenkinsfile — this repo |
| [`MDsaabiq/ecommerce-k8s-manifests`](https://github.com/MDsaabiq/ecommerce-k8s-manifests) | Kubernetes YAMLs — ArgoCD watches this, Jenkins updates image tags here |

---

## Key Engineering Decisions

**Why two repos?**  
Jenkins (CI server) only writes to the manifest repo — it never has cluster access. ArgoCD (on EC2 #2) polls the manifest repo and applies changes itself. This is the GitOps pattern — the cluster is always in the state Git describes, not in the state a script last ran.

**Why Kind instead of EKS?**  
Real Kubernetes at zero cost. Every concept — Deployments, Services, Ingress, HPA, RBAC, readiness probes — works identically to a cloud-managed cluster.

**Why tag images with BUILD_NUMBER instead of `latest`?**  
Every running pod maps to an exact Jenkins build. Rolling back is a one-line change in Git — change the image tag and push. No rebuild, no guesswork about what `latest` actually is.

**Why multi-stage Docker build for the frontend?**  
Stage 1 (Node 20): `npm run build` produces `/dist`. Stage 2 (Nginx Alpine): copies `/dist` only. Final image has no Node, no source code, no `node_modules` — smaller attack surface and faster pulls.

**Why readiness probes?**  
Kubernetes won't route any traffic to a pod until `GET /api/health` returns HTTP 200. This is what makes rolling updates zero-downtime — the old pod keeps serving until the new one is confirmed healthy. No readiness probe = requests fail during every deploy.

**Why MongoDB external (Atlas)?**  
Stateful workloads don't belong in a learning Kubernetes setup. Atlas handles backups, replication, and scaling — the cluster stays stateless.

---

## CI/CD Pipeline — Jenkinsfile Stages

Every `git push` to `main` triggers the full pipeline automatically:

```
Checkout
    └── SonarQube Analysis
            └── Quality Gate          ← pipeline aborts here if quality fails
                    └── Docker Build & Push  ← tagged with BUILD_NUMBER
                            └── Update Manifests  ← sed image tag, git push to k8s-manifests
```

If the quality gate fails, no Docker image is built and nothing gets deployed.

---

## Kubernetes Manifests

```
ecommerce-k8s-manifests/
├── frontend-deployment.yaml   ← image tag updated by Jenkins on every build
├── backend-deployment.yaml    ← image tag updated by Jenkins on every build
├── frontend-service.yaml
├── backend-service.yaml
├── ingress.yaml               ← NGINX, Prefix pathType, /api → backend, / → frontend
├── backend-configmap.yaml     ← non-sensitive env vars (PORT, CORS_ORIGIN)
├── hpa-frontend.yaml          ← min 2, max 5 replicas, cpu threshold 50%
└── hpa-backend.yaml           ← min 2, max 5 replicas, cpu threshold 50%
```

Secrets (MONGODB_URI, JWT_SECRET, Cloudinary keys) are applied manually with `kubectl create secret` — never committed to Git.

---

## Running Locally

```bash
# Backend
cd backend && npm install
# create .env → MONGODB_URI, JWT_SECRET, PORT=5000
npm run dev

# Frontend
cd frontend && npm install
# create .env → VITE_REACT_BASE_URL=http://localhost:5000/api
npm run dev
```

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register user |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/products` | — | All products |
| GET | `/api/products/:id` | — | Single product |
| POST | `/api/products` | Admin | Create product |
| PUT | `/api/products/:id` | Admin | Update product |
| DELETE | `/api/products/:id` | Admin | Delete product |
| GET | `/api/cart/:userId` | User | Get cart items |
| POST | `/api/cart/add` | User | Add / increment item (stock checked) |
| POST | `/api/cart/remove` | User | Decrement / remove item |
| POST | `/api/cart/order` | User | Place order (deducts stock) |
| GET | `/api/cart/orders/:userId` | User | Order history |
| GET | `/api/health` | — | Kubernetes liveness + readiness probe |

---

## Author

**sk Saabiq** — B.Tech Student  
GitHub: [@MDsaabiq](https://github.com/MDsaabiq)  
Email: saabiqcs@gmail.com
