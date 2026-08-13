from web import app, db
from web.models import User, UserRole
from web.utils.password_hasher import hash_password

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
            existing.password_hash = hash_password(PASSWORD)
            db.session.commit()
            print(f"✅ Đã cập nhật tài khoản admin sẵn có (id={existing.id})")
        else:
            admin = User(
                username=USERNAME,
                email=EMAIL,
                password_hash=hash_password(PASSWORD),
                role=UserRole.ADMIN
            )
            db.session.add(admin)
            db.session.commit()
            print(f"✅ Đã tạo tài khoản admin (id={admin.id})")

        print(f"   Tên đăng nhập: {USERNAME}")
        print(f"   Mật khẩu:      {PASSWORD}")
