# Kubernetes Interview Questions and Answers

This guide contains commonly asked Kubernetes interview questions with concise answers and practical commands.

## Fundamentals

### 1. What is Kubernetes?

Kubernetes is an open-source platform for deploying, scaling, networking, and managing containerized applications across a cluster of machines.

### 2. What is a Kubernetes cluster?

A cluster is a group of machines that run Kubernetes. It contains a control plane and one or more worker nodes.

### 3. What is the control plane?

The control plane manages the cluster state and scheduling. Its main components are:

- `kube-apiserver`: exposes the Kubernetes API.
- `etcd`: stores cluster configuration and state.
- `kube-scheduler`: selects nodes for new Pods.
- `kube-controller-manager`: reconciles the desired and actual state.
- `cloud-controller-manager`: integrates with cloud-provider services when used.

### 4. What is a worker node?

A worker node runs application workloads. Common components include the kubelet, a container runtime, and kube-proxy or an equivalent networking implementation.

### 5. What is a Pod?

A Pod is the smallest deployable Kubernetes unit. It contains one or more containers that share networking and storage. Pods are usually managed through higher-level resources rather than created directly.

### 6. What is a Deployment?

A Deployment manages ReplicaSets and Pods for stateless applications. It supports declarative updates, replica management, and rolling updates.

### 7. What is a ReplicaSet?

A ReplicaSet keeps a specified number of matching Pods running. Deployments normally create and manage ReplicaSets.

### 8. What is a Namespace?

A Namespace provides a logical boundary for resources within a cluster. It helps separate teams, applications, or environments and can be used with access controls and quotas.

### 9. What is a label and selector?

A label is metadata attached to an object. A selector finds objects by their labels. Services, Deployments, and ReplicaSets rely on matching labels and selectors to connect related resources.

### 10. What is declarative management?

Declarative management describes the desired state in YAML or through an API. Kubernetes continuously works to make the actual state match that desired state.

## Networking and Storage

### 11. What is a Kubernetes Service?

A Service provides a stable virtual IP and DNS name for a set of Pods. It continues routing traffic even when Pods are recreated.

Common Service types are:

- `ClusterIP`: reachable inside the cluster.
- `NodePort`: exposes a port on each node.
- `LoadBalancer`: requests an external load balancer from the platform.
- `ExternalName`: maps a Service name to an external DNS name.

### 12. What is Ingress?

Ingress defines HTTP or HTTPS routing from outside the cluster to Services. An Ingress controller implements those rules and commonly provides TLS termination.

### 13. What is a ConfigMap?

A ConfigMap stores non-sensitive configuration. Applications can consume it as environment variables or mounted files.

### 14. What is a Secret?

A Secret stores sensitive values such as tokens or passwords. Access should be restricted with RBAC, and encryption at rest should be enabled where supported. Base64 encoding alone is not encryption.

### 15. What is a PersistentVolume?

A PersistentVolume represents storage available to the cluster. A PersistentVolumeClaim requests storage for a workload. A StorageClass can dynamically provision the underlying volume.

### 16. What is the difference between readiness and liveness probes?

- A readiness probe determines whether a Pod should receive traffic.
- A liveness probe determines whether a container should be restarted.
- A startup probe gives a slow-starting container time to initialize before liveness checks begin.

## Scheduling and Security

### 17. What are requests and limits?

Requests are used for scheduling and represent the resources a container is expected to need. Limits cap resource usage. CPU limits may cause throttling, while memory limits can result in an out-of-memory kill.

### 18. What are taints and tolerations?

A taint keeps Pods away from a node unless the Pod has a matching toleration. Taints are applied to nodes; tolerations are defined on Pods.

### 19. What are node selectors and node affinity?

A node selector is a simple label-based node constraint. Node affinity provides more expressive required or preferred scheduling rules.

### 20. What is RBAC?

Role-Based Access Control grants permissions to users, groups, or service accounts. A `Role` is namespace-scoped, while a `ClusterRole` can apply across the cluster.

### 21. What is a ServiceAccount?

A ServiceAccount is an identity used by Pods to access the Kubernetes API or other integrated systems. It should receive only the permissions required by the workload.

### 22. What is a rolling update?

A rolling update gradually replaces old Pods with new Pods while maintaining application availability according to the Deployment strategy and availability settings.

### 23. What is a DaemonSet?

A DaemonSet ensures that a Pod runs on selected nodes, commonly for logging, monitoring, or node-level agents.

### 24. What is a StatefulSet?

A StatefulSet manages workloads that need stable network identities, ordered operations, or persistent storage, such as databases.

### 25. What is a Job or CronJob?

A Job runs a task until it completes successfully. A CronJob creates Jobs on a schedule.

## Helm

### 26. What is Helm?

Helm is a package manager for Kubernetes. A Helm chart contains templates, default values, and metadata used to generate Kubernetes manifests.

### 27. What are `Chart.yaml` and `values.yaml`?

- `Chart.yaml` contains chart metadata such as the chart name and version.
- `values.yaml` contains default configuration values used by templates.

Environment-specific values can override the defaults:

```bash
helm upgrade --install my-release ./my-chart \
  -f values-test.yaml \
  -n my-namespace \
  --create-namespace
```

### 28. What does `helm upgrade --install` do?

It upgrades an existing release or installs it when the release does not exist.

### 29. What does `--atomic` do in Helm?

It waits for the operation to complete and rolls back the release if the upgrade fails.

### 30. How do you validate a Helm chart before deployment?

```bash
helm lint ./my-chart
helm template my-release ./my-chart -f values-test.yaml
helm diff upgrade my-release ./my-chart -f values-test.yaml
```

The diff command requires the Helm diff plugin.

### 31. How do Helm templates receive values?

A template reads values through expressions such as:

```yaml
image: {{ .Values.image.repository }}:{{ .Values.image.tag }}
```

The value can come from the chart's `values.yaml`, a supplied values file, or a `--set` argument. More specific inputs override less specific ones.

## Troubleshooting

### 32. How do you investigate a Pod that is not starting?

```bash
kubectl get pods -n <namespace>
kubectl describe pod <pod-name> -n <namespace>
kubectl logs <pod-name> -n <namespace>
kubectl logs <pod-name> -c <container-name> -n <namespace>
```

Check events, image-pull errors, probe failures, resource limits, configuration, and scheduling constraints.

### 33. What causes `CrashLoopBackOff`?

The container starts and repeatedly exits. Common causes include application errors, invalid configuration, missing dependencies, failed probes, or insufficient resources. Inspect logs and the Pod events first.

### 34. What causes `ImagePullBackOff`?

Typical causes are an incorrect image name or tag, a missing image, registry authentication problems, network access issues, or insufficient permissions for the node or service account.

### 35. How do you check why a Deployment is unavailable?

```bash
kubectl get deployment <deployment-name> -n <namespace>
kubectl describe deployment <deployment-name> -n <namespace>
kubectl get replicasets -n <namespace>
kubectl get events -n <namespace> --sort-by=.lastTimestamp
```

### 36. How do you check whether a Service routes traffic correctly?

```bash
kubectl get service <service-name> -n <namespace>
kubectl get endpoints <service-name> -n <namespace>
kubectl get pods --show-labels -n <namespace>
```

The Service selector must match the labels on ready Pods. If there are no endpoints, inspect selectors and readiness probes.

### 37. How do you roll back a failed Deployment?

For a Deployment:

```bash
kubectl rollout history deployment/<deployment-name> -n <namespace>
kubectl rollout undo deployment/<deployment-name> -n <namespace>
```

For a Helm release:

```bash
helm history <release-name> -n <namespace>
helm rollback <release-name> <revision> -n <namespace>
```

### 38. How do you inspect the rendered Kubernetes YAML?

```bash
helm template <release-name> ./my-chart -f values-test.yaml
```

This is useful for finding missing values, invalid selectors, incorrect ports, and malformed templates before contacting the cluster.

### 39. How do you view cluster events?

```bash
kubectl get events -A --sort-by=.lastTimestamp
```

Events often reveal scheduling failures, image-pull errors, probe failures, and volume-mount problems.

### 40. What is the difference between `kubectl apply` and `kubectl replace`?

`kubectl apply` reconciles the resource definition with the existing object and is commonly used for declarative management. `kubectl replace` replaces the existing object and can fail if the object has changed since it was read.

## CI/CD and Helm Deployment Flow

A generic container deployment pipeline typically works like this:

```text
Source repository
      |
      v
Build pipeline
      |
      +-- Build the application container image
      +-- Run unit and end-to-end tests
      +-- Push the image to a container registry
      +-- Set the image repository and tag in Helm values
      +-- Update the chart version
      +-- Package the Helm chart
      +-- Push the chart to an OCI registry
      +-- Create deployment metadata with the chart name and version
              |
              v
Deployment pipeline
      |
      +-- Read the chart name, registry, and exact version
      +-- Authenticate to the Kubernetes cluster
      +-- Pull the exact chart version
      +-- Select environment-specific values
      +-- Run helm upgrade --install --atomic
              |
              v
Kubernetes cluster
      |
      +-- Helm renders the templates
      +-- Deployment creates or updates Pods
      +-- Service routes traffic to ready Pods
      +-- Ingress routes external HTTP or HTTPS traffic
      +-- ConfigMap provides non-sensitive runtime configuration
```

### Example image reference

The Deployment template combines two Helm values:

```yaml
image: {{ .Values.image.repository }}:{{ .Values.image.tag }}
```

After rendering, Kubernetes receives a concrete image reference similar to:

```text
<registry>/<application>:<release-tag>
```

The registry, application name, and tag should come from the build output or deployment configuration. Do not hard-code credentials or sensitive environment values in the chart.

### Example deployment command

```bash
helm upgrade --install <release-name> <chart-package>.tgz \
  -f <environment-values-file>.yaml \
  --create-namespace \
  --atomic \
  -n <namespace>
```

The build pipeline creates and publishes artifacts. The deployment pipeline selects the exact version and applies it to Kubernetes. Helm connects the container image, configuration, Deployment, Service, and Ingress into one release.
