from datetime import datetime
from sqlalchemy.orm import joinedload

from web import db
from web.models import Application, JobPost, CompanyInfo, ApplicantInfo, ApplicationStatus
from .base_dao import apply_pagination


def get_latest_application_ids(candidate_id=None):
    row_number = db.func.row_number().over(
        partition_by=[Application.candidate_id, Application.job_post_id],
        order_by=[Application.applied_at.desc(), Application.id.desc()]
    ).label('rn')

    ranked_query = db.session.query(Application.id.label('app_id'), row_number)

    if candidate_id:
        ranked_query = ranked_query.filter(Application.candidate_id == candidate_id)

    ranked = ranked_query.subquery()

    return db.session.query(ranked.c.app_id).filter(ranked.c.rn == 1)


def get_application_of_own_candidate(candidate_id, page=1):
    latest_ids = get_latest_application_ids(candidate_id)

    query = (db.session.query(
        Application.id,
        Application.job_post_id,
        Application.cv_url,
        Application.status,
        Application.applied_at,
        JobPost.title,
        CompanyInfo.company_name,
        Application.rejected_at,
        Application.apply_count,
        JobPost.status.label('job_status'),
        JobPost.deadline.label('job_deadline')
    )
             .join(JobPost, Application.job_post_id == JobPost.id)
             .join(CompanyInfo, JobPost.company_id == CompanyInfo.id)
             .filter(Application.candidate_id == candidate_id)
             .filter(Application.id.in_(latest_ids))
             .order_by(Application.applied_at.desc()))

    query, total = apply_pagination(query, page)

    return query.all(), total


def get_applications_for_company(company_id, page=1, job_post_id=None, status=None):
    query = (db.session.query(Application)
             .options(
                 joinedload(Application.candidate).joinedload(ApplicantInfo.user),
                 joinedload(Application.job_post).joinedload(JobPost.company)
             )
             .join(JobPost, Application.job_post_id == JobPost.id)
             .join(ApplicantInfo, Application.candidate_id == ApplicantInfo.id)
             .filter(JobPost.company_id == company_id)
             .filter(Application.id.in_(get_latest_application_ids())))

    if job_post_id:
        query = query.filter(Application.job_post_id == job_post_id)

    if status:
        query = query.filter(Application.status == status)

    query = query.order_by(Application.applied_at.desc())

    query, total = apply_pagination(query, page)

    return query.all(), total


def get_application_by_id_for_company(application_id, company_id):
    return (db.session.query(Application)
            .options(
                joinedload(Application.candidate).joinedload(ApplicantInfo.user),
                joinedload(Application.job_post).joinedload(JobPost.company)
            )
            .join(JobPost, Application.job_post_id == JobPost.id)
            .filter(Application.id == application_id)
            .filter(JobPost.company_id == company_id)
            .first())


def update_application_status(application, new_status):
    application.status = new_status


    if new_status == ApplicationStatus.TU_CHOI:
        application.rejected_at = datetime.now()



    try:
        db.session.commit()
        return application
    except Exception as ex:
        db.session.rollback()
        raise Exception(f'Lỗi khi cập nhật trạng thái đơn ứng tuyển: {str(ex)}')


def get_application_by_job(candidate_id, job_post_id):
    return (Application.query.filter(
        Application.candidate_id == candidate_id,
        Application.job_post_id == job_post_id
    ).order_by(Application.applied_at.desc(), Application.id.desc()).first())


def apply_job_with_cv_file(candidate_id, job_post_id, cv_file):
    cv_file_id = cv_file.id

    application = Application(
        candidate_id=candidate_id,
        job_post_id=job_post_id,
        cv_file_id=cv_file_id,
        cv_url=cv_file.cv_url,
        status=ApplicationStatus.DA_NOP,
        applied_at=datetime.now(),
        apply_count=1
    )

    db.session.add(application)

    try:
        db.session.commit()
        return application
    except Exception as ex:
        db.session.rollback()
        raise Exception(f'Lỗi khi tạo đơn ứng tuyển: {str(ex)}')


def reapply_job_with_cv_file(application, cv_file):
    application.cv_file_id = cv_file.id
    application.cv_url = cv_file.cv_url
    application.status = ApplicationStatus.DA_NOP
    application.applied_at = datetime.now()
    application.rejected_at = None
    application.apply_count = (application.apply_count or 1) + 1

    try:
        db.session.commit()
        return application
    except Exception as ex:
        db.session.rollback()
        raise Exception(f'Lỗi khi nộp lại đơn ứng tuyển: {str(ex)}')
