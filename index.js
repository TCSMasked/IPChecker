const config = require('./config.json');
const partnersWebhookURL = config.partners_webhook_url;
const membersWebhookURL = config.members_webhook_url;
const axios = require('axios');
const externalIp = require('external-ip');
const fs = require('fs');

// Create an instance of external-ip
const getPublicIp = externalIp();

// Function to read the last known IP address from a file
const getLastKnownIp = () => {
  try {
    return fs.readFileSync('last_known_ip.txt', 'utf8').trim();
  } catch (err) {
    return null;
  }
};

// Function to write the current IP address to a file
const saveCurrentIp = (ip) => {
  fs.writeFileSync('last_known_ip.txt', ip);
};

// Function to send IP change notification to Discord webhook
const sendNotification = async (newIp) => {
  const embed = {
    title: 'IP Address Change Notification',
    description: `New IP Address: ${newIp}`,
    color: 0x00ff00, // Green color
    timestamp: new Date().toISOString(),
  };

  try {
    await axios.post(partnersWebhookURL, { embeds: [embed] });
    await axios.post(membersWebhookURL, { embeds: [embed] });
    console.log('Notification sent successfully.');
  } catch (error) {
    console.error('Error sending notification:', error.message);
  }
};

// Function to continuously check for IP address change
const checkIpAddress = () => {
  let lastIp = getLastKnownIp();

  // Continuously check for IP address change
  setInterval(() => {
    getPublicIp((err, currentIp) => {
      if (err) {
        console.error('Error retrieving public IP:', err.message);
        return;
      }

      if (currentIp !== lastIp) {
        console.log('Detected IP address change:', currentIp);
        saveCurrentIp(currentIp);
        sendNotification(currentIp).catch((error) => {
          console.error('Error sending notification:', error.message);
        });
        lastIp = currentIp;
      } else {
        console.log('No IP address change detected.');
      }
    });
  }, 100); // Check every minute
};

// Start checking for IP address change
checkIpAddress();