from datetime import date

from web import app, dao
from web.models import (Application, ApplicantInfo, ApplicationStatus, CompanyStatus,
                        NotificationType, PostStatus)
from web.services.exceptions import NotFoundError, PermissionDeniedError, ValidationError
from web.services.validators import parse_enum, parse_enum_optional






def parse_application_status(status_value):
    return parse_enum(ApplicationStatus, status_value, "Trạng thái")


def parse_application_status_filter(status_value):
    return parse_enum_optional(ApplicationStatus, status_value)






def get_reapply_info(application, job_status=None, job_deadline=None, company_status=None):
    max_times = app.config["MAX_APPLY_TIMES"]
    applied_times = application.apply_count or 1

    info = {
        "can_reapply": False,
        "reason": None,
        "apply_count": applied_times,
        "attempts_left": max(max_times - applied_times, 0)
    }

    
    if application.status == ApplicationStatus.DA_NOP:
        info["reason"] = "Đơn ứng tuyển của bạn đang chờ nhà tuyển dụng duyệt"
        return info

    
    if application.status == ApplicationStatus.DA_DUYET:
        info["reason"] = "Chúc mừng, đơn ứng tuyển của bạn đã được duyệt"
        return info

    

    
    if company_status is not None and company_status != CompanyStatus.APPROVED:
        info["reason"] = "Công việc này hiện không nhận hồ sơ"
        return info

    if job_status == PostStatus.HET_HAN:
        info["reason"] = "Công việc này đã hết hạn nhận hồ sơ"
        return info

    if job_status is not None and job_status != PostStatus.HOAT_DONG:
        info["reason"] = "Công việc này không còn nhận hồ sơ"
        return info

    if job_deadline and job_deadline < date.today():
        info["reason"] = "Công việc này đã hết hạn nhận hồ sơ"
        return info

    if info["attempts_left"] <= 0:
        info["reason"] = f"Đã đạt số lần nộp tối đa là {max_times}"
        return info

    info["can_reapply"] = True
    return info


def get_apply_state_service(candidate_id, job_id):
    from web.models import JobPost

    max_apply_times = app.config["MAX_APPLY_TIMES"]
    application = dao.get_application_by_job(candidate_id, job_id)

    if not application:
        return {
            "job_id": job_id,
            "is_applied": False,
            "status": None,
            "can_reapply": False,
            "reason": None,
            "apply_count": 0,
            "attempts_left": max_apply_times,
            "max_apply_times": max_apply_times
        }

    job_post = JobPost.query.get(job_id)
    reapply_info = get_reapply_info(
        application,
        job_post.status if job_post else None,
        job_post.deadline if job_post else None,
        job_post.company.status if job_post and job_post.company else None
    )

    return {
        "job_id": job_id,
        "is_applied": True,
        "status": application.status.value,
        "max_apply_times": max_apply_times,
        **reapply_info
    }






def apply_job_service(candidate_id, job_post_id, cv_file=None, cv_file_id=None):
    from web.models import JobPost
    from web.services.cv_service import get_own_cv, upload_cv_service

    
    job_post = JobPost.query.get(job_post_id)
    if not job_post:
        raise NotFoundError("Công việc không tồn tại")

    
    if job_post.status == PostStatus.HET_HAN:
        raise ValidationError("Công việc này đã hết hạn nhận hồ sơ")

    if job_post.status != PostStatus.HOAT_DONG:
        raise ValidationError("Công việc này không còn hoạt động")

    
    if not job_post.company or job_post.company.status != CompanyStatus.APPROVED:
        raise ValidationError("Công việc này hiện không nhận hồ sơ")

    
    if dao.is_job_expired(job_post.deadline, job_post.status):
        raise ValidationError("Công việc này đã hết hạn nhận hồ sơ")

    
    old_application = dao.get_application_by_job(candidate_id, job_post_id)
    if old_application:
        reapply_info = get_reapply_info(
            old_application, job_post.status, job_post.deadline, job_post.company.status
        )

        if not reapply_info["can_reapply"]:
            raise ValidationError(reapply_info["reason"])

    
    if cv_file_id:
        target_cv = get_own_cv(cv_file_id, candidate_id)
    elif cv_file:
        target_cv = upload_cv_service(candidate_id, cv_file, name=None)
    else:
        raise ValidationError("Vui lòng chọn CV hoặc upload CV mới")

    
    if old_application:
        application = dao.reapply_job_with_cv_file(old_application, target_cv)
    else:
        application = dao.apply_job_with_cv_file(candidate_id, job_post_id, target_cv)

    _notify_company_new_application(job_post, candidate_id, application, is_reapply=bool(old_application))

    return application






def get_application_detail_service(application_id, company_id):
    application = dao.get_application_by_id_for_company(application_id, company_id)

    if not application:
        raise NotFoundError("Đơn ứng tuyển không tồn tại hoặc bạn không có quyền xem")

    if application.job_post.company_id != company_id:
        raise NotFoundError("Bạn không có quyền xem đơn này")
    return application


def update_application_status_service(application_id, company_id, status_value):
    
    new_status = parse_application_status(status_value)

    
    if not company_id:
        raise PermissionDeniedError("Bạn không có quyền cập nhật đơn ứng tuyển")

    application = Application.query.get(application_id)
    if not application:
        raise NotFoundError("Đơn ứng tuyển không tồn tại")

    job_post = application.job_post
    if not job_post or job_post.company_id != company_id:
        raise PermissionDeniedError("Bạn không có quyền cập nhật đơn ứng tuyển của công ty khác")

    
    
    if application.status == ApplicationStatus.DA_DUYET and new_status != ApplicationStatus.DA_DUYET:
        raise ValidationError(
            "Đơn ứng tuyển đã được duyệt nên không thể đổi sang trạng thái khác"
        )

    
    application = dao.update_application_status(application, new_status)

    _notify_candidate_status_changed(application, new_status)

    return application






def _notify_company_new_application(job_post, candidate_id, application, is_reapply):
    try:
        from web.utils.notification_helper import create_and_emit_notification

        candidate = ApplicantInfo.query.get(candidate_id)
        candidate_name = candidate.full_name if candidate else "Ứng viên"
        action_text = "nộp lại đơn" if is_reapply else "nộp đơn"

        create_and_emit_notification(
            user_id=job_post.company_id,
            notification_type=NotificationType.NEW_APPLICATION,
            content=(
                f'{candidate_name} vừa {action_text} ứng tuyển cho vị trí '
                f'"{job_post.title}". Hãy xem xét hồ sơ ngay!'
            ),
            related_type='application',
            related_id=application.id
        )
    except Exception as ex:
        print(f"✗ Failed to create notification for company: {ex}")


def _notify_candidate_status_changed(application, new_status):
    try:
        from web.utils.notification_helper import create_and_emit_notification

        job_title = application.job_post.title
        company_name = application.job_post.company.company_name

        if new_status == ApplicationStatus.DA_DUYET:
            content = (
                f'Chúc mừng! Đơn ứng tuyển của bạn cho vị trí "{job_title}" tại {company_name} '
                'đã được duyệt. Nhà tuyển dụng sẽ liên hệ với bạn trong thời gian sớm nhất.'
            )
        elif new_status == ApplicationStatus.TU_CHOI:
            content = (
                f'Rất tiếc, đơn ứng tuyển của bạn cho vị trí "{job_title}" tại {company_name} '
                'đã bị từ chối. Đừng nản lòng, hãy tiếp tục cố gắng với các cơ hội khác!'
            )
        else:
            content = (
                f'Trạng thái đơn ứng tuyển của bạn cho vị trí "{job_title}" tại {company_name} '
                f'đã được cập nhật thành "{new_status.value}".'
            )

        create_and_emit_notification(
            user_id=application.candidate_id,
            notification_type=NotificationType.APPLICATION_STATUS,
            content=content,
            related_type='application',
            related_id=application.id
        )
    except Exception as ex:
        print(f"✗ Failed to create notification: {ex}")
