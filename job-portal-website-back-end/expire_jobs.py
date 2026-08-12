from web import app
from web.services.job_expiry_service import expire_overdue_jobs_service

if __name__ == "__main__":
    with app.app_context():
        expired_count = expire_overdue_jobs_service()

        print(f"✅ Đã chuyển {expired_count} bài đăng quá hạn sang trạng thái 'hết hạn'")
