from web import db
from web.models import CompanyFollow


def follow_company(candidate_id, company_id):
    company_follow = CompanyFollow(
        candidate_id=candidate_id,
        company_id=company_id
    )
    db.session.add(company_follow)

    try:
        db.session.commit()
        return True
    except Exception as ex:
        db.session.rollback()
        raise Exception(f'Lỗi khi follow công ty: {str(ex)}')


def unfollow_company(candidate_id, company_id):
    company_follow = CompanyFollow.query.filter(
        CompanyFollow.candidate_id == candidate_id,
        CompanyFollow.company_id == company_id
    ).first()

    if company_follow:
        db.session.delete(company_follow)

    try:
        db.session.commit()
        return True
    except Exception as ex:
        db.session.rollback()
        raise Exception(f'Lỗi khi unfollow công ty: {str(ex)}')


def check_company_followed(candidate_id, company_id):
    company_follow = CompanyFollow.query.filter(
        CompanyFollow.candidate_id == candidate_id,
        CompanyFollow.company_id == company_id
    ).first()

    return company_follow is not None


def get_company_followers_count(company_id):
    return CompanyFollow.query.filter(
        CompanyFollow.company_id == company_id
    ).count()
