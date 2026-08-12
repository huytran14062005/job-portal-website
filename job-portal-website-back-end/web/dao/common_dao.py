from web import db
from web.models import JobLocation, JobType, CompanyInfo, CompanyStatus, JobPost, CompanyFollow
from sqlalchemy import func
from .base_dao import apply_pagination
from .job_dao import approved_company_condition, open_job_posts_condition


def get_all_locations():
    return JobLocation.query.order_by(JobLocation.name).all()


def get_all_job_types():
    return JobType.query.order_by(JobType.id).all()


def get_all_industries():
    rows = (
        db.session.query(CompanyInfo.industry)
        .filter(approved_company_condition())
        .filter(CompanyInfo.industry.isnot(None))
        .filter(CompanyInfo.industry != '')
        .distinct()
        .order_by(CompanyInfo.industry)
        .all()
    )

    return [industry for (industry,) in rows]


def get_location_by_id(location_id):
    return JobLocation.query.get(location_id)


def get_job_type_by_id(job_type_id):
    return JobType.query.get(job_type_id)


def get_companies_with_active_jobs(page=1, keyword=None, industry=None, candidate_id=None, follow_filter=None):



    job_count_subquery = (
        db.session.query(
            JobPost.company_id,
            func.count(JobPost.id).label('active_jobs_count')
        )
        .filter(open_job_posts_condition())
        .group_by(JobPost.company_id)
        .subquery()
    )


    query = (
        db.session.query(
            CompanyInfo.id,
            CompanyInfo.company_name,
            CompanyInfo.logo_url,
            CompanyInfo.industry,
            CompanyInfo.company_size,
            CompanyInfo.address,
            job_count_subquery.c.active_jobs_count
        )
        .join(job_count_subquery, CompanyInfo.id == job_count_subquery.c.company_id)


        .filter(approved_company_condition())
    )


    if keyword:
        query = query.filter(CompanyInfo.company_name.ilike(f'%{keyword}%'))
    
    if industry:

        query = query.filter(CompanyInfo.industry.ilike(f'%{industry}%'))
    

    if candidate_id and follow_filter:
        if follow_filter == 'followed':

            query = query.join(
                CompanyFollow,
                (CompanyInfo.id == CompanyFollow.company_id) & 
                (CompanyFollow.candidate_id == candidate_id)
            )
        elif follow_filter == 'not_followed':

            followed_subquery = (
                db.session.query(CompanyFollow.company_id)
                .filter(CompanyFollow.candidate_id == candidate_id)
                .subquery()
            )
            query = query.filter(~CompanyInfo.id.in_(followed_subquery))

    query = query.order_by(job_count_subquery.c.active_jobs_count.desc())

    query, total = apply_pagination(query, page)

    companies = query.all()


    followed_company_ids = set()
    if candidate_id:
        if follow_filter == 'followed':

            followed_company_ids = {company.id for company in companies}
        elif follow_filter == 'not_followed':

            followed_company_ids = set()
        else:
            followed_companies = (
                db.session.query(CompanyFollow.company_id)
                .filter(CompanyFollow.candidate_id == candidate_id)
                .all()
            )
            followed_company_ids = {fc.company_id for fc in followed_companies}


    companies_list = []
    for company in companies:
        companies_list.append({
            'id': company.id,
            'company_name': company.company_name,
            'logo_url': company.logo_url,
            'industry': company.industry,
            'company_size': company.company_size,
            'address': company.address,
            'active_jobs_count': company.active_jobs_count,
            'is_followed': company.id in followed_company_ids          })

    return companies_list, total


def get_company_by_id(company_id):
    company = (
        CompanyInfo.query
        .filter(CompanyInfo.id == company_id)
        .filter(CompanyInfo.status == CompanyStatus.APPROVED)
        .first()
    )

    if not company:
        return None

    return {
        'id': company.id,
        'user_id': company.id,
        'company_name': company.company_name,
        'logo_url': company.logo_url,
        'industry': company.industry,
        'company_size': company.company_size,
        'website': company.website,
        'description': company.description,
        'address': company.address
    }
