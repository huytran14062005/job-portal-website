from web import dao
from web.services.exceptions import NotFoundError, ValidationError
from web.services.validators import (
    Limits,
    require_id_list,
    require_text,
    require_upload_file,
    validate_file_extension,
    validate_file_size,
)


def get_own_cv(cv_id, candidate_id):
    cv_file = dao.get_cv_file_by_id(cv_id, candidate_id)

    if not cv_file:
        raise NotFoundError("CV không tồn tại hoặc không thuộc về bạn")

    return cv_file


def upload_cv_service(candidate_id, cv_file, name=None):
    
    require_upload_file(cv_file, "file CV")

    
    validate_file_extension(cv_file, Limits.CV_ALLOWED_EXTENSIONS, "file CV")

    
    file_size = validate_file_size(cv_file, Limits.CV_MAX_SIZE_BYTES, "File CV")

    
    cv_url = dao.upload_cv_to_cloudinary(cv_file)
    if not cv_url:
        raise Exception("Upload CV thất bại")

    
    return dao.create_cv_file(
        candidate_id=candidate_id,
        cv_url=cv_url,
        name=name,
        file_name=cv_file.filename,
        file_size=file_size
    )


def get_cv_list_service(candidate_id, page=1, search=None):
    return dao.get_cv_files(candidate_id, page, search)


def update_cv_name_service(cv_id, candidate_id, new_name):
    
    clean_name = require_text(new_name, "Tên CV", Limits.CV_NAME_MAX)

    
    cv_file = get_own_cv(cv_id, candidate_id)

    return dao.update_cv_name(cv_file, clean_name)


def delete_cvs_service(candidate_id, cv_ids):
    
    if not cv_ids:
        raise ValidationError("Chưa chọn CV để xóa")

    ids = require_id_list(cv_ids, "Danh sách CV")

    
    cvs = dao.get_cv_files_by_ids(candidate_id, ids)
    if not cvs:
        raise NotFoundError("Không tìm thấy CV nào để xóa")

    
    used_cv_ids = dao.get_cv_ids_used_in_applications([cv.id for cv in cvs])
    if used_cv_ids:
        used_names = [
            cv.name or cv.file_name or f"CV #{cv.id}"
            for cv in cvs
            if cv.id in used_cv_ids
        ]
        raise ValidationError(
            "Không thể xóa CV đang được sử dụng trong đơn ứng tuyển: "
            + ", ".join(used_names)
        )

    return dao.delete_cv_files(cvs)
