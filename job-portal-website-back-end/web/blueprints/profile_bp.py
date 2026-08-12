from flask import Blueprint, jsonify, request

from web.blueprints.api_errors import handle_api_errors
from web.middleware.auth_middleware import verify_role, verify_token
from web.models import UserRole
from web.services.applicant_profile_service import (
    get_profile_service,
    replace_avatar_service,
    update_profile_service,
)
from web.services.company_profile_service import (
    get_company_profile_service,
    replace_logo_service,
    update_company_profile_service,
)

profile_bp = Blueprint('profile', __name__, url_prefix='/api')


@profile_bp.route('/profile/me', methods=['GET'])
@verify_token
@handle_api_errors
def get_profile():
    user, profile = get_profile_service(request.user_id)

    return jsonify({
        "user_id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role.value,
        "full_name": profile.full_name,
        "gender": profile.gender.value,
        "date_of_birth": profile.date_of_birth.strftime("%d-%m-%Y") if profile.date_of_birth else None,
        "phone": profile.phone,
        "address": profile.address,
        "avatar_url": profile.avatar_url,
        "description": profile.description
    }), 200


@profile_bp.route('/profile/me', methods=['PUT'])
@verify_token
@verify_role(UserRole.UNGVIEN)
@handle_api_errors
def update_profile_view():
    data = request.form.to_dict()
    user_id = request.user_id

    _, current_profile = get_profile_service(user_id)

    avatar_url = replace_avatar_service(current_profile, request.files.get('avatar'))


    update_profile_service(
        user_id=user_id,
        full_name=data.get('full_name', current_profile.full_name),
        gender=data.get('gender', current_profile.gender.value),
        date_of_birth=data.get(
            'date_of_birth',
            current_profile.date_of_birth.strftime("%d-%m-%Y") if current_profile.date_of_birth else None
        ),
        phone=data.get('phone', current_profile.phone),
        address=data.get('address', current_profile.address),
        description=data.get('description', current_profile.description),
        profile=current_profile
    )

    return jsonify({
        "message": "Cập nhật hồ sơ thành công!",
        "avatar_url": avatar_url
    }), 200




@profile_bp.route('/company/profile', methods=['GET'])
@verify_token
@verify_role(UserRole.NHATUYENDUNG)
@handle_api_errors
def get_company_profile():
    user, company_profile = get_company_profile_service(request.user_id)

    return jsonify({
        "user_id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role.value,
        "company_name": company_profile.company_name,
        "logo_url": company_profile.logo_url,
        "industry": company_profile.industry,
        "company_size": company_profile.company_size,
        "website": company_profile.website,
        "address": company_profile.address,
        "description": company_profile.description,
        "status": company_profile.status.value if company_profile.status else None,
        "approved_at": company_profile.approved_at.isoformat() if company_profile.approved_at else None
    }), 200


@profile_bp.route('/company/profile', methods=['PUT'])
@verify_token
@verify_role(UserRole.NHATUYENDUNG)
@handle_api_errors
def update_company_profile_view():
    data = request.form.to_dict()
    user_id = request.user_id

    _, current_profile = get_company_profile_service(user_id)

    logo_url_to_update = replace_logo_service(current_profile, request.files.get('logo'))


    update_company_profile_service(
        user_id=user_id,
        company_name=data.get('company_name', current_profile.company_name),
        industry=data.get('industry', current_profile.industry),
        company_size=data.get('company_size', current_profile.company_size),
        website=data.get('website', current_profile.website),
        address=data.get('address', current_profile.address),
        description=data.get('description', current_profile.description),
        logo_url=logo_url_to_update,
        company_profile=current_profile
    )

    return jsonify({
        "message": "Cập nhật company profile thành công!",
        "logo_url": current_profile.logo_url
    }), 200
