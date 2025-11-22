from django.contrib import admin
from .models import Invoice, InvoiceDetails

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['id', 'customer', 'date']


@admin.register(InvoiceDetails)
class InvoiceDetailsAdmin(admin.ModelAdmin):
    list_display = ['id', 'invoice', 'description', 'quantity', 'unit_price', 'price']
