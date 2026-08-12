import hashlib

from web import app, db
from web.models import User, UserRole

USERNAME = "admin"
EMAIL = "admin@jobportal.com"
PASSWORD = "admin123"

if __name__ == "__main__":
    with app.app_context():
        existing = User.query.filter(
            (User.username == USERNAME) | (User.email == EMAIL)
        ).first()

        if existing:
            
            existing.role = UserRole.ADMIN
            existing.password_hash = hashlib.md5(PASSWORD.encode("utf-8")).hexdigest()
            db.session.commit()
            print(f"✅ Đã cập nhật tài khoản admin sẵn có (id={existing.id})")
        else:
            admin = User(
                username=USERNAME,
                email=EMAIL,
                password_hash=hashlib.md5(PASSWORD.encode("utf-8")).hexdigest(),
                role=UserRole.ADMIN
            )
            db.session.add(admin)
            db.session.commit()
            print(f"✅ Đã tạo tài khoản admin (id={admin.id})")

        print(f"   Tên đăng nhập: {USERNAME}")
        print(f"   Mật khẩu:      {PASSWORD}")
