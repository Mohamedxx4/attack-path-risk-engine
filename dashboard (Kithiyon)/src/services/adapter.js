/**
 * adapter.js — Turns the APRE path contract (v1.0, apre-contract/) into the
 * view model the dashboard components render.
 *
 * The contract document is never modified; this only derives display fields
 * (node list for the graph, severity in upper case, chips, recommendation).
 */

export const SUPPORTED_SCHEMA = '1.0';

export const SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const TECHNIQUE_LABELS = {
  role_chaining: 'Role chaining',
  policy_self_escalation: 'Policy self-escalation',
  passrole_lambda: 'PassRole + Lambda',
};

const IDENTITY_TYPES = new Set(['AWSUser', 'AWSRole', 'AWSGroup', 'AWSPrincipal']);

export function techniqueLabel(technique) {
  return TECHNIQUE_LABELS[technique] || String(technique).replace(/_/g, ' ');
}

// ── Graph nodes ────────────────────────────────────────────────────────────
// One node per principal/resource along the path: hop[0].from, then every
// hop.to, then the declared target if the last hop doesn't already land on it
// (e.g. self-escalation ends on the policy, but the prize is account admin).
function buildNodes(path) {
  const raw = [];
  path.hops.forEach((hop, i) => {
    if (i === 0) raw.push({ ref: hop.from, action: null, mechanism: null });
    raw.push({ ref: hop.to, action: hop.action, mechanism: hop.mechanism });
  });
  const last = raw[raw.length - 1]?.ref;
  if (!last || last.name !== path.target.name) {
    raw.push({ ref: path.target, action: 'gains', mechanism: path.target.description || null });
  }

  return raw.map(({ ref, action, mechanism }, i) => {
    let type;
    if (i === 0) type = 'entry';
    else if (i === raw.length - 1) type = 'sensitive';
    else type = IDENTITY_TYPES.has(ref.type) ? 'identity' : 'resource';
    return {
      id: `${path.id}-n${i}`,
      label: ref.name,
      kind: ref.type,
      arn: ref.arn || null,
      type,
      action, // the AWS action that leads INTO this node (null for the entry)
      mechanism, // plain-language reason that step works
    };
  });
}

// ── Recommendations ────────────────────────────────────────────────────────
// The contract carries no remediation, so the dashboard derives one per
// technique from the path's own hops. Each targets the cheapest edge that
// breaks the path.
function hopTo(path, action) {
  return path.hops.find((h) => h.action === action)?.to;
}

function describe(ref) {
  if (!ref) return 'Unknown';
  return ref.arn ? `${ref.name} (${ref.arn})` : ref.name;
}

function buildRecommendation(path, severity) {
  const entry = path.entry_point.name;
  const base = { severity };

  switch (path.technique) {
    case 'role_chaining': {
      const first = path.hops[0];
      const viaGroup = (first.evidence_edges || []).includes('MEMBER_AWS_GROUP');
      const owner = viaGroup ? `${entry}'s group` : entry;
      return {
        ...base,
        title: 'Break the first link of the role chain',
        description:
          `${entry} can walk ${path.hop_count - 1} assume-role step(s) to ${path.target.name}. ` +
          'No single permission looks dangerous; removing any one link breaks the whole path, ' +
          'and the entry link is the one a low-privilege identity should never have.',
        affectedResource: describe(first.to),
        action:
          `Remove ${owner} permission to sts:AssumeRole on ${first.to.name}, or drop ${entry} from ` +
          `${first.to.name}'s trust policy. If the access is needed, require MFA ` +
          '(aws:MultiFactorAuthPresent) in the trust policy and scope the final role to only the objects it needs.',
      };
    }
    case 'policy_self_escalation': {
      const policy = hopTo(path, 'iam:CreatePolicyVersion');
      const policyName = policy?.name || 'its own attached policy';
      return {
        ...base,
        title: 'Stop the principal editing its own policy',
        description:
          `${entry} can publish a new default version of ${policyName}. ` +
          'A version allowing every action on every resource makes it a full administrator in one step.',
        affectedResource: describe(policy),
        action:
          `Remove iam:CreatePolicyVersion (and iam:SetDefaultPolicyVersion) on ${policyName} from ${entry}. ` +
          'Policy changes should go through a separate, reviewed admin identity.',
      };
    }
    case 'passrole_lambda': {
      const role = hopTo(path, 'iam:PassRole');
      const roleName = role?.name || 'the privileged role';
      return {
        ...base,
        title: 'Scope iam:PassRole away from the privileged role',
        description:
          `${entry} can create a Lambda function, hand it ${roleName}, and invoke it, ` +
          "so the function's code runs with that role's rights.",
        affectedResource: describe(role),
        action:
          `Remove iam:PassRole on ${roleName} from ${entry}, or limit it (iam:PassedToService plus a ` +
          'resource restriction) to a low-privilege execution role. Also replace AdministratorAccess on the ' +
          'Lambda role with only the permissions the function needs.',
      };
    }
    default:
      return {
        ...base,
        title: `Review the path from ${entry}`,
        description: path.title,
        affectedResource: describe(path.target),
        action:
          'Remove or scope the permission behind any one hop of this path; every hop is required for it to work.',
      };
  }
}

// ── Document → view model ──────────────────────────────────────────────────
export function adaptDocument(doc) {
  if (!doc || typeof doc !== 'object' || !Array.isArray(doc.paths)) {
    throw new Error('Response is not an APRE path document (missing "paths").');
  }
  if (doc.schema_version !== SUPPORTED_SCHEMA) {
    throw new Error(
      `Unsupported contract version "${doc.schema_version}" (dashboard reads ${SUPPORTED_SCHEMA}).`,
    );
  }
  const unscored = doc.paths.filter((p) => p.scoring?.risk_score == null);
  if (unscored.length) {
    throw new Error(
      `${unscored.length} path(s) have no score yet (${unscored.map((p) => p.id).join(', ')}). ` +
        'Run risk-scoring/score.py and point the API at its output.',
    );
  }

  const paths = doc.paths.map((p) => {
    const severity = String(p.scoring.severity || 'low').toUpperCase();
    const actions = [...new Set(p.hops.map((h) => h.action))];
    return {
      id: p.id,
      title: p.title,
      technique: p.technique,
      riskScore: p.scoring.risk_score,
      impact: p.scoring.impact,
      likelihood: p.scoring.likelihood,
      severity,
      rationale: p.scoring.rationale,
      hops: p.hop_count,
      techniques: [techniqueLabel(p.technique), ...actions],
      entryPoint: p.entry_point,
      target: p.target,
      signals: p.signals,
      nodes: buildNodes(p),
      recommendation: buildRecommendation(p, severity),
    };
  });

  const count = (sev) => paths.filter((p) => p.severity === sev).length;
  const stats = {
    totalPaths: paths.length,
    criticalCount: count('CRITICAL'),
    highCount: count('HIGH'),
    mediumCount: count('MEDIUM'),
    lowCount: count('LOW'),
  };

  const md = doc.metadata || {};
  const meta = {
    accountId: md.account_id || null,
    source: md.source || null,
    generatedAt: md.generated_at || null,
    scoredAt: md.scored_at || null,
  };

  return { meta, stats, paths };
}
