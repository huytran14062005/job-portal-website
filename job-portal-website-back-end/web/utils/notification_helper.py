
from web import db, socketio, user_sockets
from web.models import Notification, NotificationType, CompanyInfo


def create_and_emit_notification(user_id, notification_type, content, related_type=None, related_id=None):
    try:
        
        notification = Notification(
            user_id=user_id,
            type=notification_type,
            content=content,
            related_type=related_type,
            related_id=related_id,
            is_read=False
        )
        
        db.session.add(notification)
        db.session.commit()
        
        
        if user_id in user_sockets:
            socket_id = user_sockets[user_id]
            socketio.emit('new_notification', {
                'id': notification.id,
                'type': notification.type.value,
                'content': notification.content,
                'related_type': notification.related_type,
                'related_id': notification.related_id,
                'is_read': notification.is_read,
                'created_at': notification.created_at.isoformat()
            }, room=socket_id)
            
            print(f"✓ Notification emitted to user {user_id}")
        else:
            print(f"✓ Notification saved (user {user_id} offline)")
        
        return notification
        
    except Exception as e:
        db.session.rollback()
        print(f"✗ Error creating notification: {e}")
        raise


def emit_company_status_changed(user_id, status, approved_at=None):
    if user_id in user_sockets:
        socket_id = user_sockets[user_id]
        socketio.emit('company_status_changed', {
            'company_id': user_id,
            'status': status,
            'approved_at': approved_at
        }, room=socket_id)

        print(f"✓ Company status ({status}) emitted to user {user_id}")
        return True

    print(f"✓ Company status changed (user {user_id} offline)")
    return False


def _get_company_label(company_id):
    company = CompanyInfo.query.get(company_id)

    if company and company.company_name:
        return f" {company.company_name}"

    return ""


def notify_company_approved(company_id):
    content = (
        f"Chúc mừng! Hồ sơ công ty{_get_company_label(company_id)} đã được quản trị viên duyệt. "
        f"Bạn có thể bắt đầu đăng tin tuyển dụng."
    )

    return create_and_emit_notification(
        user_id=company_id,
        notification_type=NotificationType.COMPANY_APPROVED,
        content=content,
        related_type='company',
        related_id=company_id
    )


def notify_company_rejected(company_id, reason=None):
    content = (
        f"Hồ sơ công ty{_get_company_label(company_id)} chưa được hoặc đã bị hủy duyệt."
    )

    if reason and str(reason).strip():
        content += f" Lý do: {str(reason).strip()}"

    content += " Vui lòng cập nhật lại thông tin công ty."

    return create_and_emit_notification(
        user_id=company_id,
        notification_type=NotificationType.COMPANY_REJECTED,
        content=content,
        related_type='company',
        related_id=company_id
    )
