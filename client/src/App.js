import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

// Function to get the actual GPS coordinates using the Geolocation API
const getLocation = (successCallback, errorCallback) => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(successCallback, errorCallback);
  } else {
    errorCallback("Geolocation is not supported by this browser.");
  }
};

// Function to encode data to Base64
const encodeData = (latitude, longitude) => {
  const data = `${latitude},${longitude}`;
  return btoa(data);  // Base64 encode the coordinates
};

// Function to send location to the backend
const sendLocationToServer = (latitude, longitude, memberName) => {
  const encodedLocation = encodeData(latitude, longitude);

  axios.post('https://loctrack-gfhy.onrender.com/api/location', {
    name: memberName,
    location: encodedLocation  // Sending encoded coordinates
  })
    .then((response) => {
      console.log('Location sent successfully:', response.data);
    })
    .catch((error) => {
      console.error('Error sending location:', error);
    });
};

// Function to open Google Maps with the given coordinates
const openMap = (latitude, longitude) => {
  const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
  window.open(url, '_blank');
};

function App() {
  const [userName, setUserName] = useState('');
  const [isNameEntered, setIsNameEntered] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [location, setLocation] = useState({ latitude: null, longitude: null });

  // Handle name input change
  const handleNameChange = (event) => {
    setUserName(event.target.value);
  };

  // Handle name submission
  const handleSubmitName = () => {
    if (userName.trim()) {
      setIsNameEntered(true);
      // Fetch all users and their locations
      fetchUsersLocations();
    } else {
      alert("Please enter your name.");
    }
  };

  // Fetch all users and their locations from the backend
  const fetchUsersLocations = () => {
    axios.get('https://loctrack-gfhy.onrender.com/api/locations')
      .then((response) => {
        setUsersList(response.data);
      })
      .catch((error) => {
        console.error('Error fetching locations:', error);
      });
  };

  // Start location update interval and fetching locations
  useEffect(() => {
    if (isNameEntered) {
      const locationInterval = setInterval(() => {
        // Update user location every 10 seconds
        getLocation(
          (position) => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            console.log(`${userName}'s location: Latitude: ${latitude}, Longitude: ${longitude}`);
            setLocation({ latitude, longitude });
            sendLocationToServer(latitude, longitude, userName);
          },
          (error) => {
            alert(`Error: ${error.message}`);
          }
        );
      }, 10000); // Update every 10 seconds

      const usersInterval = setInterval(() => {
        // Fetch all users and their locations every 10 seconds
        fetchUsersLocations();
      }, 10000); // Fetch users every 10 seconds

      // Cleanup on component unmount
      return () => {
        clearInterval(locationInterval);
        clearInterval(usersInterval);
      };
    }
  }, [isNameEntered, userName]);  // Only start intervals once the name is entered

  return (
    <div className="App">
      <h1>Family Location Tracker</h1>

      {!isNameEntered ? (
        <div>
          <input
            type="text"
            placeholder="Enter your name"
            value={userName}
            onChange={handleNameChange}
          />
          <button onClick={handleSubmitName}>Submit</button>
        </div>
      ) : (
        <div>
          <h2>Welcome, {userName}!</h2>
          <button onClick={() => openMap(location.latitude, location.longitude)}>
            Your Location
          </button>
          <button onClick={() => sendLocationToServer(location.latitude, location.longitude, userName)}>
            Update Your Location Now
          </button>
          <div className="buttons">
            <h3>Family Members</h3>
            {usersList.map((user, index) => (
              user.name.trim().toUpperCase() !== userName.trim().toUpperCase() && ( // Exclude user's own name
                <div key={index}>
                  <p>{user.name} - Latitude: {user.latitude}, Longitude: {user.longitude}</p>
                  <button onClick={() => openMap(user.latitude, user.longitude)}>
                    View {user.name}'s Location on Google Maps
                  </button>
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
