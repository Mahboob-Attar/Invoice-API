from django.shortcuts import render, get_object_or_404
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from django.http import HttpResponse
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors

from .models import Invoice, InvoiceDetails
from .serializers import InvoiceSerializer, InvoiceDetailsSerializer


# FRONTEND HOME VIEW
def home(request):
    return render(request, "index.html")


# NEXT INVOICE ID (optional helper)
@api_view(['GET'])
def next_invoice_id(request):
    try:
        last_id = Invoice.objects.latest("id").id
        return Response({"next_id": last_id + 1})
    except Invoice.DoesNotExist:
        return Response({"next_id": 1})


# INVOICE LIST + CREATE
@api_view(['GET', 'POST'])
def invoice_list(request):
    if request.method == 'GET':
        invoices = Invoice.objects.all().order_by("id")
        serializer = InvoiceSerializer(invoices, many=True)
        return Response(serializer.data)

    serializer = InvoiceSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data, status=status.HTTP_201_CREATED)


# INVOICE RETRIEVE / UPDATE / DELETE
@api_view(['GET', 'PUT', 'DELETE'])
def edit_invoice(request, pk):
    invoice = get_object_or_404(Invoice, pk=pk)
    if request.method == 'GET':
        serializer = InvoiceSerializer(invoice)
        return Response(serializer.data)
    if request.method == 'PUT':
        serializer = InvoiceSerializer(invoice, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    invoice.delete()
    return Response({"detail": "Invoice deleted"}, status=status.HTTP_204_NO_CONTENT)


# INVOICE-ITEMS GET (filtered) OR POST (create)
@api_view(['GET', 'POST'])
def invoice_details_list(request):
    """
    GET /invoice-details/?invoice=<id>  -> returns items for invoice
    POST /invoice-details/create/      -> create new item (same view supports POST here)
    """
    if request.method == 'GET':
        invoice_id = request.GET.get("invoice")
        if not invoice_id:
            return Response([], status=200)
        items = InvoiceDetails.objects.filter(invoice_id=invoice_id)
        serializer = InvoiceDetailsSerializer(items, many=True)
        return Response(serializer.data)

    # POST create
    serializer = InvoiceDetailsSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data, status=status.HTTP_201_CREATED)


# EDIT / DELETE A SINGLE ITEM
@api_view(['GET', 'PUT', 'DELETE'])
def edit_invoice_details(request, pk):
    detail = get_object_or_404(InvoiceDetails, pk=pk)
    if request.method == 'GET':
        serializer = InvoiceDetailsSerializer(detail)
        return Response(serializer.data)
    if request.method == 'PUT':
        serializer = InvoiceDetailsSerializer(detail, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    detail.delete()
    return Response({"detail": "Invoice detail deleted"}, status=status.HTTP_204_NO_CONTENT)


# FULL INVOICE + ITEMS (for popup)
@api_view(['GET'])
def invoice_full_details(request, pk):
    invoice = get_object_or_404(Invoice, pk=pk)
    items = InvoiceDetails.objects.filter(invoice=pk)
    invoice_ser = InvoiceSerializer(invoice)
    item_ser = InvoiceDetailsSerializer(items, many=True)
    return Response({"invoice": invoice_ser.data, "items": item_ser.data})


# PDF generator
@api_view(['GET'])
def invoice_pdf(request, pk):
    invoice = get_object_or_404(Invoice, pk=pk)
    items = InvoiceDetails.objects.filter(invoice=pk)

    response = HttpResponse(content_type="application/pdf")
    response['Content-Disposition'] = f'attachment; filename="invoice_{pk}.pdf"'

    doc = SimpleDocTemplate(response, pagesize=A4, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=18)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph(f"Invoice #{invoice.id}", styles['Title']))
    story.append(Paragraph(f"Customer: {invoice.customer}", styles['Normal']))
    story.append(Paragraph(f"Date: {invoice.date}", styles['Normal']))
    story.append(Spacer(1, 12))

    # Table header
    table_data = [["Item", "Qty", "Unit Price", "Tax %", "Discount %", "Total"]]
    grand_total = 0.0

    for it in items:
        table_data.append([
            it.item_name,
            str(it.quantity),
            f"{it.unit_price:.2f}",
            f"{it.tax:.2f}",
            f"{it.discount:.2f}",
            f"{it.total:.2f}",
        ])
        grand_total += float(it.total)

    # add grand total row
    table_data.append(["", "", "", "", "Grand Total", f"{grand_total:.2f}"])

    tbl = Table(table_data, hAlign='LEFT', colWidths=[180, 50, 70, 60, 70, 70])
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F3F4F6')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('ALIGN', (-2,0), (-1,-1), 'RIGHT'),
    ]))

    story.append(tbl)
    doc.build(story)
    return response
