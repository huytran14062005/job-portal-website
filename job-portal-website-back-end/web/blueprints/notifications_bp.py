from flask import Blueprint, jsonify, request

from web import dao
from web.blueprints.api_errors import handle_api_errors
from web.middleware.auth_middleware import verify_token
from web.services.notification_service import (
    delete_notification_service,
    get_notifications_service,
    mark_all_as_read_service,
    mark_as_read_service,
)

notifications_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')


@notifications_bp.route('', methods=['GET'])
@verify_token
@handle_api_errors
def get_notifications():
    notifications, total, page, per_page = get_notifications_service(
        request.user_id,
        request.args.get('page'),
        request.args.get('per_page')
    )

    notifications_data = [{
        'id': n.id,
        'type': n.type.value,
        'content': n.content,
        'related_type': n.related_type,
        'related_id': n.related_id,
        'is_read': n.is_read,
        'created_at': n.created_at.isoformat()
    } for n in notifications]

    return jsonify({
        'notifications': notifications_data,
        'total': total,
        'page': page,
        'per_page': per_page
    }), 200


@notifications_bp.route('/unread-count', methods=['GET'])
@verify_token
@handle_api_errors
def get_unread_count():
    return jsonify({'unread_count': dao.get_unread_count(request.user_id)}), 200


@notifications_bp.route('/<int:notification_id>/read', methods=['PUT'])
@verify_token
@handle_api_errors
def mark_as_read(notification_id):
    notification = mark_as_read_service(notification_id, request.user_id)

    return jsonify({
        'message': 'Đã đánh dấu đã đọc',
        'notification_id': notification.id
    }), 200


@notifications_bp.route('/mark-all-read', methods=['PUT'])
@verify_token
@handle_api_errors
def mark_all_read():
    mark_all_as_read_service(request.user_id)

    return jsonify({'message': 'Đã đánh dấu tất cả đã đọc'}), 200


@notifications_bp.route('/<int:notification_id>', methods=['DELETE'])
@verify_token
@handle_api_errors
def delete_notification(notification_id):
    delete_notification_service(notification_id, request.user_id)

    return jsonify({'message': 'Đã xóa notification'}), 200
