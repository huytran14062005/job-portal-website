from datetime import date

from sqlalchemy import and_, func, or_
from web import db, app
from web.models import (JobPost, CompanyInfo, CompanyStatus, JobLocation, JobType, SavedJob,
                        PostStatus, JobReview)
from .base_dao import apply_pagination


def is_job_expired(deadline, status=None):
    if status == PostStatus.HET_HAN:
        return True

    return bool(deadline and deadline < date.today())


def open_job_posts_condition():
    return and_(
        JobPost.status == PostStatus.HOAT_DONG,
        or_(JobPost.deadline.is_(None), JobPost.deadline >= date.today())
    )


def approved_company_condition():
    return CompanyInfo.status == CompanyStatus.APPROVED


def public_job_posts_condition():
    return and_(open_job_posts_condition(), approved_company_condition())


def hide_job_posts_of_company(company_id):
    return (
        db.session.query(JobPost)
        .filter(
            JobPost.company_id == company_id,
            JobPost.status == PostStatus.HOAT_DONG
        )
        .update({JobPost.status: PostStatus.AN}, synchronize_session=False)
    )


def expire_overdue_job_posts():
    updated = (
        db.session.query(JobPost)
        .filter(
            JobPost.status == PostStatus.HOAT_DONG,
            JobPost.deadline.isnot(None),
            JobPost.deadline < date.today()
        )
        .update({JobPost.status: PostStatus.HET_HAN}, synchronize_session=False)
    )

    try:
        db.session.commit()
        return updated
    except Exception as ex:
        db.session.rollback()
        raise Exception(f'Lỗi khi cập nhật bài đăng hết hạn: {str(ex)}')


def get_jobs(user_id=None, page=1, limit=None, keyword=None, location_id=None, job_type_id=None, 
             min_salary_filter=None, max_salary_filter=None, is_saved=False):
    if limit is None:
        limit = app.config.get("APPLICATION_SIZE", 10)


    if is_saved and user_id:
        query = (db.session.query(
            JobPost.id,
            JobPost.title,
            JobPost.min_salary,
            JobPost.max_salary,
            JobPost.deadline,
            CompanyInfo.company_name,
            SavedJob.saved_at,
            func.coalesce(func.avg(JobReview.rating), 0).label('avg_rating'),
            func.count(JobReview.id).label('review_count')
        )
                 .join(SavedJob, JobPost.id == SavedJob.job_post_id)
                 .join(CompanyInfo, JobPost.company_id == CompanyInfo.id)
                 .outerjoin(JobReview, JobPost.id == JobReview.job_post_id)
                 .filter(SavedJob.candidate_id == user_id)
                 .filter(public_job_posts_condition())
                 .group_by(JobPost.id, CompanyInfo.company_name, SavedJob.saved_at))
    else:
        query = (db.session.query(
            JobPost.id,
            JobPost.title,
            JobPost.min_salary,
            JobPost.max_salary,
            JobPost.deadline,
            CompanyInfo.company_name,
            func.coalesce(func.avg(JobReview.rating), 0).label('avg_rating'),
            func.count(JobReview.id).label('review_count')
        )
                 .join(CompanyInfo, JobPost.company_id == CompanyInfo.id)
                 .outerjoin(JobReview, JobPost.id == JobReview.job_post_id)
                 .filter(public_job_posts_condition())
                 .group_by(JobPost.id, CompanyInfo.company_name))


    if keyword:
        keyword_pattern = f'%{keyword}%'
        query = query.filter(
            (JobPost.title.like(keyword_pattern)) |
            (JobPost.description.like(keyword_pattern)) |
            (CompanyInfo.company_name.like(keyword_pattern))
        )


    if location_id:
        query = query.filter(JobPost.location_id == location_id)


    if job_type_id:
        query = query.filter(JobPost.job_type_id == job_type_id)




    if min_salary_filter is not None:
        query = query.filter(JobPost.min_salary >= min_salary_filter)
    
    if max_salary_filter is not None:
        query = query.filter(JobPost.max_salary <= max_salary_filter)


    if is_saved and user_id:
        query = query.order_by(SavedJob.saved_at.desc())
    else:

        query = query.order_by(func.coalesce(func.avg(JobReview.rating), 0).desc(), JobPost.created_at.desc())


    query, total = apply_pagination(query, page, page_size=limit)

    jobs = query.all()


    jobs_list = []
    for job in jobs:
        job_dict = {
            'id': job.id,
            'title': job.title,
            'min_salary': job.min_salary,
            'max_salary': job.max_salary,
            'deadline': job.deadline.strftime('%d-%m-%Y') if job.deadline else None,
            'company_name': job.company_name,
            'avg_rating': round(float(job.avg_rating), 1) if job.avg_rating else 0,
            'review_count': job.review_count
        }

        if is_saved and user_id:
            job_dict['saved_at'] = job.saved_at.strftime('%d-%m-%Y %H:%M:%S')
            job_dict['is_saved'] = True

        jobs_list.append(job_dict)

    return jobs_list, total


def get_job_detail(job_id):
    job = (db.session.query(
        JobPost.id,
        JobPost.title,
        JobPost.min_salary,
        JobPost.max_salary,
        JobPost.description,
        JobPost.requirements,
        JobPost.benefits,
        JobPost.deadline,
        JobPost.status,
        JobPost.job_type_id,
        JobPost.company_id,
        CompanyInfo.company_name,
        CompanyInfo.industry,
        CompanyInfo.logo_url,
        CompanyInfo.company_size,
        CompanyInfo.address,
        CompanyInfo.website,
        JobLocation.name.label('location_name'),
        JobType.name.label('job_type_name')
    )
           .join(CompanyInfo, JobPost.company_id == CompanyInfo.id)
           .join(JobLocation, JobPost.location_id == JobLocation.id)
           .join(JobType, JobPost.job_type_id == JobType.id)
           .filter(JobPost.id == job_id)
           .filter(approved_company_condition())
           .first())

    if not job:
        return None

    job_dict = {
        'id': job.id,
        'title': job.title,
        'min_salary': job.min_salary,
        'max_salary': job.max_salary,
        'description': job.description,
        'requirements': job.requirements,
        'benefits': job.benefits,
        'deadline': job.deadline.strftime('%d-%m-%Y') if job.deadline else None,
        'status': job.status.value,
        'is_expired': is_job_expired(job.deadline, job.status),
        'job_type_id': job.job_type_id,
        'company_id': job.company_id,
        'company_name': job.company_name,
        'company_industry': job.industry,
        'company_logo': job.logo_url,
        'company_size': job.company_size,
        'company_address': job.address,
        'company_website': job.website,
        'location_name': job.location_name,
        'job_type_name': job.job_type_name
    }

    return job_dict


def save_job(user_id, job_post_id):
    saved_job = SavedJob(
        candidate_id=user_id,
        job_post_id=job_post_id
    )
    db.session.add(saved_job)

    try:
        db.session.commit()
        return True
    except Exception as ex:
        db.session.rollback()
        raise Exception(f'Lỗi khi lưu job: {str(ex)}')


def unsave_job(user_id, job_post_id):
    saved_job = SavedJob.query.filter(
        SavedJob.candidate_id == user_id,
        SavedJob.job_post_id == job_post_id
    ).first()

    if saved_job:
        db.session.delete(saved_job)

    try:
        db.session.commit()
        return True
    except Exception as ex:
        db.session.rollback()
        raise Exception(f'Lỗi khi bỏ lưu job: {str(ex)}')


def check_job_saved(user_id, job_post_id):
    saved_job = SavedJob.query.filter(
        SavedJob.candidate_id == user_id,
        SavedJob.job_post_id == job_post_id
    ).first()

    return saved_job is not None


def get_saved_job_ids(user_id, job_post_ids):
    if not job_post_ids:
        return []

    rows = (
        db.session.query(SavedJob.job_post_id)
        .filter(
            SavedJob.candidate_id == user_id,
            SavedJob.job_post_id.in_(job_post_ids)
        )
        .distinct()
        .all()
    )

    return [job_post_id for (job_post_id,) in rows]


def create_job_post(company_id, title, min_salary, max_salary, description, deadline, location_id, job_type_id):
    job_post = JobPost(
        company_id=company_id,
        title=title,
        min_salary=min_salary,
        max_salary=max_salary,
        description=description,
        deadline=deadline,
        location_id=location_id,
        job_type_id=job_type_id,
        status=PostStatus.HOAT_DONG
    )

    db.session.add(job_post)

    try:
        db.session.commit()
        return job_post
    except Exception as ex:
        db.session.rollback()
        raise Exception(f'Lỗi khi tạo job post: {str(ex)}')


def get_company_job_posts(company_id, page=1):
    query = JobPost.query.filter(
        JobPost.company_id == company_id
    ).order_by(JobPost.created_at.desc())

    query, total = apply_pagination(query, page)

    return query.all(), total


def update_job_post(job_post, title, min_salary, max_salary, description, deadline,
                    location_id, job_type_id, status=None):
    job_post.title = title
    job_post.min_salary = min_salary
    job_post.max_salary = max_salary
    job_post.description = description
    job_post.deadline = deadline
    job_post.location_id = location_id
    job_post.job_type_id = job_type_id

    if status is not None:
        job_post.status = status

    try:
        db.session.commit()
        return job_post
    except Exception as ex:
        db.session.rollback()
        raise Exception(f'Lỗi khi cập nhật job post: {str(ex)}')


def update_job_post_status(job_post, status):
    job_post.status = status

    try:
        db.session.commit()
        return job_post
    except Exception as ex:
        db.session.rollback()
        raise Exception(f'Lỗi khi cập nhật trạng thái job post: {str(ex)}')


def get_jobs_by_company(company_id, page=1):
    query = (db.session.query(
        JobPost.id,
        JobPost.title,
        JobPost.min_salary,
        JobPost.max_salary,
        JobPost.deadline,
        CompanyInfo.company_name
    )
             .join(CompanyInfo, JobPost.company_id == CompanyInfo.id)
             .filter(JobPost.company_id == company_id)
             .filter(public_job_posts_condition())
             .order_by(JobPost.created_at.desc()))

    query, total = apply_pagination(query, page)

    jobs = query.all()


    jobs_list = []
    for job in jobs:
        jobs_list.append({
            'id': job.id,
            'title': job.title,
            'min_salary': job.min_salary,
            'max_salary': job.max_salary,
            'deadline': job.deadline.strftime('%d-%m-%Y') if job.deadline else None,
            'company_name': job.company_name
        })

    return jobs_list, total


def get_related_jobs(job_id, limit=5):
    print(f"\n=== DEBUG get_related_jobs ===")
    print(f"Looking for related jobs for job_id: {job_id}")
    

    current_job = (db.session.query(
        JobPost.company_id,
        CompanyInfo.industry
    )
                   .join(CompanyInfo, JobPost.company_id == CompanyInfo.id)
                   .filter(JobPost.id == job_id)
                   .filter(approved_company_condition())
                   .first())

    if not current_job:
        print(f"ERROR: Job {job_id} not found!")
        return []

    company_id = current_job.company_id
    industry = current_job.industry
    print(f"Current job - Company ID: {company_id}, Industry: {industry}")


    query = (db.session.query(
        JobPost.id,
        JobPost.title,
        JobPost.min_salary,
        JobPost.max_salary,
        JobPost.deadline,
        CompanyInfo.company_name,
        JobLocation.name.label('location_name')
    )
             .join(CompanyInfo, JobPost.company_id == CompanyInfo.id)
             .join(JobLocation, JobPost.location_id == JobLocation.id)
             .filter(JobPost.company_id == company_id)
             .filter(CompanyInfo.industry == industry)
             .filter(JobPost.id != job_id)
             .filter(public_job_posts_condition())
             .order_by(JobPost.created_at.desc())
             .limit(limit))

    jobs = query.all()
    print(f"Found {len(jobs)} related jobs")


    jobs_list = []
    for job in jobs:
        print(f"  - Job {job.id}: {job.title}")
        jobs_list.append({
            'id': job.id,
            'title': job.title,
            'min_salary': job.min_salary,
            'max_salary': job.max_salary,
            'deadline': job.deadline.strftime('%d-%m-%Y') if job.deadline else None,
            'company_name': job.company_name,
            'location_name': job.location_name
        })

    print(f"=== END DEBUG ===\n")
    return jobs_list
