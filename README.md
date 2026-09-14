# JobSearching

### Job Search and Recruitment Platform

JobSearching is a job search and recruitment platform for candidates, recruiters, and administrators.

## Description

JobSearching helps candidates discover suitable jobs, manage uploaded CVs, submit applications, and track recruitment results. Recruiters can manage company information, publish job posts, review applications, and communicate with candidates. Administrators moderate users, companies, and job posts while monitoring platform statistics.

The platform also provides real-time notifications and messaging, email-based password recovery, and AI-assisted CV evaluation based on the requirements of a selected job.

### Features

- Candidates: Search and filter jobs, follow companies, save jobs, manage CV files, apply for jobs, track applications, review jobs, and evaluate CV compatibility with Gemini AI.
- Recruiters: Manage company profiles, create and update job posts, review candidate information and CVs, and approve or reject applications.
- Administrators: Manage user accounts, approve companies, moderate job posts, and view system statistics.
- Accounts and communication: Role-based registration, JWT authentication, password recovery by email OTP, notifications, and candidate-recruiter messaging.

### Technology Stack

- Frontend: React, React Router, Axios, Chart.js, Moment.js, Firebase SDK, and PDF.js.
- Backend: Python, Flask, SQLAlchemy, Flask-SocketIO, and JWT.
- Database and cache: MySQL and Flask-Caching.
- External services: Cloudinary, Firebase Realtime Database, Gemini API, and SMTP.

## Getting Started

### Dependencies

- Python, Node.js, npm, MySQL, and Git.
- Accounts and credentials for the external services used by the project.

### Installing

1. Clone the repository and open the project directory.
2. Create a MySQL database and import the project database dump, including its schema and initial data.
3. Create `job-portal-website-back-end/.env` and provide the configuration required by your environment.
4. Install the backend dependencies:

```bash
cd job-portal-website-back-end
python -m venv .venv
source .venv/Scripts/activate
pip install -r requirements.txt
```

5. Install the frontend dependencies:

```bash
cd job-portal-website-front-end
npm ci
```

### Environment Configuration

- Backend: Configure the MySQL connection (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME`), `SECRET_KEY`, `JWT_SECRET`, and allowed frontend origins.
- Frontend: Set `REACT_APP_API_URL` to the backend API URL. Use `http://localhost:5000/api` for local development.
- Cloudinary: Provide the cloud name and API credentials for CVs, avatars, and company logos.
- Firebase: Provide the Realtime Database URL and Firebase service-account credentials for messaging.
- Email and AI: Provide SMTP credentials for OTP emails and a Gemini API key for CV evaluation.

Keep `.env` files and service-account credentials private and do not commit them to Git.

### Running the Application

Start the backend from `job-portal-website-back-end`:

```bash
source .venv/Scripts/activate
python -m web.index
```

In another terminal, start the frontend from `job-portal-website-front-end`:

```bash
npm start
```

- Frontend: http://localhost:3000/job-portal-website/
- Backend: http://localhost:5000

### Building and Deployment

Build the frontend with `npm run build` or publish it to GitHub Pages with `npm run deploy`. The Flask backend can be deployed to Vercel, while the production MySQL database can be hosted on Railway. Environment variables must be configured separately for each deployment platform.

## Help

If the application does not start, verify the database connection and environment variables, then restart the backend. Rebuild and redeploy the frontend after changing its API URL.

## License

No license.
