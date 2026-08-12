from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_cors import CORS
import cloudinary

app = Flask(__name__)


from web.config import Config
app.config.from_object(Config)


CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})


db = SQLAlchemy(app=app)


login_manager = LoginManager()
login_manager.init_app(app)


from web import dao

@login_manager.user_loader
def load_user(user_id):
    return dao.get_user_by_id(user_id)


from flask_mail import Mail

mail = Mail(app)


cloudinary.config(
    cloud_name=Config.CLOUD_NAME,
    api_key=Config.API_KEY,
    api_secret=Config.API_SECRET
)


from flask_socketio import SocketIO

socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')


user_sockets = {}


import firebase_admin
from firebase_admin import credentials
import os

try:
    
    basedir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
    
    
    firebase_cred_filename = os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH', 'job-searching-firebase-adminsdk.json')
    
    
    firebase_cred_path = os.path.join(basedir, firebase_cred_filename)
    firebase_database_url = os.getenv('FIREBASE_DATABASE_URL')
    
    if os.path.exists(firebase_cred_path):
        cred = credentials.Certificate(firebase_cred_path)
        firebase_admin.initialize_app(cred, {
            'databaseURL': firebase_database_url
        })
        print(f"✓ Firebase initialized successfully from: {firebase_cred_path}")
    else:
        print(f"⚠ Firebase service account key not found at: {firebase_cred_path}")
        print(f"   Base dir: {basedir}")
        print(f"   Looking for: {firebase_cred_filename}")
except Exception as e:
    print(f"⚠ Firebase initialization failed: {e}")


from flask import request

@socketio.on('connect')
def handle_connect():
    print(f"Client connected: {request.sid}")

@socketio.on('disconnect')
def handle_disconnect():
    
    for user_id, sid in list(user_sockets.items()):
        if sid == request.sid:
            del user_sockets[user_id]
            print(f"User {user_id} disconnected")
            break

@socketio.on('register')
def handle_register(user_id):
    user_sockets[user_id] = request.sid
    print(f"User {user_id} registered with socket {request.sid}")

@socketio.on('new_message_sent')
def handle_new_message(data):
    try:
        recipient_id = data.get('recipient_id')
        sender_id = data.get('sender_id')
        sender_name = data.get('sender_name')
        sender_role = data.get('sender_role')
        company_name = data.get('company_name')
        company_id = data.get('company_id')
        message = data.get('message')
        
        print(f" [socketio] Received new_message_sent event:")
        print(f"   - recipient_id: {recipient_id}")
        print(f"   - sender_id: {sender_id}")
        print(f"   - sender_name: {sender_name}")
        print(f"   - sender_role: {sender_role}")
        print(f"   - company_name: {company_name}")
        print(f"   - message preview: {message[:50] if message else 'N/A'}...")
        
        
        if sender_role == 'nhatuyendung':
            notification_text = f"Có tin nhắn mới từ nhà tuyển dụng {company_name or sender_name}"
        else:
            notification_text = f"Có tin nhắn mới từ ứng viên {sender_name}"
        
        print(f"💬 [socketio] Creating notification: {notification_text}")
        
        
        
        
        
        
        from web.models import User
        recipient_user = User.query.get(recipient_id)
        
        if recipient_user:
            if recipient_user.role.value == 'ungvien':
                
                nav_id = company_id or sender_id
                print(f"   → Recipient is candidate, saving company_id: {nav_id}")
            else:
                
                nav_id = sender_id
                print(f"   → Recipient is recruiter, saving candidate_id: {nav_id}")
        else:
            
            nav_id = sender_id
            print(f"   ⚠ Recipient user not found, using sender_id: {nav_id}")
        
        
        from web.utils.notification_helper import create_and_emit_notification
        from web.models import NotificationType
        
        notification = create_and_emit_notification(
            user_id=recipient_id,
            notification_type=NotificationType.NEW_MESSAGE,
            content=notification_text,
            related_type='message',
            related_id=nav_id
        )
        
        print(f"✓ [socketio] Message notification created (ID: {notification.id}) and emitted to user {recipient_id}")
            
    except Exception as e:
        print(f"✗ [socketio] Error handling new message: {e}")
        import traceback
        traceback.print_exc()


from web.blueprints import (
    auth_bp,
    profile_bp,
    jobs_bp,
    applications_bp,
    cvs_bp,
    company_jobs_bp,
    company_applications_bp,
    common_bp,
    admin_users_bp,
    admin_companies_bp,
    admin_jobs_bp,
    admin_stats_bp,
    notifications_bp,
    job_reviews_bp,
    company_follow_bp,
    export_bp,
    ai_bp
)

app.register_blueprint(auth_bp)
app.register_blueprint(profile_bp)
app.register_blueprint(jobs_bp)
app.register_blueprint(applications_bp)
app.register_blueprint(cvs_bp)
app.register_blueprint(company_jobs_bp)
app.register_blueprint(company_applications_bp)
app.register_blueprint(common_bp)
app.register_blueprint(admin_users_bp)
app.register_blueprint(admin_companies_bp)
app.register_blueprint(admin_jobs_bp)
app.register_blueprint(admin_stats_bp)
app.register_blueprint(notifications_bp)
app.register_blueprint(job_reviews_bp)
app.register_blueprint(company_follow_bp)
app.register_blueprint(export_bp)
app.register_blueprint(ai_bp)


from web.services.job_expiry_service import register_job_expiry_sweeper

register_job_expiry_sweeper(app)
