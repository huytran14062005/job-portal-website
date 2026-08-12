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


def get_all_jobs(page=1, per_page=None, status=None, company_id=None, keyword=None):
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
        .outerjoin(JobLocation, JobPost.location_id == JobLocation.id)
        .outerjoin(JobType, JobPost.job_type_id == JobType.id)
        .outerjoin(app_count, app_count.c.job_post_id == JobPost.id)
    )

    if status:
        query = query.filter(JobPost.status == status)

    if company_id:
        query = query.filter(JobPost.company_id == company_id)

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
            JobPost,
            CompanyInfo.company_name,
            CompanyInfo.logo_url,
            CompanyInfo.status.label('company_status'),
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

    (job, company_name, company_logo, company_status,
     location_name, job_type_name, application_count, saved_count) = detail

    return {
        'id': job.id,
        'title': job.title,
        'min_salary': job.min_salary,
        'max_salary': job.max_salary,
        'description': job.description,
        'requirements': job.requirements,
        'benefits': job.benefits,
        'deadline': job.deadline.isoformat() if job.deadline else None,
        'status': job.status.value if job.status else None,
        'created_at': job.created_at.isoformat() if job.created_at else None,
        'location_id': job.location_id,
        'location_name': location_name,
        'job_type_id': job.job_type_id,
        'job_type_name': job_type_name,
        'company_id': job.company_id,
        'company_name': company_name,
        'company_logo': company_logo,
        'company_status': company_status.value if company_status else None,
        'application_count': application_count,
        'saved_count': saved_count
    }


def get_job_by_id(job_id):
    return JobPost.query.get(job_id)


def update_job(job, changes):
    for field, value in changes.items():
        setattr(job, field, value)

    try:
        db.session.commit()
    except Exception as ex:
        db.session.rollback()
        raise Exception(f'Lỗi cập nhật bài đăng: {str(ex)}')

    return True


def update_job_status(job, status):
    job.status = status

    try:
        db.session.commit()
    except Exception as ex:
        db.session.rollback()
        raise Exception(f'Lỗi cập nhật trạng thái bài đăng: {str(ex)}')

    return True


def delete_job(job):
    try:
        db.session.delete(job)
        db.session.commit()
    except Exception as ex:
        db.session.rollback()
        raise Exception(f'Lỗi xóa bài đăng: {str(ex)}')

    return True
