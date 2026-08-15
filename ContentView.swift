import SwiftUI

struct ContentView: View {
    @StateObject private var timerManager = TimerManager()
    @StateObject private var monitor = NotificationMonitor()
    
    var body: some View {
        VStack(spacing: 30) {
            Text("Spark Monitor")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            VStack {
                Text(timerManager.timerLabel)
                    .font(.system(size: 80, weight: .thin, design: .monospaced))
                    .foregroundColor(timerManager.isRunning ? .blue : .gray)
                
                Text("4-Minute Timer")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding(.vertical, 40)
            
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Circle()
                        .fill(monitor.isAuthorized ? .green : .red)
                        .frame(width: 10, height: 10)
                    Text(monitor.isAuthorized ? "Monitoring Active (Simulated)" : "Permissions Required")
                        .font(.subheadline)
                }
                
                Text("Last Detection: \(monitor.lastDetectedText)")
                    .font(.footnote)
                    .foregroundColor(.secondary)
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)
            
            Spacer()
            
            VStack(spacing: 15) {
                Button(action: {
                    monitor.simulateDetection()
                }) {
                    Label("Simulate 'placeholder' Notification", systemImage: "bell.badge")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.orange)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                }
                
                Button(action: {
                    if timerManager.isRunning {
                        timerManager.stopTimer()
                    } else {
                        timerManager.startTimer()
                    }
                }) {
                    Text(timerManager.isRunning ? "Stop Timer" : "Start Manual Timer")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(timerManager.isRunning ? Color.red : Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                }
            }
            .padding(.horizontal)
        }
        .padding()
        .onAppear {
            monitor.onPlaceholderDetected = {
                timerManager.startTimer()
            }
        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
