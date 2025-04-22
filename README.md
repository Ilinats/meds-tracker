# MedsTracker - Medication Management System

MedsTracker is a  medication management system designed to help users track their medication inventory and schedule doses. The application provides features for medication tracking, scheduling, alerts for low stock and expiring medicines. For user comfort there is a set of medicines that they can directly add to their collection, but if some medicine is not there they can always create a custom one. 

## Live API

The API is deployed and accessible.

## Features

### Trustworthy medicine information
- For the ready to add medicines there is official FDA information (from the FDA api) about:
    - Short description of the medicine 
    - Precautions - general things a user may want to know about medication
    - Adverse reactions - with what you can take/not take certain medicine
    - Dosage and administration - based on the user's health/age how and when to take it.

### Medication Management
- Add medicines to personal collection
- Create personalized medicines for collection
- Track medication quantities
- Monitor expiration dates
- Categorize medicines
- Support for different medicine units (pills, ml, etc.)
- Preset medicines database for quick addition

### Scheduling System
- Create custom medication schedules
- Set multiple daily doses
- Track medication adherence
- Record medicine intake

### Alert System
- Low stock alerts
- Expiring medication warnings
- Upcoming dose reminders
- Smart scheduling notifications

## Why MedsTracker?

Managing medications can be challenging, especially for:
- People that just want to know what is in the 
  medicine cabinet with the press of a button
- People taking multiple medications
- Caregivers managing medications for others
- Those with complex medication schedules
- Anyone wanting to ensure medication adherence

## API Documentation

### Authentication Endpoints

#### Register a New User
```http
POST /auth/register
Content-Type: application/json

{
    "username": "your_username",
    "password": "your_password"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
    "username": "your_username",
    "password": "your_password"
}
```

### Medicine Management Endpoints

#### Add Medicine to Collection
```http
POST /medicines
Authorization: Bearer your_token
Content-Type: application/json

{
    "name": "Medicine Name",
    "category": "Category",
    "unit": "PILL",
    "quantity": 30,
    "expiryDate": "2024-12-31",
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "dosagePerDay": 2,
    "prescription": false,
    "schedules": [
        {
            "timesOfDay": ["09:00", "21:00"],
            "repeatDays": ["MONDAY", "WEDNESDAY", "FRIDAY"],
            "dosageAmount": 1
        }
    ]
}
```

#### Get User's Medicines
```http
GET /medicines/user
Authorization: Bearer your_token
```

#### Update Medicine
```http
PUT /medicines/:id
Authorization: Bearer your_token
Content-Type: application/json

{
    "quantity": 25,
    "schedules": [
        {
            "timesOfDay": ["10:00"],
            "repeatDays": ["MONDAY"],
            "dosageAmount": 1
        }
    ]
}
```

#### Delete Medicine
```http
DELETE /medicines/:id
Authorization: Bearer your_token
```

### Scheduler Endpoints

#### Record Medicine Intake
```http
POST /medicines/intake/:scheduleId
Authorization: Bearer your_token
Content-Type: application/json

{
    "takenAt": "2024-01-20T09:00:00Z"
}
```

#### Get Expiring Medicines
```http
GET /scheduler/expiring
Authorization: Bearer your_token
```

#### Get Low Stock Medicines
```http
GET /scheduler/low-stock
Authorization: Bearer your_token
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```http
Authorization: Bearer your_jwt_token
```

The token is obtained upon successful login or registration.

