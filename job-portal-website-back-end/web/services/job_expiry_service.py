import threading
from datetime import datetime

from flask import request

from web import app, dao



DEFAULT_SWEEP_INTERVAL_SECONDS = 15 * 60

_sweep_lock = threading.Lock()
_last_sweep_at = None


def expire_overdue_jobs_service():
    return dao.expire_overdue_job_posts()


def _claim_sweep_turn():
    global _last_sweep_at

    interval = app.config.get("JOB_EXPIRY_SWEEP_INTERVAL_SECONDS", DEFAULT_SWEEP_INTERVAL_SECONDS)
    now = datetime.now()

    with _sweep_lock:
        if _last_sweep_at and (now - _last_sweep_at).total_seconds() < interval:
            return False

        _last_sweep_at = now
        return True


def run_expiry_sweep_if_due():
    if not _claim_sweep_turn():
        return 0

    try:
        expired_count = expire_overdue_jobs_service()

        if expired_count:
            print(f"✓ Đã tự động chuyển {expired_count} bài đăng quá hạn sang trạng thái 'hết hạn'")

        return expired_count
    except Exception as ex:
        
        print(f"✗ Lỗi khi quét bài đăng hết hạn: {ex}")
        return 0


def register_job_expiry_sweeper(flask_app):

    @flask_app.before_request
    def _sweep_overdue_job_posts():
        
        if request.method != 'OPTIONS':
            run_expiry_sweep_if_due()
