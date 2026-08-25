from web import cache

def invalidate_public_cache():
    try:
        cache.clear()
    except Exception:
        pass
