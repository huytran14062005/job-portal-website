from sqlalchemy import or_, func
from web import db
from web.models import JobPost, CompanyInfo, JobLocation, JobType, Application, SavedJob
from .base_dao import apply_pagination


def _application_count_subquery():
    return (
        db.session.query(
            Application.job_post_id.label('job_post_id'),
            func.count(Application.id).label('total')
        )
        .group_by(Application.job_post_id)
        .subquery()
    )


def get_all_jobs(page=1, per_page=None, status=None, keyword=None):
    app_count = _application_count_subquery()

    query = (
        db.session.query(
            JobPost,
            CompanyInfo.company_name,
            CompanyInfo.logo_url,
            JobLocation.name.label('location_name'),
            JobType.name.label('job_type_name'),
            func.coalesce(app_count.c.total, 0).label('application_count')
        )
        .join(CompanyInfo, JobPost.company_id == CompanyInfo.id)
        .join(JobLocation, JobPost.location_id == JobLocation.id)
        .join(JobType, JobPost.job_type_id == JobType.id)
        .outerjoin(app_count, app_count.c.job_post_id == JobPost.id)
    )

    if status:
        query = query.filter(JobPost.status == status)

    if keyword:
        kw = f"%{keyword.strip()}%"
        query = query.filter(or_(
            JobPost.title.ilike(kw),
            JobPost.description.ilike(kw),
            CompanyInfo.company_name.ilike(kw)
        ))

    query = query.order_by(JobPost.created_at.desc())

    query, total = apply_pagination(query, page, page_size=per_page)

    jobs = []
    for job, company_name, logo_url, location_name, job_type_name, application_count in query.all():
        jobs.append({
            'id': job.id,
            'title': job.title,
            'min_salary': job.min_salary,
            'max_salary': job.max_salary,
            'deadline': job.deadline.isoformat() if job.deadline else None,
            'status': job.status.value if job.status else None,
            'created_at': job.created_at.isoformat() if job.created_at else None,
            'company_id': job.company_id,
            'company_name': company_name,
            'company_logo': logo_url,
            'location_name': location_name,
            'job_type_name': job_type_name,
            'application_count': application_count
        })

    return jobs, total


def get_admin_job_detail(job_id):
    application_count = (
        db.session.query(func.count(Application.id))
        .filter(Application.job_post_id == JobPost.id)
        .correlate(JobPost)
        .scalar_subquery()
    )
    saved_count = (
        db.session.query(func.count(SavedJob.id))
        .filter(SavedJob.job_post_id == JobPost.id)
        .correlate(JobPost)
        .scalar_subquery()
    )

    detail = (
        db.session.query(
            JobPost.id,
            JobPost.title,
            JobPost.min_salary,
            JobPost.max_salary,
            JobPost.description,
            JobPost.requirements,
            JobPost.benefits,
            JobPost.deadline,
            JobPost.status,
            JobPost.created_at,
            CompanyInfo.company_name.label('company_name'),
            JobLocation.name.label('location_name'),
            JobType.name.label('job_type_name'),
            application_count.label('application_count'),
            saved_count.label('saved_count')
        )
        .outerjoin(CompanyInfo, JobPost.company_id == CompanyInfo.id)
        .outerjoin(JobLocation, JobPost.location_id == JobLocation.id)
        .outerjoin(JobType, JobPost.job_type_id == JobType.id)
        .filter(JobPost.id == job_id)
        .first()
    )

    if not detail:
        return None

    return {
        'id': detail.id,
        'title': detail.title,
        'min_salary': detail.min_salary,
        'max_salary': detail.max_salary,
        'description': detail.description,
        'requirements': detail.requirements,
        'benefits': detail.benefits,
        'deadline': detail.deadline.isoformat() if detail.deadline else None,
        'status': detail.status.value if detail.status else None,
        'created_at': detail.created_at.isoformat() if detail.created_at else None,
        'location_name': detail.location_name,
        'job_type_name': detail.job_type_name,
        'company_name': detail.company_name,
        'application_count': detail.application_count,
        'saved_count': detail.saved_count
    }


def get_job_by_id(job_id):
    return JobPost.query.get(job_id)


def update_job_status(job, status):
    job.status = status

    try:
        db.session.commit()
    except Exception as ex:
        db.session.rollback()
        raise Exception(f'Lỗi cập nhật trạng thái bài đăng: {str(ex)}')

    return True
