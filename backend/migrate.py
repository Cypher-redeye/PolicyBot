import os
import psycopg2
from dotenv import load_dotenv
from urllib.parse import unquote, urlparse

# Load environment variables
load_dotenv()

db_url = os.getenv("DATABASE_URL")
if not db_url:
    print("Error: DATABASE_URL not found in .env")
    exit(1)

db_url = unquote(db_url)
print("Parsing connection URL...")

parsed = urlparse(db_url)
username = parsed.username
password = parsed.password
host = parsed.hostname
port = parsed.port
database = parsed.path.lstrip('/')

# Direct connection settings
direct_host = "db.yramcyicsdbcsfbtzejl.supabase.co"
direct_user = "postgres"

conn = None

print(f"Trying direct connection to {direct_host}...")
try:
    conn = psycopg2.connect(
        host=direct_host,
        port=5432,
        user=direct_user,
        password=password,
        database="postgres",
        connect_timeout=10
    )
    conn.autocommit = True
    print("[SUCCESS] Connected to direct Supabase host!")
except Exception as e_direct:
    print(f"Direct connection failed: {e_direct}")
    print("Trying default connection URL...")
    try:
        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        print("[SUCCESS] Connected using default connection string!")
    except Exception as e_default:
        print(f"Default connection failed: {e_default}")
        print("Trying pooler with custom parameters...")
        try:
            conn = psycopg2.connect(
                host=host,
                port=port,
                user=username,
                password=password,
                database=database,
                connect_timeout=10
            )
            conn.autocommit = True
            print("[SUCCESS] Connected using custom pooler params!")
        except Exception as e_pool:
            print(f"Pooler custom failed: {e_pool}")
            print("\nIf all connections failed, you can run the SQL inside db_migrate_ml.sql manually in the Supabase SQL Editor.")
            exit(1)

try:
    cursor = conn.cursor()
    print("Reading db_migrate_ml.sql...")
    with open("db_migrate_ml.sql", "r") as f:
        sql = f.read()
        
    print("Executing migration...")
    cursor.execute(sql)
    print("Migration executed successfully!")
    
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Execution failed: {e}")
