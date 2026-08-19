"""
Custom pagination for ClipMind AI.
"""
from rest_framework.pagination import PageNumberPagination
from core.responses import success_response


class StandardPagination(PageNumberPagination):
    """Default pagination: 20 items per page, configurable via query param."""

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100

    def get_paginated_response(self, data):
        return success_response(
            message="Data retrieved successfully.",
            data={
                "count": self.page.paginator.count,
                "next": self.get_next_link(),
                "previous": self.get_previous_link(),
                "results": data,
            },
        )
