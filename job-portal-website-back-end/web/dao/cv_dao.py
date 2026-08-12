
from web import db
from web.models import CVFile, Application
from .base_dao import apply_pagination
from web.services.cloudinary_service import delete_cloudinary_image


def create_cv_file(candidate_id, cv_url, name=None, file_name=None, file_size=None):
    cv_file = CVFile(
        candidate_id=candidate_id,
        cv_url=cv_url,
        name=name,
        file_name=file_name,
        file_size=file_size
    )

    db.session.add(cv_file)

    try:

        db.session.flush()


        if not cv_file.name or cv_file.name.strip() == "":
            cv_file.name = f"cv_{cv_file.id}"

        db.session.commit()

        return cv_file
    except Exception as ex:
        db.session.rollback()
        raise Exception(f'Lỗi khi tạo CV: {str(ex)}')


def get_cv_files(candidate_id, page=1, search=None):

    query = CVFile.query.filter(
        CVFile.candidate_id == candidate_id
    )
    


    if search and search.strip():
        search_term = f"%{search.strip().lower()}%"
        


        query = query.filter(
            db.or_(
                db.func.lower(CVFile.name).like(search_term),
                db.func.lower(CVFile.file_name).like(search_term)
            )
        )
    

    query = query.order_by(CVFile.uploaded_at.desc())


    query, total = apply_pagination(query, page)

    return query.all(), total


def get_cv_file_by_id(cv_id, candidate_id=None):
    query = CVFile.query.filter(CVFile.id == cv_id)

    if candidate_id:
        query = query.filter(CVFile.candidate_id == candidate_id)

    return query.first()


def get_cv_files_by_ids(candidate_id, cv_ids):
    return CVFile.query.filter(
        CVFile.id.in_(cv_ids),
        CVFile.candidate_id == candidate_id
    ).all()


def get_cv_ids_used_in_applications(cv_ids):
    rows = (
        db.session.query(Application.cv_file_id)
        .filter(Application.cv_file_id.in_(cv_ids))
        .distinct()
        .all()
    )

    return {cv_file_id for (cv_file_id,) in rows}


def update_cv_name(cv_file, new_name):
    cv_file.name = new_name if new_name and new_name.strip() else f"cv_{cv_file.id}"

    try:
        db.session.commit()
        return True
    except Exception as ex:
        db.session.rollback()
        raise Exception(f'Lỗi khi đổi tên CV: {str(ex)}')


def delete_cv_files(cvs):
    cv_ids_found = [cv.id for cv in cvs]


    deleted_count = 0
    failed_cloudinary = []

    for cv in cvs:
        try:

            success = delete_cloudinary_image(cv.cv_url, resource_type="raw")
            if not success:
                failed_cloudinary.append(cv.id)
        except Exception as e:
            failed_cloudinary.append(cv.id)
            print(f"Không thể xóa file Cloudinary cho CV {cv.id}: {e}")


    try:
        for cv in cvs:
            db.session.delete(cv)
        db.session.commit()
        deleted_count = len(cvs)
    except Exception as ex:
        db.session.rollback()
        raise Exception(f'Lỗi khi xóa CV trong database: {str(ex)}')

    result = {
        "deleted_count": deleted_count,
        "deleted_ids": cv_ids_found
    }

    if failed_cloudinary:
        result["warning"] = f"Đã xóa trong DB nhưng không xóa được file Cloudinary của CV: {failed_cloudinary}"

    return result
