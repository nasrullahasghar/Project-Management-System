from app.routers.projects import _to_response, router
print("Helper imported:", _to_response)
print("Router's registered routes so far:", [r.path for r in router.routes])