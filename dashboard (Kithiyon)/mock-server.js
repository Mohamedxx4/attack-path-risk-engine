/**
 * mock-server.js — Local mock API server for Attack Path Risk Engine
 *
 * Serves realistic mock data on the same endpoints the frontend expects.
 * No extra npm packages required — uses Node's built-in `http` module.
 *
 * Run:  node mock-server.js
 * Then: npm run dev   (in another terminal)
 *
 * The Vite proxy forwards /api/* → http://localhost:8000
 */

import http from 'http';

const PORT = 8000;

// ─────────────────────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────────────────────

const STATS = {
  totalPaths: 17,
  highCount: 4,
  mediumCount: 7,
  lowCount: 6,
};

const ATTACK_PATHS = [
  {
    id: 'ap-001',
    riskScore: 68.9,
    severity: 'HIGH',
    title: 'Public Web Server → Admin Role → Production S3 Bucket',
    hops: 2,
    techniques: ['AssumeRole', 'no MFA on path'],
    impact: 9,
    nodes: [
      { id: 'n1', label: 'Internet',            type: 'entry'     },
      { id: 'n2', label: 'Public EC2',           type: 'resource'  },
      { id: 'n3', label: 'Admin IAM Role',       type: 'identity'  },
      { id: 'n4', label: 'Production S3 Bucket', type: 'sensitive' },
    ],
  },
  {
    id: 'ap-002',
    riskScore: 61.2,
    severity: 'HIGH',
    title: 'Exposed EC2 → Instance Role → Secrets Manager',
    hops: 2,
    techniques: ['AssumeRole'],
    impact: 10,
    nodes: [
      { id: 'n1', label: 'Internet',         type: 'entry'     },
      { id: 'n2', label: 'Exposed EC2',      type: 'resource'  },
      { id: 'n3', label: 'Instance IAM Role',type: 'identity'  },
      { id: 'n4', label: 'Secrets Manager',  type: 'sensitive' },
    ],
  },
  {
    id: 'ap-003',
    riskScore: 55.7,
    severity: 'HIGH',
    title: 'Lambda Function → Cross-Account Role → RDS Database',
    hops: 3,
    techniques: ['CrossAccountAssumeRole', 'PrivilegeEscalation'],
    impact: 8,
    nodes: [
      { id: 'n1', label: 'Internet',             type: 'entry'     },
      { id: 'n2', label: 'Lambda Function',       type: 'resource'  },
      { id: 'n3', label: 'Cross-Account IAM Role',type: 'identity'  },
      { id: 'n4', label: 'Prod RDS Instance',     type: 'sensitive' },
    ],
  },
  {
    id: 'ap-004',
    riskScore: 49.3,
    severity: 'HIGH',
    title: 'Misconfigured S3 → Lambda Trigger → Admin Escalation',
    hops: 3,
    techniques: ['PublicBucketRead', 'CodeInjection', 'PrivilegeEscalation'],
    impact: 10,
    nodes: [
      { id: 'n1', label: 'Internet',          type: 'entry'     },
      { id: 'n2', label: 'Public S3 Bucket',  type: 'resource'  },
      { id: 'n3', label: 'Lambda Trigger',    type: 'resource'  },
      { id: 'n4', label: 'Admin IAM User',    type: 'identity'  },
      { id: 'n5', label: 'All AWS Resources', type: 'sensitive' },
    ],
  },
  {
    id: 'ap-005',
    riskScore: 38.5,
    severity: 'MEDIUM',
    title: 'Public Web Server → Administrative Role',
    hops: 2,
    techniques: ['PolicyAttachment', 'MFA enforced'],
    impact: 8,
    nodes: [
      { id: 'n1', label: 'Internet',            type: 'entry'    },
      { id: 'n2', label: 'Public Web Server',   type: 'resource' },
      { id: 'n3', label: 'Administrative Role', type: 'identity' },
    ],
  },
  {
    id: 'ap-006',
    riskScore: 33.1,
    severity: 'MEDIUM',
    title: 'ECS Task → Container Escape → EC2 Metadata Service',
    hops: 3,
    techniques: ['ContainerEscape', 'IMDSv1Exploit'],
    impact: 7,
    nodes: [
      { id: 'n1', label: 'Internet',          type: 'entry'     },
      { id: 'n2', label: 'ECS Task',          type: 'resource'  },
      { id: 'n3', label: 'EC2 Host',          type: 'resource'  },
      { id: 'n4', label: 'Instance Role Creds', type: 'sensitive'},
    ],
  },
  {
    id: 'ap-007',
    riskScore: 27.4,
    severity: 'MEDIUM',
    title: 'Overprivileged Dev Role → CloudTrail Disable → Stealth Access',
    hops: 2,
    techniques: ['CloudTrailDisable', 'OverprivilegedRole'],
    impact: 6,
    nodes: [
      { id: 'n1', label: 'Internal Network',  type: 'entry'     },
      { id: 'n2', label: 'Dev IAM Role',      type: 'identity'  },
      { id: 'n3', label: 'CloudTrail Logs',   type: 'sensitive' },
    ],
  },
  {
    id: 'ap-008',
    riskScore: 23.8,
    severity: 'MEDIUM',
    title: 'Exposed Kubernetes API → Pod Escape → Node Takeover',
    hops: 3,
    techniques: ['K8sAnonymousAccess', 'PodEscape'],
    impact: 7,
    nodes: [
      { id: 'n1', label: 'Internet',           type: 'entry'     },
      { id: 'n2', label: 'K8s API Server',     type: 'resource'  },
      { id: 'n3', label: 'Privileged Pod',     type: 'resource'  },
      { id: 'n4', label: 'Worker Node',        type: 'sensitive' },
    ],
  },
  {
    id: 'ap-009',
    riskScore: 18.2,
    severity: 'MEDIUM',
    title: 'SSM Parameter Store → Plaintext Secrets → Database',
    hops: 2,
    techniques: ['PlaintextSecrets', 'NoEncryption'],
    impact: 5,
    nodes: [
      { id: 'n1', label: 'Internal Network',   type: 'entry'     },
      { id: 'n2', label: 'SSM Parameter Store',type: 'resource'  },
      { id: 'n3', label: 'Production Database',type: 'sensitive' },
    ],
  },
  {
    id: 'ap-010',
    riskScore: 14.9,
    severity: 'MEDIUM',
    title: 'CodePipeline → Malicious Artifact → Deploy to Prod',
    hops: 3,
    techniques: ['SupplyChainAttack', 'ArtifactTampering'],
    impact: 6,
    nodes: [
      { id: 'n1', label: 'Developer Machine', type: 'entry'     },
      { id: 'n2', label: 'CodePipeline',      type: 'resource'  },
      { id: 'n3', label: 'Artifact Store',    type: 'resource'  },
      { id: 'n4', label: 'Production ECS',    type: 'sensitive' },
    ],
  },
  {
    id: 'ap-011',
    riskScore: 11.7,
    severity: 'MEDIUM',
    title: 'IAM Access Key Leak → STS Session → S3 Read',
    hops: 2,
    techniques: ['CredentialLeak', 'STSGetSession'],
    impact: 4,
    nodes: [
      { id: 'n1', label: 'Internet',         type: 'entry'     },
      { id: 'n2', label: 'Leaked IAM Key',   type: 'identity'  },
      { id: 'n3', label: 'Backup S3 Bucket', type: 'sensitive' },
    ],
  },
  {
    id: 'ap-012',
    riskScore: 9.4,
    severity: 'LOW',
    title: 'Dev Instance → Build Role → Internal Dev Bucket',
    hops: 3,
    techniques: ['NetworkReachability'],
    impact: 3,
    nodes: [
      { id: 'n1', label: 'Internal Network', type: 'entry'     },
      { id: 'n2', label: 'Dev Instance',     type: 'resource'  },
      { id: 'n3', label: 'Build IAM Role',   type: 'identity'  },
      { id: 'n4', label: 'Dev S3 Bucket',    type: 'sensitive' },
    ],
  },
  {
    id: 'ap-013',
    riskScore: 8.1,
    severity: 'LOW',
    title: 'Stale IAM User → Read-Only S3 Access',
    hops: 1,
    techniques: ['StaleCredentials'],
    impact: 2,
    nodes: [
      { id: 'n1', label: 'Internal Network',   type: 'entry'     },
      { id: 'n2', label: 'Stale IAM User',     type: 'identity'  },
      { id: 'n3', label: 'Archive S3 Bucket',  type: 'sensitive' },
    ],
  },
  {
    id: 'ap-014',
    riskScore: 6.9,
    severity: 'LOW',
    title: 'CloudWatch Logs → Log Group Misconfiguration → Info Leak',
    hops: 2,
    techniques: ['MisconfiguredLogGroup'],
    impact: 2,
    nodes: [
      { id: 'n1', label: 'Internal Network', type: 'entry'     },
      { id: 'n2', label: 'CloudWatch Logs',  type: 'resource'  },
      { id: 'n3', label: 'App Config Data',  type: 'sensitive' },
    ],
  },
  {
    id: 'ap-015',
    riskScore: 5.3,
    severity: 'LOW',
    title: 'SNS Topic → Public Subscription → Internal Event Leak',
    hops: 1,
    techniques: ['PublicSNSTopic'],
    impact: 2,
    nodes: [
      { id: 'n1', label: 'Internet',     type: 'entry'     },
      { id: 'n2', label: 'SNS Topic',    type: 'resource'  },
      { id: 'n3', label: 'App Events',   type: 'sensitive' },
    ],
  },
  {
    id: 'ap-016',
    riskScore: 4.7,
    severity: 'LOW',
    title: 'ElasticSearch → No Auth → Index Read',
    hops: 1,
    techniques: ['NoAuthentication'],
    impact: 3,
    nodes: [
      { id: 'n1', label: 'Internal Network',     type: 'entry'     },
      { id: 'n2', label: 'ElasticSearch Cluster',type: 'resource'  },
      { id: 'n3', label: 'Log Indices',          type: 'sensitive' },
    ],
  },
  {
    id: 'ap-017',
    riskScore: 2.8,
    severity: 'LOW',
    title: 'Route53 → Dangling DNS → Subdomain Takeover',
    hops: 1,
    techniques: ['DanglingDNS'],
    impact: 1,
    nodes: [
      { id: 'n1', label: 'Internet',        type: 'entry'    },
      { id: 'n2', label: 'Route53 Record',  type: 'resource' },
      { id: 'n3', label: 'Orphaned Domain', type: 'resource' },
    ],
  },
];

const RECOMMENDATIONS = {
  'ap-001': {
    severity: 'HIGH',
    title: 'Remove Wildcard IAM Policy',
    description:
      'The instance role attached to the public EC2 has a wildcard policy granting s3:* on all resources. Remove it or require MFA on the AssumeRole transition — this single change breaks three of the four high-risk paths.',
    affectedResource: 'Instance Role (arn:aws:iam::123456789:role/PublicEC2Role)',
    action: 'Apply least-privilege permissions and enforce MFA for cross-account role assumptions.',
  },
  'ap-002': {
    severity: 'HIGH',
    title: 'Restrict EC2 Network Access & IAM Role',
    description:
      'The exposed EC2 instance has an instance role that allows direct access to Secrets Manager with no resource-level restriction. Restrict network access via Security Groups and scope the role policy.',
    affectedResource: 'EC2 Instance (i-0a1b2c3d4e5f)',
    action: 'Restrict the Security Group to private subnets only. Update the IAM role to allow secretsmanager:GetSecretValue only on specific secret ARNs.',
  },
  'ap-003': {
    severity: 'HIGH',
    title: 'Disable Cross-Account Role Trust Without MFA',
    description:
      'The Lambda function can assume a cross-account role that has broad RDS access. The trust policy does not require MFA. An attacker who compromises the Lambda execution role can pivot to the production database.',
    affectedResource: 'CrossAccount IAM Role (arn:aws:iam::987654321:role/ProdRDSAccess)',
    action: 'Add aws:MultiFactorAuthPresent condition to the trust policy. Use VPC endpoints and restrict Lambda egress.',
  },
  'ap-004': {
    severity: 'HIGH',
    title: 'Block Public S3 Access & Remove Lambda Trigger',
    description:
      'The publicly readable S3 bucket triggers a Lambda that runs with an admin-level execution role. An attacker can upload a malicious object to trigger arbitrary code execution with admin privileges.',
    affectedResource: 'S3 Bucket (arn:aws:s3:::public-uploads-prod)',
    action: 'Enable Block Public Access on the bucket. Scope the Lambda execution role to the minimum permissions required. Validate all uploaded objects before processing.',
  },
  'ap-005': {
    severity: 'MEDIUM',
    title: 'Tighten Administrative Role Permissions',
    description:
      'The administrative role has overly broad policy attachments reachable from the public web server. While MFA is enforced, the blast radius if compromised is high.',
    affectedResource: 'Administrative Role (arn:aws:iam::123456789:role/AdminRole)',
    action: 'Review and remove unnecessary permissions from the administrative role following least-privilege. Consider splitting into purpose-specific roles.',
  },
  'ap-006': {
    severity: 'MEDIUM',
    title: 'Enable IMDSv2 & Harden ECS Task Definitions',
    description:
      'The ECS task uses IMDSv1, which allows any process inside the container (including escaped containers) to retrieve instance credentials without requiring a session token.',
    affectedResource: 'ECS Task Definition (attack-path-engine-task)',
    action: 'Set HttpTokens=required (IMDSv2) on all EC2 instances running ECS. Add seccomp and AppArmor profiles to prevent container escape techniques.',
  },
  'ap-007': {
    severity: 'MEDIUM',
    title: 'Restrict Dev Role & Enable CloudTrail MFA Delete',
    description:
      'The developer IAM role has cloudtrail:StopLogging and cloudtrail:DeleteTrail permissions, allowing an attacker to cover their tracks after gaining access.',
    affectedResource: 'Dev IAM Role (arn:aws:iam::123456789:role/DevRole)',
    action: 'Remove cloudtrail:StopLogging and cloudtrail:DeleteTrail from the dev role. Enable CloudTrail log file validation and MFA delete on the logging S3 bucket.',
  },
  'ap-008': {
    severity: 'MEDIUM',
    title: 'Disable Anonymous Kubernetes API Access',
    description:
      'The Kubernetes API server is accessible from the internet and allows anonymous (unauthenticated) access. Privileged pods can then be used to escape to the underlying node.',
    affectedResource: 'EKS Cluster (prod-cluster)',
    action: 'Set --anonymous-auth=false. Restrict API server access to private subnets. Enforce Pod Security Standards (restricted profile) to prevent privileged pod creation.',
  },
  'ap-009': {
    severity: 'MEDIUM',
    title: 'Encrypt SSM Parameters & Rotate Credentials',
    description:
      'Database credentials are stored as plaintext String parameters in SSM Parameter Store. Any principal with ssm:GetParameter access can retrieve them.',
    affectedResource: 'SSM Parameters (/prod/db/*)',
    action: 'Migrate all secrets to SecureString parameters encrypted with a KMS CMK. Rotate database passwords and update the application to use IAM authentication where supported.',
  },
  'ap-010': {
    severity: 'MEDIUM',
    title: 'Enable Artifact Signing & CodePipeline IAM Restrictions',
    description:
      'The CI/CD pipeline does not validate artifact integrity between stages. A compromised artifact store could allow injection of malicious code into production deployments.',
    affectedResource: 'CodePipeline (prod-deploy-pipeline)',
    action: 'Enable artifact signing using AWS Signer. Restrict IAM permissions so developers cannot modify production pipeline stages directly.',
  },
  'ap-011': {
    severity: 'MEDIUM',
    title: 'Rotate Leaked IAM Access Key',
    description:
      'An IAM access key has been detected in a public repository. The key has S3 read access to backup buckets that may contain sensitive application data.',
    affectedResource: 'IAM User (svc-backup-reader)',
    action: 'Immediately deactivate and delete the exposed access key. Rotate all credentials for the IAM user. Audit S3 access logs for unauthorized reads. Migrate to IAM Roles where possible.',
  },
  'ap-012': {
    severity: 'LOW',
    title: 'Monitor Dev Build Role Access Patterns',
    description:
      'The build role has network reachability to the dev bucket from dev instances. While low risk, ensure permissions follow least-privilege and access is monitored.',
    affectedResource: 'Build IAM Role (arn:aws:iam::123456789:role/BuildRole)',
    action: 'Ensure the build role only has permissions necessary for CI/CD operations. Set up CloudWatch alarms for anomalous S3 access patterns.',
  },
  'ap-013': {
    severity: 'LOW',
    title: 'Deactivate Stale IAM User',
    description:
      'An IAM user that has not been used in 90+ days still has active credentials and S3 read access. Stale credentials are a common initial access vector.',
    affectedResource: 'IAM User (old-dev-user)',
    action: 'Deactivate or delete the IAM user. Implement an automated process to detect and disable credentials unused for 60+ days using AWS Config or IAM Access Analyzer.',
  },
  'ap-014': {
    severity: 'LOW',
    title: 'Restrict CloudWatch Log Group Access',
    description:
      'The CloudWatch log group is accessible to overly broad IAM principals. Application logs may contain sensitive configuration data that could aid an attacker.',
    affectedResource: 'CloudWatch Log Group (/prod/app/api)',
    action: 'Apply resource-based policies to the log group to restrict access to only the services that need it. Review log content and redact sensitive fields at the application level.',
  },
  'ap-015': {
    severity: 'LOW',
    title: 'Remove Public SNS Subscriptions',
    description:
      'An SNS topic has an access policy that allows any AWS account to subscribe. Internal application events could be leaked to external subscribers.',
    affectedResource: 'SNS Topic (arn:aws:sns:us-east-1:123456789:app-events)',
    action: 'Update the SNS access policy to restrict subscriptions to specific AWS account IDs. Audit existing subscriptions and remove any unrecognized endpoints.',
  },
  'ap-016': {
    severity: 'LOW',
    title: 'Enable ElasticSearch Authentication',
    description:
      'The ElasticSearch cluster does not require authentication and is accessible from the internal network. Any internal system can read all indices.',
    affectedResource: 'ElasticSearch Domain (internal-logs)',
    action: 'Enable fine-grained access control on the ElasticSearch domain. Require authentication via IAM or internal user database. Restrict access to specific VPC subnets.',
  },
  'ap-017': {
    severity: 'LOW',
    title: 'Remove Dangling DNS Records',
    description:
      'A Route53 CNAME record points to a resource that no longer exists. An attacker could claim the orphaned resource (e.g., S3 bucket, CloudFront distribution) and serve malicious content from the subdomain.',
    affectedResource: 'Route53 Record (staging.example.com)',
    action: 'Delete the dangling DNS record immediately. Implement automated monitoring to detect DNS records pointing to unprovisioned resources.',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// HTTP Server
// ─────────────────────────────────────────────────────────────────────────────

function sendJSON(res, statusCode, data) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*' });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  console.log(`[mock-server] ${req.method} ${path}`);

  // ── GET /api/dashboard/stats ─────────────────────────────────────────
  if (path === '/api/dashboard/stats') {
    return sendJSON(res, 200, STATS);
  }

  // ── GET /api/attack-paths ────────────────────────────────────────────
  if (path === '/api/attack-paths') {
    return sendJSON(res, 200, ATTACK_PATHS);
  }

  // ── GET /api/attack-paths/:id/recommendation ─────────────────────────
  const recMatch = path.match(/^\/api\/attack-paths\/([\w-]+)\/recommendation$/);
  if (recMatch) {
    const id = recMatch[1];
    const rec = RECOMMENDATIONS[id];
    if (!rec) return sendJSON(res, 404, { error: `No recommendation found for path: ${id}` });
    return sendJSON(res, 200, rec);
  }

  // ── 404 ───────────────────────────────────────────────────────────────
  sendJSON(res, 404, { error: `Route not found: ${path}` });
});

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════╗
║     Attack Path Risk Engine — Mock API Server        ║
╠══════════════════════════════════════════════════════╣
║  Listening on  http://localhost:${PORT}              ║
║                                                      ║
║  Endpoints:                                          ║
║  GET /api/dashboard/stats                            ║
║  GET /api/attack-paths                               ║
║  GET /api/attack-paths/:id/recommendation            ║
║                                                      ║
║  17 attack paths · 4 High · 7 Medium · 6 Low         ║
╚══════════════════════════════════════════════════════╝

  Now run:  npm run dev   (in a separate terminal)
`);
});
