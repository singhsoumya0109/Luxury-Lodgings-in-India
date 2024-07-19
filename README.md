# LuxuryLodgings

LuxuryLodgings is a web application designed to help travelers find the best offers on hotels and resorts across India. Users can browse reviews, compare prices, and make informed decisions. Hotel owners can also advertise their properties, reaching a broader audience and boosting their bookings.

## Preview

![Homepage](Images/Home-page.png)
![Hotel Details](Images/All-hotels.png)

## Table of Contents
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Features

- Browse and search for hotels and resorts across India.
- View detailed information about each hotel, including descriptions, prices, and locations.
- Read and write reviews for hotels.
- Sort hotels by rating, price, and number of reviews.
- Hotel owners can register and advertise their hotels.
- User authentication and authorization.
- Responsive design for mobile and desktop use.

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript, EJS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: Passport.js
- **Templating Engine**: EJS

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Ensure you have the following installed on your machine:

- Node.js
- npm (Node package manager)
- MongoDB

### Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/yourusername/LuxuryLodgings.git
    cd LuxuryLodgings
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Set up the MongoDB database:
    - Make sure MongoDB is running on your machine.
    - Create a database named `Hotels`.

4. Configure environment variables:
    - Create a `.env` file in the root directory.
    - Add the following environment variables to the `.env` file:
      ```env
      DATABASE_URL=mongodb://127.0.0.1:27017/Hotels
      SECRET=yourSecretKey
      ```

### Usage

1. Start the server:
    ```bash
    node app.js
    ```

2. Open your browser and navigate to `http://localhost:4000`.

## Contributing

Contributions are welcome! Please follow these steps to contribute:

1. Fork the repository.
2. Create a new branch:
    ```bash
    git checkout -b my-feature-branch
    ```
3. Make your changes and commit them:
    ```bash
    git commit -m "Add new feature"
    ```
4. Push to the branch:
    ```bash
    git push origin my-feature-branch
    ```
5. Create a Pull Request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact

If you have any questions or suggestions, feel free to reach out to us at [your.email@example.com](mailto:your.email@example.com).

---

Thank you for using LuxuryLodgings!
