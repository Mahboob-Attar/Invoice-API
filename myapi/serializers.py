from rest_framework import serializers
from .models import Invoice, InvoiceDetails


class InvoiceDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceDetails
        fields = [
            'id',
            'invoice',
            'item_name',
            'unit_price',
            'quantity',
            'tax',
            'discount',
            'total',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'total', 'created_at', 'updated_at']


class InvoiceSerializer(serializers.ModelSerializer):
    # include nested items when returning invoices
    items = InvoiceDetailsSerializer(source='details', many=True, read_only=True)
    class Meta:
        model = Invoice
        fields = ['id', 'customer', 'date', 'items', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
