# Session Context — Resume From Here

## Project
Production-Grade GitOps Deployment of a MERN E-Commerce Platform.
Full details in `documentation.md`.

## GitHub Repos
- Source code: `https://github.com/MDsaabiq/ecommerce` (branch: `main`)
- K8s manifests: `https://github.com/MDsaabiq/ecommerce-k8s-manifests`

## DockerHub
- Username: `sksaabiq123`
- Images: `sksaabiq123/ecommerce-frontend`, `sksaabiq123/ecommerce-backend`
- Tagged by Jenkins `BUILD_NUMBER`

## Infrastructure
- EC2 #1 (CI): Jenkins on :8080, SonarQube on :9000
- EC2 #2 (K8s): Kind cluster `ecommerce`, ArgoCD via port-forward on :8888

## Completed Phases
- ✅ Phase 1 — EC2s, Docker, Jenkins, SonarQube
- ✅ Phase 2 — Kind cluster (1 control plane + 2 workers)
- ✅ Phase 3 — Dockerfiles (frontend multi-stage, backend single stage)
- ✅ Phase 4 — Jenkins pipeline (Checkout → SonarQube → Quality Gate → Build → Push → Update Manifests)
- ✅ Phase 5 — SonarQube integration with quality gate
- ✅ Phase 6 — GitOps manifest repo created and pushed
- ✅ Phase 7 — ArgoCD installed, app created, pods Running
- ✅ Phase 8 — Full CI/CD loop working end to end

## Current Status — Phase 9 COMPLETE ✅
NGINX Ingress is working end-to-end.

### What Was Fixed
1. **Ingress rules** — removed `use-regex: true` annotation and `ImplementationSpecific` pathType. Replaced with `Prefix` for both `/api` and `/`.
2. **Ingress controller node** — the controller pod was scheduling on a worker node, but host port 80 is only mapped to `ecommerce-control-plane`. Fixed by patching the deployment with a `nodeSelector` forcing it onto the control-plane node:
```bash
kubectl patch deployment -n ingress-nginx ingress-nginx-controller \
  --type='json' \
  -p='[{"op":"add","path":"/spec/template/spec/nodeSelector","value":{"ingress-ready":"true","kubernetes.io/hostname":"ecommerce-control-plane"}}]'
```

### Final ingress.yaml (in ecommerce-k8s-manifests)
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

## Kubernetes Secret (applied manually, not in Git)
```bash
kubectl create secret generic backend-secret \
  --from-literal=MONGODB_URI="..." \
  --from-literal=JWT_SECRET="..." \
  --from-literal=CLOUDINARY_API_KEY="..." \
  --from-literal=CLOUDINARY_API_SECRET="..." \
  --from-literal=CLOUDINARY_CLOUD_NAME="..." \
  --from-literal=PORT="5000"
```

## Remaining Phases
- ✅ Phase 9 — NGINX Ingress (complete)
- ⬅ Phase 10 — Metrics Server + HPA
- Phase 11 — End-to-end verification

## How to Continue
1. Read `documentation.md` for full context and all commands
2. SSH into EC2 #2
3. Proceed to Phase 10 — Metrics Server + HPA:
```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
kubectl patch deployment metrics-server -n kube-system \
  --type='json' \
  -p='[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'
kubectl top nodes   # verify metrics flowing
kubectl apply -f hpa-frontend.yaml
kubectl apply -f hpa-backend.yaml
kubectl get hpa
```
4. Then proceed to Phase 11 — End-to-end verification
