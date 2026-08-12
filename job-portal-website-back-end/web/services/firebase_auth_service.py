from firebase_admin import auth


def generate_firebase_token(user_id, additional_claims=None):
    try:
        
        uid = str(user_id)
        
        
        if additional_claims is None:
            additional_claims = {}
        
        
        custom_token = auth.create_custom_token(uid, additional_claims)
        
        
        if isinstance(custom_token, bytes):
            custom_token = custom_token.decode('utf-8')
        
        return custom_token
        
    except Exception as e:
        raise Exception(f"Failed to generate Firebase token: {str(e)}")
