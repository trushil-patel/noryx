from functools import lru_cache

from supabase import Client, create_client

from memora.config import get_settings


@lru_cache
def auth_client() -> Client:
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_publishable_key)


@lru_cache
def admin_client() -> Client:
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)
