from web import dao
from web.services.validators import optional_date, require_date_range


def parse_stats_range(from_value, to_value):
    from_date = optional_date(from_value, "Ngày bắt đầu")
    to_date = optional_date(to_value, "Ngày kết thúc")

    return require_date_range(from_date, to_date)


def get_company_statistics_service(from_value, to_value):
    from_date, to_date = parse_stats_range(from_value, to_value)

    companies, summary = dao.get_company_statistics(from_date=from_date, to_date=to_date)

    return companies, summary, from_date, to_date


def get_user_registration_statistics_service(from_value, to_value):
    from_date, to_date = parse_stats_range(from_value, to_value)

    points, summary = dao.get_user_registration_stats(from_date=from_date, to_date=to_date)

    return points, summary, from_date, to_date
