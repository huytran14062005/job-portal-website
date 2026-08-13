from web import app, db
from web.models import (
    User, UserRole, ApplicantInfo, CompanyInfo,
    JobLocation, JobType, JobPost, Application,
    Gender, ApplicationStatus, PostStatus, CompanyStatus,
    Notification, NotificationType
)
from datetime import datetime, timedelta, date
from web.utils.password_hasher import hash_password

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

        admin_user = User(
            username="admin",
            email="admin@jobportal.com",
            password_hash=hash_password("admin123"),
            role=UserRole.ADMIN
        )
        db.session.add(admin_user)
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
            username="viettel_hr",
            email="hr@viettel.com.vn",
            password_hash=hash_password("12345"),
            role=UserRole.NHATUYENDUNG
        )
        
        nhatuyendung3 = User(
            username="vnpt_hr",
            email="hr@vnpt.vn",
            password_hash=hash_password("12345"),
            role=UserRole.NHATUYENDUNG
        )
        
        nhatuyendung4 = User(
            username="momo_hr",
            email="hr@momo.vn",
            password_hash=hash_password("12345"),
            role=UserRole.NHATUYENDUNG
        )
        
        nhatuyendung5 = User(
            username="tiki_hr",
            email="hr@tiki.vn",
            password_hash=hash_password("12345"),
            role=UserRole.NHATUYENDUNG
        )
        
        nhatuyendung6 = User(
            username="shopee_hr",
            email="hr@shopee.vn",
            password_hash=hash_password("12345"),
            role=UserRole.NHATUYENDUNG
        )
        
        nhatuyendung7 = User(
            username="grab_hr",
            email="hr@grab.vn",
            password_hash=hash_password("12345"),
            role=UserRole.NHATUYENDUNG
        )
        
        nhatuyendung8 = User(
            username="be_hr",
            email="hr@be.com.vn",
            password_hash=hash_password("12345"),
            role=UserRole.NHATUYENDUNG
        )
        
        nhatuyendung9 = User(
            username="vingroup_hr",
            email="hr@vingroup.net",
            password_hash=hash_password("12345"),
            role=UserRole.NHATUYENDUNG
        )
        
        nhatuyendung10 = User(
            username="tpbank_hr",
            email="hr@tpbank.com.vn",
            password_hash=hash_password("12345"),
            role=UserRole.NHATUYENDUNG
        )
        
        db.session.add_all([ungvien1, nhatuyendung1, nhatuyendung2, nhatuyendung3, nhatuyendung4, 
                           nhatuyendung5, nhatuyendung6, nhatuyendung7, nhatuyendung8, 
                           nhatuyendung9, nhatuyendung10])
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
            status=CompanyStatus.APPROVED,
            approved_at=datetime.now()
        )
        
        company2 = CompanyInfo(
            id=nhatuyendung2.id,
            company_name="Viettel Group",
            industry="Viễn thông - Công nghệ",
            company_size=5000,
            website="https://www.viettel.com.vn",
            address="Số 1 Giang Văn Minh, Ba Đình, Hà Nội",
            description="Tập đoàn Công nghiệp - Viễn thông Quân đội, doanh nghiệp viễn thông lớn nhất Việt Nam",
            status=CompanyStatus.APPROVED,
            approved_at=datetime.now()
        )
        
        company3 = CompanyInfo(
            id=nhatuyendung3.id,
            company_name="VNPT Technology",
            industry="Công nghệ thông tin",
            company_size=3000,
            website="https://www.vnpt.vn",
            address="57 Huỳnh Thúc Kháng, Đống Đa, Hà Nội",
            description="VNPT Technology - Công ty công nghệ thông tin hàng đầu về chuyển đổi số",
            status=CompanyStatus.APPROVED,
            approved_at=datetime.now()
        )
        
        company4 = CompanyInfo(
            id=nhatuyendung4.id,
            company_name="M_Service (MoMo)",
            industry="Fintech - Thanh toán điện tử",
            company_size=800,
            website="https://www.momo.vn",
            address="Lầu 4, Toà nhà Flemington, 182 Lê Đại Hành, Q.11, TP.HCM",
            description="Ví điện tử MoMo - Nền tảng thanh toán và dịch vụ tài chính hàng đầu Việt Nam",
            status=CompanyStatus.APPROVED,
            approved_at=datetime.now()
        )
        
        company5 = CompanyInfo(
            id=nhatuyendung5.id,
            company_name="Tiki Corporation",
            industry="Thương mại điện tử",
            company_size=2000,
            website="https://www.tiki.vn",
            address="52 Út Tịch, Phường 4, Quận Tân Bình, TP.HCM",
            description="Tiki - Sàn thương mại điện tử hàng đầu Việt Nam",
            status=CompanyStatus.APPROVED,
            approved_at=datetime.now()
        )
        
        company6 = CompanyInfo(
            id=nhatuyendung6.id,
            company_name="Shopee Vietnam",
            industry="Thương mại điện tử",
            company_size=3500,
            website="https://www.shopee.vn",
            address="Tòa nhà Viettel, 285 Cách Mạng Tháng 8, Q.10, TP.HCM",
            description="Shopee - Nền tảng thương mại điện tử và công nghệ số hàng đầu khu vực",
            status=CompanyStatus.APPROVED,
            approved_at=datetime.now()
        )
        
        company7 = CompanyInfo(
            id=nhatuyendung7.id,
            company_name="Grab Vietnam",
            industry="Công nghệ - Gọi xe",
            company_size=1500,
            website="https://www.grab.com",
            address="Tầng 8-9, Toà nhà Sài Gòn Centre, 65 Lê Lợi, Q.1, TP.HCM",
            description="Grab - Nền tảng siêu ứng dụng hàng đầu Đông Nam Á",
            status=CompanyStatus.APPROVED,
            approved_at=datetime.now()
        )
        
        company8 = CompanyInfo(
            id=nhatuyendung8.id,
            company_name="be Group",
            industry="Công nghệ - Gọi xe",
            company_size=600,
            website="https://www.be.com.vn",
            address="74 Nguyễn Thị Minh Khai, Q.3, TP.HCM",
            description="be - Nền tảng công nghệ kết nối vận tải đa phương tiện của Việt Nam",
            status=CompanyStatus.APPROVED,
            approved_at=datetime.now()
        )
        
        company9 = CompanyInfo(
            id=nhatuyendung9.id,
            company_name="VinSmart - Vingroup",
            industry="Công nghệ - Sản xuất",
            company_size=8000,
            website="https://www.vingroup.net",
            address="Tòa Landmark 81, 720A Điện Biên Phủ, Q.Bình Thạnh, TP.HCM",
            description="VinSmart - Công ty công nghệ của Tập đoàn Vingroup",
            status=CompanyStatus.APPROVED,
            approved_at=datetime.now()
        )
        
        company10 = CompanyInfo(
            id=nhatuyendung10.id,
            company_name="TPBank Digital",
            industry="Ngân hàng - Fintech",
            company_size=1200,
            website="https://www.tpbank.com.vn",
            address="Tầng 6, Toà nhà TPBank, 57 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội",
            description="TPBank - Ngân hàng số hàng đầu Việt Nam",
            status=CompanyStatus.APPROVED,
            approved_at=datetime.now()
        )
        
        db.session.add_all([company1, company2, company3, company4, company5, 
                           company6, company7, company8, company9, company10])
        db.session.commit()

        job1 = JobPost(
            company_id=company1.id,
            title="Backend Developer (Python/Java)",
            min_salary=15000000,
            max_salary=25000000,
            description="Phát triển và bảo trì hệ thống backend, làm việc với database, API",
            requirements="""• Tốt nghiệp Đại học chuyên ngành CNTT hoặc tương đương
• Có ít nhất 2 năm kinh nghiệm làm Backend Developer
• Thành thạo Python/Django hoặc Java/Spring Boot
• Có kinh nghiệm với PostgreSQL, MySQL, Redis
• Am hiểu về RESTful API, Microservices
• Có kinh nghiệm với Docker, CI/CD là một lợi thế
• Kỹ năng giải quyết vấn đề tốt, có tinh thần trách nhiệm
• Khả năng làm việc nhóm và giao tiếp hiệu quả""",
            benefits="""• Lương tháng 13, thưởng theo hiệu suất công việc và lợi nhuận công ty
• Xét tăng lương 2 lần/năm dựa trên hiệu quả công việc
• Được tham gia đầy đủ BHXH, BHYT, BHTN theo quy định
• Bảo hiểm sức khỏe cao cấp cho nhân viên và gia đình
• Làm việc từ thứ 2 đến thứ 6, nghỉ thứ 7 và Chủ nhật
• 12 ngày phép năm, nghỉ lễ theo quy định nhà nước
• Môi trường làm việc chuyên nghiệp, năng động, nhiều cơ hội thăng tiến
• Được đào tạo và phát triển kỹ năng chuyên môn thường xuyên
• Tham gia các hoạt động team building, du lịch hàng năm""",
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
            requirements="""• Tốt nghiệp Đại học chuyên ngành CNTT hoặc tương đương
• Có ít nhất 1-2 năm kinh nghiệm với ReactJS
• Thành thạo HTML5, CSS3, JavaScript ES6+
• Có kinh nghiệm với Redux, React Hooks
• Hiểu biết về Responsive Design, UI/UX
• Có kinh nghiệm làm việc với RESTful API
• Sử dụng thành thạo Git, npm/yarn
• Có tinh thần học hỏi, cầu tiến""",
            benefits="""• Mức lương hấp dẫn, cạnh tranh với thị trường
• Thưởng dự án, thưởng theo hiệu suất công việc
• Được tham gia BHXH, BHYT, BHTN đầy đủ
• Chế độ nghỉ phép, nghỉ lễ theo quy định
• Môi trường làm việc trẻ trung, sáng tạo
• Cơ hội học hỏi và phát triển nghề nghiệp
• Được đào tạo các công nghệ mới
• Tham gia các sự kiện công ty, team building""",
            deadline=date.today() + timedelta(days=30),
            status=PostStatus.HOAT_DONG,
            location_id=26,
            job_type_id=1
        )
        
        
        job2_1 = JobPost(
            company_id=company1.id,
            title="Full Stack Developer (MERN)",
            min_salary=18000000,
            max_salary=30000000,
            description="Phát triển ứng dụng web full stack với MERN stack",
            requirements="• 2+ năm kinh nghiệm MERN\n• Thành thạo MongoDB, Express, React, Node.js\n• Kinh nghiệm Docker, AWS",
            benefits="• Lương cạnh tranh\n• Remote 2 ngày/tuần\n• Đào tạo công nghệ mới",
            deadline=date.today() + timedelta(days=25),
            status=PostStatus.HOAT_DONG,
            location_id=26,
            job_type_id=1
        )
        
        job2_2 = JobPost(
            company_id=company1.id,
            title="Mobile Developer (React Native)",
            min_salary=16000000,
            max_salary=28000000,
            description="Phát triển ứng dụng mobile đa nền tảng với React Native",
            requirements="• 2+ năm kinh nghiệm React Native\n• Thành thạo JavaScript/TypeScript\n• Kinh nghiệm iOS/Android",
            benefits="• Lương tháng 13, 14\n• Thưởng dự án\n• Trang thiết bị hiện đại",
            deadline=date.today() + timedelta(days=20),
            status=PostStatus.HOAT_DONG,
            location_id=26,
            job_type_id=1
        )
        
        
        job5_1 = JobPost(
            company_id=company3.id,
            title="Java Backend Developer",
            min_salary=17000000,
            max_salary=27000000,
            description="Phát triển hệ thống backend với Java Spring Boot",
            requirements="• 2+ năm kinh nghiệm Java Spring Boot\n• Thành thạo MySQL, Redis\n• Kinh nghiệm Microservices",
            benefits="• Lương cạnh tranh\n• BHXH đầy đủ\n• Đào tạo công nghệ",
            deadline=date.today() + timedelta(days=30),
            status=PostStatus.HOAT_DONG,
            location_id=1,
            job_type_id=1
        )
        
        job5_2 = JobPost(
            company_id=company3.id,
            title="ReactJS Frontend Developer",
            min_salary=14000000,
            max_salary=23000000,
            description="Xây dựng giao diện web với ReactJS",
            requirements="• 1+ năm kinh nghiệm ReactJS\n• Thành thạo HTML, CSS, JS\n• Hiểu biết về UX/UI",
            benefits="• Lương thưởng tốt\n• Môi trường trẻ trung\n• Team building",
            deadline=date.today() + timedelta(days=28),
            status=PostStatus.HOAT_DONG,
            location_id=1,
            job_type_id=1
        )
        
        job3 = JobPost(
            company_id=company2.id,
            title="DevOps Engineer",
            min_salary=18000000,
            max_salary=30000000,
            description="Triển khai và quản lý hạ tầng cloud, CI/CD pipeline, Docker, Kubernetes",
            requirements="""• Tốt nghiệp Đại học chuyên ngành CNTT
• Có từ 2-3 năm kinh nghiệm về DevOps
• Thành thạo AWS, GCP hoặc Azure
• Có kinh nghiệm với Docker, Kubernetes
• Am hiểu về CI/CD (Jenkins, GitLab CI)
• Có kinh nghiệm với Terraform, Ansible
• Hiểu biết về monitoring và logging
• Có khả năng giải quyết vấn đề tốt""",
            benefits="""• Lương cạnh tranh, thưởng theo năng lực
• Bảo hiểm đầy đủ theo quy định
• Bảo hiểm sức khỏe cao cấp
• Làm việc với công nghệ hiện đại
• Được đào tạo nâng cao kỹ năng
• Môi trường làm việc chuyên nghiệp
• Team building, du lịch hàng năm
• Cơ hội phát triển nghề nghiệp""",
            deadline=date.today() + timedelta(days=45),
            status=PostStatus.HOAT_DONG,
            location_id=1,
            job_type_id=1
        )
        
        job4 = JobPost(
            company_id=company2.id,
            title="Mobile Developer (Flutter)",
            min_salary=14000000,
            max_salary=24000000,
            description="Phát triển ứng dụng di động đa nền tảng với Flutter, Dart",
            requirements="""• Tốt nghiệp Đại học chuyên ngành CNTT hoặc tương đương
• Có ít nhất 1 năm kinh nghiệm với Flutter/Dart
• Hiểu rõ về Mobile UI/UX Design principles
• Có kinh nghiệm tích hợp API, Firebase
• Am hiểu về State Management (Provider, BLoC, Riverpod)
• Có kinh nghiệm publish app lên App Store và Google Play
• Khả năng đọc hiểu tài liệu tiếng Anh tốt
• Có tinh thần cầu tiến, ham học hỏi""",
            benefits="""• Mức lương hấp dẫn, xét tăng lương định kỳ
• Thưởng theo dự án và hiệu suất công việc
• Đóng BHXH, BHYT, BHTN đầy đủ
• Khám sức khỏe định kỳ hàng năm
• Làm việc 8 tiếng/ngày, 5 ngày/tuần
• 12 ngày phép năm + các ngày lễ
• Được đào tạo công nghệ mới nhất
• Môi trường trẻ trung, năng động
• Du lịch, team building định kỳ""",
            deadline=date.today() + timedelta(days=40),
            status=PostStatus.HOAT_DONG,
            location_id=1,
            job_type_id=1
        )
        
        job5 = JobPost(
            company_id=company3.id,
            title="Data Engineer",
            min_salary=16000000,
            max_salary=28000000,
            description="Xây dựng và tối ưu hóa data pipeline, ETL processes, Big Data",
            requirements="""• Tốt nghiệp Đại học chuyên ngành CNTT, Toán, Thống kê
• Có từ 2 năm kinh nghiệm về Data Engineering
• Thành thạo Python, SQL, Spark
• Có kinh nghiệm với Hadoop, Kafka, Airflow
• Am hiểu về Data Warehouse, Data Lake
• Có kinh nghiệm làm việc với AWS/GCP Big Data services
• Khả năng xử lý và phân tích dữ liệu lớn
• Tư duy logic tốt, kỹ năng giải quyết vấn đề""",
            benefits="""• Lương thưởng cạnh tranh theo năng lực
• Thưởng dự án, KPI hàng tháng
• BHXH, BHYT, BHTN theo luật lao động
• Bảo hiểm sức khỏe Bảo Việt cho cá nhân
• Nghỉ phép 12 ngày/năm + lễ tết
• Được làm việc với Big Data và công nghệ mới
• Đào tạo về Data Science, Machine Learning
• Văn phòng hiện đại, máy móc tốt
• Team building, du lịch hè""",
            deadline=date.today() + timedelta(days=35),
            status=PostStatus.HOAT_DONG,
            location_id=1,
            job_type_id=1
        )
        
        job6 = JobPost(
            company_id=company4.id,
            title="Senior Backend Engineer (Go/Node.js)",
            min_salary=25000000,
            max_salary=40000000,
            description="Thiết kế và phát triển microservices, xử lý high-traffic systems",
            requirements="""• Tốt nghiệp Đại học chuyên ngành CNTT
• Có từ 4 năm kinh nghiệm Backend Development
• Thành thạo Go hoặc Node.js
• Có kinh nghiệm thiết kế Microservices Architecture
• Am hiểu về Message Queue (Kafka, RabbitMQ)
• Có kinh nghiệm với hệ thống high-traffic (>10M users)
• Hiểu biết sâu về Database Optimization
• Có khả năng mentoring junior developers
• Kỹ năng giao tiếp và làm việc nhóm tốt""",
            benefits="""• Mức lương top thị trường, review 6 tháng/lần
• Thưởng hiệu suất, thưởng dự án
• Stock options sau 1 năm làm việc
• BHXH, BHYT, BHTN đầy đủ
• Bảo hiểm sức khỏe Bảo Việt cao cấp cho gia đình
• Làm việc flexible, có thể remote
• Budget để mua sách, khóa học
• Macbook Pro M3 hoặc laptop cao cấp
• Văn phòng sang trọng, đồ ăn nhẹ miễn phí
• Du lịch nước ngoài hàng năm""",
            deadline=date.today() + timedelta(days=25),
            status=PostStatus.HOAT_DONG,
            location_id=26,
            job_type_id=1
        )
        
        job7 = JobPost(
            company_id=company5.id,
            title="QA Automation Engineer",
            min_salary=13000000,
            max_salary=22000000,
            description="Xây dựng framework test automation, CI/CD integration",
            requirements="""• Tốt nghiệp Đại học chuyên ngành CNTT hoặc tương đương
• Có từ 2 năm kinh nghiệm về QA Automation
• Thành thạo Selenium, Cypress hoặc Playwright
• Có kinh nghiệm với Jest, JUnit, TestNG
• Am hiểu về CI/CD (Jenkins, GitLab CI)
• Có kinh nghiệm viết test cho API (Postman, RestAssured)
• Hiểu biết về Agile/Scrum
• Tỉ mỉ, cẩn thận, có trách nhiệm
• Khả năng làm việc độc lập và teamwork""",
            benefits="""• Mức lương cạnh tranh, tăng lương hàng năm
• Thưởng tháng 13, thưởng hiệu suất
• BHXH, BHYT, BHTN đầy đủ theo luật
• Chế độ nghỉ phép 12 ngày/năm
• Làm việc trong môi trường e-commerce lớn
• Được training về automation testing mới
• Cơ hội thăng tiến lên QA Lead
• Hoạt động team building thường xuyên
• Hỗ trợ ăn trưa, đồ uống miễn phí""",
            deadline=date.today() + timedelta(days=50),
            status=PostStatus.HOAT_DONG,
            location_id=26,
            job_type_id=1
        )
        
        job8 = JobPost(
            company_id=company6.id,
            title="Machine Learning Engineer",
            min_salary=20000000,
            max_salary=35000000,
            description="Phát triển và triển khai ML models, NLP, Computer Vision",
            requirements="""• Tốt nghiệp Đại học trở lên chuyên ngành CNTT, Toán, AI
• Có từ 2 năm kinh nghiệm về Machine Learning
• Thành thạo Python, TensorFlow/PyTorch
• Có kinh nghiệm với NLP hoặc Computer Vision
• Am hiểu về Deep Learning, Neural Networks
• Có kinh nghiệm deploy ML models vào production
• Hiểu biết về MLOps, model monitoring
• Có khả năng nghiên cứu paper và áp dụng
• Kỹ năng toán học, thống kê tốt""",
            benefits="""• Lương thưởng hấp dẫn, review 2 lần/năm
• Thưởng theo project và KPI
• Stock options cho nhân viên xuất sắc
• BHXH, BHYT, BHTN + Bảo hiểm sức khỏe
• Làm việc với AI/ML cutting-edge technology
• Budget nghiên cứu, tham gia conference
• Được training về Gen AI, LLMs
• Môi trường startup năng động
• Flexible working, có thể remote
• Máy tính cấu hình cao (GPU workstation)""",
            deadline=date.today() + timedelta(days=60),
            status=PostStatus.HOAT_DONG,
            location_id=26,
            job_type_id=1
        )
        
        job9 = JobPost(
            company_id=company7.id,
            title="iOS Developer (Swift)",
            min_salary=16000000,
            max_salary=28000000,
            description="Phát triển ứng dụng iOS native, SwiftUI, UIKit",
            requirements="""• Tốt nghiệp Đại học chuyên ngành CNTT hoặc tương đương
• Có từ 2 năm kinh nghiệm phát triển iOS
• Thành thạo Swift, SwiftUI, UIKit
• Có kinh nghiệm với Core Data, Realm
• Am hiểu về iOS Design Patterns (MVC, MVVM, VIPER)
• Có kinh nghiệm tích hợp API, push notification
• Hiểu biết về Auto Layout, responsive design
• Đã từng publish app lên App Store
• Đam mê công nghệ iOS, cập nhật xu hướng mới""",
            benefits="""• Mức lương hấp dẫn, thưởng theo dự án
• Xét tăng lương định kỳ 6 tháng/lần
• BHXH, BHYT, BHTN đầy đủ
• Bảo hiểm sức khỏe cho bản thân và gia đình
• Macbook Pro + iPhone mới nhất để test
• Làm việc với app có hàng triệu users
• Được training về iOS mới nhất
• Flexible working time
• Văn phòng đẹp, snack miễn phí
• Outing, team building định kỳ""",
            deadline=date.today() + timedelta(days=32),
            status=PostStatus.HOAT_DONG,
            location_id=26,
            job_type_id=1
        )
        
        job10 = JobPost(
            company_id=company8.id,
            title="Android Developer (Kotlin)",
            min_salary=15000000,
            max_salary=26000000,
            description="Phát triển ứng dụng Android với Kotlin, Jetpack Compose",
            requirements="""• Tốt nghiệp Đại học chuyên ngành CNTT
• Có từ 2 năm kinh nghiệm phát triển Android
• Thành thạo Kotlin, Java
• Có kinh nghiệm với Jetpack Compose
• Am hiểu về Android Architecture Components
• Có kinh nghiệm với Room Database, Retrofit
• Hiểu biết về Material Design Guidelines
• Đã publish app lên Google Play Store
• Có tinh thần làm việc nhóm, trách nhiệm cao""",
            benefits="""• Lương cạnh tranh, thưởng theo hiệu suất
• Thưởng tháng 13, thưởng dự án
• BHXH, BHYT, BHTN theo quy định
• Khám sức khỏe định kỳ
• Máy tính, điện thoại Android flagship
• Làm việc với công nghệ mới nhất
• Được training Jetpack Compose, Kotlin Coroutines
• Work-life balance, không OT
• Team building hàng quý
• Cơ hội thăng tiến rõ ràng""",
            deadline=date.today() + timedelta(days=38),
            status=PostStatus.HOAT_DONG,
            location_id=26,
            job_type_id=1
        )
        
        job11 = JobPost(
            company_id=company9.id,
            title="Embedded Software Engineer",
            min_salary=17000000,
            max_salary=30000000,
            description="Lập trình nhúng cho IoT devices, C/C++, RTOS",
            requirements="""• Tốt nghiệp Đại học chuyên ngành Điện tử, Tự động hóa, CNTT
• Có từ 2 năm kinh nghiệm lập trình nhúng
• Thành thạo C/C++ cho embedded systems
• Có kinh nghiệm với RTOS (FreeRTOS, Zephyr)
• Am hiểu về vi điều khiển (ARM, ESP32, STM32)
• Có kinh nghiệm với communication protocols (UART, SPI, I2C)
• Hiểu biết về IoT, MQTT, BLE
• Kỹ năng đọc schematic, datasheet
• Có khả năng debug hardware-software integration""",
            benefits="""• Mức lương hấp dẫn cho ngành embedded
• Thưởng theo dự án và hiệu suất
• BHXH, BHYT, BHTN đầy đủ
• Bảo hiểm tai nạn 24/7
• Làm việc với IoT devices hiện đại
• Được training về các chip mới nhất
• Có cơ hội làm việc với phần cứng cao cấp
• Môi trường R&D chuyên nghiệp
• Hỗ trợ mua tools, thiết bị đo
• Du lịch, team building hàng năm""",
            deadline=date.today() + timedelta(days=42),
            status=PostStatus.HOAT_DONG,
            location_id=1,
            job_type_id=1
        )
        
        job12 = JobPost(
            company_id=company10.id,
            title="Security Engineer",
            min_salary=19000000,
            max_salary=32000000,
            description="Bảo mật hệ thống, penetration testing, security audit",
            requirements="""• Tốt nghiệp Đại học chuyên ngành CNTT, An toàn thông tin
• Có từ 2 năm kinh nghiệm về Security/InfoSec
• Am hiểu về OWASP Top 10, Common Vulnerabilities
• Có kinh nghiệm với Penetration Testing tools (Burp Suite, Metasploit)
• Hiểu biết về Network Security, Firewall, IDS/IPS
• Có kinh nghiệm security audit, vulnerability assessment
• Am hiểu về Secure Coding practices
• Có certificate (CEH, OSCP) là lợi thế
• Tư duy logic, tỉ mỉ, cẩn thận""",
            benefits="""• Mức lương cao, xứng đáng với năng lực
• Thưởng phát hiện lỗ hổng bảo mật
• BHXH, BHYT, BHTN + Bảo hiểm cao cấp
• Budget để thi chứng chỉ quốc tế
• Được đào tạo về security mới nhất
• Tham gia bug bounty programs
• Làm việc với hệ thống ngân hàng lớn
• Môi trường chuyên nghiệp, bảo mật cao
• Công cụ, phần mềm security đầy đủ
• Cơ hội thăng tiến lên Security Lead/Manager""",
            deadline=date.today() + timedelta(days=28),
            status=PostStatus.HOAT_DONG,
            location_id=1,
            job_type_id=1
        )
        
        db.session.add_all([job1, job2, job2_1, job2_2, job3, job4, job5, job5_1, job5_2, job6, job7, job8, job9, job10, job11, job12])
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
        
        ungvien4 = User(
            username="phamthid",
            email="phamthid@gmail.com",
            password_hash=hash_password("12345"),
            role=UserRole.UNGVIEN
        )
        
        ungvien5 = User(
            username="hoangvane",
            email="hoangvane@gmail.com",
            password_hash=hash_password("12345"),
            role=UserRole.UNGVIEN
        )
        
        ungvien6 = User(
            username="vuthif",
            email="vuthif@gmail.com",
            password_hash=hash_password("12345"),
            role=UserRole.UNGVIEN
        )
        
        ungvien7 = User(
            username="dangquocg",
            email="dangquocg@gmail.com",
            password_hash=hash_password("12345"),
            role=UserRole.UNGVIEN
        )
        
        ungvien8 = User(
            username="buithih",
            email="buithih@gmail.com",
            password_hash=hash_password("12345"),
            role=UserRole.UNGVIEN
        )
        
        ungvien9 = User(
            username="dovani",
            email="dovani@gmail.com",
            password_hash=hash_password("12345"),
            role=UserRole.UNGVIEN
        )
        
        ungvien10 = User(
            username="lyhoangk",
            email="lyhoangk@gmail.com",
            password_hash=hash_password("12345"),
            role=UserRole.UNGVIEN
        )
        
        ungvien11 = User(
            username="ngominhm",
            email="ngominhm@gmail.com",
            password_hash=hash_password("12345"),
            role=UserRole.UNGVIEN
        )
        
        db.session.add_all([ungvien2, ungvien3, ungvien4, ungvien5, ungvien6, 
                           ungvien7, ungvien8, ungvien9, ungvien10, ungvien11])
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
        
        applicant4 = ApplicantInfo(
            id=ungvien4.id,
            full_name="Phạm Thị D",
            gender=Gender.NU,
            date_of_birth=date(1998, 12, 25),
            phone="0945678901",
            address="321 Nguyễn Huệ, Quận 1, TP.HCM",
            description="3 năm kinh nghiệm Backend Developer, thành thạo Java Spring Boot, Microservices"
        )
        
        applicant5 = ApplicantInfo(
            id=ungvien5.id,
            full_name="Hoàng Văn E",
            gender=Gender.NAM,
            date_of_birth=date(1997, 6, 18),
            phone="0956789012",
            address="567 Võ Văn Tần, Quận 3, TP.HCM",
            description="Senior DevOps Engineer, 5 năm kinh nghiệm với AWS, Docker, Kubernetes, Terraform"
        )
        
        applicant6 = ApplicantInfo(
            id=ungvien6.id,
            full_name="Vũ Thị F",
            gender=Gender.NU,
            date_of_birth=date(2000, 9, 5),
            phone="0967890123",
            address="234 Điện Biên Phủ, Quận Bình Thạnh, TP.HCM",
            description="Mobile Developer chuyên Flutter và React Native, có 2 năm kinh nghiệm"
        )
        
        applicant7 = ApplicantInfo(
            id=ungvien7.id,
            full_name="Đặng Quốc G",
            gender=Gender.NAM,
            date_of_birth=date(1996, 4, 22),
            phone="0978901234",
            address="890 Lý Thường Kiệt, Quận 10, TP.HCM",
            description="Data Engineer với kinh nghiệm xử lý Big Data, Spark, Hadoop, Kafka"
        )
        
        applicant8 = ApplicantInfo(
            id=ungvien8.id,
            full_name="Bùi Thị H",
            gender=Gender.NU,
            date_of_birth=date(1999, 11, 8),
            phone="0989012345",
            address="123 Pasteur, Quận 1, TP.HCM",
            description="QA Automation Engineer, thành thạo Selenium, Cypress, Jest"
        )
        
        applicant9 = ApplicantInfo(
            id=ungvien9.id,
            full_name="Đỗ Văn I",
            gender=Gender.NAM,
            date_of_birth=date(1995, 7, 30),
            phone="0990123456",
            address="456 Cách Mạng Tháng 8, Quận 10, TP.HCM",
            description="Machine Learning Engineer, có kinh nghiệm với TensorFlow, PyTorch, Computer Vision"
        )
        
        applicant10 = ApplicantInfo(
            id=ungvien10.id,
            full_name="Lý Hoàng K",
            gender=Gender.NAM,
            date_of_birth=date(1998, 2, 14),
            phone="0901234567",
            address="789 Hai Bà Trưng, Quận 1, TP.HCM",
            description="iOS Developer với 3 năm kinh nghiệm, thành thạo Swift, SwiftUI, Objective-C"
        )
        
        applicant11 = ApplicantInfo(
            id=ungvien11.id,
            full_name="Ngô Minh M",
            gender=Gender.NAM,
            date_of_birth=date(1997, 10, 3),
            phone="0912345670",
            address="234 Nguyễn Đình Chiểu, Quận 3, TP.HCM",
            description="Security Engineer chuyên về penetration testing, security audit, 4 năm kinh nghiệm"
        )
        
        db.session.add_all([applicant2, applicant3, applicant4, applicant5, applicant6, 
                           applicant7, applicant8, applicant9, applicant10, applicant11])
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
            candidate_id=applicant2.id,
            job_post_id=job1.id,
            cv_url="https://res.cloudinary.com/demo/raw/upload/sample_cv_tranthib_backend.pdf",
            status=ApplicationStatus.TU_CHOI,
            applied_at=datetime.now() - timedelta(days=8)
        )
        
        app4 = Application(
            candidate_id=applicant3.id,
            job_post_id=job1.id,
            cv_url="https://res.cloudinary.com/demo/raw/upload/sample_cv_lequangc.pdf",
            status=ApplicationStatus.DA_NOP,
            applied_at=datetime.now() - timedelta(days=3)
        )
        
        app5 = Application(
            candidate_id=applicant4.id,
            job_post_id=job1.id,
            cv_url="https://res.cloudinary.com/demo/raw/upload/sample_cv_phamthid.pdf",
            status=ApplicationStatus.DA_DUYET,
            applied_at=datetime.now() - timedelta(days=7)
        )
        
        app6 = Application(
            candidate_id=applicant4.id,
            job_post_id=job2.id,
            cv_url="https://res.cloudinary.com/demo/raw/upload/sample_cv_phamthid_frontend.pdf",
            status=ApplicationStatus.DA_NOP,
            applied_at=datetime.now() - timedelta(days=2)
        )
        
        app7 = Application(
            candidate_id=applicant1.id,
            job_post_id=job2.id,
            cv_url="https://res.cloudinary.com/demo/raw/upload/sample_cv_nguyenvana_frontend.pdf",
            status=ApplicationStatus.TU_CHOI,
            applied_at=datetime.now() - timedelta(days=12)
        )
        
        db.session.add_all([app1, app2, app3, app4, app5, app6, app7])
        db.session.commit()
        
        notif1 = Notification(
            user_id=ungvien1.id,
            type=NotificationType.APPLICATION_STATUS,
            content='Đơn ứng tuyển của bạn cho vị trí "Backend Developer (Python/Java)" tại FPT Software đã được duyệt. Nhà tuyển dụng sẽ liên hệ với bạn trong thời gian sớm nhất.',
            related_type='application',
            related_id=app1.id,
            is_read=False,
            created_at=datetime.now() - timedelta(minutes=5)
        )
        
        
        notif2 = Notification(
            user_id=ungvien1.id,
            type=NotificationType.NEW_APPLICATION,
            content='Công việc mới phù hợp với bạn: "Senior Backend Engineer (Go/Node.js)" tại M_Service (MoMo) với mức lương 25-40 triệu VNĐ. Khám phá ngay!',
            related_type='job_post',
            related_id=job6.id,
            is_read=False,
            created_at=datetime.now() - timedelta(hours=2)
        )
        
        db.session.add_all([notif1, notif2])
        db.session.commit()
