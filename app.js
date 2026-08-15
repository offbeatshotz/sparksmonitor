// Check if Capacitor is available
console.log("app.js loading...");
const isCapacitor = typeof (Capacitor) !== 'undefined' && Capacitor.Plugins;
const BackgroundGeolocation = isCapacitor ? Capacitor.Plugins.BackgroundGeolocation : null;

if (isCapacitor || ('geolocation' in navigator)) { // Keep browser geolocation as fallback or for testing PWA in browser
    let watchId; // For browser geolocation, if used
    let bgGeoListener = null; // For background geolocation plugin
    let isTracking = false;
    let currentTrip = null;
    let allTrips = [];

    let totalEarnings = parseFloat(localStorage.getItem('totalEarnings')) || 0;
    let overallTotalDistance = parseFloat(localStorage.getItem('overallTotalDistance')) || 0;

    // Speech API variables
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const SpeechSynthesis = window.speechSynthesis;
    let recognition = null;
    let speaking = false;
    let awaitingVoiceResponse = false;
    let lastPromptTime = 0; // To debounce speed-based prompts

    const mileageDisplay = document.getElementById('mileage-display'); // For displaying overall total mileage
    const totalEarningsDisplay = document.getElementById('total-earnings');
    const mileageStatus = document.getElementById('mileage-status'); // For geolocation status text
    const startTrackingButton = document.getElementById('start-tracking');
    const stopTrackingButton = document.getElementById('stop-tracking');
    const sendLogButton = document.getElementById('send-log-btn');
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-msg');
    const statusIndicator = document.getElementById('status-indicator');
    const listenButton = document.getElementById('listen-btn');
    const readLogsButton = document.getElementById('read-logs-btn');

    // Helper function for Text-to-Speech
    function speak(text) {
        if (SpeechSynthesis && !speaking) {
            speaking = true;
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.onend = () => { speaking = false; };
            utterance.onerror = (event) => { console.error('SpeechSynthesis error:', event); speaking = false; };
            SpeechSynthesis.speak(utterance);
        } else if (speaking) {
            console.log("Already speaking, queuing text: ", text);
        }
    }
    
    // Make speak available to index.html
    window.speak = speak;

    // Helper function to start Speech Recognition
    function startListening(onResultCallback, onEndCallback, interimResults = false) {
        if (!SpeechRecognition) {
            console.warn("Speech Recognition not supported in this browser.");
            speak("Speech recognition is not supported in this browser.");
            return;
        }
        if (recognition) {
            recognition.stop();
        }
        recognition = new SpeechRecognition();
        recognition.interimResults = interimResults;
        recognition.continuous = false; // Only listen for a single command
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            const last = event.results.length - 1;
            const command = event.results[last][0].transcript.toLowerCase();
            console.log('Voice command recognized:', command);
            if (onResultCallback) {
                onResultCallback(command);
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech Recognition error:', event.error);
            speak("Sorry, I didn't catch that. Please try again.");
            if (onEndCallback) {
                onEndCallback();
            }
        };

        recognition.onend = () => {
            console.log("Speech Recognition ended.");
            if (onEndCallback) {
                onEndCallback();
            }
        };

        recognition.start();
        console.log("Listening for voice command...");
    }

    // Function to handle recognized voice commands
    function handleVoiceCommand(command) {
        if (command.includes("start tracking")) {
            startTracking();
        } else if (command.includes("stop tracking")) {
            stopTracking();
        } else if (command.includes("read logs") || command.includes("read log")) {
            readLogs();
        } else if (command.includes("what are my earnings") || command.includes("my earnings")) {
            speak(`Your total earnings are ${totalEarnings.toFixed(2)} dollars.`);
        } else if (command.includes("what is my distance") || command.includes("my distance")) {
            speak(`Your total distance is ${overallTotalDistance.toFixed(2)} miles.`);
        } else if (command.includes("add ten dollars") || command.includes("add earnings")) {
            // Simulate adding earnings
            totalEarnings += 10.00;
            saveData();
            updateDisplay();
            speak("Ten dollars added to your earnings.");
        } else {
            speak("Command not recognized. Please say 'start tracking', 'stop tracking', 'read logs', 'what are my earnings', 'what is my distance', or 'add ten dollars'.");
        }
    }

    // Function to vocalize logs
    function readLogs() {
        let logSummary = `You have driven a total of ${overallTotalDistance.toFixed(2)} miles and earned ${totalEarnings.toFixed(2)} dollars.`;
        if (allTrips.length > 0) {
            logSummary += ` You have completed ${allTrips.length} trips.`;
            const lastTrip = allTrips[allTrips.length - 1];
            logSummary += ` Your last trip was for ${lastTrip.tripDistance.toFixed(2)} miles and earned ${lastTrip.earnings.toFixed(2)} dollars.`;
        } else {
            logSummary += " You have no completed trips yet.";
        }
        speak(logSummary);
    }

    // Haversine formula to calculate distance between two lat/lon points in miles
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // metres
        const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        const d = R * c; // in metres
        return d / 1609.34; // convert to miles
    }

    function updateDisplay() {
        if (mileageDisplay) mileageDisplay.textContent = overallTotalDistance.toFixed(2);
        if (totalEarningsDisplay) totalEarningsDisplay.textContent = totalEarnings.toFixed(2);
    }

    function saveData() {
        localStorage.setItem('allTrips', JSON.stringify(allTrips));
        localStorage.setItem('totalEarnings', totalEarnings.toFixed(2));
        localStorage.setItem('overallTotalDistance', overallTotalDistance.toFixed(2));
    }

    function loadData() {
        const storedTrips = localStorage.getItem('allTrips');
        if (storedTrips) {
            allTrips = JSON.parse(storedTrips);
        }
        totalEarnings = parseFloat(localStorage.getItem('totalEarnings')) || 0;
        overallTotalDistance = parseFloat(localStorage.getItem('overallTotalDistance')) || 0;
        updateDisplay();
    }

    function showToast(msg, color = 'bg-blue-600') {
        if (toastMsg && toast) {
            toastMsg.textContent = msg;
            toast.className = `fixed bottom-8 right-8 ${color} text-white px-6 py-3 rounded-full shadow-2xl transform transition-all duration-300 z-50 flex items-center space-x-3`;
            toast.classList.remove('translate-y-24', 'opacity-0');
            setTimeout(() => {
                toast.classList.add('translate-y-24', 'opacity-0');
            }, 3000);
        }
    }

    // New function to handle common position update logic
    function handlePositionUpdate(position) {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const timestamp = position.timestamp;

        // Check speed for prompting to start tracking
        const speedMps = position.coords.speed || 0; // Speed in meters per second, default to 0 if null
        const speedMph = speedMps * 2.23694; // Convert to miles per hour
        const SPEED_THRESHOLD = 5; // mph
        const PROMPT_DEBOUNCE_TIME = 60 * 1000; // 1 minute

        if (!isTracking && speedMph > SPEED_THRESHOLD && (Date.now() - lastPromptTime > PROMPT_DEBOUNCE_TIME || lastPromptTime === 0)) {
            speak("Are you driving? Would you like to start car tracking?");
            awaitingVoiceResponse = true;
            lastPromptTime = Date.now();
            startListening((command) => {
                if (command.includes("yes") || command.includes("start") || command.includes("start tracking")) {
                    speak("Okay, starting tracking.");
                    startTracking();
                } else {
                    speak("Okay, I will not start tracking.");
                }
                awaitingVoiceResponse = false;
            }, () => {
                awaitingVoiceResponse = false;
            });
        }

        if (isTracking && currentTrip) {
            currentTrip.rawPositions.push(position);

            if (currentTrip.path.length === 0) {
                currentTrip.path.push({ lat, lon, timestamp });
            } else {
                const lastPoint = currentTrip.path[currentTrip.path.length - 1];
                const distanceSegment = calculateDistance(lastPoint.lat, lastPoint.lon, lat, lon);

                if (distanceSegment * 1609.34 > 10) { // Only add if moved a significant distance (> 10 meters)
                    currentTrip.tripDistance += distanceSegment;
                    currentTrip.path.push({ lat, lon, timestamp });
                    overallTotalDistance += distanceSegment; // Update overall total
                    updateDisplay();
                    saveData();
                }
            }
        }
    }

    function startTracking() {
        if (isTracking) {
            speak("Tracking is already active.");
            return;
        } // Prevent multiple starts

        if (mileageStatus) mileageStatus.textContent = 'Tracking started...';

        currentTrip = {
            id: Date.now(),
            startTime: new Date().toISOString(),
            endTime: null,
            tripDistance: 0, // Distance for the current trip
            path: [], // Array of {latitude, longitude, timestamp}
            rawPositions: [] // Store all raw position objects
        };
        isTracking = true;
        if (statusIndicator) {
            statusIndicator.classList.remove('bg-red-500', 'bg-slate-500');
            statusIndicator.classList.add('bg-emerald-500', 'animate-pulse');
        }

        if (isCapacitor) {
            // Configure and start background geolocation plugin
            BackgroundGeolocation.configure({
                desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
                stationaryRadius: 10, // meters
                distanceFilter: 10, // meters
                debug: false, // Set to true for debugging console logs
                stopOnTerminate: false, // Set to false to continue tracking after app is closed
                // Android-specific settings
                startOnBoot: true, // Auto start tracking when device boots
                interval: 10000, // 10 seconds
                fastestInterval: 5000, // 5 seconds
                activitiesInterval: 10000,
                notificationTitle: 'Car Tracker Pro',
                notificationText: 'Tracking your location in the background.',
                notificationIconColor: '#424242',
                notificationPriority: BackgroundGeolocation.NOTIFICATION_PRIORITY_HIGH,
                // iOS-specific settings
                pausesLocationUpdatesAutomatically: false,
                allowDeferredLocationUpdates: true,
                url: 'http://localhost/api/location', // Dummy URL, plugin requires it
                httpHeaders: {'X-FOO': 'BAR'},
                maxLocations: 1000,
                postTemplate: {
                    latitude: '@latitude',
                    longitude: '@longitude',
                    accuracy: '@accuracy',
                    speed: '@speed',
                    time: '@time',
                    battery: '@battery.level',
                    isMoving: '@isMoving'
                }
            });

            bgGeoListener = BackgroundGeolocation.on('location', (location) => {
                const lat = location.latitude;
                const lon = location.longitude;
                const timestamp = new Date(location.time).getTime();

                if (mileageStatus) mileageStatus.textContent = `Capacitor Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)}`;
                console.log(`Capacitor Current position: ${lat}, ${lon}`);

                const currentPosition = { coords: { latitude: lat, longitude: lon, speed: location.speed }, timestamp: timestamp };
                handlePositionUpdate(currentPosition);
            });

            BackgroundGeolocation.on('error', (error) => {
                console.error('Background Geolocation Error:', error);
                speak(`Background geolocation error: ${error.message}. Stopping tracking.`);
                stopTracking();
            });

            BackgroundGeolocation.start();
            speak("Tracking started with Capacitor background geolocation.");
            showToast("Tracking started with Capacitor!", "bg-blue-600");

        } else if ('geolocation' in navigator) {
            // Fallback to browser geolocation for PWA in browser mode
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    const timestamp = position.timestamp;

                    if (mileageStatus) mileageStatus.textContent = `Browser Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)}`;
                    console.log(`Browser Current position: ${lat}, ${lon}`);

                    handlePositionUpdate(position);
                },
                (error) => {
                    if (mileageStatus) mileageStatus.textContent = `Geolocation error: ${error.message}`;
                    console.error(`Geolocation error: ${error.message}`);
                    speak(`Geolocation error: ${error.message}. Stopping tracking.`);
                    stopTracking(); // Stop tracking on error
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 } // Increased timeout
            );
            speak("Tracking started with browser geolocation.");
            showToast("Tracking started with browser!", "bg-blue-600");
        } else {
            if (mileageStatus) mileageStatus.textContent = "Geolocation is not supported by this browser or Capacitor.";
            speak("Geolocation is not supported by this browser or Capacitor.");
            showToast("Geolocation not supported.", "bg-red-600");
        }
    }

    function stopTracking() {
        if (!isTracking) {
            speak("Tracking is not active.");
            return;
        } // Only stop if tracking is active

        if (isCapacitor) {
            BackgroundGeolocation.stop();
            if (bgGeoListener) {
                bgGeoListener.remove(); // Remove the listener
                bgGeoListener = null;
            }
            speak("Capacitor background geolocation stopped.");
        } else if (watchId) {
            navigator.geolocation.clearWatch(watchId);
            speak("Browser geolocation stopped.");
        }

        isTracking = false;
        if (mileageStatus) mileageStatus.textContent = 'Tracking stopped.';
        if (statusIndicator) {
            statusIndicator.classList.remove('bg-emerald-500', 'animate-pulse');
            statusIndicator.classList.add('bg-red-500');
        }
        console.log('Geolocation tracking stopped.');

        if (currentTrip) {
            currentTrip.endTime = new Date().toISOString();
            // Simulate earnings based on trip completion
            const tripEarnings = currentTrip.tripDistance > 0 ? 10.00 : 0.00; // Example: $10 per trip
            totalEarnings += tripEarnings;
            currentTrip.earnings = tripEarnings;

            allTrips.push(currentTrip);
            saveData();
            currentTrip = null;
            updateDisplay();
            speak(`Trip saved! You earned ${tripEarnings.toFixed(2)} dollars.`);
            showToast(`Trip saved! Earnings: $${tripEarnings.toFixed(2)}`, "bg-emerald-600");
        }
    }

    // Event Listeners
    if (startTrackingButton) startTrackingButton.addEventListener('click', startTracking);
    if (stopTrackingButton) stopTrackingButton.addEventListener('click', stopTracking);
    if (listenButton) {
        listenButton.addEventListener('click', () => {
            speak("Listening for commands.");
            startListening(handleVoiceCommand, () => {
                // Callback when listening ends
            });
        });
    }
    if (readLogsButton) readLogsButton.addEventListener('click', readLogs);
    if (sendLogButton) {
        sendLogButton.addEventListener('click', () => {
            console.log('Local log data:', {
                overallTotalDistance: overallTotalDistance.toFixed(2),
                totalEarnings: totalEarnings.toFixed(2),
                allTrips: allTrips // Send detailed trip data
            });
            speak("Log data saved to device locally.");
            alert('Log saved to device! Data is persistent across sessions.');
        });
    }

    // Initial load and setup
    loadData();

} else {
    const status = document.getElementById('mileage-status');
    if (status) status.textContent = 'Geolocation is not supported by this browser or Capacitor.';
    console.error('Geolocation not supported.');
} 
