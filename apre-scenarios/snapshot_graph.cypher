// =====================================================================
// Graph snapshot / restore for APRE
//
// WHY: the Neo4j Aura Free instance is deleted after 30 days paused, and
// the AWS account closes at 6 months. Export the APRE subgraph so your
// Phase I results and demo survive both, and can be reloaded into any new
// Aura instance WITHOUT needing the AWS account at all.
// =====================================================================

// ---------------------------------------------------------------------
// EXPORT (run in the Aura Query tab; copy the JSON result to a file:
//   apre_graph_snapshot.json)
// Captures every apre-* principal and everything within 3 hops of it,
// as plain nodes + relationships you can recreate anywhere.
// ---------------------------------------------------------------------
MATCH (seed:AWSPrincipal) WHERE seed.name STARTS WITH 'apre-'
MATCH path = (seed)-[*0..3]-(n)
WITH collect(DISTINCT n) AS nodes,
     collect(DISTINCT relationships(path)) AS rel_lists
WITH nodes,
     reduce(acc = [], rl IN rel_lists | acc + rl) AS rels
RETURN
  [x IN nodes | {
      id: elementId(x),
      labels: labels(x),
      props: properties(x)
  }] AS nodes,
  [r IN rels | {
      type: type(r),
      start: elementId(startNode(r)),
      end: elementId(endNode(r)),
      props: properties(r)
  }] AS relationships;


// ---------------------------------------------------------------------
// RESTORE INTO A NEW INSTANCE (no AWS account required)
// Prereqs: paste the exported JSON as the $data parameter in the Aura
// console (:param data => <paste>), then run this.
// ---------------------------------------------------------------------
// WITH $data AS d
// UNWIND d.nodes AS node
// CALL apoc.create.node(node.labels, node.props) YIELD node AS created
// // (requires APOC; Aura has it). Falls back to explicit MERGEs if not.
// RETURN count(created);
//
// NOTE: full restore is a Phase II convenience. For Phase I the snapshot
// JSON plus the verify.cypher screenshots are enough evidence that the
// pipeline ran end to end. Keep the JSON in the repo under /evidence/.
