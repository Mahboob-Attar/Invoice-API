from django.urls import path
from .views import (
    home,
    invoice_list,
    edit_invoice,
    invoice_details_list,
    edit_invoice_details
)

urlpatterns = [

    # Frontend Home Page (index.html)
    path("", home, name="home"),

    # Invoice API Endpoints
    path("invoice/", invoice_list, name="invoice-list"),
    path("invoice/<int:pk>/", edit_invoice, name="invoice-edit"),

    # Invoice Details API Endpoints
    path("invoice-details/", invoice_details_list, name="invoice-details-list"),
    path("invoice-details/<int:pk>/", edit_invoice_details, name="invoice-details-edit"),
]
