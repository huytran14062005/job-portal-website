import cloudinary.uploader


def extract_public_id_from_url(cloudinary_url):
    if not cloudinary_url or 'cloudinary.com' not in cloudinary_url:
        return None
    
    try:
        url_parts = cloudinary_url.split('/')
        
        
        if 'upload' not in url_parts:
            
            filename_with_ext = cloudinary_url.split('/')[-1]
            return filename_with_ext.rsplit('.', 1)[0]
        
        upload_index = url_parts.index('upload')
        parts_after_upload = url_parts[upload_index + 1:]
        
        
        if parts_after_upload and parts_after_upload[0].startswith('v') and parts_after_upload[0][1:].isdigit():
            resource_path = '/'.join(parts_after_upload[1:])
        else:
            resource_path = '/'.join(parts_after_upload)
        
        
        public_id = resource_path.rsplit('.', 1)[0]
        return public_id
        
    except Exception as e:
        print(f"✗ Không thể extract public_id từ URL: {e}")
        return None


def delete_cloudinary_image(cloudinary_url, resource_type="image"):
    if not cloudinary_url or 'cloudinary.com' not in cloudinary_url:
        return True  
    
    try:
        public_id = extract_public_id_from_url(cloudinary_url)
        if public_id:
            cloudinary.uploader.destroy(public_id, resource_type=resource_type)
            print(f"✓ Đã xóa {resource_type} trên Cloudinary: {public_id}")
            return True
    except Exception as e:
        print(f"✗ Không thể xóa {resource_type} trên Cloudinary: {e}")
        return False
    
    return True


def upload_cloudinary_image(file, folder=None):
    if not file or not file.filename:
        return None
    
    try:
        upload_options = {}
        if folder:
            upload_options['folder'] = folder
        
        res = cloudinary.uploader.upload(file, **upload_options)
        secure_url = res.get("secure_url")
        
        if secure_url:
            print(f"✓ Upload thành công: {secure_url}")
        
        return secure_url
    except Exception as e:
        print(f"✗ Upload thất bại: {e}")
        return None


def replace_cloudinary_image(old_url, new_file, folder=None, resource_type="image"):
    
    if not new_file or not new_file.filename:
        return False, None, "File không hợp lệ"
    
    
    new_url = upload_cloudinary_image(new_file, folder=folder)
    
    if not new_url:
        return False, None, "Upload image mới thất bại"
    
    
    delete_cloudinary_image(old_url, resource_type=resource_type)
    
    return True, new_url, None
