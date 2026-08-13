from sqlalchemy import Column, Integer, String, Date, Text, ForeignKey, Enum, Boolean, DateTime
from sqlalchemy.orm import relationship, backref
from web import db, app
from flask_login import UserMixin
from enum import Enum as UserEnum
from datetime import datetime,timedelta,date
from web.utils.password_hasher import hash_password

class UserRole(UserEnum):
    UNGVIEN = "ungvien"
    NHATUYENDUNG = "nhatuyendung"
    ADMIN = "admin"


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
    PENDING = "chờ duyệt"
    APPROVED = "đã duyệt"
    REJECT = "đã từ chối"

class NotificationType(UserEnum):
    NEW_APPLICATION = "đơn ứng tuyển mới"
    APPLICATION_STATUS = "trạng thái đơn"
    NEW_MESSAGE = "tin nhắn mới"
    NEW_JOB = "công việc mới"
    JOB_DEADLINE = "sắp hết hạn"
    COMPANY_APPROVED = "công ty được duyệt"
    COMPANY_REJECTED = "công ty bị từ chối"

class BaseModel(db.Model):
    __abstract__ = True
    id = Column(Integer, primary_key=True, autoincrement=True)


class User(BaseModel, UserMixin):
    __tablename__ = 'users'

    username = Column(String(50), nullable=False, unique=True)
    email = Column(String(100), nullable=False, unique=True)
    password_hash = Column(String(200), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    created_at = Column(DateTime, default=datetime.now)

    applicant_info = relationship('ApplicantInfo', backref='user', uselist=False, cascade="all, delete-orphan")
    company_info = relationship('CompanyInfo', backref='user', uselist=False, cascade="all, delete-orphan")

class ApplicantInfo(BaseModel):
    __tablename__ = 'applicant_info'

    id = Column(Integer, ForeignKey('users.id'), nullable=False, primary_key=True)
    full_name = Column(String(100))
    gender = Column(Enum(Gender))
    date_of_birth = Column(Date)
    phone = Column(String(20))
    address = Column(Text)
    avatar_url = Column(Text)
    description = Column(Text)

    applications = relationship('Application', backref='candidate', lazy=True, cascade="all, delete-orphan")
    cv_files = relationship('CVFile', backref='candidate', lazy=True, cascade="all, delete-orphan")
    saved_jobs = relationship('SavedJob', backref='candidate', lazy=True, cascade="all, delete-orphan")

class CompanyInfo(BaseModel):
    __tablename__ = 'company_info'

    id = Column(Integer, ForeignKey('users.id'), nullable=False, primary_key=True)
    company_name = Column(String(255), nullable=False)
    logo_url = Column(Text)
    industry = Column(String(100))
    company_size = Column(Integer)
    website = Column(String(255))
    description = Column(Text)
    address = Column(Text)
    status = Column(Enum(CompanyStatus),default=CompanyStatus.PENDING)
    approved_at = Column(DateTime)

    job_posts = relationship('JobPost', backref='company', lazy=True, cascade="all, delete-orphan")


class JobLocation(BaseModel):
    __tablename__ = 'job_locations'

    name = Column(String(100), nullable=False)
    job_posts = relationship('JobPost', backref='location', lazy=True)

class JobType(BaseModel):
    __tablename__ = 'job_types'

    name = Column(String(100), nullable=False)
    job_posts = relationship('JobPost', backref='job_type', lazy=True)

class JobPost(BaseModel):
    __tablename__ = 'job_posts'

    title = Column(String(255), nullable=False)
    min_salary = Column(Integer)
    max_salary = Column(Integer)
    description = Column(Text)
    requirements = Column(Text)  
    benefits = Column(Text)  
    deadline = Column(Date)
    status = Column(Enum(PostStatus), default=PostStatus.HOAT_DONG)
    created_at = Column(DateTime, default=datetime.now)

    location_id = Column(Integer, ForeignKey('job_locations.id'))
    job_type_id = Column(Integer, ForeignKey('job_types.id'))
    company_id = Column(Integer, ForeignKey('company_info.id'), nullable=False)

    applications = relationship('Application', backref='job_post', lazy=True, cascade="all, delete-orphan")

class SavedJob(BaseModel):
    __tablename__ = 'saved_jobs'

    saved_at = Column(DateTime, default=datetime.now, nullable=False)
    candidate_id = Column(Integer, ForeignKey('applicant_info.id'), nullable=False)
    job_post_id = Column(Integer, ForeignKey('job_posts.id'), nullable=False)

    
    job_post = relationship(
        'JobPost',
        backref=backref('saved_by_candidates', lazy=True, cascade='all, delete-orphan'),
        lazy=True
    )

class CVFile(BaseModel):
    __tablename__ = 'cv_files'

    candidate_id = Column(Integer, ForeignKey('applicant_info.id'), nullable=False)
    name = Column(String(255))  
    cv_url = Column(Text, nullable=False)
    file_name = Column(String(255))  
    file_size = Column(Integer)  
    uploaded_at = Column(DateTime, default=datetime.now)

    
    applications = relationship('Application', backref='cv_file', lazy=True, cascade="all, delete-orphan")

class Application(BaseModel):
    __tablename__ = 'applications'

    cv_url = Column(Text)
    cv_file_id = Column(Integer, ForeignKey('cv_files.id'))  
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.DA_NOP)
    applied_at = Column(DateTime, default=datetime.now)
    rejected_at = Column(DateTime)  
    apply_count = Column(Integer, default=1)  
    job_post_id = Column(Integer, ForeignKey('job_posts.id'), nullable=False)
    candidate_id = Column(Integer, ForeignKey('applicant_info.id'), nullable=False)


class JobReview(BaseModel):
    __tablename__ = 'job_reviews'

    rating = Column(Integer, nullable=False)  
    comment = Column(Text)  
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    
    candidate_id = Column(Integer, ForeignKey('applicant_info.id'), nullable=False)
    job_post_id = Column(Integer, ForeignKey('job_posts.id'), nullable=False)

    
    candidate = relationship(
        'ApplicantInfo',
        backref=backref('job_reviews', lazy=True, cascade='all, delete-orphan'),
        lazy=True
    )
    job_post = relationship(
        'JobPost',
        backref=backref('reviews', lazy=True, cascade='all, delete-orphan'),
        lazy=True
    )


class CompanyFollow(BaseModel):
    __tablename__ = 'company_follows'

    followed_at = Column(DateTime, default=datetime.now, nullable=False)
    candidate_id = Column(Integer, ForeignKey('applicant_info.id'), nullable=False)
    company_id = Column(Integer, ForeignKey('company_info.id'), nullable=False)

    
    candidate = relationship(
        'ApplicantInfo',
        backref=backref('followed_companies', lazy=True, cascade='all, delete-orphan'),
        lazy=True
    )
    company = relationship(
        'CompanyInfo',
        backref=backref('followers', lazy=True, cascade='all, delete-orphan'),
        lazy=True
    )


class Notification(BaseModel):
    __tablename__ = 'notifications'

    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    type = Column(Enum(NotificationType, values_callable=lambda x: [e.value for e in x]), nullable=False)
    content = Column(Text, nullable=False)
    related_type = Column(String(50))  
    related_id = Column(Integer)  
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now)

    
    user = relationship(
        'User',
        backref=backref('notifications', lazy=True, cascade='all, delete-orphan'),
        lazy=True
    )


if __name__ == "__main__":
    with app.app_context():
        db.drop_all()
        db.create_all()

        locations = [
            JobLocation(name="Hà Nội"),
            JobLocation(name="Cao Bằng"),
            JobLocation(name="Tuyên Quang"),
            JobLocation(name="Lai Châu"),
            JobLocation(name="Sơn La"),
            JobLocation(name="Lào Cai"),
            JobLocation(name="Thái Nguyên"),
            JobLocation(name="Lạng Sơn"),
            JobLocation(name="Quảng Ninh"),
            JobLocation(name="Bắc Ninh"),
            JobLocation(name="Phú Thọ"),
            JobLocation(name="Thành phố Hải Phòng"),
            JobLocation(name="Hưng Yên"),
            JobLocation(name="Thanh Hóa"),
            JobLocation(name="Nghệ An"),
            JobLocation(name="Hà Tĩnh"),
            JobLocation(name="Quảng Trị"),
            JobLocation(name="Thành phố Huế"),
            JobLocation(name="Thành phố Đà Nẵng"),
            JobLocation(name="Quảng Ngãi"),
            JobLocation(name="Gia Lai"),
            JobLocation(name="Khánh Hòa"),
            JobLocation(name="Đắk Lắk"),
            JobLocation(name="Lâm Đồng"),
            JobLocation(name="Đồng Nai"),
            JobLocation(name="Thành phố Hồ Chí Minh"),
            JobLocation(name="Tây Ninh"),
            JobLocation(name="Đồng Tháp"),
            JobLocation(name="Vĩnh Long"),
            JobLocation(name="An Giang"),
            JobLocation(name="Thành phố Cần Thơ"),
            JobLocation(name="Cà Mau"),

        ]
        db.session.add_all(locations)
        db.session.commit()

        job_types = [
            JobType(name="Toàn thời gian"),
            JobType(name="Bán thời gian"),
            JobType(name="Thực tập"),
            JobType(name="Làm việc từ xa"),
            JobType(name="Hợp đồng thời vụ"),
            JobType(name="Thời gian linh hoạt"),
            JobType(name="Freelance"),
            JobType(name="Thời vụ - Dự án"),
            JobType(name="Làm việc theo ca"),
            JobType(name="Việc theo giờ"),
            JobType(name="Thử việc"),
            JobType(name="Cộng tác viên"),
        ]
        db.session.add_all(job_types)
        db.session.commit()

        
        admin = User(
            username="admin",
            email="admin@jobportal.com",
            password_hash=hash_password("admin123"),
            role=UserRole.ADMIN
        )

        db.session.add(admin)
        db.session.commit()

        ungvien1 = User(
            username="nguyenvana",
            email="nguyenvana@gmail.com",
            password_hash=hash_password("12345"),
            role=UserRole.UNGVIEN
        )

        nhatuyendung1 = User(
            username="fpt_hr",
            email="hr@fpt.com.vn",
            password_hash=hash_password("12345"),
            role=UserRole.NHATUYENDUNG
        )

        nhatuyendung2 = User(
            username="vng_hr",
            email="hr@vng.com.vn",
            password_hash=hash_password("12345"),
            role=UserRole.NHATUYENDUNG
        )

        nhatuyendung3 = User(
            username="vingroup_hr",
            email="hr@vingroup.com.vn",
            password_hash=hash_password("12345"),
            role=UserRole.NHATUYENDUNG
        )

        db.session.add_all([ungvien1, nhatuyendung1, nhatuyendung2, nhatuyendung3])
        db.session.commit()


        applicant1 = ApplicantInfo(
            id=ungvien1.id,
            full_name="Nguyễn Văn A",
            gender=Gender.NAM,
            date_of_birth=date(2000, 5, 15),
            phone="0912345678",
            address="123 Nguyễn Trãi, Quận 1, TP.HCM",
            description="Sinh viên năm 4 chuyên ngành Công nghệ phần mềm, có kinh nghiệm làm việc với Python, Java, ReactJS"
        )

        db.session.add(applicant1)
        db.session.commit()

        
        company1 = CompanyInfo(
            id=nhatuyendung1.id,
            company_name="FPT Software",
            industry="Công nghệ thông tin",
            company_size=1000,
            website="https://www.fpt-software.com",
            address="Lô 22, Đường số 2, KCX Tân Thuận, Q.7, TP.HCM",
            description="FPT Software là công ty phần mềm hàng đầu Việt Nam, cung cấp dịch vụ chuyển đổi số toàn diện",
            status=CompanyStatus.APPROVED
        )

        company2 = CompanyInfo(
            id=nhatuyendung2.id,
            company_name="VNG Corporation",
            industry="Công nghệ thông tin",
            company_size=1500,
            website="https://www.vng.com.vn",
            address="Tòa nhà Z06, Đường số 13, Tân Thuận Đông, Q.7, TP.HCM",
            description="VNG là công ty công nghệ hàng đầu Việt Nam, phát triển game, mạng xã hội và các dịch vụ số",
            status=CompanyStatus.APPROVED
        )

        company3 = CompanyInfo(
            id=nhatuyendung3.id,
            company_name="Vingroup",
            industry="Bất động sản",
            company_size=5000,
            website="https://www.vingroup.net",
            address="Tòa nhà Landmark 81, 720A Điện Biên Phủ, Q.Bình Thạnh, TP.HCM",
            description="Vingroup là tập đoàn kinh tế tư nhân đa ngành lớn nhất Việt Nam",
            status=CompanyStatus.APPROVED
        )

        db.session.add_all([company1, company2, company3])
        db.session.commit()


        
        job1 = JobPost(
            company_id=company1.id,
            title="Backend Developer (Python/Java)",
            min_salary=15000000,
            max_salary=25000000,
            description="Phát triển và bảo trì hệ thống backend, làm việc với database, API",
            requirements="- Tốt nghiệp Đại học chuyên ngành CNTT\n- 2+ năm kinh nghiệm Python/Java\n- Kiến thức về SQL, REST API",
            benefits="- Lương tháng 13, thưởng theo hiệu suất\n- Bảo hiểm đầy đủ\n- Môi trường làm việc chuyên nghiệp",
            deadline=date.today() + timedelta(days=30),
            status=PostStatus.HOAT_DONG,
            location_id=26,  
            job_type_id=1
        )

        job2 = JobPost(
            company_id=company1.id,
            title="Frontend Developer (ReactJS)",
            min_salary=12000000,
            max_salary=20000000,
            description="Xây dựng giao diện người dùng với ReactJS, làm việc với team thiết kế",
            requirements="- Tốt nghiệp Đại học chuyên ngành CNTT\n- 1+ năm kinh nghiệm ReactJS\n- Kiến thức về HTML, CSS, JavaScript",
            benefits="- Lương tháng 13, thưởng theo hiệu suất\n- Bảo hiểm đầy đủ\n- Team building hàng quý",
            deadline=date.today() + timedelta(days=30),
            status=PostStatus.HOAT_DONG,
            location_id=26,  
            job_type_id=1
        )

        job3 = JobPost(
            company_id=company1.id,
            title="Full Stack Developer (MERN Stack)",
            min_salary=18000000,
            max_salary=30000000,
            description="Phát triển ứng dụng web sử dụng MERN Stack (MongoDB, Express, React, Node.js)",
            requirements="- Tốt nghiệp Đại học chuyên ngành CNTT\n- 2+ năm kinh nghiệm MERN Stack\n- Kinh nghiệm với Docker, AWS",
            benefits="- Lương cạnh tranh, thưởng dự án\n- Làm việc từ xa 2 ngày/tuần\n- Đào tạo công nghệ mới",
            deadline=date.today() + timedelta(days=25),
            status=PostStatus.HOAT_DONG,
            location_id=26,  
            job_type_id=1
        )

        job4 = JobPost(
            company_id=company1.id,
            title="Mobile Developer (React Native)",
            min_salary=16000000,
            max_salary=28000000,
            description="Phát triển ứng dụng di động đa nền tảng sử dụng React Native",
            requirements="- Tốt nghiệp Đại học chuyên ngành CNTT\n- 2+ năm kinh nghiệm React Native\n- Kiến thức về iOS/Android native",
            benefits="- Lương tháng 13, 14\n- Thưởng dự án\n- Trang thiết bị làm việc hiện đại",
            deadline=date.today() + timedelta(days=20),
            status=PostStatus.HOAT_DONG,
            location_id=26,  
            job_type_id=1
        )

        job5 = JobPost(
            company_id=company1.id,
            title="DevOps Engineer",
            min_salary=20000000,
            max_salary=35000000,
            description="Quản lý hạ tầng, CI/CD pipeline, và đảm bảo hệ thống hoạt động ổn định",
            requirements="- Tốt nghiệp Đại học chuyên ngành CNTT\n- 3+ năm kinh nghiệm DevOps\n- Thành thạo Docker, Kubernetes, AWS/Azure",
            benefits="- Lương cao, thưởng hiệu suất\n- Làm việc với công nghệ mới nhất\n- Du lịch hàng năm",
            deadline=date.today() + timedelta(days=35),
            status=PostStatus.HOAT_DONG,
            location_id=1,  
            job_type_id=1
        )

        
        job6 = JobPost(
            company_id=company2.id,
            title="Game Developer (Unity)",
            min_salary=18000000,
            max_salary=32000000,
            description="Phát triển game mobile sử dụng Unity Engine",
            requirements="- Tốt nghiệp Đại học chuyên ngành CNTT\n- 2+ năm kinh nghiệm Unity\n- Đam mê game",
            benefits="- Lương cạnh tranh\n- Chơi game công ty miễn phí\n- Môi trường sáng tạo",
            deadline=date.today() + timedelta(days=28),
            status=PostStatus.HOAT_DONG,
            location_id=26,  
            job_type_id=1
        )

        job7 = JobPost(
            company_id=company2.id,
            title="Data Engineer",
            min_salary=22000000,
            max_salary=38000000,
            description="Xây dựng và quản lý data pipeline, data warehouse",
            requirements="- Tốt nghiệp Đại học chuyên ngành CNTT\n- 3+ năm kinh nghiệm Data Engineering\n- Thành thạo Spark, Hadoop, Kafka",
            benefits="- Lương cao\n- Làm việc với Big Data\n- Đào tạo chuyên sâu",
            deadline=date.today() + timedelta(days=22),
            status=PostStatus.HOAT_DONG,
            location_id=26,  
            job_type_id=1
        )

        
        job8 = JobPost(
            company_id=company3.id,
            title="Chuyên viên Kinh doanh Bất động sản",
            min_salary=10000000,
            max_salary=30000000,
            description="Tư vấn và bán các sản phẩm bất động sản của Vingroup",
            requirements="- Tốt nghiệp Đại học\n- Kỹ năng giao tiếp tốt\n- Nhiệt tình, năng động",
            benefits="- Hoa hồng cao\n- Thưởng theo doanh số\n- Đào tạo bài bản",
            deadline=date.today() + timedelta(days=40),
            status=PostStatus.HOAT_DONG,
            location_id=26,  
            job_type_id=1
        )

        job9 = JobPost(
            company_id=company3.id,
            title="Trưởng phòng Kinh doanh",
            min_salary=25000000,
            max_salary=45000000,
            description="Quản lý đội ngũ kinh doanh, xây dựng chiến lược bán hàng",
            requirements="- Tốt nghiệp Đại học\n- 5+ năm kinh nghiệm BĐS\n- Kỹ năng lãnh đạo tốt",
            benefits="- Lương cạnh tranh\n- Thưởng doanh số\n- Xe công ty",
            deadline=date.today() + timedelta(days=35),
            status=PostStatus.HOAT_DONG,
            location_id=1,  
            job_type_id=1
        )

        db.session.add_all([job1, job2, job3, job4, job5, job6, job7, job8, job9])
        db.session.commit()

        
        ungvien2 = User(
            username="tranthib",
            email="tranthib@gmail.com",
            password_hash=hash_password("12345"),
            role=UserRole.UNGVIEN
        )

        ungvien3 = User(
            username="lequangc",
            email="lequangc@gmail.com",
            password_hash=hash_password("12345"),
            role=UserRole.UNGVIEN
        )

        db.session.add_all([ungvien2, ungvien3])
        db.session.commit()

        applicant2 = ApplicantInfo(
            id=ungvien2.id,
            full_name="Trần Thị B",
            gender=Gender.NU,
            date_of_birth=date(1999, 8, 20),
            phone="0923456789",
            address="456 Lê Lợi, Quận 3, TP.HCM",
            description="Có 2 năm kinh nghiệm làm Frontend Developer với ReactJS, VueJS"
        )

        applicant3 = ApplicantInfo(
            id=ungvien3.id,
            full_name="Lê Quang C",
            gender=Gender.NAM,
            date_of_birth=date(2001, 3, 10),
            phone="0934567890",
            address="789 Trần Hưng Đạo, Quận 5, TP.HCM",
            description="Mới tốt nghiệp, có kiến thức vững về Python, Django, PostgreSQL"
        )

        db.session.add_all([applicant2, applicant3])
        db.session.commit()

        
        app1 = Application(
            candidate_id=applicant1.id,
            job_post_id=job1.id,
            cv_url="https://res.cloudinary.com/demo/raw/upload/sample_cv_nguyenvana.pdf",
            status=ApplicationStatus.DA_NOP,
            applied_at=datetime.now() - timedelta(days=5)
        )

        app2 = Application(
            candidate_id=applicant2.id,
            job_post_id=job2.id,
            cv_url="https://res.cloudinary.com/demo/raw/upload/sample_cv_tranthib.pdf",
            status=ApplicationStatus.DA_DUYET,
            applied_at=datetime.now() - timedelta(days=10)
        )

        app3 = Application(
            candidate_id=applicant3.id,
            job_post_id=job3.id,
            cv_url="https://res.cloudinary.com/demo/raw/upload/sample_cv_lequangc.pdf",
            status=ApplicationStatus.DA_NOP,
            applied_at=datetime.now() - timedelta(days=3)
        )

        db.session.add_all([app1, app2, app3])
        db.session.commit()
