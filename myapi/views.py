from django.shortcuts import render, get_object_or_404
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from .models import Invoice, InvoiceDetails
from .serializers import InvoiceSerializer, InvoiceDetailsSerializer


def home(request):
    """
    Render the frontend index.html placed at:
    myapi/templates/index.html
    """
    return render(request, "index.html")


# Invoice endpoints
@api_view(['GET', 'POST'])
def invoice_list(request):
    """
    GET:  return list of invoices
    POST: create a new invoice, return created object (201)
    """
    if request.method == 'GET':
        invoices = Invoice.objects.all()
        serializer = InvoiceSerializer(invoices, many=True)
        return Response(serializer.data)

    # POST
    serializer = InvoiceSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'DELETE'])
def edit_invoice(request, pk):
    """
    GET:  retrieve single invoice
    PUT:  update invoice (partial updates via sending only fields is allowed if serializer supports it)
    DELETE: delete invoice
    """
    invoice = get_object_or_404(Invoice, pk=pk)

    if request.method == 'GET':
        serializer = InvoiceSerializer(invoice)
        return Response(serializer.data)

    if request.method == 'PUT':
        serializer = InvoiceSerializer(invoice, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    # DELETE
    invoice.delete()
    return Response({'detail': 'Deleted successfully'}, status=status.HTTP_204_NO_CONTENT)



# InvoiceDetails endpoints
@api_view(['GET', 'POST'])
def invoice_details_list(request):
    """
    GET:  list invoice details
    POST: create a new invoice detail
    """
    if request.method == 'GET':
        details = InvoiceDetails.objects.all()
        serializer = InvoiceDetailsSerializer(details, many=True)
        return Response(serializer.data)

    serializer = InvoiceDetailsSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'DELETE'])
def edit_invoice_details(request, pk):
    """
    GET/PUT/DELETE for InvoiceDetails
    """
    detail = get_object_or_404(InvoiceDetails, pk=pk)

    if request.method == 'GET':
        serializer = InvoiceDetailsSerializer(detail)
        return Response(serializer.data)

    if request.method == 'PUT':
        serializer = InvoiceDetailsSerializer(detail, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    detail.delete()
    return Response({'detail': 'Deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
