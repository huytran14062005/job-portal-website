from datetime import datetime


def parse_date_flexible(value, error_message="Ngày tháng sai định dạng"):
    if not value:
        return None
    
    
    if hasattr(value, 'date') and callable(value.date):
        return value.date()
    
    if isinstance(value, datetime):
        return value.date()
    
    
    value = str(value).strip()
    if not value:
        return None
    
    
    formats = [
        "%d-%m-%Y",  
        "%Y-%m-%d",  
        "%d/%m/%Y",  
        "%Y/%m/%d",  
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            continue
    
    
    raise ValueError(error_message)


def format_date_to_vn(date_obj):
    if not date_obj:
        return None
    
    try:
        return date_obj.strftime("%d-%m-%Y")
    except (AttributeError, ValueError):
        return None


def parse_and_format_date(value):
    if not value:
        return None
    
    parsed_date = parse_date_flexible(value)
    return format_date_to_vn(parsed_date)
