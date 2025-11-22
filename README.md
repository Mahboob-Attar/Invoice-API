# Invoice API

## Overview

This Django-based backend API project serves as an Invoice Management System, providing endpoints to manage invoices and their details.

## Features

- **Invoice Management**: CRUD operations for invoices, including listing, creating, updating, and deleting invoices.
- **Invoice Details Management**: CRUD operations for invoice details, including listing, creating, updating, and deleting invoice details.
- **Automatic Price Calculation**: The system automatically calculates the price of invoice details based on quantity and unit price.

## Setup

1. **Clone the Repository**: `git clone git@github.com:Pro-Ace-grammer/Invoice-API.git`
2. **Install Dependencies**: `pip install -r requirements.txt`
3. **Run Migrations**: `python manage.py makemigrations && python manage.py migrate`
4. **Start the Development Server**: `python manage.py runserver`

## Endpoints

- **GET /invoice/**: Retrieve a list of all invoices.
- **POST /invoice/**: Create a new invoice.
- **GET /invoice/<pk>**: Retrieve details of a specific invoice.
- **PUT /invoice/<pk>**: Update a specific invoice.
- **DELETE /invoice/<pk>**: Delete a specific invoice.
- **GET /invoice-details/**: Retrieve a list of all invoice details.
- **POST /invoice-details/**: Create a new invoice detail.
- **GET /invoice-details/<pk>**: Retrieve details of a specific invoice detail.
- **PUT /invoice-details/<pk>**: Update a specific invoice detail.
- **DELETE /invoice-details/<pk>**: Delete a specific invoice detail.

## Technologies Used

- Django
- Django Rest Framework
- SQLite

## Folder Structure

- **/myapi**: Contains Django app for API endpoints.
# Invoice-API