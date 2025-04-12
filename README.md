# PYUSD dApp: Blockchain Explorer & Marketplace

![PYUSD dApp](/public/retailer.png)

## Overview

PYUSD dApp is a comprehensive decentralized application that enables users to interact with PYUSD (Paypal USD) stablecoin on the Ethereum blockchain. The platform combines a powerful blockchain explorer with a marketplace, allowing users to transfer PYUSD, explore transactions, and purchase goods and services using PYUSD.

PYUSD dApp leverages Google Cloud Platform's Blockchain RPC service to provide advanced blockchain interaction capabilities. The GCP RPC service powers critical features including detailed transaction tracing, historical transaction analysis, cross-chain transaction lookups, and real-time transaction simulation. This integration enables the application to deliver enterprise-grade performance and reliability while handling complex blockchain operations that would typically overload standard RPC endpoints.

## Problem Statement

Traditional stablecoin interfaces often lack user-friendly features and comprehensive transaction visibility. Users struggle with:

- Limited transaction history and analytics
- Difficulty tracking high-volume addresses
- Poor integration between wallet functionality and commerce
- Lack of detailed transaction insights
- Complex setup and configuration requirements

## Solution

PYUSD dApp addresses these challenges by providing:

1. **Integrated Wallet & Marketplace**: Seamlessly transfer PYUSD and shop in one application
2. **Advanced Explorer**: Detailed transaction tracing and address analysis
3. **High-Volume Address Handling**: Special optimizations for addresses with millions of transactions
4. **User Authentication**: Secure login with wallet connection
5. **RPC Monitoring**: Performance tracking of blockchain connections
6. **Test Mode**: Simulated transactions for testing without real funds

## Features

### Wallet Features
- Connect to MetaMask and other Ethereum wallets
- Send and receive PYUSD
- View transaction history
- Test mode with simulated transactions

### Explorer Features
- Search transactions by hash
- View address activity and balance
- Analyze transaction execution traces
- Historical transaction analysis
- High-volume address handling

### Marketplace Features
- Browse and purchase products with PYUSD
- Shopping cart functionality
- Order history and tracking
- Product reviews
- Secure checkout process

### Authentication
- Email magic link authentication
- Social login options
- Wallet connection and verification
- Profile management

### Monitoring & Diagnostics
- RPC connection monitoring
- Performance metrics
- Network status indicators
- Diagnostic tools

## Technologies Used

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Blockchain**: Ethereum, MetaMask, ethers.js
- **RPC Provider**: Google Cloud Platform Blockchain Node Engine
- **UI Components**: shadcn/ui

## Setup Instructions

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- MetaMask extension installed in your browser
- Supabase account
- Google Cloud Platform account (optional, for advanced RPC features)

### Installation

1. Clone the repository:
  ```bash
   git clone https://github.com/mwihoti/pyusd-dapp.git
   cd pyusd-dapp
  ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_GCP_RPC_ENDPOINT=your_gcp_rpc_endpoint (optional)
 ```

4. Set up the database:
   Run the SQL scripts in the `supabase-schema.sql` file in your Supabase SQL editor.

5. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Deployment

1. Build the application:
   ```bash
   npm run build
   # or
   yarn build
   ```

2. Start the production server:
   ```bash
   npm start
   # or
   yarn start
```

3. For deployment on Vercel:
   ```bash
   vercel
   ```

## Usage Instructions

### Connecting Your Wallet

1. Navigate to the home page
2. Click "Connect Wallet"
3. Approve the connection request in your MetaMask
4. Your wallet is now connected and you can see your PYUSD balance

### Sending PYUSD

1. Go to the Wallet tab
2. Click on "Send" tab
3. Enter the recipient's address and amount
4. Click "Send PYUSD"
5. Confirm the transaction in your wallet

### Using the Explorer

1. Navigate to the Explorer page
2. Search for a transaction hash or address
3. View detailed transaction information
4. Analyze transaction traces and execution details

### Shopping in the Marketplace

1. Browse products in the marketplace
2. Add items to your cart
3. Proceed to checkout
4. Connect your wallet if not already connected
5. Complete the purchase with PYUSD

### Using Test Mode

1. Toggle "Test Mode" in the wallet interface
2. Get test tokens by clicking "Get Test Tokens"
3. Perform transactions without using real PYUSD

## Architecture

### Frontend Architecture

The application follows a modern React architecture with Next.js:

- **App Router**: Page routing and navigation
- **Server Components**: For improved performance
- **Client Components**: For interactive elements
- **Hooks**: Custom hooks for wallet, cart, and authentication state

### Blockchain Integration

- **Wallet Connection**: Via ethers.js and browser providers
- **Transaction Handling**: Using ethers.js for transaction creation and signing
- **RPC Communication**: Direct communication with Ethereum nodes via JSON-RPC
- **Advanced Tracing**: Using debug_traceTransaction and trace_block methods

### Authentication Flow

1. User signs in via email or social login
2. User connects wallet
3. Wallet address is associated with user account
4. Authentication state is maintained across sessions

### Database Schema

- **profiles**: User profile information
- **wallets**: User wallet addresses
- **transactions**: Transaction history
- **orders**: Marketplace orders
- **order_items**: Items in each order
- **reviews**: Product reviews

## Advanced Features

### High-Volume Address Handling

The explorer implements special handling for addresses with millions of transactions:

1. Identifies known high-volume addresses
2. Provides optimized views with limited transaction samples
3. Offers links to external explorers for complete history

### RPC Monitoring

The application includes a comprehensive RPC monitoring system:

1. Tracks response times and success rates
2. Monitors network status and synchronization
3. Provides detailed metrics on method performance
4. Alerts on connection issues or performance degradation

### Transaction Simulation

Before sending transactions, users can simulate them to:

1. Estimate gas costs
2. Verify transaction success
3. Identify potential errors
4. Understand execution flow

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see below for details:

```
MIT License

Copyright (c) 2023 PYUSD dApp Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Contact

For questions or support, please open an issue on the GitHub repository or contact the maintainers at:

- Email: danmwihoti@gmail.com
