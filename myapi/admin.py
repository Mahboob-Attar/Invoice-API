from django.contrib import admin
from .models import Invoice, InvoiceDetails


class InvoiceDetailsInline(admin.TabularInline):
    model = InvoiceDetails
    extra = 1
    readonly_fields = ("total",)  # show calculated total


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ("id", "customer", "date")
    search_fields = ("customer",)
    list_filter = ("date",)
    inlines = [InvoiceDetailsInline]


@admin.register(InvoiceDetails)
class InvoiceDetailsAdmin(admin.ModelAdmin):
    list_display = ("id", "invoice", "item_name", "quantity", "unit_price", "tax", "discount", "total")
    search_fields = ("item_name",)  # 'description' doesn't exist
    list_filter = ("invoice",)
    readonly_fields = ("total",)
