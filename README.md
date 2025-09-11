# WalletGyde AI Budget Builder

WalletGyde AI Budget Builder is a modern web application that helps users analyze their financial transactions, build budgets, and receive personalized financial insights using AI. The app supports CSV uploads, Plaid integration, and interactive charts for a seamless budgeting experience.

## Features
- AI-powered budget recommendations
- CSV transaction upload and processing
- Plaid integration for secure bank data import
- Interactive financial charts and comparisons
- Email capture and popup for user engagement
- Responsive design for mobile and desktop
- Secure data handling

## Technologies Used
- React (Vite)
- TypeScript
- Tailwind CSS
- Node.js (server)
- Drizzle ORM
- Gemini & OpenAI API integrations
- Plaid API

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Installation
1. Clone the repository:
   ```sh
   git clone https://github.com/GRDINESH821/WalletGyde-AI-Budget-Builder.git
   cd WalletGyde-AI-Budget-Builder
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Set up environment variables:
   - Copy `.env.example` to `.env` and fill in required API keys and secrets.

### Running the App
- Start the development server:
  ```sh
  npm run dev
  ```
- The app will be available at `http://localhost:5000` (or the port specified in your `.env`).

### Folder Structure
- `client/` - Frontend React app
- `server/` - Backend API and services
- `shared/` - Shared schema and types
- `uploads/` - Uploaded CSV files
- `public/` - Static assets

## Usage
1. Upload your transaction CSV or connect your bank via Plaid.
2. View AI-generated budget recommendations and charts.
3. Explore features and get financial insights.

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
This project is licensed under the MIT License.

## Contact
For questions or support, contact [GRDINESH821](https://github.com/GRDINESH821).
