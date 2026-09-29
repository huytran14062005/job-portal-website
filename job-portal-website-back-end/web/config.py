import os
from urllib.parse import quote
from dotenv import load_dotenv

load_dotenv()



class Config:
    
    DB_USER = os.getenv("DB_USER", "")
    DB_PASSWORD = quote(os.getenv("DB_PASSWORD", ""))
    DB_HOST = os.getenv("DB_HOST", "")
    DB_NAME = os.getenv("DB_NAME", "")

    SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}?charset=utf8mb4"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    CACHE_TYPE = os.getenv("CACHE_TYPE", "SimpleCache")
    CACHE_DEFAULT_TIMEOUT = int(os.getenv("CACHE_DEFAULT_TIMEOUT", 300))
    CACHE_THRESHOLD = int(os.getenv("CACHE_THRESHOLD", 500))
    CACHE_KEY_PREFIX = os.getenv("CACHE_KEY_PREFIX", "job_portal:")

    SECRET_KEY = os.getenv("SECRET_KEY", "dev")
    APPLICATION_SIZE = 10

    MAX_APPLY_TIMES = 4
    
    JOB_EXPIRY_SWEEP_INTERVAL_SECONDS = int(os.getenv("JOB_EXPIRY_SWEEP_INTERVAL_SECONDS", 900))

    
    CLOUD_NAME = os.getenv("CLOUD_NAME", "")
    API_KEY = os.getenv("API_KEY", "")
    API_SECRET = os.getenv("API_SECRET", "")

    
    JWT_SECRET = os.getenv("JWT_SECRET", "")
    JWT_ACCESS_TOKEN_EXPIRES_SECONDS = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_SECONDS", 900))
    JWT_REFRESH_TOKEN_EXPIRES_DAYS = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRES_DAYS", 7))
    REFRESH_COOKIE_NAME = os.getenv("REFRESH_COOKIE_NAME", "refresh_token")
    REFRESH_COOKIE_SECURE = os.getenv("REFRESH_COOKIE_SECURE", "false").lower() == "true"
    REFRESH_COOKIE_SAMESITE = os.getenv("REFRESH_COOKIE_SAMESITE", "Lax")
    FRONTEND_ORIGINS = [
        origin.strip()
        for origin in os.getenv(
            "FRONTEND_ORIGINS",
            "http://localhost:3000,http://127.0.0.1:3000",
        ).split(",")
        if origin.strip()
    ]

    
    MAIL_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.getenv("SMTP_PORT", 587))
    MAIL_USERNAME = os.getenv("SMTP_USER", "")
    MAIL_PASSWORD = os.getenv("SMTP_PASSWORD", "")
    MAIL_USE_TLS = MAIL_PORT == 587
    MAIL_USE_SSL = MAIL_PORT == 465
    MAIL_DEFAULT_SENDER = (
        os.getenv("MAIL_SENDER_NAME", "Job Portal"),
        os.getenv("MAIL_SENDER", os.getenv("SMTP_USER", ""))
    )

    
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
