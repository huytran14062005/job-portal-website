from web.dao import company_follow_dao
from web.models import CompanyInfo, CompanyStatus, NotificationType
from web.services.exceptions import NotFoundError, ValidationError
from web.utils.notification_helper import create_and_emit_notification


def toggle_follow_company_service(candidate_id, company_id):
    
    company = CompanyInfo.query.get(company_id)
    if not company:
        raise NotFoundError("Công ty không tồn tại")

    is_followed = company_follow_dao.check_company_followed(candidate_id, company_id)

    
    if is_followed:
        company_follow_dao.unfollow_company(candidate_id, company_id)
        return {"is_followed": False, "message": "Đã bỏ follow công ty"}

    
    if company.status != CompanyStatus.APPROVED:
        raise ValidationError("Công ty này chưa được duyệt")

    company_follow_dao.follow_company(candidate_id, company_id)
    return {"is_followed": True, "message": "Đã follow công ty thành công"}


def notify_followers_new_job(company_id, company_name, job_id, job_title):
    from web.models import CompanyFollow
    
    
    followers = CompanyFollow.query.filter(
        CompanyFollow.company_id == company_id
    ).all()
    
    if not followers:
        print(f"✓ No followers for company {company_id}, skip notification")
        return
    
    
    notification_count = 0
    for follow in followers:
        try:
            content = f'Công ty {company_name} vừa đăng tuyển vị trí mới: "{job_title}". Xem ngay!'
            
            create_and_emit_notification(
                user_id=follow.candidate_id,
                notification_type=NotificationType.NEW_JOB,
                content=content,
                related_type='job_post',
                related_id=job_id
            )
            notification_count += 1
        except Exception as e:
            print(f"✗ Error sending notification to candidate {follow.candidate_id}: {e}")
    
    print(f"✓ Sent {notification_count} new job notifications to followers of company {company_id}")
