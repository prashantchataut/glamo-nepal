export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'GLAMO Nepal API',
    version: '2.0.0',
    description:
      'Beauty ecommerce API for GLAMO Nepal. All prices are stored as integers in paisa (1 NPR = 100 paisa). For example, रू 1,250.00 is stored as 125000.',
    contact: {
      name: 'GLAMO Nepal',
      url: 'https://glamonepal.com',
      email: 'support@glamonepal.com',
    },
  },
  servers: [
    { url: 'https://api.glamonepal.com', description: 'Production' },
    { url: 'http://localhost:8787', description: 'Local development' },
  ],
  security: [
    { cookieAuth: [] },
    { bearerAuth: [] },
  ],
  tags: [
    { name: 'Auth', description: 'Authentication & registration' },
    { name: 'Account', description: 'User profile & address management' },
    { name: 'Categories', description: 'Product category management' },
    { name: 'Brands', description: 'Brand management' },
    { name: 'Products', description: 'Product & variant CRUD, search, images' },
    { name: 'Inventory', description: 'Stock reports, low-stock alerts, inventory logs' },
    { name: 'Cart', description: 'Shopping cart operations' },
    { name: 'Wishlist', description: 'Wishlist operations' },
    { name: 'Coupons', description: 'Coupon CRUD, validation & application' },
    { name: 'Orders', description: 'Order management & checkout' },
    { name: 'Reviews', description: 'Product reviews & moderation' },
    { name: 'Banners', description: 'Banner management & display' },
    { name: 'Popups', description: 'Popup/promotion management' },
    { name: 'Blog', description: 'Blog post management' },
    { name: 'Gallery', description: 'Gallery image management' },
    { name: 'Team', description: 'Team member management' },
    { name: 'Newsletter', description: 'Newsletter subscription management' },
    { name: 'Settings', description: 'Store settings (public & admin)' },
    { name: 'Admin', description: 'Admin dashboard, users, audit logs' },
  ],
  paths: {
    '/api/v1/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterInput' },
              example: {
                email: 'aasha@example.com',
password: '********',
              firstName: 'Aasha',
              lastName: 'Shrestha',
              phone: '+977-9841234567',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'User registered successfully',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
          },
          '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '409': { description: 'Email already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/v1/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login with email & password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginInput' },
              example: { email: 'aasha@example.com', password: '********' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
          },
          '401': { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/v1/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RefreshTokenInput' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Token refreshed',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
          },
          '401': { description: 'Invalid or expired refresh token', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/v1/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Request password reset email',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ForgotPasswordInput' },
            },
          },
        },
        responses: {
          '200': { description: 'Reset email sent if account exists' },
        },
      },
    },
    '/api/v1/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password using token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ResetPasswordInput' },
            },
          },
        },
        responses: {
          '200': { description: 'Password reset successful' },
          '400': { description: 'Invalid or expired token' },
        },
      },
    },
    '/api/v1/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout current session',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          '200': { description: 'Logged out successfully' },
        },
      },
    },
    '/api/v1/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current authenticated user',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Current user details',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse_User' } } },
          },
          '401': { description: 'Not authenticated' },
        },
      },
    },
    '/api/v1/account/profile': {
      get: {
        tags: ['Account'],
        summary: 'Get user profile',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          '200': {
            description: 'User profile',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse_Profile' } } },
          },
        },
      },
      patch: {
        tags: ['Account'],
        summary: 'Update user profile',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateProfileInput' },
              example: { firstName: 'Aasha', lastName: 'Maharjan', phone: '+977-9841234567' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Profile updated',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse_Profile' } } },
          },
        },
      },
    },
    '/api/v1/account/avatar': {
      post: {
        tags: ['Account'],
        summary: 'Upload avatar image',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: { type: 'string', format: 'binary', description: 'Avatar image (max 2MB)' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Avatar uploaded',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse_Profile' } } },
          },
        },
      },
    },
    '/api/v1/account/addresses': {
      get: {
        tags: ['Account'],
        summary: 'List user addresses',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of addresses',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponseList_Address' } } },
          },
        },
      },
      post: {
        tags: ['Account'],
        summary: 'Create a new address',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateAddressInput' },
              example: {
                label: 'Home',
                fullName: 'Aasha Shrestha',
                phone: '+977-9841234567',
                address1: 'Jhamsikhel Road',
                address2: 'Near Himalayan Java',
                city: 'Lalitpur',
                district: 'Lalitpur',
                province: 'Bagmati',
                postalCode: '44700',
                country: 'Nepal',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Address created',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse_Address' } } },
          },
        },
      },
    },
    '/api/v1/account/addresses/{id}': {
      patch: {
        tags: ['Account'],
        summary: 'Update an address',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateAddressInput' } } },
        },
        responses: {
          '200': {
            description: 'Address updated',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse_Address' } } },
          },
        },
      },
      delete: {
        tags: ['Account'],
        summary: 'Delete an address',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          '200': { description: 'Address deleted' },
        },
      },
    },
    '/api/v1/account/addresses/{id}/default': {
      patch: {
        tags: ['Account'],
        summary: 'Set address as default',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: {
          '200': {
            description: 'Default address set',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse_Address' } } },
          },
        },
      },
    },
    '/api/v1/categories': {
      get: {
        tags: ['Categories'],
        summary: 'List categories (public)',
        parameters: [
          { name: 'parentId', in: 'query', schema: { type: 'string', format: 'uuid' }, description: 'Filter by parent category ID' },
          { name: 'isActive', in: 'query', schema: { type: 'string', enum: ['true', 'false'] }, description: 'Filter active status' },
        ],
        responses: {
          '200': { description: 'List of categories', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponseList_Category' } } } },
        },
      },
      post: {
        tags: ['Categories'],
        summary: 'Create a category (Admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateCategoryInput' },
              example: { name: 'Skincare', description: 'Nepal\'s best skincare products', sortOrder: 0 },
            },
          },
        },
        responses: {
          '201': { description: 'Category created', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse_Category' } } } },
        },
      },
    },
    '/api/v1/categories/{slug}': {
      get: {
        tags: ['Categories'],
        summary: 'Get category by slug',
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Category details', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse_Category' } } } },
          '404': { description: 'Category not found' },
        },
      },
    },
    '/api/v1/categories/{id}': {
      patch: {
        tags: ['Categories'],
        summary: 'Update a category (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateCategoryInput' } } } },
        responses: { '200': { description: 'Category updated' } },
      },
      delete: {
        tags: ['Categories'],
        summary: 'Delete a category (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { '200': { description: 'Category deleted' } },
      },
    },
    '/api/v1/categories/{id}/image': {
      post: {
        tags: ['Categories'],
        summary: 'Upload category image (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: { type: 'object', required: ['file'], properties: { file: { type: 'string', format: 'binary' } } },
            },
          },
        },
        responses: { '200': { description: 'Image uploaded' } },
      },
    },
    '/api/v1/brands': {
      get: {
        tags: ['Brands'],
        summary: 'List brands (public)',
        parameters: [
          { name: 'isActive', in: 'query', schema: { type: 'string', enum: ['true', 'false'] }, description: 'Filter active status' },
        ],
        responses: {
          '200': { description: 'List of brands', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponseList_Brand' } } } },
        },
      },
      post: {
        tags: ['Brands'],
        summary: 'Create a brand (Admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateBrandInput' },
              example: { name: 'KTM Beauty', description: 'Kathmandu-based beauty brand', website: 'https://ktmbeauty.com.np' },
            },
          },
        },
        responses: { '201': { description: 'Brand created' } },
      },
    },
    '/api/v1/brands/{slug}': {
      get: {
        tags: ['Brands'],
        summary: 'Get brand by slug',
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Brand details' }, '404': { description: 'Brand not found' } },
      },
    },
    '/api/v1/brands/{id}': {
      patch: {
        tags: ['Brands'],
        summary: 'Update a brand (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateBrandInput' } } } },
        responses: { '200': { description: 'Brand updated' } },
      },
      delete: {
        tags: ['Brands'],
        summary: 'Delete a brand (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { '200': { description: 'Brand deleted' } },
      },
    },
    '/api/v1/products': {
      get: {
        tags: ['Products'],
        summary: 'List products with filters & pagination',
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Category slug or ID' },
          { name: 'brand', in: 'query', schema: { type: 'string' }, description: 'Brand slug or ID' },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search term' },
          { name: 'minPrice', in: 'query', schema: { type: 'number' }, description: 'Min price in paisa' },
          { name: 'maxPrice', in: 'query', schema: { type: 'number' }, description: 'Max price in paisa' },
          { name: 'tags', in: 'query', schema: { type: 'string' }, description: 'Comma-separated tags' },
          { name: 'inStock', in: 'query', schema: { type: 'string', enum: ['true', '1'] }, description: 'Only in-stock products' },
          { name: 'featured', in: 'query', schema: { type: 'string', enum: ['true', '1'] }, description: 'Only featured products' },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: ['newest', 'price-asc', 'price-desc', 'best-seller', 'most-reviewed', 'rating'], default: 'newest' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 24, maximum: 100 } },
        ],
        responses: {
          '200': {
            description: 'Paginated product list',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponseList_Product' } } },
          },
        },
      },
      post: {
        tags: ['Products'],
        summary: 'Create a product (Admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateProductInput' },
              example: {
                name: 'Himalayan Rose Face Wash',
                shortDescription: 'Gentle cleanser with Himalayan rose extract',
                description: 'Experience the natural beauty of Nepal with our Himalayan Rose Face Wash...',
                sku: 'HRW-001',
                categoryId: 'uuid-category-1',
                brandId: 'uuid-brand-1',
                basePrice: 75000,
                salePrice: 60000,
                costPrice: 35000,
                currency: 'NPR',
                isFeatured: true,
                trackInventory: true,
                stockQuantity: 150,
                lowStockThreshold: 10,
                weight: 0.15,
                tags: ['skincare', 'face-wash', 'rose'],
              },
            },
          },
        },
        responses: { '201': { description: 'Product created' } },
      },
    },
    '/api/v1/products/search': {
      get: {
        tags: ['Products'],
        summary: 'Search products',
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string' }, description: 'Search query' },
        ],
        responses: { '200': { description: 'Search results' } },
      },
    },
    '/api/v1/products/{slug}': {
      get: {
        tags: ['Products'],
        summary: 'Get product by slug',
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'Product details',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse_Product' } } },
          },
          '404': { description: 'Product not found' },
        },
      },
    },
    '/api/v1/products/{id}': {
      patch: {
        tags: ['Products'],
        summary: 'Update a product (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateProductInput' } } } },
        responses: { '200': { description: 'Product updated' } },
      },
      delete: {
        tags: ['Products'],
        summary: 'Delete a product (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { '200': { description: 'Product deleted' } },
      },
    },
    '/api/v1/products/{id}/toggle-hidden': {
      patch: {
        tags: ['Products'],
        summary: 'Toggle product visibility (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { '200': { description: 'Product visibility toggled' } },
      },
    },
    '/api/v1/products/{id}/toggle-featured': {
      patch: {
        tags: ['Products'],
        summary: 'Toggle product featured status (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { '200': { description: 'Product featured status toggled' } },
      },
    },
    '/api/v1/products/{id}/images': {
      post: {
        tags: ['Products'],
        summary: 'Upload product images (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: { type: 'object', required: ['files'], properties: { files: { type: 'array', items: { type: 'string', format: 'binary' } } } },
            },
          },
        },
        responses: { '200': { description: 'Images uploaded' } },
      },
    },
    '/api/v1/products/{id}/images/{imageId}': {
      delete: {
        tags: ['Products'],
        summary: 'Delete a product image (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/IdParam' },
          { name: 'imageId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { '200': { description: 'Image deleted' } },
      },
    },
    '/api/v1/products/{id}/variants': {
      get: {
        tags: ['Products'],
        summary: 'List product variants (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { '200': { description: 'Variant list' } },
      },
      post: {
        tags: ['Products'],
        summary: 'Add a product variant (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/VariantInput' },
              example: { name: 'Rose - 100ml', sku: 'HRW-001-R100', price: 75000, salePrice: 60000, stockQuantity: 50, attributes: { shade: 'Rose Gold', size: '100ml' } },
            },
          },
        },
        responses: { '201': { description: 'Variant created' } },
      },
    },
    '/api/v1/products/{id}/variants/{variantId}': {
      patch: {
        tags: ['Products'],
        summary: 'Update a product variant (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/IdParam' },
          { name: 'variantId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateVariantInput' } } } },
        responses: { '200': { description: 'Variant updated' } },
      },
      delete: {
        tags: ['Products'],
        summary: 'Delete a product variant (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/IdParam' },
          { name: 'variantId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { '200': { description: 'Variant deleted' } },
      },
    },
    '/api/v1/products/{id}/variants/{variantId}/stock': {
      patch: {
        tags: ['Products'],
        summary: 'Adjust variant stock (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { $ref: '#/components/parameters/IdParam' },
          { name: 'variantId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/StockAdjustInput' },
              example: { change: 50, reason: 'Restocked from supplier' },
            },
          },
        },
        responses: { '200': { description: 'Stock adjusted' } },
      },
    },
    '/api/v1/inventory/report': {
      get: {
        tags: ['Inventory'],
        summary: 'Get stock report (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'lowStockOnly', in: 'query', schema: { type: 'boolean' }, description: 'Only show low-stock items' },
          { name: 'outOfStockOnly', in: 'query', schema: { type: 'boolean' }, description: 'Only show out-of-stock items' },
        ],
        responses: { '200': { description: 'Stock report' } },
      },
    },
    '/api/v1/inventory/low-stock': {
      get: {
        tags: ['Inventory'],
        summary: 'Get low-stock alerts (Admin)',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Low-stock products' } },
      },
    },
    '/api/v1/inventory/logs': {
      get: {
        tags: ['Inventory'],
        summary: 'Get inventory change logs (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'productId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'changeType', in: 'query', schema: { type: 'string', enum: ['RESTOCK', 'SALE', 'ADJUSTMENT', 'RETURN', 'CANCEL_RESTORE'] } },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
        ],
        responses: { '200': { description: 'Inventory logs' } },
      },
    },
    '/api/v1/cart': {
      get: {
        tags: ['Cart'],
        summary: 'Get current user cart',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Cart contents',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse_Cart' } } },
          },
        },
      },
      post: {
        tags: ['Cart'],
        summary: 'Add item to cart',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AddToCartInput' },
              example: { productId: 'uuid-product-1', variantId: 'uuid-variant-1', quantity: 2 },
            },
          },
        },
        responses: { '200': { description: 'Item added to cart' } },
      },
      delete: {
        tags: ['Cart'],
        summary: 'Clear entire cart',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: { '200': { description: 'Cart cleared' } },
      },
    },
    '/api/v1/cart/{id}': {
      patch: {
        tags: ['Cart'],
        summary: 'Update cart item quantity',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateCartItemInput' } } },
        },
        responses: { '200': { description: 'Cart item updated' } },
      },
      delete: {
        tags: ['Cart'],
        summary: 'Remove item from cart',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { '200': { description: 'Item removed from cart' } },
      },
    },
    '/api/v1/wishlist': {
      get: {
        tags: ['Wishlist'],
        summary: 'Get user wishlist',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Wishlist contents',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponseList_WishlistItem' } } },
          },
        },
      },
      post: {
        tags: ['Wishlist'],
        summary: 'Add item to wishlist',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AddToWishlistInput' } } },
        },
        responses: { '200': { description: 'Item added to wishlist' } },
      },
    },
    '/api/v1/wishlist/{productId}': {
      delete: {
        tags: ['Wishlist'],
        summary: 'Remove item from wishlist',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Item removed from wishlist' } },
      },
    },
    '/api/v1/wishlist/check/{productId}': {
      get: {
        tags: ['Wishlist'],
        summary: 'Check if product is in wishlist',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Wishlist check result' } },
      },
    },
    '/api/v1/coupons': {
      get: {
        tags: ['Coupons'],
        summary: 'List coupons (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'isActive', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': { description: 'Coupon list' } },
      },
      post: {
        tags: ['Coupons'],
        summary: 'Create a coupon (Admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateCouponInput' },
              example: {
                code: 'DASHAIN2024',
                type: 'PERCENTAGE',
                value: 15,
                minOrderAmount: 50000,
                maxDiscount: 25000,
                usageLimit: 1000,
                perUserLimit: 1,
                startsAt: '2024-10-01T00:00:00Z',
                expiresAt: '2024-10-31T23:59:59Z',
              },
            },
          },
        },
        responses: { '201': { description: 'Coupon created' } },
      },
    },
    '/api/v1/coupons/validate': {
      post: {
        tags: ['Coupons'],
        summary: 'Validate a coupon code',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ValidateCouponInput' },
              example: { code: 'DASHAIN2024', cartTotal: 150000 },
            },
          },
        },
        responses: { '200': { description: 'Coupon validation result' } },
      },
    },
    '/api/v1/coupons/apply': {
      post: {
        tags: ['Coupons'],
        summary: 'Apply coupon to cart',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ApplyCouponInput' } } },
        },
        responses: { '200': { description: 'Coupon applied' } },
      },
    },
    '/api/v1/coupons/{id}': {
      get: {
        tags: ['Coupons'],
        summary: 'Get coupon by ID (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { '200': { description: 'Coupon details' } },
      },
      patch: {
        tags: ['Coupons'],
        summary: 'Update a coupon (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateCouponInput' } } } },
        responses: { '200': { description: 'Coupon updated' } },
      },
      delete: {
        tags: ['Coupons'],
        summary: 'Delete a coupon (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { '200': { description: 'Coupon deleted' } },
      },
    },
    '/api/v1/checkout/orders': {
      post: {
        tags: ['Orders'],
        summary: 'Create a new order (checkout)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateOrderInput' },
              example: {
                customer: { name: 'Priya Thapa', phone: '+977-9841234567', email: 'priya@example.com' },
                shippingAddress: {
                  fullName: 'Priya Thapa',
                  phone: '+977-9841234567',
                  address1: 'Putalisadak',
                  city: 'Kathmandu',
                  district: 'Kathmandu',
                  province: 'Bagmati',
                  postalCode: '44600',
                  country: 'Nepal',
                },
                paymentMethod: 'KHALTI',
                items: [{ productId: 'uuid-product-1', quantity: 2 }],
                couponCode: 'DASHAIN2024',
              },
            },
          },
        },
        responses: { '201': { description: 'Order created', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse_Order' } } } } },
      },
    },
    '/api/v1/checkout/orders/{id}/payments/{provider}/verify': {
      post: {
        tags: ['Orders'],
        summary: 'Verify payment for an order',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'provider', in: 'path', required: true, schema: { type: 'string', enum: ['khalti', 'esewa'] } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  token: { type: 'string', description: 'Payment gateway token' },
                  amount: { type: 'integer', description: 'Amount in paisa' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Payment verified' } },
      },
    },
    '/api/v1/orders': {
      get: {
        tags: ['Orders'],
        summary: 'List user orders',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'paymentStatus', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': { description: 'Order list' } },
      },
    },
    '/api/v1/orders/{id}': {
      get: {
        tags: ['Orders'],
        summary: 'Get order details',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { '200': { description: 'Order details' } },
      },
    },
    '/api/v1/orders/{id}/cancel': {
      post: {
        tags: ['Orders'],
        summary: 'Cancel an order',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { '200': { description: 'Order cancelled' } },
      },
    },
    '/api/v1/orders/{id}/status': {
      patch: {
        tags: ['Orders'],
        summary: 'Update order status (Admin/Staff)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateOrderStatusInput' },
              example: { status: 'SHIPPED', comment: 'Shipped via Arhat Courier' },
            },
          },
        },
        responses: { '200': { description: 'Order status updated' } },
      },
    },
    '/api/v1/reviews/product/{productId}': {
      get: {
        tags: ['Reviews'],
        summary: 'Get reviews for a product',
        parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Product reviews' } },
      },
    },
    '/api/v1/reviews': {
      post: {
        tags: ['Reviews'],
        summary: 'Create a review',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateReviewInput' },
              example: { productId: 'uuid-product-1', rating: 5, title: 'Amazing product!', comment: 'Best face wash I have used in Kathmandu!' },
            },
          },
        },
        responses: { '201': { description: 'Review created' } },
      },
    },
    '/api/v1/reviews/{id}': {
      patch: {
        tags: ['Reviews'],
        summary: 'Update a review',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateReviewInput' } } } },
        responses: { '200': { description: 'Review updated' } },
      },
      delete: {
        tags: ['Reviews'],
        summary: 'Delete a review',
        security: [{ cookieAuth: [] }, { bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { '200': { description: 'Review deleted' } },
      },
    },
    '/api/v1/reviews/admin': {
      get: {
        tags: ['Reviews'],
        summary: 'List all reviews (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'productId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'isApproved', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': { description: 'Admin review list' } },
      },
    },
    '/api/v1/reviews/admin/{id}/approve': {
      patch: {
        tags: ['Reviews'],
        summary: 'Approve a review (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { '200': { description: 'Review approved' } },
      },
    },
    '/api/v1/reviews/admin/{id}/reject': {
      patch: {
        tags: ['Reviews'],
        summary: 'Reject a review (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { '200': { description: 'Review rejected' } },
      },
    },
    '/api/v1/banners': {
      get: {
        tags: ['Banners'],
        summary: 'Get active banners (public)',
        responses: { '200': { description: 'Active banners' } },
      },
      post: {
        tags: ['Banners'],
        summary: 'Create a banner (Admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateBannerInput' },
              example: { title: 'Dashain Sale 2024', subtitle: 'Up to 50% off!', imageUrl: 'https://cdn.glamonepal.com/banners/dashain2024.jpg', position: 'HERO', sortOrder: 0 },
            },
          },
        },
        responses: { '201': { description: 'Banner created' } },
      },
    },
    '/api/v1/banners/position/{pos}': {
      get: {
        tags: ['Banners'],
        summary: 'Get banners by position',
        parameters: [{ name: 'pos', in: 'path', required: true, schema: { type: 'string', enum: ['HERO', 'MID_PAGE', 'SIDEBAR', 'POPUP'] } }],
        responses: { '200': { description: 'Banners by position' } },
      },
    },
    '/api/v1/banners/admin': {
      get: {
        tags: ['Banners'],
        summary: 'List all banners (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'position', in: 'query', schema: { type: 'string', enum: ['HERO', 'MID_PAGE', 'SIDEBAR', 'POPUP'] } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': { description: 'All banners' } },
      },
    },
    '/api/v1/banners/reorder': {
      patch: {
        tags: ['Banners'],
        summary: 'Reorder banners (Admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ReorderInput' },
            },
          },
        },
        responses: { '200': { description: 'Banners reordered' } },
      },
    },
    '/api/v1/banners/{id}': {
      patch: {
        tags: ['Banners'],
        summary: 'Update a banner (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateBannerInput' } } } },
        responses: { '200': { description: 'Banner updated' } },
      },
      delete: {
        tags: ['Banners'],
        summary: 'Delete a banner (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { '200': { description: 'Banner deleted' } },
      },
    },
    '/api/v1/popups/active': {
      get: {
        tags: ['Popups'],
        summary: 'Get active popup (public)',
        responses: { '200': { description: 'Active popup or null' } },
      },
    },
    '/api/v1/popups': {
      get: {
        tags: ['Popups'],
        summary: 'List all popups (Admin)',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Popup list' } },
      },
      post: {
        tags: ['Popups'],
        summary: 'Create a popup (Admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreatePopupInput' },
              example: { title: 'Dashain Offer!', content: 'Use code DASHAIN2024 for 15% off', triggerType: 'ON_LOAD', delayMs: 3000, cookieDays: 7 },
            },
          },
        },
        responses: { '201': { description: 'Popup created' } },
      },
    },
    '/api/v1/popups/{id}': {
      patch: {
        tags: ['Popups'],
        summary: 'Update a popup (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdatePopupInput' } } } },
        responses: { '200': { description: 'Popup updated' } },
      },
      delete: {
        tags: ['Popups'],
        summary: 'Delete a popup (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { '200': { description: 'Popup deleted' } },
      },
    },
    '/api/v1/blogs': {
      get: {
        tags: ['Blog'],
        summary: 'List published blog posts',
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': { description: 'Blog post list' } },
      },
      post: {
        tags: ['Blog'],
        summary: 'Create a blog post (Admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateBlogPostInput' },
              example: { title: 'Best Skincare Routine for Monsoon in Nepal', content: '...', category: 'skincare', tags: ['monsoon', 'skincare', 'nepal'] },
            },
          },
        },
        responses: { '201': { description: 'Blog post created' } },
      },
    },
    '/api/v1/blogs/categories': {
      get: {
        tags: ['Blog'],
        summary: 'List blog categories',
        responses: { '200': { description: 'Blog categories' } },
      },
    },
    '/api/v1/blogs/{slug}': {
      get: {
        tags: ['Blog'],
        summary: 'Get blog post by slug',
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Blog post details' }, '404': { description: 'Post not found' } },
      },
    },
    '/api/v1/blogs/{id}': {
      patch: {
        tags: ['Blog'],
        summary: 'Update a blog post (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateBlogPostInput' } } } },
        responses: { '200': { description: 'Blog post updated' } },
      },
      delete: {
        tags: ['Blog'],
        summary: 'Delete a blog post (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { '200': { description: 'Blog post deleted' } },
      },
    },
    '/api/v1/blogs/{id}/publish': {
      patch: {
        tags: ['Blog'],
        summary: 'Publish a blog post (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { '200': { description: 'Blog post published' } },
      },
    },
    '/api/v1/blogs/{id}/unpublish': {
      patch: {
        tags: ['Blog'],
        summary: 'Unpublish a blog post (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { '200': { description: 'Blog post unpublished' } },
      },
    },
    '/api/v1/blogs/{id}/cover': {
      post: {
        tags: ['Blog'],
        summary: 'Upload blog cover image (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: { type: 'object', required: ['file'], properties: { file: { type: 'string', format: 'binary' } } },
            },
          },
        },
        responses: { '200': { description: 'Cover image uploaded' } },
      },
    },
    '/api/v1/gallery': {
      get: {
        tags: ['Gallery'],
        summary: 'List gallery items',
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string', enum: ['instagram', 'store', 'products', 'team'] } },
        ],
        responses: { '200': { description: 'Gallery items' } },
      },
      post: {
        tags: ['Gallery'],
        summary: 'Create gallery item (Admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateGalleryItemInput' },
              example: { title: 'Store Front - Thamel', imageUrl: 'https://cdn.glamonepal.com/gallery/thamel-store.jpg', category: 'store', sortOrder: 0 },
            },
          },
        },
        responses: { '201': { description: 'Gallery item created' } },
      },
    },
    '/api/v1/gallery/reorder': {
      patch: {
        tags: ['Gallery'],
        summary: 'Reorder gallery items (Admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ReorderInput' } } },
        },
        responses: { '200': { description: 'Gallery reordered' } },
      },
    },
    '/api/v1/gallery/{id}': {
      patch: {
        tags: ['Gallery'],
        summary: 'Update gallery item (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateGalleryItemInput' } } } },
        responses: { '200': { description: 'Gallery item updated' } },
      },
      delete: {
        tags: ['Gallery'],
        summary: 'Delete gallery item (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { '200': { description: 'Gallery item deleted' } },
      },
    },
    '/api/v1/team': {
      get: {
        tags: ['Team'],
        summary: 'List team members (public)',
        responses: { '200': { description: 'Team members' } },
      },
      post: {
        tags: ['Team'],
        summary: 'Create team member (Admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateTeamMemberInput' },
              example: { name: 'Srijana Koirala', role: 'Lead Makeup Artist', bio: '10+ years of experience in bridal makeup', sortOrder: 0 },
            },
          },
        },
        responses: { '201': { description: 'Team member created' } },
      },
    },
    '/api/v1/team/{id}': {
      patch: {
        tags: ['Team'],
        summary: 'Update team member (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateTeamMemberInput' } } } },
        responses: { '200': { description: 'Team member updated' } },
      },
      delete: {
        tags: ['Team'],
        summary: 'Delete team member (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { '200': { description: 'Team member deleted' } },
      },
    },
    '/api/v1/newsletter/subscribe': {
      post: {
        tags: ['Newsletter'],
        summary: 'Subscribe to newsletter',
        description: 'Rate limited to 3 per hour per IP',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SubscribeInput' },
              example: { email: 'priya@example.com' },
            },
          },
        },
        responses: { '200': { description: 'Subscribed successfully' }, '429': { description: 'Rate limit exceeded' } },
      },
    },
    '/api/v1/newsletter/unsubscribe': {
      get: {
        tags: ['Newsletter'],
        summary: 'Unsubscribe from newsletter',
        parameters: [
          { name: 'token', in: 'query', required: true, schema: { type: 'string' }, description: 'Unsubscribe token from email' },
        ],
        responses: { '200': { description: 'Unsubscribed successfully' } },
      },
    },
    '/api/v1/newsletter': {
      get: {
        tags: ['Newsletter'],
        summary: 'List subscribers (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'isActive', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': { description: 'Subscriber list' } },
      },
    },
    '/api/v1/newsletter/export': {
      get: {
        tags: ['Newsletter'],
        summary: 'Export subscribers as CSV (Admin)',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'CSV file download', content: { 'text/csv': { schema: { type: 'string' } } } } },
      },
    },
    '/api/v1/newsletter/{id}': {
      delete: {
        tags: ['Newsletter'],
        summary: 'Delete a subscriber (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { '200': { description: 'Subscriber deleted' } },
      },
    },
    '/api/v1/settings/public': {
      get: {
        tags: ['Settings'],
        summary: 'Get public store settings',
        description: 'Returns non-sensitive settings like store name, currency, free shipping threshold, etc.',
        responses: { '200': { description: 'Public settings' } },
      },
    },
    '/api/v1/settings': {
      get: {
        tags: ['Settings'],
        summary: 'Get all settings (Admin)',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'All settings' } },
      },
      patch: {
        tags: ['Settings'],
        summary: 'Update settings (Super Admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateSettingsInput' },
              example: { settings: [{ key: 'free_shipping_threshold', value: 50000 }, { key: 'cod_fee', value: 5000 }] },
            },
          },
        },
        responses: { '200': { description: 'Settings updated' } },
      },
    },
    '/api/v1/admin/dashboard': {
      get: {
        tags: ['Admin'],
        summary: 'Get dashboard statistics (Admin)',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Dashboard stats' } },
      },
    },
    '/api/v1/admin/sales-report': {
      get: {
        tags: ['Admin'],
        summary: 'Get sales report (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'startDate', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'endDate', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'groupBy', in: 'query', schema: { type: 'string', enum: ['day', 'week', 'month'], default: 'day' } },
        ],
        responses: { '200': { description: 'Sales report' } },
      },
    },
    '/api/v1/admin/notifications': {
      get: {
        tags: ['Admin'],
        summary: 'Get admin notifications (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'isRead', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': { description: 'Notification list' } },
      },
    },
    '/api/v1/admin/notifications/{id}/read': {
      patch: {
        tags: ['Admin'],
        summary: 'Mark notification as read (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { '200': { description: 'Notification marked as read' } },
      },
    },
    '/api/v1/admin/notifications/read-all': {
      patch: {
        tags: ['Admin'],
        summary: 'Mark all notifications as read (Admin)',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'All notifications marked as read' } },
      },
    },
    '/api/v1/admin/audit-logs': {
      get: {
        tags: ['Admin'],
        summary: 'Get audit logs (Super Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'entity', in: 'query', schema: { type: 'string' } },
          { name: 'entityId', in: 'query', schema: { type: 'string' } },
          { name: 'userId', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
        ],
        responses: { '200': { description: 'Audit logs' } },
      },
    },
    '/api/v1/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'List users (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'role', in: 'query', schema: { type: 'string', enum: ['CUSTOMER', 'STAFF', 'ADMIN', 'SUPER_ADMIN'] } },
          { name: 'isActive', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': { description: 'User list' } },
      },
    },
    '/api/v1/admin/users/{id}': {
      get: {
        tags: ['Admin'],
        summary: 'Get user by ID (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        responses: { '200': { description: 'User details' } },
      },
    },
    '/api/v1/admin/users/{id}/role': {
      patch: {
        tags: ['Admin'],
        summary: 'Update user role (Super Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateUserRoleInput' },
              example: { role: 'STAFF' },
            },
          },
        },
        responses: { '200': { description: 'User role updated' } },
      },
    },
    '/api/v1/admin/users/{id}/status': {
      patch: {
        tags: ['Admin'],
        summary: 'Update user status (Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ $ref: '#/components/parameters/IdParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateUserStatusInput' },
              example: { isActive: false },
            },
          },
        },
        responses: { '200': { description: 'User status updated' } },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: '__Host-access_token',
        description: 'HTTP-only secure cookie set after login',
      },
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        description: 'Bearer token from login response',
      },
    },
    parameters: {
      IdParam: {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
        description: 'UUID identifier',
      },
    },
    schemas: {
      RegisterInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'aasha@example.com' },
          password: { type: 'string', minLength: 8, example: '********' },
          firstName: { type: 'string', maxLength: 100, example: 'Aasha' },
          lastName: { type: 'string', maxLength: 100, example: 'Shrestha' },
          phone: { type: 'string', example: '+977-9841234567' },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'aasha@example.com' },
          password: { type: 'string', example: '********' },
        },
      },
      RefreshTokenInput: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' },
        },
      },
      ForgotPasswordInput: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email', example: 'aasha@example.com' },
        },
      },
      ResetPasswordInput: {
        type: 'object',
        required: ['password'],
        properties: {
          password: { type: 'string', minLength: 8 },
        },
      },
      UpdateProfileInput: {
        type: 'object',
        properties: {
          firstName: { type: 'string', maxLength: 100, example: 'Aasha' },
          lastName: { type: 'string', maxLength: 100, example: 'Maharjan' },
          phone: { type: 'string', example: '+977-9841234567' },
        },
      },
      CreateAddressInput: {
        type: 'object',
        required: ['fullName', 'phone', 'address1', 'city'],
        properties: {
          label: { type: 'string', maxLength: 50, example: 'Home' },
          fullName: { type: 'string', maxLength: 200, example: 'Aasha Shrestha' },
          phone: { type: 'string', maxLength: 20, example: '+977-9841234567' },
          address1: { type: 'string', maxLength: 300, example: 'Jhamsikhel Road' },
          address2: { type: 'string', maxLength: 300, example: 'Near Himalayan Java' },
          city: { type: 'string', maxLength: 100, example: 'Lalitpur' },
          district: { type: 'string', maxLength: 100, example: 'Lalitpur' },
          province: { type: 'string', maxLength: 100, example: 'Bagmati' },
          postalCode: { type: 'string', maxLength: 20, example: '44700' },
          country: { type: 'string', default: 'Nepal', example: 'Nepal' },
        },
      },
      UpdateAddressInput: {
        type: 'object',
        properties: {
          label: { type: 'string', maxLength: 50 },
          fullName: { type: 'string', maxLength: 200 },
          phone: { type: 'string', maxLength: 20 },
          address1: { type: 'string', maxLength: 300 },
          address2: { type: 'string', maxLength: 300 },
          city: { type: 'string', maxLength: 100 },
          district: { type: 'string', maxLength: 100 },
          province: { type: 'string', maxLength: 100 },
          postalCode: { type: 'string', maxLength: 20 },
          country: { type: 'string' },
        },
      },
      Address: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          label: { type: 'string', example: 'Home' },
          fullName: { type: 'string', example: 'Aasha Shrestha' },
          phone: { type: 'string', example: '+977-9841234567' },
          address1: { type: 'string', example: 'Jhamsikhel Road' },
          address2: { type: 'string', example: 'Near Himalayan Java' },
          city: { type: 'string', example: 'Lalitpur' },
          district: { type: 'string', example: 'Lalitpur' },
          province: { type: 'string', example: 'Bagmati' },
          postalCode: { type: 'string', example: '44700' },
          country: { type: 'string', example: 'Nepal' },
          isDefault: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Profile: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email', example: 'aasha@example.com' },
          firstName: { type: 'string', example: 'Aasha' },
          lastName: { type: 'string', example: 'Shrestha' },
          phone: { type: 'string', example: '+977-9841234567' },
          avatarUrl: { type: 'string', format: 'uri' },
          role: { type: 'string', enum: ['CUSTOMER', 'STAFF', 'ADMIN', 'SUPER_ADMIN'], example: 'CUSTOMER' },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          phone: { type: 'string' },
          role: { type: 'string', enum: ['CUSTOMER', 'STAFF', 'ADMIN', 'SUPER_ADMIN'] },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Login successful' },
          data: {
            type: 'object',
            properties: {
              user: { $ref: '#/components/schemas/Profile' },
              accessToken: { type: 'string' },
              refreshToken: { type: 'string' },
            },
          },
        },
      },
      CreateCategoryInput: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', example: 'Skincare' },
          description: { type: 'string', example: 'Nepal\'s best skincare products' },
          parentId: { type: 'string', format: 'uuid' },
          imageUrl: { type: 'string', format: 'uri' },
          sortOrder: { type: 'integer', default: 0 },
        },
      },
      UpdateCategoryInput: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          parentId: { type: 'string', format: 'uuid', nullable: true },
          imageUrl: { type: 'string', format: 'uri', nullable: true },
          sortOrder: { type: 'integer' },
          isActive: { type: 'boolean' },
        },
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Skincare' },
          slug: { type: 'string', example: 'skincare' },
          description: { type: 'string' },
          parentId: { type: 'string', format: 'uuid', nullable: true },
          imageUrl: { type: 'string', format: 'uri' },
          sortOrder: { type: 'integer' },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateBrandInput: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', example: 'KTM Beauty' },
          description: { type: 'string', example: 'Kathmandu-based beauty brand' },
          logoUrl: { type: 'string', format: 'uri' },
          website: { type: 'string', format: 'uri', example: 'https://ktmbeauty.com.np' },
        },
      },
      UpdateBrandInput: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          logoUrl: { type: 'string', format: 'uri' },
          website: { type: 'string', format: 'uri', nullable: true },
        },
      },
      Brand: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'KTM Beauty' },
          slug: { type: 'string', example: 'ktm-beauty' },
          description: { type: 'string' },
          logoUrl: { type: 'string', format: 'uri' },
          website: { type: 'string', format: 'uri' },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateProductInput: {
        type: 'object',
        required: ['name', 'categoryId', 'basePrice'],
        properties: {
          name: { type: 'string', maxLength: 255, example: 'Himalayan Rose Face Wash' },
          description: { type: 'string' },
          shortDescription: { type: 'string', maxLength: 500 },
          sku: { type: 'string', example: 'HRW-001' },
          categoryId: { type: 'string', format: 'uuid' },
          brandId: { type: 'string', format: 'uuid' },
          basePrice: { type: 'integer', description: 'Price in paisa (1 NPR = 100 paisa)', example: 75000 },
          salePrice: { type: 'integer', description: 'Sale price in paisa', example: 60000 },
          costPrice: { type: 'integer', description: 'Cost price in paisa', example: 35000 },
          currency: { type: 'string', default: 'NPR', example: 'NPR' },
          isActive: { type: 'boolean', default: true },
          isFeatured: { type: 'boolean', default: false },
          isDigital: { type: 'boolean', default: false },
          trackInventory: { type: 'boolean', default: true },
          stockQuantity: { type: 'integer', default: 0 },
          lowStockThreshold: { type: 'integer', default: 5 },
          weight: { type: 'number', description: 'Weight in kg', example: 0.15 },
          dimensions: { type: 'string', example: '15x8x5 cm' },
          metaTitle: { type: 'string', maxLength: 255 },
          metaDescription: { type: 'string', maxLength: 500 },
          tags: { type: 'array', items: { type: 'string' }, example: ['skincare', 'face-wash', 'rose'] },
        },
      },
      UpdateProductInput: {
        type: 'object',
        properties: {
          name: { type: 'string', maxLength: 255 },
          description: { type: 'string' },
          shortDescription: { type: 'string', maxLength: 500 },
          sku: { type: 'string' },
          categoryId: { type: 'string', format: 'uuid' },
          brandId: { type: 'string', format: 'uuid', nullable: true },
          basePrice: { type: 'integer', description: 'Price in paisa' },
          salePrice: { type: 'integer', description: 'Sale price in paisa', nullable: true },
          costPrice: { type: 'integer', description: 'Cost price in paisa', nullable: true },
          currency: { type: 'string' },
          isActive: { type: 'boolean' },
          isFeatured: { type: 'boolean' },
          isDigital: { type: 'boolean' },
          trackInventory: { type: 'boolean' },
          stockQuantity: { type: 'integer' },
          lowStockThreshold: { type: 'integer' },
          weight: { type: 'number', nullable: true },
          dimensions: { type: 'string', nullable: true },
          metaTitle: { type: 'string', maxLength: 255, nullable: true },
          metaDescription: { type: 'string', maxLength: 500, nullable: true },
          tags: { type: 'array', items: { type: 'string' } },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Himalayan Rose Face Wash' },
          slug: { type: 'string', example: 'himalayan-rose-face-wash' },
          description: { type: 'string' },
          shortDescription: { type: 'string' },
          sku: { type: 'string', example: 'HRW-001' },
          categoryId: { type: 'string', format: 'uuid' },
          brandId: { type: 'string', format: 'uuid' },
          basePrice: { type: 'integer', description: 'Price in paisa (NPR)', example: 75000 },
          salePrice: { type: 'integer', description: 'Sale price in paisa', example: 60000 },
          costPrice: { type: 'integer', description: 'Cost price in paisa', example: 35000 },
          currency: { type: 'string', example: 'NPR' },
          isActive: { type: 'boolean' },
          isFeatured: { type: 'boolean' },
          isDigital: { type: 'boolean' },
          trackInventory: { type: 'boolean' },
          stockQuantity: { type: 'integer', example: 150 },
          lowStockThreshold: { type: 'integer', example: 10 },
          weight: { type: 'number', example: 0.15 },
          dimensions: { type: 'string' },
          metaTitle: { type: 'string' },
          metaDescription: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          images: { type: 'array', items: { $ref: '#/components/schemas/ProductImage' } },
          variants: { type: 'array', items: { $ref: '#/components/schemas/ProductVariant' } },
          category: { $ref: '#/components/schemas/Category' },
          brand: { $ref: '#/components/schemas/Brand' },
          avgRating: { type: 'number', example: 4.5 },
          reviewCount: { type: 'integer', example: 23 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      ProductImage: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          url: { type: 'string', format: 'uri', example: 'https://cdn.glamonepal.com/products/hrw-001-main.jpg' },
          alt: { type: 'string' },
          sortOrder: { type: 'integer' },
          isPrimary: { type: 'boolean' },
        },
      },
      ProductVariant: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Rose - 100ml' },
          sku: { type: 'string', example: 'HRW-001-R100' },
          price: { type: 'integer', description: 'Price in paisa', example: 75000 },
          salePrice: { type: 'integer', description: 'Sale price in paisa', example: 60000 },
          stockQuantity: { type: 'integer', example: 50 },
          attributes: { type: 'object', additionalProperties: { type: 'string' }, example: { shade: 'Rose Gold', size: '100ml' } },
          isActive: { type: 'boolean' },
        },
      },
      VariantInput: {
        type: 'object',
        required: ['name', 'price'],
        properties: {
          name: { type: 'string', maxLength: 255, example: 'Rose - 100ml' },
          sku: { type: 'string', example: 'HRW-001-R100' },
          price: { type: 'integer', description: 'Price in paisa', example: 75000 },
          salePrice: { type: 'integer', description: 'Sale price in paisa', example: 60000 },
          stockQuantity: { type: 'integer', default: 0 },
          attributes: { type: 'object', additionalProperties: { type: 'string' }, example: { shade: 'Rose Gold', size: '100ml' } },
        },
      },
      UpdateVariantInput: {
        type: 'object',
        properties: {
          name: { type: 'string', maxLength: 255 },
          sku: { type: 'string' },
          price: { type: 'integer', description: 'Price in paisa' },
          salePrice: { type: 'integer', description: 'Sale price in paisa', nullable: true },
          stockQuantity: { type: 'integer' },
          attributes: { type: 'object', additionalProperties: { type: 'string' } },
          isActive: { type: 'boolean' },
        },
      },
      StockAdjustInput: {
        type: 'object',
        required: ['change'],
        properties: {
          change: { type: 'integer', description: 'Positive to add, negative to remove', example: 50 },
          reason: { type: 'string', maxLength: 500, example: 'Restocked from supplier' },
        },
      },
      AddToCartInput: {
        type: 'object',
        required: ['productId'],
        properties: {
          productId: { type: 'string', format: 'uuid' },
          variantId: { type: 'string', format: 'uuid' },
          quantity: { type: 'integer', minimum: 1, default: 1, example: 2 },
        },
      },
      UpdateCartItemInput: {
        type: 'object',
        required: ['quantity'],
        properties: {
          quantity: { type: 'integer', minimum: 1, example: 3 },
        },
      },
      Cart: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          items: { type: 'array', items: { $ref: '#/components/schemas/CartItem' } },
          subtotal: { type: 'integer', description: 'Subtotal in paisa', example: 150000 },
          discount: { type: 'integer', description: 'Discount in paisa', example: 22500 },
          total: { type: 'integer', description: 'Total in paisa', example: 127500 },
          itemCount: { type: 'integer', example: 3 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CartItem: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          productId: { type: 'string', format: 'uuid' },
          variantId: { type: 'string', format: 'uuid' },
          quantity: { type: 'integer', example: 2 },
          unitPrice: { type: 'integer', description: 'Unit price in paisa', example: 75000 },
          totalPrice: { type: 'integer', description: 'Total price in paisa', example: 150000 },
          product: { $ref: '#/components/schemas/Product' },
          variant: { $ref: '#/components/schemas/ProductVariant' },
        },
      },
      AddToWishlistInput: {
        type: 'object',
        required: ['productId'],
        properties: {
          productId: { type: 'string', format: 'uuid' },
        },
      },
      WishlistItem: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          productId: { type: 'string', format: 'uuid' },
          product: { $ref: '#/components/schemas/Product' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateCouponInput: {
        type: 'object',
        required: ['code', 'type', 'value', 'startsAt', 'expiresAt'],
        properties: {
          code: { type: 'string', minLength: 3, maxLength: 50, example: 'DASHAIN2024' },
          description: { type: 'string', maxLength: 500 },
          type: { type: 'string', enum: ['PERCENTAGE', 'FIXED'], example: 'PERCENTAGE' },
          value: { type: 'number', example: 15, description: 'Percentage off or fixed amount in paisa' },
          minOrderAmount: { type: 'number', description: 'Minimum order amount in paisa', example: 50000 },
          maxDiscount: { type: 'number', description: 'Maximum discount in paisa', example: 25000 },
          usageLimit: { type: 'integer', example: 1000 },
          perUserLimit: { type: 'integer', example: 1 },
          startsAt: { type: 'string', format: 'date-time', example: '2024-10-01T00:00:00Z' },
          expiresAt: { type: 'string', format: 'date-time', example: '2024-10-31T23:59:59Z' },
        },
      },
      UpdateCouponInput: {
        type: 'object',
        properties: {
          code: { type: 'string', minLength: 3, maxLength: 50 },
          description: { type: 'string', maxLength: 500 },
          type: { type: 'string', enum: ['PERCENTAGE', 'FIXED'] },
          value: { type: 'number' },
          minOrderAmount: { type: 'number' },
          maxDiscount: { type: 'number' },
          usageLimit: { type: 'integer' },
          perUserLimit: { type: 'integer' },
          startsAt: { type: 'string', format: 'date-time' },
          expiresAt: { type: 'string', format: 'date-time' },
          isActive: { type: 'boolean' },
        },
      },
      ValidateCouponInput: {
        type: 'object',
        required: ['code', 'cartTotal'],
        properties: {
          code: { type: 'string', example: 'DASHAIN2024' },
          cartTotal: { type: 'number', description: 'Cart total in paisa', example: 150000 },
        },
      },
      ApplyCouponInput: {
        type: 'object',
        required: ['code', 'cartTotal'],
        properties: {
          code: { type: 'string', example: 'DASHAIN2024' },
          cartTotal: { type: 'number', description: 'Cart total in paisa', example: 150000 },
        },
      },
      CreateOrderInput: {
        type: 'object',
        required: ['shippingAddress', 'paymentMethod', 'items'],
        properties: {
          customer: {
            type: 'object',
            properties: {
              name: { type: 'string', example: 'Priya Thapa' },
              email: { type: 'string', format: 'email', example: 'priya@example.com' },
              phone: { type: 'string', example: '+977-9841234567' },
            },
          },
          shippingAddress: { $ref: '#/components/schemas/ShippingAddress' },
          billingAddress: { $ref: '#/components/schemas/ShippingAddress' },
          paymentMethod: {
            type: 'string',
            enum: ['CASH_ON_DELIVERY', 'KHALTI', 'ESEWA', 'BANK_TRANSFER', 'COD', 'CARD'],
            example: 'KHALTI',
          },
          couponCode: { type: 'string', example: 'DASHAIN2024' },
          notes: { type: 'string', maxLength: 500 },
          orderNotes: { type: 'string', maxLength: 500 },
          giftWrap: { type: 'boolean' },
          deliveryFee: { type: 'integer', description: 'Delivery fee in paisa', example: 15000 },
          subtotal: { type: 'integer', description: 'Subtotal in paisa' },
          grandTotal: { type: 'integer', description: 'Grand total in paisa' },
          currency: { type: 'string', default: 'NPR' },
          items: {
            type: 'array',
            minItems: 1,
            items: { $ref: '#/components/schemas/OrderItemInput' },
          },
        },
      },
      ShippingAddress: {
        type: 'object',
        required: ['city'],
        properties: {
          fullName: { type: 'string', example: 'Priya Thapa' },
          phone: { type: 'string', example: '+977-9841234567' },
          address1: { type: 'string', example: 'Putalisadak' },
          addressLine1: { type: 'string', example: 'Putalisadak' },
          address2: { type: 'string', example: 'Near Sano Gaun' },
          addressLine2: { type: 'string' },
          city: { type: 'string', example: 'Kathmandu' },
          ward: { type: 'string', example: '29' },
          district: { type: 'string', example: 'Kathmandu' },
          province: { type: 'string', example: 'Bagmati' },
          postalCode: { type: 'string', example: '44600' },
          country: { type: 'string', default: 'Nepal', example: 'Nepal' },
          landmark: { type: 'string', example: 'Next to Bluebird Mall' },
        },
      },
      OrderItemInput: {
        type: 'object',
        properties: {
          productId: { type: 'string', format: 'uuid' },
          variantId: { type: 'string', format: 'uuid' },
          quantity: { type: 'integer', minimum: 1, maximum: 99, example: 2 },
          selectedShade: { type: 'string', maxLength: 80 },
          product: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              sku: { type: 'string' },
              slug: { type: 'string' },
              name: { type: 'string' },
              brand: { type: 'string' },
              category: { type: 'string' },
              image: { type: 'string' },
              price: { type: 'number' },
              originalPrice: { type: 'number' },
            },
          },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          orderNumber: { type: 'string', example: 'GLM-2024-001234' },
          userId: { type: 'string', format: 'uuid' },
          customer: { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' } } },
          shippingAddress: { $ref: '#/components/schemas/ShippingAddress' },
          billingAddress: { $ref: '#/components/schemas/ShippingAddress' },
          paymentMethod: { type: 'string', enum: ['CASH_ON_DELIVERY', 'KHALTI', 'ESEWA', 'BANK_TRANSFER', 'CARD'], example: 'KHALTI' },
          paymentStatus: { type: 'string', enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'], example: 'PENDING' },
          status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'], example: 'PENDING' },
          subtotal: { type: 'integer', description: 'Subtotal in paisa', example: 150000 },
          discount: { type: 'integer', description: 'Discount in paisa', example: 22500 },
          deliveryFee: { type: 'integer', description: 'Delivery fee in paisa', example: 15000 },
          giftWrapFee: { type: 'integer', description: 'Gift wrap fee in paisa', example: 5000 },
          grandTotal: { type: 'integer', description: 'Grand total in paisa', example: 147500 },
          currency: { type: 'string', example: 'NPR' },
          couponCode: { type: 'string', example: 'DASHAIN2024' },
          notes: { type: 'string' },
          items: { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      OrderItem: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          productId: { type: 'string', format: 'uuid' },
          variantId: { type: 'string', format: 'uuid' },
          productName: { type: 'string', example: 'Himalayan Rose Face Wash' },
          variantName: { type: 'string', example: 'Rose - 100ml' },
          quantity: { type: 'integer', example: 2 },
          unitPrice: { type: 'integer', description: 'Unit price in paisa', example: 75000 },
          totalPrice: { type: 'integer', description: 'Total price in paisa', example: 150000 },
          selectedShade: { type: 'string' },
          image: { type: 'string', format: 'uri' },
        },
      },
      UpdateOrderStatusInput: {
        type: 'object',
        required: ['status'],
        properties: {
          status: {
            type: 'string',
            enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'],
            example: 'SHIPPED',
          },
          paymentStatus: {
            type: 'string',
            enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
          },
          comment: { type: 'string', maxLength: 500, example: 'Shipped via Arhat Courier' },
        },
      },
      CreateReviewInput: {
        type: 'object',
        required: ['productId', 'rating'],
        properties: {
          productId: { type: 'string', format: 'uuid' },
          rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
          title: { type: 'string', maxLength: 200, example: 'Amazing product!' },
          comment: { type: 'string', maxLength: 2000, example: 'Best face wash I have used in Kathmandu!' },
        },
      },
      UpdateReviewInput: {
        type: 'object',
        properties: {
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          title: { type: 'string', maxLength: 200 },
          comment: { type: 'string', maxLength: 2000 },
        },
      },
      Review: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          productId: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          rating: { type: 'integer', example: 5 },
          title: { type: 'string', example: 'Amazing product!' },
          comment: { type: 'string', example: 'Best face wash I have used in Kathmandu!' },
          isApproved: { type: 'boolean' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              firstName: { type: 'string', example: 'Priya' },
              lastName: { type: 'string', example: 'Thapa' },
            },
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateBannerInput: {
        type: 'object',
        required: ['title', 'imageUrl'],
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 200, example: 'Dashain Sale 2024' },
          subtitle: { type: 'string', maxLength: 300, example: 'Up to 50% off!' },
          imageUrl: { type: 'string', format: 'uri', example: 'https://cdn.glamonepal.com/banners/dashain2024.jpg' },
          linkUrl: { type: 'string', format: 'uri' },
          position: { type: 'string', enum: ['HERO', 'MID_PAGE', 'SIDEBAR', 'POPUP'], default: 'HERO' },
          sortOrder: { type: 'integer', default: 0 },
          startsAt: { type: 'string', format: 'date-time' },
          expiresAt: { type: 'string', format: 'date-time' },
        },
      },
      UpdateBannerInput: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 200 },
          subtitle: { type: 'string', maxLength: 300 },
          imageUrl: { type: 'string', format: 'uri' },
          linkUrl: { type: 'string', format: 'uri' },
          position: { type: 'string', enum: ['HERO', 'MID_PAGE', 'SIDEBAR', 'POPUP'] },
          sortOrder: { type: 'integer' },
          isActive: { type: 'boolean' },
          startsAt: { type: 'string', format: 'date-time' },
          expiresAt: { type: 'string', format: 'date-time' },
        },
      },
      ReorderInput: {
        type: 'object',
        required: ['items'],
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              required: ['id', 'sortOrder'],
              properties: {
                id: { type: 'string', format: 'uuid' },
                sortOrder: { type: 'integer' },
              },
            },
          },
        },
      },
      CreatePopupInput: {
        type: 'object',
        required: ['title', 'content'],
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 200, example: 'Dashain Offer!' },
          content: { type: 'string', example: 'Use code DASHAIN2024 for 15% off' },
          imageUrl: { type: 'string', format: 'uri' },
          linkUrl: { type: 'string', format: 'uri' },
          triggerType: { type: 'string', enum: ['ON_LOAD', 'EXIT_INTENT', 'SCROLL_50', 'TIME_DELAY'], default: 'ON_LOAD' },
          delayMs: { type: 'integer', default: 0, example: 3000 },
          cookieDays: { type: 'integer', minimum: 1, maximum: 365, example: 7 },
          startsAt: { type: 'string', format: 'date-time' },
          expiresAt: { type: 'string', format: 'date-time' },
        },
      },
      UpdatePopupInput: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 200 },
          content: { type: 'string' },
          imageUrl: { type: 'string', format: 'uri' },
          linkUrl: { type: 'string', format: 'uri' },
          triggerType: { type: 'string', enum: ['ON_LOAD', 'EXIT_INTENT', 'SCROLL_50', 'TIME_DELAY'] },
          delayMs: { type: 'integer' },
          cookieDays: { type: 'integer', minimum: 1, maximum: 365 },
          startsAt: { type: 'string', format: 'date-time' },
          expiresAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateBlogPostInput: {
        type: 'object',
        required: ['title', 'content'],
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 500, example: 'Best Skincare Routine for Monsoon in Nepal' },
          excerpt: { type: 'string', maxLength: 500 },
          content: { type: 'string', example: 'Full blog content...' },
          category: { type: 'string', maxLength: 100, example: 'skincare' },
          metaTitle: { type: 'string', maxLength: 200 },
          metaDescription: { type: 'string', maxLength: 500 },
          tags: { type: 'array', items: { type: 'string' }, example: ['monsoon', 'skincare', 'nepal'] },
        },
      },
      UpdateBlogPostInput: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 500 },
          excerpt: { type: 'string', maxLength: 500 },
          content: { type: 'string', minLength: 1 },
          category: { type: 'string', maxLength: 100 },
          metaTitle: { type: 'string', maxLength: 200 },
          metaDescription: { type: 'string', maxLength: 500 },
          tags: { type: 'array', items: { type: 'string' } },
          isPublished: { type: 'boolean' },
        },
      },
      CreateGalleryItemInput: {
        type: 'object',
        required: ['title', 'imageUrl'],
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 200, example: 'Store Front - Thamel' },
          description: { type: 'string', maxLength: 500 },
          imageUrl: { type: 'string', format: 'uri', example: 'https://cdn.glamonepal.com/gallery/thamel-store.jpg' },
          category: { type: 'string', enum: ['instagram', 'store', 'products', 'team'], example: 'store' },
          sortOrder: { type: 'integer', default: 0 },
        },
      },
      UpdateGalleryItemInput: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 200 },
          description: { type: 'string', maxLength: 500 },
          imageUrl: { type: 'string', format: 'uri' },
          category: { type: 'string', enum: ['instagram', 'store', 'products', 'team'] },
          sortOrder: { type: 'integer' },
        },
      },
      CreateTeamMemberInput: {
        type: 'object',
        required: ['name', 'role'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 200, example: 'Srijana Koirala' },
          role: { type: 'string', minLength: 1, maxLength: 200, example: 'Lead Makeup Artist' },
          bio: { type: 'string', maxLength: 1000, example: '10+ years of experience in bridal makeup' },
          imageUrl: { type: 'string', format: 'uri' },
          sortOrder: { type: 'integer', default: 0 },
        },
      },
      UpdateTeamMemberInput: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 200 },
          role: { type: 'string', minLength: 1, maxLength: 200 },
          bio: { type: 'string', maxLength: 1000 },
          imageUrl: { type: 'string', format: 'uri' },
          sortOrder: { type: 'integer' },
        },
      },
      SubscribeInput: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email', example: 'priya@example.com' },
        },
      },
      UpdateSettingsInput: {
        type: 'object',
        required: ['settings'],
        properties: {
          settings: {
            type: 'array',
            items: {
              type: 'object',
              required: ['key', 'value'],
              properties: {
                key: { type: 'string', example: 'free_shipping_threshold' },
                value: { example: 50000 },
              },
            },
          },
        },
      },
      UpdateUserRoleInput: {
        type: 'object',
        required: ['role'],
        properties: {
          role: { type: 'string', enum: ['CUSTOMER', 'STAFF', 'ADMIN', 'SUPER_ADMIN'], example: 'STAFF' },
        },
      },
      UpdateUserStatusInput: {
        type: 'object',
        required: ['isActive'],
        properties: {
          isActive: { type: 'boolean', example: false },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          total: { type: 'integer', example: 150 },
          totalPages: { type: 'integer', example: 8 },
          hasMore: { type: 'boolean', example: true },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Validation error' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', example: 'email' },
                message: { type: 'string', example: 'Invalid email address' },
              },
            },
          },
        },
      },
      ApiResponse_User: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: { $ref: '#/components/schemas/User' },
          pagination: { nullable: true },
        },
      },
      ApiResponse_Profile: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: { $ref: '#/components/schemas/Profile' },
          pagination: { nullable: true },
        },
      },
      ApiResponse_Address: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: { $ref: '#/components/schemas/Address' },
          pagination: { nullable: true },
        },
      },
      ApiResponseList_Address: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: { type: 'array', items: { $ref: '#/components/schemas/Address' } },
          pagination: { $ref: '#/components/schemas/Pagination' },
        },
      },
      ApiResponse_Product: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: { $ref: '#/components/schemas/Product' },
          pagination: { nullable: true },
        },
      },
      ApiResponseList_Product: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: { type: 'array', items: { $ref: '#/components/schemas/Product' } },
          pagination: { $ref: '#/components/schemas/Pagination' },
        },
      },
      ApiResponse_Category: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: { $ref: '#/components/schemas/Category' },
          pagination: { nullable: true },
        },
      },
      ApiResponseList_Category: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: { type: 'array', items: { $ref: '#/components/schemas/Category' } },
          pagination: { $ref: '#/components/schemas/Pagination' },
        },
      },
      ApiResponse_Brand: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: { $ref: '#/components/schemas/Brand' },
          pagination: { nullable: true },
        },
      },
      ApiResponseList_Brand: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: { type: 'array', items: { $ref: '#/components/schemas/Brand' } },
          pagination: { $ref: '#/components/schemas/Pagination' },
        },
      },
      ApiResponse_Cart: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: { $ref: '#/components/schemas/Cart' },
          pagination: { nullable: true },
        },
      },
      ApiResponse_Order: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: { $ref: '#/components/schemas/Order' },
          pagination: { nullable: true },
        },
      },
      ApiResponseList_WishlistItem: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: { type: 'array', items: { $ref: '#/components/schemas/WishlistItem' } },
          pagination: { $ref: '#/components/schemas/Pagination' },
        },
      },
    },
  },
} as const