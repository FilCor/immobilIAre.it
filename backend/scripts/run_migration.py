"""
Execute SQL schema migration directly using PostgreSQL
"""

import os
from dotenv import load_dotenv
import psycopg2
from urllib.parse import urlparse

load_dotenv("../../secret.env")

# Parse Supabase URL to get PostgreSQL connection details
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

# Supabase provides a direct PostgreSQL connection string
# Format: postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
# We need to construct this from the Supabase URL

# Extract host from Supabase URL (e.g., https://euuzmvtffjhvspoccuyn.supabase.co)
parsed = urlparse(supabase_url)
project_ref = parsed.hostname.split('.')[0]  # euuzmvtffjhvspoccuyn
pg_host = f"db.{parsed.hostname}"  # db.euuzmvtffjhvspoccuyn.supabase.co

# For Supabase, the service role key is NOT the DB password
# We need to use a different approach - run SQL via Supabase REST API
print("⚠️  Direct PostgreSQL execution requires database password")
print("📋 Please execute schema.sql manually in Supabase SQL Editor:")
print()
print("1. Go to: https://supabase.com/dashboard/project/{}/editor/sql")
print("2. Copy contents of backend/schema.sql")
print("3. Paste and click 'Run'")
print()
print("Alternatively, you can use the Supabase CLI:")
print("  supabase db push")
print()

# Read schema for display
with open("../schema.sql", "r") as f:
    schema = f.read()

print("=" * 60)
print("SCHEMA.SQL CONTENTS:")
print("=" * 60)
print(schema)
print("=" * 60)
