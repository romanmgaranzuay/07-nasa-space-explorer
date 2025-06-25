// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

// Get the button and gallery elements from the page
const button = document.querySelector('button');
const gallery = document.getElementById('gallery');

// Your NASA API key
const apiKey = '9G0pWsHrFeNPZBpcdLRZFSgyvzTKmrSjR1stYrcr';

// --- Show a random "Did You Know?" space fact above the gallery ---
// Array of fun space facts
const spaceFacts = [
  "A day on Venus is longer than a year on Venus!",
  "Neutron stars can spin at a rate of 600 rotations per second.",
  "There are more trees on Earth than stars in the Milky Way.",
  "The footprints on the Moon will be there for millions of years.",
  "One million Earths could fit inside the Sun.",
  "Space is completely silent—there's no air to carry sound.",
  "Jupiter has 95 known moons!",
  "The hottest planet in our solar system is Venus.",
  "Saturn could float in water because it's mostly gas.",
  "The International Space Station travels at 28,000 km/h."
];
// Pick a random fact
const randomFact = spaceFacts[Math.floor(Math.random() * spaceFacts.length)];
// Create a new element for the fact
const factSection = document.createElement('div');
factSection.className = 'space-fact';
factSection.innerHTML = `<strong>Did you know?</strong><br>${randomFact}`;
// Insert the fact section above the gallery
const container = document.querySelector('.container');
container.insertBefore(factSection, gallery);
// --- End space fact section ---

// Listen for clicks on the button
button.addEventListener('click', () => {
  // Get the selected start and end dates
  const startDate = startInput.value;
  const endDate = endInput.value;

  // Build the API URL with the selected dates and your API key
  const url = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}&start_date=${startDate}&end_date=${endDate}`;

  // Show a loading message
  gallery.innerHTML = '<p>Loading space images...</p>';

  // Fetch data from NASA's APOD API
  fetch(url)
    .then(response => response.json())
    .then(data => {
      // Clear the gallery
      gallery.innerHTML = '';
      // Check if we got an array of images
      if (Array.isArray(data)) {
        // Sort the data by date (earliest first)
        data.sort((a, b) => new Date(a.date) - new Date(b.date));
        // Loop through each image and add it to the gallery
        data.forEach(item => {
          // Only show images (not videos)
          if (item.media_type === 'image') {
            // Create HTML for each image (explanation is hidden for now)
            const imageHtml = `
              <div class="gallery-item" style="cursor:pointer;">
                <img src="${item.url}" alt="${item.title}" />
                <h3>${item.title}</h3>
                <p>${item.date}</p>
                <!-- <p>${item.explanation}</p> -->
              </div>
            `;
            // Add the image to the gallery
            gallery.innerHTML += imageHtml;
          }
          else if (item.media_type === 'video' && item.url.includes('youtube.com')) {
            // If the media is a YouTube video, show a thumbnail and play icon

            // Get the YouTube video ID from the URL
            // Some YouTube URLs use /embed/VIDEO_ID or /watch?v=VIDEO_ID
            let videoId = null;
            try {
              const urlObj = new URL(item.url);
              // If the URL has a 'v' parameter (like /watch?v=VIDEO_ID)
              videoId = urlObj.searchParams.get('v');
              // If not, try to get the ID from the pathname (like /embed/VIDEO_ID)
              if (!videoId && urlObj.pathname.includes('/embed/')) {
                videoId = urlObj.pathname.split('/embed/')[1];
              }
            } catch (e) {
              // If URL parsing fails, do nothing
            }

            // Only show the thumbnail if we have a valid videoId
            if (videoId) {
              // This URL gives you the preview image for the video
              const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

              // SVG play icon (you can change the fill color)
              const playIconSVG = `
                <svg width="64" height="64" viewBox="0 0 64 64" style="
                  position:absolute;
                  top:35%;
                  left:50%;
                  transform:translate(-50%,-50%);
                  pointer-events:none;
                  " xmlns="http://www.w3.org/2000/svg">
                  <polygon points="14,8 58,32 14,56" fill="white"/>
                </svg>
              `;

              // Create HTML for the video thumbnail with a play icon
              const videoHtml = `
                <div class="gallery-item youtube-thumb" style="cursor:pointer; position:relative;">
                  <img src="${thumbnailUrl}" alt="${item.title}" style="width:340px; height:200px; object-fit:cover;" />
                  ${playIconSVG}
                  <h3>${item.title}</h3>
                  <p>${item.date}</p>
                  <!-- <p>${item.explanation}</p> -->
                </div>
              `;
              // Add the video thumbnail to the gallery
              gallery.innerHTML += videoHtml;
            }
          }
          else {
            // For other media types, do nothing (or you can add a message)
          }
        });
        // Add click event listeners to gallery items to open modal
        const galleryItems = document.querySelectorAll('.gallery-item');
        let imageIndex = 0;
        data.forEach(item => {
          // If the item is an image, add click event to open modal
          if (item.media_type === 'image') {
            const galleryItem = galleryItems[imageIndex];
            galleryItem.onclick = function() {
              showModal(item);
            };
            imageIndex++;
          }
          // If the item is a YouTube video, add click event to open modal
          else if (item.media_type === 'video' && item.url.includes('youtube.com')) {
            const galleryItem = galleryItems[imageIndex];
            galleryItem.onclick = function() {
              showModal(item);
            };
            imageIndex++;
          }
        });
        // If no images were found, show a message
        if (gallery.innerHTML === '') {
          gallery.innerHTML = '<p>No images found for this date range.</p>';
        }
      } else {
        // If the API returns an error, show it
        gallery.innerHTML = `<p>Error: ${data.msg || 'Could not fetch images.'}</p>`;
      }
    })
    .catch(error => {
      // Show an error message if something goes wrong
      gallery.innerHTML = `<p>Error: ${error.message}</p>`;
    });
});

// Function to create and show the modal
function showModal(item) {
  // Check if modal already exists, if not, create it
  let modal = document.getElementById('imageModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'imageModal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close-button">&times;</span>
        <img class="modal-img" src="" alt="" style="display:none;" />
        <div class="modal-video" style="display:none;"></div>
        <h2 class="modal-title"></h2>
        <p class="modal-date"></p>
        <p class="modal-explanation"></p>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // Hide both image and video by default
  const modalImg = modal.querySelector('.modal-img');
  const modalVideo = modal.querySelector('.modal-video');
  modalImg.style.display = 'none';
  modalVideo.style.display = 'none';

  // Show image or YouTube video embed
  if (item.media_type === 'image') {
    // Show the image in the modal
    modalImg.src = item.hdurl || item.url;
    modalImg.alt = item.title;
    modalImg.style.display = 'block';
    modalVideo.innerHTML = '';
  } else if (item.media_type === 'video' && item.url.includes('youtube.com')) {
    // Get YouTube video ID
    let videoId = null;
    try {
      const urlObj = new URL(item.url);
      videoId = urlObj.searchParams.get('v');
      if (!videoId && urlObj.pathname.includes('/embed/')) {
        videoId = urlObj.pathname.split('/embed/')[1];
      }
    } catch (e) {
      // If URL parsing fails, do nothing
    }
    if (videoId) {
      // Show YouTube video embed using an iframe
      const embedUrl = `https://www.youtube.com/embed/${videoId}`;
      // The iframe allows the user to play the video directly in the modal
      modalVideo.innerHTML = `
        <iframe 
          width="600" 
          height="360" 
          src="${embedUrl}" 
          frameborder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen 
          style="display:block; margin:auto; max-width:100%;">
        </iframe>
      `;
      modalVideo.style.display = 'block';
      modalImg.style.display = 'none';
    }
  }

  // Set modal text content
  modal.querySelector('.modal-title').textContent = item.title;
  modal.querySelector('.modal-date').textContent = item.date;
  modal.querySelector('.modal-explanation').textContent = item.explanation;

  // Show the modal
  modal.style.display = 'flex';

  // Close modal on button click
  modal.querySelector('.close-button').onclick = function() {
    modal.style.display = 'none';
  };
  // Close modal when clicking outside the content
  modal.onclick = function(event) {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };
}
