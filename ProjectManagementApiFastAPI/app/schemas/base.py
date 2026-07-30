from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """
    All request/response schemas should inherit from this instead of BaseModel.

    .NET's default JSON serialization (System.Text.Json) converts C# PascalCase
    properties to camelCase in JSON (e.g. CreatedByUserName -> createdByUserName).
    Since the Angular frontend is staying exactly as-is, every FastAPI response
    must match that same camelCase shape, or Angular's services will silently
    receive undefined fields.

    - alias_generator=to_camel: outgoing JSON uses camelCase keys
    - populate_by_name=True: incoming JSON can use EITHER camelCase (what Angular
      actually sends) OR the Python snake_case field name (handy for tests/scripts)
    - from_attributes=True: lets us build these directly from SQLAlchemy model
      instances (e.g. ProjectResponse.model_validate(project_orm_object))
    """

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )