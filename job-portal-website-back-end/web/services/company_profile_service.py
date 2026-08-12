from web import dao
from web.models import UserRole
from web.services.exceptions import AppError, NotFoundError
from web.services.validators import (
    Limits,
    optional_non_negative_int,
    optional_text,
    require_text,
    validate_image_upload,
)


def get_company_profile_service(user_id):
    user = dao.get_user_by_id(user_id)

    if not user:
        raise NotFoundError("User không tồn tại")

    if user.role != UserRole.NHATUYENDUNG:
        raise NotFoundError("Tài khoản này không phải nhà tuyển dụng")

    
    return user, dao.ensure_company_profile(user_id)


def replace_logo_service(company_profile, logo_file):
    from web.services.cloudinary_service import replace_cloudinary_image

    if not logo_file or not logo_file.filename:
        return None

    
    validate_image_upload(logo_file, "Logo công ty")

    success, new_logo_url, error = replace_cloudinary_image(
        old_url=company_profile.logo_url,
        new_file=logo_file,
        folder='company_logos'
    )

    if not success:
        raise AppError(error or "Upload logo thất bại", status_code=500)

    return new_logo_url


def update_company_profile_service(user_id, company_name, industry, company_size, website, address,
                                   description, logo_url=None, company_profile=None):
    
    if company_profile is None:
        company_profile = dao.get_company_profile(user_id)

    if not company_profile:
        raise NotFoundError("Company profile không tồn tại")

    
    size = optional_non_negative_int(company_size, "Quy mô công ty")

    return dao.update_company_profile(
        company_profile=company_profile,
        company_name=require_text(company_name, "Tên công ty", Limits.COMPANY_NAME_MAX),  
        industry=optional_text(industry, "Ngành nghề", Limits.INDUSTRY_MAX),              
        company_size=size if size is not None else 0,                                     
        website=optional_text(website, "Website", Limits.WEBSITE_MAX),                    
        address=optional_text(address, "Địa chỉ"),                                        
        description=optional_text(description, "Mô tả công ty"),                          
        logo_url=logo_url                                                                 
    )
