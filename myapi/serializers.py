from rest_framework import serializers
from .models import Invoice, InvoiceDetails


class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = '__all__'
        # date is supplied manually by frontend, customer is required
        read_only_fields = []


class InvoiceDetailsSerializer(serializers.ModelSerializer):

    class Meta:
        model = InvoiceDetails
        fields = '__all__'

        # price is auto-calculated in the model's save()
        read_only_fields = ['price']
