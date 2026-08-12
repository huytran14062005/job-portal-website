import cloudinary.uploader
from web import app


def upload_cv_to_cloudinary(file):
    if file:
        try:
            res = cloudinary.uploader.upload(
                file,
                folder="job_portal/cvs",
                resource_type="raw",
                use_filename=True,
                unique_filename=True
            )
            return res.get("secure_url")
        except Exception as ex:
            print(f"Lỗi upload CV: {str(ex)}")
            return None
    return None


def apply_pagination(query, page, page_size=None):
    total = query.count()

    if not page or page < 1:
        page = 1

    if page_size is None:
        page_size = app.config.get("APPLICATION_SIZE", 10)

    start = (page - 1) * page_size
    end = start + page_size
    query = query.slice(start, end)

    return query, total
