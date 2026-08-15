import Foundation
import Combine
import UserNotifications

class TimerManager: ObservableObject {
    @Published var timeRemaining: Int = 240 // 4 minutes in seconds
    @Published var isRunning: Bool = false
    @Published var timerLabel: String = "04:00"
    
    private var timer: AnyCancellable?
    private let initialTime = 240
    
    func startTimer() {
        // Reset if already running or finished
        stopTimer()
        timeRemaining = initialTime
        isRunning = true
        
        timer = Timer.publish(every: 1, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] _ in
                self?.updateTimer()
            }
        
        // Notify user that timer started
        sendLocalNotification(title: "Timer Started", body: "4-minute countdown initiated.")
    }
    
    func stopTimer() {
        timer?.cancel()
        isRunning = false
        timeRemaining = initialTime
        updateLabel()
    }
    
    private func updateTimer() {
        if timeRemaining > 0 {
            timeRemaining -= 1
            updateLabel()
        } else {
            stopTimer()
            sendLocalNotification(title: "Time's Up!", body: "The 4-minute timer has finished.")
        }
    }
    
    private func updateLabel() {
        let minutes = timeRemaining / 60
        let seconds = timeRemaining % 60
        timerLabel = String(format: "%02d:%02d", minutes, seconds)
    }
    
    private func sendLocalNotification(title: String, body: String) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        
        let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request)
    }
}
