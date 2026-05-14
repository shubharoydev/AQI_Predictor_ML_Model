// Keep the API routing intact while modifying the UI interaction

function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? '<i class="fa-solid fa-check-circle"></i>' : '<i class="fa-solid fa-circle-exclamation"></i>';
    toast.innerHTML = `${icon} <span>${message}</span>`;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOutRight 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

document.getElementById('searchBtn').addEventListener('click', async () => {
    const city = document.getElementById('cityInput').value.trim();
    const loader = document.getElementById('loader');
    const resultCard = document.getElementById('resultCard');

    if (!city) {
        showToast("Please enter a city name", "error");
        return;
    }

    // Show loader skeleton, hide previous results
    loader.classList.remove('hidden');
    resultCard.classList.add('hidden');
    resultCard.classList.remove('slide-up');

    // Reset styles on card
    resultCard.className = 'hidden';

    try {
        // Unchanged Backend Call
        // Updated Call
const response = await fetch(`http://127.0.0.1:8000/predict/${city}`, {
    method: 'GET',
    headers: {
        'ngrok-skip-browser-warning': 'true',
        'Content-Type': 'application/json'
    }
});
        const data = await response.json();

        if (response.status !== 200) throw new Error(data.detail || "Failed to fetch data");

        // Update UI
        document.getElementById('cityName').innerText = data.city;
        
        // Show Coordinates
        const lat = data.coordinates.lat.toFixed(4);
        const lon = data.coordinates.lon.toFixed(4);
        document.getElementById('cityCoords').innerText = `${lat}° N, ${lon}° E`;
        
        document.getElementById('aqiNumber').innerText = data.predicted_aqi;
        
        const catBadge = document.getElementById('aqiCategory');
        catBadge.innerText = data.category;

        // Apply dynamic colors
        resultCard.classList.remove('status-good', 'status-unhealthy', 'status-hazardous');
        catBadge.className = 'category-badge'; // reset

        if(data.predicted_aqi <= 50) {
            resultCard.classList.add('status-good');
            catBadge.classList.add('badge-good');
        } else if(data.predicted_aqi > 150) {
            resultCard.classList.add('status-unhealthy');
            catBadge.classList.add('badge-unhealthy');
        } else if(data.predicted_aqi > 50 && data.predicted_aqi <= 150) {
            // For moderate we can just use unhealthy styles or a generic warning. 
            // The original logic only had >150 and >250, but if it's <=150 and >50 it was doing nothing (moderate).
            // Let's add a default warning state for moderate just in case if needed, but we'll map >150 as unhealthy and >250 hazardous
            if(data.predicted_aqi > 250) {
                 resultCard.classList.add('status-hazardous');
                 catBadge.classList.add('badge-hazardous');
            } else {
                 resultCard.classList.add('status-unhealthy'); // Moderate/Unhealthy bucket mapping from original
                 catBadge.classList.add('badge-unhealthy');
            }
        }

        // Fix the exact old logic preserving mapping:
        resultCard.className = '';
        catBadge.className = 'category-badge';
        if(data.predicted_aqi <= 50) {
            resultCard.classList.add('status-good');
            catBadge.classList.add('badge-good');
        } else if(data.predicted_aqi > 250) {
            resultCard.classList.add('status-hazardous');
            catBadge.classList.add('badge-hazardous');
        } else if (data.predicted_aqi > 150) {
            resultCard.classList.add('status-unhealthy');
            catBadge.classList.add('badge-unhealthy');
        } else {
            // Moderate
            resultCard.classList.add('status-unhealthy'); 
            catBadge.classList.add('badge-unhealthy');
        }


        // Update Details with dataset-matching units
        document.getElementById('temp').innerText = `${data.raw_data.temp}°C`;
        document.getElementById('hum').innerText = `${data.raw_data.humidity}%`;
        document.getElementById('wind').innerText = `${data.raw_data.wind} km/h`;
        
        // Handle decimals for pollutant/dust data and append units
        const dust = parseFloat(data.raw_data.dust) || 0;
        const co = parseFloat(data.raw_data.co) || 0;
        const no2 = parseFloat(data.raw_data.no2) || 0;
        
        document.getElementById('dust').innerText = `${dust.toFixed(1)} μg/m³`;
        document.getElementById('co').innerText = `${co.toFixed(1)} μg/m³`;
        document.getElementById('no2').innerText = `${no2.toFixed(1)} μg/m³`;

        showToast(`Successfully fetched AQI for ${data.city}`, 'success');

        // Animate in
        resultCard.classList.add('slide-up');
        
    } catch (error) {
        showToast(error.message, "error");
    } finally {
        loader.classList.add('hidden');
    }
});

// Allow ENTER key to trigger search
document.getElementById('cityInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('searchBtn').click();
    }
});