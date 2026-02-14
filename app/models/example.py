"""Example model for demonstration purposes."""

from sqlmodel import Field, SQLModel


class ExampleModel(SQLModel, table=True):
    """Example database model."""

    __tablename__ = "examples"

    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(max_length=255)
    description: str | None = Field(default=None, max_length=500)
