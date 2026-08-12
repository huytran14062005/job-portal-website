from web import app, db, dao
from web.models import ApplicantInfo, CompanyInfo, User, UserRole


def find_users_missing_profile(role, profile_model):
    return (
        User.query
        .outerjoin(profile_model, profile_model.id == User.id)
        .filter(User.role == role, profile_model.id.is_(None))
        .order_by(User.id)
        .all()
    )


def backfill_profiles():
    applicants = find_users_missing_profile(UserRole.UNGVIEN, ApplicantInfo)
    companies = find_users_missing_profile(UserRole.NHATUYENDUNG, CompanyInfo)

    for user in applicants:
        db.session.add(dao.build_applicant_profile(user.id))
        print(f"   + applicant_info cho user #{user.id} ({user.username})")

    for user in companies:
        db.session.add(dao.build_company_profile(user.id))
        print(f"   + company_info   cho user #{user.id} ({user.username})")

    if not applicants and not companies:
        return 0, 0

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise

    return len(applicants), len(companies)


if __name__ == "__main__":
    with app.app_context():
        try:
            applicant_count, company_count = backfill_profiles()
        except Exception as ex:
            print(f"❌ Vá hồ sơ thất bại, dữ liệu giữ nguyên: {ex}")
        else:
            if not applicant_count and not company_count:
                print("✅ Mọi tài khoản đều đã có hồ sơ, không cần vá gì thêm.")
            else:
                print(
                    f"✅ Đã tạo {applicant_count} hồ sơ ứng viên "
                    f"và {company_count} hồ sơ công ty."
                )
