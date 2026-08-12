from .auth_bp import auth_bp
from .profile_bp import profile_bp
from .admin_users_bp import admin_users_bp
from .admin_companies_bp import admin_companies_bp
from .admin_jobs_bp import admin_jobs_bp
from .admin_stats_bp import admin_stats_bp
from .jobs_bp import jobs_bp
from .applications_bp import applications_bp
from .cvs_bp import cvs_bp
from .company_jobs_bp import company_jobs_bp
from .company_applications_bp import company_applications_bp
from .common_bp import common_bp
from .notifications_bp import notifications_bp
from .job_reviews_bp import job_reviews_bp
from .company_follow_bp import company_follow_bp
from .export_bp import export_bp
from .ai_bp import ai_bp

__all__ = [
    'auth_bp',
    'profile_bp',
    'jobs_bp',
    'applications_bp',
    'cvs_bp',
    'company_jobs_bp',
    'admin_users_bp',
    'admin_companies_bp',
    'admin_jobs_bp',
    'admin_stats_bp',
    'company_applications_bp',
    'common_bp',
    'notifications_bp',
    'job_reviews_bp',
    'company_follow_bp',
    'export_bp',
    'ai_bp'
]
