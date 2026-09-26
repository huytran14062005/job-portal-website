import os
from urllib.parse import quote
from dotenv import load_dotenv

load_dotenv()



class Config:
    
    DB_USER = os.environ["DB_USER"]
    DB_PASSWORD = quote(os.environ["DB_PASSWORD"])
    DB_HOST = os.environ["DB_HOST"]
    DB_NAME = os.environ["DB_NAME"]

    SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}?charset=utf8mb4"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    CACHE_TYPE = os.environ["CACHE_TYPE"]
    CACHE_DEFAULT_TIMEOUT = int(os.environ["CACHE_DEFAULT_TIMEOUT"])
    CACHE_THRESHOLD = int(os.environ["CACHE_THRESHOLD"])
    CACHE_KEY_PREFIX = os.environ["CACHE_KEY_PREFIX"]

    SECRET_KEY = os.environ["SECRET_KEY"]
    APPLICATION_SIZE = 10

    MAX_APPLY_TIMES = 4
    
    JOB_EXPIRY_SWEEP_INTERVAL_SECONDS = int(os.environ["JOB_EXPIRY_SWEEP_INTERVAL_SECONDS"])

    
    CLOUD_NAME = os.environ["CLOUD_NAME"]
    API_KEY = os.environ["API_KEY"]
    API_SECRET = os.environ["API_SECRET"]

    
    JWT_SECRET = os.environ["JWT_SECRET"]
    JWT_ACCESS_TOKEN_EXPIRES_SECONDS = int(os.environ["JWT_ACCESS_TOKEN_EXPIRES_SECONDS"])
    JWT_REFRESH_TOKEN_EXPIRES_DAYS = int(os.environ["JWT_REFRESH_TOKEN_EXPIRES_DAYS"])
    REFRESH_COOKIE_NAME = os.environ["REFRESH_COOKIE_NAME"]
    REFRESH_COOKIE_SECURE = os.environ["REFRESH_COOKIE_SECURE"].lower() == "true"
    REFRESH_COOKIE_SAMESITE = os.environ["REFRESH_COOKIE_SAMESITE"]
    FRONTEND_ORIGINS = [
        origin.strip()
        for origin in os.environ["FRONTEND_ORIGINS"].split(",")
        if origin.strip()
    ]

    
    MAIL_SERVER = os.environ["SMTP_SERVER"]
    MAIL_PORT = int(os.environ["SMTP_PORT"])
    MAIL_USERNAME = os.environ["SMTP_USER"]
    MAIL_PASSWORD = os.environ["SMTP_PASSWORD"]
    MAIL_USE_TLS = MAIL_PORT == 587
    MAIL_USE_SSL = MAIL_PORT == 465
    MAIL_DEFAULT_SENDER = (
        os.environ["MAIL_SENDER_NAME"],
        os.environ["MAIL_SENDER"]
    )

    
    GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]
    GEMINI_MODEL = os.environ["GEMINI_MODEL"]
