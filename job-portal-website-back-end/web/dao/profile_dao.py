from web import db
from web.models import ApplicantInfo, CompanyInfo, Gender, CompanyStatus


def build_applicant_profile(user_id=None):
    return ApplicantInfo(
        id=user_id,
        full_name='',
        gender=Gender.KHAC,
        date_of_birth=None,
        phone='',
        address='',
        avatar_url='',
        description=''
    )


def get_applicant_profile(user_id):
    return ApplicantInfo.query.filter(ApplicantInfo.id == user_id).first()


def ensure_applicant_profile(user_id):
    profile = get_applicant_profile(user_id)

    if profile:
        return profile

    profile = build_applicant_profile(user_id)

    db.session.add(profile)

    try:
        db.session.commit()
        return profile
    except Exception as ex:
        db.session.rollback()
        raise Exception(f'Lỗi tạo profile: {str(ex)}')


def update_profile(profile, full_name, gender, date_of_birth, phone, address, description,
                   avatar_url=None):
    profile.full_name = full_name
    profile.gender = gender
    profile.date_of_birth = date_of_birth
    profile.phone = phone
    profile.address = address
    profile.description = description

    if avatar_url is not None:
        profile.avatar_url = avatar_url

    try:
        db.session.commit()
        return True
    except Exception as ex:
        db.session.rollback()
        raise Exception(f'Lỗi cập nhật profile: {str(ex)}!')




def build_company_profile(user_id=None):
    return CompanyInfo(
        id=user_id,
        company_name='',
        logo_url='',
        industry='',
        company_size=0,
        website='',
        description='',
        address='',
        status=CompanyStatus.PENDING,
    )


def get_company_profile(user_id):
    return CompanyInfo.query.filter(CompanyInfo.id == user_id).first()


def ensure_company_profile(user_id):
    company_profile = get_company_profile(user_id)

    if company_profile:
        return company_profile

    company_profile = build_company_profile(user_id)

    db.session.add(company_profile)

    try:
        db.session.commit()
        return company_profile
    except Exception as ex:
        db.session.rollback()
        raise Exception(f'Lỗi tạo company profile: {str(ex)}')


def update_company_profile(company_profile, company_name, industry, company_size, website, address,
                           description, logo_url=None):
    company_profile.company_name = company_name
    company_profile.industry = industry
    company_profile.company_size = company_size
    company_profile.website = website
    company_profile.address = address
    company_profile.description = description

    if logo_url is not None:
        company_profile.logo_url = logo_url

    try:
        db.session.commit()
        return True
    except Exception as ex:
        db.session.rollback()
        raise Exception(f'Lỗi cập nhật company profile: {str(ex)}!')
