
from datetime import datetime
from enum import Enum as UserEnum
import uuid

from flask_login import UserMixin
from sqlalchemy import Boolean, Column, Date, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import backref, relationship

from web import db
from web.utils.date_parser import utc_now_naive


class UserRole(UserEnum):
    UNGVIEN = "ungvien"
    NHATUYENDUNG = "nhatuyendung"
    QUANTRIVIEN = "quantrivien"


class Gender(UserEnum):
    NAM = "nam"
    NU = "nữ"
    KHAC = "khác"


class ApplicationStatus(UserEnum):
    DA_NOP = "đã nộp"
    DA_DUYET = "đã duyệt"
    TU_CHOI = "từ chối"


class PostStatus(UserEnum):
    HOAT_DONG = "hoạt động"
    HET_HAN = "hết hạn"
    AN = "ẩn"

class CompanyStatus(UserEnum):
    CHO_DUYET = "chờ duyệt"
    DA_DUYET = "đã duyệt"
    DA_TU_CHOI = "đã từ chối"

class NotificationType(UserEnum):
    DON_UNG_TUYEN_MOI = "đơn ứng tuyển mới"
    TRANG_THAI_DON = "trạng thái đơn"
    TIN_NHAN_MOI = "tin nhắn mới"
    CONG_VIEC_MOI = "công việc mới"
    SAP_HET_HAN = "sắp hết hạn"
    CONG_TY_DUOC_DUYET = "công ty được duyệt"
    CONG_TY_BI_TU_CHOI = "công ty bị từ chối"

class BaseModel(db.Model):
    __abstract__ = True
    id = Column(Integer, primary_key=True, autoincrement=True)


class User(BaseModel, UserMixin):
    __tablename__ = "users"

    username = Column(String(50), nullable=False, unique=True)
    email = Column(String(100), nullable=False, unique=True)
    password_hash = Column(String(200), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    is_locked = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.now)

    applicant_info = relationship("ApplicantInfo", backref="user", uselist=False, cascade="all, delete-orphan")
    company_info = relationship("CompanyInfo", backref="user", uselist=False, cascade="all, delete-orphan")
    refresh_sessions = relationship("RefreshSession", backref="user", lazy=True, cascade="all, delete-orphan")

    @property
    def chat_uid(self):
        created_at = self.created_at.isoformat() if self.created_at else ""
        value = f"job-portal:{self.id}:{self.username}:{created_at}"
        return str(uuid.uuid5(uuid.NAMESPACE_URL, value))


class RefreshSession(BaseModel):
    __tablename__ = "refresh_sessions"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token_hash = Column(String(64), nullable=False, unique=True, index=True)
    expires_at = Column(DateTime, nullable=False)
    revoked_at = Column(DateTime)
    created_at = Column(DateTime, nullable=False, default=datetime.now)


class ApplicantInfo(BaseModel):
    __tablename__ = "applicant_info"

    id = Column(Integer, ForeignKey("users.id"), nullable=False, primary_key=True)
    full_name = Column(String(100))
    gender = Column(Enum(Gender), default=Gender.KHAC)
    date_of_birth = Column(Date)
    phone = Column(String(20))
    address = Column(Text)
    avatar_url = Column(Text)
    description = Column(Text)

    applications = relationship("Application", backref="candidate", lazy=True, cascade="all, delete-orphan")
    cv_files = relationship("CVFile", backref="candidate", lazy=True, cascade="all, delete-orphan")
    saved_jobs = relationship("SavedJob", backref="candidate", lazy=True, cascade="all, delete-orphan")


class CompanyInfo(BaseModel):
    __tablename__ = "company_info"

    id = Column(Integer, ForeignKey("users.id"), nullable=False, primary_key=True)
    company_name = Column(String(255), nullable=False)
    logo_url = Column(Text)
    industry = Column(String(100))
    company_size = Column(Integer)
    website = Column(String(255))
    description = Column(Text)
    address = Column(Text)
    status = Column(Enum(CompanyStatus), default=CompanyStatus.CHO_DUYET)
    approved_at = Column(DateTime)

    job_posts = relationship("JobPost", backref="company", lazy=True, cascade="all, delete-orphan")


class JobLocation(BaseModel):
    __tablename__ = "job_locations"

    name = Column(String(100), nullable=False)
    job_posts = relationship("JobPost", backref="location", lazy=True)


class JobType(BaseModel):
    __tablename__ = "job_types"

    name = Column(String(100), nullable=False)
    job_posts = relationship("JobPost", backref="job_type", lazy=True)


class JobPost(BaseModel):
    __tablename__ = "job_posts"

    title = Column(String(255), nullable=False)
    min_salary = Column(Integer)
    max_salary = Column(Integer)
    description = Column(Text)
    requirements = Column(Text)
    benefits = Column(Text)
    deadline = Column(Date)
    status = Column(Enum(PostStatus), default=PostStatus.HOAT_DONG)
    created_at = Column(DateTime, default=datetime.now)

    location_id = Column(Integer, ForeignKey("job_locations.id"))
    job_type_id = Column(Integer, ForeignKey("job_types.id"))
    company_id = Column(Integer, ForeignKey("company_info.id"), nullable=False)

    applications = relationship("Application", backref="job_post", lazy=True, cascade="all, delete-orphan")


class SavedJob(BaseModel):
    __tablename__ = "saved_jobs"

    saved_at = Column(DateTime, default=datetime.now, nullable=False)
    candidate_id = Column(Integer, ForeignKey("applicant_info.id"), nullable=False)
    job_post_id = Column(Integer, ForeignKey("job_posts.id"), nullable=False)

    job_post = relationship(
        "JobPost",
        backref=backref("saved_by_candidates", lazy=True, cascade="all, delete-orphan"),
        lazy=True,
    )


class CVFile(BaseModel):
    __tablename__ = "cv_files"

    candidate_id = Column(Integer, ForeignKey("applicant_info.id"), nullable=False)
    name = Column(String(255))
    cv_url = Column(Text, nullable=False)
    file_name = Column(String(255))
    file_size = Column(Integer)
    uploaded_at = Column(DateTime, default=datetime.now)

    applications = relationship("Application", backref="cv_file", lazy=True, cascade="all, delete-orphan")


class Application(BaseModel):
    __tablename__ = "applications"

    cv_file_id = Column(Integer, ForeignKey("cv_files.id"), nullable=False)
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.DA_NOP)
    applied_at = Column(DateTime, default=datetime.now)
    rejected_at = Column(DateTime)
    apply_count = Column(Integer, default=1)
    job_post_id = Column(Integer, ForeignKey("job_posts.id"), nullable=False)
    candidate_id = Column(Integer, ForeignKey("applicant_info.id"), nullable=False)


class JobReview(BaseModel):
    __tablename__ = "job_reviews"

    rating = Column(Integer, nullable=False)
    comment = Column(Text)
    created_at = Column(DateTime, default=utc_now_naive)
    updated_at = Column(DateTime, default=utc_now_naive, onupdate=utc_now_naive)

    candidate_id = Column(Integer, ForeignKey("applicant_info.id"), nullable=False)
    job_post_id = Column(Integer, ForeignKey("job_posts.id"), nullable=False)

    candidate = relationship(
        "ApplicantInfo",
        backref=backref("job_reviews", lazy=True, cascade="all, delete-orphan"),
        lazy=True,
    )
    job_post = relationship(
        "JobPost",
        backref=backref("reviews", lazy=True, cascade="all, delete-orphan"),
        lazy=True,
    )


class CompanyFollow(BaseModel):
    __tablename__ = "company_follows"

    followed_at = Column(DateTime, default=datetime.now, nullable=False)
    candidate_id = Column(Integer, ForeignKey("applicant_info.id"), nullable=False)
    company_id = Column(Integer, ForeignKey("company_info.id"), nullable=False)

    candidate = relationship(
        "ApplicantInfo",
        backref=backref("followed_companies", lazy=True, cascade="all, delete-orphan"),
        lazy=True,
    )
    company = relationship(
        "CompanyInfo",
        backref=backref("followers", lazy=True, cascade="all, delete-orphan"),
        lazy=True,
    )


class Notification(BaseModel):
    __tablename__ = "notifications"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(Enum(NotificationType), nullable=False)
    content = Column(Text, nullable=False)
    related_type = Column(String(50))
    related_id = Column(Integer)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now_naive)

    user = relationship(
        "User",
        backref=backref("notifications", lazy=True, cascade="all, delete-orphan"),
        lazy=True,
    )
