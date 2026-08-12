from functools import wraps
from flask import request, jsonify
import jwt
import os
from web.models import UserRole


def optional_token(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if auth_header:
            try:
                token = auth_header.split(" ")[1]
                decoded = jwt.decode(
                    token,
                    os.getenv("JWT_SECRET", "secret"),
                    algorithms=["HS256"]
                )
                
                request.user_id = decoded['user_id']
                request.username = decoded['username']
                request.user_role = decoded['role']
            except:
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
            token = auth_header.split(" ")[1]
            decoded = jwt.decode(
                token,
                os.getenv("JWT_SECRET", "secret"),
                algorithms=["HS256"]
            )

            request.user_id = decoded['user_id']
            request.username = decoded['username']
            request.user_role = decoded['role']

        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token đã hết hạn"}), 401
        except jwt.InvalidTokenError:
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

            if company.status == CompanyStatus.REJECT:
                return jsonify({
                    "error": "Tài khoản công ty đã bị từ chối nên không thể sử dụng "
                             "chức năng này. Vui lòng cập nhật lại hồ sơ công ty.",
                    "status": "rejected"
                }), 403

            if company.status != CompanyStatus.APPROVED:
                return jsonify({
                    "error": "Tài khoản công ty đang chờ admin duyệt. Vui lòng đợi.",
                    "status": "pending"
                }), 403

        return f(*args, **kwargs)

    return decorated
