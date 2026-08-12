from sqlalchemy import text

from web import app, db
from web.models import NotificationType


def build_enum_definition():
    values = ", ".join(f"'{t.value}'" for t in NotificationType)
    return f"ENUM({values})"


def migrate():
    enum_def = build_enum_definition()

    with app.app_context():
        current = db.session.execute(text("""
            SELECT COLUMN_TYPE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'notifications'
              AND COLUMN_NAME = 'type'
        """)).scalar()

        if current is None:
            print("✗ Không tìm thấy cột notifications.type - kiểm tra lại database")
            return

        print(f"Hiện tại: {current}")
        print(f"Cập nhật: {enum_def.lower()}")

        db.session.execute(text(
            f"ALTER TABLE notifications MODIFY COLUMN type {enum_def} NOT NULL"
        ))
        db.session.commit()

        print("✓ Đã cập nhật enum của notifications.type")


if __name__ == "__main__":
    migrate()
