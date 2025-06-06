# Volumio Control Page

This project provides a simple web interface for sending song links to a Volumio system. It allows users to input song URLs and control playback through a user-friendly interface.

## Project Structure

```
volumio-control-page
├── src
│   ├── index.html       # Main HTML page for user interface
│   ├── styles           # Directory for CSS styles
│   │   └── main.css     # Styles for the HTML page
│   ├── js               # Directory for JavaScript files
│   │   └── app.js       # JavaScript functionality for the page
└── README.md            # Project documentation
```

## Setup Instructions

1. Clone the repository to your local machine.
2. Navigate to the project directory.
3. Open `src/index.html` in a web browser to view the interface.

## Usage Guidelines

- Enter the URL of the song you wish to play in the input field.
- Click the "Send" button to submit the link to the Volumio system.
- Ensure that your Volumio system is running and accessible over the network.

## Connecting to Volumio

To connect to your Volumio system, ensure that you have the correct IP address and that the Volumio API is enabled. The JavaScript code in `src/js/app.js` handles the API calls to send the song links.

## Contributing

Feel free to submit issues or pull requests if you have suggestions for improvements or additional features.