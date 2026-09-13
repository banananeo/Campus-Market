# CampusMarket

A student-focused campus marketplace where university students can buy and sell items within their college community.

## Problem Statement

Students often have items such as textbooks, calculators, electronics, furniture, cycles, sports equipment, and other useful products that they no longer need. At the same time, other students may be looking for the same items at affordable prices.

Existing marketplaces are designed for general audiences, which can make it difficult for students to find trustworthy sellers nearby and coordinate exchanges within campus.

CampusMarket solves this problem by providing a dedicated marketplace for university students.

---

## Solution

CampusMarket is a web application that allows authenticated university students to:

- Browse items listed by other students
- Search for products instantly
- Filter listings by category and condition
- View detailed information about products
- Add interesting products to a wishlist
- Contact sellers directly
- Send and receive messages
- Create and manage their own listings
- Upload product images
- Edit or delete their listings
- Mark listings as Available, Reserved, or Sold
- Remove sold listings when they are no longer needed

The goal is to make buying and selling within the campus community simple, convenient, and organized.

---

## Features

### 1. Student Authentication

Users can create an account using their college email address.

Only emails ending with:

`@srmist.edu.in`

are accepted during registration.

Users can:

- Sign up
- Log in
- Log out
- Maintain a student profile

Authentication is handled using Supabase Authentication.

---

### 2. Marketplace

The homepage displays currently available listings.

Each listing contains information such as:

- Product title
- Price
- Category
- Condition
- Location
- Product image
- Description
- Seller information

Only listings marked as **Available** appear in the main marketplace.

---

### 3. Search

Users can search for products using the search bar.

Search works across:

- Listing title
- Description
- Category

This allows students to quickly find the items they need.

---

### 4. Filters

Listings can be filtered using:

#### Category

- Books
- Electronics
- Furniture
- Cycles
- Clothing
- Sports
- Other

#### Condition

- New
- Like New
- Good
- Used

Users can combine search and filters to narrow down results.

---

### 5. Listing Details

Clicking a listing opens a dedicated product page.

The listing page displays:

- Product image
- Product title
- Price
- Category
- Condition
- Location
- Description
- Seller name
- Seller department
- Seller year
- Listing status

Users can also add the product to their wishlist.

---

### 6. Wishlist

Students can save products they are interested in.

The wishlist allows users to:

- Save listings
- Remove listings
- Quickly access saved products

Each user's wishlist is private and protected using Supabase Row Level Security.

---

### 7. Sell an Item

Students can create their own listings.

A seller can provide:

- Title
- Description
- Price
- Category
- Condition
- Location
- Product images

Up to four images can be uploaded for each listing.

Images are stored using Supabase Storage.

---

### 8. My Listings

The **My Listings** page allows sellers to manage products they have posted.

Sellers can:

- View their listings
- Edit listings
- Delete listings
- View individual listings
- Change listing status

Available statuses are:

- Available
- Reserved
- Sold

When an item is sold, the seller can mark it as **Sold** and later remove the listing.

---

### 9. Contact Seller

Buyers can contact sellers directly from the listing page.

For example:

> Hi, is this calculator still available?

The seller can respond through the messaging system.

Users cannot send messages to themselves.

---

### 10. Messaging System

CampusMarket includes an internal messaging system.

Users can:

- View conversations
- Select a conversation
- Send messages
- Reply to sellers or buyers
- View the listing associated with a conversation

Messages are stored securely in the Supabase database.

---

### 11. Image Uploads

Sellers can upload product images while creating a listing.

Image uploads include validation for:

- Image file type
- Maximum file size
- Maximum number of images

Images are stored in a dedicated Supabase Storage bucket.

---

### 12. Protected Routes

Important pages require authentication.

Protected pages include:

- `/sell`
- `/my-listings`
- `/wishlist`
- `/messages`
- `/listing/[id]/edit`

Unauthenticated users are redirected to the login page.

---

## Technology Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend / Database

- Supabase
- PostgreSQL
- Supabase Authentication
- Supabase Storage
- Row Level Security (RLS)

### Deployment

- Vercel

### Version Control

- Git
- GitHub

---

## System Architecture

```text
                     ┌─────────────────────┐
                     │       Student       │
                     └──────────┬──────────┘
                                │
                                ▼
                     ┌─────────────────────┐
                     │   Next.js Frontend  │
                     │      React + TS      │
                     └──────────┬──────────┘
                                │
             ┌──────────────────┼──────────────────┐
             │                  │                  │
             ▼                  ▼                  ▼
      ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
      │ Supabase    │   │ Supabase    │   │ Supabase    │
      │ Auth        │   │ PostgreSQL  │   │ Storage     │
      └─────────────┘   └─────────────┘   └─────────────┘
             │                  │                  │
             ▼                  ▼                  ▼
         Students          Listings,           Product
         Accounts          Messages,           Images
                           Wishlist
