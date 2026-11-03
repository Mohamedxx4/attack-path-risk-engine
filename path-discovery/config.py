"""Configuration for the APRE discovery module.

Connection values default to the shared APRE Neo4j AuraDB instance but can be
overridden by environment variables. The password is ALWAYS taken from the
environment and never hard-coded.
"""
import os

# Neo4j AuraDB. NOTE: for this instance the Bolt username is the instance id,
# not "neo4j" (see FINDINGS.md).
NEO4J_URI = os.environ.get("NEO4J_URI", "neo4j+s://2276c01d.databases.neo4j.io")
NEO4J_USER = os.environ.get("NEO4J_USER", "2276c01d")
NEO4J_PASSWORD = os.environ.get("NEO4J_PASSWORD")  # required, from env

# The AWS account the graph was synced from (for output metadata).
ACCOUNT_ID = os.environ.get("APRE_ACCOUNT_ID", "451513982258")

# Principals that are infrastructure, not scenario attackers. Excluded as entry
# points and from results (see FINDINGS.md: apre-admin holds AdministratorAccess).
EXCLUDED_PRINCIPALS = {"apre-admin", "cartography-readonly"}
