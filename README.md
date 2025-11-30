This project is a final–year web development assignment built for IPY FC, showcasing a prototype football club website.
It includes pages for fixtures, news, team profiles, media gallery, merchandise shop, and a working user authentication system.
The website allows users to register, log in, and access protected features such as adding items to their shopping cart.
The backend provides secure authentication, and the frontend delivers a clean, responsive interface suitable for real–world club use.

How to Set Up the Project
1. Download or Clone the Project
Download the project folder or clone it from your repository so you have both the frontend and backend files on your computer.
2. Install the Backend Dependencies
The backend requires Node.js.
Inside the backend folder, install all required packages:
3. Create a .env File for Backend Configuration
Inside the backend folder, create a .env file containing:
Your MongoDB connection link
A secret key for JWT
The port number you want the backend to run on
This allows the backend to connect to your database and generate login tokens.
4. Start the Backend Server
Start the backend by running the server command in the backend folder.
This will make the API available on your computer so the website can log in, register, and authenticate users.
5. Open the Frontend
The frontend requires no installation.
Simply open the project in VS Code (or any editor) and launch index.html using Live Server.
This will load the website in your browser, normally on:
http://127.0.0.1:5500
6. Test the Features
Register a new account
Log in
See the navbar update
Add items to the cart
View media, fixtures, news, and team pages
Log out when finished
