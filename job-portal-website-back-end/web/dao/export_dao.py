from web import db
from web.models import Application, ApplicantInfo, CompanyInfo, JobPost, User


def get_company_applications_for_export(company_id, job_id=None, status=None):
    query = (
        db.session.query(
            Application.id,
            ApplicantInfo.full_name,
            ApplicantInfo.phone,
            ApplicantInfo.address,
            JobPost.title.label('job_title'),
            Application.status,
            Application.applied_at,
            Application.cv_url,
            User.email.label('candidate_email')
        )
        .join(ApplicantInfo, Application.candidate_id == ApplicantInfo.id)
        .join(JobPost, Application.job_post_id == JobPost.id)
        .join(User, ApplicantInfo.id == User.id)
        .filter(JobPost.company_id == company_id)
    )

    if job_id:
        query = query.filter(Application.job_post_id == job_id)

    if status:
        query = query.filter(Application.status == status)

    return query.order_by(Application.applied_at.desc()).all()


def get_candidate_applications_for_export(candidate_id):
    return (
        db.session.query(
            Application.id,
            CompanyInfo.company_name,
            JobPost.title.label('job_title'),
            JobPost.min_salary,
            JobPost.max_salary,
            Application.status,
            Application.applied_at,
            JobPost.deadline
        )
        .join(JobPost, Application.job_post_id == JobPost.id)
        .join(CompanyInfo, JobPost.company_id == CompanyInfo.id)
        .filter(Application.candidate_id == candidate_id)
        .order_by(Application.applied_at.desc())
        .all()
    )
