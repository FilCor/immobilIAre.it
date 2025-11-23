"""
Test script to verify Supabase connection and execute schema migration
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv("../../secret.env")

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

print("🔍 Testing Supabase connection...")

try:
    # Read and execute schema
    with open("../schema.sql", "r") as f:
        schema_sql = f.read()
    
    print("📝 Executing SQL schema migration...")
    
    # Split by semicolons and execute each statement
    statements = [s.strip() for s in schema_sql.split(";") if s.strip() and not s.strip().startswith("--")]
    
    for stmt in statements:
        if stmt:
            try:
                # Note: Supabase Python client doesn't expose raw SQL execution
                # We'll need to use the Supabase SQL Editor or psycopg2
                print(f"  ⚠️  Cannot execute raw SQL via Python client")
                print(f"  Please run schema.sql in Supabase SQL Editor")
                break
            except Exception as e:
                print(f"  ❌ Error: {e}")
    
    # Test table access
    print("\n✅ Testing table access...")
    result = supabase.table("properties").select("*").limit(1).execute()
    print(f"  ✓ Properties table accessible: {len(result.data)} rows")
    
    result = supabase.table("property_images").select("*").limit(1).execute()
    print(f"  ✓ Property images table accessible: {len(result.data)} rows")
    
    print("\n✅ Database connection successful!")
    
except Exception as e:
    print(f"❌ Connection failed: {e}")
    print("\nPlease ensure:")
    print("1. schema.sql has been executed in Supabase SQL Editor")
    print("2. SUPABASE_URL and SUPABASE_KEY are correct in secret.env")
