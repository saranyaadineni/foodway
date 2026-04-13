# FOODY Backend API Documentation

## Base URL
`http://localhost:3011/api`

## Authentication Routes (`/auth`)

| Endpoint | Method | Description | Sample Request Body |
|----------|--------|-------------|---------------------|
| `/signup` | POST | Register a new user | `{ "fullName": "John Doe", "email": "john@example.com", "password": "Password123!", "mobile": "9876543210", "role": "user" }` |
| `/signin` | POST | Login to account | `{ "email": "john@example.com", "password": "Password123!" }` |
| `/signout` | GET | Logout current user | N/A |
| `/send-otp` | POST | Send OTP for password reset | `{ "email": "john@example.com" }` |
| `/verify-otp` | POST | Verify OTP for password reset | `{ "email": "john@example.com", "otp": "123456" }` |
| `/reset-password` | POST | Reset password | `{ "email": "john@example.com", "password": "NewPassword123!" }` |
| `/user-types` | GET | Get available user types | N/A |
| `/status` | GET | Check auth service status | N/A |

## User Routes (`/user`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/current` | GET | Get current logged-in user details | Yes |
| `/update-location` | POST | Update user's location | Yes |
| `/set-active` | PUT | Toggle user active status | Yes |

## Shop Routes (`/shop`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/get-all` | GET | List all shops | No |
| `/get-by-city/:city` | GET | List shops in a specific city | No |
| `/create-edit` | POST | Create or edit a shop (Multipart/form-data) | Yes (Owner) |
| `/get-my` | GET | Get current owner's shop | Yes (Owner) |
| `/update-status` | PUT | Update shop open/close status | Yes (Owner) |

## Item Routes (`/item`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/add-item` | POST | Add a new food item (Multipart/form-data) | Yes (Owner) |
| `/edit-item/:itemId` | POST | Edit an existing item (Multipart/form-data) | Yes (Owner) |
| `/delete-item/:itemId` | DELETE | Delete an item | Yes (Owner) |
| `/get-by-city/:city` | GET | Get items available in a city | No |
| `/get-by-shop/:shopId` | GET | Get all items from a shop | No |
| `/search-items` | GET | Search items by name/category | No |

## Order Routes (`/order`)

| Endpoint | Method | Description | Sample Request Body |
|----------|--------|-------------|---------------------|
| `/place-order` | POST | Place a new order | `{ "items": [...], "totalAmount": 500, "paymentMethod": "COD" }` |
| `/my-orders` | GET | Get order history of user | N/A |
| `/update-status/:orderId/:shopId` | POST | Update order status | `{ "status": "preparing" }` |
| `/accept-order/:assignmentId` | POST | Delivery boy accepts order | N/A |
| `/cancel-order/:orderId` | POST | Cancel an order | N/A |

## Error Handling
If you use the wrong HTTP method, the API will return a `405 Method Not Allowed` with a suggestion.
Example: `GET /api/auth/signin` returns `{ "message": "Login must use POST method" }`.

## Testing in Browser
- Use `/api/health` for a quick system health check.
- Use `/api/auth/status` for auth service check.
- Most management actions (POST/PUT/DELETE) cannot be tested directly in the browser address bar. Use tools like Postman or Thunder Client.
