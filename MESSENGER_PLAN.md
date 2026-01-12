# Messenger.io Platform - Implementation Plan

## Overview
A comprehensive SMS messaging platform that allows admins to manage contacts, create groups, send messages instantly or schedule them for later, with dashboard metrics and third-party SMS provider integration.

---

## 1. Database Schema Design

### 1.1 Contacts Table
```typescript
Contact {
  id: number (PK)
  name: string
  phone: string (unique, indexed)
  createdAt: timestamp
  updatedAt: timestamp
}
```

### 1.2 Groups Table
```typescript
Group {
  id: number (PK)
  name: string (unique)
  description: string (nullable)
  createdBy: number (FK -> User)
  createdAt: timestamp
  updatedAt: timestamp
  contacts: Contact[] (Many-to-Many relationship)
}
```

### 1.3 GroupContacts Table (Join Table)
```typescript
GroupContact {
  id: number (PK)
  groupId: number (FK -> Group)
  contactId: number (FK -> Contact)
  createdAt: timestamp
  // Unique constraint on (groupId, contactId)
}
```

### 1.4 Messages Table
```typescript
Message {
  id: number (PK)
  title: string
  body: string (text)
  status: enum ['PENDING', 'SENT', 'FAILED', 'SCHEDULED', 'CANCELLED']
  scheduledAt: timestamp (nullable) // null = send immediately
  sentAt: timestamp (nullable)
  recipientType: enum ['CONTACT', 'GROUP']
  recipientId: number // Contact ID or Group ID based on recipientType
  sentBy: number (FK -> User)
  smsProviderId: string (nullable) // Third-party SMS provider message ID
  smsProviderResponse: json (nullable) // Store provider response
  createdAt: timestamp
  updatedAt: timestamp
}
```

### 1.5 MessageRecipients Table (for tracking individual SMS sends)
```typescript
MessageRecipient {
  id: number (PK)
  messageId: number (FK -> Message)
  contactId: number (FK -> Contact)
  phone: string // Store phone at time of send
  status: enum ['PENDING', 'SENT', 'FAILED', 'DELIVERED']
  smsProviderId: string (nullable)
  smsProviderResponse: json (nullable)
  sentAt: timestamp (nullable)
  deliveredAt: timestamp (nullable)
  errorMessage: string (nullable)
  createdAt: timestamp
}
```

### 1.6 SMS Provider Configuration Table
```typescript
SmsProviderConfig {
  id: number (PK)
  provider: enum ['AFRICASTALKING', 'TWILIO', 'BULKSMS', 'CUSTOM']
  apiKey: string (encrypted)
  apiSecret: string (encrypted, nullable)
  apiUrl: string (nullable)
  senderId: string
  isActive: boolean
  balance: decimal (nullable) // Cached balance
  balanceLastChecked: timestamp (nullable)
  createdAt: timestamp
  updatedAt: timestamp
}
```

### 1.7 Dashboard Metrics (Computed/Cached)
```typescript
// These can be computed from Messages table or cached in Redis
Metrics {
  totalSmsSent: number
  totalGroups: number
  totalContacts: number
  smsBalance: decimal
  messagesToday: number
  messagesThisWeek: number
  messagesThisMonth: number
  failedMessages: number
  lastUpdated: timestamp
}
```

---

## 2. Backend Modules & API Endpoints

### 2.1 Contacts Module
**Module**: `modules/contacts/`

**Endpoints**:
- `GET /api/contacts` - List all contacts (with pagination, search)
- `GET /api/contacts/:id` - Get contact details
- `POST /api/contacts` - Create single contact
- `POST /api/contacts/bulk` - Bulk create contacts (from UI)
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact
- `GET /api/contacts/search?q=phone` - Search contacts

**Files**:
- `contacts.module.ts`
- `contacts.controller.ts`
- `contacts.service.ts`
- `dto/create-contact.dto.ts`
- `dto/bulk-create-contacts.dto.ts`
- `dto/update-contact.dto.ts`
- `entities/contact.entity.ts`

### 2.2 Groups Module
**Module**: `modules/groups/`

**Endpoints**:
- `GET /api/groups` - List all groups (with contact counts)
- `GET /api/groups/:id` - Get group details with contacts
- `POST /api/groups` - Create group
- `PUT /api/groups/:id` - Update group
- `DELETE /api/groups/:id` - Delete group
- `POST /api/groups/:id/contacts` - Add contacts to group
- `DELETE /api/groups/:id/contacts/:contactId` - Remove contact from group
- `POST /api/groups/:id/upload-excel` - Upload Excel and add contacts to group

**Files**:
- `groups.module.ts`
- `groups.controller.ts`
- `groups.service.ts`
- `dto/create-group.dto.ts`
- `dto/update-group.dto.ts`
- `dto/add-contacts.dto.ts`
- `entities/group.entity.ts`

### 2.3 Messages Module
**Module**: `modules/messages/`

**Endpoints**:
- `GET /api/messages` - List messages (with filters: status, date range)
- `GET /api/messages/:id` - Get message details with recipients
- `POST /api/messages` - Create and send message (instant or scheduled)
- `PUT /api/messages/:id` - Update scheduled message
- `DELETE /api/messages/:id` - Cancel scheduled message
- `POST /api/messages/:id/resend` - Resend failed message
- `GET /api/messages/:id/recipients` - Get message recipients status

**Files**:
- `messages.module.ts`
- `messages.controller.ts`
- `messages.service.ts`
- `dto/create-message.dto.ts`
- `dto/update-message.dto.ts`
- `entities/message.entity.ts`
- `entities/message-recipient.entity.ts`
- `enums/message-status.enum.ts`
- `enums/recipient-type.enum.ts`

### 2.4 SMS Provider Module
**Module**: `modules/sms-provider/`

**Endpoints**:
- `GET /api/sms-provider/config` - Get SMS provider configuration
- `PUT /api/sms-provider/config` - Update SMS provider configuration
- `GET /api/sms-provider/balance` - Get SMS balance (refresh from provider)
- `POST /api/sms-provider/test` - Send test SMS

**Files**:
- `sms-provider.module.ts`
- `sms-provider.controller.ts`
- `sms-provider.service.ts`
- `providers/africastalking.provider.ts`
- `providers/twilio.provider.ts`
- `providers/bulksms.provider.ts`
- `providers/base.provider.ts` (abstract base class)
- `dto/sms-config.dto.ts`
- `entities/sms-provider-config.entity.ts`

### 2.5 Dashboard Module
**Module**: `modules/dashboard/`

**Endpoints**:
- `GET /api/dashboard/metrics` - Get all dashboard metrics
- `GET /api/dashboard/stats` - Get detailed statistics

**Files**:
- `dashboard.module.ts`
- `dashboard.controller.ts`
- `dashboard.service.ts`
- `dto/metrics.dto.ts`

### 2.6 Excel Upload Module (Extend Uploads)
**Module**: `modules/uploads/` (extend existing)

**Endpoints**:
- `POST /api/uploads/excel` - Upload Excel file for contacts
- Returns parsed contacts data

**Files**:
- Extend `uploads.service.ts` with Excel parsing
- Use `xlsx` or `exceljs` library

### 2.7 Scheduled Jobs Module
**Module**: `modules/scheduler/`

**Purpose**: Handle scheduled message sending using cron jobs or queue

**Files**:
- `scheduler.module.ts`
- `scheduler.service.ts` (using @nestjs/schedule)
- `tasks/send-scheduled-messages.task.ts`

---

## 3. Frontend Pages & Components

### 3.1 Dashboard Page
**Page**: `/dashboard`

**Components**:
- `DashboardLayout.jsx` - Main layout (already exists)
- `DashboardMetrics.jsx` - Display key metrics cards
  - Total SMS Sent
  - Total Groups
  - Total Contacts
  - SMS Balance
  - Messages Today/Week/Month
  - Failed Messages
- `RecentMessages.jsx` - Table of recent messages
- `QuickActions.jsx` - Quick action buttons

### 3.2 Groups Page
**Page**: `/dashboard/groups`

**Components**:
- `GroupsList.jsx` - List all groups with contact counts
- `GroupCard.jsx` - Individual group card
- `CreateGroupModal.jsx` - Modal to create new group
- `GroupDetails.jsx` - View/edit group details
- `AddContactsModal.jsx` - Add contacts to group (bulk or Excel)
- `ExcelUpload.jsx` - Excel upload component with preview
- `ContactsList.jsx` - List contacts in a group

### 3.3 Contacts Page
**Page**: `/dashboard/contacts`

**Components**:
- `ContactsTable.jsx` - Table of all contacts (with search, pagination)
- `CreateContactModal.jsx` - Create single contact
- `BulkCreateContacts.jsx` - Bulk create contacts form
- `EditContactModal.jsx` - Edit contact

### 3.4 Messaging Page
**Page**: `/dashboard/messages`

**Components**:
- `MessagesList.jsx` - List all messages (sent, scheduled, failed)
- `SendMessageForm.jsx` - Form to send message
  - Title input
  - Body textarea (with character counter)
  - Recipient selector (Contact dropdown or Group dropdown)
  - Schedule toggle (instant vs scheduled)
  - Date/time picker (if scheduled)
  - Send button
- `MessageDetails.jsx` - View message details with recipient status
- `ScheduledMessages.jsx` - List scheduled messages with cancel option
- `MessageStatusBadge.jsx` - Status badge component

### 3.5 Settings Page
**Page**: `/dashboard/settings`

**Components**:
- `SmsProviderConfig.jsx` - Configure SMS provider
  - Provider selection dropdown
  - API Key input
  - API Secret input
  - Sender ID input
  - Test SMS button
  - Balance display

---

## 4. Third-Party SMS Provider Integration

### 4.1 Supported Providers
1. **Africa's Talking** (Primary recommendation for African markets)
2. **Twilio** (International)
3. **BulkSMS** (Alternative)
4. **Custom Provider** (Generic HTTP API)

### 4.2 Provider Interface
```typescript
interface SmsProvider {
  sendSms(phone: string, message: string): Promise<SmsResponse>;
  getBalance(): Promise<number>;
  validateConfig(config: SmsConfig): boolean;
}
```

### 4.3 SMS Response Format
```typescript
interface SmsResponse {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
  balance?: number;
  rawResponse?: any;
}
```

### 4.4 Implementation Strategy
- Use Strategy Pattern for provider abstraction
- Store provider credentials encrypted in database
- Implement retry logic for failed sends
- Log all SMS attempts and responses
- Cache balance with TTL (refresh every hour)

---

## 5. Excel Upload Implementation

### 5.1 Excel Format
Required columns:
- **Name** (Column A)
- **Phone** (Column B)

Optional:
- Support for headers row
- Skip empty rows
- Phone number validation/formatting

### 5.2 Library Choice
- Use `xlsx` (SheetJS) - lightweight, works in Node.js
- Parse Excel file on backend
- Return parsed data to frontend for preview
- Allow user to confirm before creating contacts

### 5.3 Flow
1. User uploads Excel file
2. Backend parses and validates
3. Return parsed contacts with validation errors
4. Frontend shows preview with errors highlighted
5. User confirms or fixes errors
6. Backend creates contacts and adds to group

---

## 6. Scheduling System

### 6.1 Implementation Options

**Option A: Cron Jobs (Simple)**
- Use `@nestjs/schedule` package
- Run job every minute to check for scheduled messages
- Simple but less scalable

**Option B: Queue System (Recommended)**
- Use `Bull` or `BullMQ` with Redis
- Schedule jobs with delay
- Better for production, handles failures better

**Option C: Database Polling**
- Simple cron job queries database for scheduled messages
- Good for MVP, easy to implement

### 6.2 Recommended: Bull Queue
- Install `@nestjs/bull` and `bull`
- Create message queue
- Schedule jobs when message is created
- Process jobs at scheduled time

---

## 7. Implementation Phases

### Phase 1: Foundation (Week 1)
**Backend**:
1. ✅ Clean up existing code (DONE)
2. Create Contacts module (CRUD)
3. Create Groups module (CRUD)
4. Create Messages module (basic structure)
5. Update seed service (remove extra roles, keep only ADMIN)

**Frontend**:
1. Update dashboard layout menu
2. Create Dashboard page with placeholder metrics
3. Create Groups page (list only)
4. Create Contacts page (list only)

**Database**:
1. Create Contact entity
2. Create Group entity
3. Create GroupContact join table
4. Run migrations

### Phase 2: Core Messaging (Week 2)
**Backend**:
1. Complete Messages module
2. Create MessageRecipient entity
3. Implement SMS Provider module (start with one provider)
4. Implement basic SMS sending
5. Create Dashboard metrics endpoint

**Frontend**:
1. Complete Groups page (create, edit, delete)
2. Complete Contacts page (create, edit, delete, bulk)
3. Create Messaging page (send instant messages)
4. Update Dashboard with real metrics

### Phase 3: Excel Upload & Group Management (Week 3)
**Backend**:
1. Extend Uploads module for Excel
2. Implement Excel parsing
3. Add contacts to groups via Excel
4. Bulk create contacts endpoint

**Frontend**:
1. Excel upload component
2. Excel preview with validation
3. Add contacts to groups UI
4. Bulk create contacts form

### Phase 4: Scheduling & Advanced Features (Week 4)
**Backend**:
1. Implement scheduling system (Bull Queue)
2. Scheduled message processing
3. Message status tracking
4. Retry failed messages
5. SMS balance caching and refresh

**Frontend**:
1. Schedule message UI
2. Scheduled messages list
3. Message details with recipient status
4. Settings page for SMS provider config
5. Resend failed messages

### Phase 5: Polish & Testing (Week 5)
1. Error handling improvements
2. Loading states and UX polish
3. Unit tests for critical paths
4. Integration tests
5. Performance optimization
6. Documentation

---

## 8. Technical Stack Details

### 8.1 Backend Dependencies to Add
```json
{
  "xlsx": "^0.18.5", // Excel parsing
  "@nestjs/schedule": "^4.0.0", // Scheduling
  "bull": "^4.12.0", // Queue system
  "@nestjs/bull": "^10.0.0", // Bull integration
  "redis": "^4.6.0", // Redis for Bull
  "axios": "^1.6.0", // HTTP requests for SMS providers
  "crypto-js": "^4.2.0" // Encrypt SMS provider credentials
}
```

### 8.2 Frontend Dependencies to Add
```json
{
  "xlsx": "^0.18.5", // Excel parsing (optional, can do on backend)
  "react-datepicker": "^4.25.0", // Date/time picker
  "recharts": "^2.10.0" // Charts for dashboard metrics
}
```

### 8.3 Environment Variables
```env
# SMS Provider
SMS_PROVIDER=AFRICASTALKING
AFRICASTALKING_API_KEY=your_api_key
AFRICASTALKING_USERNAME=your_username
AFRICASTALKING_SENDER_ID=your_sender_id

# Redis (for Bull Queue)
REDIS_HOST=localhost
REDIS_PORT=6379

# Encryption
ENCRYPTION_KEY=your_encryption_key
```

---

## 9. API Response Examples

### Create Group
```json
POST /api/groups
{
  "name": "Marketing Team",
  "description": "Marketing department contacts"
}

Response:
{
  "id": 1,
  "name": "Marketing Team",
  "description": "Marketing department contacts",
  "contactCount": 0,
  "createdAt": "2026-01-12T10:00:00Z"
}
```

### Upload Excel to Group
```json
POST /api/groups/1/upload-excel
FormData: { file: <excel_file> }

Response:
{
  "success": true,
  "contactsCreated": 25,
  "contactsSkipped": 2,
  "errors": [
    { "row": 5, "phone": "invalid", "error": "Invalid phone format" }
  ]
}
```

### Send Message
```json
POST /api/messages
{
  "title": "Meeting Reminder",
  "body": "Don't forget about the meeting tomorrow at 2 PM",
  "recipientType": "GROUP",
  "recipientId": 1,
  "scheduledAt": null // null = send immediately
}

Response:
{
  "id": 1,
  "title": "Meeting Reminder",
  "status": "SENT",
  "recipientCount": 25,
  "sentAt": "2026-01-12T10:05:00Z"
}
```

### Schedule Message
```json
POST /api/messages
{
  "title": "Weekly Update",
  "body": "Here's your weekly update...",
  "recipientType": "CONTACT",
  "recipientId": 5,
  "scheduledAt": "2026-01-15T09:00:00Z"
}

Response:
{
  "id": 2,
  "title": "Weekly Update",
  "status": "SCHEDULED",
  "scheduledAt": "2026-01-15T09:00:00Z"
}
```

### Dashboard Metrics
```json
GET /api/dashboard/metrics

Response:
{
  "totalSmsSent": 1250,
  "totalGroups": 12,
  "totalContacts": 350,
  "smsBalance": 5000.50,
  "messagesToday": 45,
  "messagesThisWeek": 180,
  "messagesThisMonth": 650,
  "failedMessages": 5,
  "lastUpdated": "2026-01-12T10:00:00Z"
}
```

---

## 10. Security Considerations

1. **SMS Provider Credentials**: Encrypt before storing in database
2. **Phone Number Validation**: Validate and sanitize phone numbers
3. **Rate Limiting**: Implement rate limiting for SMS sending
4. **Authentication**: All endpoints require JWT authentication
5. **Authorization**: Only ADMIN role can access all features
6. **Input Validation**: Validate all inputs (DTOs with class-validator)
7. **File Upload Limits**: Limit Excel file size (e.g., 5MB)
8. **SQL Injection**: Use TypeORM parameterized queries (already handled)

---

## 11. Error Handling

### SMS Provider Errors
- Network errors: Retry 3 times with exponential backoff
- Invalid credentials: Alert admin, disable sending
- Insufficient balance: Alert admin, prevent sending
- Invalid phone numbers: Skip and log error

### Excel Upload Errors
- Invalid format: Return error with details
- Duplicate contacts: Skip duplicates, return count
- Invalid phone numbers: Highlight in preview, allow user to fix

### Message Sending Errors
- Failed sends: Store error message, allow resend
- Scheduled message failures: Retry once, then mark as failed

---

## 12. Testing Strategy

### Unit Tests
- Contact service (CRUD operations)
- Group service (CRUD, add/remove contacts)
- Message service (create, send, schedule)
- SMS Provider service (send, balance)

### Integration Tests
- Excel upload flow
- Message sending flow
- Scheduled message processing
- Dashboard metrics calculation

### E2E Tests
- Complete user flow: Login → Create Group → Upload Excel → Send Message
- Schedule message and verify it sends at correct time

---

## 13. Deployment Considerations

1. **Redis**: Required for Bull Queue (add to docker-compose)
2. **Environment Variables**: Store SMS provider credentials securely
3. **File Storage**: Excel files can be temporary (delete after processing)
4. **Logging**: Log all SMS sends for audit trail
5. **Monitoring**: Monitor SMS balance, failed sends, queue size
6. **Backup**: Regular database backups

---

## 14. Next Steps

1. Review and approve this plan
2. Set up Redis in docker-compose
3. Start Phase 1: Create Contacts and Groups modules
4. Implement incrementally, test as we go
5. Deploy and iterate

---

## Notes

- Start with one SMS provider (Africa's Talking recommended for African markets)
- Keep it simple for MVP, add features incrementally
- Focus on core functionality first (send messages, create groups)
- Excel upload is important but can be simplified initially
- Scheduling can use simple cron jobs initially, upgrade to queue later if needed
- Dashboard metrics can be computed on-demand initially, cache later if needed

