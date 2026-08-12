import traceback
from functools import wraps

from flask import jsonify

from web.services.exceptions import AppError


def handle_api_errors(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except AppError as ex:
            return jsonify({"error": str(ex)}), ex.status_code
        except ValueError as ex:
            return jsonify({"error": str(ex)}), 400
        except Exception as ex:
            traceback.print_exc()
            return jsonify({"error": str(ex)}), 500

    return decorated
