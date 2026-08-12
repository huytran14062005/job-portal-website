from web import dao
from web.services.exceptions import NotFoundError
from web.services.validators import parse_page, parse_per_page

DEFAULT_PER_PAGE = 20


def get_notifications_service(user_id, page_value, per_page_value):
    page = parse_page(page_value)
    per_page = parse_per_page(per_page_value, DEFAULT_PER_PAGE)

    notifications, total = dao.get_user_notifications(user_id, page, per_page)

    return notifications, total, page, per_page


def _get_own_notification(notification_id, user_id):
    notification = dao.get_notification_for_user(notification_id, user_id)

    if not notification:
        raise NotFoundError("Notification không tồn tại")

    return notification


def mark_as_read_service(notification_id, user_id):
    notification = _get_own_notification(notification_id, user_id)

    return dao.mark_notification_as_read(notification)


def mark_all_as_read_service(user_id):
    return dao.mark_all_as_read(user_id)


def delete_notification_service(notification_id, user_id):
    notification = _get_own_notification(notification_id, user_id)

    return dao.delete_notification(notification)
