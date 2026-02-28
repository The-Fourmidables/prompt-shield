import httpx

BASE_URL = "http://localhost:8000"

# ── Test Cases ────────────────────────────────────────────────────────────────

# Test 1 - Python with multiple secrets
code_python = """
import openai
import psycopg2
import boto3

# OpenAI setup
openai.api_key = "sk-abcdefghijklmnopqrstuvwxyz123456"

# Database connection
conn = psycopg2.connect(
    host="192.168.1.105",
    database="company_db",
    user="admin",
    password="SuperSecret@123"
)

# AWS setup
aws_access_key = "AKIAIOSFODNN7EXAMPLE"
aws_secret_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
s3 = boto3.client(
    's3',
    aws_access_key_id=aws_access_key,
    aws_secret_access_key=aws_secret_key
)

# Other keys
STRIPE_KEY = "sk_live_abcdefghijklmnop123456"
GITHUB_TOKEN = "ghp_abcdefghijklmnopqrstuvwxyz123456"
SENDGRID_KEY = "SG.abcdefghijklmnopqrstuv.wxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456789"
"""

# Test 2 - JavaScript/Node.js
code_javascript = """
const mongoose = require('mongoose')
const stripe = require('stripe')
const openai = require('openai')

// Database
mongoose.connect('mongodb://admin:MyPassword123@cluster.mongodb.net/mydb')

// Stripe
const stripeClient = stripe('sk_live_abcdefghijklmnop123456')

// OpenAI
const client = new openai.OpenAI({
    apiKey: 'sk-abcdefghijklmnopqrstuvwxyz123456'
})

// Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAbcdefghijklmnopqrstuvwxyz123456",
    authDomain: "myapp.firebaseapp.com",
    projectId: "my-project-123"
}

// Slack
const slackToken = "xoxb-123456789-abcdefghijklmno"

// Internal services
const internalApi = "http://internal-api.company.com/v1"
const privateServer = "192.168.1.200"
"""

# Test 3 - .env file
code_env = """
# App secrets
OPENAI_API_KEY=sk-abcdefghijklmnopqrstuvwxyz123456
ANTHROPIC_API_KEY=sk-ant-abcdefghijklmnopqrstuvwxyz123456
OPENROUTER_API_KEY=sk-or-abcdefghijklmnopqrstuvwxyz123456

# Database
DATABASE_URL=postgresql://admin:dbpassword123@db.company.com:5432/production
MONGODB_URI=mongodb://user:mongopass123@cluster.mongodb.net/mydb
REDIS_URL=redis://:redispassword@192.168.1.100:6379

# Payment
STRIPE_SECRET_KEY=sk_live_abcdefghijklmnop123456
STRIPE_WEBHOOK_SECRET=whsec_abcdefghijklmnopqrstuvwxyz

# Cloud
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1

# Auth
JWT_SECRET=mysupersecretjwtkey123456789
SESSION_PASSWORD=mysessionsecret123
"""

# Test 4 - Java
code_java = """
public class AppConfig {

    // Database
    private static final String DB_URL = "jdbc:mysql://192.168.1.50:3306/employees";
    private static final String DB_USER = "root";
    private static final String DB_PASSWORD = "Root@Database#2024";

    // API Keys
    private static final String OPENAI_KEY = "sk-abcdefghijklmnopqrstuvwxyz123456";
    private static final String GOOGLE_KEY = "AIzaSyAbcdefghijklmnopqrstuvwxyz123456";
    private static final String STRIPE_KEY = "sk_live_abcdefghijklmnop123456";

    // Internal services
    private static final String INTERNAL_URL = "http://internal-api.company.com/v2";
    private static final String PRIVATE_IP = "192.168.10.25";

    public Connection getConnection() throws SQLException {
        return DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD);
    }
}
"""

# Test 5 - YAML / Docker Compose
code_yaml = """
version: '3.8'

services:
  backend:
    image: myapp:latest
    environment:
      - OPENAI_API_KEY=sk-abcdefghijklmnopqrstuvwxyz123456
      - SECRET_KEY=django-insecure-abcdefghijklmnopqrstuvwxyz
      - DATABASE_URL=postgresql://user:dbpassword123@db:5432/myapp
      - REDIS_URL=redis://:redispass@redis:6379
      - AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
      - STRIPE_SECRET_KEY=sk_live_abcdefghijklmnop123456
      - JWT_SECRET=myjwtsecretkey123456789

  db:
    image: postgres:15
    environment:
      - POSTGRES_PASSWORD=dbpassword123
      - POSTGRES_USER=admin
"""

# Test 6 - Go language
code_go = """
package main

import (
    "database/sql"
    "fmt"
)

const (
    dbHost     = "192.168.1.50"
    dbPassword = "GoDBPass@2024"
    apiKey     = "sk-abcdefghijklmnopqrstuvwxyz123456"
    awsKey     = "AKIAIOSFODNN7EXAMPLE"
    jwtSecret  = "mygosupersecretjwtkey123456"
)

func connectDB() *sql.DB {
    dsn := fmt.Sprintf("postgres://admin:%s@%s/mydb", dbPassword, dbHost)
    db, _ := sql.Open("postgres", dsn)
    return db
}
"""

# Test 7 - Mixed code with JWT token
code_jwt = """
import jwt
import requests

# JWT token (already issued - should be masked)
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.abc123"

# GitHub token
github_token = "ghp_abcdefghijklmnopqrstuvwxyz123456"

headers = {
    "Authorization": f"Bearer {token}",
    "X-GitHub-Token": github_token
}

# Internal API
response = requests.get(
    "http://internal.company.com/api/users",
    headers=headers
)
"""


# ── Test Functions ────────────────────────────────────────────────────────────

def test_mask_only(code, label):
    print(f"\n{'='*60}")
    print(f"MASK ONLY: {label}")
    print(f"{'='*60}")

    response = httpx.post(
        f"{BASE_URL}/mask-code",
        json={"code": code},
        timeout=30.0
    )

    if response.status_code != 200:
        print(f"ERROR {response.status_code}: {response.text}")
        return

    result = response.json()
    print(f"\nMasked Code:\n{result['masked_code']}")
    print(f"\nSecrets Found ({len(result['secrets_found'])}):")
    for s in result["secrets_found"]:
        print(f"  [{s['type']}] {s['name']} → {s['placeholder']}")


def test_full_pipeline(code, prompt, label, language="auto"):
    print(f"\n{'='*60}")
    print(f"FULL PIPELINE: {label}")
    print(f"{'='*60}")

    response = httpx.post(
        f"{BASE_URL}/process-code",
        json={
            "code": code,
            "prompt": prompt,
            "language": language,
            "model": "openai/gpt-3.5-turbo"
        },
        timeout=60.0
    )

    if response.status_code != 200:
        print(f"ERROR {response.status_code}: {response.text}")
        return

    result = response.json()
    print(f"\nMasked Code:\n{result['masked_code']}")
    print(f"\nSecrets Found: {len(result['secrets_found'])}")
    for s in result["secrets_found"]:
        print(f"  [{s['type']}] → {s['placeholder']}")
    print(f"\nFinal LLM Response:\n{result['final_response']}")


# ── Run All Tests ─────────────────────────────────────────────────────────────

if __name__ == "__main__":

    print("\n🔍 Running Mask-Only Tests...")
    test_mask_only(code_python,     "Python — OpenAI + AWS + Stripe + DB")
    test_mask_only(code_javascript, "JavaScript — MongoDB + Firebase + Slack")
    test_mask_only(code_env,        ".env file — All secrets")
    test_mask_only(code_java,       "Java — DB credentials + API keys")
    test_mask_only(code_yaml,       "YAML/Docker — Environment secrets")
    test_mask_only(code_go,         "Go — DB + API keys")
    test_mask_only(code_jwt,        "JWT token + GitHub token")

    print("\n\n🚀 Running Full Pipeline Tests (calls LLM)...")
    test_full_pipeline(
        code_python,
        "Find all security vulnerabilities in this code",
        "Python security review",
        "python"
    )
    test_full_pipeline(
        code_java,
        "Explain what this code does and suggest improvements",
        "Java code review",
        "java"
    )

    print("\n\n✅ All tests completed!")
