from web.models import Notification
from web import db
from sqlalchemy import desc


def get_user_notifications(user_id, page=1, per_page=20):
    from .base_dao import apply_pagination
    
    query = Notification.query.filter_by(user_id=user_id).order_by(desc(Notification.created_at))
    
    query, total = apply_pagination(query, page, page_size=per_page)
    
    notifications = query.all()
    
    return notifications, total


def get_unread_count(user_id):
    return Notification.query.filter_by(user_id=user_id, is_read=False).count()


def get_notification_for_user(notification_id, user_id):
    return Notification.query.filter_by(id=notification_id, user_id=user_id).first()


def mark_notification_as_read(notification):
    notification.is_read = True
    db.session.commit()
    
    return notification


def mark_all_as_read(user_id):
    Notification.query.filter_by(user_id=user_id, is_read=False).update({'is_read': True})
    db.session.commit()
    
    return True


def delete_notification(notification):
    db.session.delete(notification)
    db.session.commit()
    
    return True
