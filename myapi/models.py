# myapi/models.py
from django.db import models
from django.utils import timezone


class Invoice(models.Model):
    customer = models.CharField(max_length=100)
    date = models.DateField(default=timezone.now)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Invoice #{self.id} - {self.customer}"


class InvoiceDetails(models.Model):
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name="details"
    )

    # user-visible fields
    item_name = models.CharField(max_length=200)      
    unit_price = models.FloatField()                  
    quantity = models.PositiveIntegerField(default=1)  
    # tax/discount as percentages
    tax = models.FloatField(default=0.0)     
    discount = models.FloatField(default=0.0)  

    # calculated
    total = models.FloatField(editable=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        subtotal = float(self.unit_price) * float(self.quantity)
        tax_amt = subtotal * (float(self.tax) / 100.0)
        discount_amt = subtotal * (float(self.discount) / 100.0)
        self.total = subtotal + tax_amt - discount_amt
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.item_name} (Invoice #{self.invoice.id})"
