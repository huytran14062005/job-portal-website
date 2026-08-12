import io
from datetime import datetime

import pandas as pd

from web.dao import export_dao
from web.services.application_service import parse_application_status_filter
from web.services.exceptions import NotFoundError


_COMPANY_SHEET_WIDTHS = [8, 25, 30, 20, 35, 30, 15, 20, 50]
_CANDIDATE_SHEET_WIDTHS = [8, 30, 35, 25, 15, 20, 15]


def _build_excel_file(rows, sheet_name, column_widths):
    output = io.BytesIO()

    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        pd.DataFrame(rows).to_excel(writer, index=False, sheet_name=sheet_name)

        worksheet = writer.sheets[sheet_name]
        for index, width in enumerate(column_widths):
            worksheet.column_dimensions[chr(ord('A') + index)].width = width

    output.seek(0)

    return output


def export_company_applications_service(company_id, job_id=None, status_value=None):
    applications = export_dao.get_company_applications_for_export(
        company_id=company_id,
        job_id=job_id,
        status=parse_application_status_filter(status_value)
    )

    
    if not applications:
        raise NotFoundError("Không có dữ liệu để xuất")

    rows = [{
        "STT": index,
        "Họ tên": row.full_name or "N/A",
        "Email": row.candidate_email or "N/A",
        "Số điện thoại": row.phone or "N/A",
        "Địa chỉ": row.address or "N/A",
        "Vị trí ứng tuyển": row.job_title,
        "Trạng thái": row.status.value if row.status else "N/A",
        "Ngày ứng tuyển": row.applied_at.strftime('%d/%m/%Y %H:%M') if row.applied_at else "N/A",
        "Link CV": row.cv_url or "N/A"
    } for index, row in enumerate(applications, start=1)]

    output = _build_excel_file(rows, 'Danh sách ứng viên', _COMPANY_SHEET_WIDTHS)

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = (
        f'DanhSach_UngVien_Job{job_id}_{timestamp}.xlsx' if job_id
        else f'DanhSach_UngVien_{timestamp}.xlsx'
    )

    return output, filename


def export_candidate_applications_service(candidate_id):
    applications = export_dao.get_candidate_applications_for_export(candidate_id)

    
    if not applications:
        raise NotFoundError("Bạn chưa có đơn ứng tuyển nào")

    rows = []
    for index, row in enumerate(applications, start=1):
        if row.min_salary and row.max_salary:
            salary_range = f"{row.min_salary:,} - {row.max_salary:,} VNĐ"
        elif row.min_salary:
            salary_range = f"Từ {row.min_salary:,} VNĐ"
        else:
            salary_range = "Thỏa thuận"

        rows.append({
            "STT": index,
            "Công ty": row.company_name,
            "Vị trí": row.job_title,
            "Mức lương": salary_range,
            "Trạng thái": row.status.value if row.status else "N/A",
            "Ngày nộp": row.applied_at.strftime('%d/%m/%Y %H:%M') if row.applied_at else "N/A",
            "Deadline": row.deadline.strftime('%d/%m/%Y') if row.deadline else "N/A"
        })

    output = _build_excel_file(rows, 'Lịch sử ứng tuyển', _CANDIDATE_SHEET_WIDTHS)
    filename = f'LichSu_UngTuyen_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'

    return output, filename
