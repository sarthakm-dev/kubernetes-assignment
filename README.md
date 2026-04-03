# Kubernetes Microservices Monitoring Assignment

## What is in this repo

- `api-gateway/` - job submitter service
- `worker/` - worker service with HPA
- `stats-aggregator/` - stats and metrics service
- `k8s/k8s-manifests.yaml` - main Kubernetes manifest
- `grafana-dashboard.json` - dashboard JSON copy for reference

## Overview

The system includes:

- Redis queue
- job-submitter API
- job-worker deployment with HPA
- job-aggregator service
- Prometheus
- Grafana

## Prerequisites

- Minikube
- `kubectl`
- Docker
- `pnpm`

## Minikube Only Setup

Before running `kubectl apply`, always confirm the active context:

```powershell
kubectl config current-context
```

It must print:

```text
minikube
```

If it prints `docker-desktop`, switch first:

```powershell
kubectl config use-context minikube
```

If Docker Desktop Kubernetes is enabled, it can be easy to deploy to the wrong cluster by mistake. If you do not need it, disable it in Docker Desktop `Settings > Kubernetes`.

## Start From Scratch

### 1. Start Minikube

```powershell
minikube start --driver=docker
minikube addons enable ingress
minikube addons enable metrics-server
kubectl config use-context minikube
kubectl config current-context
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Build images

```bash
docker build -f api-gateway/Dockerfile -t job-submitter:latest .
docker build -f worker/Dockerfile -t job-worker:latest .
docker build -f stats-aggregator/Dockerfile -t job-aggregator:latest .
```

Load the images into Minikube:

```bash
minikube image load job-submitter:latest
minikube image load job-worker:latest
minikube image load job-aggregator:latest
```

### 4. Verify metrics-server

```bash
kubectl get apiservices | findstr metrics.k8s.io
kubectl top pods -n kube-system
```

### 5. Deploy the application

```bash
kubectl apply -f k8s/k8s-manifests.yaml
```

### 6. Verify everything

```bash
kubectl get pods -n job-monitoring
kubectl get svc -n job-monitoring
kubectl get hpa -n job-monitoring
kubectl get ingress -n job-monitoring
```

## Open The UIs

Prometheus:

```bash
kubectl port-forward svc/prometheus -n job-monitoring 9090:9090
```

Open `http://localhost:9090`

Grafana:

```bash
kubectl port-forward svc/grafana -n job-monitoring 3000:80
```

Open `http://localhost:3000`

- username: `admin`
- password: `admin`

The dashboard is provisioned automatically.
It includes a real-time worker CPU usage panel based on Prometheus process metrics scraped from each worker pod.

## API Access

The most reliable local API test is port-forwarding:

```bash
kubectl port-forward svc/job-submitter -n job-monitoring 8080:80
```

Then send requests to:

- `POST http://localhost:8080/submit`
- `GET http://localhost:8080/status/:id`

If you want to test through ingress instead:

```bash
kubectl get ingress -n job-monitoring
minikube ip
```

Then use the Minikube IP shown by `minikube ip`:

- `POST http://<MINIKUBE_IP>/submit`
- `GET http://<MINIKUBE_IP>/status/:id`

Notes:

## Stress Test

Use ApacheBench with a JSON request body so the submitter actually enqueues jobs.

```bash
Set-Content -LiteralPath stress-body.json -Value '{"task":"fibonacci","value":40}'
.\ab.exe -n 500 -c 20 -p stress-body.json -T application/json http://localhost:8080/submit
```

Watch autoscaling in another terminal:

```bash
kubectl get hpa -n job-monitoring -w
kubectl get pods -n job-monitoring -l app=job-worker -w
```

Important:

- `job-submitter` only accepts `POST /submit`
- a plain `ab ... /submit` sends `GET` requests and will not queue worker jobs
- use a heavier payload like `{"task":"fibonacci","value":40}` or higher if CPU still does not cross the `70%` HPA target
- watch Grafana during the stress test to see the `Worker CPU Usage (%)` panel move in near real time

## Clean Restart

If you want to delete everything and start again:

```bash
kubectl delete namespace job-monitoring
kubectl apply -f k8s/k8s-manifests.yaml
```

If the cluster itself was recreated, run the full flow again:

1. Build images
2. Enable Minikube addons
3. Apply `k8s/k8s-manifests.yaml`
4. Port-forward Prometheus, Grafana, and the API if needed

## Troubleshooting

If resources appear in Docker Desktop Kubernetes instead of Minikube:

- run `kubectl config current-context`
- switch back with `kubectl config use-context minikube`
- confirm with `kubectl config current-context` again before `kubectl apply`

If HPA does not scale:

- make sure `kubectl top pods -n job-monitoring` returns CPU values
- make sure `kubectl get hpa -n job-monitoring` does not show `<unknown>`
- make sure the stress test is heavy enough to push worker CPU above `70%`

Useful commands:

```bash
kubectl top pods -n job-monitoring
kubectl describe hpa job-worker-hpa -n job-monitoring
kubectl get events -n job-monitoring --sort-by=.lastTimestamp
kubectl logs -n job-monitoring -l app=job-worker --tail=50
```
