from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),

    # invoices
    path("invoice/", views.invoice_list, name="invoice-list"),
    path("invoice/<int:pk>/", views.edit_invoice, name="invoice-edit"),
    path("next-invoice-id/", views.next_invoice_id, name="next-invoice-id"),

    # invoice items
    path("invoice-details/", views.invoice_details_list, name="invoice-details"),         # GET filtered or POST create
    path("invoice-details/<int:pk>/", views.edit_invoice_details, name="invoice-details-edit"),

    # full invoice + items (optional)
    path("invoice-full/<int:pk>/", views.invoice_full_details, name="invoice-full-details"),

    # PDF
    path("invoice-pdf/<int:pk>/", views.invoice_pdf, name="invoice-pdf"),
]
