from functools import wraps

import jwt
from flask import current_app, jsonify, request

from web.models import User, UserRole


def _decode_access_token(auth_header):
    scheme, token = auth_header.split()

    if scheme.lower() != "bearer":
        raise jwt.InvalidTokenError

    return jwt.decode(
        token,
        current_app.config["JWT_SECRET"],
        algorithms=["HS256"],
        options={"require": ["user_id", "iat", "exp"]},
    )


def optional_token(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if auth_header:
            try:
                decoded = _decode_access_token(auth_header)

                user = User.query.get(decoded['user_id'])
                if user and not user.is_locked:
                    request.user_id = user.id
                    request.username = user.username
                    request.user_role = user.role.value
            except (jwt.InvalidTokenError, ValueError):
                pass
        
        return f(*args, **kwargs)
    
    return decorated


def verify_token(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')

        if not auth_header:
            return jsonify({"error": "Chưa đăng nhập"}), 401

        try:
            decoded = _decode_access_token(auth_header)

            user = User.query.get(decoded['user_id'])
            if not user:
                return jsonify({"error": "Tài khoản không tồn tại"}), 401

            if user.is_locked:
                return jsonify({"error": "Tài khoản đã bị khóa"}), 403

            request.user_id = user.id
            request.username = user.username
            request.user_role = user.role.value

        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token đã hết hạn"}), 401
        except (jwt.InvalidTokenError, ValueError):
            return jsonify({"error": "Token không hợp lệ"}), 403
        except Exception as ex:
            return jsonify({"error": str(ex)}), 403

        return f(*args, **kwargs)

    return decorated

def verify_role(*allowed_roles):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if request.user_role not in [r.value for r in allowed_roles]:
                return jsonify({"error": "Không có quyền truy cập"}), 403
            return f(*args, **kwargs)

        return decorated

    return decorator


def verify_company_approved(f):
    @wraps(f)
    def decorated(*args, **kwargs):

        if request.user_role == UserRole.NHATUYENDUNG.value:
            from web.models import CompanyInfo, CompanyStatus

            company = CompanyInfo.query.get(request.user_id)

            if not company:
                return jsonify({"error": "Thông tin công ty không tồn tại"}), 404

            if company.status == CompanyStatus.DA_TU_CHOI:
                return jsonify({
                    "error": "Tài khoản công ty đã bị từ chối nên không thể sử dụng "
                             "chức năng này. Vui lòng cập nhật lại hồ sơ công ty.",
                    "status": "rejected"
                }), 403

            if company.status != CompanyStatus.DA_DUYET:
                return jsonify({
                    "error": "Tài khoản công ty đang chờ quản trị viên duyệt. Vui lòng đợi.",
                    "status": "pending"
                }), 403

        return f(*args, **kwargs)

    return decorated
