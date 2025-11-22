from django.db import models

class Invoice(models.Model):
    customer = models.CharField(max_length=100)
    date = models.DateField()

    def __str__(self):
        return f"{self.customer} ({self.date})"


class InvoiceDetails(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="details")
    description = models.TextField()
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.FloatField()
    price = models.FloatField()

    def save(self, *args, **kwargs):
        # Calculate price automatically
        self.price = self.quantity * self.unit_price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.description} - {self.invoice.customer}"
