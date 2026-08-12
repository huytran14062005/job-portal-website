from datetime import datetime, timedelta, date
from sqlalchemy import func
from web import db
from web.models import CompanyInfo, JobPost, Application, ApplicationStatus, User, UserRole


def get_company_statistics(from_date=None, to_date=None):
    start = datetime.combine(from_date, datetime.min.time()) if from_date else None

    end = datetime.combine(to_date + timedelta(days=1), datetime.min.time()) if to_date else None


    job_query = db.session.query(
        JobPost.company_id.label('company_id'),
        func.count(JobPost.id).label('job_count'),
        func.avg((JobPost.min_salary + JobPost.max_salary) / 2).label('avg_salary')
    )

    if start:
        job_query = job_query.filter(JobPost.created_at >= start)
    if end:
        job_query = job_query.filter(JobPost.created_at < end)

    job_stats = job_query.group_by(JobPost.company_id).subquery()


    application_query = (
        db.session.query(
            JobPost.company_id.label('company_id'),
            func.count(Application.id).label('application_count')
        )
        .join(Application, Application.job_post_id == JobPost.id)
    )

    if start:
        application_query = application_query.filter(Application.applied_at >= start)
    if end:
        application_query = application_query.filter(Application.applied_at < end)

    application_stats = application_query.group_by(JobPost.company_id).subquery()


    status_query = (
        db.session.query(
            JobPost.company_id,
            Application.status,
            func.count(Application.id)
        )
        .join(Application, Application.job_post_id == JobPost.id)
    )

    if start:
        status_query = status_query.filter(Application.applied_at >= start)
    if end:
        status_query = status_query.filter(Application.applied_at < end)

    status_counts = {}
    for company_id, app_status, count in status_query.group_by(
            JobPost.company_id, Application.status).all():
        company_map = status_counts.setdefault(company_id, {})
        if app_status:
            company_map[app_status.value] = int(count or 0)

    rows = (
        db.session.query(
            CompanyInfo.id,
            CompanyInfo.company_name,
            CompanyInfo.company_size,
            CompanyInfo.status,
            func.coalesce(job_stats.c.job_count, 0).label('job_count'),
            job_stats.c.avg_salary,
            func.coalesce(application_stats.c.application_count, 0).label('application_count')
        )
        .outerjoin(job_stats, job_stats.c.company_id == CompanyInfo.id)
        .outerjoin(application_stats, application_stats.c.company_id == CompanyInfo.id)
        .order_by(CompanyInfo.company_name)
        .all()
    )

    companies = []
    for company_id, company_name, company_size, status, job_count, avg_salary, application_count in rows:

        by_status = status_counts.get(company_id, {})
        application_status = {
            app_status.value: by_status.get(app_status.value, 0)
            for app_status in ApplicationStatus
        }

        companies.append({
            'id': company_id,
            'company_name': company_name or f'Công ty #{company_id}',
            'company_size': int(company_size or 0),
            'status': status.value if status else None,
            'job_count': int(job_count or 0),
            'application_count': int(application_count or 0),
            'application_status': application_status,
            'avg_salary': int(avg_salary) if avg_salary else 0
        })

    summary = {
        'total_companies': len(companies),
        'total_jobs': sum(c['job_count'] for c in companies),
        'total_applications': sum(c['application_count'] for c in companies)
    }

    return companies, summary


MAX_USER_STAT_MONTHS = 36


def _month_sequence(first, last):
    sequence = []
    year, month = first

    while (year, month) <= last:
        sequence.append((year, month))
        month += 1
        if month == 13:
            month = 1
            year += 1

    return sequence


def get_user_registration_stats(from_date=None, to_date=None):
    today = date.today()


    last_month = (to_date.year, to_date.month) if to_date else (today.year, today.month)

    if from_date:
        first_month = (from_date.year, from_date.month)
    else:

        year, month = last_month
        month -= 11
        while month < 1:
            month += 12
            year -= 1
        first_month = (year, month)

    if first_month > last_month:
        first_month = last_month

    sequence = _month_sequence(first_month, last_month)


    if len(sequence) > MAX_USER_STAT_MONTHS:
        sequence = sequence[-MAX_USER_STAT_MONTHS:]


    start = (
        datetime.combine(from_date, datetime.min.time())
        if from_date
        else datetime(sequence[0][0], sequence[0][1], 1)
    )
    end = datetime.combine(to_date + timedelta(days=1), datetime.min.time()) if to_date else None


    created_year = func.extract('year', User.created_at)
    created_month = func.extract('month', User.created_at)
    counter = {}
    query = (
        db.session.query(
            User.role,
            created_year.label('year'),
            created_month.label('month'),
            func.count(User.id).label('total')
        )
        .filter(User.role != UserRole.ADMIN, User.created_at >= start)
    )

    if end:
        query = query.filter(User.created_at < end)

    rows = query.group_by(User.role, created_year, created_month).all()

    for role, year, month, total in rows:
        if not year or not month or not role:
            continue

        key = (int(year), int(month))
        bucket = counter.setdefault(key, {'ungvien': 0, 'nhatuyendung': 0})
        if role.value in bucket:
            bucket[role.value] += int(total or 0)

    points = []
    for year, month in sequence:
        bucket = counter.get((year, month), {})
        points.append({
            'period': f'{year}-{month:02d}',
            'label': f'{month:02d}/{year}',
            'ungvien': bucket.get('ungvien', 0),
            'nhatuyendung': bucket.get('nhatuyendung', 0)
        })


    totals = dict(
        db.session.query(User.role, func.count(User.id))
        .filter(User.role != UserRole.ADMIN)
        .group_by(User.role)
        .all()
    )

    total_ungvien = int(totals.get(UserRole.UNGVIEN, 0))
    total_nhatuyendung = int(totals.get(UserRole.NHATUYENDUNG, 0))

    summary = {
        'total_ungvien': total_ungvien,
        'total_nhatuyendung': total_nhatuyendung,
        'total_users': total_ungvien + total_nhatuyendung
    }

    return points, summary
