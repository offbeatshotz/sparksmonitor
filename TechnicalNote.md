# Technical Guide: Reading 3rd Party Notifications on iOS

## The Challenge
iOS apps are **sandboxed**. This means one app cannot read the data, notifications, or screen of another app directly. There is no `NotificationListenerService` like on Android.

## The Workaround: Screen Monitoring + OCR
To achieve your goal of detecting a "placeholder" text in a Spark Driver notification banner, you must use **ReplayKit** and **Vision**.

### 1. ReplayKit (Broadcast Upload Extension)
You need to add a "Broadcast Upload Extension" target to your Xcode project.
- This allows your app to receive a live video stream of the user's screen.
- The user must manually start the "Screen Broadcast" from the Control Center or a button in your app.

### 2. Vision Framework (OCR)
Inside the extension's `processSampleBuffer` method, you perform OCR:
```swift
import Vision

func processSampleBuffer(_ sampleBuffer: CMSampleBuffer) {
    let request = VNRecognizeTextRequest { (request, error) in
        guard let observations = request.results as? [VNRecognizedTextObservation] else { return }
        for observation in observations {
            let topCandidate = observation.topCandidates(1).first
            if let text = topCandidate?.string, text.contains("placeholder") {
                // Trigger the timer in the main app!
                self.notifyMainApp()
            }
        }
    }
    request.recognitionLevel = .accurate
    // Process the frame...
}
```

### 3. Inter-App Communication
Since the extension runs in a separate process, you must use:
- **App Groups**: To share data/settings.
- **Darwin Notifications**: To signal the main app to start the timer immediately.

## Alternative: Apple Notification Center Service (ANCS)
If you have a secondary device (like a Mac or an ESP32), you can connect to the iPhone via Bluetooth. iOS shares notification metadata (App ID, Title, Message) with connected Bluetooth LE devices. This is more reliable but requires external hardware.

## Limitations & Risks
- **Battery Life**: Constant screen processing is heavy on the battery.
- **App Store**: Apple typically rejects apps that use ReplayKit for background monitoring unless it's for a legitimate "streaming" or "recording" purpose.
- **Privacy**: The user will see a red/purple status bar indicating the screen is being captured.
